import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Palette, Check, RefreshCw, Maximize2, AlertCircle, Loader2 } from 'lucide-react';
import type { LogoVariant } from '../../services/brandingPromptAgent';

const PRESET_PALETTES = [
  {
    id: 'gold-black',
    name: 'Ouro & Preto',
    colors: { primary: '#FFB800', secondary: '#1A1A1A', accent: '#FFF3CD', background: '#0D0D0D' },
  },
  {
    id: 'royal-blue',
    name: 'Azul Real',
    colors: { primary: '#2563EB', secondary: '#1E3A8A', accent: '#BFDBFE', background: '#0F172A' },
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    colors: { primary: '#10B981', secondary: '#065F46', accent: '#D1FAE5', background: '#022C22' },
  },
  {
    id: 'rose-luxury',
    name: 'Rosa Luxo',
    colors: { primary: '#F43F5E', secondary: '#9F1239', accent: '#FFE4E6', background: '#1A0A0E' },
  },
  {
    id: 'violet',
    name: 'Violeta',
    colors: { primary: '#7C3AED', secondary: '#4C1D95', accent: '#EDE9FE', background: '#0F0B1E' },
  },
  {
    id: 'terracotta',
    name: 'Terracota',
    colors: { primary: '#EA580C', secondary: '#7C2D12', accent: '#FED7AA', background: '#1C0A02' },
  },
];

interface StepTwoData {
  logoFile: File | null;
  logoPreview: string | null;
  selectedPalette: string;
  customColors: { primary: string; secondary: string; accent: string; background: string };
}

interface StepTwoProps {
  data: StepTwoData;
  onChange: (data: StepTwoData) => void;
  variants: LogoVariant[];
  selectedLogo: string | null;
  onSelect: (id: string, url: string) => void;
  onRegenerate: (id: string, estilo: string) => void;
}

