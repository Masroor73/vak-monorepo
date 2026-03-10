import { Link, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "grid-outline" },
  { label: "Shifts", href: "/shifts", icon: "calendar-outline" },
  { label: "Tasks & Waste", href: "/tasks", icon: "checkmark-circle-outline" },
  { label: "Swap Requests", href: "/swap-requests", icon: "swap-horizontal-outline" },
  { label: "Communication", href: "/communication", icon: "chatbubble-outline" },
  { label: "User Management", href: "/user-management", icon: "people-outline" },
  { label: "Settings", href: "/settings", icon: "settings-outline" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-white border-r flex flex-col p-4">

      <h1 className="text-2xl font-bold mb-8">Manager</h1>

      <nav className="flex flex-col gap-3">

        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg text-lg
              ${active ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <Ionicons name={item.icon} size={22} />
              {item.label}
            </Link>
          );
        })}

      </nav>

    </div>
  );
}