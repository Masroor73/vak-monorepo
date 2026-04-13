// apps/mobile/hooks/useDrawerBadges.ts
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useDrawerBadges() {
  const { user, loading } = useAuth();
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [newRecognitionCount, setNewRecognitionCount] = useState(0);

  const lastSeenTasksAt = useRef<string | null>(null);
  const lastSeenRecognitionAt = useRef<string | null>(null);
  const [timestampsLoaded, setTimestampsLoaded] = useState(false);

  const tasksKey = user ? `lastSeenTasksAt_${user.id}` : null;
  const recognitionKey = user ? `lastSeenRecognitionAt_${user.id}` : null;

  useEffect(() => {
    if (!user || !tasksKey || !recognitionKey) return;

    const loadTimestamps = async () => {
      setTimestampsLoaded(false);
      try {
        const savedTasks = await AsyncStorage.getItem(tasksKey);
        const savedRecognition = await AsyncStorage.getItem(recognitionKey);

        // if no saved timestamp, use a very old date so ALL items show as new
        lastSeenTasksAt.current = savedTasks ?? "2000-01-01T00:00:00.000Z";
        lastSeenRecognitionAt.current = savedRecognition ?? "2000-01-01T00:00:00.000Z";
      } catch (e) {
        lastSeenTasksAt.current = "2000-01-01T00:00:00.000Z";
        lastSeenRecognitionAt.current = "2000-01-01T00:00:00.000Z";
      } finally {
        setTimestampsLoaded(true);
      }
    };

    loadTimestamps();
  }, [user?.id]);

  const fetchTaskCount = async () => {
    if (!user || !lastSeenTasksAt.current) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("id")
      .eq("assigned_to", user.id)
      .gt("created_at", lastSeenTasksAt.current);
    if (!error && data) setPendingTasksCount(data.length);
  };

  const fetchRecognitionCount = async () => {
    if (!user || !lastSeenRecognitionAt.current) return;
    const { data, error } = await supabase
      .from("recognitions")
      .select("id")
      .eq("receiver_id", user.id)
      .gt("created_at", lastSeenRecognitionAt.current);
    if (!error && data) setNewRecognitionCount(data.length);
  };

  const clearTasksBadge = async () => {
    if (!tasksKey) return;
    const now = new Date().toISOString();
    lastSeenTasksAt.current = now;
    setPendingTasksCount(0);
    await AsyncStorage.setItem(tasksKey, now);
  };

  const clearRecognitionBadge = async () => {
    if (!recognitionKey) return;
    const now = new Date().toISOString();
    lastSeenRecognitionAt.current = now;
    setNewRecognitionCount(0);
    await AsyncStorage.setItem(recognitionKey, now);
  };

  useEffect(() => {
    if (loading || !user || !timestampsLoaded) return;

    fetchTaskCount();
    fetchRecognitionCount();

    const pollInterval = setInterval(() => {
      fetchTaskCount();
      fetchRecognitionCount();
    }, 15000);

    const taskChannel = supabase
      .channel("drawer-tasks")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "tasks",
        filter: `assigned_to=eq.${user.id}`,
      }, () => fetchTaskCount())
      .subscribe();

    const recognitionChannel = supabase
      .channel("drawer-recognitions")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "recognitions",
        filter: `receiver_id=eq.${user.id}`,
      }, () => fetchRecognitionCount())
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(recognitionChannel);
    };
  }, [user?.id, loading, timestampsLoaded]);

  return {
    pendingTasksCount,
    newRecognitionCount,
    clearTasksBadge,
    clearRecognitionBadge,
  };
}