import { LayoutGrid, List } from "lucide-react";

// Переключатель вида «плитка / список» (правый верхний угол страниц с товарами)
export default function ViewToggle({ view, onChange }) {
  const opts = [
    ["grid", LayoutGrid, "Плитка"],
    ["list", List, "Список"],
  ];
  return (
    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
      {opts.map(([v, Icon, title]) => (
        <button key={v} type="button" title={title} onClick={() => onChange(v)}
          className={"px-2.5 py-2 transition " + (view === v
            ? "bg-indigo-600 text-white"
            : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700")}>
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
