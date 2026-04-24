import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { PreviewCard } from './components/ui/Cards';
import { ImageGenerator } from './components/ImageGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { AudioGenerator } from './components/AudioGenerator';
import { AudioGallery } from './components/AudioGallery';
import { Gallery, GalleryItem } from './components/Gallery';
import { Billing } from './components/Billing';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Discover } from './components/Discover';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProEditor } from './components/ProEditor';
import { VideoCoresPage } from './components/VideoCoresPage';
import { CoresPage } from './components/CoresPage';
import { api, apiFetch } from './lib/api';
import { Image as ImageIcon, Video, ArrowRight, Activity, Zap, Mic, X, ChevronLeft, ChevronRight, Bell, Check, Megaphone, Loader2, CheckCircle2, AlertCircle, Globe, Bot, LogOut, Music } from 'lucide-react';
import { GenerationViewer } from './components/ui/GenerationViewer';
import { GenerationStatusModal } from './components/ui/GenerationStatusModal';
import SessionExpiredModal from './components/ui/SessionExpiredModal';
import { PWAInstallBanner } from './components/ui/PWAInstallBanner';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { isLaunchedFromPWA } from './utils/pwa';
import { Timer } from './components/ui/Timer';


import { SplashScreen } from './components/SplashScreen';
import { usePWA } from './hooks/usePWA';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const { isStandalone } = usePWA();
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('conversio_page');
    const token = localStorage.getItem('conversio_token');
    const user = localStorage.getItem('conversio_user');
    
    // PWA Standalone Mode
    if (isLaunchedFromPWA()) {
      // Se não estiver logado, sempre começa pela splash
      if (!token || !user) return 'splash';
      
      // Se estiver logado, mas não houver página salva, vai para home
      return savedPage || 'home';
    }

    // Browser Mode
    if (!token || !user) {
      if (savedPage && ['landing', 'auth', 'video-cores-info', 'image-cores-info'].includes(savedPage)) {
        return savedPage;
      }
      return 'landing';
    }

    return savedPage || 'home';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [stats, setStats] = useState({ totalGenerations: 0, credits: 0 });
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [hasFetchedRecent, setHasFetchedRecent] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [socialNotifications, setSocialNotifications] = useState<any[]>([]);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{id: string, success: boolean, message: string} | null>(null);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [selectedCore, setSelectedCore] = useState<string | null>(null);

  // Global generation states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number | null>(null);
  
  const [recentMediaGenerations, setRecentMediaGenerations] = useState<any[]>([]);
  const [recentAudioGenerations, setRecentAudioGenerations] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  }>({ title: '', message: '', onConfirm: () => {} });

  const [activeGenerationsCount, setActiveGenerationsCount] = useState(0);
  const [activeGenerations, setActiveGenerations] = useState<Set<string>>(new Set());

  const [brandData, setBrandData] = useState<any>(null);



  const fetchBrand = async () => {
    const userStr = localStorage.getItem('conversio_user');
    const user = userStr ? JSON.parse(userStr) : {};
    if (!user.id) return;
    try {
      const res = await apiFetch(`/brands/${user.id}`);
      const data = await res.json();
      if (data.success && data.brand) {
        setBrandData(data.brand);
      } else {
        setBrandData(null);
      }
    } catch (e) {
      console.error('[Brand] Error fetching brand:', e);
    }
  };

  const fetchStats = async () => {
    const userStr = localStorage.getItem('conversio_user');
    const token = localStorage.getItem('conversio_token');
    const user = userStr ? JSON.parse(userStr) : {};
    if (!user.id) return;
    try {
      const res = await apiFetch(`/user/stats?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setStats({ totalGenerations: data.totalGenerations || 0, credits: data.credits || 0 });
        
        // Verifica mudança de papel (role) com segurança para evitar loops infinitos
        const serverRole = data.role;
        const localRole = user.role;
        
        if (serverRole && localRole && String(serverRole) !== String(localRole)) {
           console.log('[Auth] Role mismatch detected, updating local state and reloading...', { localRole, serverRole });
           const updated = { ...user, role: serverRole, credits: data.credits };
           localStorage.setItem('conversio_user', JSON.stringify(updated));
           
           // Pequeno atraso antes de recarregar para garantir que o localStorage seja persistido
           setTimeout(() => window.location.reload(), 100);
        }
      }
    } catch (e) {
      console.error('[Stats] Error fetching user stats:', e);
    }
  };

  React.useEffect(() => {
    const handleSessionExpired = () => {
        setIsSessionExpired(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const fetchRecent = async () => {
    const userStr = localStorage.getItem('conversio_user');
    const token = localStorage.getItem('conversio_token');
    const user = userStr ? JSON.parse(userStr) : {};
    if (!user.id) return;
    try {
      // Optimized for Dashboard: Fetch only what we display (5 media, 3 audio)
      const [resMedia, resAudio] = await Promise.all([
        apiFetch(`/generations?userId=${user.id}&limit=10&excludeTypes=audio,voice,musica,music`),
        apiFetch(`/generations?userId=${user.id}&limit=6&excludeTypes=image,video,avatar`)
      ]);
      
      const dataMedia = await resMedia.json();
      const dataAudio = await resAudio.json();

      let combinedGenerations: any[] = [];
      let newMediaGens: any[] = [];
      let audioGens: any[] = [];

      if (dataMedia.success && Array.isArray(dataMedia.generations)) {
        combinedGenerations = [...combinedGenerations, ...dataMedia.generations];
        // Sort by created_at DESC, then by id DESC for deterministic grouping
        newMediaGens = dataMedia.generations.sort((a: any, b: any) => {
          const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (dateCompare === 0) return b.id.localeCompare(a.id);
          return dateCompare;
        });
      }

      if (dataAudio.success && Array.isArray(dataAudio.generations)) {
        combinedGenerations = [...combinedGenerations, ...dataAudio.generations];
        audioGens = dataAudio.generations; // Already limited to 3 by API
        setRecentAudioGenerations(audioGens);
      }

      setIsGeneratingImage(combinedGenerations.some((g: any) => g.status === 'processing' && g.type === 'image'));
      setIsGeneratingVideo(combinedGenerations.some((g: any) => g.status === 'processing' && g.type === 'video'));
      setIsGeneratingAudio(combinedGenerations.some((g: any) => g.status === 'processing' && (g.type === 'audio' || g.type === 'musica')));
      setRecentGenerations(combinedGenerations);

      // Detect completions for notification sound (only for media in this case)
      setRecentMediaGenerations(prev => {

            const wasProcessing = prev.some(g => g.status === 'processing');
            const isCompleted = newMediaGens.some(g => g.status === 'completed' && !prev.find(pg => pg.id === g.id && pg.status === 'completed'));
            
            if (wasProcessing && isCompleted) {
                // Play notification sound
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
                setHasNotification(true);
            }
            return newMediaGens;
        });
      setHasFetchedRecent(true);
    } catch (e) {
      console.error('Fetch recent error:', e);
      setHasFetchedRecent(true);
    }
  };

  const fetchSocialNotifications = async () => {
    const userStr = localStorage.getItem('conversio_user');
    const user = userStr ? JSON.parse(userStr) : {};
    if (!user.id) return;
    try {
      const res = await apiFetch(`/social/notifications?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setSocialNotifications(data.notifications);
        setHasNotification(data.notifications.some((n: any) => !n.is_read));
      }
    } catch (e) {}
  };

  const fetchBroadcast = async () => {
    try {
      const res = await apiFetch(`/admin/broadcasts`);
      const data = await res.json();
      if (data.success && data.broadcast) {
        setActiveBroadcast(data.broadcast);
      } else {
        setActiveBroadcast(null);
      }
    } catch (e) {}
  };

  // Check auth on mount
  React.useEffect(() => {
    const token = localStorage.getItem('conversio_token');
    const user = localStorage.getItem('conversio_user');
    const pwaMode = isLaunchedFromPWA();
    
    if (token && user) {
      // Utilizador autenticado: ir para home
      if (currentPage === 'landing' || currentPage === 'auth') {
        setCurrentPage('home');
      }
      fetchStats();
      fetchRecent();
      fetchSocialNotifications();
      fetchBrand();
    } else {
      // Utilizador não autenticado
      if (pwaMode) {
        // No PWA, apenas redireciona para landing ou auth se tentar ir para página privada sem login
        if (!['landing', 'auth', 'video-cores-info', 'image-cores-info'].includes(currentPage)) {
          setCurrentPage('landing');
        }
      } else {
        // Browser normal: mostrar landing se não estiver numa página pública
        if (!['landing', 'auth', 'video-cores-info', 'image-cores-info'].includes(currentPage)) {
          setCurrentPage('landing');
        }
      }
    }

    const handleCustomNav = (e: any) => {
      if (e.detail) handleNavigate(e.detail);
    };

    const handleGenStarted = (e: any) => {
      setActiveGenerationsCount(prev => prev + 1);
    };

    const handleGenCompleted = (e: any) => {
      setActiveGenerationsCount(prev => Math.max(0, prev - 1));
      // Play bell sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
      
      // Update hasNotification
      setHasNotification(true);
      
      // Add local system notification
      const newNotif = {
        id: `gen-${Date.now()}`,
        type: 'generation_complete',
        actor_name: 'Conversio AI',
        actor_avatar: '/logo-mini.png',
        content: `A sua geração (${e.detail?.type || 'media'}) está pronta!`,
        is_read: false,
        created_at: new Date().toISOString()
      };
      setSocialNotifications(prev => [newNotif, ...prev]);
      
      // OPTIMISTIC UPDATE: Prepend items to the list immediately
      if (e.detail?.items && Array.isArray(e.detail.items)) {
        setRecentMediaGenerations(prev => {
          // Remove placeholders (processing items) with same batchId if they exist
          const filtered = prev.filter(p => !e.detail.items.find((ni: any) => ni.id === p.id) && p.batch_id !== e.detail.batchId);
          // Prepend new completed items
          const updated = [...e.detail.items, ...filtered];
          // Sort one last time to be sure
          return updated.sort((a: any, b: any) => {
            const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (dateCompare === 0) return b.id.localeCompare(a.id);
            return dateCompare;
          });
        });
      } else {
        fetchRecent();
      }
      
      fetchStats();
    };

    window.addEventListener('conversio_navigate', handleCustomNav);
    window.addEventListener('generation-started', handleGenStarted);
    window.addEventListener('generation-completed', handleGenCompleted);
    return () => {
      window.removeEventListener('conversio_navigate', handleCustomNav);
      window.removeEventListener('generation-started', handleGenStarted);
      window.removeEventListener('generation-completed', handleGenCompleted);
    };
  }, []);

  // Polling for dashboard
  React.useEffect(() => {
    let interval: any;
    
    const refreshData = () => {
      fetchRecent();
      fetchStats();
      fetchSocialNotifications();
      fetchBroadcast();
      fetchBrand();
    };

    if (currentPage === 'home') {
      refreshData();
      interval = setInterval(refreshData, 5000);
      
      window.addEventListener('refreshGenerations', refreshData);
      window.addEventListener('storage', refreshData);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('refreshGenerations', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, [currentPage]);

  // Lightbox Keyboard Support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    if (selectedId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, recentMediaGenerations]);

  const handleLogout = () => {
    localStorage.removeItem('conversio_user');
    localStorage.removeItem('conversio_token');
    localStorage.removeItem('conversio_page');
    setCurrentPage('landing');
  };

  // Persist page change
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem('conversio_page', page);
    setIsSidebarOpen(false);
    if (page === 'home') {
      fetchStats();
      fetchRecent();
    }
  };

  const handlePrev = () => {
    setSelectedId(prevId => {
        if (!prevId) return null;
        const available = recentMediaGenerations.filter(g => g.status === 'completed');
        const currentIndex = available.findIndex(g => g.id === prevId);
        if (currentIndex === -1) return null;
        const newIndex = currentIndex > 0 ? currentIndex - 1 : available.length - 1;
        return available[newIndex].id;
    });
  };

  const handleNext = () => {
    setSelectedId(prevId => {
        if (!prevId) return null;
        const available = recentMediaGenerations.filter(g => g.status === 'completed');
        const currentIndex = available.findIndex(g => g.id === prevId);
        if (currentIndex === -1) return null;
        const newIndex = currentIndex < available.length - 1 ? currentIndex + 1 : 0;
        return available[newIndex].id;
    });
  };

  const handleNotificationClick = async () => {
    setShowSocialDropdown(!showSocialDropdown);
    if (socialNotifications.some((n: any) => !n.is_read)) {
      setHasNotification(false);
      const userStr = localStorage.getItem('conversio_user');
      const user = userStr ? JSON.parse(userStr) : {};
      try {
        await apiFetch(`/social/notifications/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        // Remove notifications from UI once seen to keep it clean (as requested)
        setSocialNotifications([]); 
      } catch (e) {}
    } else {
      // If none are unread, just clear the list when opening if user wants it clean
      setHasNotification(false);
      setSocialNotifications([]);
    }
  };

  const handleDeleteGeneration = async (id: string) => {
    setConfirmModalConfig({
      title: 'Excluir Geração',
      message: 'Tem certeza que deseja excluir esta geração?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const userStr = localStorage.getItem('conversio_user');
          const user = userStr ? JSON.parse(userStr) : {};
          
          const response = await apiFetch(`/generations/${id}?userId=${user.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            setRecentMediaGenerations(prev => prev.filter(g => g.id !== id));
            setRecentAudioGenerations(prev => prev.filter(g => g.id !== id));
            if (selectedId === id) setSelectedId(null);
            fetchStats();
          }
        } catch (err) {
          console.error('Delete error:', err);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handlePublish = async (item: any) => {
    if (!user.id || publishing) return;
    
    setPublishing(item.id);
    setPublishStatus(null);
    
    try {
      const response = await apiFetch('/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          generationId: item.id,
          type: item.type,
          imageUrl: item.result_url,
          prompt: item.prompt
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPublishStatus({ id: item.id, success: true, message: 'Publicado!' });
      } else {
        setPublishStatus({ id: item.id, success: false, message: data.message || 'Erro' });
      }
    } catch (err) {
      setPublishStatus({ id: item.id, success: false, message: 'Erro' });
    } finally {
      setPublishing(null);
      setTimeout(() => setPublishStatus(null), 4000);
    }
  };

  // Get user data from localStorage for rendering
  const userStr = localStorage.getItem('conversio_user');
  const user = userStr ? JSON.parse(userStr) : {};
  const userName = user.name || 'Usuário';

  const isGenerating = isGeneratingImage || isGeneratingVideo || isGeneratingAudio;
  const generationCount = recentGenerations.filter(g => g.status === 'processing').length;


  if (currentPage.startsWith('admin')) {
    if (user?.role !== 'admin') {
      setCurrentPage('home');
      return null;
    }
    return <AdminLayout currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} user={user} />;
  }

  if (currentPage === 'splash') {
    return <SplashScreen onFinish={() => handleNavigate('auth')} />;
  }

  if (currentPage === 'landing') {
    return <LandingPage onEnter={() => handleNavigate('auth')} onNavigate={handleNavigate} />;
  }

  if (currentPage === 'video-cores-info') {
    return <VideoCoresPage onEnter={() => handleNavigate('auth')} onBack={() => handleNavigate('landing')} />;
  }

  if (currentPage === 'image-cores-info') {
    return <CoresPage onEnter={() => handleNavigate('auth')} onBack={() => handleNavigate('landing')} />;
  }

  if (currentPage === 'auth') {
    if (isLaunchedFromPWA()) {
      return <LoginScreen onLogin={() => handleNavigate('home')} onNavigate={handleNavigate} />;
    }
    return <AuthPage onLogin={() => handleNavigate('home')} onNavigate={handleNavigate} />;
  }

  const renderContent = () => {
    if (currentPage === 'home') {
      return (
        <>
          {/* Welcome section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 mt-4 w-full relative">
            <div className="flex flex-col items-start md:items-start text-left mt-6 md:mt-0">
              <img src="/logo.png" alt="Conversio.AI" className="h-16 md:h-20 w-auto object-contain mb-8 opacity-95 transition-all hover:scale-105" />
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                Olá, <span className="text-[#FFB800]">{userName}</span>
              </h1>
              <p className="text-text-secondary text-sm font-light">Bem-vindo de volta! O que vamos criar hoje?</p>
            </div>

            {/* Brand Colors Visualization */}
            {brandData?.brand_colors && (
              <div className="flex flex-col items-end gap-2 mt-6 md:mt-0 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="flex items-center gap-2 px-4 py-2 bg-surface/40 backdrop-blur-xl border border-border-subtle rounded-3xl shadow-float">
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Identidade</span>
                    <span className="text-[10px] font-bold text-text-primary uppercase truncate max-w-[120px]">{brandData.company_name}</span>
                  </div>
                  <div className="flex -space-x-2">
                    {['primary', 'secondary', 'accent', 'background'].map((key) => {
                      const color = brandData.brand_colors[key];
                      if (!color) return null;
                      return (
                        <div 
                          key={key}
                          className="w-8 h-8 rounded-full border-2 border-bg-base shadow-lg"
                          style={{ backgroundColor: color }}
                          title={`${key}: ${color}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Quick Actions */}
          <section className="mb-10">
            <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                onClick={() => handleNavigate('generate-image')}
                className="group relative rounded-[2.5rem] p-[1px] overflow-hidden shadow-lg cursor-pointer h-full"
              >
                <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full bg-surface/95 backdrop-blur-xl rounded-[calc(2.5rem-1px)] p-6 text-left border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-accent/10 transition-colors"></div>
                  <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform shadow-inner relative z-20 shrink-0">
                    <ImageIcon size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-[#FFB800] mb-2 relative z-20">Gerar Anúncios</h3>
                  <p className="text-text-secondary text-sm mb-6 max-w-sm leading-relaxed relative z-20">Crie imagens impressionantes e anúncios de alta fidelidade para suas campanhas.</p>
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-text-primary relative z-20">
                    <span>Começar a criar</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => handleNavigate('generate-video')}
                className="group relative rounded-[2.5rem] p-[1px] overflow-hidden shadow-lg cursor-pointer h-full"
              >
                <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full bg-surface/95 backdrop-blur-xl rounded-[calc(2.5rem-1px)] p-6 text-left border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-accent/10 transition-colors"></div>
                  <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform shadow-inner relative z-20 shrink-0">
                    <Video size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-[#FFB800] mb-2 relative z-20">Gerar Anúncios Vídeos</h3>
                  <p className="text-text-secondary text-sm mb-6 max-w-sm leading-relaxed relative z-20">Dê vida às suas marcas com ferramentas de geração de vídeos inteligentes.</p>
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-text-primary relative z-20">
                    <span>Começar a criar</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
              <div 
                onClick={() => handleNavigate('generate-audio')}
                className="group relative rounded-[2.5rem] p-[1px] overflow-hidden shadow-lg cursor-pointer h-full"
              >
                <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-20 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full bg-surface/95 backdrop-blur-xl rounded-[calc(2.5rem-1px)] p-6 text-left border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-accent/10 transition-colors"></div>
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-6 relative z-20 group-hover:scale-110 transition-transform">
                    <Music size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2 relative z-20">Geração de Música</h3>
                  <p className="text-text-tertiary text-sm mb-6 relative z-20">
                    Produza trilhas sonoras e músicas originais personalizadas para a sua marca.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-text-primary relative z-20">
                    <span>Explorar ferramenta</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Media Recent Generations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider">Gerações Visuais Recentes</h2>
              <button 
                onClick={() => handleNavigate('projects')}
                className="text-sm font-medium text-text-primary hover:underline"
              >
                Ver Galeria
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentMediaGenerations.length > 0 ? (
                recentMediaGenerations.map((gen) => (
                  <GalleryItem 
                    key={gen.id}
                    item={gen}
                    onExpand={() => { 
                        if (gen.status === 'completed') setSelectedId(gen.id);
                    }}
                    onDelete={(e) => {
                        e.stopPropagation();
                        handleDeleteGeneration(gen.id);
                    }}
                    onDownload={(url, filename) => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = filename;
                        link.click();
                    }}
                    formatDate={(d) => new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    progress={gen.status === 'processing' ? generationProgress : null}
                  />
                ))
              ) : hasFetchedRecent ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-surface/30 border border-border-subtle border-dashed rounded-[2rem]">
                  <ImageIcon className="text-text-tertiary mb-3 opacity-30" size={32} />
                  <p className="text-sm font-medium text-text-secondary">Nenhuma geração visual recente</p>
                  <p className="text-xs text-text-tertiary mt-1">As tuas criações de imagem e vídeo aparecerão aqui.</p>
                </div>
              ) : (
                [1,2,3,4,5].map(i => (
                  <div key={i} className="aspect-square bg-surface/50 border border-border-subtle border-dashed rounded-[2rem] animate-pulse" />
                ))
              )}
            </div>

          </section>

          {/* Audio Recent Generations Minimalist */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-2"><Music size={14}/> Músicas Recentes</h2>
              <button 
                onClick={() => handleNavigate('audio-gallery')}
                className="text-sm font-medium text-text-primary hover:underline"
              >
                Ir para Biblioteca
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recentAudioGenerations.slice(0, 3).map((gen) => {
                const isMusic = gen.type === 'musica' || (gen.model && gen.model.toLowerCase().includes('music'));
                return (
                  <div key={gen.id} className="w-full flex items-center justify-between bg-surface border border-border-subtle p-3 rounded-2xl hover:border-[#FFB800]/50 transition-colors cursor-pointer group" onClick={() => handleNavigate('audio-gallery')}>
                     <div className="flex items-center gap-3 w-3/4">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${gen.status === 'processing' ? 'bg-[#FFB800]/20 text-[#FFB800] animate-pulse' : 'bg-surface-hover text-text-secondary'} group-hover:text-[#FFB800]`}>
                         {gen.status === 'processing' ? <Loader2 size={14} className="animate-spin" /> : <Music size={14} />}
                       </div>
                       <div className="flex flex-col truncate w-full">
                         <span className="text-xs font-bold text-text-primary truncate">{gen.title || gen.prompt || 'Geração de Música'}</span>
                         <span className="text-[10px] text-text-tertiary uppercase tracking-wider">{gen.status === 'processing' ? 'A processar...' : 'Pronto'}</span>
                       </div>
                     </div>
                     <ChevronRight size={14} className="text-text-tertiary group-hover:text-[#FFB800] transition-colors" />
                  </div>
                );
              })}
              {recentAudioGenerations.length === 0 && (
                <div className="text-center py-6 text-sm text-text-tertiary bg-surface/30 border border-border-subtle border-dashed rounded-2xl">
                  Nenhuma música recente
                </div>
              )}
            </div>
          </section>

          {/* Unified Generation Viewer */}
          {selectedId !== null && (
            <GenerationViewer 
              item={[...recentMediaGenerations, ...recentAudioGenerations].find(g => g.id === selectedId)}
              onClose={() => setSelectedId(null)}
              onPrev={handlePrev}
              onNext={handleNext}
              onPublish={handlePublish}
              publishing={publishing}
              publishStatus={publishStatus}
            />
          )}

          <ConfirmationModal 
            isOpen={showConfirmModal}
            title={confirmModalConfig.title}
            message={confirmModalConfig.message}
            type={confirmModalConfig.type}
            onConfirm={confirmModalConfig.onConfirm}
            onCancel={() => setShowConfirmModal(false)}
          />
        </>
      );
    }

    if (currentPage === 'generate-image') {
      return <ImageGenerator initialCore={selectedCore} onClearCore={() => setSelectedCore(null)} onProgressUpdate={setGenerationProgress} />;
    }

    if (currentPage === 'generate-video') {
      return <VideoGenerator initialCore={selectedCore} onClearCore={() => setSelectedCore(null)} />;
    }

    if (currentPage === 'generate-audio') {
      return <AudioGenerator />;
    }

    if (currentPage === 'audio-gallery') {
      return <AudioGallery />;
    }

    if (currentPage === 'projects') {
      return <Gallery generationProgress={generationProgress} />;
    }

    if (currentPage === 'billing') {
      return <Billing />;
    }

    if (currentPage === 'settings') {
      return <Settings />;
    }

    if (currentPage === 'profile') {
      return <Profile />;
    }

    if (currentPage === 'discover') {
      return <Discover />;
    }


    if (currentPage === 'video-cores') {
      return (
        <VideoCoresPage 
          onEnter={() => {}} 
          onBack={() => handleNavigate('home')} 
          onSelect={(coreId) => {
            setSelectedCore(coreId);
            handleNavigate('generate-video');
          }}
        />
      );
    }

    if (currentPage === 'image-cores') {
      return (
        <CoresPage 
          onEnter={() => {}} 
          onBack={() => handleNavigate('home')} 
          onSelect={(coreId) => {
            setSelectedCore(coreId);
            handleNavigate('generate-image');
          }}
        />
      );
    }


    const pageTitles: Record<string, string> = {
      users: 'Usuários',
      help: 'Ajuda',
      expert: 'Expert'
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center border border-border-subtle rounded-3xl mt-10">
        <h2 className="text-3xl font-semibold text-text-primary mb-2">{pageTitles[currentPage] || 'Página'}</h2>
        <p className="text-text-secondary">Esta página está em desenvolvimento. Acesso Mobile autorizado.</p>
      </div>
    );
  };

  if (currentPage === 'editor') {
    return <ProEditor onExit={() => handleNavigate('home')} />;
  }

  return (
    <div className="min-h-screen w-full relative font-sans selection:bg-white/20">
      <Sidebar 
        activePage={currentPage} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user}
        isGeneratingImage={isGeneratingImage}
        isGeneratingVideo={isGeneratingVideo}
        isGeneratingAudio={isGeneratingAudio}
      />
      <Topbar 
        onMenuClick={() => setIsSidebarOpen(true)} 
        hasNotification={hasNotification}
        isGenerating={activeGenerationsCount > 0 || isGeneratingImage || isGeneratingVideo || isGeneratingAudio}
        generationProgress={generationProgress}
        generationCount={activeGenerationsCount}
        onToggleGenerationModal={() => setShowGenerationModal(!showGenerationModal)}
        onNotificationClick={handleNotificationClick}
        onLogoClick={() => {
          const userStr = localStorage.getItem('conversio_user');
          if (userStr) {
            handleNavigate('home');
          } else {
            handleNavigate('landing');
          }
        }}
        onNewResult={() => {
            setHasNotification(true);
            fetchRecent();
            fetchStats();
        }}
        stats={stats}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
      
      {showSocialDropdown && (
        <div className="fixed top-20 right-4 w-80 bg-surface/95 backdrop-blur-xl border border-border-subtle rounded-3xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
           <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Notificações</h3>
              <button onClick={() => setShowSocialDropdown(false)} className="text-text-tertiary hover:text-white"><X size={16} /></button>
           </div>
           <div className="max-h-96 overflow-y-auto">
              {socialNotifications.length === 0 ? (
                 <div className="p-8 text-center">
                    <Bell size={24} className="mx-auto text-text-tertiary mb-2 opacity-20" />
                    <p className="text-xs text-text-secondary">Nenhuma notificação por agora.</p>
                 </div>
              ) : (
                 socialNotifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-border-subtle/50 hover:bg-white/5 transition-colors flex gap-3 ${!n.is_read ? 'bg-accent/5' : ''}`}>
                       <div className="w-10 h-10 rounded-full overflow-hidden border border-border-subtle shrink-0">
                          <img src={n.actor_avatar || 'https://via.placeholder.com/40'} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                          <p className="text-xs text-text-primary">
                             <span className="font-bold">{n.actor_name}</span> {n.type === 'like' ? 'curtiu a tua arte.' : 'comentou na tua arte.'}
                          </p>
                          {n.type === 'comment' && <p className="text-[10px] text-text-secondary italic mt-1 line-clamp-2">"{n.content}"</p>}
                          <p className="text-[9px] text-text-tertiary mt-1 uppercase tracking-tighter">{new Date(n.created_at).toLocaleTimeString()}</p>
                       </div>
                       <div className="w-12 h-12 rounded-lg overflow-hidden border border-border-subtle shrink-0">
                          <img src={n.post_image} className="w-full h-full object-cover" />
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}

      {activeBroadcast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-2xl animate-in slide-in-from-top-8 duration-500`}>
           <div className={`p-4 rounded-2xl border backdrop-blur-xl flex items-center justify-between gap-4 shadow-2xl ${
             activeBroadcast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
             activeBroadcast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
             'bg-blue-500/10 border-blue-500/30 text-blue-500'
           }`}>
              <div className="flex items-center gap-3">
                 <div className="shrink-0">
                    <Megaphone size={20} />
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest leading-tight">{activeBroadcast.message}</p>
              </div>
              <button onClick={() => setActiveBroadcast(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                 <X size={16} />
              </button>
           </div>
        </div>
      )}

      <main className={`px-4 pt-28 md:pl-32 md:pr-8 pb-8 mx-auto flex flex-col gap-8 ${['generate-image', 'generate-video', 'generate-audio', 'projects', 'settings', 'billing', 'profile'].includes(currentPage) ? 'max-w-[1600px]' : 'max-w-[1200px]'}`}>

        <div className="max-w-full overflow-hidden">
          {renderContent()}
        </div>
      </main>

      {showGenerationModal && (
        <GenerationStatusModal 
          onClose={() => setShowGenerationModal(false)} 
          generations={recentGenerations} 
        />
      )}

      <SessionExpiredModal 
        isOpen={isSessionExpired} 
        onLoginAgain={() => {
            setIsSessionExpired(false);
            setCurrentPage('auth');
            localStorage.setItem('conversio_page', 'auth');
            // Removemos o reload forçado para permitir uma transição suave de estado
        }}
      />

      {/* Banner de instalação PWA — aparece automaticamente quando a app é instalável */}
      <PWAInstallBanner />
    </div>

  );
}
