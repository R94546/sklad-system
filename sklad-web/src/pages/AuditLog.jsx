import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Badge } from "../components/ui";
import { Monitor, Smartphone, Tablet } from "lucide-react";

const ACTIONS = {
  CREATE: { label: "Yaratildi", variant: "green" },
  UPDATE: { label: "Yangilandi", variant: "blue" },
  DELETE: { label: "Ochirildi", variant: "red" },
  LOGIN:  { label: "Kirdi", variant: "purple" },
  LOGOUT: { label: "Chiqdi", variant: "gray" },
};

function getDevice(ua) {
  if (!ua) return { icon: <Monitor size={14} />, label: "Noma'lum" };
  if (/mobile|android|iphone/i.test(ua)) return { icon: <Smartphone size={14} />, label: "Telefon" };
  if (/tablet|ipad/i.test(ua)) return { icon: <Tablet size={14} />, label: "Planshet" };
  return { icon: <Monitor size={14} />, label: "Kompyuter" };
}

function getBrowser(ua) {
  if (!ua) return "-";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/edg/i.test(ua)) return "Edge";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Boshqa";
}

function Avatar({ name }) {
  const colors = ["bg-indigo-500","bg-purple-500","bg-pink-500","bg-blue-500","bg-green-500","bg-orange-500"];
  const color = colors[name?.charCodeAt(0) % colors.length] || "bg-slate-500";
  return (
    <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 " + color}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/audit?page=" + page + "&limit=" + limit);
      setLogs(res.data.data.data);
      setTotal(res.data.data.total);
    } catch { toast.error("Xatolik"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Audit log</h1>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Foydalanuvchi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ob'ekt</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qurilma</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {logs.map(log => {
                const device = getDevice(log.userAgent);
                const browser = getBrowser(log.userAgent);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.user?.name} />
                        <span className="font-medium text-slate-800 dark:text-white text-sm">{log.user?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ACTIONS[log.action]?.variant || "gray"}>{ACTIONS[log.action]?.label || log.action}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{log.entity}</span>
                      {log.entityId && <span className="ml-2 text-xs text-gray-400 font-mono">{log.entityId.slice(-8)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                        {device.icon}
                        <span>{device.label}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-400">{browser}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{log.ip || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">Jami: {total} ta yozuv</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 dark:bg-slate-700/50 disabled:opacity-50">Oldingi</button>
            <span className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 dark:bg-slate-700/50 disabled:opacity-50">Keyingi</button>
          </div>
        </div>
      )}
    </div>
  );
}
