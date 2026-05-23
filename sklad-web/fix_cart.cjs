const fs = require("fs");
let c = fs.readFileSync("src/pages/Products.jsx", "utf8");

c = c.replace(
  'import { Plus, Edit, Trash2, Package, X, ArrowRight } from "lucide-react";',
  'import { Plus, Edit, Trash2, Package, X, ShoppingCart } from "lucide-react";\nimport useCartStore from "../store/cartStore";\nimport toast from "react-hot-toast";'
);

c = c.replace(
  "const [selected, setSelected] = useState(null);",
  "const [selected, setSelected] = useState(null);\n  const { addToCart } = useCartStore();"
);

c = c.replace(
  '<td className="px-4 py-3 text-right"><Badge variant={p.quantity <= p.minStock ? "red" : "green"}>{p.quantity} {UNITS[p.unit]}</Badge></td>',
  `<td className="px-4 py-3 text-right"><Badge variant={p.quantity <= p.minStock ? "red" : "green"}>{p.quantity} {UNITS[p.unit]}</Badge></td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button onClick={async (e) => { e.stopPropagation(); const ok = await addToCart(p.id, 1); if (ok) toast.success(p.name + " savatga qoshildi"); else toast.error("Xatolik"); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">
                      <ShoppingCart size={15} />
                    </button>
                  </td>`
);

c = c.replace(
  '"Nomi","Narxi","Qoldiq"',
  '"Nomi","Narxi","Qoldiq",""'
);

fs.writeFileSync("src/pages/Products.jsx", c);
console.log("OK");
