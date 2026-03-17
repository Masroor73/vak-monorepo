import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
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

export default function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {

  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [openMenu,setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLabel = ROUTE_LABELS[pathname] ?? "Dashboard";
  const isHome = pathname === "/";
  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "M";
  const displayName = user?.email?.split("@")[0] ?? "Manager";

  useEffect(() => {
    const handleClick = (e: any) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

      {/* Right section */}
      <div className="flex items-center gap-3 relative" ref={menuRef}>

        <div
          onClick={() => setOpenMenu(!openMenu)}
          className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-lg pl-2 pr-4 py-1 cursor-pointer hover:bg-gray-200 transition"
        >

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

        {openMenu && (
          <div className="absolute right-0 top-12 w-56 bg-white border rounded-lg shadow-lg p-3 space-y-2 z-50">

            <div className="px-2 pb-2 border-b">
              <div className="text-sm font-semibold text-gray-900 capitalize">
                {displayName}
              </div>
              <div className="text-xs text-gray-500">
                {user?.email}
              </div>
            </div>

            <button
              onClick={() => router.push("/settings")}
              className="w-full text-left text-sm px-2 py-2 rounded hover:bg-gray-100"
            >
              Settings
            </button>

            <button
              onClick={signOut}
              className="w-full text-left text-sm px-2 py-2 rounded hover:bg-gray-100 text-red-500"
            >
              Sign Out
            </button>

          </div>
        )}

      </div>

    </header>
  );
}