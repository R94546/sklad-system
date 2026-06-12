import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Badge, Select, Input, Button } from "../components/ui";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";

const ACTIONS = {
  LOGIN:  { label: "Вход в систему", variant: "purple" },
  LOGOUT: { label: "Выход", variant: "gray" },
  PRODUCT_CREATE: { label: "Товар создан", variant: "green" },
  PRODUCT_UPDATE: { label: "Товар изменён", variant: "blue" },
  PRODUCT_DELETE: { label: "Товар удалён", variant: "red" },
  INVENTORY_ADJUST: { label: "Инвентаризация (коррекция)", variant: "yellow" },
  STOCK_IN: { label: "Приход товара", variant: "green" },
  STOCK_EDIT: { label: "Приход изменён", variant: "blue" },
  STOCK_DELETE: { label: "Приход удалён", variant: "red" },
  CATEGORY_CREATE: { label: "Категория создана", variant: "green" },
  CATEGORY_UPDATE: { label: "Категория изменена", variant: "blue" },
  CATEGORY_DELETE: { label: "Категория удалена", variant: "red" },
  CLIENT_CREATE: { label: "Клиент создан", variant: "green" },
  CLIENT_UPDATE: { label: "Клиент изменён", variant: "blue" },
  CLIENT_BLOCK: { label: "Клиент заблокирован", variant: "red" },
  CLIENT_UNBLOCK: { label: "Клиент разблокирован", variant: "green" },
  USER_CREATE: { label: "Пользователь создан", variant: "green" },
  USER_UPDATE: { label: "Пользователь изменён", variant: "blue" },
  USER_DELETE: { label: "Пользователь отключён", variant: "red" },
  DEBT_PAY: { label: "Оплата долга", variant: "green" },
  SALE_CONFIRM: { label: "Продажа оформлена", variant: "green" },
  SALE_CANCEL: { label: "Продажа отменена", variant: "red" },
  SALE_RETURN: { label: "Возврат продажи", variant: "yellow" },
  SALE_DELETE: { label: "Чек удалён", variant: "red" },
  SALE_REOPEN: { label: "Продажа переоткрыта", variant: "yellow" },
  OPEN_SESSION: { label: "Касса открыта", variant: "green" },
  CLOSE_SESSION: { label: "Касса закрыта", variant: "gray" },
  SESSION_REOPEN: { label: "Касса переоткрыта", variant: "yellow" },
  CASH_IN: { label: "Внесение наличных", variant: "green" },
  CASH_OUT: { label: "Изъятие наличных", variant: "yellow" },
  // легаси-записи
  CREATE: { label: "Создано", variant: "green" },
  UPDATE: { label: "Обновлено", variant: "blue" },
  DELETE: { label: "Удалено", variant: "red" },
};

const ENTITIES = {
  Product: "Товар", Client: "Клиент", User: "Пользователь", Category: "Категория",
  Debt: "Долг", Sale: "Продажа", StockIn: "Приход", CashSession: "Касса", CashMovement: "Наличные (касса)",
};

const FIELDS = {
  name: "Название", phone: "Телефон", address: "Адрес", note: "Заметка",
  role: "Роль", isActive: "Активен", maxDiscountPercent: "Макс. скидка %",
  canEditPrice: "Может менять цену", imageUrl: "Фото", passwordChanged: "Пароль",
  barcode: "Штрих-код", category: "Категория", buyPrice: "Закупочная цена",
  sellPrice: "Цена продажи", quantity: "Остаток", minStock: "Мин. остаток", unit: "Ед. изм.",
  amount: "Сумма", paid: "Оплачено", method: "Способ оплаты", diff: "Разница",
  number: "Чек №", total: "Сумма", paymentType: "Оплата", productId: "Товар",
  price: "Цена", openingCash: "В кассе при открытии", closingCash: "Факт при закрытии",
  expectedCash: "Ожидалось", difference: "Расхождение", reason: "Причина", type: "Тип",
  openingNote: "Заметка (открытие)", closingNote: "Заметка (закрытие)", status: "Статус",
};

