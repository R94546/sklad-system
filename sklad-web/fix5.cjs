const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
c = c.replace(
  'import { Plus, X, ArrowRight, Trash2 } from "lucide-react";',
  'import { Plus, X, ArrowRight, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";'
);
c = c.replace(
  'function SaleDetailModal({ sale, onClose, onDelete, isAdmin })',
  'function SaleDetailModal({ sale, onClose, onDelete, onEdit, isAdmin })'
);
c = c.replace(
  '<button onClick={() => onDelete(sale.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-medium"><Trash2 size={14} /> Ochirish</button>',
  `<button onClick={() => onDelete(sale.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-medium"><Trash2 size={14} /> Ochirish</button>
              <button onClick={() => onEdit(sale)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg font-medium"><Edit size={14} /> Tahrirlash</button>`
);
fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
