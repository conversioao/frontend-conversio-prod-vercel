import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Mic, Check, Globe, Download, Loader2, CheckCircle2, AlertCircle, Edit2, Copy } from 'lucide-react';
import { ImageEditor } from './ImageEditor';
import { ConfirmationModal } from './ConfirmationModal';

interface GenerationViewerProps {
  item: any;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPublish?: (item: any) => void;
  publishing?: string | null;
  publishStatus?: { id: string; success: boolean; message: string } | null;
}

export function GenerationViewer({ 
  item, 
  onClose, 
  onPrev, 
  onNext, 
  onPublish,
  publishing,
  publishStatus
}: GenerationViewerProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [userLogo, setUserLogo] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('conversio_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.brand_logo_url) setUserLogo(user.brand_logo_url);
      }
    } catch(e) {}

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Reset loaded state when item changes
  useEffect(() => {
    setImgLoaded(false);
  }, [item?.id]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) onNext();
      else onPrev();
    } else if (dy < -60 && Math.abs(dy) > Math.abs(dx)) {
      // Swipe up → show info panel
      setShowPanel(true);
    } else if (dy > 60 && Math.abs(dy) > Math.abs(dx) && showPanel) {
      setShowPanel(false);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!item) return null;

  const isVideo = item.type === 'video' || item.result_url?.toLowerCase().endsWith('.mp4') || item.result_url?.toLowerCase().endsWith('.webm');
  const isVoice = item.type === 'voice';

  const safeCopy = getSafeText(item.metadata?.copy || item.metadata?.copy_anuncio || item.copy);
  const safeHashtags = typeof (item.metadata?.hashtags || item.metadata?.hashtags_anuncio || item.hashtags) === 'string'
    ? (item.metadata?.hashtags || item.metadata?.hashtags_anuncio || item.hashtags)
    : (Array.isArray(item.metadata?.hashtags || item.metadata?.hashtags_anuncio || item.hashtags)
      ? (item.metadata?.hashtags || item.metadata?.hashtags_anuncio || item.hashtags).join(' ')
      : '');

  const handleDownload = async () => {
    try {
      const response = await fetch(item.result_url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `conversio-${item.id}.${isVideo ? 'mp4' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(item.result_url, '_blank');
    }
  };

  return (
    <>
      {/* ─── MOBILE: Full-Screen Native Viewer ─────────────────────────── */}
      <div
        className="fixed inset-0 z-[200] md:hidden flex flex-col bg-black"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-safe-top py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Media — full viewport height, proper aspect */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
          {!imgLoaded && !isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {isVideo ? (
            <video
              src={item.result_url}
              className="w-full h-full object-contain"
              controls
              autoPlay
              loop
              playsInline
              preload="auto"
              poster={item.metadata?.thumb_url || ''}
            />
          ) : isVoice ? (
            <div className="flex flex-col items-center gap-6 p-8">
              <div className="w-24 h-24 rounded-full bg-[#FFB800]/20 flex items-center justify-center animate-pulse">
                <Mic size={48} className="text-[#FFB800]" />
              </div>
              <audio src={item.result_url} className="w-full" controls autoPlay />
            </div>
          ) : (
            <img
              src={item.result_url}
              alt="Geração IA"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {/* Prev / Next hit areas */}
          <button
            onClick={onPrev}
            className="absolute left-0 top-0 bottom-0 w-1/4 z-20 flex items-center pl-2 opacity-0 active:opacity-100"
          >
            <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <ChevronLeft size={20} className="text-white" />
            </div>
          </button>
          <button
            onClick={onNext}
            className="absolute right-0 top-0 bottom-0 w-1/4 z-20 flex items-center justify-end pr-2 opacity-0 active:opacity-100"
          >
            <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
              <ChevronRight size={20} className="text-white" />
            </div>
          </button>
        </div>

        {/* Swipe-up hint */}
        {!showPanel && (
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 z-10 pointer-events-none">
            <div className="w-8 h-1 rounded-full bg-white/30" />
            <p className="text-[10px] text-white/40 font-medium">Deslize para ver legenda</p>
          </div>
        )}

        {/* Info Panel — swipe up sheet */}
        <div
          className={`absolute left-0 right-0 bottom-0 z-30 transition-transform duration-300 ease-out ${showPanel ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ maxHeight: '75vh' }}
        >
          <div className="bg-[#0A0A0A]/95 backdrop-blur-xl rounded-t-[2rem] border-t border-white/10 flex flex-col overflow-hidden" style={{ maxHeight: '75vh' }}>
            {/* Handle */}
            <button onClick={() => setShowPanel(false)} className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </button>

            <div className="overflow-y-auto px-5 pb-8 flex flex-col gap-4 custom-scrollbar">
              <h3 className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.2em]">CONTEÚDO FINAL</h3>

              <div className="bg-[#FFB800]/5 rounded-2xl p-4 border border-[#FFB800]/10">
                <div className="text-white/90 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                  <RenderCopy copy={item.metadata?.copy || item.metadata?.copy_anuncio || item.copy || item.metadata?.caption || item.metadata?.text} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {safeHashtags?.split(' ').filter(Boolean).map((tag: string, i: number) => (
                    <span key={i} className="text-[#FFB800] text-[10px] font-black uppercase tracking-wider opacity-60">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${safeCopy}\n\n${safeHashtags}`);
                    setModal({ isOpen: true, title: 'Copiado!', message: 'Legenda e hashtags copiadas.', type: 'success' });
                  }}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                >
                  <Check size={16} strokeWidth={3} /> Copiar Tudo
                </button>
                {item.type === 'image' && (
                  <button
                    onClick={() => setShowEditor(true)}
                    className="w-full py-4 rounded-2xl bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                  >
                    <Edit2 size={16} /> Adicionar Logótipo
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="w-full py-4 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 active:scale-[0.97] transition-transform"
                >
                  <Download size={16} /> Baixar {isVideo ? 'Vídeo' : 'Imagem'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tap outside panel to close it */}
        {showPanel && (
          <div className="absolute inset-0 z-20" onClick={() => setShowPanel(false)} />
        )}
      </div>

      {/* ─── DESKTOP: Split-panel viewer ───────────────────────────────── */}
      <div className="fixed inset-0 z-[200] hidden md:flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
        {/* Close */}
        <button
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-[110] transition-colors"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Nav */}
        <button
          className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white z-[110] active:scale-95 border border-white/10 transition-all"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <ChevronLeft size={32} />
        </button>
        <button
          className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white z-[110] active:scale-95 border border-white/10 transition-all"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <ChevronRight size={32} />
        </button>

        {/* Container */}
        <div
          className="flex flex-col lg:flex-row w-full max-w-[1200px] max-h-[90vh] bg-[#0A0A0A] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: Media */}
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[40vh] lg:min-h-0 overflow-hidden">
            {isVideo ? (
              <video
                src={item.result_url}
                className="max-w-full max-h-full object-contain"
                controls autoPlay loop playsInline
                muted={!item.metadata?.thumb_url}
                preload="auto"
                poster={item.metadata?.thumb_url || item.metadata?.thumbnail_url || ''}
              />
            ) : isVoice ? (
              <div className="w-full max-w-lg aspect-square flex flex-col items-center justify-center p-12 bg-white/5 rounded-[3rem] border border-white/10">
                <div className="w-32 h-32 rounded-full bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800] mb-8 animate-pulse">
                  <Mic size={56} />
                </div>
                <audio src={item.result_url} className="w-full h-12" controls autoPlay />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={item.result_url}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                  alt="Geração IA"
                />
              </div>
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="w-full lg:w-[420px] p-8 flex flex-col gap-6 overflow-y-auto bg-[#0F0F0F] border-l border-white/5">
            <div>
              <h3 className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.2em] mb-3">CONTEÚDO FINAL</h3>
              <div className="bg-[#FFB800]/5 rounded-2xl p-5 border border-[#FFB800]/10">
                <div className="text-white/90 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">
                  <RenderCopy copy={item.metadata?.copy || item.metadata?.copy_anuncio || item.copy || item.metadata?.caption || item.metadata?.text} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {safeHashtags?.split(' ').filter(Boolean).map((tag: string, i: number) => (
                    <span key={i} className="text-[#FFB800] text-[10px] font-black uppercase tracking-wider opacity-60">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${safeCopy}\n\n${safeHashtags}`);
                  setModal({ isOpen: true, title: 'Conteúdo Copiado', message: 'A legenda e as hashtags foram copiadas.', type: 'success' });
                }}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl"
              >
                <Check size={16} strokeWidth={3} /> Copiar Tudo
              </button>
              {item.type === 'image' && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="w-full py-4 rounded-2xl bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FFB800]/20 active:scale-[0.98] transition-all"
                >
                  <Edit2 size={18} /> Adicionar Logótipo
                </button>
              )}
              <button
                onClick={handleDownload}
                className="w-full py-4 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                <Download size={18} /> Baixar {isVideo ? 'Vídeo' : 'Imagem'}
              </button>
              <div className="flex items-center justify-between text-[9px] text-white/30 px-2 mt-2 font-black uppercase tracking-widest">
                <span>{item.model || item.metadata?.model}</span>
                <span>{new Date(item.created_at).toLocaleDateString('pt-PT')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditor && (
        <ImageEditor
          imageUrl={item.result_url}
          brandLogoUrl={userLogo}
          onClose={() => setShowEditor(false)}
        />
      )}

      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

