const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
const lines = c.split("\n");
const seen = new Set();
const result = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (
    (trimmed === 'const { user: authUser } = useAuthStore();' || 
     trimmed === 'const isAdmin = authUser?.role === "ADMIN";') && seen.has(trimmed)
  ) continue;
  seen.add(trimmed);
  result.push(line);
}
fs.writeFileSync("src/pages/Sales.jsx", result.join("\n"));
console.log("OK");
