const fs = require("fs");
let c = fs.readFileSync("src/pages/Products.jsx", "utf8");
const lines = c.split("\n");
const seen = new Set();
const result = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("import toast from") && seen.has("toast")) continue;
  if (trimmed.startsWith("import toast from")) seen.add("toast");
  result.push(line);
}
fs.writeFileSync("src/pages/Products.jsx", result.join("\n"));
console.log("OK");
