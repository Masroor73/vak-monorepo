<<<<<<< HEAD
import { usePathname } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const ROUTE_LABELS: Record<string, string> = {
  "/shifts": "Shifts",
  "/tasks": "Tasks & Waste",
  "/swap-requests": "Swap Requests",
  "/communication": "Communication",
  "/user-management": "User Management",
  "/settings": "Settings",
};

=======
//web/app/components/Topbar.tsx
>>>>>>> origin/main
export default function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const currentLabel = ROUTE_LABELS[pathname] ?? "Dashboard";
  const isHome = pathname === "/";
  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "M";
  const displayName = user?.email?.split("@")[0] ?? "Manager";

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
              <span className="text-gray-900 font-semibold">
                {currentLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center px-6 max-w-2xl mx-auto">
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
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <button
          className="relative h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition"
          aria-label="Notifications"
        >
          <Ionicons name="notifications-outline" size={18} color="#5a6170" />

          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* User */}
        <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-lg pl-2 pr-4 py-1 cursor-pointer hover:bg-gray-200 transition">

          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {avatarLetter}
          </div>

          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold text-gray-900 capitalize">
              {displayName}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              Admin
            </div>
          </div>

          <Ionicons name="chevron-down" size={12} color="#8b92a5" />
        </div>

      </div>
    </header>
  );
}