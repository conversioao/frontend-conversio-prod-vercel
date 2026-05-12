import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Sparkles, Zap, CheckCircle2, Layers,
  Camera, Star, Dumbbell, Utensils, Cpu, Home,
  Scissors, Heart, ShoppingBag, Calendar, Shield, X
} from 'lucide-react';
import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';

interface CoresPageProps {
  onEnter: () => void;
  onBack: () => void;
  onSelect?: (coreId: string) => void;
}

type FilterType = 'all' | 'universal' | 'nicho';

const CORES = [
  {
    id: 'ugc-realistic',
    code: 'CV-01',
    name: 'REELANGOLA UGC',
    category: 'Conteúdo Autêntico',
    type: 'universal' as const,
    icon: Camera,
    gradient: 'from-emerald-900 via-emerald-700 to-green-600',
    barColor: 'from-emerald-400 to-green-500',
    glowColor: 'rgba(16,185,129,0.2)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    for: 'Empresas que querem anúncios com aparência de conteúdo real, orgânico e espontâneo.',
    generates: 'Cenas do quotidiano, pessoas reais em Luanda, momentos de descoberta, unboxing e recomendação direta com alta carga de autenticidade (Talking Head, Routine).',
    idealFor: ['Produtos de consumo', 'Moda e Beleza', 'Restaurantes', 'Serviços locais'],
  },
  {
    id: 'boutique-fashion',
    code: 'CV-02',
    name: 'LUANDALOOKS AGENT',
    category: 'Editorial de Moda',
    type: 'universal' as const,
    icon: Star,
    gradient: 'from-pink-950 via-pink-800 to-rose-700',
    barColor: 'from-pink-400 to-rose-500',
    glowColor: 'rgba(244,63,94,0.2)',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    for: 'Marcas de roupa que buscam uma estética editorial e lifestyle premium.',
    generates: 'Composições street style, looks urbanos em Luanda, catálogo fashion com poses editoriais e estética de revista internacional.',
    idealFor: ['Boutiques', 'Marcas de Roupa', 'Lifestyle Urbano', 'Venda de Ténis/Calçados'],
  },
  {
    id: 'glow-angola',
    code: 'CV-03',
    name: 'GLOWANGOLA PRO',
    category: 'Cosmética e Beleza',
    type: 'universal' as const,
    icon: Sparkles,
    gradient: 'from-blue-950 via-indigo-800 to-violet-700',
    barColor: 'from-blue-400 to-indigo-500',
    glowColor: 'rgba(99,102,241,0.2)',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    for: 'Salões, clínicas e lojas focadas no detalhe extremo e perfeição da pele e cabelo.',
    generates: 'Focos extremos em fórmulas (séruns, cremes), aura fotográfica (Golden Hour) e minimalismo estúdio de luxo.',
    idealFor: ['Skincare / Cosmética', 'Salões de Beleza', 'Clínicas Estéticas', 'Perucas / Cabelo'],
  },
  {
    id: 'impact-ads-pro',
    code: 'CV-04',
    name: 'VIBRA ANGOLA',
    category: 'Design de Alto Impacto',
    type: 'universal' as const,
    icon: Zap,
    gradient: 'from-orange-900 via-orange-700 to-red-600',
    barColor: 'from-orange-400 to-red-500',
    glowColor: 'rgba(249,115,22,0.2)',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    for: 'Campanhas promocionais com inteligência visual 3D forte.',
    generates: 'Produtos em escala gigante, cenários surreais e pop, energia dinâmica e estética tecnológica futurista ou empresarial.',
    idealFor: ['Serviços Financeiros', 'Tecnologia / Apps', 'Bebidas Energéticas', 'Comunicação Promocional'],
  },
];

