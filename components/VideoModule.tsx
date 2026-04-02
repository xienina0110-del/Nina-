import React, { useState, useRef, useEffect } from 'react';
import { VideoContent } from '../types';
import { Play, X, Search, Upload, Plus, FileVideo, AlertCircle, Loader2, Share2, Copy, Mail, Twitter, Globe, Check, Edit2, Trash2 } from 'lucide-react';

export const INITIAL_VIDEOS: VideoContent[] = [
  {
    id: '1',
    title: '如何正确刷牙',
    description: '学习“画圈圈”刷牙法，把糖果虫都赶跑！',
    thumbnail: 'https://picsum.photos/id/1/400/250',
    duration: '2:30',
    category: 'Education',
  },
  {
    id: '2',
    title: '拔牙后的注意事项',
    description: '牙齿晃动拜拜后，如何快速恢复的小贴士。',
    thumbnail: 'https://picsum.photos/id/60/400/250',
    duration: '3:45',
    category: 'Post-Op',
  },
  {
    id: '3',
    title: '牙线大作战',
    description: '为什么牙线就像牙齿的超级英雄披风？',
    thumbnail: 'https://picsum.photos/id/180/400/250',
    duration: '1:50',
    category: 'Education',
  },
  {
    id: '4',
    title: '遇见Nina医生',
    description: '参观我们友好、有趣的牙科诊所。',
    thumbnail: 'https://picsum.photos/id/20/400/250',
    duration: '4:00',
    category: 'Fun',
  },
  {
    id: '5',
    title: '牙套护理 101',
    description: '如何让你的“钢铁微笑”保持闪亮清洁。',
    thumbnail: 'https://picsum.photos/id/96/400/250',
    duration: '5:15',
    category: 'Education',
  },
  {
    id: '6',
    title: '护齿健康零食',
    description: '哪些食物能让牙齿变得强壮又快乐？',
    thumbnail: 'https://picsum.photos/id/292/400/250',
    duration: '3:10',
    category: 'Fun',
  },
];

const CATEGORY_MAP: Record<string, string> = {
  'All': '全部',
  'Education': '科普',
  'Post-Op': '术后',
  'Fun': '趣味'
};

const CATEGORY_TAG_MAP: Record<string, string> = {
  'Education': '科普',
  'Post-Op': '术后',
  'Fun': '趣味'
};

interface VideoModuleProps {
  videos: VideoContent[];
  onAddVideo: (video: VideoContent) => void;
  onUpdateVideo: (video: VideoContent) => void;
  onDeleteVideo: (id: string) => void;
}

// Helper to extract thumbnail and duration from video file
const generateVideoMetadata = (file: File): Promise<{thumbnail: string, duration: string}> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    // Triggered when metadata (duration, dims) is loaded
    video.onloadeddata = () => {
      // Seek to 1s to grab a frame, or 0 if very short
      video.currentTime = Math.min(1, video.duration > 0 ? video.duration / 2 : 0);
    };

    video.onseeked = () => {
      // Create canvas to draw frame
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 250;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scale to fit "contain" style
        const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
        const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;
        
        ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
      }
      
      // Convert to JPEG base64
      const thumbnail = canvas.toDataURL('image/jpeg', 0.75);
      
      // Format Duration
      const durationSec = video.duration === Infinity ? 0 : video.duration;
      const minutes = Math.floor(durationSec / 60);
      const seconds = Math.floor(durationSec % 60);
      const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Clean up temp URL
      URL.revokeObjectURL(video.src);
      resolve({ thumbnail, duration: durationStr });
    };

    video.onerror = () => {
      // Fallback
      URL.revokeObjectURL(video.src);
      resolve({ 
          thumbnail: 'https://picsum.photos/seed/' + Date.now() + '/400/250',
          duration: '00:00'
      });
    };
  });
};

