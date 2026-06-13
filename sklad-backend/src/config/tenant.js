import { AsyncLocalStorage } from 'node:async_hooks';

// Контекст текущего арендатора (organizationId) на время обработки запроса.
// Устанавливается в authMiddleware через tenantContext.run(...).
export const tenantContext = new AsyncLocalStorage();

export const getOrgId = () => tenantContext.getStore()?.organizationId ?? null;

// Модели, scoped по organizationId. Всё, что НЕ здесь (RefreshToken, Organization),
// extension не трогает.
const TENANT_MODELS = new Set([
  'User', 'Category', 'Product', 'Client', 'Sale', 'SaleItem',
  'Debt', 'DebtPayment', 'StockIn', 'CashSession', 'CashMovement',
  'AuditLog', 'Settings',
]);

const orgError = () => {
  const e = new Error('Tenant konteksti aniqlanmadi');
  e.status = 401;
  return e;
};

// Оборачивает Prisma-клиент авто-фильтром по организации. Чтения и записи
// автоматически ограничиваются текущей организацией — забыть фильтр невозможно,
// поэтому между складами нет утечки данных (fail-closed: без org-контекста — ошибка).
//
// Полагается на extendedWhereUnique (GA в Prisma 5+, поэтому findUnique/update/
// delete/upsert принимают дополнительный organizationId в where рядом с unique-полем).
export const withTenant = (base) =>
  base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          const orgId = getOrgId();
          if (!orgId) throw orgError();

          if (operation === 'create') {
            args.data = { ...args.data, organizationId: orgId };
          } else if (operation === 'createMany' || operation === 'createManyAndReturn') {
            const rows = Array.isArray(args.data) ? args.data : [args.data];
            args.data = rows.map((d) => ({ ...d, organizationId: orgId }));
          } else if (operation === 'upsert') {
            args.where = { ...args.where, organizationId: orgId };
            args.create = { ...args.create, organizationId: orgId };
          } else {
            // find*/count/aggregate/groupBy/update*/delete* — все принимают where
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
      },
    },
  });
