import React, { useState, useEffect, useRef } from 'react';
import { Download, X, AlertCircle } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  brandLogoUrl: string | null;
  onClose: () => void;
}

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function ImageEditor({ imageUrl, brandLogoUrl, onClose }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoPosition, setLogoPosition] = useState<Position>('bottom-right');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    drawCanvas();
  }, [imageUrl, brandLogoUrl, logoPosition]);

  const drawCanvas = async () => {
    setLoading(true);
    setError(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // 1. Load Main Image
      const mainImg = new Image();
      mainImg.crossOrigin = 'anonymous'; // Important for CORS if loading from S3
      await new Promise((resolve, reject) => {
        mainImg.onload = resolve;
        mainImg.onerror = () => reject(new Error('Falha ao carregar a imagem original.'));
        mainImg.src = imageUrl;
      });

      // Set canvas dimensions
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;

      // Draw Main Image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mainImg, 0, 0);

      // 2. Load and Draw Logo if available
      if (brandLogoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          // Don't fail the whole drawing if logo fails, just catch it
          logoImg.onerror = () => resolve(null);
          logoImg.src = brandLogoUrl;
        });

        if (logoImg.width > 0) {
          // Calculate Logo Size (e.g., max 20% of image width)
          const maxLogoWidth = canvas.width * 0.2;
          const scale = maxLogoWidth / logoImg.width;
          const logoCanvasWidth = maxLogoWidth;
          const logoCanvasHeight = logoImg.height * scale;

          const padding = canvas.width * 0.05; // 5% padding from edges
          let x = 0, y = 0;

          if (logoPosition === 'top-left') {
            x = padding;
            y = padding;
          } else if (logoPosition === 'top-right') {
            x = canvas.width - logoCanvasWidth - padding;
            y = padding;
          } else if (logoPosition === 'bottom-left') {
            x = padding;
            y = canvas.height - logoCanvasHeight - padding;
          } else if (logoPosition === 'bottom-right') {
            x = canvas.width - logoCanvasWidth - padding;
            y = canvas.height - logoCanvasHeight - padding;
          }

          ctx.drawImage(logoImg, x, y, logoCanvasWidth, logoCanvasHeight);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao preparar o editor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Conversio_Edited_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError('Erro ao descarregar a imagem. Verifique as permissões de rede (CORS).');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        
        {/* Close Button Mobile (top right corner of modal) */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center border border-white/10 hover:bg-black/80 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Canvas Area */}
        <div className="flex-1 bg-black/95 relative flex items-center justify-center min-h-[400px] md:min-h-[500px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <span className="text-white text-sm animate-pulse">A carregar editor...</span>
            </div>
          )}
          {error && (
            <div className="absolute inset-x-4 top-4 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3 z-10">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="relative max-w-full max-h-[80vh] p-4 flex items-center justify-center overflow-hidden">
             {/* The canvas visually acts as a responsive image but maintains intrinsic drawing resolution */}
             <canvas 
               ref={canvasRef} 
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all"
             />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-surface flex flex-col border-t md:border-t-0 md:border-l border-border-subtle">
          <div className="p-6 flex items-center justify-between border-b border-border-subtle shrink-0">
             <div>
               <h3 className="text-lg font-bold text-text-primary leading-tight">Mini Editor</h3>
               <p className="text-xs text-text-secondary mt-1">Ferramentas da Marca</p>
             </div>
             <button onClick={onClose} className="hidden md:flex p-2 rounded-full hover:bg-white/5 text-text-tertiary hover:text-white transition-colors">
               <X size={20} />
             </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-8">
            {/* Logo Settings */}
            <div>
               <h4 className="text-sm font-semibold text-text-primary mb-4">Logótipo da Marca</h4>
               {!brandLogoUrl ? (
                  <div className="bg-bg-base border border-dashed border-border-subtle rounded-xl p-4 text-center">
                    <p className="text-sm text-text-secondary">Parece que ainda não tens um logótipo da marca.</p>
                    <a href="/profile" className="text-accent underline text-xs mt-2 inline-block">Adicionar no Perfil</a>
                  </div>
               ) : (
                  <div className="flex flex-col gap-4">
                     <p className="text-xs text-text-secondary">Posição da Marca de Água</p>
                     <div className="grid grid-cols-2 gap-2">
                       <button
                         onClick={() => setLogoPosition('top-left')}
                         className={`p-3 rounded-xl border text-xs font-medium transition-all ${logoPosition === 'top-left' ? 'bg-accent/10 border-accent text-accent' : 'border-border-subtle text-text-secondary hover:border-text-tertiary'}`}
                       >
                         Superior Esq.
                       </button>
                       <button
                         onClick={() => setLogoPosition('top-right')}
                         className={`p-3 rounded-xl border text-xs font-medium transition-all ${logoPosition === 'top-right' ? 'bg-accent/10 border-accent text-accent' : 'border-border-subtle text-text-secondary hover:border-text-tertiary'}`}
                       >
                         Superior Dir.
                       </button>
                       <button
                         onClick={() => setLogoPosition('bottom-left')}
                         className={`p-3 rounded-xl border text-xs font-medium transition-all ${logoPosition === 'bottom-left' ? 'bg-accent/10 border-accent text-accent' : 'border-border-subtle text-text-secondary hover:border-text-tertiary'}`}
                       >
                         Inferior Esq.
                       </button>
                       <button
                         onClick={() => setLogoPosition('bottom-right')}
                         className={`p-3 rounded-xl border text-xs font-medium transition-all ${logoPosition === 'bottom-right' ? 'bg-accent/10 border-accent text-accent' : 'border-border-subtle text-text-secondary hover:border-text-tertiary'}`}
                       >
                         Inferior Dir.
                       </button>
                     </div>
                  </div>
               )}
            </div>

            <div className="mt-auto">
               <button 
                 onClick={handleDownload}
                 disabled={loading || !!error}
                 className="w-full py-4 rounded-xl bg-accent text-accent-fg font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-glow disabled:opacity-50 disabled:hover:scale-100"
               >
                 <Download size={20} />
                 Descarregar Arte
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
