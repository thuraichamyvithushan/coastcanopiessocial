// import { Navigate, Outlet } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

// const ProtectedRoute = ({ adminOnly = false, children }) => {
//     const { user, loading } = useAuth();

//     if (loading) {
//         return <div className="min-h-screen flex items-center justify-center bg-white font-black uppercase tracking-widest text-xs animate-pulse">Authenticating...</div>;
//     }

//     if (!user) {
//         return <Navigate to="/login" replace />;
//     }

//     if (adminOnly && user.role !== 'admin') {
//         return <Navigate to="/dashboard" replace />;
//     }

//     return children ? children : <Outlet />;
// };

// export default ProtectedRoute;



import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return adminOnly ? <Navigate to="/dashboard" replace /> : <Outlet />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;