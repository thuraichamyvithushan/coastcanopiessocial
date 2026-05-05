// import React, { useState, useEffect } from 'react';
// import { Search, Menu, X, Bell, User, Clock, ArrowRight } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import api from '../../utils/api';
// import { motion, AnimatePresence } from 'framer-motion';

// const Navbar = ({ toggleSidebar }) => {
//     const { user } = useAuth();
//     const [notifications, setNotifications] = useState({ unreadCount: 0, latestComments: [] });
//     const [showDropdown, setShowDropdown] = useState(false);

//     const fetchNotifications = async () => {
//         try {
//             const endpoint = user.role === 'admin' ? '/notifications/admin' : '/comments/user/notifications';
//             const { data } = await api.get(endpoint);
//             setNotifications(data);
//         } catch (err) {
//             console.error('Failed to fetch notifications');
//         }
//     };

//     useEffect(() => {
//         if (!user) return;
//         fetchNotifications();
//         const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
//         return () => clearInterval(interval);
//     }, [user]);

//     const handleMarkAsRead = async (id, type) => {
//         try {
//             await api.put('/notifications/read', { id, type });
//             fetchNotifications();
//         } catch (err) {
//             console.error('Failed to mark as read');
//         }
//     };

//     return (
//         <header className="fixed top-0 right-0 left-0 h-16 md:h-20 bg-white/80 backdrop-blur-md z-40 px-4 md:px-10 flex items-center justify-between transition-all duration-300">
//             <div className="flex items-center gap-4">
//                 <button
//                     onClick={toggleSidebar}
//                     className="p-2 md:hidden text-black hover:bg-gray-100 transition-colors"
//                 >
//                     <Menu size={24} />
//                 </button>
//                 <span className="text-[10px] uppercase tracking-[0.2em] md:tracking-[0.4em] font-black text-black/30 md:ml-72 italic">Workspace</span>
//             </div>

//             <div className="flex items-center gap-2 md:gap-6 ml-auto">
//                 {/* Notification Bell */}
//                 {user && (
//                     <div className="relative">
//                         <button
//                             onClick={() => setShowDropdown(!showDropdown)}
//                             className={`p-2 transition-all relative ${showDropdown ? 'bg-black text-white' : 'text-black hover:bg-gray-100'}`}
//                         >
//                             <Bell size={20} />
//                             {notifications.unreadCount > 0 && (
//                                 <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
//                                     {notifications.unreadCount}
//                                 </span>
//                             )}
//                         </button>

//                         <AnimatePresence>
//                             {showDropdown && (
//                                 <motion.div
//                                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
//                                     className="absolute -right-12 md:right-0 mt-4 w-[85vw] md:w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden"
//                                 >
//                                     <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
//                                         <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Notifications</p>
//                                         {notifications.unreadCount > 0 && (
//                                             <span className="bg-primary-50 text-primary-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{notifications.unreadCount} New</span>
//                                         )}
//                                     </div>

//                                     <div className="max-h-[400px] overflow-y-auto">
//                                         {notifications.latestComments.length === 0 ? (
//                                             <div className="p-12 text-center">
//                                                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
//                                                     <Bell size={20} className="text-gray-300" />
//                                                 </div>
//                                                 <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">No recent activity</p>
//                                             </div>
//                                         ) : (
//                                             notifications.latestComments.map((note) => (
//                                                 <Link
//                                                     key={note._id}
//                                                     to={note.type === 'reply' ? `/post/${note.postId}` : "/admin-dashboard"}
//                                                     onClick={() => {
//                                                         setShowDropdown(false);
//                                                         handleMarkAsRead(note._id, note.type);
//                                                     }}
//                                                     className="block p-5 border-b border-gray-50 hover:bg-gray-50 transition-all group"
//                                                 >
//                                                     <div className="flex items-center justify-between mb-2">
//                                                         <span className="text-[10px] font-bold text-primary-600 tracking-tight uppercase">
//                                                             {note.type === 'new_assignment' ? 'New Post' :
//                                                                 note.type === 'registration' ? 'New Registration' :
//                                                                     note.type === 'login_attempt' ? 'Login Attempt' : 'New Comment'}
//                                                         </span>
//                                                         <span className="text-[9px] font-medium text-gray-400">
//                                                             {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                                         </span>
//                                                     </div>
//                                                     <h4 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors uppercase tracking-tighter">{note.postTitle}</h4>
//                                                     <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
//                                                         {note.type === 'new_assignment' ? `From: ${note.userName}` :
//                                                             note.type === 'registration' || note.type === 'login_attempt' ? note.comment :
//                                                                 `${note.userName}: "${note.comment}"`}
//                                                     </p>
//                                                 </Link>
//                                             ))
//                                         )}
//                                     </div>

