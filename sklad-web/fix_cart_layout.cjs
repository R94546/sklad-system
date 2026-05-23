const fs = require("fs");
let c = fs.readFileSync("src/layouts/MainLayout.jsx", "utf8");

c = c.replace(
  'import { LayoutDashboard, Package, PackagePlus, ShoppingCart, Users, CreditCard, BarChart2, LogOut, Menu, X, UserCog, Tag, Settings, ClipboardList, Moon, Sun } from "lucide-react";',
  'import { LayoutDashboard, Package, PackagePlus, ShoppingCart, Users, CreditCard, BarChart2, LogOut, Menu, X, UserCog, Tag, Settings, ClipboardList, Moon, Sun } from "lucide-react";\nimport useCartStore from "../store/cartStore";\nimport { useEffect } from "react";'
);

c = c.replace(
  'const { dark, toggle } = useThemeStore();',
  'const { dark, toggle } = useThemeStore();\n  const { cart, fetchCart } = useCartStore();\n  const cartCount = cart?.items?.length || 0;\n  useEffect(() => { fetchCart(); }, []);'
);

c = c.replace(
  '<button onClick={toggle} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">',
  `<a href="/sales" className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <ShoppingCart size={16} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{cartCount}</span>}
            </a>
            <button onClick={toggle} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">`
);

fs.writeFileSync("src/layouts/MainLayout.jsx", c);
console.log("OK");
