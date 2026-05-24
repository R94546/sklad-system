import prisma from "../config/db.js";
export const audit = async (userId, action, entity, entityId = null, oldData = null, newData = null, req = null) => {
  try {
    const ip = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress || null) : null;
    const userAgent = req ? (req.headers["user-agent"] || null) : null;
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldData, newData, ip, userAgent },
    });
  } catch (err) {
    console.error("Audit log xatosi:", err.message);
  }
};
