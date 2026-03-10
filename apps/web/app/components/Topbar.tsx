import { usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
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

  const title = ROUTE_LABELS[pathname] ?? "Dashboard";

  return (
    <div className="w-full h-16 bg-white border-b flex items-center justify-between px-6">

      <div className="flex items-center gap-3">

        <button
          onClick={onOpenSidebar}
          className="md:hidden"
        >
          <Ionicons name="menu" size={26} />
        </button>

        <h1 className="text-2xl font-semibold">
          {title}
        </h1>

      </div>

      <div className="flex items-center gap-4">
        <Ionicons name="notifications-outline" size={22} />
        <Ionicons name="person-circle-outline" size={28} />
      </div>

    </div>
  );
}