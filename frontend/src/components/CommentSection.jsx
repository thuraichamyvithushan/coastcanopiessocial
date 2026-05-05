import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Send, MessageSquare, Reply, Edit2, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CommentSection = ({ postId, user }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/comments/${postId}`);
            setComments(res.data);
        } catch (err) {
            console.warn('Failed to fetch comments');
            setComments([]);
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

    const handleUpdate = async (id, text) => {
        try {
            const res = await api.put(`/comments/${id}`, { comment: text });
            setComments(prev => prev.map(c => c._id === id ? res.data : c));
            toast.success('Comment updated');
        } catch (err) {
            toast.error('Failed to update comment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.delete(`/comments/${id}`);
            setComments(prev => prev.filter(c => c._id !== id));
            toast.success('Comment removed');
        } catch (err) {
            toast.error('Failed to remove comment');
        }
    };

    // Group comments by parentId to handle replies
    const rootComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

    return (
        <div className="border-t border-black/5 bg-gray-50/50 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-black">
                        Discussion ({comments.length})
                    </h4>
                </div>
                {user?.role === 'admin' && comments.length > 0 && (
                    <button 
                        onClick={async () => {
                            if (window.confirm('WARNING: This will delete ALL comments on this post. Continue?')) {
                                try {
                                    await api.delete(`/comments/post/${postId}`);
                                    setComments([]);
                                    toast.success('All comments cleared');
                                } catch (err) {
                                    toast.error('Failed to clear comments');
                                }
                            }
                        }}
                        className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors border-b border-red-500/20 hover:border-red-700"
                    >
                        Delete All
                    </button>
                )}
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
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            currentUser={user}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const CommentItem = ({ comment, replies, onReply, onUpdate, onDelete, currentUser, isReply = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.comment);
    
    // Safety check for user IDs
    const currentUserId = currentUser?._id?.toString();
    const commentUserId = (comment.userId?._id || comment.userId)?.toString();
    const isOwner = currentUserId && commentUserId && currentUserId === commentUserId;
    
    const isAdmin = currentUser?.role === 'admin';

    const handleSave = () => {
        if (!editText.trim()) return;
        onUpdate(comment._id, editText);
        setIsEditing(false);
    };

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
                <div className="bg-white border border-black/10 p-3 shadow-sm group">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tight text-black">
                                {comment.userId?.name}
                            </span>
                            {isOwner && (
                                <span className="text-[6px] font-black uppercase bg-black text-white px-1 py-0.5">You</span>
                            )}
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">
                            {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {isEditing ? (
                        <div className="space-y-2 mt-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full border-2 border-black p-2 text-xs font-medium focus:outline-none min-h-[60px]"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="p-1.5 bg-black text-white hover:bg-primary-600 transition-colors">
                                    <Check size={12} />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-200 text-black hover:bg-gray-300 transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            {comment.comment}
                        </p>
                    )}

                    {/* Actions */}
                    {!isEditing && (isOwner || isAdmin) && (
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isOwner && (
                                <button onClick={() => setIsEditing(true)} className="text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-black">
                                    Edit
                                </button>
                            )}
                            <button onClick={() => onDelete(comment._id)} className="text-[8px] font-black uppercase tracking-widest text-red-400 hover:text-red-600">
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {!isReply && !isEditing && (
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
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CommentSection;
