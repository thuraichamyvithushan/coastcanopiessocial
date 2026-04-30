import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, PlusSquare, FileText, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    const navItems = isAdmin ? [
        { name: 'Overview', path: '/admin-dashboard', icon: LayoutDashboard },
        { name: 'Members', path: '/admin/users', icon: Users },
        { name: 'New Post', path: '/admin/create-post', icon: PlusSquare },
        { name: 'Archive', path: '/admin-dashboard?tab=archive', icon: FileText },
    ] : [
        { name: 'My Feed', path: '/dashboard', icon: LayoutDashboard },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-black text-white transition-all duration-500 z-50 overflow-hidden border-r border-white/10
                ${isOpen ? 'w-64 md:w-72' : 'w-0 md:w-20'}`}>

                {/* ── Toggle button — absolutely placed so always visible on desktop ── */}
                <button
                    onClick={toggleSidebar}
                    title={isOpen ? 'Collapse' : 'Expand'}
                    className="hidden md:flex absolute top-5 right-3 z-10 items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 transition-colors"
                >
                    {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* ── Inner scroll container ── */}
                <div className="flex flex-col h-full w-64 md:w-72">

                    {/* Brand */}
                    <div className={`px-6 pt-6 pb-4 md:pt-8 transition-all duration-300 ${isOpen ? 'opacity-100' : 'md:opacity-0 pointer-events-none'}`}>
                        <img src={logo} alt="HO SOCIAL" className="h-10 md:h-12 w-auto object-contain" />
                    </div>

                    {/* Spacer when collapsed so first nav item clears the toggle button */}
                    {!isOpen && <div className="h-16 shrink-0 hidden md:block" />}

                    {/* Navigation */}
                    <nav className="flex-1 mt-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => window.innerWidth < 768 && toggleSidebar()}
                                className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                                title={!isOpen ? item.name : ''}
                            >
                                <item.icon size={20} className="shrink-0" />
                                <span className={`font-bold text-xs uppercase tracking-widest transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'md:opacity-0 pointer-events-none'}`}>
                                    {item.name}
                                </span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Footer */}
                    <div className="p-4 md:p-6 border-t border-white/10 bg-black/50">
                        <div className={`flex items-center gap-3 ${isOpen ? '' : 'md:justify-center'}`}>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-600 flex items-center justify-center font-black text-xs md:text-sm shrink-0">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className={`flex-1 min-w-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'md:opacity-0 pointer-events-none'}`}>
                                <p className="text-[10px] md:text-xs font-bold truncate text-white uppercase tracking-wider">{user?.name}</p>
                                <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-tighter">{user?.role}</p>
                            </div>
                            <button
                                onClick={logout}
                                className={`p-2 text-white/40 hover:text-primary-600 transition-colors shrink-0 ${isOpen ? 'block' : 'hidden'}`}
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>

                </div>
            </aside>
        </>
    );
};

export default Sidebar;
