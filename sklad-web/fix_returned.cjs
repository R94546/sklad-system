const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
c = c.replace(
  '<tr key={s.id} onClick={() => openDetail(s)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">',
  '<tr key={s.id} onClick={() => openDetail(s)} className={"cursor-pointer transition-none " + (s.status === "RETURNED" ? "bg-red-50/50 dark:bg-red-500/5 opacity-60" : "hover:bg-slate-50 dark:hover:bg-slate-700/30")}>'
);
fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
