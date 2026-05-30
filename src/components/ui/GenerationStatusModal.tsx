import React from 'react';
import { X, Loader2, Video, ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface GenerationStatusModalProps {
  onClose: () => void;
  generations: any[];
}

export function GenerationStatusModal({ onClose, generations }: GenerationStatusModalProps) {
  const processing = generations.filter(g => g.status === 'processing');
  const completed = generations.filter(g => g.status === 'completed');
  const failed = generations.filter(g => g.status === 'error' || g.status === 'failed');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Status de Gerações</h2>
            <p className="text-text-secondary text-xs mt-0.5">Acompanhe suas criações em tempo real.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover text-text-tertiary hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {processing.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">Nenhuma geração ativa no momento.</p>
            </div>
          ) : (
            processing.map((gen, idx) => (
              <div key={gen.id || idx} className="flex items-center gap-4 p-4 rounded-2xl bg-bg-base border border-border-subtle hover:border-accent/30 transition-all group">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface flex items-center justify-center shrink-0 border border-border-subtle relative">
                  {gen.status === 'completed' && gen.result_url ? (
                    <img src={gen.result_url} className="w-full h-full object-cover" />
                  ) : gen.type === 'video' ? (
                    <Video size={20} className="text-[#FFB800]" />
                  ) : (
                    <ImageIcon size={20} className="text-[#FFB800]" />
                  )}
                  {gen.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={16} className="text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-text-primary truncate">{gen.prompt || 'Sem descrição'}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[8px] font-black uppercase">{gen.model}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {gen.status === 'processing' ? (
                        <span className="text-[10px] text-[#FFB800] animate-pulse">Processando...</span>
                      ) : gen.status === 'completed' ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                          <CheckCircle2 size={10} /> Concluída
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-red-500">
                          <AlertCircle size={10} /> Erro
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-text-tertiary uppercase tracking-tighter">
                      {gen.type === 'video' ? 'Vídeo' : 'Imagem'}
                    </span>
                  </div>
                </div>

                {gen.status === 'completed' && (
                   <button 
                     onClick={() => window.open(gen.result_url, '_blank')}
                     className="p-2 rounded-lg bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                     <CheckCircle2 size={16} />
                   </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
