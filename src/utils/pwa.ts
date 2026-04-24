/**
 * Utilitários PWA — Conversio AI
 * Detecta se a app está a correr em modo standalone (PWA instalada)
 */

/**
 * Detecta se a app está a correr em modo standalone (PWA instalada)
 */
export function isPWAMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true || // iOS Safari
    document.referrer.includes('android-app://')     // Android TWA
  );
}

/**
 * Detecta se a app foi lançada via start_url do manifest (?source=pwa)
 * OU se está em modo standalone
 */
export function isLaunchedFromPWA(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('source') === 'pwa' || isPWAMode();
}
