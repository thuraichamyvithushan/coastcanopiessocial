import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { auth, googleProvider } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import logo from '../assets/logo.png';
import authBg from '../assets/auth2.webp';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // 2. Send token to our backend to get app-specific user data (role, status, etc)
            // 2. Send token to our backend to get app-specific user data (role, status, etc)
            console.log('Sending token to backend...');
            const { data } = await api.post('/auth/firebase', { idToken });
            console.log('Backend response received:', data);
            
            if (!data.role) {
                console.error('CRITICAL: User role is missing from backend response!');
                toast.error('Login failed: Invalid user data from server');
                setLoading(false);
                return;
            }

            // 3. Save user info
            login(data);
            console.log('User state set. Redirecting to:', data.role === 'admin' ? '/admin-dashboard' : '/dashboard');
            
            toast.success('Welcome back!');
            
            // 4. Redirect based on role
            setTimeout(() => {
                if (data.role === 'admin') navigate('/admin-dashboard', { replace: true });
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

    const handleInternalLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            const { data } = await api.post('/auth/firebase', { idToken });
            
            login(data);
            toast.success('Welcome back, Internal Member!');
            
            setTimeout(() => {
                if (data.role === 'admin') navigate('/admin-dashboard', { replace: true });
                else navigate('/dashboard', { replace: true });
            }, 200);
        } catch (error) {
            console.error('Internal login error:', error);
            const message = error.response?.data?.message || error.message || 'Internal login failed';
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
                    <img src={logo} alt="HO SOCIAL" className="h-12 w-auto object-contain mb-2" />
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
                                    placeholder="example@huntsmanoptics.com"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
        type={showPassword ? "text" : "password"}
        required
        placeholder="••••••••"
        className="input-field pr-12"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
    />

    <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
    >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
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

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-100"></span>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-gray-400 bg-white px-4">
                            Or Access Via
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleInternalLogin}
                        disabled={loading}
                        className="btn-secondary w-full flex items-center justify-center gap-3 py-5 group"
                    >
                        <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full border border-gray-200 overflow-hidden group-hover:border-transparent transition-colors">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" alt="G" className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">HO Internal Account</span>
                    </button>


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
