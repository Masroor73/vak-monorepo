// apps/mobile/hooks/useUnreadNotifications.ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useUnreadNotifications() {
  const { user, loading } = useAuth(); 
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .or("is_read.eq.false,is_read.is.null");

    if (!error && data) {
      setUnreadCount(data.length);
    }
  };

  useEffect(() => {
    if (loading || !user) return; 

    fetchCount();

    const channel = supabase
      .channel("unread-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loading]); 
  return unreadCount;
}