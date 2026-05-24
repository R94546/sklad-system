const fs = require("fs");

// Cart.jsx
let c = fs.readFileSync("src/pages/Cart.jsx", "utf8");
c = c.replace(
  "const [form, setForm] = useState({ paymentType: \"CASH\", clientId: \"\", discount: 0, dueDate: \"\", debtAmount: \"\" });",
  "const [form, setForm] = useState({ paymentType: \"CASH\", clientId: \"\", discount: 0, discountType: \"AMOUNT\", dueDate: \"\", debtAmount: \"\" });"
);
c = c.replace(
  "<Input label=\"Skidka (som)\" type=\"number\" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />",
  `<div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Skidka</label>
          <div className="flex gap-2">
            <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="AMOUNT">Som</option>
              <option value="PERCENT">%</option>
            </select>
            <input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" placeholder="0" />
          </div>
        </div>`
);
c = c.replace(
  "const finalTotal = total - Number(form.discount || 0);",
  "const discountAmount = form.discountType === \"PERCENT\" ? (total * Number(form.discount || 0) / 100) : Number(form.discount || 0);\n  const finalTotal = total - discountAmount;"
);
c = c.replace(
  "<span className=\"text-red-500\">-{Number(form.discount).toLocaleString()} som</span>",
  "<span className=\"text-red-500\">-{discountAmount.toLocaleString()} som {form.discountType === \"PERCENT\" ? \"(\" + form.discount + \"%)\" : \"\"}</span>"
);
fs.writeFileSync("src/pages/Cart.jsx", c);
console.log("OK: Cart.jsx");

// Kassa.jsx
let k = fs.readFileSync("src/pages/Kassa.jsx", "utf8");
k = k.replace(
  "const [form, setForm] = useState({ paymentType: \"CASH\", clientId: sale.clientId || \"\", discount: 0, dueDate: \"\", debtAmount: \"\" });",
  "const [form, setForm] = useState({ paymentType: \"CASH\", clientId: sale.clientId || \"\", discount: 0, discountType: \"AMOUNT\", dueDate: \"\", debtAmount: \"\" });"
);
k = k.replace(
  "<Input label=\"Skidka (som)\" type=\"number\" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />",
  `<div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Skidka</label>
            <div className="flex gap-2">
              <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="AMOUNT">Som</option>
                <option value="PERCENT">%</option>
              </select>
              <input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" placeholder="0" />
            </div>
          </div>`
);
k = k.replace(
  "const finalTotal = total - Number(form.discount || 0);",
  "const discountAmount = form.discountType === \"PERCENT\" ? (total * Number(form.discount || 0) / 100) : Number(form.discount || 0);\n  const finalTotal = total - discountAmount;"
);
k = k.replace(
  "<span className=\"text-red-500\">-{Number(form.discount).toLocaleString()} som</span>",
  "<span className=\"text-red-500\">-{discountAmount.toLocaleString()} som {form.discountType === \"PERCENT\" ? \"(\" + form.discount + \"%)\" : \"\"}</span>"
);
fs.writeFileSync("src/pages/Kassa.jsx", k);
console.log("OK: Kassa.jsx");
