# Odoo POS — To'liq Tahlil va "Sklad Tizimi" ga Moslash Plani

> Har bir ekran: (a) ekranda nima bor, (b) backend amal, (c) frontend amal, (d) bizning loyihaga qanday/qayerga moslash.

---

## Ekran 1 — Smena ochish (Открытие кассы)

### (a) Ekranda nima bor — barcha detallar

**Yuqori chap (navbar):**
- `Регистрация` — joriy savdo (POS) tab
- `Заказы` — buyurtmalar ro'yxati tab
- `➕` — yangi parallel chek ochish tugmasi
- `1001` — joriy ochiq chek raqami (active)
- `‹` `›` — cheklar orasida o'tish (chap/o'ng strelka)

**Yuqori o'ng (navbar):**
- 🔍 `Поиск товаров...` — mahsulot qidiruv maydoni
- ▦ — barcode scanner ikoni (skaner rejimi)
- `P` (qizil dumaloq) — sotuvchi avatar / profil
- ☰ — kontekst menyu (tema, smena yopish, backend)

**Markaz modal (Управление открыванием):**
- `Денежные средства на начало периода` — boshlang'ich naqd input (0,00)
- ✖ — input tozalash
- 💵 — kupyura sanagich (naqdni detallab kiritish)
- `Вступительная заметка` — kirish izohi (textarea, ixtiyoriy)
- `Открыть кассу` (binafsha) — smenani ochish
- `Отменить` — bekor qilish

**Quyi chap:** `Клиент`, `Заметка`, ⬆ (yuborish), ⋮ (amallar)

### (b) Backend
`POST /sessions/open { openingCash, note, sellerId }` → `CashSession{ status:OPEN, openingCash }`

### (c) Frontend
POS ochilganda smena yopiq bo'lsa — bu modal majburiy chiqadi. Summa kiritib "Открыть кассу" bosiladi.

### (d) Bizga moslash
- Yangi **`CashSession`** modeli (Prisma).
- Savdo **faqat ochiq smenada** mumkin.
- Navbar: yuqori chap = tablar + chek raqamlari, yuqori o'ng = qidiruv + scanner + avatar + menyu.
- Joy: `sklad-web/src/pages/POS.jsx` (yangi) + `OpenSessionModal.jsx`.

---

## Ekran 2 — POS asosiy ekran ⭐ (ENG MUHIM, logik xato shu yerda hal bo'ladi)

### (a) Ekranda nima bor — barcha detallar

**Chap panel (yuqoridan pastga):**
- Savat qatori: `soni | nom - variant | narx` (masalan `1 | Large Desk - Metal | 2 014,88`)
- `Налоги` — soliq summasi
- `Всего` — jami (qalin, katta)
- Qator amallar: `Клиент`, `Заметка`, ⬆, ⋮
- Raqamli klaviatura: `1-9`, `0`, `+/-`, `,` (vergul), `⌫` (qizil)
- O'ng ustun: `Количество` (miqdor), `%` (chegirma), `Цена` (narx o'zgartirish)
- Pastda: `Оплата` (binafsha, keng) — to'lovga o'tish

**O'ng panel:**
- Kategoriya tablari — **rang bilan ajratilgan** (Misc=yashil, Desks=pushti, Chairs=qizil), ikonka + nom
- Mahsulot kartalari — **3 qator × 7 ustun ideal hajm**
- Har karta: rasm + nom + (narx) + **savatdagi soni badge** (qora dumaloq, masalan `1`)
- Karta tagida rang chizig'i = kategoriya rangi
- O'ngda scroll bar

### (b) Backend
- `GET /products` — mahsulotlar (rasm, narx, kategoriya, qoldiq)
- `GET /pos-categories` — kategoriyalar (nom, rang, ikon)

### (c) Frontend
- **Mahsulot bosildi = savatga tushdi (1 bosish).** Hech qanday sidebar/scroll/yangi sotuv yo'q.
- Kategoriya bosilsa — faqat o'sha kategoriya mahsulotlari filtrlanadi.
- Savatdagi qator bosilsa — tanlanadi, klaviatura/Количество/Цена o'sha qatorga ta'sir qiladi.

