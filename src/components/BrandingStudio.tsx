import React from 'react';
import { Sparkles } from 'lucide-react';
import { BrandingWizard } from './branding/BrandingWizard';

export function BrandingStudio() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center shadow-lg shadow-[#FFB800]/10">
              <Sparkles size={18} className="text-[#FFB800]" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-[#FFB800]/10 blur-lg -z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              GERADOR DE <span className="text-[#FFB800]">LOGOTIPO</span>
            </h1>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.25em]">
              Logo Studio
            </p>
          </div>
        </div>
        <p className="text-white/30 text-sm leading-relaxed">
          Gera o logótipo perfeito para a tua marca em 2 etapas simples. Os logótipos gerados serão guardados na tua galeria automaticamente.
        </p>
      </div>

      {/* Wizard Container — static gold border + glass */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#FFB800]/20">
        {/* Static glow top edge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#FFB800]/50 to-transparent" />
        {/* Glass panel */}
        <div className="bg-black/40 backdrop-blur-[60px] p-6 sm:p-8">
          <BrandingWizard />
        </div>
      </div>
    </div>
  );
}