//                                     <Link
//                                         to={user.role === 'admin' ? "/admin-dashboard" : "/dashboard"}
//                                         onClick={() => setShowDropdown(false)}
//                                         className="block py-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-black hover:bg-gray-50 transition-all border-t border-gray-100"
//                                     >
//                                         View All Activity
//                                     </Link>
//                                 </motion.div>
//                             )}
//                         </AnimatePresence>
//                     </div>
//                 )}

//                 <div className="h-8 md:h-10 px-4 md:px-6 bg-black text-white flex items-center justify-center font-black text-[10px] md:text-xs tracking-widest uppercase">
//                     {user?.role}
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default Navbar;



import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState({ unreadCount: 0, latestComments: [] });
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        // Skip fetch if no user (demo mode)
        if (!user) {
            setNotifications({ unreadCount: 0, latestComments: [] });
            return;
        }

        try {
            setLoading(true);
            const endpoint = user.role === 'admin' 
                ? '/notifications/admin' 
                : '/comments/user/notifications';

            const { data } = await api.get(endpoint);
            
            // Handle different response formats safely
            setNotifications({
                unreadCount: data.unreadCount || 0,
                latestComments: data.latestComments || data || []
            });
        } catch (err) {
            console.warn('Failed to fetch notifications:', err.response?.status);
            // Graceful fallback - don't break the UI
            setNotifications({ unreadCount: 0, latestComments: [] });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user]);

    const handleMarkAsRead = async (id, type) => {
        try {
            await api.put('/notifications/read', { id, type });
            fetchNotifications();
        } catch (err) {
            console.warn('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications({ unreadCount: 0, latestComments: [] });
            setShowDropdown(false);
        } catch (err) {
            console.warn('Failed to mark all as read');
        }
    };

    return (
        <header className="fixed top-0 right-0 left-0 h-16 md:h-20 bg-white/80 backdrop-blur-md z-40 px-4 md:px-10 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 md:hidden text-black hover:bg-gray-100 transition-colors"
                >
                    <Menu size={24} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.2em] md:tracking-[0.4em] font-black text-black/30 md:ml-72 italic">
                    Workspace
                </span>
            </div>

            <div className="flex items-center gap-2 md:gap-6 ml-auto">
                {/* Notification Bell - Only show if user exists */}
                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`p-2 transition-all relative ${showDropdown ? 'bg-black text-white' : 'text-black hover:bg-gray-100'}`}
                        >
                            <Bell size={20} />
                            {notifications.unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                                    {notifications.unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute -right-12 md:right-0 mt-4 w-[85vw] md:w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden"
                                >
                                    <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Notifications</p>
                                            {notifications.unreadCount > 0 && (
                                                <button 
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:text-black transition-colors text-left mt-1"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        {notifications.unreadCount > 0 && (
                                            <span className="bg-primary-50 text-primary-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {notifications.unreadCount} New
                                            </span>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.latestComments.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Bell size={20} className="text-gray-300" />
                                                </div>
                                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
                                                    No recent activity
                                                </p>
                                            </div>
                                        ) : (
                                            notifications.latestComments.map((note) => (
                                                <Link
                                                    key={note._id}
                                                    to={note.postId ? `/post/${note.postId}` : (user.role === 'admin' ? "/admin-dashboard" : "/dashboard")}
                                                    onClick={() => {
                                                        setShowDropdown(false);
                                                        handleMarkAsRead(note._id, note.type);
                                                    }}
                                                    className="block p-5 border-b border-gray-50 hover:bg-gray-50 transition-all group"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-bold text-primary-600 tracking-tight uppercase">
                                                            {note.type === 'new_assignment' ? 'New Post' : 
                                                             note.type === 'like' ? 'New Like' : 
                                                             note.type === 'comment' ? 'New Comment' : 
                                                             note.type === 'reply' ? 'Reply' : 'Activity'}
                                                        </span>
                                                        <span className="text-[9px] font-medium text-gray-400">
                                                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors uppercase tracking-tighter">
                                                        {note.postTitle || 'Post'}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-500 line-clamp-1 mb-2 italic">
                                                        <span className="font-bold text-gray-700 not-italic mr-1">{note.userName}:</span>
                                                        {note.comment || 'New activity'}
                                                    </p>
                                                </Link>
                                            ))
                                        )}
                                    </div>

                                    <Link
                                        to={user.role === 'admin' ? "/admin-dashboard" : "/dashboard"}
                                        onClick={() => setShowDropdown(false)}
                                        className="block py-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-black hover:bg-gray-50 transition-all border-t border-gray-100"
                                    >
                                        View All Activity
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Role Badge */}
                {user && (
                    <div className="h-8 md:h-10 px-4 md:px-6 bg-black text-white flex items-center justify-center font-black text-[10px] md:text-xs tracking-widest uppercase">
                        {user.role}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;