### (d) Bizga moslash — KRITIK
- Mavjud murakkab oqim **butunlay almashtiriladi** shu bitta ekran bilan.
- Layout: `flex` — chap 35% (savat+klaviatura), o'ng 65% (mahsulot grid).
- Grid: `grid-template-columns: repeat(7, 1fr)` (web), mobil = 2-3 ustun.
- `cartStore` (Zustand): `addItem`, `updateQty`, `setPrice`, `applyDiscount`, `removeItem`.
- Joy: `POS.jsx` + `ProductGrid.jsx` + `Cart.jsx` + `Numpad.jsx`.

---

## Ekran 3 / 17 — Mahsulot tahrirlash / yaratish (Редактировать / Новый товар)

### (a) Ekranda nima bor
- `Название товара` — nom
- `Штрихкод` — shtrixkod (input + ▦ scanner)
- `Track Inventory` — qoldiq kuzatish (checkbox, ?-tooltip)
- `Цена продажи` — sotuv narxi
- `Налоги на продажи` — soliq % (pill, masalan 12%) → `(= ... Вкл. налоги)` hisob
- `Категория POS` — POS kategoriya tanlash (pill)
- `Цвет` — rang tanlash (dumaloq)
- Yaratishda: kamera ikoni bilan rasm yuklash maydoni
- `Сохранить` / `Отменить`

### (b) Backend
`PUT /products/:id` / `POST /products` `{ name, barcode, trackInventory, price, taxPercent, posCategoryId, color, imageUrl }`

### (c) Frontend
Modal forma. Soliq tanlanganda narx avtomatik qayta hisoblanadi (= narx × (1+soliq)).

### (d) Bizga moslash
- Mahsulot modeliga qo'shish: `posCategoryId`, `color`, `taxPercent`, `trackInventory`.
- Rasm — mavjud Firebase storage.
- Joy: `ProductFormModal.jsx`.

---

## Ekran 4 — Parallel cheklar + kontekst menyu (☰)

### (a) Ekranda nima bor
- Tepada bir nechta chek: `1001` `1002` `1003` (parallel ochiq savatlar)
- `➕` — yana yangi chek
- O'ng menyu ochilgan:
  - `Дисплей клиента` — mijoz ekrani
  - `Switch to Light/Dark Mode` — tema
  - `Установить приложение` — PWA o'rnatish
  - `Поступления/выплаты` — Cash In/Out
  - `Reload Data` — ma'lumot yangilash
  - `Create Product` — tez mahsulot yaratish
  - `Бэкэнд (Backend)` — admin panelga o'tish
  - `Закрыть кассу` — smena yopish
- Mahsulot kartalarida badge sonlari (savatdagi miqdor)

### (b) Backend
Har chek = alohida `Order{ status:DRAFT }`. Bir sotuvchi bir vaqtda bir nechta.

### (c) Frontend
Chek tablari almashtiriladi — har biri o'z savati. Menyu = sozlamalar + amallar.

### (d) Bizga moslash
- **Parked orders**: bitta sotuvchi bir nechta savat tuta oladi (mijoz navbatda kutsa).
- `cartStore` → bir nechta savat massivi `[{id, items}]`.
- Menyu: tema, smena yopish, Cash In/Out, backend.
- Joy: `OrderTabs.jsx` + `PosMenu.jsx`.

---

## Ekran 5 / 6 — To'lov ekrani (Оплата)

### (a) Ekranda nima bor
- Chap: to'lov usullari ro'yxati — `Наличные`, `Карта`, `Аккаунт клиента` (scroll)
- `Клиент` tugma + `Счет` (chek/invoice checkbox)
- Raqamli klaviatura: `1-9`, `0`, `+/-`, `,`, `⌫`
- Tezkor summa tugmalari: `+10`, `+20`, `+50` (yashil)
- `Назад` | `Наличные` (tasdiq, binafsha)
- O'ngda: katta to'lanadigan summa (`691,94 лв`)

### (b) Backend
`POST /orders/:id/pay { payments:[{method, amount}] }`

### (c) Frontend
Usul tanlanadi → summa kiritiladi (yoki tezkor tugma) → tasdiq.

