const LEGACY_SUPER_ADMIN_ROLE = 'super-admin';
const ADMIN_ROLES = ['admin', LEGACY_SUPER_ADMIN_ROLE];

const normalizeRole = (role) => (
    role === LEGACY_SUPER_ADMIN_ROLE ? 'admin' : role
);

const isAdminRole = (role) => normalizeRole(role) === 'admin';

const normalizeUserRole = async (user) => {
    if (!user || user.role !== LEGACY_SUPER_ADMIN_ROLE) {
        return user;
    }

    user.role = 'admin';
    await user.save();
    return user;
};

module.exports = {
    ADMIN_ROLES,
    isAdminRole,
    normalizeRole,
    normalizeUserRole
};
