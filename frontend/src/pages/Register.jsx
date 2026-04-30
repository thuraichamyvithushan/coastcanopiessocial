import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import logo from '../assets/logo.png';
import authBg from '../assets/auth3.webp';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // 2. Add display name to Firebase profile
            await updateProfile(userCredential.user, { displayName: name });
            
            // 3. Sync with our MongoDB backend
            const idToken = await userCredential.user.getIdToken();
            await api.post('/auth/firebase', { idToken });

            setIsSuccess(true);
            toast.success('Registration successful!');
        } catch (error) {
            console.error('Registration error:', error);
            const message = error.response?.data?.message || error.message || 'Registration failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-lg bg-white p-16 text-center shadow-2xl"
                >
                    <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 className="text-primary-600" size={56} />
                    </div>
                    <h2 className="text-4xl font-black text-black mb-4 uppercase tracking-tighter">Registration Complete</h2>
                    <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                        Your account has been created and is currently <span className="font-black text-primary-600 border-b-2 border-primary-600 pb-0.5">Pending Review</span>.
                        Access will be granted following an administrative review.
                    </p>
                    <Link to="/login" className="btn-primary inline-flex items-center justify-center w-full py-5">
                        Return to Login
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-stretch overflow-hidden">
            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 md:px-20 lg:px-32 relative">
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-12">
                        <h3 className="text-3xl font-black text-black mb-2 uppercase tracking-tighter">New Registration</h3>
                        <p className="text-gray-400 font-medium">Please provide your details to create a member account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="Enter your name"
                                className="input-field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="example@huntsmanoptics.com"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-5 text-sm font-black uppercase tracking-widest mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-12 text-sm font-medium text-gray-400">
                        Already registered?{' '}
                        <Link to="/login" className="text-black font-black hover:text-primary-600 transition-colors uppercase tracking-widest ml-1">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>

            {/* Left Panel - Branding (Swapped for Register) */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 flex-col justify-between p-16 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={authBg} alt="Background" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                </div>
                <div className="relative z-10 flex flex-col items-end">
                    <img src={logo} alt="HO SOCIAL" className="h-12 w-auto object-contain mb-2" />
                </div>

                <div className="relative z-10">
                    <h2 className="text-6xl font-black text-white leading-tight mb-6">Build the <br /> <span className="text-primary-600">Future</span> with us.</h2>
                    <p className="text-white/40 max-w-sm text-sm leading-relaxed">
                        Collaborate on high-impact content and engage with the system at the highest level of performance.
                    </p>
                </div>


            </div>
        </div>
    );
};

export default Register;
