const fs = require("fs");

// App.jsx
let c = fs.readFileSync("src/App.jsx", "utf8");
c = c.replace("import Cart from './pages/Cart';", "import Cart from './pages/Cart';\nimport Kassa from './pages/Kassa';");
c = c.replace('<Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />', '<Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />\n        <Route path="/kassa" element={<PrivateRoute><Kassa /></PrivateRoute>} />');
fs.writeFileSync("src/App.jsx", c);
console.log("OK: App.jsx");

// MainLayout.jsx
let m = fs.readFileSync("src/layouts/MainLayout.jsx", "utf8");
m = m.replace(
  'import { LayoutDashboard, Package, PackagePlus, ShoppingCart, Users, CreditCard, BarChart2, LogOut, Menu, X, UserCog, Tag, Settings, ClipboardList, Moon, Sun } from "lucide-react";',
  'import { LayoutDashboard, Package, PackagePlus, ShoppingCart, Users, CreditCard, BarChart2, LogOut, Menu, X, UserCog, Tag, Settings, ClipboardList, Moon, Sun, Landmark } from "lucide-react";'
);
m = m.replace(
  '{ path: "/stockin", icon: PackagePlus, label: "Kirim", adminOnly: true },',
  '{ path: "/stockin", icon: PackagePlus, label: "Kirim", adminOnly: true },\n  { path: "/kassa", icon: Landmark, label: "Kassa", kassirOnly: true },'
);
m = m.replace(
  '{navItems.filter(item => !item.adminOnly || user?.role === "ADMIN").map',
  '{navItems.filter(item => (!item.adminOnly || user?.role === "ADMIN") && (!item.kassirOnly || user?.role === "KASSIR" || user?.role === "ADMIN")).map'
);
fs.writeFileSync("src/layouts/MainLayout.jsx", m);
console.log("OK: MainLayout.jsx");
