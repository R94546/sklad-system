const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
c = c.replace(
  'import { Plus, X, ArrowRight } from "lucide-react";',
  'import { Plus, X, ArrowRight, Trash2 } from "lucide-react";\nimport useAuthStore from "../store/authStore";'
);
c = c.replace(
  "function SaleDetailModal({ sale, onClose })",
  "function SaleDetailModal({ sale, onClose, onDelete, isAdmin })"
);
c = c.replace(
  '<div className="overflow-y-auto flex-1 p-5 space-y-4">',
  '<div className="overflow-y-auto flex-1 p-5 space-y-4">\n          {isAdmin && (\n            <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">\n              <button onClick={() => onDelete(sale.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-medium"><Trash2 size={14} /> Ochirish</button>\n            </div>\n          )}'
);
c = c.replace(
  "const [detailLoading, setDetailLoading] = useState(false);",
  'const [detailLoading, setDetailLoading] = useState(false);\n  const { user: authUser } = useAuthStore();\n  const isAdmin = authUser?.role === "ADMIN";'
);
c = c.replace(
  '<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />',
  '<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin} onDelete={async (id) => { if (!confirm("Ochirmoqchimisiz?")) return; try { await api.delete("/sales/" + id); toast.success("Ochirildi"); setSelectedSale(null); load(); } catch { toast.error("Xatolik"); } }} />'
);
fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
