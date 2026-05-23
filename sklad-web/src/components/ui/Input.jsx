export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input className={"w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 " + (error ? "border-red-400 focus:ring-red-400" : "border-slate-300 dark:border-slate-600") + " " + className} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