function RenderCopy({ copy }: { copy: any }) {
  if (!copy) return <span>Crie uma legenda para esta imagem.</span>;

  let parsedCopy = copy;
  if (typeof copy === 'string' && (copy.startsWith('{') || copy.startsWith('['))) {
    try { parsedCopy = JSON.parse(copy); } catch(e) {}
  }

  if (typeof parsedCopy === 'object' && parsedCopy !== null) {
    return (
      <div className="flex flex-col gap-4">
        {parsedCopy.headline && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[9px] font-black text-[#FFB800] uppercase block mb-1">Gancho / Headline</span>
            <p className="text-white font-bold">{parsedCopy.headline}</p>
          </div>
        )}
        {parsedCopy.corpo && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Corpo do Anúncio</span>
            <p className="text-white/70 text-sm leading-relaxed">{parsedCopy.corpo}</p>
          </div>
        )}
        {parsedCopy.cta && (
          <div className="p-3 bg-[#FFB800]/10 rounded-xl border border-[#FFB800]/20">
            <span className="text-[9px] font-black text-[#FFB800] uppercase block mb-1">CTA</span>
            <p className="text-[#FFB800] font-black italic">{parsedCopy.cta}</p>
          </div>
        )}
        {!parsedCopy.headline && !parsedCopy.corpo && !parsedCopy.cta && (
          <p className="text-white/80">{JSON.stringify(parsedCopy)}</p>
        )}
      </div>
    );
  }

  return <p>{parsedCopy}</p>;
}

function getSafeText(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    if (val.startsWith('{') || val.startsWith('[')) {
      try {
        const parsed = JSON.parse(val);
        return getSafeText(parsed);
      } catch(e) {}
    }
    return val;
  }
  if (typeof val === 'object' && val !== null) {
    return val.headline || val.title || val.corpo || val.text || val.copy || JSON.stringify(val);
  }
  return String(val);
}
