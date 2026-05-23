const fs = require("fs");

const pages = [
  { file: "src/pages/Products.jsx", type: "products", title: "Mahsulotlar topilmadi", desc: "Yangi mahsulot qoshish uchun + tugmasini bosing" },
  { file: "src/pages/Sales.jsx", type: "sales", title: "Sotuvlar topilmadi", desc: "Yangi sotuv qoshish uchun tugmani bosing" },
  { file: "src/pages/Clients.jsx", type: "clients", title: "Mijozlar topilmadi", desc: "Yangi mijoz qoshish uchun + tugmasini bosing" },
  { file: "src/pages/Debts.jsx", type: "debts", title: "Nasiyalar topilmadi", desc: "Hozircha nasiyalar yoq" },
  { file: "src/pages/Categories.jsx", type: "categories", title: "Kategoriyalar topilmadi", desc: "Yangi kategoriya qoshish uchun + tugmasini bosing" },
];

for (const page of pages) {
  let c = fs.readFileSync(page.file, "utf8");
  
  if (!c.includes("EmptyState")) {
    c = c.replace(
      /^(import .+from ".+";)\n/m,
      `$1\nimport EmptyState from "../components/EmptyState";\n`
    );
  }
  
  c = c.replace(
    /<tr><td colSpan=\{\d+\} className="px-4 py-12 text-center text-slate-400">[^<]+<\/td><\/tr>/g,
    `<tr><td colSpan={99} className="py-2"><EmptyState type="${page.type}" title="${page.title}" desc="${page.desc}" /></td></tr>`
  );

  c = c.replace(
    /<p className="text-center text-slate-400 py-12">[^<]+<\/p>/g,
    `<EmptyState type="${page.type}" title="${page.title}" />`
  );

  fs.writeFileSync(page.file, c);
  console.log("OK:", page.file);
}
