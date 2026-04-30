import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Send, MessageSquare, Reply } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CommentSection = ({ postId, user }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(false);

    // const fetchComments = async () => {
    //     try {
    //         const res = await api.get(`/comments/${postId}`);
    //         setComments(res.data);
    //     } catch (error) {
    //         console.error('Failed to fetch comments');
    //     }
    // };

    const fetchComments = async () => {
    try {
        const res = await api.get(`/comments/${postId}`);
        setComments(res.data);
    } catch (err) {
        console.warn('Failed to fetch comments (demo mode)');
        setComments([]);           // Prevent breaking the UI
    }
};

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const res = await api.post('/comments', {
                postId,
                comment: newComment,
                parentId: replyTo?._id || null
            });
            setComments([res.data, ...comments]);
            setNewComment('');
            setReplyTo(null);
            toast.success('Comment added');
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    // Group comments by parentId to handle replies
    const rootComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

    return (
        <div className="border-t border-black/5 bg-gray-50/50 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare size={16} className="text-primary-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black">
                    Discussion ({comments.length})
                </h4>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="mb-8">
                {replyTo && (
                    <div className="flex items-center justify-between bg-black text-white px-3 py-1.5 mb-2 text-[8px] font-black uppercase tracking-widest">
                        <span>Replying to {replyTo.userId?.name}</span>
                        <button type="button" onClick={() => setReplyTo(null)} className="hover:text-primary-400">Cancel</button>
                    </div>
                )}
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black">
                        {user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                            className="w-full bg-white border-2 border-black p-3 text-xs font-medium focus:outline-none focus:ring-0 resize-none min-h-[80px]"
                        />
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="absolute bottom-3 right-3 p-2 bg-black text-white hover:bg-primary-600 transition-colors disabled:opacity-30"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
                <AnimatePresence>
                    {rootComments.map(comment => (
                        <CommentItem 
                            key={comment._id} 
                            comment={comment} 
                            replies={getReplies(comment._id)}
                            onReply={setReplyTo}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const CommentItem = ({ comment, replies, onReply, isReply = false }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isReply ? 'ml-11 mt-4' : ''}`}
        >
            <div className={`${isReply ? 'w-6 h-6 text-[8px]' : 'w-8 h-8 text-[10px]'} rounded-full bg-black/5 flex-shrink-0 flex items-center justify-center font-black text-black border border-black/10`}>
                {comment.userId?.name?.charAt(0)}
            </div>
            <div className="flex-1">
                <div className="bg-white border border-black/10 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-tight text-black">
                            {comment.userId?.name}
                        </span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">
                            {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {comment.comment}
                    </p>
                </div>
                {!isReply && (
                    <button 
                        onClick={() => onReply(comment)}
                        className="mt-2 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-primary-600 hover:text-black transition-colors"
                    >
                        <Reply size={10} /> Reply
                    </button>
                )}

                {/* Nested Replies */}
                {replies && replies.length > 0 && (
                    <div className="space-y-4">
                        {replies.map(reply => (
                            <CommentItem 
                                key={reply._id} 
                                comment={reply} 
                                isReply={true} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CommentSection;
