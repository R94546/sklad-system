import prisma from "../../config/db.js";
import { uploadImage } from "../../utils/upload.js";
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
export const create = async (data, file) => {
  let imageUrl = null;
  if (file) imageUrl = await uploadImage(file, "products");
  return prisma.product.create({
    data: {
      ...data,
      buyPrice: Number(data.buyPrice),
      sellPrice: Number(data.sellPrice),
      quantity: parseInt(data.quantity),
      minStock: parseInt(data.minStock) || 10,
      ...(imageUrl && { imageUrl }),
    },
    include: { category: true },
  });
};
export const update = async (id, data, file) => {
  let imageUrl = undefined;
  if (file) imageUrl = await uploadImage(file, "products");
  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      buyPrice: data.buyPrice ? Number(data.buyPrice) : undefined,
      sellPrice: data.sellPrice ? Number(data.sellPrice) : undefined,
      quantity: data.quantity ? parseInt(data.quantity) : undefined,
      minStock: data.minStock ? parseInt(data.minStock) : undefined,
      ...(imageUrl && { imageUrl }),
    },
    include: { category: true },
  });
};
export const remove = async (id) => {
  return prisma.product.update({ where: { id }, data: { isActive: false } });
};
export const getLowStock = async () => {
  return prisma.product.findMany({ where: { isActive: true }, include: { category: true } });
};
