const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");

c = c.replace(
  'import { Plus, X, ArrowRight, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";',
  'import { Plus, X, ArrowRight, Trash2, Edit, RotateCcw } from "lucide-react";'
);

c = c.replace(
  'function SaleDetailModal({ sale, onClose, onDelete, onEdit, isAdmin })',
  'function SaleDetailModal({ sale, onClose, onDelete, onEdit, onReturn, isAdmin })'
);

c = c.replace(
  '<button onClick={() => onEdit(sale)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg font-medium"><Edit size={14} /> Tahrirlash</button>',
  `<button onClick={() => onEdit(sale)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg font-medium"><Edit size={14} /> Tahrirlash</button>
              {sale.status === "COMPLETED" && <button onClick={() => onReturn(sale.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg font-medium"><RotateCcw size={14} /> Qaytarish</button>}`
);

c = c.replace(
  '<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin} onEdit=',
  `<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin} onReturn={async (id) => { if (!confirm("Sotuvni qaytarasizmi? Mahsulotlar ombarga qaytadi.")) return; try { await api.post("/sales/kassa/" + id + "/return", { reason: "Admin qaytardi" }); toast.success("Qaytarildi"); setSelectedSale(null); load(); } catch { toast.error("Xatolik"); } }} onEdit=`
);

fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
