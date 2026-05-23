const fs = require("fs");
let c = fs.readFileSync("src/pages/Cart.jsx", "utf8");

c = c.replace(
  'import useCartStore from "../store/cartStore";',
  'import useCartStore from "../store/cartStore";\nimport useAuthStore from "../store/authStore";'
);

c = c.replace(
  "const { addToCart } = useCartStore();",
  'const { addToCart } = useCartStore();\n  const { user: authUser } = useAuthStore();\n  const isAdmin = authUser?.role === "ADMIN";'
);

c = c.replace(
  'setPendingSales(r.data.data.data.filter(s => s.status === "PENDING"));',
  'const all = r.data.data.data.filter(s => s.status === "PENDING");\n      setPendingSales(isAdmin ? all : all.filter(s => s.user?.name === authUser?.name));'
);

fs.writeFileSync("src/pages/Cart.jsx", c);
console.log("OK");
