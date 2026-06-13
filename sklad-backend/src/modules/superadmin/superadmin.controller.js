import * as svc from './superadmin.service.js';
import { success } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    return success(res, await svc.listOrganizations());
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    return success(res, await svc.createOrganization(req.body), 'Sklad yaratildi', 201);
  } catch (err) { next(err); }
};

export const setActive = async (req, res, next) => {
  try {
    return success(res, await svc.setOrganizationActive(req.params.id, req.body.isActive));
  } catch (err) { next(err); }
};
