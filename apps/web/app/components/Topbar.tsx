export default function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  return (
    <header className="h-20 flex items-center justify-between px-5 md:px-8">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden h-11 w-11 rounded-2xl bg-white border border-black/10 shadow-sm"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <span className="text-lg">≡</span>
        </button>
      </div>

      <div className="flex-1 flex justify-center px-4">
        <div className="w-full max-w-xl">
          <div className="h-12 w-full bg-white rounded-full border border-black/10 shadow-[0_6px_18px_rgba(0,0,0,0.10)] flex items-center px-5">
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-black/40"
            />
            <span className="text-black/50">🔎</span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className="h-12 px-3 rounded-full bg-[#62CCEF] flex items-center gap-2 shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
          <button
            className="h-9 w-9 rounded-full bg-white/25 flex items-center justify-center"
            aria-label="Notifications"
            title="Notifications"
          >
            🔔
          </button>

          <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center font-bold text-[#0B1220]">
            M
          </div>

          <div className="h-9 px-4 rounded-full bg-white flex items-center">
            <span className="text-[#0B1220] text-sm font-semibold">Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}