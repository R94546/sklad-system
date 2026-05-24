const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
c = c.replace(
  '<td className="px-4 py-3 text-right"><Badge variant={STATUS[s.status]?.variant}>{STATUS[s.status]?.label}</Badge></td>',
  '<td className="px-4 py-3 text-right"><Badge variant={STATUS[s.status]?.variant} animate={s.status === "RETURNED" || s.status === "COMPLETED"}>{STATUS[s.status]?.label}</Badge></td>'
);
fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