const VALUE_LABELS = {
  ADMIN: "Админ", SELLER: "Продавец", KASSIR: "Кассир",
  CASH: "Наличные", CARD: "Карта", DEBT: "Долг", MIXED: "Смешанно",
  PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор",
  IN: "Внесение", OUT: "Изъятие", OPEN: "Открыта", CLOSED: "Закрыта",
  PENDING: "Ожидает", PAID: "Оплачен", OVERDUE: "Просрочен", COMPLETED: "Завершён",
};

// Служебные поля, не интересные в журнале
const SKIP_FIELDS = new Set(["id", "sellerId", "sessionId", "userId", "debtId", "createdAt", "closedAt", "openedAt", "movements", "salesTotal", "sales"]);

const fmtVal = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  if (typeof v === "number") return v.toLocaleString("ru-RU");
  if (typeof v === "string" && VALUE_LABELS[v]) return VALUE_LABELS[v];
  if (typeof v === "string" && /^https?:\/\//.test(v)) return "ссылка";
  if (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "") return Number(v).toLocaleString("ru-RU");
  return String(v);
};

// Человекочитаемое описание: что именно сделано
function describe(log) {
  const o = log.oldData, n = log.newData;
  const parts = [];

  if (log.action === "INVENTORY_ADJUST" && o && n) {
    const d = Number(n.diff) || 0;
    return `Остаток: ${fmtVal(o.quantity)} → ${fmtVal(n.quantity)} (${d > 0 ? "+" : ""}${d.toLocaleString("ru-RU")})`;
  }
  if (log.action === "DEBT_PAY" && n) {
    return `Принято ${fmtVal(n.amount)} сом · ${fmtVal(n.method || "CASH")}`;
  }
  if (log.action === "SALE_CONFIRM" && n) {
    return `Чек №${n.number ?? "—"} · ${fmtVal(n.total)} сом · ${fmtVal(n.paymentType)}`;
  }
  if (log.action === "STOCK_IN" && n) {
    return `+${fmtVal(n.quantity)} по ${fmtVal(n.price)} сом`;
  }
  if ((log.action === "CASH_IN" || log.action === "CASH_OUT") && n) {
    return `${fmtVal(n.amount)} сом${n.reason ? " · " + n.reason : ""}`;
  }
  if (log.action === "OPEN_SESSION" && n) {
    return `В кассе при открытии: ${fmtVal(n.openingCash)} сом`;
  }
  if (log.action === "CLOSE_SESSION" && n) {
    const d = Number(n.difference) || 0;
    return `Факт ${fmtVal(n.closingCash)} · ожидалось ${fmtVal(n.expectedCash)} · расхождение ${d > 0 ? "+" : ""}${d.toLocaleString("ru-RU")}`;
  }

  // Изменение: показать только реально изменившиеся поля «было → стало»
  if (o && n && typeof o === "object" && typeof n === "object") {
    for (const k of Object.keys(n)) {
      if (SKIP_FIELDS.has(k)) continue;
      const a = o[k], b = n[k];
      if (k === "passwordChanged") { parts.push("Пароль изменён"); continue; }
      if (JSON.stringify(a) !== JSON.stringify(b)) parts.push(`${FIELDS[k] || k}: ${fmtVal(a)} → ${fmtVal(b)}`);
    }
    return parts.length ? parts.join("; ") : "Без изменений";
  }
  // Создание: ключевые поля
  if (n && typeof n === "object") {
    for (const k of Object.keys(n)) {
      if (SKIP_FIELDS.has(k)) continue;
      if (n[k] === null || n[k] === undefined || n[k] === "" || n[k] === 0 || n[k] === false) continue;
      parts.push(`${FIELDS[k] || k}: ${fmtVal(n[k])}`);
    }
    return parts.slice(0, 5).join("; ");
  }
  // Удаление: что было
  if (o && typeof o === "object") {
    const label = o.name ? `«${o.name}»` : "";
    return label ? `Был: ${label}` : "";
  }
  return "";
}

