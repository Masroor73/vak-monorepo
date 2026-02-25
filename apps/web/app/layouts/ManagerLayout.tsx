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
    <div className="min-h-screen w-screen bg-black overflow-x-hidden">
      <div className="flex w-full min-h-screen">
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {open && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-black border-r border-white/20">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 md:p-8">
          <Topbar onOpenSidebar={() => setOpen(true)} />
          <div className="mt-6 w-full rounded-[28px] bg-[#D9D9D9] shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8">{children}</div>
        </div>
        </main>
      </div>
    </div>
  );
}