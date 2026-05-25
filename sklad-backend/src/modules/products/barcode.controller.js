import * as barcodeService from "./barcode.service.js";
import { success, error } from "../../utils/response.js";

// Yangi barcode generatsiya qilish
export const generate = async (req, res, next) => {
  try {
    const barcode = await barcodeService.generateBarcode();
    const image = await barcodeService.generateBarcodeImage(barcode);
    return success(res, { barcode, image });
  } catch (err) { next(err); }
};

// Barcode bo'yicha tovar qidirish (skaner uchun)
export const scan = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const product = await barcodeService.findByBarcode(barcode);
    if (!product) return error(res, "Tovar topilmadi", 404);
    return success(res, product);
  } catch (err) { next(err); }
};

// Mavjud tovarga barcode biriktirish
export const assign = async (req, res, next) => {
  try {
    const { productId, barcode } = req.body;
    if (!productId || !barcode) return error(res, "productId va barcode kerak", 400);
    const product = await barcodeService.assignBarcode(productId, barcode);
    const image = await barcodeService.generateBarcodeImage(barcode);
    return success(res, { product, image });
  } catch (err) { next(err); }
};

// Barcode rasmini olish (mavjud barcode uchun)
export const getImage = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const image = await barcodeService.generateBarcodeImage(barcode);
    return success(res, { barcode, image });
  } catch (err) { next(err); }
};
