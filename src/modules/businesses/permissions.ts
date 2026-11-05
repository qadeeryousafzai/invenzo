export const PERMISSIONS = {
  "business.view": "View business workspace settings",
  "business.update": "Update business profile settings",
  "branches.view": "View branches",
  "branches.manage": "Create and manage branches",
  "employees.view": "View employees and memberships",
  "employees.manage": "Invite and manage employees",
  "roles.manage": "Manage custom roles and permissions",
  "products.view": "View products",
  "products.create": "Create products",
  "products.update": "Update products",
  "products.delete": "Archive products",
  "inventory.view": "View inventory",
  "inventory.adjust": "Adjust inventory",
  "sales.create": "Create sales",
  "sales.view": "View sales",
  "purchases.manage": "Manage purchases",
  "finance.view": "View finances",
  "reports.view": "View reports",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const OWNER_PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];
export const ADMIN_PERMISSION_KEYS = OWNER_PERMISSION_KEYS.filter((key) => key !== "roles.manage");
export const MANAGER_PERMISSION_KEYS: PermissionKey[] = ["business.view", "branches.view", "employees.view", "products.view", "inventory.view", "inventory.adjust", "sales.create", "sales.view", "purchases.manage", "reports.view"];

export const DEFAULT_ROLES = [
  { key: "OWNER", name: "Business Owner", permissions: OWNER_PERMISSION_KEYS },
  { key: "ADMIN", name: "Business Admin", permissions: ADMIN_PERMISSION_KEYS },
  { key: "BRANCH_MANAGER", name: "Branch Manager", permissions: MANAGER_PERMISSION_KEYS },
  { key: "ACCOUNTANT", name: "Accountant", permissions: ["business.view", "finance.view", "reports.view", "sales.view", "purchases.manage"] as PermissionKey[] },
  { key: "INVENTORY_MANAGER", name: "Inventory Manager", permissions: ["business.view", "products.view", "products.create", "products.update", "inventory.view", "inventory.adjust", "purchases.manage"] as PermissionKey[] },
  { key: "SALESPERSON", name: "Salesperson", permissions: ["business.view", "products.view", "inventory.view", "sales.create", "sales.view"] as PermissionKey[] },
];
