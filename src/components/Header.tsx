export default function Header() {
  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-6">
      <div className="font-bold text-xl tracking-tight">RoomCraft AI</div>
      <div className="flex items-center gap-4">
        {/* Placeholder for controls */}
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors">
          ✨ AI Auto-Arrange
        </button>
      </div>
    </header>
  );
}
