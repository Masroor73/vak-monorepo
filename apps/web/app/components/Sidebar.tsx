import { Link, usePathname } from "expo-router";
import { useState } from "react";
import StatusModal from "./StatusModal";

const items = [
  { label: "Dashboard", href: "/" },
  { label: "Team", href: "/team" },
  { label: "Operations", href: "/operations" },
  { label: "Analyze Reports", href: "/analyze-reports" },
  { label: "Communication", href: "/communication" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const [modalOpen, setModalOpen] = useState(false);

  const handleLogout = () => {
    setModalOpen(true);
  };

  return (
    <aside className="h-screen w-64 text-white flex flex-col p-5 bg-black border-r border-white/20">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-10 w-10 rounded-xl bg-[#62CCEF] flex items-center justify-center text-black font-bold">
          🏰
        </div>
        <div>
          <div className="text-lg font-semibold">Castle</div>
          <div className="text-xs text-white/60">Manager</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 text-sm">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onPress={onNavigate}
              className={`px-4 py-3 rounded-xl transition border ${
                active
                  ? "bg-white/15 border-[#62CCEF]/50 text-[#62CCEF] font-semibold"
                  : "border-transparent text-white/80 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-auto bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm hover:bg-white/20 transition"
      >
        Logout
      </button>

      <StatusModal
        open={modalOpen}
        type="success"
        title="Logged out"
        message="Logout UI clicked (auth not implemented yet)."
        onClose={() => setModalOpen(false)}
      />
    </aside>
  );
}