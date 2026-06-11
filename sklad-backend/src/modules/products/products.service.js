import prisma from "../../config/db.js";
import { uploadImage } from "../../utils/upload.js";
import { generateBarcode } from "./barcode.service.js";

export const getAll = async (query) => {
  const { search, categoryId, page = 1, limit = 20 } = query;
  const where = {
    isActive: true,
    ...(search && { name: { contains: search, mode: "insensitive" } }),
    ...(categoryId && { categoryId }),
  };
  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, include: { category: true }, skip: (page - 1) * limit, take: Number(limit), orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where }),
  ]);
  return { data, total, page: Number(page), limit: Number(limit) };
};

export const getById = async (id) => {
  return prisma.product.findUnique({ where: { id }, include: { category: true } });
};

export const getByBarcode = async (barcode) => {
  return prisma.product.findUnique({ where: { barcode }, include: { category: true } });
};

const has = (v) => v !== undefined && v !== null && v !== "";

export const create = async (data, file) => {
  let imageUrl = null;
  if (file) imageUrl = await uploadImage(file, "products");
  const barcode = data.barcode || await generateBarcode();
  return prisma.product.create({
    data: {
      name: data.name,
      categoryId: data.categoryId,
      unit: data.unit || "PIECE",
      barcode,
      buyPrice: Number(data.buyPrice),
      sellPrice: Number(data.sellPrice),
      quantity: has(data.quantity) ? Number(data.quantity) : 0,
      minStock: has(data.minStock) ? Number(data.minStock) : 10,
      imageUrl: imageUrl ?? data.imageUrl ?? null,
    },
    include: { category: true },
  });
};

export const update = async (id, data, file) => {
  let imageUrl;
  if (file) imageUrl = await uploadImage(file, "products");
  // Явные поля + проверка через has() — чтобы значения 0 (количество/мин.остаток) сохранялись
  const d = {};
  if (data.name !== undefined) d.name = data.name;
  if (data.categoryId !== undefined) d.categoryId = data.categoryId;
  if (data.unit !== undefined) d.unit = data.unit;
  if (data.barcode !== undefined) d.barcode = data.barcode || null;
  if (has(data.buyPrice)) d.buyPrice = Number(data.buyPrice);
  if (has(data.sellPrice)) d.sellPrice = Number(data.sellPrice);
  if (has(data.quantity)) d.quantity = Number(data.quantity);
  if (has(data.minStock)) d.minStock = Number(data.minStock);
  if (imageUrl !== undefined) d.imageUrl = imageUrl;
  else if (data.imageUrl !== undefined) d.imageUrl = data.imageUrl;
  return prisma.product.update({ where: { id }, data: d, include: { category: true } });
};

export const remove = async (id) => {
  return prisma.product.update({ where: { id }, data: { isActive: false } });
};

export const getLowStock = async () => {
  // Только товары с остатком <= минимума (сравнение двух полей Prisma where не умеет)
  const products = await prisma.product.findMany({ where: { isActive: true }, include: { category: true } });
  return products.filter((p) => Number(p.quantity) <= Number(p.minStock)).sort((a, b) => Number(a.quantity) - Number(b.quantity));
};
