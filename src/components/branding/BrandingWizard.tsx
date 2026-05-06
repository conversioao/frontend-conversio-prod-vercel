import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { StepOne, type Step1Data } from './StepOne';
import { StepTwo } from './StepTwo';
import { StepThree } from './StepThree';
import { apiFetch } from '../../lib/api';
import { brandingPromptAgent, type LogoVariant } from '../../services/brandingPromptAgent';
import { brandingIdentityAgent, type IdentityItem } from '../../services/brandingIdentityAgent';

const STEPS = [
  { id: 1, label: 'Descreve a tua Marca' },
  { id: 2, label: 'Gera o teu Logótipo' },
];

const defaultStep1: Step1Data = {
  brandName: '',
  slogan: '',
  sector: '',
  description: '',
  visualStyle: '',
  modelId: 'nano-banana-2',
};

const defaultStep2 = {
  logoFile: null as File | null,
  logoPreview: null as string | null,
  selectedPalette: '',
  customColors: { primary: '#FFB800', secondary: '#1A1A1A', accent: '#FFF3CD', background: '#0D0D0D' },
};

function isStep1Valid(data: Step1Data) {
  return (
    data.brandName.trim().length >= 2 &&
    data.sector.length > 0 &&
    data.description.trim().length >= 20 &&
    data.visualStyle.length > 0
  );
}

function isStep2Valid(data: typeof defaultStep2) {
  return data.selectedPalette.length > 0;
}

