import { useState, useEffect } from "react";
import { X, Banknote, ArrowDownCircle, ArrowUpCircle, LogOut, Lock, RefreshCw } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("ru-RU");

/* ===== Касса закрыта (экран продавца): открыть может только админ ===== */
export function KassaClosedScreen({ onConnected, onExit }) {
  const [checking, setChecking] = useState(false);

  const recheck = async () => {
    setChecking(true);
    try {
      const r = await api.get("/sessions/current");
      if (r.data.data) { toast.success("Касса открыта — подключено"); onConnected(r.data.data); }
      else toast.error("Касса ещё не открыта");
    } catch { toast.error("Ошибка"); }
    setChecking(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Lock size={26} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Касса закрыта</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Кассу открывает администратор. Когда касса будет открыта, нажмите «Подключиться».
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onExit} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <LogOut size={16} /> Выйти
          </button>
          <button onClick={recheck} disabled={checking} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#714B67] hover:bg-[#5d3d54] text-white font-bold transition disabled:opacity-50">
            <RefreshCw size={16} className={checking ? "animate-spin" : ""} /> Подключиться
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Открытие кассы (обязательно при входе в POS) ===== */
export function OpenSessionModal({ onOpened, onCancel }) {
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const open = async () => {
    setSaving(true);
    try {
      const r = await api.post("/sessions/open", { openingCash: Number(cash) || 0, note });
      toast.success("Касса открыта");
      onOpened(r.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Ошибка");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Управление открыванием</h2>

        <div>
          <label className="text-sm text-slate-500 dark:text-slate-400">Денежные средства на начало периода</label>
          <div className="relative mt-1.5">
            <Banknote size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number" autoFocus value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0"
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500 dark:text-slate-400">Вступительная заметка</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Добавьте заметку..."
            className="w-full mt-1.5 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={open} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#714B67] hover:bg-[#5d3d54] text-white font-bold transition disabled:opacity-50">
            {saving ? "..." : "Открыть кассу"}
          </button>
          <button onClick={onCancel} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Закрытие кассы (ожидаемое vs подсчитано) ===== */
export function CloseSessionModal({ session, onClosed, onClose }) {
  const [detail, setDetail] = useState(null);
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/sessions/" + session.id).then((r) => setDetail(r.data.data)).catch(() => {});
  }, [session.id]);

  const expected = detail?.expectedCash ?? 0;
  const diff = (Number(counted) || 0) - expected;

  const close = async () => {
    setSaving(true);
    try {
      await api.post("/sessions/" + session.id + "/close", { closingCash: Number(counted) || 0, note });
      toast.success("Касса закрыта");
      onClosed();
    } catch (e) {
      toast.error(e.response?.data?.message || "Ошибка");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white">Закрытие кассы</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-3">
          <Row label="Открытие" value={fmt(detail?.openingCash ?? session.openingCash) + " сом"} />
          <Row label="Продажи (наличные учтены)" value={fmt(detail?.salesTotal ?? 0) + " сом"} />
          <Row label="Ожидаемая наличность" value={fmt(expected) + " сом"} bold />

          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400">Подсчёт наличности</label>
            <input type="number" autoFocus value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="0"
              className="w-full mt-1.5 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {counted !== "" && (
            <div className={"flex justify-between items-baseline px-3 py-2 rounded-lg " + (diff === 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10")}>
              <span className="font-medium text-slate-600 dark:text-slate-300">Разница</span>
              <span className={"text-xl font-extrabold tabular-nums " + (diff === 0 ? "text-emerald-500" : "text-rose-500")}>
                {diff > 0 ? "+" : ""}{fmt(diff)} сом
              </span>
            </div>
          )}

          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Заметка при закрытии..."
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 resize-none" />

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition">Отмена</button>
            <button onClick={close} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#714B67] hover:bg-[#5d3d54] text-white font-bold transition disabled:opacity-50">
              {saving ? "..." : "Закрыть кассу"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Поступления / выплаты (Cash In/Out) ===== */
export function CashMovementModal({ session, onClose, onDone }) {
  const [type, setType] = useState("IN");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!(Number(amount) > 0)) return toast.error("Введите сумму");
    setSaving(true);
    try {
      await api.post("/sessions/movements", { sessionId: session.id, type, amount: Number(amount), reason });
      toast.success(type === "IN" ? "Приход записан" : "Расход записан");
      onDone?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Ошибка");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white">Поступления / выплаты</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setType("IN")} className={"flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition " + (type === "IN" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-slate-200 dark:border-slate-600 text-slate-500")}>
              <ArrowDownCircle size={18} /> Приход
            </button>
            <button onClick={() => setType("OUT")} className={"flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition " + (type === "OUT" ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-slate-200 dark:border-slate-600 text-slate-500")}>
              <ArrowUpCircle size={18} /> Расход
            </button>
          </div>

          <input type="number" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />

          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Причина..."
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 resize-none" />

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition">Отмена</button>
            <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#714B67] hover:bg-[#5d3d54] text-white font-bold transition disabled:opacity-50">
              {saving ? "..." : "Подтвердить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={"tabular-nums " + (bold ? "text-lg font-bold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200")}>{value}</span>
    </div>
  );
}
