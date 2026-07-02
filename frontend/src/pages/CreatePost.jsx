import React, { useState } from 'react';
import { Upload, X, Loader2, ArrowRight, PlayCircle, Image as ImageIcon, Film } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [mediaFiles, setMediaFiles] = useState([]); // [{file, preview, type}]
    const [loading, setLoading] = useState(false);
    const [eventDate, setEventDate] = useState('');

    const togglePlatform = (p) => {
        setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]);
    };

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const newItems = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image'
        }));
        setMediaFiles(prev => [...prev, ...newItems]);
    };

    const removeFile = (index) => {
        setMediaFiles(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mediaFiles.length === 0) return toast.error('Add at least one media file');

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('eventDate', eventDate);
        formData.append('platforms', JSON.stringify(selectedPlatforms));
        mediaFiles.forEach(({ file }) => formData.append('media', file));

        try {
            await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Post published!');
            setTitle(''); setDescription(''); setMediaFiles([]); setSelectedPlatforms([]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div>
                    <h1 className="text-2xl md:text-6xl font-black text-black tracking-tighter uppercase italic leading-none">New <span className="text-primary-600">Post.</span></h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Upload a social media design for all members</p>
                </div>
                <span className="px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-[0.2em]">Preparing</span>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-black bg-white">
                {/* ── Left: Details ──────────────────────────────────── */}
                <div className="p-6 md:p-12 space-y-8 border-b lg:border-b-0 lg:border-r border-black">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em]">Post Title</label>
                        <input type="text" required placeholder="e.g. New Instagram Story Design" className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em]">Caption & Details</label>
                        <textarea required placeholder="Write a caption or instructions for this design..." className="input-field min-h-[140px] resize-none whitespace-pre-wrap" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.2em]">
        Event Date
    </label>
    <input
        type="date"
        min={new Date().toISOString().split('T')[0]}
        className="input-field"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        required
    />
</div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em]">Social Media</label>
                        <div className="space-y-2">
                            {['Facebook', 'Instagram'].map(p => (
                                <label key={p} className="flex items-center gap-3 cursor-pointer group">
                                    <div 
                                        onClick={() => togglePlatform(p)}
                                        className={`w-5 h-5 border-2 border-black transition-all flex items-center justify-center ${selectedPlatforms.includes(p) ? 'bg-black' : 'bg-white'}`}
                                    >
                                        {selectedPlatforms.includes(p) && <div className="w-2 h-2 bg-primary-600" />}
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-primary-600 transition-colors">{p}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right: Media Upload ────────────────────────────── */}
                <div className="flex flex-col bg-gray-50/50">
                    <div className="p-6 md:p-12 flex-1 space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em]">Media Files</label>
                                <span className="text-[10px] text-primary-600 font-bold uppercase">{mediaFiles.length} Added</span>
                            </div>

                            {/* Drop zone */}
                            <div
                                className="border-2 border-dashed border-gray-200 hover:border-black transition-all p-8 flex flex-col items-center gap-3 cursor-pointer bg-white"
                                onClick={() => document.getElementById('mediaInput').click()}
                            >
                                <Upload className="text-gray-300" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-center">Click to add images or videos</p>
                                <p className="text-[9px] text-gray-400">Multiple files supported · Max 50MB each</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="flex items-center gap-1 text-[9px] bg-gray-100 px-2 py-1 font-bold uppercase"><ImageIcon size={10} /> Images</span>
                                    <span className="flex items-center gap-1 text-[9px] bg-gray-100 px-2 py-1 font-bold uppercase"><Film size={10} /> Videos</span>
                                </div>
                                <input id="mediaInput" type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFilesChange} />
                            </div>

                            {/* Preview grid */}
                            {mediaFiles.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {mediaFiles.map((item, i) => (
                                        <div key={i} className="relative aspect-square border border-black overflow-hidden group">
                                            {item.type === 'image' ? (
                                                <img src={item.preview} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                                    <PlayCircle className="text-white" size={24} />
                                                </div>
                                            )}
                                            <div className="absolute top-0 left-0 px-1.5 py-0.5 bg-black text-white text-[7px] font-black uppercase">{item.type}</div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-primary-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-6 text-sm md:text-lg font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 border-t border-black"
                    >
                        {loading ? <Loader2 className="animate-spin" size={22} /> : (
                            <><span>Publish Post</span><ArrowRight size={18} /></>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
