import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import logo from '../assets/cclogo.png';
import authBg from '../assets/auth.png';
import { isAdminRole } from '../utils/roles';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            
            if (!data.role) {
                toast.error('Login failed: Invalid user data from server');
                setLoading(false);
                return;
            }

            login(data);
            toast.success('Welcome back!');
            
            setTimeout(() => {
                if (isAdminRole(data.role)) navigate('/admin-dashboard', { replace: true });
                else navigate('/dashboard', { replace: true });
            }, 200);
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || error.message || 'Login failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-stretch overflow-hidden">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 flex-col justify-between p-16 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={authBg} alt="Background" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                </div>
                <div className="relative z-10">
                    <img src={logo} alt="Coast Canopies Social" className="h-16 xl:h-20 w-auto object-contain mb-2" />
                </div>

                <div className="relative z-10">
                    <h2 className="text-6xl font-black text-white leading-tight mb-6">Experience <br /> <span className="text-primary-600">Premium</span> Control.</h2>
                    <p className="text-white/40 max-w-sm text-sm leading-relaxed">
                        The next generation of content management and feedback. Built for speed, designed for clarity.
                    </p>
                </div>

                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white rounded-full"></div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 md:px-20 lg:px-32 relative">
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-12">
                        <h3 className="text-3xl font-black text-black mb-2 uppercase tracking-tighter">Portal Access</h3>
                        <p className="text-gray-400 font-medium">Please enter your credentials to access the portal.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    placeholder="example@coastcanopies.com"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Password</label>
                                <Link to="/forgot-password" size={14} className="text-[10px] font-bold text-primary-600 hover:underline uppercase tracking-widest">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-between px-8 py-5 group"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : (
                                <>
                                    <span className="text-sm font-black uppercase tracking-widest">Sign In</span>
                                    <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-12 text-sm font-medium text-gray-400">
                        New to the platform?{' '}
                        <Link to="/register" className="text-black font-black hover:text-primary-600 transition-colors uppercase tracking-widest ml-1">
                            Request Access
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
