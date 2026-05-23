export default function Table({ columns, data, loading, emptyText = "Malumot topilmadi" }) {
  if (loading) return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 text-center">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
      <p className="text-slate-400 text-sm">Yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={"px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider " + (col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left")}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">{emptyText}</td></tr>
            ) : data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                {columns.map((col, j) => (
                  <td key={j} className={"px-4 py-3 text-slate-700 dark:text-slate-300 " + (col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "")}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
