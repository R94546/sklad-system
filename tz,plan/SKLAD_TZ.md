# SKLAD TIZIMI — Texnik Topshiriq (TZ)

> **Maqsad:** Bu hujjat to'liq bajarilganda tizim 100% ishlashga tayyor bo'ladi.
> Qamrov: Backend + Web + Desktop + Mobile. Odoo POS tahlili asosida.
> Versiya: 1.0 | Til: o'zbekcha | Valyuta: **som (KGS)**

---

## 0. UMUMIY

**Loyiha:** "Sklad Tizimi" — Qirg'iziston uchun ombor + savdo (POS) tizimi.
**Foydalanuvchilar:** 1 admin + 5–6 sotuvchi.
**Soha:** umumiy savdo (general merchandise) + qurilish materiallari.

**Stack:**
- Backend: Node.js + Express + Prisma + PostgreSQL → Railway
- Web: React + Vite + Tailwind → Vercel
- Desktop: Electron
- Mobile: React Native + Expo
- Rasm: Firebase Storage (`choyxona-uz-app`)
- SMS: Android SMS Gateway (tablet + SIM)

**Asosiy tamoyil (logik xatoning yechimi):** Savdo — **bitta ekran**. Chap = savat + klaviatura, o'ng = mahsulotlar. Mahsulot bosildi = savatga (1 bosish). Hech qanday sidebar/scroll/yangi-sotuv oqimi yo'q.

---

## 1. ROLLAR VA HUQUQLAR

