import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Sparkles, Zap, CheckCircle2, Layers,
  Play, Video, Film, Sun, Flag, Monitor, Smile,
  RefreshCw, Gift, Star, Shield, TrendingUp, Eye
} from 'lucide-react';
import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';

interface VideoCoresPageProps {
  onEnter: () => void;
  onBack: () => void;
  onSelect?: (coreId: string) => void;
}

type VideoFilterType = 'all' | 'autentico' | 'cinematografico' | 'conversao' | 'criativo';

const VIDEO_CORES = [
  {
    id: 'ugc-influencer-video',
    code: 'VD-01',
    name: 'REELANGOLA UGC',
    category: 'Conteúdo Autêntico de Utilizador',
    filter: 'autentico' as const,
    icon: Video,
    gradient: 'from-emerald-900 via-emerald-700 to-green-600',
    barColor: 'from-emerald-400 to-green-500',
    glowColor: 'rgba(16,185,129,0.2)',
    filterBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    conversionBadge: '⭐ Maior Autenticidade',
    conversionColor: 'bg-emerald-500/20 text-emerald-300',
    generates: 'Vídeo estilo Reels/TikTok que gera confiança imediata. Simula uma pessoa real angolana a recomendar o seu produto de forma orgânica e genuína.',
    timeline: [
      { time: '0:00–0:03', desc: 'Gancho visual autêntico no ecrã' },
      { time: '0:03–0:07', desc: 'Demonstração do produto em uso real' },
      { time: '0:07–0:12', desc: 'Benefício principal com narração natural' },
      { time: '0:12–0:15', desc: 'CTA direto para WhatsApp ou Site' },
    ],
    forWho: 'Qualquer negócio que precise de prova social e uma cara real para vender produtos em Angola.',
    includes: ['Prompt Sora 2 otimizado', 'Narração em PT-AO', 'Cenários reais de Luanda', 'Copy de alta conversão'],
  },
  {
    id: 'vibra-premium-video',
    code: 'VD-02',
    name: 'VIBRA PREMIUM',
    category: 'Elite Editorial & Macro',
    filter: 'cinematografico' as const,
    icon: Zap,
    gradient: 'from-blue-950 via-blue-800 to-indigo-700',
    barColor: 'from-blue-400 to-indigo-500',
    glowColor: 'rgba(59,130,246,0.2)',
    filterBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    conversionBadge: '💎 Máxima Qualidade Visual',
    conversionColor: 'bg-blue-500/20 text-blue-300',
    generates: 'Anúncios de luxo com estética de estúdio premium. Foca em macros, iluminação dramática e texturas que valorizam produtos de alto ticket.',
    timeline: [
      { time: '0:00–0:03', desc: 'Plano macro de luxo do produto' },
      { time: '0:03–0:08', desc: 'Luzes dinâmicas revelando o design' },
      { time: '0:08–0:12', desc: 'Destaque sensorial e funcional' },
      { time: '0:12–0:15', desc: 'Logótipo e Call-to-Action elegante' },
    ],
    forWho: 'Perfumes, Bebidas, Tecnologia, Joalharia e qualquer marca que queira parecer "internacional".',
    includes: ['Iluminação de estúdio profissional', 'Movimentos de câmara complexos', 'Narração premium', 'Estética 4K'],
  },
  {
    id: 'cinematic-vfx-video',
    code: 'VD-03',
    name: 'CINEMATIC VFX',
    category: 'Comercial de Elite com Efeitos',
    filter: 'criativo' as const,
    icon: Sparkles,
    gradient: 'from-orange-900 via-orange-700 to-red-600',
    barColor: 'from-orange-400 to-red-500',
    glowColor: 'rgba(249,115,22,0.2)',
    filterBadge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    conversionBadge: '🎬 Impacto Visual Máximo',
    conversionColor: 'bg-orange-500/20 text-orange-300',
    generates: 'Produções épicas com efeitos visuais e cinematografia de cinema. Ideal para captar a atenção em milisegundos com movimento e energia.',
    timeline: [
      { time: '0:00–0:03', desc: 'Cena de abertura épica com VFX' },
      { time: '0:03–0:08', desc: 'Produto em ação dinâmica' },
      { time: '0:08–0:12', desc: 'Efeitos de som e imagem integrados' },
      { time: '0:12–0:15', desc: 'CTA com explosão visual da marca' },
    ],
    forWho: 'Lançamentos de grande escala, eventos, apps e marcas que querem "parar o scroll".',
    includes: ['Efeitos Visuais Avançados', 'Direção de Arte Épica', 'Narração Impactante', 'Montagem Dinâmica'],
  },
];

const COMPARISON_TABLE = [
  { goal: 'Máxima autenticidade e prova social', core: 'VD-01 REELANGOLA UGC' },
  { goal: 'Lançamento de produto de luxo', core: 'VD-02 VIBRA PREMIUM' },
  { goal: 'Impacto visual cinematográfico', core: 'VD-03 CINEMATIC VFX' },
];

