const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");

c = c.replace(
  'import useAuthStore from "../store/authStore";',
  'import useAuthStore from "../store/authStore";\nimport ProductSearch from "../components/ProductSearch";'
);

c = c.replace(
  "const [saving, setSaving] = useState(false);",
  "const [saving, setSaving] = useState(false);\n  const [productSearch, setProductSearch] = useState(false);\n  const [searchIndex, setSearchIndex] = useState(null);"
);

c = c.replace(
  `<div key={i} className="flex gap-2 items-center">
                  <select value={item.productId} onChange={e => updateItem(i, "productId", e.target.value)} required className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="">Mahsulot tanlang</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity})</option>)}
                  </select>`,
  `<div key={i} className="flex gap-2 items-center">
                  <button type="button" onClick={() => { setSearchIndex(i); setProductSearch(true); }} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-left bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    {item.productId ? (products.find(p => p.id === item.productId)?.name || "Tanlangan") : <span className="text-slate-400">Mahsulot tanlang</span>}
                  </button>`
);

c = c.replace(
  "<SaleDetailModal",
  `{productSearch && <ProductSearch onClose={() => setProductSearch(false)} onSelect={(p) => { updateItem(searchIndex, "productId", p.id); }} />}
      <SaleDetailModal`
);

fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
