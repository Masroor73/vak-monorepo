// web/app/layouts/ManagerLayout.tsx
import { ReactNode, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#f5f6fa] overflow-x-hidden">
      <div className="flex w-full min-h-screen">

        {/* ── Desktop sidebar ── */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* ── Mobile sidebar overlay ── */}
        {open && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        {/* ── Main area ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <Topbar onOpenSidebar={() => setOpen(true)} />
          <main className="flex-1 p-5 md:p-7">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}