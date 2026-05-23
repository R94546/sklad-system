const fs = require("fs");
let c = fs.readFileSync("src/pages/Cart.jsx", "utf8");

c = c.replace(
  'import { Trash2, ShoppingCart, CheckCircle, Plus, X, Package } from "lucide-react";',
  'import { Trash2, ShoppingCart, CheckCircle, Plus, X, Package, Send } from "lucide-react";'
);

c = c.replace(
  '<Button className="w-full" loading={saving} onClick={async () => { setSaving(true); await onConfirm(cart.id, form); setSaving(false); }}>',
  `<Button variant="outline" className="w-full mb-2" onClick={async () => { try { await api.post("/sales/" + cart.id + "/send-to-kassa"); toast.success("Kassaga yuborildi"); window.location.reload(); } catch { toast.error("Xatolik"); } }}>
          <Send size={16} /> Kassaga yuborish
        </Button>
        <Button className="w-full" loading={saving} onClick={async () => { setSaving(true); await onConfirm(cart.id, form); setSaving(false); }}>`
);

fs.writeFileSync("src/pages/Cart.jsx", c);
console.log("OK");
