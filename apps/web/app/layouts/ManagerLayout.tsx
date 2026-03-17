import { ReactNode, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../../context/AuthContext";

export default function ManagerLayout({ children }: { children: ReactNode }) {

  const { profile } = useAuth();
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
    <div className="h-screen flex bg-[#f5f6fa] overflow-hidden">

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">

          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Sidebar panel */}
          <div className="relative w-64 bg-white h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>

        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Top Navigation */}
        <Topbar onOpenSidebar={() => setOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
}