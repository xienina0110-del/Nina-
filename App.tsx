import React, { useState, useEffect } from 'react';
import { AppModule, VideoContent } from './types';
import { VideoModule, INITIAL_VIDEOS } from './components/VideoModule';
import { ChatModule } from './components/ChatModule';
import { ReminderModule } from './components/ReminderModule';
import { Smile, Video, MessageCircle, Bell, Menu, X } from 'lucide-react';
import { getAllVideos, saveVideoToDB, deleteVideoFromDB } from './services/videoDb';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppModule>(AppModule.VIDEOS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);

  // Load videos from IndexedDB on startup
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const storedVideos = await getAllVideos();
        
        // Re-create ObjectURLs for blobs so they are playable
        const playableVideos = storedVideos.map(v => {
          if (v.videoFile && !v.videoUrl) {
            return { ...v, videoUrl: URL.createObjectURL(v.videoFile) };
          }
          return v;
        });
        
        setVideos(playableVideos);
        setIsDbReady(true);
      } catch (e) {
        console.error("Failed to load videos from DB", e);
        setVideos(INITIAL_VIDEOS); // Fallback
      }
    };
    loadVideos();

    // Cleanup object URLs on unmount
    return () => {
      videos.forEach(v => {
        if (v.videoFile && v.videoUrl && v.videoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(v.videoUrl);
        }
      });
    };
  }, []);

  const handleAddVideo = async (newVideo: VideoContent) => {
    // 1. Update UI state immediately
    setVideos(prev => [newVideo, ...prev]);
    // 2. Persist to DB
    await saveVideoToDB(newVideo);
  };

  const handleUpdateVideo = async (updatedVideo: VideoContent) => {
    setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
    await saveVideoToDB(updatedVideo);
  };

  const handleDeleteVideo = async (id: string) => {
    console.log("Attempting to delete video:", id);
    setVideos(prev => prev.filter(v => v.id !== id));
    try {
      await deleteVideoFromDB(id);
    } catch (e) {
      console.error("Failed to delete video from DB:", e);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case AppModule.VIDEOS:
        return (
          <VideoModule 
            videos={videos} 
            onAddVideo={handleAddVideo} 
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
          />
        );
      case AppModule.CHAT:
        return <ChatModule />;
      case AppModule.REMINDERS:
        return <ReminderModule />;
      default:
        return (
          <VideoModule 
            videos={videos} 
            onAddVideo={handleAddVideo}
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
          />
        );
    }
  };

  const NavButton = ({ module, icon: Icon, label }: { module: AppModule; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(module);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
        currentView === module
          ? 'bg-white text-tooth-dark shadow-md scale-105'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Navbar */}
      <nav className="bg-tooth-dark shadow-lg z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-md">
                <Smile className="w-8 h-8 text-tooth-dark" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl tracking-wide">Nina医生</h1>
                <p className="text-cyan-100 text-xs font-medium">牙科小助手</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-4">
              <NavButton module={AppModule.VIDEOS} icon={Video} label="视频指导" />
              <NavButton module={AppModule.CHAT} icon={MessageCircle} label="智能问答" />
              <NavButton module={AppModule.REMINDERS} icon={Bell} label="护理提醒" />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-cyan-700 px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-inner">
            <NavButton module={AppModule.VIDEOS} icon={Video} label="视频指导" />
            <NavButton module={AppModule.CHAT} icon={MessageCircle} label="智能问答" />
            <NavButton module={AppModule.REMINDERS} icon={Bell} label="护理提醒" />
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-pattern">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-tooth-blue/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-gum-pink/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-sun-yellow/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

        <div className="relative z-10 h-full flex flex-col">
           {renderView()}
        </div>
      </main>

    </div>
  );
};

export default App;