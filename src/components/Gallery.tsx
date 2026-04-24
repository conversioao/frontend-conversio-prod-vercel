import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Trash2, Play, Image as ImageIcon, Video, Maximize2, X, Filter, Loader2, ChevronLeft, ChevronRight, Share2, Globe, Check, CheckCircle2, AlertCircle, Mic, Plus } from 'lucide-react';
import { VList } from 'virtua';
import { GenerationViewer } from './ui/GenerationViewer';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export function Gallery({ generationProgress }: { generationProgress?: number | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [expandedItem, setExpandedItem] = useState<any | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 18;

  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{id: string, success: boolean, message: string} | null>(null);
  
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchGenerations = async (page: number) => {
    if (!user.id) return;
    
    setLoading(true);
    try {
      const typeQuery = filterType !== 'all' ? `&type=${filterType}` : '';
      const response = await apiFetch(`/generations?userId=${user.id}&page=${page}&limit=${ITEMS_PER_PAGE}${typeQuery}&excludeTypes=audio,voice,musica,music`);
      if (!response.ok) return; 
      
      const data = await response.json();
      setItems(data.generations || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalCount || 0);
      setCurrentPage(data.currentPage || page);
      
      // Scroll to top of gallery on page change
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or filter changes
  useEffect(() => {
    fetchGenerations(currentPage);
  }, [currentPage, filterType, user.id]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  // Periodic refresh for processing items
  useEffect(() => {
    const interval = setInterval(() => {
        if (items.some(i => i.status === 'processing')) {
            fetchGenerations(currentPage);
        }
    }, 15000); 
    return () => clearInterval(interval);
  }, [items, currentPage]);

  const handlePublish = useCallback(async (item: any) => {
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
  }, [user.id, publishing]);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      title: 'Excluir Criação',
      message: 'Tem certeza?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await apiFetch(`/generations/${id}`, { method: 'DELETE' });
          if (response.ok) {
            setItems(prev => prev.filter(i => i.id !== id));
            setModal(prev => ({ ...prev, isOpen: false }));
            // Refresh current page to fill the gap if needed
            fetchGenerations(currentPage);
          }
        } catch (err) {}
      }
    });
  }, [currentPage]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  const handlePrev = useCallback(() => {
    const available = items.filter(i => i.status === 'completed');
    setExpandedItem(prev => {
      if (!prev) return null;
      const idx = available.findIndex(i => i.id === prev.id);
      return idx > 0 ? available[idx - 1] : available[available.length - 1];
    });
  }, [items]);

  const handleNext = useCallback(() => {
    const available = items.filter(i => i.status === 'completed');
    setExpandedItem(prev => {
      if (!prev) return null;
      const idx = available.findIndex(i => i.id === prev.id);
      return idx < available.length - 1 ? available[idx + 1] : available[0];
    });
  }, [items]);

  const handleDownload = async (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <>
    <div className="flex flex-col w-full animate-in fade-in duration-500 pb-20 h-[calc(100vh-120px)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-2">Sua Galeria</h1>
          <div className="flex items-center gap-3">
            <p className="text-text-secondary text-sm">Organização por páginas • Mostrando {items.length} de {totalItems} gerações</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface border border-border-subtle rounded-full p-1 shadow-sm">
            {['all', 'image', 'video'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filterType === type ? 'bg-[#FFB800] text-black shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {type === 'all' ? 'Todos' : type === 'image' ? 'Imagens' : 'Vídeos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
      >
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-hidden">
             {[...Array(ITEMS_PER_PAGE)].map((_, i) => <SkeletonItem key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-40">
            <div className="w-16 h-16 rounded-full border border-dashed border-text-tertiary flex items-center justify-center mb-6">
               <ImageIcon size={32} className="text-text-tertiary" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-text-tertiary text-center px-8">
              {totalItems === 0 ? "O teu espaço está vazio" : "Nenhuma correspondência encontrada"}
            </p>
            <p className="text-[10px] mt-2 text-text-tertiary opacity-60 text-center">As tuas gerações aparecerão aqui</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {items.map(item => (
              <GalleryItem 
                key={item.id} 
                item={item} 
                onExpand={() => setExpandedItem(item)} 
                onDelete={handleDelete} 
                onDownload={handleDownload}
                formatDate={formatDate}
                progress={item.status === 'processing' ? generationProgress : null}
              />
            ))}
          </div>
        )}

        {/* Pagination UI */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-12 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-3 rounded-xl bg-surface border border-border-subtle hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1.5 px-6">
                <span className="text-sm font-black text-text-primary">{currentPage}</span>
                <span className="text-sm font-medium text-text-tertiary">de</span>
                <span className="text-sm font-black text-text-primary">{totalPages}</span>
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-3 rounded-xl bg-surface border border-border-subtle hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                // Show pages around current page if possible
                let pageNum = i + 1;
                if (totalPages > 5) {
                    if (currentPage > 3) pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                if (pageNum <= 0 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? 'bg-[#FFB800] text-black shadow-lg scale-110' : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {expandedItem && (
        <GenerationViewer 
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          onPublish={handlePublish}
          publishing={publishing}
          publishStatus={publishStatus}
        />
      )}
    </div>

    <ConfirmationModal 
      isOpen={modal.isOpen}
      title={modal.title}
      message={modal.message}
      type={modal.type}
      onConfirm={() => {
        if (modal.onConfirm) modal.onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      }}
      onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  );
}

const SkeletonItem = () => (
    <div className="aspect-[3/4] md:aspect-square rounded-2xl bg-surface border border-border-subtle overflow-hidden relative">
        <div className="absolute inset-0 shimmer-dark" />
        <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/5 rounded-full" />
    </div>
);

export const GalleryItem = React.memo(({ item, onExpand, onDelete, onDownload, formatDate, progress: externalProgress }: { 
  item: any, 
  onExpand: () => void, 
  onDelete: (e: React.MouseEvent, id: string) => void,
  onDownload: (url: string, filename: string) => void,
  formatDate: (d: string) => string,
  progress?: number | null
}) => {
  const [loaded, setLoaded] = useState(false);
  const [internalProgress, setInternalProgress] = useState(0);

  // Simulated progress logic for items that are stuck in processing without SSE
  useEffect(() => {
    if (item.status === 'processing' && !externalProgress) {
      const interval = setInterval(() => {
        setInternalProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 1;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [item.status, externalProgress]);

  const displayProgress = externalProgress !== undefined && externalProgress !== null ? externalProgress : internalProgress;
  const containerRef = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(containerRef, { threshold: 0.05, freezeOnceVisible: true });
  const isInView = !!entry?.isIntersecting;

  if (item.status === 'processing') {
    return (
      <div className="group relative aspect-square rounded-2xl overflow-hidden border border-[#FFB800]/20 bg-surface/40 p-4 shadow-2xl flex flex-col items-center justify-center gap-3 animate-pulse-glow">
        <div className="absolute inset-0 shimmer-dark opacity-30" />
        
        {/* Centered Percentage and Yellow Spinner */}
        <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 scale-90 sm:scale-100">
          <div className="absolute inset-0 rounded-full border-4 border-[#FFB800]/5" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFB800] animate-spin shadow-[0_0_15px_rgba(255,184,0,0.2)]" />
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-base md:text-xl font-black text-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]">
              {Math.round(displayProgress)}%
            </span>
          </div>
        </div>

        <div className="text-center relative z-10">
          <p className="text-[8px] md:text-[9px] text-[#FFB800]/70 font-black uppercase tracking-widest animate-pulse">
            {item.type === 'video' ? 'Processando Vídeo' : 'Gerando Media'}
          </p>
        </div>

        {/* Mini progress bar at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
          <div 
            className="h-full bg-[#FFB800]/30 transition-all duration-700" 
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    );
  }

  if (item.status === 'failed') {
    return (
      <div className="group relative aspect-square rounded-2xl overflow-hidden border border-red-500/30 bg-red-950/20 p-4 shadow-2xl flex flex-col items-center justify-center gap-3">
        {/* Red glow background */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-red-950/30" />
        
        {/* Error Icon */}
        <div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16">
          <div className="absolute inset-0 rounded-full bg-red-500/10 border border-red-500/20" />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Error Text */}
        <div className="text-center relative z-10 px-2">
          <p className="text-[10px] md:text-[11px] text-red-400 font-black uppercase tracking-widest">
            Erro na Geração
          </p>
          {item.metadata?.error && (
            <p className="text-[8px] text-red-400/50 mt-1 font-medium line-clamp-2">
              {typeof item.metadata.error === 'string' ? item.metadata.error : 'Tente novamente'}
            </p>
          )}
        </div>

        {/* Delete button on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(e, item.id); }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </button>

        {/* Red bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/40" />
      </div>
    );
  }

  // High-performance priority: 1. AVIF Thumbnail, 2. WebP Thumbnail, 3. Original
  const thumbUrl = item.metadata?.thumb_url_avif || item.metadata?.thumb_url || item.result_url;

  return (
    <div 
        ref={containerRef}
        onClick={onExpand} 
        className="group relative aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden bg-surface border border-border-subtle shadow-md cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.97] touch-manipulation"
    >
        {!loaded && <div className="absolute inset-0 shimmer-dark z-10" />}
        
        {isInView && (
            <>
                {item.type === 'video' ? (
                    <div className="w-full h-full relative bg-black/40">
                        <video 
                            src={`${item.result_url}${!item.metadata?.thumb_url ? '#t=0.5' : ''}`} 
                            poster={item.metadata?.thumb_url_avif || item.metadata?.thumb_url}
                            className={`w-full h-full object-cover transition-all duration-1000 ${loaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`} 
                            onLoadedData={() => setLoaded(true)}
                            preload="metadata"
                            muted
                            loop
                            playsInline
                            onMouseEnter={e => {
                                e.currentTarget.play();
                            }}
                            onMouseLeave={e => { 
                                e.currentTarget.pause(); 
                                if (!item.metadata?.thumb_url) e.currentTarget.currentTime = 0.5;
                                else e.currentTarget.currentTime = 0;
                            }}
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-1.5 border border-white/10 z-20">
                            <Play size={8} className="text-[#FFB800]" fill="#FFB800" />
                            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">Visual</span>
                        </div>
                    </div>
                ) : (
                    <picture>
                        {item.metadata?.thumb_url_avif && <source srcSet={item.metadata.thumb_url_avif} type="image/avif" />}
                        {item.metadata?.thumb_url && <source srcSet={item.metadata.thumb_url} type="image/webp" />}
                        <img 
                            src={item.result_url} 
                            alt="Gen" 
                            className={`w-full h-full object-cover transition-all duration-1000 ${loaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`} 
                            onLoad={() => setLoaded(true)}
                            loading="lazy"
                        />
                    </picture>
                )}
            </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 z-30">
            <div className="flex justify-end">
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(e, item.id); }} 
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            
            <div className="flex items-end justify-between">
                <div className="max-w-[70%]">
                    <p className="text-white font-bold text-[10px] truncate mb-0.5">{item.title || item.prompt || 'Conversio AI'}</p>
                    <p className="text-white/50 text-[8px] font-black uppercase tracking-widest">{formatDate(item.created_at)}</p>
                </div>
                <button 
                    onClick={e => {
                        e.stopPropagation();
                        onDownload(item.result_url, `conversio-${item.id}.png`);
                    }} 
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#FFB800] hover:text-black border border-white/10 transition-all"
                >
                    <Download size={14} />
                </button>
            </div>
        </div>
    </div>
  );
});
