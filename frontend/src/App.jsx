import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CreatePost from './pages/CreatePost';
import UserDashboard from './pages/UserDashboard';
import PostDetails from './pages/PostDetails';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 p-4 md:p-10 mt-16 md:mt-20 min-h-screen overflow-y-auto">
                    <Routes>
                        {/* Common Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<UserDashboard />} />
                            <Route path="/post/:id" element={<PostDetails />} />
                        </Route>

                        {/* Admin Only Routes */}
                        <Route element={<ProtectedRoute adminOnly={true} />}>
                            <Route path="/admin-dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<UserManagement />} />
                            <Route path="/admin/create-post" element={<CreatePost />} />
                            <Route path="/admin/posts" element={<UserDashboard />} />
                        </Route>

                        <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/*" element={<MainLayout />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
