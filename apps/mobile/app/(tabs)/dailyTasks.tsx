import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Pressable} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WhiteArrow from "../../assets/WhiteArrow.svg";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

type Priority       = 'HIGH' | 'MEDIUM' | 'LOW';
type Status         = 'Pending' | 'In Progress' | 'Done';
type PriorityFilter = 'ALL' | 'DONE' | Priority;

interface Task {
  id:          string;
  title:       string;
  description: string | null;
  due_date:    string | null;
  priority:    Priority;
  status:      Status;
  assigned_by: string;
  updated_at:  string | null;
}

const STATUS_PROGRESS: Record<Status, number> = {
  'Pending':     0,
  'In Progress': 50,
  'Done':        100,
};

const STATUS_META: Record<Status, { label: string; bgClass: string; textClass: string; iconName: string }> = {
  'Pending':     { label: 'Pending',     bgClass: 'bg-slate-100',          textClass: 'text-slate-500',        iconName: 'time-outline'      },
  'In Progress': { label: 'In Progress', bgClass: 'bg-damascus-secondary/10', textClass: 'text-damascus-secondary', iconName: 'reload-outline'    },
  'Done':        { label: 'Done',        bgClass: 'bg-brand-success/10',   textClass: 'text-brand-success',    iconName: 'checkmark-circle-outline' },
};

const PRIORITY_META: Record<Priority, { label: string; barClass: string; bgClass: string; textClass: string }> = {
  HIGH:   { label: 'HIGH',   barClass: 'bg-damascus-primary',   bgClass: 'bg-damascus-primary/10',   textClass: 'text-damascus-primary'   },
  MEDIUM: { label: 'MEDIUM', barClass: 'bg-damascus-secondary', bgClass: 'bg-damascus-secondary/10', textClass: 'text-damascus-secondary' },
  LOW:    { label: 'LOW',    barClass: 'bg-brand-success',      bgClass: 'bg-brand-success/10',      textClass: 'text-brand-success'      },
};

type ChipKey = 'ALL' | Priority | 'DONE';
interface Chip {
  key: ChipKey; label: string; type: 'all' | 'priority' | 'done'; activeBgClass: string; activeBorderClass: string;
}

const CHIPS: Chip[] = [
  { key: 'ALL',    label: 'All',    type: 'all',      activeBgClass: 'bg-brand-secondary',    activeBorderClass: 'border-brand-secondary'    },
  { key: 'HIGH',   label: 'High',   type: 'priority', activeBgClass: 'bg-damascus-primary',   activeBorderClass: 'border-damascus-primary'   },
  { key: 'MEDIUM', label: 'Medium', type: 'priority', activeBgClass: 'bg-damascus-secondary', activeBorderClass: 'border-damascus-secondary' },
  { key: 'LOW',    label: 'Low',    type: 'priority', activeBgClass: 'bg-brand-success',      activeBorderClass: 'border-brand-success'      },
  { key: 'DONE',   label: 'Done',   type: 'done',     activeBgClass: 'bg-brand-success',      activeBorderClass: 'border-brand-success'      },
];

function formatDueDate(dateStr: string | null): { text: string; overdue: boolean } {
  if (!dateStr) return { text: '', overdue: false };
  const due  = new Date(dateStr);
  const now  = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { text: `${Math.abs(diff)}d overdue`, overdue: true  };
  if (diff === 0) return { text: 'Due today',                  overdue: false };
  if (diff === 1) return { text: 'Due tomorrow',               overdue: false };
  return { text: `Due in ${diff}d`, overdue: false };
}

function formatCompletedDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EmptyState({ priorityFilter }: { priorityFilter: PriorityFilter }) {
  return (
    <View className="flex-1 items-center justify-center px-10 py-8">
      <View className="items-center justify-center mb-6 w-36 h-36">
        <View className="absolute bg-brand-primary/50 top-5 left-2.5 w-2 h-2 rounded-full" />
        <View className="absolute bg-brand-success/60 bottom-6 left-4 w-1.5 h-1.5 rounded-full" />
        <View className="w-28 rounded-2xl items-center pt-3 pb-4 px-4 bg-white shadow-md">
          <View className="w-10 h-3 rounded-full mb-3 bg-slate-200" />
          {[100, 80, 90].map((w, i) => (
            <View key={i} className="rounded-full mb-2 bg-slate-200 h-1.5" style={{ width: `${w}%` }} />
          ))}
        </View>
        <View className="absolute bottom-2 right-2 w-9 h-9 rounded-full items-center justify-center bg-brand-secondary shadow-md">
          <Ionicons name="checkmark" size={18} color="#62CCEF" />
        </View>
      </View>

      <Text className="text-[22px] font-black text-center mb-2 text-brand-secondary -tracking-tight">
        {priorityFilter !== 'ALL'
          ? `No ${priorityFilter.toLowerCase()} priority tasks`
          : "You're all caught up!"}
      </Text>
      <Text className="text-[13px] text-center leading-5 mb-6 text-slate-400">
        {priorityFilter !== 'ALL'
          ? 'Nothing matches your current filters.\nTry a different selection.'
          : 'No tasks have been assigned to you\nyet. Your manager will assign tasks\nwhen they\'re ready.'}
      </Text>
    </View>
  );
}

function TaskCard({ task, updatingId, onCycle }: { task: Task; updatingId: string | null; onCycle: (task: Task) => void }) {
  const pm         = PRIORITY_META[task.priority];
  const sm         = STATUS_META[task.status];
  const isDone     = task.status === 'Done';
  const isUpdating = updatingId === task.id;
  const progress   = STATUS_PROGRESS[task.status];
  const due        = isDone
    ? { text: `Completed ${formatCompletedDate(task.updated_at)}`, overdue: false }
    : formatDueDate(task.due_date);

  const progressBarClass = isDone ? 'bg-brand-success' : pm.barClass;

  return (
    <View
      className={`mx-4 mb-3 rounded-2xl overflow-hidden bg-white shadow-sm border ${isDone ? 'border-brand-success/20' : 'border-black/[0.04]'}`}
    >
      {/* Left priority bar */}
      <View className={`absolute left-0 top-0 bottom-0 w-[8px] ${pm.barClass} ${isDone ? 'opacity-35' : 'opacity-100'}`} />

      <View className="pl-5 pr-4 pt-4 pb-3">
        <View className="flex-1 mr-3 mb-1.5">
          <Text
            className={`font-extrabold text-[20px] ${isDone ? 'text-slate-400 line-through' : 'text-brand-secondary'}`}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text className={`text-[15px] font-medium mt-3 ${isDone ? 'text-slate-400' : ''}`} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
        </View>

        {/* Due date row */}
        {due.text !== '' && (
          <View className="flex-row items-center mt-1 mb-2.5 gap-x-0.5">
            <Ionicons name="calendar-outline" size={18} color={due.overdue ? '#D32F2F' : '#000000'} />
            <Text className={`text-[14px] font-medium ml-2 ${due.overdue ? 'text-damascus-primary' : 'text-black/80'}`}>
              {due.text}
            </Text>
          </View>
        )}

        {/* Progress bar */}
        <View className="mt-1 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[15px] font-semibold text-black">Progress</Text>
            <Text className={`text-[15px] font-bold ${isDone ? 'text-brand-success' : 'text-gray-600'}`}>
              {progress}%
            </Text>
          </View>
          <View className="h-1.5 rounded-full bg-slate-300 overflow-hidden">
            <View
              className={`h-full rounded-full ${progressBarClass}`}
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* ── Status pill button ── */}
        <TouchableOpacity
          onPress={() => onCycle(task)}
          disabled={!!updatingId}
          activeOpacity={0.7}
          className={`self-end flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-full ${sm.bgClass}`}
        >
          {isUpdating
            ? <ActivityIndicator size="small" color="#94a3b8" />
            : <Ionicons name={sm.iconName as any} size={12} color={
                task.status === 'Done' ? '#05CC66' : task.status === 'In Progress' ? '#F0A500' : '#94a3b8'
              } />
          }
          <Text className={`text-[15px] font-bold text-gray-800`}>
            {isUpdating ? 'Updating…' : sm.label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Priority label top-right */}
      <View className={`absolute top-3.5 right-4 px-2 py-0.5 rounded ${pm.bgClass}`}>
        <Text className={`text-[10px] font-black tracking-wider ${pm.textClass}`}>
          {pm.label}
        </Text>
      </View>
    </View>
  );
}