const FILTER_LABELS: Record<VideoFilterType, string> = {
  all: 'Todos',
  autentico: 'Autêntico',
  cinematografico: 'Cinematográfico',
  conversao: 'Conversão',
  criativo: 'Criativo',
};

const FILTER_BADGE_COLORS: Record<string, string> = {
  autentico: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cinematografico: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  conversao: 'bg-red-500/20 text-red-300 border-red-500/30',
  criativo: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const FILTER_LABEL_MAP: Record<string, string> = {
  autentico: 'Autêntico',
  cinematografico: 'Cinematográfico',
  conversao: 'Conversão',
  criativo: 'Criativo',
};

const VideoCard = ({ core, onUse, delay }: { core: typeof VIDEO_CORES[0]; onUse: () => void; delay: number }) => {
  const Icon = core.icon;
  const [hovered, setHovered] = useState(false);
  const [activeTimelineIdx, setActiveTimelineIdx] = useState(0);

  // Cycle through timeline items on hover
  React.useEffect(() => {
    if (!hovered) { setActiveTimelineIdx(0); return; }
    const interval = setInterval(() => {
      setActiveTimelineIdx(i => (i + 1) % core.timeline.length);
    }, 900);
    return () => clearInterval(interval);
  }, [hovered, core.timeline.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0f] shadow-2xl group"
      style={{ boxShadow: `0 0 40px ${core.glowColor}` }}
    >
      {/* Top Color Bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${core.barColor}`} />

      {/* Card Header with Gradient */}
      <div className={`relative px-6 pt-6 pb-8 bg-gradient-to-br ${core.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/40" />
        {/* Play icon watermark */}
        <div className="absolute right-4 bottom-4 opacity-10">
          <Play size={80} className="text-white fill-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg flex-shrink-0">
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{core.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${FILTER_BADGE_COLORS[core.filter]}`}>
                  {FILTER_LABEL_MAP[core.filter]}
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">{core.name}</h3>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">{core.category}</p>
            </div>
          </div>
          {/* Conversion badge */}
          <span className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-black ${core.conversionColor}`}>
            {core.conversionBadge}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-6 gap-5">
        {/* Generates */}
        <div>
          <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-2">O que gera</p>
          <p className="text-sm text-white/70 leading-relaxed">{core.generates}</p>
        </div>

        {/* Timeline / structure */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Estrutura do vídeo</p>
          <div className="space-y-1.5">
            {core.timeline.map((t, i) => (
              <motion.div
                key={i}
                animate={hovered && activeTimelineIdx === i
                  ? { backgroundColor: 'rgba(255,184,0,0.1)', borderColor: 'rgba(255,184,0,0.3)' }
                  : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }
                }
                className="flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-colors"
              >
                <span className={`text-[9px] font-black shrink-0 tabular-nums pt-0.5 ${hovered && activeTimelineIdx === i ? 'text-[#FFB800]' : 'text-white/30'}`}>
                  ⏱ {t.time}
                </span>
                <span className="text-[11px] text-white/60 leading-snug">{t.desc}</span>
                {hovered && activeTimelineIdx === i && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto shrink-0"
                  >
                    <Play size={10} className="text-[#FFB800] fill-[#FFB800]" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* For Who */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Para quem</p>
          <p className="text-xs text-white/50 leading-relaxed">{core.forWho}</p>
        </div>

        {/* What's included */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">O que inclui</p>
          <div className="flex flex-col gap-1">
            {core.includes.map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
                <CheckCircle2 size={10} className="text-[#FFB800] shrink-0" /> {item}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-auto pt-2">
          <motion.button
            onClick={onUse}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-white/5 border border-white/20 text-white hover:bg-[#FFB800]/10 hover:border-[#FFB800]/40 hover:text-[#FFB800]"
          >
            <Play size={14} className="fill-current" />
            Gerar com Este Core
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export function VideoCoresPage({ onEnter, onBack, onSelect }: VideoCoresPageProps) {
  const [filter, setFilter] = useState<VideoFilterType>('all');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleUseCore = (core: typeof VIDEO_CORES[0]) => {
    if (onSelect) {
      onSelect(core.id);
    } else {
      onEnter();
    }
  };



  const filtered = VIDEO_CORES.filter(c => filter === 'all' || c.filter === filter);

  return (
    <div className="relative z-10 text-white min-h-screen flex flex-col">
      <SharedHeader onEnter={onEnter} onNavigateHome={onBack} onNavigatePage={onBack} isLoggedIn={false} />
      {/* Ambient glow — blue/cinematic */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-900/10 blur-[180px] pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 max-w-7xl mt-16 flex-grow">

        {/* ─── HERO ─── */}
        <section className="pt-32 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Sora 2 badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[11px] font-black mb-4 uppercase tracking-[0.2em]">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)] animate-pulse" />
              Powered by Sora 2 — OpenAI
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6"
          >
            Escolhe o Core de<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-200 to-white">Vídeo Certo</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 font-light max-w-3xl mx-auto mb-6 leading-relaxed"
          >
            3 estilos de vídeo de elite treinados para o mercado angolano — cada um com prompts  
            Sora 2 completos, narração em português de Angola e estética de alta performance.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="flex items-center justify-center gap-2 mb-12 text-white/40 text-sm"
          >
            <Play size={13} className="text-[#FFB800] fill-[#FFB800]" />
            <span>Cada core gera um prompt Sora 2 completo com 5 cenas de 15 segundos + copy + hashtags prontos a usar.</span>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="inline-flex items-center gap-8 px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-bold mb-14"
          >
            {[
              { n: '3', label: 'Cores de Vídeo', color: 'text-blue-400' },
              { n: '15s', label: 'Por Vídeo', color: 'text-white' },
              { n: '5', label: 'Cenas por Core', color: 'text-white' },
              { n: 'PT-AO', label: 'Narração', color: 'text-[#FFB800]' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <div className="text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.n}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">{s.label}</div>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-white/10" />}
              </React.Fragment>
            ))}
          </motion.div>

          {/* Filter Tabs */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center flex-wrap gap-2"
          >
            <div className="inline-flex bg-white/5 border border-white/10 p-1.5 rounded-full gap-1 flex-wrap justify-center">
              {(Object.keys(FILTER_LABELS) as VideoFilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${
                    filter === f
                      ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ─── CARDS GRID ─── */}
        <AnimatePresence mode="wait">
          <motion.section
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-24"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((core, i) => (
                <VideoCard key={core.id} core={core} onUse={() => handleUseCore(core)} delay={i * 0.06} />
              ))}
            </div>
          </motion.section>
        </AnimatePresence>

        {/* ─── COMPARISON TABLE ─── */}
        <section className="pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
                Qual Core <span className="text-blue-400">Escolher?</span>
              </h2>
              <p className="text-white/50 text-lg font-light">Guia rápido por objectivo</p>
            </div>

            <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
              <div className="grid grid-cols-2 gap-0 bg-white/5 px-6 py-3 border-b border-white/10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Objectivo</p>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Core Recomendado</p>
              </div>
              {COMPARISON_TABLE.map((row, i) => (
                <motion.div
                  key={i}
                  onHoverStart={() => setHoveredRow(i)}
                  onHoverEnd={() => setHoveredRow(null)}
                  animate={hoveredRow === i ? { backgroundColor: 'rgba(59,130,246,0.06)' } : { backgroundColor: 'transparent' }}
                  className="grid grid-cols-2 gap-0 px-6 py-4 border-b border-white/5 last:border-0 cursor-default transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {hoveredRow === i && <Eye size={12} className="text-blue-400 shrink-0" />}
                    <span className="text-sm text-white/70 font-medium">{row.goal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black transition-colors ${hoveredRow === i ? 'text-blue-400' : 'text-white/50'}`}>
                      {row.core}
                    </span>
                    {hoveredRow === i && <ArrowRight size={12} className="text-blue-400" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ─── CTA FINAL ─── */}
        <section className="pb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-900/30 via-[#0d0d12] to-[#0d0d12] border border-blue-500/20 p-12 md:p-20 text-center shadow-[0_0_80px_rgba(59,130,246,0.08)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/8 blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-black mb-8 uppercase tracking-widest">
                <Sparkles size={12} />
                Não sabes qual escolher?
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
                Começa com o<br />
                <span className="text-blue-400">VD-01 REELANGOLA UGC</span>
              </h2>

              <p className="text-lg text-white/60 font-light max-w-2xl mx-auto mb-4 leading-relaxed">
                É o formato de maior conversão e funciona para qualquer produto.
              </p>

              <p className="text-sm text-white/30 mb-12">
                Cada core gera prompts Sora 2 completos prontos a usar — sem conhecimento técnico necessário.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => handleUseCore(VIDEO_CORES.find(c => c.code === 'VD-01') || VIDEO_CORES[0])}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-5 rounded-full bg-blue-500 text-white font-black text-base flex items-center gap-3 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all"
                >
                  <Play size={18} className="fill-white" />
                  Começar Agora — É Grátis
                  <ArrowRight size={18} />
                </motion.button>
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.02 }}
                  className="px-10 py-5 rounded-full border border-white/20 text-white font-bold text-base hover:border-white/40 hover:bg-white/5 transition-all"
                >
                  Ver Exemplos de Vídeos Gerados
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
      <SharedFooter />
    </div>
  );
}
