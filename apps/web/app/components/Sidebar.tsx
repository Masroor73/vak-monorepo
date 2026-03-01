import { Link, usePathname } from "expo-router";
import { useState } from "react";
import StatusModal from "./StatusModal";

const items = [
  { label: "Dashboard", href: "/" },
  { label: "Team", href: "/team" },
  { label: "Employee Page", href: "/employee-list" },
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
      <div className="flex items-center justify-center pt-6 pb-14">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-28 w-28 object-contain"
        />
      </div>

      <nav className="flex flex-col gap-2 text-sm">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onPress={onNavigate}
              className={`w-fit px-4 py-3 rounded-full transition flex items-center gap-3
                ${
                  active
                    ? "bg-white text-black font-semibold"
                    : "text-[#62CCEF] hover:bg-white/5"
              }`}
            >
              {item.label}
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