export default function MyTasksScreen() {
  const router   = useRouter();
  const { user } = useAuth();
  const insets   = useSafeAreaInsets();
  const [tasks,          setTasks]          = useState<Task[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [updatingId,     setUpdatingId]     = useState<string | null>(null);

  const fetchTasks = async (isRefresh = false) => {
    if (!user) return;
    if (!isRefresh) setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, due_date, priority, status, assigned_by, updated_at')
      .eq('assigned_to', user.id)
      .order('due_date', { ascending: true, nullsFirst: false });
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTasks();
    let channel: RealtimeChannel;
    if (user) {
      channel = supabase
        .channel('tasks-realtime')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'tasks',
          filter: `assigned_to=eq.${user.id}`,
        }, () => fetchTasks())
        .subscribe();
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]);

  const onRefresh = () => { setRefreshing(true); fetchTasks(true); };

  const cycleStatus = async (task: Task) => {
    if (updatingId) return;
    const next: Record<Status, Status> = {
      'Pending': 'In Progress', 'In Progress': 'Done', 'Done': 'Pending',
    };
    const newStatus = next[task.status];
    setUpdatingId(task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    setUpdatingId(null);
  };

  const handleChip = (chip: Chip) => {
    if (chip.type === 'all')           setPriorityFilter('ALL');
    else if (chip.type === 'done')     setPriorityFilter('DONE');
    else if (chip.type === 'priority') setPriorityFilter(chip.key as PriorityFilter);
  };

  const isChipActive = (chip: Chip) => {
    if (chip.type === 'all')      return priorityFilter === 'ALL';
    if (chip.type === 'done')     return priorityFilter === 'DONE';
    if (chip.type === 'priority') return priorityFilter === chip.key;
    return false;
  };

  const filtered  = priorityFilter === 'DONE'
    ? tasks.filter(t => t.status === 'Done')
    : tasks.filter(t => t.status !== 'Done' && (priorityFilter === 'ALL' || t.priority === priorityFilter));
  const doneCount = tasks.filter(t => t.status === 'Done').length;

  return (
    <View className="flex-1">

      {/* ── Light content area ── */}
      <View className="flex-1 bg-brand-background mt-3">

        {/* Stat tiles */}
        <View className="px-6 pt-8 pb-6 flex-row gap-x-4">
          {[
            { label: 'TOTAL',  count: tasks.length,                   borderClass: 'border-brand-secondary',    textClass: 'text-brand-secondary'    },
            { label: 'ACTIVE', count: tasks.length - doneCount, borderClass: 'border-damascus-secondary', textClass: 'text-damascus-secondary' },
            { label: 'DONE',   count: doneCount,                      borderClass: 'border-brand-success',      textClass: 'text-brand-success'      },
          ].map(s => (
            <View
              key={s.label}
              className={`flex-1 bg-white rounded-xl pt-4 pb-3 px-3 items-center shadow border-b-[2.5px] ${s.borderClass}`}
            >
              {loading
                ? <Ionicons name="ellipse" size={20} color="#e2e8f0" />
                : <Text className={`font-black text-[26px] -tracking-widest ${s.textClass}`}>{s.count}</Text>
              }
              <Text className="text-[9px] font-black tracking-widest mt-0.5 text-slate-400">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Filter chips ── */}
        <View className="pb-4 px-4">
          <View className="flex-row justify-center gap-x-2">
            {CHIPS.map(chip => {
              const active = isChipActive(chip);
              return (
                <TouchableOpacity
                  key={chip.key}
                  onPress={() => handleChip(chip)}
                  activeOpacity={0.7}
                  className={`flex-row items-center rounded-full px-5 py-2 border ${
                    active
                      ? `${chip.activeBgClass} ${chip.activeBorderClass} shadow-none`
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <Text className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slate-500'}`}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Task list ── */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#62CCEF" size="large" />
            <Text className="text-[13px] mt-3 text-slate-400">Loading tasks...</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 80, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#62CCEF" />}
          >
            {filtered.length === 0
              ? <EmptyState priorityFilter={priorityFilter} />
              : filtered.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    updatingId={updatingId}
                    onCycle={cycleStatus}
                  />
                ))
            }
          </ScrollView>
        )}
      </View>
    </View>
  );
}
