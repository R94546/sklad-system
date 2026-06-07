import * as service from "./sessions.service.js";
import { success, error } from "../../utils/response.js";
import { audit } from "../../utils/audit.js";

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    success(res, data);
  } catch (e) {
    error(res, e.message || "Ошибка", e.status || 500);
  }
};

export const getCurrentHandler = handle((req) => service.getCurrent(req.user.id));

export const openHandler = handle(async (req) => {
  const session = await service.open(req.user.id, req.body);
  await audit(req.user.id, "OPEN_SESSION", "CashSession", session.id, null, session, req);
  return session;
});

export const closeHandler = handle(async (req) => {
  const session = await service.close(req.params.id, req.body);
  await audit(req.user.id, "CLOSE_SESSION", "CashSession", session.id, null, session, req);
  return session;
});

export const movementHandler = handle(async (req) => {
  const mv = await service.createMovement(req.body);
  await audit(req.user.id, "CASH_" + mv.type, "CashMovement", mv.id, null, mv, req);
  return mv;
});

export const getByIdHandler = handle((req) => service.getById(req.params.id));

export const getAllHandler = handle((req) => service.getAll(req.query));
