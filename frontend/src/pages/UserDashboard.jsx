import React, { useState, useEffect, useCallback } from 'react';
import { PlayCircle, Heart, MessageSquare, Clock, User as UserIcon, Maximize2, X } from 'lucide-react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import { resolveMediaUrl } from '../utils/media';

const FacebookIcon = ({ size = 12 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);

const InstagramIcon = ({ size = 12 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const UserDashboard = () => {
    const { user: currentUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const [dateFilter, setDateFilter] = useState('all'); 
const [selectedDate, setSelectedDate] = useState('');

    const today = new Date();
today.setHours(0, 0, 0, 0);

const filteredPosts = posts.filter(post => {
    // existing filters
    if (filter === 'Instagram' && !post.platforms?.includes('Instagram')) return false;
    if (filter === 'Facebook' && !post.platforms?.includes('Facebook')) return false;

    // date filtering
    if (!post.eventDate) return dateFilter === 'all';

    const eventDate = new Date(post.eventDate);
    eventDate.setHours(0, 0, 0, 0);

    if (dateFilter === 'upcoming') return eventDate >= today;
    if (dateFilter === 'past') return eventDate < today;
    if (dateFilter === 'today') return eventDate.getTime() === today.getTime();

    if (dateFilter === 'custom' && selectedDate) {
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        return eventDate.getTime() === selected.getTime();
    }

    return true;
});

const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (Boolean(a.isNew) !== Boolean(b.isNew)) {
        return a.isNew ? -1 : 1;
    }

    const dateA = a.eventDate ? new Date(a.eventDate) : new Date(a.createdAt);
    const dateB = b.eventDate ? new Date(b.eventDate) : new Date(b.createdAt);
    return dateB - dateA;
});

const displayedPosts = sortedPosts.slice(0, currentPage * ITEMS_PER_PAGE);

    // const fetchPosts = useCallback(async () => {
    //     try {
    //         const res = await api.get('/posts/user');
    //         setPosts(res.data);
    //     } catch (error) {
    //         console.error('Failed to fetch posts');
    //         toast.error('Failed to load posts');
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);

    const fetchPosts = useCallback(async () => {
    try {
        setLoading(true);
        const res = await api.get('/posts/user');
        setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        
        if (error.response?.status === 401) {
            toast.error("Please make sure you're logged in as admin or backend allows public access");
        } else {
            toast.error('Failed to load posts. Is the backend running?');
        }
        
        setPosts([]);        // Important: prevent UI from breaking
    } finally {
        setLoading(false);
    }
}, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleLike = async (postId) => {
        try {
            const res = await api.patch(`/posts/${postId}/like`);
            setPosts(prev => prev.map(p => 
                p._id === postId ? { ...p, likes: res.data.likes } : p
            ));
        } catch (error) {
            toast.error('Failed to update like');
        }
    };

    const filters = [
        { key: 'all', label: 'All Content' },
        { key: 'Facebook', label: 'Facebook' },
        { key: 'Instagram', label: 'Instagram' },
    ];

    return (
        <div className="min-h-screen pb-20 -m-4 md:-m-10 p-4 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="border-b-4 border-black pb-6 mb-4 backdrop-blur-sm">
                    <h1 className="text-3xl md:text-5xl font-black text-black tracking-tighter uppercase italic drop-shadow-sm">
                        Latest <span className="text-primary-600">Designs.</span>
                    </h1>
                    <p className="text-black/70 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
                        Social media content published for you
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto no-scrollbar">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => { setFilter(f.key); setCurrentPage(1); }}
                            className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border-2 border-black transition-all shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${filter === f.key ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 items-center pb-4">
    <select
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="border-2 border-black px-3 py-2 text-xs font-bold"
    >
        <option value="all">All Dates</option>
        <option value="today">Today</option>
        <option value="upcoming">Upcoming</option>
        <option value="past">Past</option>
        <option value="custom">Pick Date</option>
    </select>

    {dateFilter === 'custom' && (
        <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-2 border-black px-3 py-2 text-xs font-bold"
        />
    )}
</div>

                {/* Content Feed */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border-2 border-black p-6 space-y-4 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                    <div className="space-y-2">
                                        <div className="w-24 h-3 bg-gray-200" />
                                        <div className="w-16 h-2 bg-gray-200" />
                                    </div>
                                </div>
                                <div className="w-full h-64 bg-gray-200" />
                                <div className="space-y-2">
                                    <div className="w-full h-3 bg-gray-200" />
                                    <div className="w-3/4 h-3 bg-gray-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {filteredPosts.length === 0 ? (
                            <div className="p-16 text-center border-2 border-black border-dashed backdrop-blur-sm bg-white/20">
                                <Clock size={40} className="mx-auto mb-4 text-black" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No posts found for this filter</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
                                    {displayedPosts.map((post, index) => (
                                        <PostItem
                                            key={post._id}
                                            post={post}
                                            index={index}
                                            currentUser={currentUser}
                                            onLike={handleLike}
                                        />
                                    ))}
                                </div>
                                
                                {sortedPosts.length > currentPage * ITEMS_PER_PAGE && (
                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="w-full py-6 border-2 border-black bg-white font-black uppercase tracking-[0.3em] text-[10px] hover:bg-black hover:text-white transition-all shadow-[8px_8px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
                                    >
                                        Load More From History
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── PostItem ────────────────────────────────────────────────── */
const PostItem = ({ post, index, currentUser, onLike }) => {
    const navigate = useNavigate();
    const [isLocalNew, setIsLocalNew] = useState(post.isNew);
    const [isExpanded, setIsExpanded] = useState(false);

    const markAsRead = async () => {
        if (!isLocalNew) return;
        try {
            await api.put('/notifications/read', { id: post._id, type: 'new_assignment' });
            setIsLocalNew(false);
        } catch (err) {
            console.error('Failed to mark as read');
        }
    };

    const handleNavigate = () => {
        markAsRead();
        navigate(`/post/${post._id}`);
    };

    const isLiked = post.likes?.some(id => (id._id || id).toString() === currentUser?._id);
    const mediaList = post.media && post.media.length > 0
        ? post.media
        : post.mediaUrl ? [{ url: post.mediaUrl, type: post.mediaType }] : [];
    
    const firstMedia = mediaList[0] || {};

    const [showComments, setShowComments] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative h-full flex flex-col backdrop-blur-md bg-white/70 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.7)] overflow-hidden transition-all"
        >
            {/* New Post Badge */}
            {isLocalNew && (
                <div className="absolute top-0 left-0 bg-primary-600 text-white text-[9px] font-black px-4 py-1.5 uppercase tracking-widest z-30 border-b-2 border-r-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.5)] animate-pulse">
                    New Post
                </div>
            )}

            {/* Top-right badges */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-20 pointer-events-none">
                <div className="flex gap-1">
                    {post.platforms?.map(p => (
                        <div key={p} className={`p-1.5 border border-black shadow-[2px_2px_0px_#000] flex items-center justify-center ${p === 'Facebook' ? 'bg-[#1877F2] text-white' : 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white'}`}>
                            {p === 'Facebook' ? <FacebookIcon /> : <InstagramIcon />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Post Header */}
            <div className="p-4 flex items-center justify-between border-b border-black/10 bg-white/30 pt-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-black border-2 border-black">
                        {post.createdBy?.name?.charAt(0) || <UserIcon size={18} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase tracking-tight text-black">
                                {post.createdBy?.name || 'Admin'}
                            </h4>
                        </div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(post.createdAt).toLocaleDateString()} • Coast Canopies Social
                        </p>
                    </div>
                </div>
            </div>

            {/* Post Content */}
            <div className="p-4 md:p-6 space-y-4 flex-1 flex flex-col">
                <div className="space-y-2 cursor-pointer" onClick={handleNavigate}>
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none italic hover:text-primary-600 transition-colors">
                        {post.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                        {isExpanded ? post.description : (post.description.length > 150 ? post.description.substring(0, 150) + '...' : post.description)}
                        {post.description.length > 150 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(prev => !prev);
                                }}
                                className="text-primary-600 font-black ml-1 hover:underline uppercase text-[10px]"
                            >
                                {isExpanded ? 'Read Less' : 'Read More'}
                            </button>
                        )}
                    </p>

                    {post.eventDate && (
                        <p className="text-[9px] font-black uppercase text-primary-600 tracking-widest">
                            Event: {new Date(post.eventDate).toLocaleDateString()}
                        </p>
                    )}

                </div>

                {/* Media Container */}
                {firstMedia.url && (
                    <div 
                        className="relative mt-auto bg-black border-2 border-black group cursor-pointer overflow-hidden"
                        onClick={handleNavigate}
                    >
                        {firstMedia.type === 'video' ? (
                            <div className="w-full h-[320px] flex items-center justify-center">
                                <video 
                                    src={resolveMediaUrl(firstMedia.url)}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                    <PlayCircle size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                        ) : (
                                <img
                                    src={resolveMediaUrl(firstMedia.url)}
                                    alt={post.title}
                                    className="w-full h-[320px] object-cover group-hover:scale-105 transition-transform duration-700 block"
                                />
                        )}
                        
                        {/* Media Count Badge */}
                        {mediaList.length > 1 && (
                            <div className="absolute top-3 right-3 px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest border border-white/20 shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                                <span>1 / {mediaList.length}</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black text-white text-[8px] font-black uppercase tracking-[0.3em] px-4 py-2 border border-white/20">
                                View Full Details
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Engagement Bar - Simplified */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-black/10 bg-white/30">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => onLike(post._id)}
                        className={`flex items-center gap-2 group transition-colors ${isLiked ? 'text-primary-600' : 'text-black hover:text-primary-600'}`}
                    >
                        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase tracking-widest">{post.likes?.length || 0}</span>
                            {post.likes?.length > 0 && (
                                <span className="text-[6px] font-bold text-gray-400 uppercase tracking-tighter max-w-[100px] truncate">
                                    {post.likes.map(u => u.name).join(', ')}
                                </span>
                            )}
                        </div>
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-2 transition-colors ${showComments ? 'text-primary-600' : 'text-black/40 hover:text-black'}`}
                    >
                        <MessageSquare size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {post.commentCount || 0}
                        </span>
                    </button>
                </div>
                <button 
                    onClick={handleNavigate}
                    className="text-[8px] font-black uppercase tracking-widest text-primary-600 hover:underline"
                >
                    View Briefing →
                </button>
            </div>

            {/* Expandable Comment Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50/50"
                    >
                        <CommentSection postId={post._id} user={currentUser} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserDashboard;
