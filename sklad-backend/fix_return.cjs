const fs = require("fs");
let c = fs.readFileSync("src/modules/sales/sales.service.js", "utf8");
c = c.replace(
  `export const kassaReturn = async (saleId, reason) => {
  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) throw { status: 404, message: "Sotuv topilmadi" };
  return prisma.sale.update({
    where: { id: saleId },
    data: { status: "RETURNED" },
    include: { client: true, user: true, items: { include: { product: true } } }
  });
};`,
  `export const kassaReturn = async (saleId, reason) => {
  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) throw { status: 404, message: "Sotuv topilmadi" };
  if (sale.status === "COMPLETED") {
    for (const item of sale.items) {
      await prisma.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
    }
  }
  return prisma.sale.update({
    where: { id: saleId },
    data: { status: "RETURNED", returnReason: reason || "" },
    include: { client: true, user: true, items: { include: { product: true } } }
  });
};`
);
fs.writeFileSync("src/modules/sales/sales.service.js", c);
console.log("OK");
