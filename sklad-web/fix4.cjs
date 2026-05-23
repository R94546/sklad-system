const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
// Remove all duplicate isAdmin blocks, keep only first one
const adminBlock = `          {isAdmin && (
            <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <button onClick={() => onDelete(sale.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-medium"><Trash2 size={14} /> Ochirish</button>
            </div>
          )}`;
const escaped = adminBlock.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const regex = new RegExp(`(${escaped})(\\s*${escaped})+`, "g");
c = c.replace(regex, adminBlock);
fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
