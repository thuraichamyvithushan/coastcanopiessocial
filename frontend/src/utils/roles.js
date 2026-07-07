export const normalizeRole = (role) => (
    role === 'super-admin' ? 'admin' : role
);

export const isAdminRole = (role) => normalizeRole(role) === 'admin';

export const isAdminUser = (user) => isAdminRole(user?.role);
