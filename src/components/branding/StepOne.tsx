import React from 'react';
import { Building2, Quote, Tag, AlignLeft, Sparkles, CheckCircle2, Check } from 'lucide-react';

const SECTORS = [
  'Moda',
  'Alimentação',
  'Tecnologia',
  'Saúde & Bem-estar',
  'Beleza',
  'Educação',
  'Imobiliário',
  'Entretenimento',
  'Serviços',
  'Outro',
];

const VISUAL_STYLES = [
  {
    id: 'modern-minimal',
    label: 'Moderno & Minimalista',
    emoji: '⬜',
    desc: 'Linhas limpas, espaços amplos, tipografia elegante.',
    accent: 'from-white/10 to-white/5',
    border: 'border-white/20',
    activeBorder: 'border-white/60',
    activeBg: 'bg-white/10',
  },
  {
    id: 'luxury',
    label: 'Luxo & Sofisticado',
    emoji: '✦',
    desc: 'Ouro, preto profundo, acabamentos premium.',
    accent: 'from-[#FFB800]/20 to-[#FFB800]/5',
    border: 'border-[#FFB800]/20',
    activeBorder: 'border-[#FFB800]/80',
    activeBg: 'bg-[#FFB800]/10',
  },
  {
    id: 'colorful',
    label: 'Colorido & Vibrante',
    emoji: '🎨',
    desc: 'Cores saturadas, energia, impacto visual forte.',
    accent: 'from-pink-500/20 to-purple-500/10',
    border: 'border-pink-500/20',
    activeBorder: 'border-pink-400/70',
    activeBg: 'bg-pink-500/10',
  },
  {
    id: 'traditional',
    label: 'Tradicional & Sólido',
    emoji: '🏛️',
    desc: 'Confiança, seriedade, tons neutros e clássicos.',
    accent: 'from-stone-500/20 to-stone-700/10',
    border: 'border-stone-500/20',
    activeBorder: 'border-stone-400/60',
    activeBg: 'bg-stone-500/10',
  },
  {
    id: 'youthful',
    label: 'Jovem & Descontraído',
    emoji: '⚡',
    desc: 'Dinâmico, fresco, atitude urbana e moderna.',
    accent: 'from-emerald-500/20 to-cyan-500/10',
    border: 'border-emerald-500/20',
    activeBorder: 'border-emerald-400/70',
    activeBg: 'bg-emerald-500/10',
  },
];

export interface Step1Data {
  brandName: string;
  slogan: string;
  sector: string;
  description: string;
  visualStyle: string;
  modelId: string;
}