### (d) Bizga moslash
- To'lov usullari: Naqd / Karta / Mijoz hisobi.
- Tezkor summa tugmalari (Qirg'iziston som uchun: +100/+500/+1000).
- Joy: `PaymentScreen.jsx`.

---

## Ekran 8 — Aralash to'lov (Split payment)

### (a) Ekranda nima bor
- Bir chek bir nechta usul bilan: `Аккаунт клиента 200,00` + `Карта 10,00` + `Наличные 50,00`
- Har usul yonida ✖ (o'chirish)
- `Осталось 431,94 лв` — qolgan summa (qizil)
- `Подтвердить` — qoldiq 0 bo'lsa faollashadi

### (b) Backend
`payments[]` massiv — har element `{method, amount}`. Server qoldiqni tekshiradi.

### (c) Frontend
Har usulga summa qo'shiladi, qoldiq jonli hisoblanadi. Qoldiq ≤ 0 = tasdiq mumkin.

### (d) Bizga moslash
- To'lovda bir nechta usul + jonli qoldiq.
- Naqd ortiqcha bo'lsa = qaytim hisobi.

---

## Ekran 9 — To'lov tasdiqi (Выплаченная Сумма)

### (a) Ekranda nima bor
- Katta to'langan summa
- `Назад` | `Печать` (chek chiqarish) | `Send Receipt` (yuborish) | `Продолжить`

### (b) Backend
`Order{ status:PAID }`. Stok kamayadi. Chek raqami beriladi.

### (c) Frontend
Chek print yoki SMS/email yuborish. Продолжить = yangi savdo.

### (d) Bizga moslash
- `Send Receipt` → **Android SMS Gateway** (tablet) orqali mijozga SMS.
- Print — ixtiyoriy.

---

## Ekran 7 / 15 — Mijoz yaratish va tanlash

### (a) Ekranda nima bor
**Yaratish (Create Partner):** Nom, Company Employer, Email, Phone, Адрес (Street/City/State/ZIP/Страна), TIN, Штрихкод, Теги (B2B/VIP).
**Tanlash (Choose Customer):**
- 🔍 `Поиск клиентов`
- Har mijoz: nom, davlat, email/telefon, `Total due: ... лв` (qarz)
- `ВЫБРАТЬ` + ☰ menyu (`Edit Details`, `All Orders`, `Settle invoices`)
- `Создать` — yangi mijoz

### (b) Backend
`POST /customers`, `GET /customers?search=`, `GET /customers/:id/due`

### (c) Frontend
Mijoz tanlanadi → savatga biriktiriladi. Total due = qarz ko'rsatkichi.

### (d) Bizga moslash
- Mijoz modeli + **`totalDue`** (qarz hisobi — muhim, 5-6 sotuvchi uchun).
- `Settle invoices` = qarz to'lash.
- Joy: `CustomerModal.jsx`.

---

## Ekran 10 — Buyurtmalar ro'yxati (Заказы)

### (a) Ekranda nima bor
- 🔍 `Поиск заказов`
- Filter dropdown: `Активный`, `Текущие`, `Поступления`, `Оплата`, `Оплачено`
- `1-2 / 2` paginatsiya + ‹ › strelka
- Har qator: sana/vaqt, chek raqami (1002), tashqi raqam (261-2-000002), mijoz, summa, status, ℹ (detal)
- O'ngda: "Select an order or scan QR code" (QR skaner)

### (b) Backend
`GET /orders?status=&search=&page=`

### (c) Frontend
Filtrlanadi. Qator bosilsa — detal modali. QR skaner orqali ham.

### (d) Bizga moslash
- Savdolar ro'yxati + status filter + qidiruv + paginatsiya.
- Joy: `Orders.jsx`.

---

## Ekran 16 — Buyurtma detali (Order Details)

### (a) Ekranda nima bor
- `Served By` (sotuvchi), `Клиент`, `Order Time`
- `Customer Info`: Имя, Email, Адрес
- `Payment Info`: summa (yashil) + `Edit Payment`, Дата платежа, Режим (Наличные), Сумма
- `Закрыть`

### (b) Backend
`GET /orders/:id`, `PUT /orders/:id/payment` (Edit Payment)

### (c) Frontend
To'liq savdo ma'lumoti modal. To'lovni tahrirlash mumkin.

### (d) Bizga moslash
- Savdo detali modali. `Edit Payment` — admin uchun.
- Joy: `OrderDetailModal.jsx`.

---

## Ekran 11 / 12 — Smena yopish (Закрытие кассы)

### (a) Ekranda nima bor
- Sarlavha: `2 orders: 1 904,68 лв`
- Har usul bo'yicha (Наличные / Карта / Аккаунт клиента):
  - `Открытие` (boshlang'ich)
  - `Payments in ...` (kelgan to'lov)
  - `Ввод / вывод наличных` (cash in/out)
  - `Подсчитано` (sanab chiqilgan)
  - `Разница` (farq)
- `Подсчет наличности` — naqd sanash input + 💵
- `Закрыть кассу` | `Отменить` | `Поступления/выплаты` | `Daily Sale ⬇`

### (b) Backend
`POST /sessions/:id/close { countedCash }` → farq hisoblanadi, smena yopiladi.

### (c) Frontend
Sotuvchi naqdni sanaydi, farq ko'rinadi. Daily Sale = kunlik hisobot eksport.

### (d) Bizga moslash
- Smena yopish hisoboti: usul bo'yicha kutilgan vs sanalgan, farq.
- Joy: `CloseSessionModal.jsx`.

---

## Ekran 13 — Cash In / Out (Поступления/выплаты)

### (a) Ekranda nima bor
- `Cash In` (yashil) / `Cash Out` toggle
- Summa input (лв) + ✖
- `Причина` (sabab, textarea)
- `Подтвердить` | `Отменить` | `Детали`

### (b) Backend
`POST /cash-movements { sessionId, type:IN|OUT, amount, reason }`

### (c) Frontend
Kassadan naqd kirim/chiqim sababi bilan qayd qilinadi.

### (d) Bizga moslash
- `CashMovement` modeli. Smena yopishda hisobga olinadi.
- Joy: `CashMovementModal.jsx`.

---

## Ekran 14 — Mahsulot variantlari (Options)

### (a) Ekranda nima bor
- `Corner Desk Right Sit | 164,64 лв`
- `Options`: Drawers `+250`, File cabinets `+300`, Under-desk pedestals `+75`, Overhead shelves `+225`
- `Добавить` | `Отменить`

### (b) Backend
Mahsulot + qo'shimcha opsiyalar (narxga qo'shiladi).

### (c) Frontend
Mahsulot variantli bo'lsa — savatga qo'shishdan oldin opsiya tanlanadi.

### (d) Bizga moslash
- **Ixtiyoriy / keyinroq.** Qurilish materiallari uchun (masalan o'lcham/rang) kerak bo'lishi mumkin.

---

## Ekran 18 — Backend: smena karta (Сессия POS)

### (a) Ekranda nima bor
- `Магазин мебели/00001`
- Bosqich: `В процессе → Закрытие контроля → Закрыто и опубликовано`
- KPI: `Заказы 6`, `Pickings 6`, `Платежи 11 060,89`, `Статьи из журнала`, `Кассовый аппарат`
- `Открыто` (kim), `Торговая точка`, `Дата открытия`, `Начальный баланс`
- O'ng: xabarlar log (Opening/Closing cash difference, expected, counted)

### (b) Backend
`GET /sessions/:id` — to'liq smena ma'lumoti + log.

### (c) Frontend
Admin smenalarni ko'radi, nazorat qiladi.

### (d) Bizga moslash
- Admin panel: smenalar ro'yxati + detal + farq log.
- Joy: `admin/Sessions.jsx`.

---

## Ekran 19 — Backend: buyurtmalar jadvali

### (a) Ekranda nima bor
- Ustunlar: `Заказ Ref`, `Дата`, `Торговая точка`, `Номер квитанции`, `Клиент`, `Кассир`, `Всего`, `Статус` (Опубликовано/Оплачено), `Статус счета`
- Pastda jami summa
- 🔍 qidiruv + filter

### (b) Backend
`GET /orders` (admin, to'liq, filtr+sort).

### (c) Frontend
Jadval ko'rinish, status rangli badge.

### (d) Bizga moslash
- Admin: barcha savdolar jadvali.
- Joy: `admin/Orders.jsx`.

---

## Ekran 20 — Ombor: kirim (Поступления)

### (a) Ekranda nima bor
- `Новый Поступления`
- Bosqich: `Черновик → Подтверждение → Готово`
- `Mark as To Do`, `Подтвердить`, `Отменить`
- `Получить от` (kimdan), `Тип операции`, `Планируемая дата`, `Исходный документ` (PO0032)
- Tablar: `Операции`, `Дополнительная информация`, `Заметка`
- Jadval: `Товар`, `Спрос` (miqdor), 🗑
- `Добавить товар`

### (b) Backend
`POST /stock-receipts { supplier, date, lines:[{productId, qty}] }` → tasdiqlanganda **stok ortadi**.

### (c) Frontend
Yangi kirim → mahsulot+miqdor qo'shiladi → tasdiq → qoldiq ortadi.

### (d) Bizga moslash
- `StockReceipt` modeli (kirim). Tasdiqda `Product.stock += qty`.
- Joy: `admin/StockReceipt.jsx`.

---

## Ekran 21 — Mahsulotlar katalogi (Товары)

### (a) Ekranda nima bor
- `Новое` tugma + 🔍 qidiruv + filter (Товары)
- `1-36 / 36` paginatsiya
- Karta/jadval ko'rinish toggle (o'ng yuqorida)
- Har karta: ⭐ favorit, nom, kod (`[E-COM11]`, `[FURN_7800]`), `2 Варианты`, `Цена: ...`, `В наличии: ...` (qoldiq), rasm

### (b) Backend
`GET /products` (admin, kod+qoldiq bilan).

### (c) Frontend
Karta yoki jadval. Qoldiq ko'rinadi. Variantli mahsulotlar belgilangan.

### (d) Bizga moslash
- Mahsulotlar sahifasi: qoldiq + kod + qidiruv. Karta/jadval toggle.
- Joy: `admin/Products.jsx`.

---

## Ekran 22 / 23 — Dashboard (Отчет)

### (a) Ekranda nima bor
- KPI kartalar: `Заказы 6`, `Доход 11 061`, `Средняя стоимость 1 843` (har biri `↑% с прошлого периода`)
- Grafik: `Заказы по месяцам` (chiziqli, oylik)
- `Лучшие заказы` (top savdolar)

### (b) Backend
`GET /reports/dashboard` — KPI + oylik agregatsiya.

### (c) Frontend
KPI + grafik + top ro'yxat.

### (d) Bizga moslash
- Admin dashboard: KPI + oylik grafik (recharts).
- Joy: `admin/Dashboard.jsx`.

---

# UMUMIY MOSLASH PLANI (prioritet bo'yicha)

| # | Vazifa | Asosiy fayllar | Backend |
|---|--------|----------------|---------|
| B1 | **POS bitta ekran** (logik xato) | POS.jsx, ProductGrid, Cart, Numpad | GET /products, /pos-categories |
| B2 | To'lov ekrani | PaymentScreen.jsx | POST /orders/:id/pay |
| B3 | Smena (ochish/yopish/cash) | OpenSession, CloseSession, CashMovement | CashSession, CashMovement modellari |
| B4 | Parallel cheklar + buyurtmalar | OrderTabs, Orders, OrderDetail | GET /orders (filter) |
| B5 | Mahsulot/Mijoz forma | ProductForm, CustomerModal | posCategory, color, tax, totalDue |
| B6 | Ombor kirim | admin/StockReceipt | StockReceipt modeli |
| B7 | Admin dashboard | admin/Dashboard, Sessions | GET /reports/dashboard |
| B8 | Dizayn (Odoo uslubi) | tema, rangli kategoriya, kartalar | — |

**Birinchi qadam:** B1 — Web POS ekran. Bu sizning asosiy muammoyingizni (murakkab savdo oqimi) hal qiladi.

**Eslatma — Qirg'iziston:** valyuta = **som (KGS)**, лв emas. Soliq stavkalari mahalliy. Tezkor summa tugmalari som uchun (+100/+500/+1000).
