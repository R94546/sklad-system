const fs = require("fs");
let c = fs.readFileSync("src/pages/Sales.jsx", "utf8");
c = c.replace(
  "const [detailLoading, setDetailLoading] = useState(false);",
  `const [detailLoading, setDetailLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [editForm, setEditForm] = useState({ paymentType: "CASH", status: "COMPLETED", discount: 0 });
  const [editSaving, setEditSaving] = useState(false);`
);
c = c.replace(
  '<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin}',
  `<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin} onEdit={(s) => { setEditSale(s); setEditForm({ paymentType: s.paymentType, status: s.status, discount: s.discount || 0 }); setSelectedSale(null); setEditModal(true); }}`
);
c = c.replace(
  '<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin} onEdit={(s) => { setEditSale(s); setEditForm({ paymentType: s.paymentType, status: s.status, discount: s.discount || 0 }); setSelectedSale(null); setEditModal(true); }} onDelete={async (id) => { if (!confirm("Ochirmoqchimisiz?")) return; try { await api.delete("/sales/" + id); toast.success("Ochirildi"); setSelectedSale(null); load(); } catch { toast.error("Xatolik"); } }} />',
  `<SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin} onEdit={(s) => { setEditSale(s); setEditForm({ paymentType: s.paymentType, status: s.status, discount: s.discount || 0 }); setSelectedSale(null); setEditModal(true); }} onDelete={async (id) => { if (!confirm("Ochirmoqchimisiz?")) return; try { await api.delete("/sales/" + id); toast.success("Ochirildi"); setSelectedSale(null); load(); } catch { toast.error("Xatolik"); } }} />

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Sotuvni tahrirlash" size="sm">
        <div className="space-y-4">
          <Select label="Tolov turi" value={editForm.paymentType} onChange={e => setEditForm({...editForm, paymentType: e.target.value})} options={PAYMENT_OPTIONS} />
          <Select label="Holat" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} options={[{value:"COMPLETED",label:"Bajarildi"},{value:"CANCELLED",label:"Bekor"},{value:"RETURNED",label:"Qaytarildi"}]} />
          <Input label="Skidka (som)" type="number" value={editForm.discount} onChange={e => setEditForm({...editForm, discount: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditModal(false)}>Bekor</Button>
            <Button className="flex-1" loading={editSaving} onClick={async () => { setEditSaving(true); try { await api.put("/sales/" + editSale.id, editForm); toast.success("Yangilandi"); setEditModal(false); load(); } catch { toast.error("Xatolik"); } setEditSaving(false); }}>Saqlash</Button>
          </div>
        </div>
      </Modal>`
);
fs.writeFileSync("src/pages/Sales.jsx", c);
console.log("OK");
