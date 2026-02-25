import { ReactNode, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#0B1220] overflow-x-hidden">
      <div className="flex w-full min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
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

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-[#0B1220]">
          <Topbar onOpenSidebar={() => setOpen(true)} />
          <div className="p-4 md:p-8 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}