interface StepOneProps {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

function Field({
  icon,
  label,
  required,
  children,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2 text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
        <span className="text-[#FFB800]">{icon}</span>
        {label}
        {required && <span className="text-[#FFB800]/60 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-white/20 ml-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-white placeholder:text-white/15 text-sm font-medium focus:outline-none focus:border-[#FFB800]/50 focus:bg-white/[0.06] transition-all duration-200 appearance-none';

export function StepOne({ data, onChange }: StepOneProps) {
  const update = (key: keyof Step1Data, value: string) =>
    onChange({ ...data, [key]: value });

  const charCount = data.description.length;
  const descValid = charCount >= 20;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── Left column ──────────────────────────────────────── */}
      <div className="flex flex-col gap-7">
        {/* Brand Name */}
        <Field icon={<Building2 size={12} />} label="Nome da Marca" required>
          <input
            type="text"
            value={data.brandName}
            onChange={(e) => update('brandName', e.target.value)}
            placeholder="Ex: Nova Luanda Fashion"
            className={inputCls}
          />
        </Field>

        {/* Slogan */}
        <Field
          icon={<Quote size={12} />}
          label="Slogan / Tagline"
          hint="Opcional — a frase que representa a tua marca"
        >
          <input
            type="text"
            value={data.slogan}
            onChange={(e) => update('slogan', e.target.value)}
            placeholder="Ex: Veste o teu sucesso"
            className={inputCls}
          />
        </Field>

        {/* Sector */}
        <Field icon={<Tag size={12} />} label="Nicho / Sector" required>
          <div className="relative">
            <select
              value={data.sector}
              onChange={(e) => update('sector', e.target.value)}
              className={`${inputCls} cursor-pointer pr-10`}
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <option value="" disabled className="bg-[#0D0D0D] text-white/40">
                Selecciona o sector…
              </option>
              {SECTORS.map((s) => (
                <option key={s} value={s} className="bg-[#0D0D0D] text-white">
                  {s}
                </option>
              ))}
            </select>
            {/* custom chevron */}
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">▾</span>
          </div>
        </Field>

        {/* Description */}
        <Field
          icon={<AlignLeft size={12} />}
          label="Descrição da Marca"
          required
          hint="Descreve a tua marca, produtos ou serviços com as tuas palavras."
        >
          <div className="relative">
            <textarea
              value={data.description}
              onChange={(e) => update('description', e.target.value.slice(0, 500))}
              placeholder="Ex: Somos uma marca de moda feminina com influência angolana e moderna, que valoriza…"
              rows={5}
              className={`${inputCls} resize-none`}
            />
            {/* char counter + tick */}
            <div className="absolute bottom-3 right-4 flex items-center gap-2">
              {descValid && <CheckCircle2 size={13} className="text-[#FFB800]" />}
              <span className={`text-[10px] font-bold ${descValid ? 'text-[#FFB800]/60' : 'text-white/20'}`}>
                {charCount}/500
              </span>
            </div>
          </div>
          {!descValid && charCount > 0 && (
            <p className="text-[10px] text-[#FFB800]/50 ml-1">
              Ainda faltam {20 - charCount} caracteres para o mínimo.
            </p>
          )}
        </Field>

        {/* AI Model */}
        <Field icon={<Sparkles size={12} />} label="Motor de Inteligência Artificial" hint="O custo da geração de 4 variações depende do modelo escolhido.">
          <div className="relative">
            <select
              value={data.modelId}
              onChange={(e) => update('modelId', e.target.value)}
              className={`${inputCls} cursor-pointer pr-10`}
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <option value="nano-banana-2" className="bg-[#0D0D0D] text-white">
                KIE Nano Banana V2 (Recomendado)
              </option>
              <option value="gpt-image-2" className="bg-[#0D0D0D] text-white">
                DALL-E 3 (GPT Image)
              </option>
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">▾</span>
          </div>
        </Field>
      </div>

      {/* ── Right column — Visual Style ───────────────────────── */}
      <div className="flex flex-col gap-4">
        <Field icon={<Sparkles size={12} />} label="Estilo Visual Preferido" required>
          <div className="flex flex-col gap-3">
            {VISUAL_STYLES.map((style) => {
              const active = data.visualStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => update('visualStyle', style.id)}
                  className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-200 group overflow-hidden ${
                    active
                      ? `${style.activeBorder} ${style.activeBg} shadow-lg`
                      : `${style.border} bg-white/[0.02] hover:bg-white/[0.04] hover:${style.activeBorder}`
                  }`}
                >
                  {/* gradient glow behind */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${style.accent} opacity-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'group-hover:opacity-60'}`}
                  />

                  {/* Emoji badge */}
                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${active ? style.activeBorder : style.border} bg-black/30`}>
                    {style.emoji}
                  </div>

                  {/* Text */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <p className={`text-sm font-black transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
                      {style.label}
                    </p>
                    <p className={`text-[11px] mt-0.5 transition-colors ${active ? 'text-white/50' : 'text-white/20'}`}>
                      {style.desc}
                    </p>
                  </div>

                  {/* Active check */}
                  <div className={`relative z-10 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    active ? 'bg-[#FFB800] border-[#FFB800] shadow-md shadow-[#FFB800]/30' : 'border-white/10 bg-transparent'
                  }`}>
                    {active && <Check size={10} className="text-black" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </div>
  );
}
