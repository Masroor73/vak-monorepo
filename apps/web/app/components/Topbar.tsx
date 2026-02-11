export default function Topbar() {
  return (
    <header className="h-16 bg-gray-100 flex items-center justify-between px-6">
      <input
        type="text"
        placeholder="Search..."
        className="px-4 py-2 rounded-md w-80 border"
      />

      <div className="flex items-center gap-4">
        <span className="text-xl">🔔</span>
        <div className="bg-blue-500 text-white px-4 py-1 rounded-full">
          Henry_K
        </div>
      </div>
    </header>
  );
}
