import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Music, Mic, Play, Pause, Download, Trash2, Calendar, Search, X, FileText, ChevronDown, ChevronUp, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface Generation {
  id: string;
  prompt: string;
  title?: string;
  batch_id: string;
  type: string;
  status: string;
  model?: string;
  style?: string;
  result_url?: string;
  copy?: string;
  created_at: string;
  metadata?: any;
}

interface BatchGroup {
  batch_id: string;
  title?: string;
  prompt: string;
  type: string;
  model?: string;
  style?: string;
  copy?: string;
  created_at: string;
  items: Generation[];
  hasCompleted: boolean;
}

export function AudioGallery() {
  const [batches, setBatches] = useState<BatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchGroup | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 16;

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedCopy, setExpandedCopy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<BatchGroup | null>(null);

  // Use a ref to capture the current user ID to avoid race conditions
  const userIdRef = useRef<string | null>(null);

  const fetchGenerations = useCallback(async (page: number) => {
    const userStr = localStorage.getItem('conversio_user') || localStorage.getItem('user') || '{}';
    const user = JSON.parse(userStr);
    const userId = user.id;
    
    if (!userId) {
        console.warn('[AudioGallery] No userId found yet.');
        return;
    }
    
    setLoading(true);
    try {
      // Simplification: Always fetch all audio types (mostly musica/music now)
      const types = 'musica,music,audio';
      const res = await apiFetch(`/generations?userId=${userId}&page=${page}&limit=50&type=${types}`);
      const data = await res.json();
      
      if (data.success) {
        const batchMap = new Map<string, BatchGroup>();
        data.generations.forEach((gen: any) => {
          const key = gen.batch_id || gen.id;
          const meta = gen.metadata || {};
          const batchTitle = gen.title || meta.title || meta.song_title || 'Música Original';
          const batchCopy = gen.copy || meta.lyric || meta.lyrics || meta.lyrics_text || gen.lyrics;

          if (!batchMap.has(key)) {
            batchMap.set(key, {
              batch_id: key,
              title: batchTitle,
              prompt: gen.prompt,
              type: gen.type,
              model: gen.model,
              style: gen.style || meta.style_generated || meta.style,
              copy: batchCopy,
              created_at: gen.created_at,
              items: [],
              hasCompleted: false,
            });
          }
          const batch = batchMap.get(key)!;
          batch.items.push(gen);
          if (gen.status === 'completed' && gen.result_url) batch.hasCompleted = true;
          if (batchCopy && !batch.copy) batch.copy = batchCopy;
          if (batchTitle && batch.title === 'Música Original') batch.title = batchTitle;
        });

        console.log(`[AudioGallery] 🎵 Received ${data.generations.length} records, processed into ${batchMap.size} batches.`);
        setBatches(Array.from(batchMap.values()));
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalCount || 0);
        setCurrentPage(data.currentPage || page);
      }
    } catch (err) {
      console.error('[AudioGallery] Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenerations(currentPage);
    
    // Auto-polling if processing items exist
    const hasProcessing = batches.some(b => !b.hasCompleted);
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchGenerations(currentPage);
      }, 10000); // 10s
      return () => clearInterval(interval);
    }
  }, [currentPage, fetchGenerations, batches.some(b => !b.hasCompleted)]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const handleDeleteBatch = async (batch: BatchGroup) => {
    const userStr = localStorage.getItem('conversio_user') || localStorage.getItem('user') || '{}';
    const user = JSON.parse(userStr);
    
    try {
      await Promise.all(
        batch.items.map((item) =>
          apiFetch(`/generations/${item.id}?userId=${user.id}`, { method: 'DELETE' })
        )
      );
      setBatches((prev) => prev.filter((b) => b.batch_id !== batch.batch_id));
      if (selectedBatch?.batch_id === batch.batch_id) setSelectedBatch(null);
      if (batch.items.some((i) => i.id === playingId)) {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      setShowDeleteModal(false);
      setBatchToDelete(null);
      fetchGenerations(currentPage);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingId(id);
      }
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const matchSearch =
      (b.title || '').toLowerCase().includes(s) ||
      (b.prompt || '').toLowerCase().includes(s);
    return matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">
            Biblioteca de <span className="text-[#FFB800]">Músicas</span>
          </h1>
          <p className="text-text-secondary font-medium">Suas composições musicais e trilhas sonoras • {totalItems} itens.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-[#FFB800] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-surface border border-border-subtle rounded-2xl outline-none focus:border-[#FFB800]/50 transition-all w-full md:w-64 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 bg-surface/50 rounded-3xl animate-pulse border border-border-subtle border-dashed" />
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface/30 rounded-[3rem] border border-border-subtle border-dashed">
          <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center text-text-tertiary mb-6 border border-border-subtle shadow-inner">
            <Music size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">A tua música está a caminho</h3>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">As tuas criações aparecerão aqui após a conclusão da geração.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredBatches.map((batch) => {
              const completedCount = batch.items.filter(i => i.status === 'completed').length;
              const statusText = !batch.hasCompleted ? 'A processar...' : `${completedCount} ${completedCount === 1 ? 'versão pronta' : 'versões prontas'}`;
              const statusColor = !batch.hasCompleted ? 'text-[#FFB800]' : 'text-emerald-400';

              return (
                <motion.div
                  key={batch.batch_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedBatch(batch)}
                  className="relative bg-surface border border-border-subtle rounded-3xl p-5 cursor-pointer hover:border-[#FFB800]/50 hover:shadow-xl hover:shadow-[#FFB800]/5 transition-all group overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 bg-[#FFB800]`} />

                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className={`p-2.5 rounded-2xl bg-[#FFB800]/10 text-[#FFB800]`}>
                      <Music size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{statusText}</p>
                      <p className="text-[10px] text-text-tertiary uppercase font-medium truncate">{batch.model || 'Conversio AI'}{batch.style ? ` · ${batch.style}` : ''}</p>
                    </div>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setBatchToDelete(batch);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-text-primary line-clamp-2 mb-3 relative z-10">
                    {batch.title || batch.prompt || 'Trilha Sonora'}
                  </h4>

                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                      <Calendar size={10} /> {new Date(batch.created_at).toLocaleDateString('pt-PT')}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-text-tertiary group-hover:text-[#FFB800] transition-colors font-bold uppercase tracking-wider">
                      Ouvir música →
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12 pb-8">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-3 bg-surface border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1.5">
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
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === pageNum ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'bg-surface text-text-tertiary hover:text-text-primary border border-border-subtle'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-3 bg-surface border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ============ DETAIL MODAL ============ */}
      <AnimatePresence>
        {selectedBatch && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedBatch(null)}
          >
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-bg-base border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface/50">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl bg-[#FFB800]/10 text-[#FFB800]`}>
                    <Music size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text-primary">
                      {selectedBatch.title || selectedBatch.prompt?.substring(0, 50) || 'Música AI'}
                    </h2>
                    <p className="text-xs text-text-tertiary">
                       {selectedBatch.model || 'AI'}{selectedBatch.style ? ` · Estilo: ${selectedBatch.style}` : ''} · {new Date(selectedBatch.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="p-2.5 text-text-tertiary hover:text-white hover:bg-surface rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pb-10">
                <div className="px-6 pt-5">
                  <p className="text-sm text-text-secondary italic mb-6 bg-surface/40 p-4 rounded-2xl border border-border-subtle">
                    "{selectedBatch.prompt}"
                  </p>
                </div>

                {selectedBatch.copy && (
                  <div className="px-6 mb-6">
                    <button
                      onClick={() => setExpandedCopy(!expandedCopy)}
                      className="w-full flex items-center justify-between p-4 bg-surface/60 border border-border-subtle rounded-2xl hover:border-[#FFB800]/40 transition-all font-bold text-text-primary"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-[#FFB800]" /> Letra / Composição
                      </div>
                      {expandedCopy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <AnimatePresence>
                      {expandedCopy && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-5 bg-surface/40 border border-border-subtle rounded-2xl text-sm text-text-secondary whitespace-pre-wrap leading-relaxed font-medium">
                            {selectedBatch.copy}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="px-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary mb-3">
                    Faixas Disponíveis
                  </h3>
                  <div className="flex flex-col gap-3">
                    {selectedBatch.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          playingId === item.id
                            ? 'bg-[#FFB800]/10 border-[#FFB800]/40'
                            : 'bg-surface border-border-subtle hover:border-[#FFB800]/30'
                        }`}
                      >
                        <button
                          disabled={item.status !== 'completed' || !item.result_url}
                          onClick={() => item.result_url && togglePlay(item.id, item.result_url)}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-md ${
                            item.status !== 'completed'
                              ? 'bg-surface-hover text-text-tertiary cursor-not-allowed'
                              : playingId === item.id
                              ? 'bg-text-primary text-white scale-95'
                              : 'bg-[#FFB800] text-black hover:scale-110'
                          }`}
                        >
                          {item.status === 'processing' ? (
                            <div className="w-4 h-4 border-2 border-text-tertiary/30 border-t-[#FFB800] rounded-full animate-spin" />
                          ) : playingId === item.id ? (
                            <Pause size={18} fill="currentColor" />
                          ) : (
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {selectedBatch.items.length > 1 ? `Versão ${idx + 1}` : 'Versão Principal'}
                            {playingId === item.id && (
                              <span className="ml-2 text-[#FFB800] text-xs animate-pulse">▶ Reproduzindo</span>
                            )}
                          </p>
                          <p className="text-xs text-text-tertiary uppercase tracking-wider">
                            {item.status === 'processing' ? 'Preparando...' : item.status === 'completed' ? 'Alta Fidelidade' : item.status}
                          </p>
                        </div>

                        {item.status === 'completed' && item.result_url && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDownload(item.result_url!, `conversio-music-${item.id}.mp3`);
                            }}
                            className="p-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/50 transition-all"
                          >
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Eliminar Música"
        message="Deseja eliminar esta criação musical? Esta ação não pode ser revertida."
        confirmLabel="Eliminar Definitivamente"
        type="error"
        onConfirm={() => batchToDelete && handleDeleteBatch(batchToDelete)}
        onCancel={() => {
          setShowDeleteModal(false);
          setBatchToDelete(null);
        }}
      />
    </div>
  );
}
