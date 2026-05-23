const fs = require("fs");
let c = fs.readFileSync("src/pages/Products.jsx", "utf8");

c = c.replace(
  'import useCartStore from "../store/cartStore";',
  'import useCartStore from "../store/cartStore";\nimport AddToCartModal from "../components/AddToCartModal";'
);

c = c.replace(
  'import { Plus, Edit, Trash2, Package, X, ShoppingCart } from "lucide-react";',
  'import { Plus, Edit, Trash2, Package, X, ShoppingCart } from "lucide-react";'
);

c = c.replace(
  "const { addToCart } = useCartStore();",
  "const { addToCart } = useCartStore();\n  const [cartProduct, setCartProduct] = useState(null);"
);

c = c.replace(
  `<button onClick={async (e) => { e.stopPropagation(); const ok = await addToCart(p.id, 1); if (ok) toast.success(p.name + " savatga qoshildi"); else toast.error("Xatolik"); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">
                      <ShoppingCart size={15} />
                    </button>`,
  `<button onClick={async (e) => { e.stopPropagation(); setCartProduct(p); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">
                      <ShoppingCart size={15} />
                    </button>`
);

c = c.replace(
  "<ProductDetailModal",
  `{cartProduct && <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} onAdd={async (productId, quantity, price) => { const ok = await addToCart(productId, quantity); if (ok) toast.success(cartProduct.name + " savatga qoshildi"); else toast.error("Xatolik"); }} />}
      <ProductDetailModal`
);

fs.writeFileSync("src/pages/Products.jsx", c);
console.log("OK");
