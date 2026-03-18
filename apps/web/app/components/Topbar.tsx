import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const ROUTE_LABELS: Record<string, string> = {
  "/shifts": "Shifts",
  "/tasks": "Tasks & Waste",
  "/swap-requests": "Swap Requests",
  "/communication": "Communication",
  "/user-management": "User Management",
  "/settings": "Settings",
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_id: string;
};

export default function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [openMenu, setOpenMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentLabel = ROUTE_LABELS[pathname] ?? "Dashboard";
  const isHome = pathname === "/";
  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "M";
  const displayName = user?.email?.split("@")[0] ?? "Manager";

  useEffect(() => {
    if (!user) return;

    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });
      
      if (data) setNotifications(data);
    };

    fetchNotifications();

    // 2. Realtime Subscription for new signups
    const channel = supabase
      .channel("topbar-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: any) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleApproveUser = async (notificationId: string, profileId: string) => {
    // 1. Approve the user
    await supabase.from("profiles").update({ is_approved: true }).eq("id", profileId);
    
    // 2. Mark notification as read
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
    
    // 3. Remove from UI
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  return (
    <header className="h-16 flex items-center justify-between px-5 md:px-7 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <Ionicons name="menu-outline" size={20} color="#5a6170" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-gray-400 font-medium">Dashboard</span>
          {!isHome && (
            <>
              <Ionicons name="chevron-forward" size={12} color="#c8ccd8" />
              <span className="text-gray-900 font-semibold">{currentLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="hidden sm:flex flex-1 justify-center px-6 max-w-2xl mx-auto">
        <div className="w-full h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center px-4 gap-3 focus-within:border-blue-500 focus-within:bg-white transition">
          <Ionicons name="search-outline" size={16} color="#8b92a5" />
          <input
            type="text"
            placeholder="Search employees, shifts, tasks..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 relative">
        
        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className="relative h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition"
            aria-label="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color="#5a6170" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition">
                      <p className="text-xs font-bold text-blue-600 mb-1">{notif.title}</p>
                      <p className="text-sm text-gray-700 mb-3">{notif.message}</p>
                      
                      {/* ACTION: Render Approve button ONLY for ACCOUNT_APPROVAL type */}
                      {notif.type === 'ACCOUNT_APPROVAL' && (
                        <button 
                          onClick={() => handleApproveUser(notif.id, notif.related_entity_id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-md transition"
                        >
                          Approve User
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* User Dropdown */}
        <div ref={menuRef} className="relative">
          <div
            onClick={() => setOpenMenu(!openMenu)}
            className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-lg pl-2 pr-4 py-1 cursor-pointer hover:bg-gray-200 transition"
          >
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {avatarLetter}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold text-gray-900 capitalize">{displayName}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Admin</div>
            </div>
            <Ionicons name="chevron-down" size={12} color="#8b92a5" />
          </div>

          {openMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50">
              <div className="px-3 pb-3 pt-1 border-b border-gray-100 mb-2">
                <div className="text-sm font-bold text-gray-900 capitalize">{displayName}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <button
                onClick={() => router.push("/settings")}
                className="w-full text-left text-sm font-medium text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                Settings
              </button>
              <button
                onClick={signOut}
                className="w-full text-left text-sm font-medium text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition mt-1"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}