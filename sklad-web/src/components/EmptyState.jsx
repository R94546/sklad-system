import { Package, Users, ShoppingCart, CreditCard, Tag, ClipboardList, Inbox } from "lucide-react";

const ICONS = {
  products: Package,
  clients: Users,
  sales: ShoppingCart,
  debts: CreditCard,
  categories: Tag,
  audit: ClipboardList,
  default: Inbox,
};

export default function EmptyState({ type = "default", title, description, action }) {
  const Icon = ICONS[type] || ICONS.default;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title || "Ничего не найдено"}</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mb-4">{description || "Здесь пока пусто"}</p>
      {action && (
        <button onClick={action.onClick} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          {action.label}
        </button>
      )}
    </div>
  );
}
