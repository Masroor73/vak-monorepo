import { useEffect, useState, useMemo } from "react";
import ManagerLayout from "./layouts/ManagerLayout";
import { supabase } from "../lib/supabase";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// --- Types ---
type Profile = { id: string; full_name: string };
type Task = {
  id: string; title: string; description: string;
  assigned_to: string; due_date: string; priority: "HIGH" | "MEDIUM" | "LOW"; status: string;
};
type WasteLog = {
  id: string; reporter_id: string; photo_url: string; item_name: string; estimated_cost: number;
  created_at: string; ai_description?: string; ai_likely_cause?: string; ai_prevention_tips?: string;
  ai_score?: number; is_analyzed: boolean;
};

export default function TasksAndWaste() {
  useAuthGuard();
  const { user } = useAuth();

  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterEmp, setFilterEmp] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedWaste, setSelectedWaste] = useState<WasteLog | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Assign Task Form State
  const [newTask, setNewTask] = useState({ title: "", description: "", assigned_to: "", due_date: "", priority: "MEDIUM" });

  // --- Data Fetching & Realtime ---
  useEffect(() => {
    fetchData();

    // Realtime Subscriptions for both tables
    const tasksChannel = supabase.channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchData)
      .subscribe();

    const wasteChannel = supabase.channel("waste-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "waste_logs" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(wasteChannel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    const [tasksRes, wasteRes, profilesRes] = await Promise.all([
      supabase.from("tasks").select("*").order("due_date", { ascending: true }),
      supabase.from("waste_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name")
    ]);

    if (profilesRes.data) {
      const pMap: Record<string, string> = {};
      profilesRes.data.forEach((p) => { pMap[p.id] = p.full_name || "Unknown User"; });
      setProfiles(pMap);
    }
    if (tasksRes.data) setTasks(tasksRes.data);
    if (wasteRes.data) setWasteLogs(wasteRes.data);
    setLoading(false);
  }

  // --- Edge Function Trigger ---
  const handleRunAnalysis = async (waste: WasteLog) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-waste", {
        body: { waste_id: waste.id, photo_url: waste.photo_url, item_name: waste.item_name }
      });
      
      if (error) throw error;
      
      // Update local state immediately for snappy UX
      setSelectedWaste({ ...waste, ...data.data, is_analyzed: true });
      fetchData(); // Refresh list behind modal
    } catch (err) {
      console.error(err);
      alert("AI Analysis failed. Check Edge Function logs.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAssignTask = async () => {
    if (!newTask.title || !newTask.assigned_to || !newTask.due_date) return alert("Fill required fields");
    
    await supabase.from("tasks").insert({
      ...newTask,
      assigned_by: user?.id,
      status: "Pending"
    });
    
    setIsAssignModalOpen(false);
    setNewTask({ title: "", description: "", assigned_to: "", due_date: "", priority: "MEDIUM" });
  };

  // --- Filtering & Stats ---
  const filteredTasks = tasks.filter(t => {
    if (filterEmp !== "ALL" && t.assigned_to !== filterEmp) return false;
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    return true;
  });

  const totalWasteCost = wasteLogs.reduce((sum, log) => sum + Number(log.estimated_cost || 0), 0);

  // --- Helpers ---
  const getPriorityColor = (priority: string) => {
    if (priority === "HIGH") return "bg-red-50 border-red-500 text-red-700";
    if (priority === "MEDIUM") return "bg-yellow-50 border-yellow-500 text-yellow-700";
    return "bg-green-50 border-green-500 text-green-700";
  };

  return (
    <ManagerLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks & Waste Monitor</h1>
            <p className="text-gray-500 mt-1 font-medium">
              {tasks.length} active tasks · {wasteLogs.length} waste reports this week
            </p>
          </div>
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition"
          >
            + Assign Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 font-medium" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
            <option value="ALL">All Employees</option>
            {Object.entries(profiles).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 font-medium" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
          <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 font-medium" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: ACTIVE TASKS */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider">Active Tasks</h2>
            {loading ? <p className="text-gray-400">Loading tasks...</p> : filteredTasks.map(task => {
              const pStyle = getPriorityColor(task.priority);
              return (
                <div key={task.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-4 ${pStyle}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{task.title}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-1 rounded bg-white/50 uppercase">{task.priority}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                    <span>Assignee: {profiles[task.assigned_to]} · Due: {new Date(task.due_date).toLocaleDateString('en-US', {month: 'short', day:'numeric'})}</span>
                    <span className={`px-2 py-1 rounded-md ${task.status === 'Done' ? 'bg-green-100 text-green-800' : task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}>
                      {task.status} {task.status === 'Done' && '✓'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* RIGHT: WASTE MONITOR */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider">Waste Monitor — This Week</h2>
            
            {/* Stats Box */}
            <div className="bg-gray-900 rounded-xl p-5 flex justify-between items-center text-white shadow-md">
              <div>
                <p className="text-gray-400 font-medium text-sm">Total Reports</p>
                <p className="text-2xl font-bold">{wasteLogs.length}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 font-medium text-sm">Estimated Cost</p>
                <p className="text-2xl font-bold text-red-400">${totalWasteCost.toFixed(2)}</p>
              </div>
            </div>

            {/* Waste List */}
            {wasteLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex justify-between items-center hover:border-blue-300 transition cursor-pointer" onClick={() => setSelectedWaste(log)}>
                <div className="flex items-center gap-4">
                  <img src={log.photo_url} alt="Waste" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                  <div>
                    <h3 className="font-bold text-gray-900">{log.item_name}</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {profiles[log.reporter_id]} · <span className="text-red-500">${log.estimated_cost}</span> · {new Date(log.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedWaste(log); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${log.is_analyzed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                >
                  {log.is_analyzed ? "View Report" : "✦ AI Analyse"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Assign Task Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">Assign Task</h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Task Title" className="w-full border rounded-lg p-3 text-sm font-medium" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <textarea placeholder="Description (Optional)" className="w-full border rounded-lg p-3 text-sm font-medium" rows={3} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              <select className="w-full border rounded-lg p-3 text-sm font-medium" value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                <option value="">Select Employee...</option>
                {Object.entries(profiles).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
              <input type="date" className="w-full border rounded-lg p-3 text-sm font-medium" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
              
              <div className="flex gap-2">
                {["HIGH", "MEDIUM", "LOW"].map(p => (
                  <button key={p} onClick={() => setNewTask({...newTask, priority: p as any})} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${newTask.priority === p ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
              <button onClick={handleAssignTask} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700">Assign Task →</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Waste Report Detail Modal (3 States) */}
      {selectedWaste && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Waste Report Detail</h2>
                <p className="text-xs text-gray-500 font-medium">Reported by {profiles[selectedWaste.reporter_id]} · {new Date(selectedWaste.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedWaste(null)} className="text-gray-400 hover:text-black bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            {/* Image Viewer */}
            <div className="bg-gray-900 h-48 relative">
              <img src={selectedWaste.photo_url} alt="Waste" className="w-full h-full object-cover opacity-90" />
              <span className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md uppercase tracking-widest">Waste Photo</span>
            </div>

            {/* Details Row */}
            <div className="p-5 flex justify-between items-center bg-gray-50 border-b">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Item</p>
                <p className="font-bold text-gray-900 text-lg">{selectedWaste.item_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Est. Cost</p>
                <p className="font-bold text-red-600 text-lg">${selectedWaste.estimated_cost}</p>
              </div>
            </div>

            {/* AI Banner Area (Handles State 1, 2, and 3) */}
            <div className="p-5">
              
              {/* STATE 1: Not Analyzed */}
              {!selectedWaste.is_analyzed && !isAnalyzing && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-blue-900 flex items-center gap-1">✦ AI Waste Analysis</h3>
                    <p className="text-xs text-blue-700 mt-1 max-w-[200px]">Run analysis to get cause, quantity estimate and prevention tips.</p>
                  </div>
                  <button onClick={() => handleRunAnalysis(selectedWaste)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition">
                    Run Analysis ✦
                  </button>
                </div>
              )}

              {/* STATE 2: Analyzing (Loading) */}
              {isAnalyzing && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center animate-pulse">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <h3 className="font-bold text-gray-900">Analysing waste photo...</h3>
                  <div className="w-3/4 h-2 bg-gray-200 rounded-full mx-auto mt-3"></div>
                  <div className="w-1/2 h-2 bg-gray-200 rounded-full mx-auto mt-2"></div>
                </div>
              )}

              {/* STATE 3: Complete */}
              {selectedWaste.is_analyzed && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-1">✦ AI WASTE ANALYSIS</h3>
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded">COMPLETE</span>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Ionicons name="search" size={12}/> What was wasted</p>
                    <p className="text-sm text-gray-800 font-medium">{selectedWaste.ai_description}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Ionicons name="warning" size={12}/> Likely Cause</p>
                    <p className="text-sm text-gray-800 font-medium">{selectedWaste.ai_likely_cause}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Ionicons name="stats-chart" size={12}/> Preventability Score</p>
                      <span className="font-bold text-green-600">{selectedWaste.ai_score}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${(selectedWaste.ai_score || 0) * 10}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Ionicons name="bulb" size={12}/> Recommendation</p>
                    <p className="text-sm text-gray-800 font-medium bg-blue-50 p-3 rounded-lg border border-blue-100">{selectedWaste.ai_prevention_tips}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedWaste(null)} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}

    </ManagerLayout>
  );
}