const fs = require("fs");
let c = fs.readFileSync("src/layouts/MainLayout.jsx", "utf8");
c = c.replace(
  '<a href="/sales" className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">',
  '<a href="/cart" className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">'
);
fs.writeFileSync("src/layouts/MainLayout.jsx", c);
console.log("OK");
