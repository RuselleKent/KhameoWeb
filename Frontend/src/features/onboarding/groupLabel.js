/** "ACLC Speech Center · BSIT 4-A", or just the name for groups without a unit. */
export function groupLabel({ name, unit }) {
  return unit ? `${name} · ${unit}` : name;
}
