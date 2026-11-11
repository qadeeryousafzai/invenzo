import { PERMISSIONS } from "@/modules/businesses/permissions";

/**
 * The database stores permissions using a `.read` / `.write` scheme (e.g. `product.read`,
 * `product.write`), while the application layer authorizes against the `PERMISSIONS`
 * catalog which uses `.view` / `.create` / `.update` / `.delete` / `.manage` / `.adjust`.
 *
 * This map translates a stored database permission into the set of application permission
 * keys it grants, so a role saved with the legacy scheme works everywhere in the UI/API.
 */
const DB_TO_APP: Record<string, string[]> = {
  // Business / workspace
  "business.read": ["business.view"],
  "business.write": ["business.view", "business.update"],
  "settings.read": ["business.view"],
  "settings.write": ["business.update"],

  // Branches & warehouses
  "branch.read": ["branches.view"],
  "branch.write": ["branches.view", "branches.manage"],

  // Team, roles & users
  "user.read": ["employees.view"],
  "user.write": ["employees.view", "employees.manage"],
  "role.read": ["employees.view", "roles.manage"],
  "role.write": ["roles.manage"],

  // Products, categories & inventory
  "product.read": ["products.view", "inventory.view"],
  "product.write": ["products.view", "products.create", "products.update", "products.delete", "categories.manage", "inventory.adjust"],
  "category.read": ["products.view", "categories.manage"],
  "category.write": ["products.view", "categories.manage"],

  // Sales & customers
  "sale.read": ["sales.view", "customers.manage"],
  "sale.write": ["sales.view", "sales.create", "customers.manage"],
  "customer.read": ["sales.view", "customers.manage"],
  "customer.write": ["customers.manage"],

  // Purchases & suppliers
  "purchase.read": ["purchases.manage", "suppliers.manage"],
  "purchase.write": ["purchases.manage", "suppliers.manage"],
  "supplier.read": ["suppliers.manage", "purchases.manage"],
  "supplier.write": ["suppliers.manage", "purchases.manage"],

  // Finance
  "expense.read": ["finance.view", "expenses.manage"],
  "expense.write": ["finance.view", "expenses.manage"],
  "report.read": ["reports.view"],
};

const KNOWN_APP_KEYS = new Set(Object.keys(PERMISSIONS));

/** Translate a stored permission key into the application permission keys it grants. */
export function expandPermission(key: string): string[] {
  const mapped = DB_TO_APP[key];
  if (mapped) return mapped;
  // Already an application key (e.g. `products.view`)? Keep it as-is.
  if (KNOWN_APP_KEYS.has(key)) return [key];
  return [];
}

/** Translate a full list of stored permission keys into the application permission set. */
export function expandPermissions(keys: Iterable<string>): Set<string> {
  const result = new Set<string>();
  for (const key of keys) {
    for (const appKey of expandPermission(key)) result.add(appKey);
  }
  return result;
}