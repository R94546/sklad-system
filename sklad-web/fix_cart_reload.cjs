const fs = require("fs");
let c = fs.readFileSync("src/pages/Cart.jsx", "utf8");
c = c.replace(
  'if (ok) { toast.success(cartProduct.name + " savatga qoshildi"); load(); } else toast.error("Xatolik");',
  `if (ok) { 
    toast.success(cartProduct.name + " savatga qoshildi"); 
    const r = await api.get("/sales");
    const pending = r.data.data.data.filter(s => s.status === "PENDING");
    setPendingSales(pending);
    if (selected) setSelected(pending.find(s => s.id === selected.id) || null);
  } else toast.error("Xatolik");`
);
fs.writeFileSync("src/pages/Cart.jsx", c);
console.log("OK");
