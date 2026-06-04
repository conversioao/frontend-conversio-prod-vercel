import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
  dismissBanner: () => void;
  showBanner: boolean;
}

const BANNER_DISMISSED_KEY = 'conversio_pwa_banner_dismissed';

export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Já está instalado em modo standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar se o banner foi dispensado recentemente (24h)
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      if (hoursSince < 24) return; // Não mostrar por 24h após dispensar
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
      // Mostrar banner com delay de 3s para não distrair na entrada
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      setShowBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
  };

  return { isInstallable, isInstalled, install, dismissBanner, showBanner };
}
