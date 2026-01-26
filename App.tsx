
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { MediaUpload } from './components/MediaUpload';
import { AnalysisView } from './components/AnalysisView';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileView } from './components/ProfileView';
import { AboutView } from './components/AboutView';
import { MediaItem, MediaType, UserRole, UserProfile, AppView, AnalysisProfile } from './types';
import { analyzeMedia } from './services/geminiService';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'alert';
}

const API_BASE = 'http://localhost:5000/api';

const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(objectUrl);
      resolve(dataUrl);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('');
    };
  });
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (currentUser) {
      fetchItems();
    }
  }, [currentUser]);

  const fetchItems = async () => {
    if (!currentUser) return;
    try {
      const resp = await fetch(`${API_BASE}/media?owner_id=${currentUser.id}&is_admin=${currentUser.role === 'admin'}`);
      if (resp.ok) {
        const data = await resp.json();
        setMediaItems(data);
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      // Fallback to local storage
      const localMedia = JSON.parse(localStorage.getItem('snapstream_mock_media') || '[]');
      const filtered = currentUser.role === 'admin' 
        ? localMedia 
        : localMedia.filter((m: any) => m.owner_id === currentUser.id);
      setMediaItems(filtered);
    }
  };

  const showNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  const handleLogin = (role: UserRole, name?: string, email?: string, id?: string) => {
    const user: UserProfile = {
      id: id || `USER-${Date.now()}`,
      name: name || 'User',
      email: email || '',
      role: role,
      mfaEnabled: true,
      lastLogin: new Date().toLocaleString(),
    };
    setCurrentUser(user);
    setCurrentView('dashboard');
    showNotification(`Identity Verified: ${user.name}`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    showNotification('Session Terminated Securely');
  };

  const handleUpdateProfile = (data: Partial<UserProfile>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...data };
      setCurrentUser(updated);
      
      // Update local storage user if simulated
      const mockUsers = JSON.parse(localStorage.getItem('snapstream_mock_users') || '[]');
      const idx = mockUsers.findIndex((u: any) => u.id === currentUser.id);
      if (idx > -1) {
        mockUsers[idx] = { ...mockUsers[idx], ...data };
        localStorage.setItem('snapstream_mock_users', JSON.stringify(mockUsers));
      }
      
      showNotification('Profile Identity Synchronized', 'success');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/media/${id}`, { method: 'DELETE' });
    } catch (err) {
      // Local storage purge
      const localMedia = JSON.parse(localStorage.getItem('snapstream_mock_media') || '[]');
      const updated = localMedia.filter((m: any) => m.id !== id);
      localStorage.setItem('snapstream_mock_media', JSON.stringify(updated));
    }
    setMediaItems(prev => prev.filter(item => item.id !== id));
    showNotification('Resource purged completed', 'alert');
  };

  const handleUpload = async (file: File, type: MediaType, profile: AnalysisProfile) => {
    setIsProcessing(true);
    let thumb = '';
    if (type === 'video') {
      showNotification('Step 2: AWS Lambda generating thumbnails...', 'info');
      thumb = await generateVideoThumbnail(file);
    }

    const itemId = Math.random().toString(36).substr(2, 9);
    const newItem: MediaItem = {
      id: itemId,
      name: file.name,
      type,
      profile,
      size: file.size,
      uploadDate: new Date().toISOString(),
      status: 'processing',
      url: URL.createObjectURL(file),
      thumbnailUrl: thumb
    };

    try {
      // Initial Entry
      setMediaItems(prev => [newItem, ...prev]);
      
      try {
        await fetch(`${API_BASE}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newItem, owner_id: currentUser?.id, thumbnailUrl: thumb })
        });
      } catch (e) {
        // Mock save
        const localMedia = JSON.parse(localStorage.getItem('snapstream_mock_media') || '[]');
        localMedia.push({ ...newItem, owner_id: currentUser?.id });
        localStorage.setItem('snapstream_mock_media', JSON.stringify(localMedia));
      }

      showNotification('Step 3: Smart Eyes (Rekognition) scanning content...', 'info');
      const analysis = await analyzeMedia(file, type, profile);
      
      try {
        await fetch(`${API_BASE}/media/${itemId}/analysis`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysis)
        });
      } catch (e) {
        // Mock update
        const localMedia = JSON.parse(localStorage.getItem('snapstream_mock_media') || '[]');
        const idx = localMedia.findIndex((m: any) => m.id === itemId);
        if (idx > -1) {
          localMedia[idx] = { ...localMedia[idx], analysis, status: 'completed' };
          localStorage.setItem('snapstream_mock_media', JSON.stringify(localMedia));
        }
      }

      setMediaItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'completed', analysis } : item));
      showNotification('Step 4: Automatic Labels applied successfully!', 'success');
    } catch (error) {
      showNotification('Inference Cluster Failure', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mediaItems.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.analysis?.summary?.toLowerCase().includes(q) ||
      item.analysis?.labels?.some(l => l.toLowerCase().includes(q))
    );
  }, [mediaItems, searchQuery]);

  const renderHome = () => (
    <div className="max-w-6xl mx-auto py-24 px-6 animate-in fade-in duration-1000 text-center">
      <div className="space-y-12">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full ui-surface border border-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-[0.3em]">
          Institutional Media Intelligence Platform
        </div>
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-white leading-none">SNAP<span className="accent-text">STREAM</span></h1>
        
        <div className="max-w-2xl mx-auto pt-8">
           <div className="relative group">
              <input 
                type="text" 
                placeholder="Find video fast..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setCurrentView('dashboard')}
                className="w-full bg-slate-900/40 border border-slate-800 rounded-3xl py-6 pl-16 pr-32 text-lg text-white focus:outline-none focus:border-rose-500 transition-all"
              />
              <button onClick={() => setCurrentView('dashboard')} className="absolute right-3 top-3 px-6 py-3 accent-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Search</button>
           </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 pt-10">
          <button onClick={() => setCurrentView('dashboard')} className="px-12 py-5 accent-gradient text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/10">Access Terminal</button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 ui-surface p-10 rounded-[2.5rem] border border-white/5">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tighter italic">Station_<span className="accent-text">Node</span></h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Identity: {currentUser?.name}</p>
        </div>
        <div className="flex gap-4">
           <button onClick={handleLogout} className="px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Sign Out</button>
        </div>
      </div>

      {currentUser?.role === 'admin' ? (
        <AdminDashboard allMedia={mediaItems} onDeleteMedia={handleDelete} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <MediaUpload onUpload={handleUpload} isProcessing={isProcessing} />
            <div className="grid grid-cols-1 gap-6">
              {filteredItems.map(item => (
                <div key={item.id} className="ui-surface p-8 rounded-[2rem] flex flex-col sm:flex-row gap-8 group transition-all">
                  <div className="w-full sm:w-48 h-48 bg-slate-950 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer relative group/thumb" onClick={() => setSelectedItem(item)}>
                    {item.type === 'image' ? (
                      <img src={item.url} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                    ) : (
                      item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl bg-slate-900">📽️</div>
                      )
                    )}
                    <div className="absolute inset-0 bg-rose-600/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full">Explore Data</span>
                    </div>
                  </div>
                  <div className="flex-grow space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold text-white italic">{item.name}</h4>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Profile: {item.profile?.replace('-', ' ')}</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${item.status === 'completed' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/30 text-rose-500 bg-rose-500/5'}`}>
                        {item.status}
                      </span>
                    </div>
                    {item.analysis && (
                      <div className="flex flex-wrap gap-2">
                        {item.analysis.labels?.slice(0, 3).map((l, i) => <span key={i} className="px-3 py-1 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase rounded-lg">{l}</span>)}
                      </div>
                    )}
                    <div className="pt-2">
                      <button 
                        onClick={() => setSelectedItem(item)} 
                        disabled={item.status !== 'completed'}
                        className={`px-10 py-3.5 text-white text-[10px] font-black uppercase rounded-xl transition-all ${item.status === 'completed' ? 'accent-gradient shadow-lg shadow-rose-600/20 hover:brightness-110 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                      >
                        {item.status === 'completed' ? 'View Analysis' : 'Awaiting Processing'}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-700 hover:text-red-500 self-start mt-2"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg></button>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4"><div className="ui-surface p-8 rounded-[2.5rem]"><h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Platform Diagnostics</h4><div className="flex justify-between items-center text-[11px] font-bold"><span className="text-slate-500">Service Status</span><span className="accent-text">READY</span></div></div></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header role={currentUser?.role || null} activeView={currentView} onLogout={handleLogout} onViewHome={() => setCurrentView('home')} onViewAbout={() => setCurrentView('about')} onViewDashboard={() => setCurrentView('dashboard')} onViewProfile={() => setCurrentView('profile')} />
      <main className="flex-grow px-6">
        {currentView === 'home' && renderHome()}
        {currentView === 'about' && <AboutView onBack={() => setCurrentView('home')} />}
        {currentView === 'dashboard' && (currentUser ? renderDashboard() : <Login onLogin={handleLogin} addLog={() => {}} />)}
        {currentView === 'profile' && currentUser && (
          <div className="max-w-7xl mx-auto py-12">
            <ProfileView user={currentUser} onClose={() => setCurrentView('dashboard')} onUpdate={handleUpdateProfile} />
          </div>
        )}
      </main>
      <div className="fixed bottom-8 right-8 z-[60] flex flex-col gap-4">{notifications.map(n => <div key={n.id} className="ui-surface px-8 py-5 rounded-2xl border-l-4 border-l-rose-500 flex items-center gap-5 min-w-[340px]"><p className="text-[11px] font-black uppercase tracking-widest text-white">{n.message}</p></div>)}</div>
      {selectedItem && <AnalysisView item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
};

export default App;
