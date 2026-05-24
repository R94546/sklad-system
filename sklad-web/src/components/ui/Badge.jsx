export default function Badge({ children, variant = "gray" }) {
  const variants = {
    gray: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/30",
    red: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30",
    yellow: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-500/30",
    purple: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400",
  };
  return <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " + variants[variant]}>{children}</span>;
}
