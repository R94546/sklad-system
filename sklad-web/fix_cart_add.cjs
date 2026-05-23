const fs = require("fs");
let c = fs.readFileSync("src/pages/Cart.jsx", "utf8");

c = c.replace(
  'import { Trash2, ShoppingCart, CheckCircle, Plus, X, Package } from "lucide-react";',
  'import { Trash2, ShoppingCart, CheckCircle, Plus, X, Package } from "lucide-react";\nimport ProductSearch from "../components/ProductSearch";\nimport AddToCartModal from "../components/AddToCartModal";\nimport useCartStore from "../store/cartStore";'
);

c = c.replace(
  "const [loading, setLoading] = useState(true);",
  "const [loading, setLoading] = useState(true);\n  const [showSearch, setShowSearch] = useState(false);\n  const [cartProduct, setCartProduct] = useState(null);\n  const { addToCart } = useCartStore();"
);

c = c.replace(
  '<Button onClick={() => navigate("/products")}><Plus size={16} /> Mahsulot qoshish</Button>',
  '<Button onClick={() => setShowSearch(true)}><Plus size={16} /> Mahsulot qoshish</Button>'
);

c = c.replace(
  '<Button onClick={() => navigate("/products")}>Mahsulot qoshish</Button>',
  '<Button onClick={() => setShowSearch(true)}>Mahsulot qoshish</Button>'
);

c = c.replace(
  'return (\n    <div className="space-y-6 animate-fade-in">',
  `return (
    <div className="space-y-6 animate-fade-in">
      {showSearch && <ProductSearch onClose={() => setShowSearch(false)} onSelect={(p) => { setShowSearch(false); setCartProduct(p); }} />}
      {cartProduct && <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} onAdd={async (productId, quantity, price) => { const ok = await addToCart(productId, quantity, price); if (ok) { toast.success(cartProduct.name + " savatga qoshildi"); load(); } else toast.error("Xatolik"); }} />}`
);

fs.writeFileSync("src/pages/Cart.jsx", c);
console.log("OK");
