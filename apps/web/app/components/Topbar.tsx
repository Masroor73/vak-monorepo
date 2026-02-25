export default function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  return (
    <header className="h-16 bg-[#0B1220] border-b border-white/10 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          ≡
        </button>

        <div className="text-white font-semibold tracking-wide hidden sm:block">
          Manager Dashboard
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden sm:flex">
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-72 md:w-80 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/50 outline-none"
          />
        </div>

        <button
          className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white"
          aria-label="Notifications"
        >
          🔔
        </button>

        <div className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[#62CCEF] flex items-center justify-center text-[#0B1220] font-bold">
            M
          </div>
          <div className="leading-tight">
            <div className="text-white text-sm font-semibold">Manager</div>
            <div className="text-white/60 text-[10px]">Web</div>
          </div>
        </div>
      </div>
    </header>
  );
}