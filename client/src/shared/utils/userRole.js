const getNormalizedRole = (user) => {
  if (!user) return null;
  const role = user?.role || user?.app_metadata?.role || user?.user_metadata?.role;
  return typeof role === "string" ? role.toLowerCase() : null;
};

export function isAdminUser(user) {
  const normalizedRole = getNormalizedRole(user);
  return normalizedRole === "admin" || user?.user_type === 0;
}

export function getUserRoleLabel(user) {
  return isAdminUser(user) ? "Super Admin" : "User";
}