const CoreCard = ({ core, onUse, delay }: { core: typeof CORES[0]; onUse: () => void; delay: number }) => {
  const Icon = core.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="relative flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0f] shadow-2xl group"
      style={{ boxShadow: `0 0 40px ${core.glowColor}` }}
    >
      {/* Top Color Bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${core.barColor}`} />

      {/* Card Header with Gradient */}
      <div className={`relative px-6 pt-6 pb-8 bg-gradient-to-br ${core.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg flex-shrink-0">
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{core.code}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black border bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Agente Elite
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">{core.name}</h3>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">{core.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-6 gap-5">
        {/* For Who */}
        <div>
          <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-2">Para quem</p>
          <p className="text-sm text-white/70 leading-relaxed">{core.for}</p>
        </div>

        {/* What it generates */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">O que gera</p>
          <p className="text-xs text-white/50 leading-relaxed">{core.generates}</p>
        </div>

        {/* Ideal For */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Ideal para</p>
          <div className="flex flex-wrap gap-1.5">
            {core.idealFor.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-white/60">
                <CheckCircle2 size={9} className="text-[#FFB800] shrink-0" />
                {tag}
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
            className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.4)] hover:shadow-[0_0_30px_rgba(255,184,0,0.6)]"
          >
            Usar Este Core
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export function CoresPage({ onEnter, onBack, onSelect }: CoresPageProps) {
  const handleUseCore = (core: typeof CORES[0]) => {
    if (onSelect) {
      onSelect(core.id);
    } else {
      onEnter();
    }
  };

  return (
    <div className="relative z-10 text-white min-h-screen flex flex-col">
      <SharedHeader onEnter={onEnter} onNavigateHome={onBack} onNavigatePage={onBack} isLoggedIn={false} />
      {/* Large ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FFB800]/5 blur-[150px] pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 max-w-7xl mt-16 flex-grow">

        {/* ─── SECTION 1: HERO ─── */}
        <section className="pt-32 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-[11px] font-black mb-10 uppercase tracking-[0.2em]">
              <span className="w-2 h-2 rounded-full bg-[#FFB800] shadow-[0_0_10px_#FFB800] animate-pulse" />
              Motores de Geração Especializados
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6"
          >
            Escolhe o Core Certo<br />
            para o <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFB800] via-yellow-200 to-white">Teu Negócio</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 font-light max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Os únicos 4 agentes que precisas para dominar o mercado — treinados especificamente para gerar anúncios de imagem e estética de alta conversão.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="inline-flex items-center gap-8 px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-bold mb-16"
          >
            <div className="text-center">
              <div className="text-2xl font-black text-[#FFB800]">4</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Agentes Elite</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Eficácia</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">Angola</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Especializados</div>
            </div>
          </motion.div>
        </section>

        {/* ─── SECTION 2: THE CORES ─── */}
        <section className="pb-32">
          <div className="grid md:grid-cols-3 gap-8">
            {CORES.map((core, i) => (
              <CoreCard key={core.id} core={core} onUse={() => handleUseCore(core)} delay={i * 0.1} />
            ))}
          </div>
        </section>

        {/* ─── SECTION 4: CTA FINAL ─── */}
        <section className="pb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#FFB800]/20 via-[#0d0d12] to-[#0d0d12] border border-[#FFB800]/30 p-12 md:p-20 text-center shadow-[0_0_80px_rgba(255,184,0,0.1)]"
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFB800]/10 blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFB800]/20 border border-[#FFB800]/30 text-[#FFB800] text-[11px] font-black mb-8 uppercase tracking-widest">
                <Sparkles size={12} />
                Não sabes qual escolher?
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
                Começa com o <br />
                <span className="text-[#FFB800]">REELANGOLA UGC</span>
              </h2>

              <p className="text-lg text-white/60 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
                Funciona para qualquer produto e qualquer negócio. É o melhor ponto de partida para qualquer um que queira criar anúncios de alta qualidade.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => handleUseCore(CORES.find(c => c.code === 'CV-01') || CORES[0])}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-5 rounded-full bg-[#FFB800] text-black font-black text-base flex items-center gap-3 shadow-[0_0_40px_rgba(255,184,0,0.5)] hover:shadow-[0_0_60px_rgba(255,184,0,0.7)] transition-all"
                >
                  Começar Agora — É Grátis <ArrowRight size={20} />
                </motion.button>
                <motion.button
                  onClick={onBack}
                  whileHover={{ scale: 1.02 }}
                  className="px-10 py-5 rounded-full border border-white/20 text-white font-bold text-base hover:border-white/40 hover:bg-white/5 transition-all"
                >
                  Ver Exemplos de Anúncios
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