function getDevice(ua) {
  if (!ua) return { icon: <Monitor size={14} />, label: "Неизвестно" };
  if (/mobile|android|iphone/i.test(ua)) return { icon: <Smartphone size={14} />, label: "Телефон" };
  if (/tablet|ipad/i.test(ua)) return { icon: <Tablet size={14} />, label: "Планшет" };
  return { icon: <Monitor size={14} />, label: "Компьютер" };
}

function getBrowser(ua) {
  if (!ua) return "-";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/edg/i.test(ua)) return "Edge";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Другой";
}

function Avatar({ user }) {
  if (user?.imageUrl) return <img src={user.imageUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  const name = user?.name;
  const colors = ["bg-indigo-500","bg-purple-500","bg-pink-500","bg-blue-500","bg-green-500","bg-orange-500"];
  const color = colors[name?.charCodeAt(0) % colors.length] || "bg-slate-500";
  return (
    <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 " + color}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

const ACTION_OPTIONS = [{ value: "", label: "Все действия" },
  ...Object.entries(ACTIONS).filter(([k]) => !["CREATE","UPDATE","DELETE","LOGOUT"].includes(k)).map(([value, a]) => ({ value, label: a.label }))];
const ENTITY_OPTIONS = [{ value: "", label: "Все объекты" },
  ...Object.entries(ENTITIES).map(([value, label]) => ({ value, label }))];

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ action: "", entity: "", userId: "", dateFrom: "", dateTo: "" });
  const limit = 20;

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
      const res = await api.get("/audit?" + params.toString());
      setLogs(res.data.data.data);
      setTotal(res.data.data.total);
    } catch { toast.error("Ошибка"); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, filters]);
  useEffect(() => { api.get("/users").then(r => setUsers(r.data.data)).catch(() => {}); }, []);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Журнал</h1>

      {/* Фильтры */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Select value={filters.action} onChange={e => setFilter("action", e.target.value)} options={ACTION_OPTIONS} />
          <Select value={filters.entity} onChange={e => setFilter("entity", e.target.value)} options={ENTITY_OPTIONS} />
          <Select value={filters.userId} onChange={e => setFilter("userId", e.target.value)}
            options={[{ value: "", label: "Все пользователи" }, ...users.map(u => ({ value: u.id, label: u.name }))]} />
          <Input type="date" value={filters.dateFrom} onChange={e => setFilter("dateFrom", e.target.value)} />
          <div className="flex gap-2">
            <div className="flex-1"><Input type="date" value={filters.dateTo} onChange={e => setFilter("dateTo", e.target.value)} /></div>
            {hasFilters && (
              <Button variant="outline" onClick={() => { setFilters({ action: "", entity: "", userId: "", dateFrom: "", dateTo: "" }); setPage(1); }} title="Сбросить фильтры">
                <X size={15} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Записей не найдено</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Пользователь</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Действие</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Объект</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Детали</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Устройство</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {logs.map(log => {
                  const device = getDevice(log.userAgent);
                  const browser = getBrowser(log.userAgent);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar user={log.user} />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white text-sm whitespace-nowrap">{log.user?.name || "-"}</p>
                            <p className="text-[11px] text-slate-400">{log.user?.role === "ADMIN" ? "Админ" : "Продавец"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ACTIONS[log.action]?.variant || "gray"}>{ACTIONS[log.action]?.label || log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{ENTITIES[log.entity] || log.entity}</span>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{describe(log) || <span className="text-slate-300 dark:text-slate-600">—</span>}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {device.icon}<span>{device.label}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-400">{browser}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{log.ip || ""}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("ru-RU")}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">Всего: {total} записей</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 dark:bg-slate-700/50 disabled:opacity-50">Назад</button>
            <span className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 dark:bg-slate-700/50 disabled:opacity-50">Вперёд</button>
          </div>
        </div>
      )}
    </div>
  );
}
