import React from 'react';
import { X, AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'confirm'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const icons = {
    info: <Info className="text-blue-500" size={32} />,
    warning: <AlertCircle className="text-yellow-500" size={32} />,
    error: <AlertCircle className="text-red-500" size={32} />,
    success: <CheckCircle2 className="text-emerald-500" size={32} />,
    confirm: <HelpCircle className="text-[#FFB800]" size={32} />
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-6 p-4 rounded-3xl bg-white/5 border border-white/10">
            {icons[type]}
          </div>
          
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-3">
            {title}
          </h2>
          
          <p className="text-text-secondary text-sm leading-relaxed mb-10">
            {message}
          </p>

          <div className="flex w-full gap-4">
            {type === 'confirm' && (
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-4 rounded-2xl border border-border-subtle text-text-secondary font-bold hover:bg-surface-hover hover:text-white transition-all"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                type === 'error' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                'bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.3)]'
              } hover:scale-[1.02] active:scale-95`}
            >
              {type === 'confirm' ? confirmLabel : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
