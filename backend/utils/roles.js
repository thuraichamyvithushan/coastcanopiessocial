const ADMIN_ROLES = ['admin', 'super-admin'];

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const getSuperAdminEmail = () => normalizeEmail(
    process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || ''
);

const isAdminRole = (role) => ADMIN_ROLES.includes(role);

const isSuperAdminRole = (role) => role === 'super-admin';

const isSuperAdminEmail = (email) => {
    const configuredEmail = getSuperAdminEmail();
    return Boolean(configuredEmail && normalizeEmail(email) === configuredEmail);
};

const syncSuperAdminUser = async (user) => {
    if (!user || !isSuperAdminEmail(user.email)) {
        return user;
    }

    let changed = false;

    if (user.role !== 'super-admin') {
        user.role = 'super-admin';
        changed = true;
    }

    if (user.status !== 'approved') {
        user.status = 'approved';
        changed = true;
    }

    if (changed) {
        await user.save();
    }

    return user;
};

module.exports = {
    ADMIN_ROLES,
    isAdminRole,
    isSuperAdminRole,
    isSuperAdminEmail,
    syncSuperAdminUser
};
