import { rawPrisma } from "../config/db.js";
import { getOrgId } from "../config/tenant.js";

// Пишем через rawPrisma + organizationId из контекста: audit вызывается и при LOGIN,
// когда org-контекста ещё нет (тогда organizationId = null — системное событие).
export const audit = async (userId, action, entity, entityId = null, oldData = null, newData = null, req = null) => {
  try {
    const ip = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress || null) : null;
    const userAgent = req ? (req.headers["user-agent"] || null) : null;
    await rawPrisma.auditLog.create({
      data: { userId, action, entity, entityId, oldData, newData, ip, userAgent, organizationId: getOrgId() },
    });
  } catch (err) {
    console.error("Audit log xatosi:", err.message);
  }
};
