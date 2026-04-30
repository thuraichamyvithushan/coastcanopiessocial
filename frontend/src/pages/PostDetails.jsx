import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft, ChevronLeft, ChevronRight, PlayCircle, Download, Maximize2, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';

const FacebookIcon = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);

const InstagramIcon = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const PostDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeMedia, setActiveMedia] = useState(0);
    const [isMaximized, setIsMaximized] = useState(false);

    const fetchData = async () => {
        try {
            const postRes = await api.get(`/posts/${id}`);
            setPost(postRes.data);
        } catch (error) {
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleLike = async () => {
        try {
            const res = await api.patch(`/posts/${id}/like`);
            setPost(prev => ({ ...prev, likes: res.data.likes }));
        } catch (error) {
            toast.error('Failed to update like');
        }
    };

    const handleDownload = async (media) => {
        try {
            const url = media.url?.startsWith('http') ? media.url : `http://localhost:5000${media.url}`;
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `HO_SOCIAL_${post.title.replace(/\s+/g, '_')}_${activeMedia + 1}.${media.url.split('.').pop()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Starting download...');
        } catch (error) {
            toast.error('Failed to download asset');
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-400 animate-pulse font-bold tracking-widest uppercase">Loading...</div>;
    if (!post) return <div className="p-20 text-center text-red-500 font-bold">Content not found.</div>;

    const mediaList = post.media && post.media.length > 0
        ? post.media
        : [{ url: post.mediaUrl, type: post.mediaType }];

    const current = mediaList[activeMedia] || mediaList[0];
    const isLiked = post.likes?.some(id => (id._id || id).toString() === user?._id);

    return (
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700 px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div>
                    <Link to={user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'} className="inline-flex items-center gap-2 text-black hover:text-primary-600 transition-colors font-black uppercase tracking-widest text-[10px] mb-4 group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Return to Feed</span>
                    </Link>
                    <h1 className="text-2xl md:text-5xl font-black text-black tracking-tighter uppercase italic leading-tight">{post.title}</h1>
                    
                    {/* Badges */}
                    {(post.platforms?.length > 0 || post.regions?.length > 0) && (
                        <div className="flex flex-wrap gap-3 mt-6">
                            {post.platforms?.map(p => (
                                <div key={p} className={`p-2 border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center ${p === 'Facebook' ? 'bg-[#1877F2] text-white' : 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white'}`} title={p}>
                                    {p === 'Facebook' ? <FacebookIcon /> : <InstagramIcon />}
                                </div>
                            ))}
                            {post.regions?.map(r => (
                                <span key={r} className="text-[9px] md:text-[11px] font-black uppercase px-3 py-1.5 bg-black text-white border-2 border-black shadow-[4px_4px_0px_#ff3e3e]">
                                    {r}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-4 md:justify-end">
                    <button 
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-black uppercase tracking-widest text-[10px] transition-all shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 ${isLiked ? 'bg-primary-600 text-white border-primary-600 shadow-primary-900' : 'bg-white text-black hover:bg-gray-50'}`}
                    >
                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                        {post.likes?.length || 0} Likes
                    </button>
                    <div className="text-right">
                        <span className="px-3 py-1.5 bg-black text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                            {mediaList.length} Media File{mediaList.length !== 1 ? 's' : ''}
                        </span>
                        <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest italic mt-1 text-right">By {post.createdBy?.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-2 border-black shadow-[12px_12px_0px_#000]">
                {/* ── Media Section ─────────────────────────────────── */}
                <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r-2 border-black flex flex-col bg-white">

                    {/* Main viewer */}
                    <div className="bg-black aspect-video flex items-center justify-center relative overflow-hidden">
                        {current?.type === 'image' ? (
                            <img src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`} className="w-full h-full object-contain" alt={post.title} />
                        ) : (
                            <video src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`} controls className="w-full h-full" />
                        )}

                        {/* Prev / Next arrows */}
                        {mediaList.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveMedia(i => Math.max(0, i - 1))}
                                    disabled={activeMedia === 0}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black text-white disabled:opacity-20 transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setActiveMedia(i => Math.min(mediaList.length - 1, i + 1))}
                                    disabled={activeMedia === mediaList.length - 1}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black text-white disabled:opacity-20 transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                    {activeMedia + 1} / {mediaList.length}
                                </div>
                            </>
                        )}

                        {/* Control Buttons */}
                        <div className="absolute top-4 right-4 flex gap-3 z-20">
                            <button
                                onClick={() => setIsMaximized(true)}
                                className="p-2.5 bg-white hover:bg-black text-black hover:text-white border-2 border-black shadow-[4px_4px_0px_#000] transition-all flex items-center gap-2 group"
                                title="View Full Screen"
                            >
                                <Maximize2 size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => handleDownload(current)}
                                className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white border-2 border-black shadow-[4px_4px_0px_#000] transition-all flex items-center gap-2 group"
                                title="Download this asset"
                            >
                                <Download size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Download Asset</span>
                            </button>
                        </div>
                    </div>

                    {/* Fullscreen Overlay */}
                    <AnimatePresence>
                        {isMaximized && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 md:p-10"
                            >
                                <button
                                    onClick={() => setIsMaximized(false)}
                                    className="absolute top-6 right-6 p-4 bg-white text-black border-2 border-black shadow-[6px_6px_0px_#ff3e3e] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all z-[110]"
                                >
                                    <X size={24} />
                                </button>

                                <div className="w-full h-full flex items-center justify-center relative">
                                    {current?.type === 'image' ? (
                                        <img
                                            src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`}
                                            className="max-w-full max-h-full object-contain"
                                            alt={post.title}
                                        />
                                    ) : (
                                        <video
                                            src={current.url?.startsWith('http') ? current.url : `http://localhost:5000${current.url}`}
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-full"
                                        />
                                    )}

                                    {mediaList.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMedia(i => Math.max(0, i - 1)); }}
                                                disabled={activeMedia === 0}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 p-6 bg-white/10 hover:bg-white text-white hover:text-black transition-all disabled:opacity-0"
                                            >
                                                <ChevronLeft size={48} strokeWidth={3} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMedia(i => Math.min(mediaList.length - 1, i + 1)); }}
                                                disabled={activeMedia === mediaList.length - 1}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-6 bg-white/10 hover:bg-white text-white hover:text-black transition-all disabled:opacity-0"
                                            >
                                                <ChevronRight size={48} strokeWidth={3} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Thumbnails row */}
                    {mediaList.length > 1 && (
                        <div className="flex gap-0 border-t-2 border-black overflow-x-auto bg-gray-50">
                            {mediaList.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveMedia(i)}
                                    className={`relative w-24 h-16 shrink-0 border-r-2 border-black overflow-hidden transition-all ${i === activeMedia ? 'bg-primary-600' : 'opacity-40 hover:opacity-100'}`}
                                >
                                    {item.type === 'image' ? (
                                        <img src={item.url?.startsWith('http') ? item.url : `http://localhost:5000${item.url}`} className={`w-full h-full object-cover ${i === activeMedia ? 'opacity-50' : ''}`} alt="" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                            <PlayCircle size={24} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div className="p-8 md:p-12 space-y-6 flex-1 border-t-2 border-black">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-16 bg-primary-600"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">BRIEFING DETAILS</span>
                        </div>
                        <p className="text-base md:text-xl font-medium text-gray-700 leading-relaxed italic whitespace-pre-wrap">
                            {post.description}
                        </p>
                    </div>
                </div>

                {/* ── Engagement Section ─────────────────────────────── */}
                <div className="flex flex-col bg-white">
                    <CommentSection postId={id} user={user} />
                </div>
            </div>
        </div>
    );
};

export default PostDetails;
