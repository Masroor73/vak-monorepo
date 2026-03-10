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

        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden">
            <div className="w-64 bg-white h-full shadow-lg">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">

          <Topbar onOpenSidebar={() => setOpen(true)} />

          <main className="flex-1 p-6">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}