export function StepTwo({ data, onChange, variants, selectedLogo, onSelect, onRegenerate }: StepTwoProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
  const [extractedColors, setExtractedColors] = useState<{ primary: string; secondary: string } | null>(null);

  // Extract colors when logoPreview changes
  useEffect(() => {
    if (!data.logoPreview) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = data.logoPreview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        // Simple extraction: sample points from the image (avoid edges which might be white)
        const samplePoints = [
          { x: Math.floor(img.width * 0.3), y: Math.floor(img.height * 0.3) },
          { x: Math.floor(img.width * 0.7), y: Math.floor(img.height * 0.7) },
          { x: Math.floor(img.width * 0.5), y: Math.floor(img.height * 0.5) },
        ];
        
        let primary = '#FFB800';
        let secondary = '#1A1A1A';
        
        for (const p of samplePoints) {
          const pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
          // Ignore white/near-white pixels
          if (pixel[0] < 240 || pixel[1] < 240 || pixel[2] < 240) {
            const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('');
            if (primary === '#FFB800') {
              primary = hex;
            } else {
              secondary = hex;
            }
          }
        }
        
        setExtractedColors({ primary, secondary });
        
        // Auto-select extracted colors if a custom palette isn't explicitly chosen
        if (data.selectedPalette === 'custom-extracted' || !data.selectedPalette) {
          onChange({
            ...data,
            selectedPalette: 'custom-extracted',
            customColors: { 
              primary, 
              secondary, 
              accent: '#FFF3CD', 
              background: '#0D0D0D' 
            }
          });
        }
      } catch (e) {
        console.warn('CORS prevented color extraction.');
      }
    };
  }, [data.logoPreview]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({ ...data, logoFile: file, logoPreview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const selectPalette = (palette: any) => {
    onChange({ ...data, selectedPalette: palette.id, customColors: palette.colors });
  };

  const handleRegenerate = (id: string, estilo: string) => {
    setRegeneratingIds(p => [...p, id]);
    onRegenerate(id, estilo);
  };

  // When a variant finishes regenerating, remove it from the loading state
  useEffect(() => {
    setRegeneratingIds(prev => prev.filter(id => {
      const v = variants.find(x => x.id === id);
      return v && v.status === 'pending';
    }));
  }, [variants]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ─── Logo Selection Grid ─── */}
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
          <div className="w-1 h-4 bg-[#FFB800] rounded-full" />
          Selecciona o teu Logótipo
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {variants.map(v => {
            const isSelected = selectedLogo === v.id;
            const failed = v.status === 'failed';
            const isRegenerating = regeneratingIds.includes(v.id) || v.status === 'pending';

            return (
              <div
                key={v.id}
                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 bg-white/[0.02] ${
                  isSelected
                    ? 'border-[#FFB800]/70 shadow-[0_0_20px_rgba(255,184,0,0.15)] scale-[1.02]'
                    : failed
                    ? 'border-red-500/20 opacity-50'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* Header / Badge */}
                <div className={`px-4 py-3 flex items-center justify-between border-b ${
                  isSelected ? 'border-[#FFB800]/20 bg-[#FFB800]/5' : 'border-white/5 bg-black/20'
                }`}>
                  <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-[#FFB800]' : 'text-white/50'}`}>
                    {v.estilo}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#FFB800] flex items-center justify-center animate-in zoom-in">
                      <Check size={12} className="text-black font-black" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Image Area */}
                <div 
                  className="relative aspect-square flex items-center justify-center bg-white cursor-pointer group"
                  onClick={() => {
                    if (!failed && !isRegenerating && v.imageUrl) {
                      onSelect(v.id, v.imageUrl);
                    }
                  }}
                >
                  {isRegenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={32} className="text-[#FFB800] animate-spin" />
                      <p className="text-xs text-black/50 font-bold uppercase">A regerar...</p>
                    </div>
                  ) : failed ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <AlertCircle size={32} className="text-red-500/80" />
                      <p className="text-xs font-bold text-red-500/80 text-center uppercase">Falha na geração</p>
                    </div>
                  ) : v.imageUrl ? (
                    <>
                      <img src={v.imageUrl} alt={v.estilo} className="w-full h-full object-contain p-4" />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setModalImage(v.imageUrl); }}
                          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all"
                        >
                          <Maximize2 size={18} />
                        </button>
                        {!isSelected && (
                          <div className="w-12 h-12 rounded-full bg-[#FFB800] flex items-center justify-center text-black hover:scale-110 transition-all shadow-[0_0_15px_rgba(255,184,0,0.5)]">
                            <Check size={20} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Footer Action */}
                {!failed && !isRegenerating && (
                  <div className="p-3 border-t border-white/5 bg-black/20 flex justify-end">
                    <button
                      onClick={() => handleRegenerate(v.id, v.estilo)}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-white/40 hover:text-white transition-colors"
                    >
                      <RefreshCw size={12} />
                      Regerar este estilo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

      {/* ─── Paleta de Cores ─── */}
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
          <Palette size={13} className="text-[#FFB800]" />
          Paleta de Cores da Marca
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          {/* Opção Extraída do Logo */}
          {extractedColors && (
            <button
              type="button"
              onClick={() => selectPalette({
                id: 'custom-extracted',
                name: 'Cores do Logótipo',
                colors: { primary: extractedColors.primary, secondary: extractedColors.secondary, accent: '#FFF3CD', background: '#0D0D0D' }
              })}
              className={`relative flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-200 text-left ${
                data.selectedPalette === 'custom-extracted'
                  ? 'border-[#FFB800]/60 bg-[#FFB800]/5 shadow-lg shadow-[#FFB800]/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              {data.selectedPalette === 'custom-extracted' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FFB800] flex items-center justify-center">
                  <Check size={10} className="text-black font-black" />
                </div>
              )}
              <div className="flex gap-1.5">
                {[extractedColors.primary, extractedColors.secondary, '#0D0D0D'].map((color, i) => (
                  <div key={i} className="w-7 h-7 rounded-lg border border-white/10 shadow-inner" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className={`text-[11px] font-bold ${data.selectedPalette === 'custom-extracted' ? 'text-[#FFB800]' : 'text-white/40'}`}>
                Cores Extraídas
              </span>
            </button>
          )}

          {PRESET_PALETTES.map((palette) => {
            const isSelected = data.selectedPalette === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => selectPalette(palette)}
                className={`relative flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-[#FFB800]/60 bg-[#FFB800]/5 shadow-lg shadow-[#FFB800]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FFB800] flex items-center justify-center">
                    <Check size={10} className="text-black font-black" />
                  </div>
                )}
                <div className="flex gap-1.5">
                  {Object.values(palette.colors).map((color, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg border border-white/10 shadow-inner" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#FFB800]' : 'text-white/40'}`}>
                  {palette.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Colors override */}
        {data.selectedPalette && (
          <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5 mt-2">
            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.15em]">Ajuste Manual</p>
            <div className="grid grid-cols-2 gap-3">
              {(['primary', 'secondary', 'accent', 'background'] as const).map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.customColors[key]}
                    onChange={(e) => onChange({ ...data, customColors: { ...data.customColors, [key]: e.target.value } })}
                    className="w-9 h-9 rounded-xl border border-white/20 cursor-pointer bg-transparent [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch-wrapper]:p-0.5"
                  />
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-wider">
                      {key === 'primary' ? 'Principal' : key === 'secondary' ? 'Secundária' : key === 'accent' ? 'Destaque' : 'Fundo'}
                    </p>
                    <p className="text-[11px] font-mono text-white/50">{data.customColors[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Imagem Grande ─── */}
      {modalImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setModalImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
            >
              <X size={20} />
            </button>
            <img 
              src={modalImage} 
              alt="Logo Ampliado" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-3xl bg-white p-4 shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