| Amal | Admin | Sotuvchi |
|------|-------|----------|
| POS savdo | ✅ | ✅ |
| Smena ochish/yopish | ✅ | ✅ (o'ziniki) |
| Cash In/Out | ✅ | ✅ |
| Mahsulot yaratish/tahrirlash | ✅ | ⚠️ (faqat tez yaratish) |
| Narx o'zgartirish | ✅ | ⚠️ (limit bilan) |
| Chegirma berish | ✅ | ⚠️ (max % limit) |
| Ombor kirim | ✅ | ❌ |
| Mijoz qarzi boshqaruvi | ✅ | ⚠️ (ko'rish) |
| Dashboard / hisobot | ✅ | ❌ |
| Boshqa sotuvchi savdolari | ✅ | ❌ |
| Foydalanuvchi qo'shish | ✅ | ❌ |

> **Taklif:** sotuvchi uchun `maxDiscountPercent` va `canEditPrice` flaglari — admin sozlaydi.

---

## 2. MA'LUMOTLAR MODELI (Prisma schema)

> Mavjud modellar saqlanadi, quyidagilar qo'shiladi/kengaytiriladi.

### 2.1 User (kengaytirish)
```
model User {
  id              String   @id @default(uuid())
  phone           String   @unique          // +996...
  passwordHash    String
  name            String
  role            Role     @default(SELLER) // ADMIN | SELLER
  avatarColor     String?                   // POS avatar rangi
  maxDiscountPercent Float @default(0)       // sotuvchi chegirma limiti
  canEditPrice    Boolean  @default(false)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  sessions        CashSession[]
  orders          Order[]
}
enum Role { ADMIN SELLER }
```

### 2.2 PosCategory (yangi)
```
model PosCategory {
  id        String   @id @default(uuid())
  name      String
  color     String   @default("#1D9E75") // tab rangi
  icon      String?                        // ixtiyoriy
  sortOrder Int      @default(0)
  products  Product[]
}
```

### 2.3 Product (kengaytirish)
```
model Product {
  id             String   @id @default(uuid())
  name           String
  barcode        String?  @unique
  sku            String?  @unique          // kod [FURN_7800]
  price          Float                      // sotuv narxi (soliqsiz baza)
  cost           Float    @default(0)        // tannarx (foyda hisobi uchun)
  taxPercent     Float    @default(0)        // soliq %
  trackInventory Boolean  @default(true)
  stock          Float    @default(0)        // qoldiq
  minStock       Float    @default(0)        // kam qolganda ogohlantirish
  unit           String   @default("dona")   // dona/kg/m/litr (qurilish uchun)
  color          String?                      // POS karta rangi
  imageUrl       String?
  posCategoryId  String?
  posCategory    PosCategory? @relation(fields:[posCategoryId], references:[id])
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  orderItems     OrderItem[]
  receiptLines   StockReceiptLine[]
}
```

### 2.4 Customer (kengaytirish)
```
model Customer {
  id        String   @id @default(uuid())
  name      String
  phone     String?
  email     String?
  address   String?
  tin       String?                          // INN
  barcode   String?                          // mijoz kartasi
  tags      String[]                          // VIP/B2B
  totalDue  Float    @default(0)              // qarz (jonli yangilanadi)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  orders    Order[]
  payments  CustomerPayment[]
}
```

### 2.5 CashSession (yangi) — smena
```
model CashSession {
  id           String    @id @default(uuid())
  sellerId     String
  seller       User      @relation(fields:[sellerId], references:[id])
  openingCash  Float     @default(0)
  openingNote  String?
  closingCash  Float?                          // sanab chiqilgan
  expectedCash Float?                          // kutilgan (hisoblangan)
  difference   Float?                          // farq
  closingNote  String?
  status       SessionStatus @default(OPEN)    // OPEN | CLOSED
  openedAt     DateTime  @default(now())
  closedAt     DateTime?
  orders       Order[]
  cashMovements CashMovement[]
}
enum SessionStatus { OPEN CLOSED }
```

### 2.6 CashMovement (yangi) — naqd kirim/chiqim
```
model CashMovement {
  id        String   @id @default(uuid())
  sessionId String
  session   CashSession @relation(fields:[sessionId], references:[id])
  type      CashType    // IN | OUT
  amount    Float
  reason    String
  createdAt DateTime @default(now())
}
enum CashType { IN OUT }
```

### 2.7 Order (kengaytirish) — chek/savdo
```
model Order {
  id            String   @id @default(uuid())
  number        Int      @default(autoincrement()) // 1001, 1002...
  receiptNo     String?                              // 261-2-000001
  sessionId     String?
  session       CashSession? @relation(fields:[sessionId], references:[id])
  sellerId      String
  seller        User     @relation(fields:[sellerId], references:[id])
  customerId    String?
  customer      Customer? @relation(fields:[customerId], references:[id])
  status        OrderStatus @default(DRAFT)  // DRAFT | PAID | REFUNDED | CANCELLED
  subtotal      Float    @default(0)
  taxTotal      Float    @default(0)
  discountTotal Float    @default(0)
  total         Float    @default(0)
  note          String?
  createdAt     DateTime @default(now())
  paidAt        DateTime?
  items         OrderItem[]
  payments      Payment[]
}
enum OrderStatus { DRAFT PAID REFUNDED CANCELLED }
```

### 2.8 OrderItem (yangi/kengaytirish)
```
model OrderItem {
  id         String  @id @default(uuid())
  orderId    String
  order      Order   @relation(fields:[orderId], references:[id])
  productId  String
  product    Product @relation(fields:[productId], references:[id])
  name       String                  // snapshot (nom o'zgarsa ham saqlanadi)
  qty        Float
  unitPrice  Float                    // snapshot
  taxPercent Float
  discount   Float   @default(0)      // % yoki summa
  lineTotal  Float
}
```

### 2.9 Payment (yangi) — aralash to'lov
```
model Payment {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields:[orderId], references:[id])
  method    PayMethod  // CASH | CARD | CUSTOMER_ACCOUNT
  amount    Float
  createdAt DateTime @default(now())
}
enum PayMethod { CASH CARD CUSTOMER_ACCOUNT }
```

### 2.10 CustomerPayment (yangi) — qarz to'lash
```
model CustomerPayment {
  id         String  @id @default(uuid())
  customerId String
  customer   Customer @relation(fields:[customerId], references:[id])
  amount     Float
  method     PayMethod
  note       String?
  createdAt  DateTime @default(now())
}
```

### 2.11 StockReceipt + StockReceiptLine (yangi) — ombor kirim
```
model StockReceipt {
  id        String   @id @default(uuid())
  number    Int      @default(autoincrement())
  supplier  String?
  sourceDoc String?                          // PO0032
  status    ReceiptStatus @default(DRAFT)    // DRAFT | CONFIRMED
  note      String?
  createdAt DateTime @default(now())
  confirmedAt DateTime?
  lines     StockReceiptLine[]
}
model StockReceiptLine {
  id         String  @id @default(uuid())
  receiptId  String
  receipt    StockReceipt @relation(fields:[receiptId], references:[id])
  productId  String
  product    Product @relation(fields:[productId], references:[id])
  qty        Float
  cost       Float   @default(0)             // kirim narxi
}
enum ReceiptStatus { DRAFT CONFIRMED }
```

> **Taklif (qo'shimcha):** `StockMovement` jadvali — har bir stok o'zgarishi log (savdo, kirim, qo'lda tuzatish). Inventarizatsiya va auditga kerak. Keyingi bosqichda.
---

## 3. BACKEND API (Endpointlar)

> Barcha endpointlar JWT bilan himoyalangan. `[A]` = faqat admin.

### 3.1 Auth
```
POST /auth/login          { phone, password } → { token, user }
POST /auth/refresh        → { token }
GET  /auth/me             → { user }
```

### 3.2 Smena (CashSession)
```
GET  /sessions/current             → ochiq smena yoki null
POST /sessions/open                { openingCash, note }
POST /sessions/:id/close           { closingCash, note } → farq hisoblanadi
GET  /sessions/:id                 → smena + orders + cashMovements
GET  /sessions          [A]        → barcha smenalar (filter: seller, sana)
```

### 3.3 Cash movement
```
POST /cash-movements               { sessionId, type, amount, reason }
```

### 3.4 Mahsulot / Kategoriya
```
GET  /products                     ?search=&categoryId=&page=
GET  /products/:id
POST /products          [A]/quick  (sotuvchi faqat tez yaratish)
PUT  /products/:id      [A]
DELETE /products/:id    [A]        (soft: isActive=false)
GET  /pos-categories
POST /pos-categories    [A]
PUT  /pos-categories/:id [A]
```

### 3.5 Mijoz
```
GET  /customers                    ?search=
GET  /customers/:id
GET  /customers/:id/orders
POST /customers
PUT  /customers/:id
POST /customers/:id/pay-due        { amount, method, note } → totalDue kamayadi
```

### 3.6 Buyurtma / Savdo
```
GET  /orders                       ?status=&search=&sellerId=&page=
GET  /orders/:id
POST /orders                       (DRAFT yaratish — parked)
PUT  /orders/:id                   (savat yangilash — items)
POST /orders/:id/pay               { payments:[{method, amount}], customerId? }
POST /orders/:id/cancel
POST /orders/:id/refund [A]
PUT  /orders/:id/payment [A]       (Edit Payment)
POST /orders/:id/send-receipt      { phone } → SMS Gateway
```

### 3.7 Ombor kirim
```
GET  /stock-receipts    [A]
POST /stock-receipts    [A]        (DRAFT)
PUT  /stock-receipts/:id [A]
POST /stock-receipts/:id/confirm [A]  → stok ortadi
```

### 3.8 Hisobot
```
GET  /reports/dashboard [A]        ?from=&to= → KPI + oylik
GET  /reports/daily-sale           ?date= → kunlik (Daily Sale)
GET  /reports/low-stock [A]        → kam qolgan mahsulotlar
GET  /reports/top-products [A]
```

---

## 4. BIZNES LOGIKA VA HISOB-KITOBLAR

### 4.1 Qator hisobi (OrderItem)
```
lineSubtotal = qty × unitPrice
lineDiscount = chegirma (% bo'lsa: lineSubtotal × discount/100)
lineNet      = lineSubtotal − lineDiscount
lineTax      = lineNet × taxPercent/100
lineTotal    = lineNet + lineTax        // soliq narxga kirgan bo'lsa boshqacha — pastga qarang
```

> **Muhim qaror:** Odoo'da soliq narx ICHIDA (`Вкл. налоги`). Qirg'iziston amaliyotiga qarab tanlash:
> - **Variant A (tavsiya):** narx soliqni o'z ichiga oladi (inclusive). Ko'rsatiladigan narx = yakuniy narx.
> - Variant B: narx ustiga soliq qo'shiladi (exclusive).
> ТЗ Variant A bo'yicha yoziladi (sotuvchi uchun sodda). `taxTotal` faqat hisobot uchun ajratiladi.

### 4.2 Chek hisobi (Order)
```
subtotal      = Σ lineNet (soliqsiz)
taxTotal      = Σ lineTax
discountTotal = Σ lineDiscount
total         = Σ lineTotal
```

### 4.3 To'lov va qaytim
```
paidTotal = Σ payments.amount
qoldiq    = total − paidTotal
agar qoldiq <= 0 → to'liq to'langan, qaytim = −qoldiq (faqat CASH dan)
CUSTOMER_ACCOUNT ishlatilsa → customer.totalDue += o'sha summa
```

### 4.4 Stok kamayishi (to'lovdan keyin)
```
Order PAID bo'lganda har item uchun:
  agar product.trackInventory: product.stock −= qty
  (transaction ichida — prisma.$transaction)
```

### 4.5 Smena yopish farqi
```
expectedCash = openingCash
             + Σ (PAID orderlardagi CASH to'lovlar)
             + Σ (CashMovement IN) − Σ (CashMovement OUT)
difference   = closingCash − expectedCash
(− = kamomad, + = ortiqcha)
```

### 4.6 Chek raqami
```
number    = avtoinkrement (1001 dan boshlanadi)
receiptNo = "{terminal}-{seller}-{6 xonali}" masalan 261-2-000001
```

### 4.7 SMS chek (Android SMS Gateway)
```
To'lovdan keyin "Send Receipt" → mijoz telefoniga matn:
"Sklad Tizimi. Chek #1001. Jami: 1450 som. Rahmat!"
Gateway: tabletdagi local IP yoki Railway → tablet bridge.
Firebase/try-catch wrap (Railwayda service-account yo'q).
```

---

## 5. VALYUTA VA FORMAT

- Valyuta: **som (KGS)**, belgi: `сом` yoki `с`
- Format: `1 450 сом` (mingliklar probel bilan)
- Soliq: Qirg'iziston NDS odatda 12% (sozlanadigan)
- Tezkor to'lov tugmalari: `+100`, `+500`, `+1000`, `+5000`
- Barcha float `Math.round()` yoki `.toFixed(2)` orqali ko'rsatiladi
---

## 6. FRONTEND — EKRANLAR VA KOMPONENTLAR

### 6.1 POS asosiy ekran ⭐ (`pages/POS.jsx`)

**Layout:** `flex h-screen` — chap 36%, o'ng 64%.

**Yuqori navbar (butun kenglik):**
- Chap: `Registratsiya` | `Buyurtmalar` tablar, `➕` yangi chek, chek tablari `1001 1002...`
- O'ng: 🔍 qidiruv input, ▦ barcode tugma, avatar (sotuvchi), ☰ menyu

**Chap panel (`Cart.jsx` + `Numpad.jsx`):**
- Savat qatorlari: `soni × nom | narx`, tanlangan qator highlight, ✖ o'chirish
- Pastda: `Soliq`, `Jami` (katta, qalin)
- Tugmalar qatori: `Mijoz`, `Izoh`, `Park` (saqlash), `⋮`
- Numpad: `1-9 0 +/- , ⌫`
- O'ng ustun: `Soni`, `%`, `Narx`
- `TO'LOV` (keng, binafsha) — qoldiq summa bilan

**O'ng panel (`ProductGrid.jsx`):**
- Kategoriya tablari (rangli, ikonka+nom, gorizontal scroll)
- Mahsulot grid: **`repeat(7, 1fr)`, 3 qator ko'rinadi** (web). Mobil = 2-3 ustun.
- Karta: rasm, nom, narx, qoldiq badge (kam bo'lsa qizil), savatdagi soni (qora badge), kategoriya rang chizig'i
- Pastda lazy-load / paginatsiya

**Interaksiya (KRITIK):**
- Mahsulot karta bosildi → `cartStore.addItem(product)` (1 bosish, agar bor bo'lsa qty+1)
- Kategoriya tab → filter
- Qidiruv/barcode → topilsa avtomatik savatga
- Savat qator tanlandi → numpad/Soni/Narx o'sha qatorga

**State (`cartStore.js` — Zustand):**
```
orders: [{ id, items, customerId, note }]   // parallel cheklar
activeOrderId
addItem, removeItem, updateQty, setPrice, applyDiscount
parkOrder, newOrder, switchOrder
totals (computed): subtotal, tax, discount, total
```

### 6.2 Smena ochish (`OpenSessionModal.jsx`)
POS yuklanganda `/sessions/current` null bo'lsa majburiy. Boshlang'ich naqd + izoh → ochish.

### 6.3 To'lov ekrani (`PaymentScreen.jsx`)
- To'lov usullari ro'yxati (Naqd/Karta/Mijoz hisobi)
- Numpad + tezkor tugmalar (+100/+500/+1000/+5000)
- Aralash to'lov: har usulga summa, jonli qoldiq, qaytim
- `Tasdiqlash` → `/orders/:id/pay`
- Keyin: chek tasdiq ekrani (Print / SMS / Davom)

### 6.4 Buyurtmalar (`pages/Orders.jsx`)
- Qidiruv + status filter (Hammasi/Qoralama/To'langan/Qaytarilgan)
- Ro'yxat: sana, raqam, mijoz, summa, status badge, ℹ
- Qator → `OrderDetailModal.jsx`
- Paginatsiya

### 6.5 Mijoz (`CustomerModal.jsx`)
- Qidiruv + ro'yxat (nom, telefon, qarz)
- Tanlash → savatga biriktirish
- Yangi yaratish forma
- `Qarz to'lash` tugma

### 6.6 Mahsulot forma (`ProductFormModal.jsx`)
Nom, shtrixkod (+scanner), SKU, narx, soliq%, kategoriya, rang, birlik, trackInventory, rasm (Firebase), qoldiq.

### 6.7 Cash In/Out (`CashMovementModal.jsx`)
Kirim/Chiqim toggle, summa, sabab.

### 6.8 Smena yopish (`CloseSessionModal.jsx`)
Usul bo'yicha: kutilgan vs sanalgan, farq. Naqd sanash input. Daily Sale eksport.

---

## 7. ADMIN PANEL (`pages/admin/*`)

- `Dashboard.jsx` — KPI (savdo soni, daromad, o'rtacha chek, foyda) + oylik grafik (recharts) + top mahsulotlar + kam qolgan stok
- `Products.jsx` — katalog (karta/jadval toggle), qoldiq, kod, qidiruv, +Yangi
- `Orders.jsx` — barcha savdolar jadvali, status badge, filter, eksport
- `Sessions.jsx` — smenalar ro'yxati + detal + farq log
- `StockReceipt.jsx` — ombor kirim (DRAFT→CONFIRMED), mahsulot+miqdor
- `Customers.jsx` — mijozlar + qarz boshqaruvi
- `Users.jsx` — sotuvchilar (qo'shish, chegirma limiti, narx huquqi)
- `Settings.jsx` — soliq %, valyuta, do'kon nomi, chek matni, SMS shabloni

---

## 8. DIZAYN (Odoo uslubi, "chiroyli")

- **Tema:** och + qorong'i (dark mode toggle). Odoo POS — qorong'i navbar + oq panel.
- **Ranglar:** kategoriya tablari rangli (yashil/pushti/qizil/ko'k). Asosiy = teal/binafsha.
- **Kartalar:** yumaloq burchak (rounded-xl), yengil soya, hover effekt.
- **Tipografika:** aniq, katta jami summa. Sotuvchi tez o'qiy oladigan.
- **Touch-friendly:** katta tugmalar (tablet uchun). Min 44px balandlik.
- **Animatsiya:** savatga qo'shilganda yengil animatsiya, skeleton loading, toast.
- **Bo'sh holat (empty state):** "Savat bo'sh", "Mahsulot topilmadi" — chiroyli.
- Mavjud Stage A (3-10) shu yerda bajariladi: dark mode, skeleton, animatsiya, grafik, mobil responsive, empty state, toast.

---

## 9. MOBILE (React Native + Expo)

- Xuddi shu POS mantiq, mobil layout (mahsulot 2-3 ustun, savat pastdan ochiladi yoki alohida tab).
- Avval **login muammosi** hal qilinadi (eski plan).
- API URL = Railway production (local IP emas).
- APK build: `react-native-reanimated`/worklets versiya konflikti hal qilinadi; `C:\sklad-m\` da `gradlew assembleRelease`.

---

## 10. DESKTOP (Electron)
Web build'ni o'rab beradi. Offline rejim (keyingi bosqich — local cache).
---

## 11. BAJARILISH BOSQICHLARI (Roadmap — prioritet bilan)

> Har bosqich tugagach test → keyingisi. Belgilar: ✅ tayyor · 🔲 qiladi · ⚠️ qisman.

### BOSQICH 0 — Tayyorgarlik
- 🔲 Backend tekshirish (GET /products, kategoriya bormi)
- 🔲 Prisma schema: yangi modellar (CashSession, CashMovement, Payment, PosCategory, StockReceipt va h.k.)
- 🔲 Migration + Railway deploy
- 🔲 Seed: test mahsulot + kategoriya + admin

### BOSQICH 1 — POS yadrosi ⭐ (eng muhim, logik xato)
- 🔲 `cartStore` (Zustand) — parallel cheklar, addItem 1 bosish
- 🔲 `POS.jsx` layout (chap/o'ng)
- 🔲 `ProductGrid` (7 ustun, rangli kategoriya, badge)
- 🔲 `Cart` + `Numpad` (Soni/Narx/%)
- 🔲 Qidiruv + barcode → savatga
- **Natija:** sotuvchi 1 bosishda savdo qila oladi.

### BOSQICH 2 — Smena + To'lov
- 🔲 OpenSessionModal (majburiy)
- 🔲 PaymentScreen (usullar, tezkor tugma, aralash, qaytim)
- 🔲 To'lov → stok kamayishi (transaction)
- 🔲 Chek tasdiq (Print/SMS/Davom)
- 🔲 CloseSessionModal (farq) + CashMovement

### BOSQICH 3 — Buyurtmalar + Mijoz
- 🔲 Orders ro'yxati + filter + OrderDetailModal
- 🔲 Customer tanlash/yaratish + savatga biriktirish
- 🔲 Mijoz qarzi (totalDue) + qarz to'lash
- 🔲 SMS chek (Android Gateway integratsiya)

### BOSQICH 4 — Mahsulot + Ombor
- 🔲 ProductFormModal (to'liq maydonlar + rasm)
- 🔲 Admin Products (katalog, qoldiq, toggle)
- 🔲 StockReceipt (kirim → stok ortishi)
- 🔲 Low-stock ogohlantirish

### BOSQICH 5 — Admin Dashboard + Sozlama
- 🔲 Dashboard (KPI + grafik + top + low-stock)
- 🔲 Sessions (smenalar nazorati)
- 🔲 Users (sotuvchi boshqaruvi, limitlar)
- 🔲 Settings (soliq, valyuta, do'kon, SMS shablon)

### BOSQICH 6 — Dizayn (Stage A 3-10)
- 🔲 Dark mode, skeleton, animatsiya, empty state, toast, mobil responsive, grafik dizayn, ikonka/logo

### BOSQICH 7 — Mobile
- 🔲 Login fix
- 🔲 APK build konflikt fix
- 🔲 Mobil POS layout
- 🔲 EAS cloud build

### BOSQICH 8 — Desktop + Yakuniy
- 🔲 Electron build
- 🔲 To'liq E2E test (quyidagi mezonlar bo'yicha)
- 🔲 Deploy (Railway + Vercel) + APK

---

## 12. QABUL MEZONLARI (Acceptance — "100% ishlaydi" tekshiruvi)

Tizim quyidagi senariylarni xatosiz bajarsa — tayyor:

1. ✅ Sotuvchi login qiladi → smena ochiq emas → ochish modali → naqd kiritib ochadi.
2. ✅ POS ochiladi → kategoriya bosadi → mahsulot 1 bosishda savatga tushadi → soni badge ortadi.
3. ✅ Bir nechta mahsulot, soni/narx/chegirma o'zgartiriladi → jami to'g'ri hisoblanadi.
4. ✅ Qidiruv va barcode bilan mahsulot topiladi → savatga.
5. ✅ Mijoz tanlanadi → savatga biriktiriladi.
6. ✅ "Park" → savat saqlanadi, yangi chek ochiladi, qaytib o'sha chekka kiriladi.
7. ✅ To'lovga o'tadi → aralash to'lov (naqd+karta) → qoldiq 0 → tasdiq → stok kamayadi.
8. ✅ Naqd ortiqcha berilsa → qaytim ko'rsatiladi.
9. ✅ Mijoz hisobiga yozilsa → totalDue ortadi.
10. ✅ Chek SMS mijozga boradi (tablet gateway).
11. ✅ Buyurtmalar ro'yxatida savdo ko'rinadi, filter ishlaydi, detal ochiladi.
12. ✅ Cash In/Out qayd qilinadi.
13. ✅ Smena yopiladi → kutilgan vs sanalgan → farq to'g'ri.
14. ✅ Admin: ombor kirim tasdiqlanadi → stok ortadi.
15. ✅ Admin dashboard: KPI, grafik, top, low-stock to'g'ri.
16. ✅ Admin: sotuvchi qo'shadi, chegirma limiti ishlaydi.
17. ✅ Dark mode, mobil responsive, empty state, toast ishlaydi.
18. ✅ Mobile APK quriladi va POS ishlaydi.

---

## 13. CHEKKA HOLATLAR (Edge cases — e'tibor berish kerak)

- **Qoldiq 0 / manfiy:** trackInventory bo'lsa sotishda ogohlantirish (yoki bloklash — sozlanadi).
- **Bir nechta sotuvchi bir mahsulotni sotsa:** stok transaction bilan (race condition yo'q).
- **Smena ochmasdan savdo:** bloklanadi.
- **Internet uzilishi:** xato toast, qayta urinish (keyingi: offline queue).
- **Aralash to'lovda ortiqcha:** faqat naqddan qaytim.
- **PowerShell `$` muammosi:** JS fayllar Antigravity'da UTF-8 qayta saqlanadi; `prisma.$transaction` buzilmasligi uchun.
- **Uzbek/apostrof (`o'chirish`):** `.cjs` workaround skript.
- **Firebase Railwayda:** try/catch wrap.
- **Soliq inclusive/exclusive:** bitta qaror (Variant A) butun tizimda izchil.
- **Float xato:** har joyda round.

---

## 14. MENING QO'SHIMCHA TAKLIFLARIM

1. **Tannarx va foyda** (`cost` maydon) — dashboard'da real foyda ko'rsatish. 5-6 sotuvchili biznes uchun muhim.
2. **Birlik (unit)** — qurilish materiallari kg/m/litr bilan sotiladi. `Product.unit` + numpad'da o'nlik miqdor.
3. **Low-stock ogohlantirish** — `minStock` ostiga tushganda dashboard + bildirishnoma. Ombor uchun kritik.
4. **StockMovement log** — har stok o'zgarishi tarixi (audit, inventarizatsiya). Keyingi bosqich.
5. **Mijoz qarzi (totalDue)** — nasiyaga sotish Qirg'izistonda keng tarqalgan. Settle invoices muhim.
6. **Sotuvchi limitlari** — `maxDiscountPercent`, `canEditPrice` — suiiste'molni oldini oladi.
7. **Chek raqami formati** — `261-2-000001` (terminal-sotuvchi-raqam) audit uchun.
8. **Daily Sale eksport** — kun oxirida hisobot (PDF/Excel — mavjud pptxgenjs o'rniga xlsx/pdf).
9. **Tezkor mahsulot yaratish** — sotuvchi POS'dan chiqmasdan yangi mahsulot (Odoo "Create Product").
10. **Parked orders** — mijoz navbatda kutsa, savat saqlanadi (Odoo parallel chek).
11. **Offline rejim (kelajak)** — internet uzilsa local saqlash, ulanganda sync. Desktop uchun ayniqsa.
12. **Inventarizatsiya rejimi (kelajak)** — qoldiqni fizik sanab tuzatish.

---

## 15. ISHLASH TARTIBI (Rustam bilan)

- Har qadam = tayyor PowerShell komanda (faylga X-qatordan yoziladi).
- Bir vaqtda 3-5 qadam, har biridan keyin tasdiq.
- IDE: Antigravity. Terminal: PowerShell.
- `SKLAD_STATUS.md` — yagona haqiqat manbai, har sessiya undan.
- JSX PowerShell'dan yozilsa → Antigravity'da UTF-8 qayta saqlash.
- Submodule push: `--set-upstream origin master`.

---

**KEYINGI QADAM:** BOSQICH 0 — backend tekshirish. Tasdiqlasangiz, GET /products va kategoriya holatini ko'rib, Prisma schema'dan boshlaymiz.
