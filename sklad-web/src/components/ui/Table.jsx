export default function Table({ columns, data, loading, emptyText = 'Malumot topilmadi' }) {
  if (loading) return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
      <p className="text-gray-400 text-sm">Yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ' + (col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">{emptyText}</td>
              </tr>
            ) : data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={'px-4 py-3 ' + (col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '')}>
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
