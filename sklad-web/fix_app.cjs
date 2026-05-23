const fs = require("fs");
let c = fs.readFileSync("src/App.jsx", "utf8");
c = c.replace("import AuditLog from './pages/AuditLog';", "import AuditLog from './pages/AuditLog';\nimport Cart from './pages/Cart';");
c = c.replace('<Route path="/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />', '<Route path="/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />\n        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />');
fs.writeFileSync("src/App.jsx", c);
console.log("OK");
