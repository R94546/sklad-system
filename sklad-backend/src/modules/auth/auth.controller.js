import * as authService from "./auth.service.js";
import { success, error } from "../../utils/response.js";

export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return error(res, "Telefon va parol kiritilsin", 400);
    const data = await authService.login(phone, password, req);
    return success(res, data, "Muvaffaqiyatli kirildi");
  } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, "Token kiritilsin", 400);
    const data = await authService.refresh(refreshToken);
    return success(res, data);
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return success(res, null, "Chiqildi");
  } catch (err) { next(err); }
};

export const forceLogout = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await authService.forceLogout(userId);
    return success(res, null, "Foydalanuvchi chiqarildi");
  } catch (err) { next(err); }
};
