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
  { label: "User Management", href: "/user-management" },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  const handleLogout = () => {
    setModalOpen(true);
  };

  return (
    <aside className="h-screen w-64 text-white flex flex-col px-5 py-6 bg-black border-r border-white/20">
      <div className="flex items-center justify-center pt-4 pb-10">
        <img src="/logo.png" alt="Logo" className="h-32 w-32 object-contain" />
      </div>

      <nav className="flex flex-col gap-3 text-base">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onPress={onNavigate}
              className={[
                "w-full px-5 py-4 rounded-full transition flex items-center gap-4",
                active
                  ? "bg-white text-black font-semibold"
                  : "text-[#62CCEF] hover:bg-white/5",
              ].join(" ")}
            >

              <span className="h-6 w-6 flex items-center justify-center shrink-0">
              </span>

              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto bg-white text-black rounded-full px-5 py-3 text-sm font-medium hover:bg-white/90 transition"
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