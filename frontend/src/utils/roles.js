export const isAdminRole = (role) => role === 'admin' || role === 'super-admin';

export const isSuperAdminRole = (role) => role === 'super-admin';

export const isAdminUser = (user) => isAdminRole(user?.role);

export const isSuperAdminUser = (user) => isSuperAdminRole(user?.role);
