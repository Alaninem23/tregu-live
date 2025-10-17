export const ROLE_DEFAULT_TEMPLATES: Record<string, string[]> = {
  "admin.global": ["ops-core", "finance-core"],
  "ops.manager":  ["ops-core", "wms-accuracy"],
  "finance.controller": ["finance-core"],
  "sales.manager": ["sales-core"],
  "ops.user": ["ops-core"],
};

export function templatesForRoles(roles: string[]): string[] {
  const set = new Set<string>();
  for (const r of roles) {
    for (const id of (ROLE_DEFAULT_TEMPLATES[r] || [])) set.add(id);
  }
  if (set.size === 0) set.add("ops-core");
  return [...set];
}
