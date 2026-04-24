import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

/**
 * Banner de instalação PWA
 * Aparece automaticamente quando a app é instalável (Android/Desktop Chrome)
 * No iOS mostra instruções de "Adicionar ao início"
 */
export function PWAInstallBanner() {
  const { showBanner, install, dismissBanner, isInstalled } = usePWAInstall();

  // Detectar iOS para mostrar instruções especiais
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

  // Não mostrar se já instalado, em modo standalone, ou banner não deve aparecer
  if (isInstalled || isInStandaloneMode || !showBanner) return null;

  if (isIOS) {
    return (
      <div className="pwa-install-banner" role="banner" aria-label="Instalar app">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-hover border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-lg">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight">Instala a Conversio AI</p>
            <p className="text-xs text-gray-400 mt-0.5">Toca em <strong className="text-[#FFB800]">Partilhar</strong> → <strong className="text-[#FFB800]">Adicionar ao início</strong></p>
          </div>
        </div>
        <button
          onClick={dismissBanner}
          className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg flex-shrink-0"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="pwa-install-banner" role="banner" aria-label="Instalar app">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-surface-hover border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-lg">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-tight">Instala a app</p>
          <p className="text-xs text-gray-400 mt-0.5">Acede mais rápido e com melhor performance.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={install}
          className="px-4 py-2 bg-accent text-black text-xs font-black rounded-xl hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          Instalar
        </button>
        <button
          onClick={dismissBanner}
          className="p-2 text-text-tertiary hover:text-text-primary transition-colors rounded-lg"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
