import React, { useState, useEffect } from 'react';
import { Users, Clock, Shield, Search, Filter, UserCheck, UserX } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAction = async (userId, action) => {
        try {
            if (action === 'approve') {
                await api.put(`/admin/users/${userId}/status`, { status: 'approved' });
                toast.success('User approved');
            } else if (action === 'reject') {
                await api.put(`/admin/users/${userId}/status`, { status: 'rejected' });
                toast.error('User rejected');
            } else if (action === 'promote') {
                await api.put(`/admin/users/${userId}/role`, { role: 'admin' });
                toast.success('User promoted to admin');
            } else if (action === 'delete') {
                if (window.confirm('Are you sure you want to permanently remove this member?')) {
                    await api.delete(`/admin/users/${userId}`);
                    toast.success('Member removed');
                } else return;
            }
            fetchUsers();
        } catch (error) {
            toast.error('Failed to perform action');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || user.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 md:space-y-12 max-w-7xl mx-auto px-4 md:px-0 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div>
                    <h1 className="text-2xl md:text-6xl font-black text-black tracking-tighter uppercase italic">Member <span className="text-primary-600">Directory.</span></h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs mt-2">Authorize and manage member access</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-4 md:px-6 border-x border-black">
                        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                        <p className="text-lg md:text-xl font-black text-primary-600 italic leading-none mt-1">
                            {users.filter(u => u.status === 'pending').length}
                        </p>
                    </div>
                    <div className="text-center px-4 md:px-6">
                        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</p>
                        <p className="text-lg md:text-xl font-black text-black italic leading-none mt-1">
                            {users.filter(u => u.status === 'approved').length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="border border-black bg-white overflow-hidden mt-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black text-white">
                                <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Member Details</th>
                                <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">Access Level</th>
                                <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Status</th>
                                <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-gray-300 font-black uppercase tracking-widest">Loading Member Data...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-gray-300 font-black uppercase tracking-widest">No Members Found</td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 md:px-8 py-4 md:py-8">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-8 h-8 md:w-12 md:h-12 bg-black text-white flex items-center justify-center font-black text-[10px] md:text-xs group-hover:bg-primary-600 transition-colors shrink-0">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-black text-sm md:text-lg uppercase tracking-tighter italic truncate">{user.name}</div>
                                                <div className="hidden md:block text-xs text-gray-400 font-bold tracking-widest uppercase truncate">{user.email}</div>
                                                <div className="md:hidden text-[8px] text-gray-400 font-bold tracking-widest uppercase italic">{user.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-8 py-8">
                                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-primary-600 text-white' : 'bg-black text-white'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-8 py-4 md:py-8">
                                        <span className={`inline-flex items-center px-2 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest ${user.status === 'approved' ? 'text-green-500' :
                                            user.status === 'pending' ? 'text-primary-600 animate-pulse' : 'text-gray-400'
                                            }`}>
                                            ● {user.status.charAt(0)}
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-8 py-4 md:py-8 text-right">
                                        <div className="flex justify-end gap-1 font-black">
                                            {user.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(user._id, 'approve')}
                                                        className="px-2 md:px-4 py-1.5 md:py-2 bg-black text-white text-[8px] md:text-[10px] uppercase hover:bg-green-600 transition-colors"
                                                    >
                                                        Auth
                                                    </button>
                                                </>
                                            )}
                                            {user.role !== 'admin' && user.status === 'approved' && (
                                                <button
                                                    onClick={() => handleAction(user._id, 'promote')}
                                                    className="px-2 md:px-4 py-1.5 md:py-2 bg-black text-white text-[8px] md:text-[10px] uppercase hover:bg-primary-600 transition-colors flex items-center gap-1"
                                                    title="Promote to admin"
                                                >
                                                    <Shield size={10} /> Promo
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAction(user._id, 'delete')}
                                                className="px-2 md:px-4 py-1.5 md:py-2 border border-black text-gray-400 text-[8px] md:text-[10px] uppercase hover:bg-red-600 hover:text-white transition-colors"
                                                title="Remove Member"
                                            >
                                                Del
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
