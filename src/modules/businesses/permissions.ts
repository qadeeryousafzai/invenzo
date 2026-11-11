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
  "categories.manage": "Manage product categories",
  "inventory.view": "View inventory",
  "inventory.adjust": "Adjust inventory",
  "customers.manage": "Manage customers",
  "suppliers.manage": "Manage suppliers",
  "sales.create": "Create sales",
  "sales.view": "View sales",
  "purchases.manage": "Manage purchases",
  "finance.view": "View finances",
  "expenses.manage": "Manage expenses",
  "reports.view": "View reports",
  "patients.view": "View patients",
  "patients.manage": "Manage patients",
  "doctors.view": "View doctors",
  "doctors.manage": "Manage doctors",
  "departments.view": "View departments",
  "departments.manage": "Manage departments",
  "services.view": "View services",
  "services.manage": "Manage services",
  "appointments.view": "View appointments",
  "appointments.create": "Create appointments",
  "prescriptions.view": "View prescriptions",
  "prescriptions.create": "Create prescriptions",
  "prescriptions.dispense": "Dispense prescriptions",
  "admissions.view": "View admissions",
  "admissions.manage": "Manage admissions",
  "beds.view": "View beds",
  "beds.manage": "Manage beds",
  "discharges.view": "View discharges",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const OWNER_PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];
export const ADMIN_PERMISSION_KEYS = OWNER_PERMISSION_KEYS.filter((key) => key !== "roles.manage");
export const MANAGER_PERMISSION_KEYS: PermissionKey[] = ["business.view", "branches.view", "employees.view", "products.view", "categories.manage", "inventory.view", "inventory.adjust", "customers.manage", "suppliers.manage", "sales.create", "sales.view", "purchases.manage", "expenses.manage", "finance.view", "reports.view", "patients.view", "appointments.view", "prescriptions.view", "doctors.view", "departments.view", "services.view", "admissions.view", "beds.view"];

export const DEFAULT_ROLES = [
  { key: "OWNER", name: "Business Owner", permissions: OWNER_PERMISSION_KEYS },
  { key: "ADMIN", name: "Business Admin", permissions: ADMIN_PERMISSION_KEYS },
  { key: "BRANCH_MANAGER", name: "Branch Manager", permissions: MANAGER_PERMISSION_KEYS },
  { key: "ACCOUNTANT", name: "Accountant", permissions: ["business.view", "finance.view", "reports.view", "sales.view", "purchases.manage"] as PermissionKey[] },
  { key: "INVENTORY_MANAGER", name: "Inventory Manager", permissions: ["business.view", "products.view", "products.create", "products.update", "categories.manage", "inventory.view", "inventory.adjust", "suppliers.manage", "purchases.manage"] as PermissionKey[] },
  { key: "SALESPERSON", name: "Salesperson", permissions: ["business.view", "products.view", "inventory.view", "customers.manage", "sales.create", "sales.view"] as PermissionKey[] },
];
