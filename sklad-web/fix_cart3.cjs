const fs = require("fs");
let c = fs.readFileSync("src/store/cartStore.js", "utf8");
c = c.replace(
  'const r = await api.post("/sales/cart/add", { productId, quantity });',
  'const r = await api.post("/sales/cart/add", { productId, quantity, price });'
);
c = c.replace(
  'addToCart: async (productId, quantity = 1)',
  'addToCart: async (productId, quantity = 1, price)'
);
fs.writeFileSync("src/store/cartStore.js", c);
console.log("OK");
