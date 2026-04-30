import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Loader2, Save, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setLoading(true);
        try {
            await api.put(`/auth/resetpassword/${token}`, { password });
            setSuccess(true);
            toast.success('Password successfully reset!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white border-2 border-black shadow-[12px_12px_0px_#000] p-8 md:p-12"
            >
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-black tracking-tighter uppercase italic leading-none mb-4">
                        Set New <br /><span className="text-primary-600">Password.</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Please enter your new password below.</p>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 pl-12 pr-5 border-2 border-black focus:bg-gray-50 transition-all font-bold text-sm outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full h-14 pl-12 pr-5 border-2 border-black focus:bg-gray-50 transition-all font-bold text-sm outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white h-16 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#ff3e3e] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>Update Password</span>
                                    <Save size={18} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="bg-green-50 p-6 border-2 border-green-200 text-center">
                        <CheckCircle2 className="mx-auto mb-3 text-green-500" size={32} />
                        <p className="font-bold text-green-900 uppercase tracking-tight mb-2">Success!</p>
                        <p className="text-xs text-green-700 leading-relaxed">Redirecting you to login...</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