// ─── Logo Generation Loading Screen ─────────────────────────────────────────
function LogoGenerating({ brandName, onBackground }: { brandName: string; onBackground?: () => void }) {
  const phases = [
    'A analisar a identidade da marca…',
    'A criar os prompts criativos…',
    'A gerar as variações de logótipo…',
    'A finalizar os resultados…',
  ];
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setPhase(p => Math.min(p + 1, phases.length - 1)), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] gap-8">
      {/* Spinning rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-[#FFB800]/10 animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#FFB800]/30 animate-[spin_2s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} className="text-[#FFB800] animate-spin" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-white font-black text-lg tracking-tight">
          A criar o kit de logótipos para<br />
          <span className="text-[#FFB800]">{brandName}</span>
        </p>
        <p className="text-white/40 text-sm animate-in fade-in duration-500" key={phase}>
          {phases[phase]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i <= phase ? 'bg-[#FFB800] scale-110' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {onBackground && (
          <button
            onClick={onBackground}
            className="px-6 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-xs font-bold hover:text-white hover:bg-white/10 transition-all"
          >
            Gerar em Segundo Plano
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Logo Results Grid ────────────────────────────────────────────────────────
function LogoResults({
  variants,
  selectedLogo,
  onSelect,
}: {
  variants: LogoVariant[];
  selectedLogo: string | null;
  onSelect: (id: string, url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-[#FFB800] rounded-full" />
        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
          Selecciona o Logótipo preferido
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {variants.map(v => {
          const isSelected = selectedLogo === v.id;
          const failed = v.status === 'failed';
          return (
            <button
              key={v.id}
              disabled={failed}
              onClick={() => v.imageUrl && onSelect(v.id, v.imageUrl)}
              className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 group ${
                isSelected
                  ? 'border-[#FFB800]/70 shadow-lg shadow-[#FFB800]/20 scale-[1.02]'
                  : failed
                  ? 'border-red-500/20 opacity-50 cursor-not-allowed'
                  : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-white/5 flex items-center justify-center overflow-hidden">
                {failed ? (
                  <div className="flex flex-col items-center gap-2 p-4">
                    <AlertCircle size={24} className="text-red-400/60" />
                    <p className="text-[10px] text-red-400/60 text-center">Falhou</p>
                  </div>
                ) : v.imageUrl ? (
                  <img
                    src={v.imageUrl}
                    alt={v.estilo}
                    className="w-full h-full object-contain p-3 bg-white"
                  />
                ) : (
                  <Loader2 size={20} className="text-white/20 animate-spin" />
                )}
              </div>

              {/* Label */}
              <div className={`px-3 py-2 flex items-center justify-between ${
                isSelected ? 'bg-[#FFB800]/10' : 'bg-white/[0.02]'
              }`}>
                <span className={`text-xs font-black ${isSelected ? 'text-[#FFB800]' : 'text-white/50'}`}>
                  {v.estilo}
                </span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#FFB800] flex items-center justify-center">
                    <Check size={9} className="text-black" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export function BrandingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1, setStep1] = useState(defaultStep1);
  const [step2, setStep2] = useState(defaultStep2);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Logo generation state
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [logoVariants, setLogoVariants] = useState<LogoVariant[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const isGeneratingInBackgroundRef = useRef(false);
  const [isGeneratingInBackground, setIsGeneratingInBackground] = useState(false);

  const [isGeneratingIdentity, setIsGeneratingIdentity] = useState(false);
  const [identityProgress, setIdentityProgress] = useState<{ status: string; completed: number; total: number }>({ status: '', completed: 0, total: 10 });
  const [identityDna, setIdentityDna] = useState<any>(null);
  const [identityItems, setIdentityItems] = useState<IdentityItem[]>([]);
  const [identityError, setIdentityError] = useState<string | null>(null);

  const canProceed =
    currentStep === 1 ? isStep1Valid(step1) :
    currentStep === 2 ? isStep2Valid(step2) : true;

  // Trigger logo generation when moving from step 1 → step 2
  const handleNext = async () => {
    if (!canProceed || currentStep >= 2) return;

    if (currentStep === 1) {
      // Advance to step 2 and immediately start generation
      setCurrentStep(2);
      setIsGeneratingLogos(true);
      setLogoError(null);
      setLogoVariants([]);
      setSelectedLogoId(null);

      try {
        const result = await brandingPromptAgent({
          brandName: step1.brandName,
          slogan: step1.slogan,
          sector: step1.sector,
          description: step1.description,
          visualStyle: step1.visualStyle,
          modelId: step1.modelId,
        });
        setLogoVariants(result.variants);
        // Refresh gallery to show new logos
        window.dispatchEvent(new CustomEvent('refreshGenerations'));
        window.dispatchEvent(new Event('storage'));

        if (isGeneratingInBackgroundRef.current) {
          setShowLogoModal(true);
        }
      } catch (err: any) {
        if (!isGeneratingInBackgroundRef.current) {
          setLogoError(err.message || 'Erro ao gerar logótipos.');
        }
      } finally {
        setIsGeneratingLogos(false);
        setIsGeneratingInBackground(false);
        isGeneratingInBackgroundRef.current = false;
      }
    } else if (currentStep === 2) {
      // Process ends here
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
      // Allow re-generation when going back to step 1
      if (currentStep === 2) setIsGeneratingLogos(false);
    }
  };

  const handleSelectLogo = (id: string, url: string) => {
    setSelectedLogoId(id);
    setStep2(prev => ({ ...prev, logoPreview: url, logoFile: null }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userStr = localStorage.getItem('conversio_user');
      const user = userStr ? JSON.parse(userStr) : {};

      let logoUrl: string | null = step2.logoPreview;
      if (step2.logoFile) {
        const formData = new FormData();
        formData.append('file', step2.logoFile);
        formData.append('userId', user.id);
        try {
          const uploadRes = await apiFetch('/upload/logo', { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          if (uploadData.url) logoUrl = uploadData.url;
        } catch (e) {
          console.warn('[BrandingWizard] Logo upload failed');
        }
      }

      const payload = {
        userId: user.id,
        company_name: step1.brandName,
        slogan: step1.slogan,
        sector: step1.sector,
        description: step1.description,
        visual_style: step1.visualStyle,
        logo_url: logoUrl,
        brand_colors: step2.customColors,
        palette_id: step2.selectedPalette,
      };

      const res = await apiFetch('/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsSaved(true);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error('[BrandingWizard] Save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const progressPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  const step2CanProceed = logoVariants.length > 0 && selectedLogoId !== null;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Progress Steps ─────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => {
            const done = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    done
                      ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/40'
                      : active
                      ? 'bg-transparent border-2 border-[#FFB800] text-[#FFB800]'
                      : 'bg-white/[0.05] border border-white/10 text-white/20'
                  }`}>
                    {active && <div className="absolute inset-0 rounded-full bg-[#FFB800]/10 animate-ping" />}
                    {done ? <Check size={13} strokeWidth={3} /> : <span className="relative z-10">{step.id}</span>}
                  </div>
                  <span className={`text-[11px] font-bold hidden sm:block transition-all duration-300 ${
                    active ? 'text-white' : done ? 'text-[#FFB800]/50' : 'text-white/15'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-white/[0.05] relative overflow-hidden rounded-full mx-1">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFB800]/80 to-[#FFB800]/30 rounded-full transition-all duration-700 ease-out"
                      style={{ width: done ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <p className="text-[11px] font-black text-[#FFB800] uppercase tracking-[0.2em] sm:hidden">
          {currentStep}/{STEPS.length} — {STEPS[currentStep - 1].label}
        </p>

        <div className="w-full h-[2px] bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #FFB800 0%, #FFD700 50%, #FFF3CD 100%)',
              boxShadow: '0 0 8px #FFB800aa',
            }}
          />
        </div>
      </div>

      {/* ── Step Content ────────────────────────────────────────── */}
      <div className="min-h-[380px]">
        {currentStep === 1 && <StepOne data={step1} onChange={setStep1} />}

        {currentStep === 2 && (
          isSaved ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] gap-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-[#FFB800] flex items-center justify-center shadow-lg shadow-[#FFB800]/20">
                <Check size={40} className="text-black" strokeWidth={3} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-white mb-2">Identidade Guardada!</h3>
                <p className="text-white/40 text-sm max-w-xs mx-auto">
                  O teu logótipo e cores foram configurados. Agora podes encontrá-los na tua galeria.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSaved(false);
                  setStep1(defaultStep1);
                  setStep2(defaultStep2);
                  setLogoVariants([]);
                  setSelectedLogoId(null);
                  setCurrentStep(1);
                }}
                className="mt-4 px-8 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-bold hover:bg-white/20 transition-all"
              >
                Criar Outra Marca
              </button>
            </div>
          ) : isGeneratingLogos && !isGeneratingInBackground ? (
            <LogoGenerating 
              brandName={step1.brandName} 
              onBackground={() => {
                setIsGeneratingInBackground(true);
                isGeneratingInBackgroundRef.current = true;
                setCurrentStep(1); // Go back to Step 1 while generating
              }}
            />
          ) : logoError ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] gap-4">
              <AlertCircle size={36} className="text-red-400/60" />
              <p className="text-white/60 text-sm text-center">{logoError}</p>
              <button
                onClick={() => { setLogoError(null); handleNext(); }}
                className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 text-sm font-bold hover:text-white transition-all"
              >
                Tentar novamente
              </button>
            </div>
          ) : logoVariants.length > 0 ? (
            <div className="flex flex-col gap-6">
              <StepTwo 
                data={step2} 
                onChange={setStep2}
                variants={logoVariants}
                selectedLogo={selectedLogoId}
                onSelect={(id, url) => {
                  handleSelectLogo(id, url);
                }}
                onRegenerate={async (styleId, estilo) => {
                  try {
                    const result = await brandingPromptAgent({
                      brandName: step1.brandName,
                      slogan: step1.slogan,
                      sector: step1.sector,
                      description: step1.description,
                      visualStyle: step1.visualStyle,
                      regenerateStyle: { id: styleId, estilo }
                    });
                    if (result.variants.length > 0) {
                      setLogoVariants(prev => prev.map(v => v.id === styleId ? result.variants[0] : v));
                    }
                  } catch (e: any) {
                    setLogoError(e.message || 'Erro ao regenerar estilo.');
                  }
                }}
              />
              <button 
                onClick={handleSave}
                disabled={isSaving || !step2CanProceed}
                className="w-full py-4 rounded-2xl bg-[#FFB800] text-black font-black hover:bg-[#FFD700] shadow-xl shadow-[#FFB800]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0"
              >
                {isSaving ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    A Guardar...
                  </div>
                ) : 'Finalizar e Guardar'}
              </button>
            </div>
          ) : null
        )}
      </div>

      {/* ── Navigation Buttons ───────────────────────────────────── */}
      <div className={`flex items-center border-t border-white/[0.05] pt-6 ${currentStep === 2 && logoVariants.length > 0 ? 'justify-center' : 'justify-between'}`}>
        {currentStep === 1 && (
          <button
            onClick={handlePrev}
            disabled={currentStep === 1 || isGeneratingLogos}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentStep === 1 || isGeneratingLogos
                ? 'text-white/10 cursor-not-allowed'
                : 'text-white/40 hover:text-white hover:bg-white/[0.05] active:scale-[0.97]'
            }`}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
        )}

        {currentStep === 2 && logoVariants.length > 0 && !isGeneratingLogos && (
           <button
            onClick={() => {
              setStep1(defaultStep1);
              setStep2(defaultStep2);
              setLogoVariants([]);
              setSelectedLogoId(null);
              setCurrentStep(1);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-200 bg-white/[0.05] text-white hover:bg-white/10"
          >
            Criar mais logótipos
          </button>
        )}

        {currentStep === 1 && (
          <div className="flex items-center gap-3">
            {!canProceed && (
              <span className="text-[11px] text-white/20 hidden sm:block">* Preenche os campos obrigatórios</span>
            )}
            <button
              onClick={handleNext}
              disabled={isGeneratingLogos || !canProceed}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-200 ${
                (!isGeneratingLogos && canProceed)
                  ? 'bg-[#FFB800] text-black hover:bg-[#FFD700] shadow-lg shadow-[#FFB800]/30 hover:shadow-[#FFB800]/50 hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/5'
              }`}
            >
              {isGeneratingLogos ? (
                <><Loader2 size={15} className="animate-spin" /> A gerar…</>
              ) : (
                <>Gerar Logótipos <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>
      {/* ─── Success Modal (When Background Finish) ─── */}
      {showLogoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#FFB800] flex items-center justify-center shadow-lg shadow-[#FFB800]/20">
                  <Check size={32} className="text-black" strokeWidth={3} />
                </div>
                <div className="text-center">
                   <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Logótipos Prontos!</h3>
                   <p className="text-white/40 text-sm leading-relaxed">
                     O teu kit de logótipos foi gerado com sucesso e já está disponível na tua galeria.
                   </p>
                </div>
                <div className="flex flex-col w-full gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowLogoModal(false);
                      setCurrentStep(2);
                    }}
                    className="w-full py-4 rounded-2xl bg-[#FFB800] text-black font-black hover:bg-[#FFD700] transition-all shadow-lg"
                  >
                    Ver na Galeria
                  </button>
                  <button
                    onClick={() => setShowLogoModal(false)}
                    className="w-full py-3 text-white/40 text-xs font-bold hover:text-white transition-colors"
                  >
                    Fechar
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Background Progress Mini-Indicator */}
      {isGeneratingInBackground && isGeneratingLogos && (
        <div className="fixed bottom-6 right-6 z-[90] animate-in slide-in-from-right-4 duration-500">
          <div className="bg-black/60 backdrop-blur-xl border border-[#FFB800]/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
             <div className="relative w-10 h-10">
               <div className="absolute inset-0 rounded-full border-2 border-[#FFB800]/10 animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 size={16} className="text-[#FFB800] animate-spin" />
               </div>
             </div>
             <div>
               <p className="text-xs font-black text-white uppercase tracking-wider">A gerar Logótipos...</p>
               <p className="text-[10px] text-white/40">Em segundo plano</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