export const VideoModule: React.FC<VideoModuleProps> = ({ videos, onAddVideo, onUpdateVideo, onDeleteVideo }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<'Education' | 'Post-Op' | 'Fun'>('Education');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingVideoPreview, setExistingVideoPreview] = useState<string | null>(null);

  const [videoError, setVideoError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Share State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [videoToShare, setVideoToShare] = useState<VideoContent | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedVideo) {
      setVideoError(false);
    }
  }, [selectedVideo]);

  const filteredVideos = videos.filter(v => {
    const matchesCategory = activeCategory === 'All' || v.category === activeCategory;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Education');
    setSelectedFile(null);
    setExistingVideoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, video: VideoContent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(video.id);
    setFormTitle(video.title);
    setFormDesc(video.description);
    setFormCategory(video.category);
    setSelectedFile(null);
    setExistingVideoPreview(video.thumbnail); // Just show thumbnail as preview placeholder
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    if (window.confirm('确定要删除这个视频吗？')) {
      onDeleteVideo(id);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!formTitle) return;
    
    // In create mode: need file. In edit mode: file is optional.
    if (!isEditing && !selectedFile) return;

    setIsProcessing(true);

    try {
      let thumbnail = '';
      let duration = '';
      let videoUrl: string | undefined = undefined;
      let videoFile: Blob | undefined = undefined;

      // Process new file if selected
      if (selectedFile) {
        const meta = await generateVideoMetadata(selectedFile);
        thumbnail = meta.thumbnail;
        duration = meta.duration;
        videoUrl = URL.createObjectURL(selectedFile);
        videoFile = selectedFile;
      }

      if (isEditing && editingId) {
        // Find existing to preserve unchanged fields
        const existing = videos.find(v => v.id === editingId);
        if (existing) {
          const updatedVideo: VideoContent = {
            ...existing,
            title: formTitle,
            description: formDesc || '用户上传视频',
            category: formCategory,
            // Only update these if new file provided
            thumbnail: thumbnail || existing.thumbnail,
            duration: duration || existing.duration,
            videoUrl: videoUrl || existing.videoUrl,
            videoFile: videoFile || existing.videoFile
          };
          onUpdateVideo(updatedVideo);
        }
      } else {
        // Create New
        const newVideo: VideoContent = {
          id: Date.now().toString(),
          title: formTitle,
          description: formDesc || '用户上传视频',
          thumbnail: thumbnail, 
          duration: duration,
          category: formCategory,
          videoUrl: videoUrl,
          videoFile: videoFile
        };
        onAddVideo(newVideo);
      }
      
      setIsModalOpen(false);
    } catch (e) {
      console.error("Operation failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareClick = async (e: React.MouseEvent | null, video: VideoContent) => {
    if (e) {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }

    const shareData = {
      title: `Nina医生推荐: ${video.title}`,
      text: `${video.title}\n${video.description}`,
      url: window.location.href,
    };

    if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('Native share canceled or failed', err);
      }
    }

    setVideoToShare(video);
    setShareModalOpen(true);
    setCopySuccess(false);
  };

  const handleCopyLink = () => {
    if (!videoToShare) return;
    const textToCopy = `${videoToShare.title} - ${window.location.href}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleSocialShare = (platform: 'weibo' | 'twitter' | 'email') => {
    if (!videoToShare) return;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`[Nina医生] ${videoToShare.title} - ${videoToShare.description}`);
    const pic = encodeURIComponent(videoToShare.thumbnail);

    let targetUrl = '';
    switch (platform) {
      case 'weibo':
        targetUrl = `http://service.weibo.com/share/share.php?url=${url}&title=${title}&pic=${pic}`;
        window.open(targetUrl, '_blank');
        break;
      case 'twitter':
        targetUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        window.open(targetUrl, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${title}&body=${title}%0A%0A观看链接: ${url}`;
        break;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full relative">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-tooth-dark mb-2">视频指导库</h2>
        <p className="text-slate-500">学习如何保持灿烂笑容！✨</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="搜索视频（例如：刷牙、牙套）..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tooth-dark/30 shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
        </div>
        
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-tooth-dark text-white px-5 py-3 rounded-full font-bold shadow-md hover:bg-cyan-600 transition-colors w-full md:w-auto justify-center"
        >
          <Upload className="w-5 h-5" />
          <span>上传视频</span>
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        {['All', 'Education', 'Post-Op', 'Fun'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105 ${
              activeCategory === cat
                ? 'bg-gum-dark text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-gum-pink/20 border border-slate-200'
            }`}
          >
            {CATEGORY_MAP[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 scrollbar-hide">
          {filteredVideos.map(video => (
            <div 
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-slate-100 flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden flex-shrink-0 bg-black">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-110 transition-all">
                    <Play className="w-5 h-5 text-gum-dark ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-mono">
                  {video.duration !== '00:00' ? video.duration : 'Video'}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col relative">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                    video.category === 'Post-Op' ? 'bg-red-100 text-red-600' :
                    video.category === 'Education' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {CATEGORY_TAG_MAP[video.category]}
                  </span>
                  
                  {/* Action Buttons - Added relative z-20 to ensure clickability over the card link */}
                  <div className="flex gap-1 relative z-20">
                     <button 
                      onClick={(e) => handleShareClick(e, video)}
                      className="p-2 rounded-full text-slate-400 hover:text-tooth-dark hover:bg-slate-100 transition-all"
                      title="分享"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                     <button 
                      onClick={(e) => openEditModal(e, video)}
                      className="p-2 rounded-full text-slate-400 hover:text-blue-500 hover:bg-slate-100 transition-all"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(e, video.id)}
                      className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-tooth-dark transition-colors line-clamp-2">{video.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <p>没有找到相关视频。</p>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative animate-bounce-in flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
            
            <div className="aspect-video bg-black flex items-center justify-center relative group">
               {selectedVideo.videoUrl && !videoError ? (
                 <video 
                   src={selectedVideo.videoUrl} 
                   controls 
                   autoPlay 
                   className="w-full h-full"
                   onError={() => setVideoError(true)} 
                 />
               ) : (
                 <>
                   <img 
                    src={selectedVideo.thumbnail} 
                    className="w-full h-full object-cover opacity-50" 
                    alt="Video Background" 
                   />
                   <Play className="w-20 h-20 text-white absolute opacity-80" />
                   {selectedVideo.videoUrl && videoError && (
                      <div className="absolute bottom-20 flex items-center gap-2 text-red-100 bg-red-900/60 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">视频源已过期（演示模式下刷新页面会导致本地文件失效）</span>
                      </div>
                   )}
                   <p className="absolute bottom-10 text-white font-medium animate-pulse">
                     {selectedVideo.videoUrl && videoError ? '无法播放' : '视频播放模拟中...'}
                   </p>
                 </>
               )}
            </div>
            
            <div className="p-8 overflow-y-auto">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedVideo.title}</h3>
              <p className="text-slate-600 mb-4">{selectedVideo.description}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="bg-tooth-dark text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-tooth-dark/30 hover:bg-cyan-600 transition-colors"
                >
                  关闭
                </button>
                <button 
                  onClick={(e) => handleShareClick(e, selectedVideo)}
                  className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && videoToShare && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative transform transition-all scale-100">
             <button 
                onClick={() => setShareModalOpen(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
             >
                <X className="w-5 h-5" />
             </button>
             
             <div className="text-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">分享视频</h3>
               <p className="text-sm text-slate-500 mt-1 line-clamp-1 px-4">{videoToShare.title}</p>
             </div>
             
             <div className="grid grid-cols-4 gap-2 mb-6">
                <button onClick={handleCopyLink} className="flex flex-col items-center gap-2 group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-tooth-dark group-hover:text-white transition-all shadow-sm">
                        {copySuccess ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{copySuccess ? '已复制' : '复制链接'}</span>
                </button>
                <button onClick={() => handleSocialShare('weibo')} className="flex flex-col items-center gap-2 group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
                        <Globe className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">微博</span>
                </button>
                 <button onClick={() => handleSocialShare('twitter')} className="flex flex-col items-center gap-2 group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                        <Twitter className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Twitter</span>
                </button>
                <button onClick={() => handleSocialShare('email')} className="flex flex-col items-center gap-2 group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                        <Mail className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">邮件</span>
                </button>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
               <div className="flex-1 truncate text-xs text-slate-500 font-mono">
                 {window.location.href}
               </div>
               <button onClick={handleCopyLink} className="text-tooth-dark font-bold text-xs hover:underline whitespace-nowrap">
                 复制
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Upload / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{isEditing ? '编辑视频' : '上传新视频'}</h3>
              <button onClick={() => !isProcessing && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">视频标题</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tooth-dark/50"
                  placeholder="例如：我的刷牙记录"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">描述</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tooth-dark/50 h-24 resize-none"
                  placeholder="简单介绍一下视频内容..."
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">分类</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tooth-dark/50 bg-white"
                  disabled={isProcessing}
                >
                  <option value="Education">科普</option>
                  <option value="Post-Op">术后</option>
                  <option value="Fun">趣味</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {isEditing ? '替换视频文件 (可选)' : '视频文件'}
                </label>
                <div 
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${
                    isProcessing ? 'bg-slate-50 cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-50'
                  }`}
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <FileVideo className="w-8 h-8 text-tooth-dark mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        {isEditing ? '点击上传新文件以替换' : '点击选择视频文件'}
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formTitle || (!isEditing && !selectedFile) || isProcessing}
                className="w-full bg-tooth-dark text-white font-bold py-3 rounded-xl shadow-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed mt-4 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>正在处理...</span>
                  </>
                ) : (
                  <span>{isEditing ? '保存修改' : '确认上传'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};