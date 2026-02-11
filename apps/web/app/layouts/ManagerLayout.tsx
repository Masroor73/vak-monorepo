import { ReactNode, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // ✅ auto-close drawer when screen becomes desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-black overflow-x-hidden">
      {/* MOBILE TOP BAR ONLY */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-black text-white">
        <div className="text-xl font-bold">VAK</div>
        <button
          className="px-3 py-2 rounded bg-white text-black text-sm"
          onClick={() => setOpen(true)}
        >
          Menu
        </button>
      </div>

      <div className="flex w-full min-h-screen">
        {/* DESKTOP SIDEBAR ONLY */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* MOBILE DRAWER ONLY */}
        {open && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-black">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        {/* MAIN AREA */}
        <main className="flex-1 min-w-0 bg-[#D9D9D9]">
          {/* DESKTOP TOPBAR ONLY */}
          <div className="hidden md:block">
            <Topbar />
          </div>

          <div className="p-4 md:p-8 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
