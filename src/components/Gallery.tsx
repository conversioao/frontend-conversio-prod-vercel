import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Trash2, Play, Image as ImageIcon, Video, Maximize2, X, Filter, Loader2, ChevronLeft, ChevronRight, Share2, Globe, Check, CheckCircle2, AlertCircle, Mic, Plus, Folder, Eye, DownloadCloud, Layers } from 'lucide-react';
import { VList } from 'virtua';
import { GenerationViewer } from './ui/GenerationViewer';
import { apiFetch } from '../lib/api';
import { apiCache } from '../lib/apiCache';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const KIT_NAMES: Record<string, string> = {
  'branding-kit': 'Conversio Branding Master',
  'social-ads-kit': 'Conversio Social Ads Kit',
  'brand-amazon': 'Conversio E-Com & Supplements',
  'brand-cosmetics': 'Conversio Premium Skincare & Glow',
  'brand-burger': 'Conversio Gourmet Fast-Food',
  'brand-sweets': 'Conversio Sweet Gelato & Delights'
};

const KIT_COLORS: Record<string, string> = {
  'branding-kit': 'from-blue-500 to-indigo-600 border-blue-500/30',
  'social-ads-kit': 'from-pink-500 to-rose-600 border-pink-500/30',
  'brand-amazon': 'from-green-500 to-emerald-600 border-green-500/30',
  'brand-cosmetics': 'from-purple-500 to-violet-600 border-purple-500/30',
  'brand-burger': 'from-red-500 to-amber-600 border-red-500/30',
  'brand-sweets': 'from-cyan-400 to-pink-500 border-cyan-400/30'
};

