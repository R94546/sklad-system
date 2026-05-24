const fs = require("fs");
let c = fs.readFileSync("src/modules/sales/sales.service.js", "utf8");

// kassaConfirm da discount hisoblash
c = c.replace(
  'const finalTotal = total - Number(data.discount || 0);',
  `const discountType = data.discountType || "AMOUNT";
  const discountVal = Number(data.discount || 0);
  const discountAmount = discountType === "PERCENT" ? (total * discountVal / 100) : discountVal;
  const finalTotal = total - discountAmount;`
);

c = c.replace(
  'data: { status: "COMPLETED", paymentType: data.paymentType || "CASH", clientId: data.clientId || null, discount: Number(data.discount || 0), totalAmount: finalTotal },',
  'data: { status: "COMPLETED", paymentType: data.paymentType || "CASH", clientId: data.clientId || null, discount: discountAmount, discountType: discountType, totalAmount: finalTotal },'
);

// confirmCart da ham
c = c.replace(
  'const finalTotal = total - Number(data.discount || 0);\n  const updated = await prisma.sale.update({\n    where: { id: cartId },\n    data: { status: "COMPLETED", paymentType: data.paymentType || "CASH", clientId: data.clientId || null, discount: Number(data.discount || 0), totalAmount: finalTotal },',
  `const discountType2 = data.discountType || "AMOUNT";
  const discountVal2 = Number(data.discount || 0);
  const discountAmount2 = discountType2 === "PERCENT" ? (total * discountVal2 / 100) : discountVal2;
  const finalTotal = total - discountAmount2;
  const updated = await prisma.sale.update({
    where: { id: cartId },
    data: { status: "COMPLETED", paymentType: data.paymentType || "CASH", clientId: data.clientId || null, discount: discountAmount2, discountType: discountType2, totalAmount: finalTotal },`
);

fs.writeFileSync("src/modules/sales/sales.service.js", c);
console.log("OK");
