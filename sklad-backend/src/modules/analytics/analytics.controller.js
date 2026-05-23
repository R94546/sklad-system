import * as analyticsService from './analytics.service.js';
import { success } from '../../utils/response.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboard();
    return success(res, data);
  } catch (err) { next(err); }
};

export const getSalesChart = async (req, res, next) => {
  try {
    const data = await analyticsService.getSalesChart(req.query.period);
    return success(res, data);
  } catch (err) { next(err); }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const data = await analyticsService.getTopProducts();
    return success(res, data);
  } catch (err) { next(err); }
};

export const getSellerStats = async (req, res, next) => {
  try {
    const data = await analyticsService.getSellerStats();
    return success(res, data);
  } catch (err) { next(err); }
};
export const getTopProfitProducts = async (req, res, next) => {
  try {
    const data = await analyticsService.getTopProfitProducts();
    return success(res, data);
  } catch (err) { next(err); }
};

export const getSellerDashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getSellerDashboard(req.user.id);
    return success(res, data);
  } catch (err) { next(err); }
};

