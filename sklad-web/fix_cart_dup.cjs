const fs = require("fs");
let c = fs.readFileSync("src/pages/Cart.jsx", "utf8");
const lines = c.split("\n");
const seen = new Set();
const result = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("import useCartStore") && seen.has("useCartStore")) continue;
  if (trimmed.startsWith("import useCartStore")) seen.add("useCartStore");
  result.push(line);
}
fs.writeFileSync("src/pages/Cart.jsx", result.join("\n"));
console.log("OK");