export function Gallery({ generationProgress }: { generationProgress?: number | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [expandedItem, setExpandedItem] = useState<any | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 24; // Increased default since kits are grouped

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

  const fetchGenerations = useCallback(async (page: number, silent = false) => {
    if (!user.id) return;

    const cacheKey = `gallery:${user.id}:${page}:${filterType}`;

    // Stale-while-revalidate: mostrar dados em cache imediatamente
    const stale = apiCache.getStale<any>(cacheKey);
    if (stale && !silent) {
      setItems(stale.generations || []);
      setTotalPages(stale.totalPages || 1);
      setTotalItems(stale.totalCount || 0);
      setCurrentPage(stale.currentPage || page);
      if (!apiCache.isStale(cacheKey)) {
        setLoading(false);
        return;
      }
    }

    if (!silent) setLoading(true);
    setError(null);
    try {
      const typeQuery = filterType !== 'all' ? `&type=${filterType}` : '';
      const response = await apiFetch(`/generations?userId=${user.id}&page=${page}&limit=${ITEMS_PER_PAGE}${typeQuery}`);
      if (!response.ok) return;

      const data = await response.json();
      apiCache.set(cacheKey, data, 30);

      setItems(data.generations || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalCount || 0);
      setCurrentPage(data.currentPage || page);

      if (!silent && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      if ((err as any)?.name === 'AbortError') {
        setError('A ligação demorou demasiado. Verifique a sua rede.');
      } else {
        console.error('Error fetching gallery:', err);
        setError('Falha na ligação à base de dados. Verifique a sua conexão.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user.id, filterType]);

  // Fetch when page or filter changes
  useEffect(() => {
    fetchGenerations(currentPage);
  }, [currentPage, filterType, user.id, fetchGenerations]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  // Intelligent polling when processing items are present
  useEffect(() => {
    const processingItems = items.filter(i => i.status === 'processing');
    if (processingItems.length === 0) return;

    let delay = 8000; // Start at 8s for faster feedback
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = () => {
      fetchGenerations(currentPage, true);
      delay = Math.min(delay * 1.5, 30000);
      timeoutId = setTimeout(poll, delay);
    };

    timeoutId = setTimeout(poll, delay);
    return () => clearTimeout(timeoutId);
  }, [items, currentPage, fetchGenerations]);

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

  const handleDelete = useCallback(async (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    setModal({
      isOpen: true,
      title: 'Excluir Criação',
      message: 'Tem certeza que deseja excluir permanentemente esta criação?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await apiFetch(`/generations/${id}`, { method: 'DELETE' });
          if (response.ok) {
            setItems(prev => prev.filter(i => i.id !== id));
            setModal(prev => ({ ...prev, isOpen: false }));
            // If expanded campaign open, remove from internal items list
            if (expandedCampaign) {
              setExpandedCampaign(prev => {
                if (!prev) return null;
                const updatedItems = prev.items.filter((i: any) => i.id !== id);
                if (updatedItems.length === 0) return null;
                return { ...prev, items: updatedItems };
              });
            }
            fetchGenerations(currentPage, true);
          }
        } catch (err) {}
      }
    });
  }, [currentPage, expandedCampaign]);

  const handleDeleteCampaign = useCallback(async (campaign: any) => {
    setModal({
      isOpen: true,
      title: 'Excluir Projeto de Campanha',
      message: `Tem certeza que deseja excluir permanentemente o projeto de campanha "${KIT_NAMES[campaign.model] || 'Campanha'}" com todos os seus ${campaign.items.length} frames?`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          // Delete all items in the campaign sequentially
          const deletePromises = campaign.items.map((i: any) =>
            apiFetch(`/generations/${i.id}`, { method: 'DELETE' })
          );
          await Promise.all(deletePromises);
          
          setItems(prev => prev.filter(i => i.batch_id !== campaign.batch_id));
          setExpandedCampaign(null);
          setModal(prev => ({ ...prev, isOpen: false }));
          fetchGenerations(currentPage);
        } catch (err) {
          console.error("Error deleting campaign:", err);
        }
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

  const handleDownloadAllCampaign = async (campaign: any) => {
    campaign.items.forEach((item: any, idx: number) => {
      if (item.status === 'completed' && item.result_url) {
        setTimeout(() => {
          handleDownload(item.result_url, `conversio-${campaign.batch_id}-frame-${idx + 1}.png`);
        }, idx * 300); // Small stagger to trigger multiple downloads safely in browser
      }
    });
  };

  // Group by batch_id if model is a kit
  const getProcessedItems = () => {
    const processed: any[] = [];
    const seenBatches = new Set<string>();

    items.forEach(item => {
      if (item.batch_id) {
        const isKit = item.model === 'branding-kit' || item.model === 'social-ads-kit' ||
                      item.model === 'brand-amazon' || item.model === 'brand-cosmetics' ||
                      item.model === 'brand-burger' || item.model === 'brand-sweets' || 
                      (item.style && item.style.toLowerCase().includes('kit'));

        if (isKit) {
          if (!seenBatches.has(item.batch_id)) {
            seenBatches.add(item.batch_id);
            const batchItems = items.filter(i => i.batch_id === item.batch_id);
            
            // Derive collective status
            const hasProcessing = batchItems.some(i => i.status === 'processing');
            const allFailed = batchItems.every(i => i.status === 'failed');
            const status = hasProcessing ? 'processing' : allFailed ? 'failed' : 'completed';

            processed.push({
              id: `campaign-${item.batch_id}`,
              isCampaign: true,
              batch_id: item.batch_id,
              model: item.model,
              prompt: item.prompt,
              created_at: item.created_at,
              items: batchItems,
              status
            });
          }
        } else {
          processed.push(item);
        }
      } else {
        processed.push(item);
      }
    });

    return processed;
  };

  const processedItems = getProcessedItems();

  return (
    <>
    <div className="flex flex-col w-full animate-in fade-in duration-500 pb-20 h-[calc(100vh-120px)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-2">Sua Galeria</h1>
          <div className="flex items-center gap-3">
            <p className="text-text-secondary text-sm">Mostrando {processedItems.length} pastas e criações de {totalItems} totais</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-hidden">
             {[...Array(ITEMS_PER_PAGE)].map((_, i) => <SkeletonItem key={i} />)}
          </div>
        ) : processedItems.length === 0 ? (
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {processedItems.map(item => {
              if (item.isCampaign) {
                return (
                  <CampaignCard 
                    key={item.id}
                    campaign={item}
                    onOpen={() => setExpandedCampaign(item)}
                    onDelete={() => handleDeleteCampaign(item)}
                    formatDate={formatDate}
                  />
                );
              }
              return (
                <GalleryItem 
                  key={item.id} 
                  item={item} 
                  onExpand={() => setExpandedItem(item)} 
                  onDelete={handleDelete} 
                  onDownload={handleDownload}
                  formatDate={formatDate}
                  progress={item.status === 'processing' ? generationProgress : null}
                />
              );
            })}
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

      {expandedCampaign && (
        <CampaignViewer 
          campaign={expandedCampaign}
          onClose={() => setExpandedCampaign(null)}
          onSelectItem={(item) => setExpandedItem(item)}
          onDownloadAll={() => handleDownloadAllCampaign(expandedCampaign)}
          onDeleteCampaign={() => handleDeleteCampaign(expandedCampaign)}
          onDeleteFrame={handleDelete}
          formatDate={formatDate}
          onDownload={handleDownload}
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

// Gorgeous Stacked collage card representing a Campaign batch
export function CampaignCard({ campaign, onOpen, onDelete, formatDate }: {
  campaign: any;
  onOpen: () => void;
  onDelete: () => void;
  formatDate: (d: string) => string;
}) {
  const completedItems = campaign.items.filter((i: any) => i.status === 'completed');
  const totalFrames = campaign.items.length;
  
  const kitName = KIT_NAMES[campaign.model] || 'CAMPANHA MASTER';
  const kitColorClass = KIT_COLORS[campaign.model] || 'from-yellow-500 to-amber-500';

  return (
    <div 
      onClick={onOpen}
      className="group relative aspect-[3/4] md:aspect-square rounded-2xl bg-surface border border-border-subtle shadow-md hover:shadow-2xl cursor-pointer transition-all duration-500 hover:scale-[1.02] active:scale-[0.97]"
    >
      {/* 3D Stack Collage of Images */}
      <div className="absolute inset-0 p-3 pb-16 flex items-center justify-center overflow-hidden">
        {campaign.status === 'processing' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-[#FFB800]/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FFB800] animate-spin" />
              <Folder className="w-6 h-6 text-[#FFB800]" />
            </div>
            <span className="text-[9px] text-[#FFB800] font-black uppercase tracking-widest animate-pulse">
              Gerando Kit...
            </span>
          </div>
        ) : campaign.status === 'failed' ? (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle size={24} />
            </div>
            <span className="text-[10px] text-red-400 font-bold uppercase">Campanha Falhou</span>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Frame 3 (Bottom Layer) */}
            {completedItems[2] && (
              <img 
                src={completedItems[2].result_url} 
                alt="Stack 3" 
                className="absolute w-2/3 aspect-square object-cover rounded-xl border border-white/5 opacity-40 shadow-lg translate-y-[-12px] rotate-[-6deg] transition-all duration-500 group-hover:rotate-[-10deg] group-hover:translate-x-[-15px]" 
              />
            )}
            
            {/* Frame 2 (Middle Layer) */}
            {completedItems[1] && (
              <img 
                src={completedItems[1].result_url} 
                alt="Stack 2" 
                className="absolute w-2/3 aspect-square object-cover rounded-xl border border-white/5 opacity-70 shadow-xl translate-y-[-6px] rotate-[6deg] transition-all duration-500 group-hover:rotate-[10deg] group-hover:translate-x-[15px]" 
              />
            )}

            {/* Frame 1 (Top Layer) */}
            {completedItems[0] ? (
              <img 
                src={completedItems[0].result_url} 
                alt="Stack 1" 
                className="relative w-2/3 aspect-square object-cover rounded-xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-105" 
              />
            ) : (
              <div className="w-2/3 aspect-square rounded-xl bg-white/5 flex items-center justify-center">
                <Folder className="w-8 h-8 text-text-tertiary" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Campaign Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-30 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${kitColorClass} animate-pulse`} />
        <span className="text-[7px] font-black text-white uppercase tracking-[0.25em]">{kitName}</span>
      </div>

      {/* Floating Frames Count (Top Right) */}
      <div className="absolute top-3 right-3 z-30 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/5 text-[8px] font-black text-[#FFB800] uppercase tracking-wider">
        {totalFrames} FRAMES
      </div>

      {/* Overlay Dark Gradient & Campaign Info Footer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4 z-20">
        <div className="flex justify-between items-end">
          <div className="max-w-[75%]">
            <h3 className="text-white font-black text-xs tracking-tight line-clamp-1 group-hover:text-[#FFB800] transition-colors">
              {campaign.prompt || 'Projeto de Marca'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Layers size={10} className="text-text-secondary" />
              <p className="text-white/50 text-[8px] font-bold uppercase tracking-widest">{formatDate(campaign.created_at)}</p>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all opacity-0 group-hover:opacity-100 z-30"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Fullscreen Modal Viewer for grouped Campaign batches
export function CampaignViewer({ campaign, onClose, onSelectItem, onDownloadAll, onDeleteCampaign, onDeleteFrame, formatDate, onDownload }: {
  campaign: any;
  onClose: () => void;
  onSelectItem: (item: any) => void;
  onDownloadAll: () => void;
  onDeleteCampaign: () => void;
  onDeleteFrame: (e: React.MouseEvent, id: string) => void;
  formatDate: (d: string) => string;
  onDownload: (url: string, filename: string) => Promise<void> | void;
}) {
  const completedCount = campaign.items.filter((i: any) => i.status === 'completed').length;
  const totalCount = campaign.items.length;
  
  const kitName = KIT_NAMES[campaign.model] || 'CAMPANHA MASTER';
  const kitColorClass = KIT_COLORS[campaign.model] || 'from-yellow-500 to-amber-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-[#0B0C10] border border-white/10 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
        
        {/* Header Block */}
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 bg-white/[0.01]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${kitColorClass} text-[8px] font-black text-white tracking-[0.2em]`}>
                {kitName}
              </div>
              <span className="text-[10px] text-text-secondary">• {completedCount} de {totalCount} frames prontos</span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight line-clamp-1">
              {campaign.prompt || 'Campanha de Branding Consistente'}
            </h2>
            <p className="text-xs text-text-tertiary">Criada a {formatDate(campaign.created_at)}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={onDownloadAll}
              disabled={completedCount === 0}
              className="px-5 py-2.5 rounded-full bg-[#FFB800] hover:bg-[#E0A200] disabled:bg-white/5 disabled:text-white/20 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,184,0,0.2)] disabled:shadow-none"
            >
              <DownloadCloud size={14} />
              Baixar Todos ({completedCount})
            </button>

            <button 
              onClick={onDeleteCampaign}
              className="px-5 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Trash2 size={14} />
              Excluir Campanha
            </button>

            <button 
              onClick={onClose}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Frames Grid Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {campaign.items.map((item: any, idx: number) => {
              const frameName = item.style || `Frame ${idx + 1}`;
              
              if (item.status === 'processing') {
                return (
                  <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border border-[#FFB800]/20 bg-surface/30 p-4 flex flex-col items-center justify-center gap-3 animate-pulse">
                    <div className="absolute inset-0 shimmer-dark opacity-20" />
                    <div className="relative flex items-center justify-center w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FFB800] animate-spin" />
                      <Folder className="w-5 h-5 text-[#FFB800]" />
                    </div>
                    <span className="text-[8px] text-[#FFB800]/70 font-black uppercase tracking-widest">Frame {idx + 1}</span>
                  </div>
                );
              }

              if (item.status === 'failed') {
                return (
                  <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border border-red-500/20 bg-red-950/10 p-4 flex flex-col items-center justify-center gap-3">
                    <AlertCircle size={20} className="text-red-400" />
                    <span className="text-[9px] text-red-400 font-bold uppercase">Erro no Frame {idx + 1}</span>
                  </div>
                );
              }

              return (
                <div 
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-surface border border-border-subtle cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <img 
                    src={item.result_url} 
                    alt={frameName} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Top-Right Order Frame Badge */}
                  <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/5 text-[8px] font-black text-white">
                    FRAME {idx + 1}
                  </div>

                  {/* Individual Actions Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3 z-20">
                    <div className="flex justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteFrame(e, item.id); }}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-[9px] line-clamp-1 max-w-[70%]">{frameName}</span>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          onDownload(item.result_url, `conversio-${campaign.batch_id}-frame-${idx + 1}.png`);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FFB800] hover:text-black border border-white/10 transition-all"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

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
                            src={item.result_url}
                            poster={item.metadata?.thumb_url_avif || item.metadata?.thumb_url}
                            className={`w-full h-full object-cover transition-all duration-1000 ${loaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`} 
                            onLoadedData={() => setLoaded(true)}
                            preload="none"
                            muted
                            loop
                            playsInline
                            onMouseEnter={e => {
                                e.currentTarget.play();
                            }}
                            onMouseLeave={e => { 
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                            }}
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-1.5 border border-white/10 z-20">
                            <Play size={8} className="text-[#FFB800]" fill="#FFB800" />
                            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">Visual</span>
                        </div>
                    </div>
                ) : (item.type === 'audio' || item.type === 'music' || item.type === 'musica' || item.type === 'voice') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-bg-base relative p-6">
                        <div className="w-20 h-20 rounded-full bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] border border-[#FFB800]/20 shadow-[0_0_30px_rgba(255,184,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                            <Mic size={32} />
                        </div>
                        <p className="mt-4 text-[10px] font-black text-white uppercase tracking-widest text-center px-4 line-clamp-2">
                            {item.metadata?.title || 'Geração de Áudio'}
                        </p>
                        
                        <div className="absolute bottom-4 left-0 right-0 px-6 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#FFB800] animate-pulse w-1/3" />
                             </div>
                        </div>

                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-1.5 border border-white/10 z-20">
                            <Mic size={8} className="text-[#FFB800]" />
                            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">Áudio</span>
                        </div>
                        <audio src={item.result_url} onLoadedData={() => setLoaded(true)} className="hidden" />
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
                        onDownload(item.result_url, `conversio-${item.id}.${item.type === 'video' ? 'mp4' : (item.type === 'audio' || item.type === 'music' || item.type === 'musica') ? 'mp3' : 'png'}`);
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
