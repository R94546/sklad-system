import bwipjs from "bwip-js";
import prisma from "../../config/db.js";

// EAN-13 uchun tekshiruv raqami hisoblash
function calcEAN13Check(digits12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

// Noyob EAN-13 kod generatsiya
export const generateBarcode = async () => {
  let barcode;
  let exists = true;
  while (exists) {
    // Prefix: 200 (ichki tovarlar), 9 ta random raqam
    const rand = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, "0");
    const digits12 = "200" + rand;
    const check = calcEAN13Check(digits12);
    barcode = digits12 + check;
    const found = await prisma.product.findUnique({ where: { barcode } });
    exists = !!found;
  }
  return barcode;
};

// Barcode bo'yicha tovar qidirish
export const findByBarcode = async (barcode) => {
  const product = await prisma.product.findUnique({
    where: { barcode },
    include: { category: true },
  });
  return product;
};

// Barcode PNG rasm generatsiya (base64)
export const generateBarcodeImage = async (barcode, format = "ean13") => {
  const png = await bwipjs.toBuffer({
    bcid: format,
    text: barcode,
    scale: 3,
    height: 15,
    includetext: true,
    textxalign: "center",
  });
  return "data:image/png;base64," + png.toString("base64");
};

// Tovarga barcode biriktirish
export const assignBarcode = async (productId, barcode) => {
  return prisma.product.update({
    where: { id: productId },
    data: { barcode },
    include: { category: true },
  });
};
