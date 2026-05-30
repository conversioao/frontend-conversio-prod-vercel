import React, { useState } from 'react';
import { Download, AlertCircle, Loader2, CheckCircle2, Maximize2, Share2, RefreshCw, X, Archive } from 'lucide-react';
import type { IdentityItem } from '../../services/brandingIdentityAgent';

interface StepThreeProps {
  data: {
    step1: any;
    step2: any;
  };
  onSave: () => void;
  onReset: () => void;
  onRetryItem: (itemId: string, estilo: string) => void;
  isSaving: boolean;
  isSaved: boolean;
  isGeneratingIdentity?: boolean;
  identityProgress?: { status: string; completed: number; total: number };
  identityDna?: any;
  identityItems?: IdentityItem[];
  identityError?: string | null;
}

export function StepThree({ 
  data, onSave, onReset, onRetryItem, isSaving, isSaved, 
  isGeneratingIdentity, identityProgress, identityDna, identityItems = [], identityError 
}: StepThreeProps) {
  
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // ─── Loading State ───
  if (isGeneratingIdentity && identityProgress) {
    const percent = Math.round((identityProgress.completed / identityProgress.total) * 100) || 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-8 animate-in fade-in zoom-in duration-500">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="60" className="stroke-white/10 fill-none" strokeWidth="6" />
            <circle 
              cx="64" cy="64" r="60" 
              className="stroke-[#FFB800] fill-none transition-all duration-1000 ease-out" 
              strokeWidth="6" 
              strokeDasharray="377" 
              strokeDashoffset={377 - (377 * percent) / 100} 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#FFB800]">{percent}%</span>
          </div>
        </div>
        <div className="text-center flex flex-col gap-2">
          <p className="text-white text-xl font-bold">{identityProgress.status}</p>
          <p className="text-[#FFB800] text-sm font-bold tracking-wider uppercase">
            A gerar item {identityProgress.completed} de {identityProgress.total}...
          </p>
        </div>
        
        {/* Render already generated items as small thumbnails */}
        <div className="flex gap-3 flex-wrap justify-center max-w-2xl mt-4">
          {identityItems.map(item => (
            <div key={item.id} className="relative w-14 h-14 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center transition-all group">
              {item.status === 'completed' && item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover animate-in fade-in zoom-in" />
              ) : item.status === 'failed' ? (
                <AlertCircle size={20} className="text-red-500" />
              ) : (
                <Loader2 size={20} className="text-[#FFB800] animate-spin" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Global Error State ───
  if (identityError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-red-500/20 bg-red-500/5 rounded-3xl gap-4">
        <AlertCircle size={40} className="text-red-500" />
        <p className="text-white font-bold text-lg">Ocorreu um erro</p>
        <p className="text-white/60 text-center max-w-md">{identityError}</p>
        <button 
          onClick={onReset}
          className="mt-4 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
        >
          Voltar e tentar novamente
        </button>
      </div>
    );
  }

  const downloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      // Create a sequential download effect
      for (const item of identityItems) {
        if (item.status === 'completed' && item.imageUrl) {
          const a = document.createElement('a');
          a.href = item.imageUrl;
          a.download = `${data.step1.brandName.replace(/\s+/g, '_')}_${item.id}.jpg`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise(r => setTimeout(r, 600)); // small delay between downloads
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copiado para a área de transferência!');
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ─── Header Principal ─── */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 bg-[#FFB800]/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 size={32} className="text-[#FFB800]" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">A tua Identidade de Marca está pronta ✓</h2>
        <p className="text-lg font-medium text-white/50">Todos os materiais para a <span className="text-[#FFB800] font-bold">{data.step1.brandName}</span> foram gerados.</p>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ─── DNA Visual ─── */}
      {identityDna && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
              Paleta de Cores
            </label>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 h-full flex flex-col gap-4">
              <div className="flex items-center gap-3 w-full">
                {(['primaria', 'secundaria', 'acento', 'neutro', 'fundo'] as const).map((key) => {
                  const hex = identityDna.paleta[key];
                  if (!hex) return null;
                  return (
                    <div key={key} className="flex flex-col items-center gap-2 flex-1 group">
                      <div 
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110" 
                        style={{ backgroundColor: hex }} 
                      />
                      <span className="text-[10px] text-white/40 font-mono group-hover:text-white transition-colors">{hex}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-white/50 text-center mt-2 italic">"{identityDna.estiloGeral}"</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
              Tipografia Oficial
            </label>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 h-full flex flex-col gap-6 justify-center">
              <div className="flex items-center gap-6">
                <div className="flex-1 border-r border-white/10 pr-6">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Fonte de Título</p>
                  <p className="text-2xl font-black text-white">{identityDna.tipografia?.titulo || 'Inter'}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Fonte de Corpo</p>
                  <p className="text-xl font-medium text-white/80">{identityDna.tipografia?.corpo || 'Roboto'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Grid de Items ─── */}
      <div className="flex flex-col gap-6 mt-4">
        <label className="text-[11px] font-black text-[#FFB800] uppercase tracking-[0.2em] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FFB800]" />
          Materiais Gerados (10)
        </label>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {identityItems.map(item => {
            const isFailed = item.status === 'failed';
            return (
              <div key={item.id} className="group relative flex flex-col gap-3">
                <div 
                  className={`relative bg-black/40 border rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center transition-all ${
                    isFailed ? 'border-red-500/20' : 'border-white/10 group-hover:border-[#FFB800]/50 group-hover:shadow-[0_0_20px_rgba(255,184,0,0.15)]'
                  }`}
                >
                  {item.status === 'completed' && item.imageUrl ? (
                    <>
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all duration-300">
                        <button 
                          onClick={() => setModalImage(item.imageUrl!)}
                          className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all backdrop-blur"
                        >
                          <Maximize2 size={16} />
                        </button>
                        <a 
                          href={item.imageUrl} 
                          target="_blank" 
                          download={`${item.id}.jpg`}
                          className="w-10 h-10 rounded-full bg-[#FFB800] text-black flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_15px_rgba(255,184,0,0.5)]"
                        >
                          <Download size={16} strokeWidth={3} />
                        </a>
                      </div>
                    </>
                  ) : isFailed ? (
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={28} className="text-red-500/60" />
                      <button 
                        onClick={() => onRetryItem(item.id, identityDna?.estiloGeral || '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-500/20 transition-colors uppercase"
                      >
                        <RefreshCw size={12} /> Tentar de novo
                      </button>
                    </div>
                  ) : (
                    <Loader2 size={24} className="text-[#FFB800] animate-spin" />
                  )}
                </div>
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-wider group-hover:text-white transition-colors">
                    {item.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Botões Finais de Acção ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-white/5 mt-4">
        <button
          onClick={downloadAll}
          disabled={isDownloadingAll}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,184,0,0.2)] hover:shadow-[0_0_30px_rgba(255,184,0,0.4)] w-full"
        >
          {isDownloadingAll ? <Loader2 size={18} className="animate-spin" /> : <Archive size={18} />}
          {isDownloadingAll ? 'A preparar download...' : 'Descarregar Tudo (ZIP)'}
        </button>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all w-full sm:w-auto"
          >
            <Share2 size={18} />
            Partilhar
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-white/50 hover:text-white font-bold text-sm transition-all w-full sm:w-auto"
          >
            <RefreshCw size={18} />
            Gerar Nova Identidade
          </button>
        </div>
      </div>

      {/* ─── Modal de Visualização (Imagem) ─── */}
      {modalImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setModalImage(null)}
              className="absolute -top-16 right-0 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all border border-white/20 hover:rotate-90"
            >
              <X size={24} />
            </button>
            <img 
              src={modalImage} 
              alt="Preview Expandido" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]" 
            />
          </div>
        </div>
      )}

    </div>
  );
}
