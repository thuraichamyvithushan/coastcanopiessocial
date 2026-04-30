import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgotpassword', { email });
            setSent(true);
            toast.success('Reset email sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
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
                    <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-black transition-colors mb-6">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                    <h1 className="text-4xl font-black text-black tracking-tighter uppercase italic leading-none mb-4">
                        Reset <br /><span className="text-primary-600">Password.</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 px-5 border-2 border-black focus:bg-gray-50 transition-all font-bold text-sm outline-none"
                                placeholder="example@huntsmanoptics.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white h-16 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#ff3e3e] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>Send Link</span>
                                    <Send size={18} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="bg-gray-50 p-6 border-2 border-black border-dashed text-center">
                        <p className="font-bold text-black uppercase tracking-tight mb-2">Email Sent!</p>
                        <p className="text-xs text-gray-500 leading-relaxed">Check your inbox for a reset link. It will expire in 10 minutes.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
