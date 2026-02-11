import { Link, usePathname, useRouter } from "expo-router";
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
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const onLogout = () => {
    try {
      // ✅ if later you add real auth, call signOut() here
      // await supabase.auth.signOut()

      setModalType("success");
      setModalOpen(true);
    } catch {
      setModalType("error");
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);

    // ✅ after dismiss, go to login
    router.replace("/login"); // change if your login route is different
    onNavigate?.(); // close drawer on mobile
  };

  return (
    <aside className="h-screen w-64 bg-black text-white flex flex-col p-5">
      <div className="text-2xl font-bold mb-10">VAK</div>

      <nav className="flex flex-col gap-2 text-sm">
        {items.map((it) => {
          const active = pathname === it.href;

          return (
            <Link
              key={it.href}
              href={it.href}
              onPress={onNavigate}
              className={`px-4 py-2 rounded-md transition
                ${
                  active
                    ? "bg-[#62CCEF] text-black font-medium"
                    : "text-white hover:bg-[#62CCEF]/20"
                }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="mt-auto bg-white text-black rounded-md px-4 py-3 text-sm"
      >
        Logout
      </button>

      <StatusModal
        open={modalOpen}
        type={modalType}
        message={
          modalType === "success"
            ? "Your operation was completed successfully."
            : "Error processing request. Something went wrong. Please try again."
        }
        onClose={closeModal}
      />
    </aside>
  );
}
