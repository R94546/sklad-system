const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
// Remove duplicate declarations
c = c.replace(/const \{ user: authUser \} = useAuthStore\(\);\n  const isAdmin = authUser\?\.role === "ADMIN";\n  const \{ user: authUser \} = useAuthStore\(\);\n  const isAdmin = authUser\?\.role === "ADMIN";/, 'const { user: authUser } = useAuthStore();\n  const isAdmin = authUser?.role === "ADMIN";');
fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
