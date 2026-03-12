// web/app/components/Sidebar.tsx
import { Link, usePathname, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  badge?: number;
};

const MAIN_NAV: NavItem[] = [
  {
    label:      "Assign Shifts",
    href:       "/shifts",
    icon:       "calendar-outline",
    activeIcon: "calendar",
  },
  {
    label:      "Tasks & Waste",
    href:       "/tasks",
    icon:       "checkmark-circle-outline",
    activeIcon: "checkmark-circle",
  },
  {
    label:      "Swap Requests",
    href:       "/swap-requests",
    icon:       "swap-horizontal-outline",
    activeIcon: "swap-horizontal",
  },
  {
    label:      "Communication",
    href:       "/communication",
    icon:       "megaphone-outline",
    activeIcon: "megaphone",
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    label:      "User Management",
    href:       "/user-management",
    icon:       "people-outline",
    activeIcon: "people",
  },
  {
    label:      "Settings",
    href:       "/settings",
    icon:       "settings-outline",
    activeIcon: "settings",
  },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(public)/login");
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        onPress={onNavigate}
        className={[
          "flex items-center gap-3 px-3 py-3 text-[14px] font-medium transition-all relative",
          active
            ? "bg-auth-blue/15 text-auth-white border border-auth-blue/25"
            : "text-auth-textSecondary hover:text-auth-white hover:bg-white/5 border border-transparent",
        ].join(" ")}
      >
        {/* Active left strip */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-auth-blue rounded-r-full" />
        )}

        {/* Icon box */}
        <span
          className={[
            "w-[30px] h-[30px] flex items-center justify-center flex-shrink-0 rounded-[7px]",
            active ? "bg-auth-blue/20" : "bg-white/[0.06]",
          ].join(" ")}
        >
          <Ionicons
            name={active ? item.activeIcon : item.icon}
            size={16}
            color={active ? "#3B6FFF" : "#9CA3AF"}
          />
        </span>

        <span className="flex-1 text-[14px] leading-none">{item.label}</span>

        {/* Badge */}
        {item.badge !== undefined && item.badge > 0 && (
          <span className="bg-auth-blue text-white text-[11px] font-bold rounded-full px-2 py-[2px] min-w-[22px] text-center leading-none">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="h-screen w-[240px] flex flex-col bg-auth-bg border-r border-auth-border px-3 py-6 overflow-hidden flex-shrink-0">

      {/* ── Logo ── */}
      <div className="px-3 mb-10">
        <span className="text-[19px] font-black tracking-[0.22em] text-auth-white">
          V<span className="text-auth-blue">.</span>
          A<span className="text-auth-pending">.</span>
          K
        </span>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex flex-col gap-0.5">
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-auth-textMuted px-3 mb-2">
          Main
        </p>
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* ── Admin nav ── */}
      <nav className="flex flex-col gap-0.5 mt-6">
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-auth-textMuted px-3 mb-2">
          Admin
        </p>
        {ADMIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* ── Logout ── */}
      <button
        onClick={handleLogout}
        className="mt-auto mx-1 flex items-center gap-3 px-3 py-3 text-[14px] font-medium text-auth-textSecondary border border-auth-border rounded-[8px] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
      >
        <span className="w-[30px] h-[30px] flex items-center justify-center bg-white/[0.06] rounded-[7px] flex-shrink-0">
          <Ionicons name="log-out-outline" size={16} color="currentColor" />
        </span>
        Sign out
      </button>
    </aside>
  );
}