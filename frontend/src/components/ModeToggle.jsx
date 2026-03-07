// frontend/src/components/ModeToggle.jsx

export default function ModeToggle({ mode, onToggle }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1">
      <button
        onClick={() => onToggle("investor")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          mode === "investor"
            ? "bg-teal-500 text-white shadow"
            : "text-slate-400 hover:text-white"
        }`}
      >
        👤 Normal Investor
      </button>
      <button
        onClick={() => onToggle("startup")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          mode === "startup"
            ? "bg-amber-500 text-white shadow"
            : "text-slate-400 hover:text-white"
        }`}
      >
        🏢 Startup / Business
      </button>
    </div>
  );
}
