import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Play, Sparkles, Video, Image as ImageIcon, 
  ShoppingCart, Target, Wand2, Star, Check, Zap, 
  Upload, Layers, ChevronDown, CheckCircle2, Heart,
  MessageCircle, Share2, Instagram, Twitter, Linkedin,
  Globe, Briefcase, Activity, MonitorPlay, Users, ZapIcon,
  MousePointerClick, Quote, CreditCard, Mic, ShieldCheck,
  Smartphone, Bot
} from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { CoresPage } from './CoresPage';
import { VideoCoresPage } from './VideoCoresPage';
import { SharedHeader } from './SharedHeader';
import { SharedFooter } from './SharedFooter';
import { apiFetch } from '../lib/api';
import { PWAInstallBanner } from './ui/PWAInstallBanner';

interface LandingPageProps {
  onEnter: () => void;
  onNavigate: (page: string) => void;
}

// ---------------------------------------------
// COMPONENTES DE EFEITO E ESTRUTURA
// ---------------------------------------------

const DesignGridBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-[#050505] overflow-hidden pointer-events-none">
      {/* Base Grid */}
      <div 
        className="absolute inset-0 opacity-[0.08]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,184,0,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,184,0,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Animated Light Traces */}
      <AnimatePresence>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`trace-${i}`}
            initial={{ 
              x: i % 2 === 0 ? '-100%' : '100%', 
              y: `${10 + (i * 12)}%`,
              opacity: 0 
            }}
            animate={{ 
              x: i % 2 === 0 ? '200%' : '-100%',
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 12 + Math.random() * 8, 
              repeat: Infinity, 
              ease: "linear", 
              delay: i * 2 
            }}
            className="absolute h-[1px] w-[40%] bg-gradient-to-r from-transparent via-[#FFB800]/40 to-transparent blur-[1px]"
          />
        ))}
      </AnimatePresence>

      {/* Pulsing Intersections - Subtle Dots */}
      <div className="absolute inset-0 opacity-[0.15]" style={{
        backgroundImage: `radial-gradient(#FFB800 0.5px, transparent 0.5px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Large Floating Design Icons */}
      <motion.div 
        animate={{ y: [0, -30, 0], rotate: [0, 5, 0], opacity: [0.03, 0.05, 0.03] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[5%] text-[#FFB800]"
      >
        <MousePointerClick size={280} strokeWidth={0.3} />
      </motion.div>
      
      <motion.div 
        animate={{ y: [0, 40, 0], rotate: [0, -8, 0], opacity: [0.02, 0.04, 0.02] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-[15%] right-[5%] text-[#FFB800]"
      >
        <Layers size={320} strokeWidth={0.3} />
      </motion.div>

      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] right-[15%] text-white"
      >
        <Target size={200} strokeWidth={0.2} />
      </motion.div>

      {/* Gradient Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] opacity-80" />
    </div>
  );
};

const ParticleBackground = () => {
  const [particles] = useState([...Array(30)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#FFB800]"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, opacity: 0.1 }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.05, 0.2, 0.05],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay
          }}
        />
      ))}
    </div>
  );
};

const GlowOverlay = ({ className = "" }) => (
  <div className={`absolute rounded-full mix-blend-screen filter blur-[120px] pointer-events-none opacity-30 ${className}`} />
);

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Scroll3DSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 1], [15, -15]), { stiffness: 80, damping: 30 });
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.9]), { stiffness: 100, damping: 30 });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]), { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} style={{ perspective: 1500 }} className={`w-full ${className}`}>
      <motion.div style={{ rotateX, scale, opacity }} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
};

const BentoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => { setIsFocused(true); setOpacity(1); };
  const handleBlur = () => { setIsFocused(false); setOpacity(0); };
  const handleMouseEnter = () => { setOpacity(1); };
  const handleMouseLeave = () => { setOpacity(0); };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-[2rem] bg-surface/50 border border-border-subtle p-8 transition-transform hover:-translate-y-2 duration-500 shadow-xl group ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,184,0,.15), transparent 40%)`,
        }}
      />
      <div className="relative z-10 w-full h-full flex flex-col">{children}</div>
    </div>
  );
};

const UgcVideoCard = ({ src, creator, title, isVideo = false }: { src: string, creator: string, title: string, isVideo?: boolean }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current && videoRef.current.src) {
        videoRef.current.play().catch((e) => console.log('Video play failed or not supported:', e));
    }
  };
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (!isNaN(videoRef.current.duration)) {
          videoRef.current.currentTime = 0;
      }
    }
  };

  return (
    <div
      className="relative aspect-[9/16] w-full max-w-[280px] rounded-[2rem] overflow-hidden bg-[#111] shadow-2xl border border-white/10 group cursor-pointer transition-transform hover:-translate-y-4 duration-500 flex-shrink-0"
      onMouseEnter={isVideo ? handleMouseEnter : undefined}
      onMouseLeave={isVideo ? handleMouseLeave : undefined}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={src || undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        />
      ) : (
        <img src={src || undefined} loading="lazy" decoding="async" alt={title} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>

      {/* AO VIVO badge */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/15 flex items-center gap-2 shadow-lg">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
        AO VIVO
      </div>

      {/* Title above the card text */}
      <div className="absolute top-4 left-14 right-4 text-white text-[11px] font-bold leading-snug drop-shadow-md line-clamp-2 hidden group-hover:block">{title}</div>

      <div className="absolute bottom-6 left-5 right-5 text-white pointer-events-none z-20">
         <p className="font-bold text-sm flex items-center gap-1 drop-shadow-md">@{creator} <CheckCircle2 size={14} className="text-[#FFB800]" /></p>
         <p className="text-xs text-white/80 line-clamp-2 mt-1 drop-shadow-md">{title}</p>
         <div className="mt-3 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-[10px] uppercase font-bold text-[#FFB800] w-max flex items-center gap-1 border border-white/10"><Sparkles size={10}/> IA Criativo</div>
      </div>

      {/* Play overlay visible on non-video or on hover for video */}
      {!isVideo && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-10 backdrop-blur-[2px]">
          <div className="w-16 h-16 rounded-full bg-accent text-bg-base flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform"><Play size={24} className="ml-1 fill-current" /></div>
        </div>
      )}
    </div>
  );
};

const ComparisonPlaceholder = ({ leftLabel, rightLabel, leftIcon, rightIcon, beforeImage, afterImage }: { leftLabel: string, rightLabel: string, leftIcon: React.ReactNode, rightIcon: React.ReactNode, beforeImage?: string, afterImage?: string }) => (
  <div className="grid grid-cols-2 gap-4 w-full aspect-[16/9] md:aspect-video mt-8">
     <div className="relative rounded-2xl border-2 border-dashed border-border-subtle bg-surface/30 flex flex-col items-center justify-center overflow-hidden group/p">
        {beforeImage ? (
          <img src={beforeImage} alt="Entrada" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/p:scale-105 transition-transform duration-700" />
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center mb-3 text-text-tertiary group-hover/p:text-[#FFB800] transition-colors">
               {leftIcon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary text-center">{leftLabel}</p>
          </div>
        )}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-bg-base/80 backdrop-blur-md border border-border-subtle text-[8px] font-bold text-text-tertiary uppercase tracking-tighter z-10">Entrada</div>
     </div>
     <div className="relative rounded-2xl border-2 border-dashed border-[#FFB800]/30 bg-[#FFB800]/5 flex flex-col items-center justify-center overflow-hidden group/p">
        {afterImage ? (
          <img src={afterImage} alt="Saída IA" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/p:scale-105 transition-transform duration-700" />
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center mb-3 text-[#FFB800] animate-pulse">
               {rightIcon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] text-center">{rightLabel}</p>
          </div>
        )}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#FFB800] text-black text-[8px] font-black uppercase tracking-tighter z-10">Saída IA</div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/20 to-transparent pointer-events-none z-0"></div>
     </div>
  </div>
);

const GoogleLogo = () => (
  <motion.svg 
    viewBox="0 0 24 24" className="w-8 h-8"
    animate={{ y: [0, -4, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </motion.svg>
);

const OpenAILogo = () => (
  <motion.svg 
    viewBox="0 0 24 24" className="w-8 h-8" fill="white"
    animate={{ rotate: 360 }}
    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
  >
    <path d="M22.28 7.53a5.19 5.19 0 0 0-2.51-1.11 5.25 5.25 0 0 0-5 1.65l-1.09 1.26 1.15-1.21a5.25 5.25 0 0 0 .14-7.37 5.19 5.19 0 0 0-7.37.14l-1.15 1.21.01-.01a5.25 5.25 0 0 0-1.65 5 5.19 5.19 0 0 0 1.11 2.51l1.21 1.15-1.21-1.15a5.25 5.25 0 0 0-7.37-.14 5.19 5.19 0 0 0-.14 7.37l1.21 1.15-.01-.01a5.25 5.25 0 0 0 5 1.65 5.19 5.19 0 0 0 2.51-1.11l1.15-1.21-1.15 1.21a5.25 5.25 0 0 0-.14 7.37 5.19 5.19 0 0 0 7.37-.14l1.15-1.21-.01.01a5.25 5.25 0 0 0 1.65-5 5.19 5.19 0 0 0-1.11-2.51l-1.21-1.15 1.21 1.15a5.25 5.25 0 0 0 7.37.14 5.19 5.19 0 0 0 .14-7.37l-1.21-1.15.01.01zM12 10.59a1.41 1.41 0 1 1 0 2.82 1.41 1.41 0 0 1 0-2.82z" />
  </motion.svg>
);

const ByteDanceLogo = () => (
  <motion.svg 
    viewBox="0 0 128 128" className="w-8 h-8"
    animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  >
    <path fill="#51D8D2" d="M101.4 69.8c1.3.1 2.5.3 3.8.3 12 0 21.8-9.8 21.8-21.8s-9.8-21.8-21.8-21.8c-1.3 0-2.5.1-3.8.3V6.2L74.1 32.7V101.5l27.3-26.5V69.8z"/>
    <path fill="#37C0BA" d="M53.9 69.8c1.3.1 2.5.3 3.8.3 12 0 21.8-9.8 21.8-21.8S69.7 26.5 57.7 26.5c-1.3 0-2.5.1-3.8.3V6.2L26.6 32.7V101.5l27.3-26.5V69.8z"/>
    <path fill="#1E9BB8" d="M6.3 69.8c1.3.1 2.5.3 3.8.3 12 0 21.8-9.8 21.8-21.8S22.1 26.5 10.1 26.5c-1.3 0-2.5.1-3.8.3V6.2L0 32.7V101.5l6.3-6.1V69.8z"/>
  </motion.svg>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border-subtle bg-surface/50 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer hover:border-text-tertiary transition-colors" onClick={() => setIsOpen(!isOpen)}>
      <div className="p-6 flex items-center justify-between">
        <h4 className="text-text-primary font-bold text-lg">{question}</h4>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-[#FFB800]">
          <ChevronDown />
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 pt-0">
            <p className="text-text-secondary leading-relaxed font-light">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LogoMarquee = () => {
  const logos = [
    { name: "Google", component: <GoogleLogo /> },
    { name: "OpenAI", component: <OpenAILogo /> },
    { name: "ByteDance", component: <ByteDanceLogo /> },
    { name: "Meta", component: <MetaLogo /> },
    { name: "Microsoft", component: <MicrosoftLogo /> },
    { name: "Runway", component: <RunwayLogo /> },
    { name: "Luma AI", component: <LumaLogo /> },
    { name: "Adobe", component: <AdobeLogo /> },
    { name: "Mistral", component: <MistralLogo /> }
  ];

  return (
    <div className="flex w-full overflow-hidden bg-surface/10 py-12 border-y border-border-subtle relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg-base to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg-base to-transparent z-10" />
      
      <motion.div 
        className="flex gap-16 items-center whitespace-nowrap"
        animate={{ x: [0, -1920] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...logos, ...logos, ...logos].map((logo, i) => (
          <div key={i} className="flex items-center gap-4 group cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-bg-base/50 border border-border-subtle flex items-center justify-center group-hover:border-[#FFB800]/50 transition-colors shadow-lg">
              {logo.component}
            </div>
            <span className="text-xl font-black text-text-secondary group-hover:text-text-primary transition-colors tracking-tight">{logo.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const MetaLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-blue-500">
    <path d="M16.48 4.64C14.37 4.64 12.87 5.64 12 7.14C11.13 5.64 9.63 4.64 7.52 4.64C4.22 4.64 2 7.14 2 10.64C2 14.14 4.22 16.64 7.52 16.64C9.63 16.64 11.13 15.64 12 14.14C12.87 15.64 14.37 16.64 16.48 16.64C19.78 16.64 22 14.14 22 10.64C22 7.14 19.78 4.64 16.48 4.64ZM7.52 14.14C5.72 14.14 4.5 12.64 4.5 10.64C4.5 8.64 5.72 7.14 7.52 7.14C8.82 7.14 9.82 7.84 10.32 8.84C9.62 10.34 8.62 12.34 7.52 14.14ZM16.48 14.14C15.38 12.34 14.38 10.34 13.68 8.84C14.18 7.84 15.18 7.14 16.48 7.14C18.28 7.14 19.5 8.64 19.5 10.64C19.5 12.64 18.28 14.14 16.48 14.14Z"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg viewBox="0 0 23 23" className="w-8 h-8">
    <path fill="#f35325" d="M0 0h11v11H0z"/>
    <path fill="#81bc06" d="M12 0h11v11H12z"/>
    <path fill="#05a6f0" d="M0 12h11v11H0z"/>
    <path fill="#ffba08" d="M12 12h11v11H12z"/>
  </svg>
);

const RunwayLogo = () => (
  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-black text-lg">R</div>
);

const LumaLogo = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-lg">L</div>
);

const AdobeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-[#FF0000]">
    <path d="M13.966 22.62L18.867 22.62V2.625L13.966 2.625Z M9.52 15.116L12.431 22.62L13.966 22.62V2.625Z M13.966 2.625L5.133 22.62H1.375L13.966 2.625Z"/>
  </svg>
);

const MistralLogo = () => (
  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-black text-white text-lg">M</div>
);


const CreativeBackgroundEffects = ({ scrollProgress }: { scrollProgress: any }) => {
  const y1 = useTransform(scrollProgress, [0, 1], [0, -800]);
  const y2 = useTransform(scrollProgress, [0, 1], [0, 1000]);
  const y3 = useTransform(scrollProgress, [0, 1], [0, -1200]);
  const rotate1 = useTransform(scrollProgress, [0, 1], [0, 360]);
  const rotate2 = useTransform(scrollProgress, [0, 1], [0, -360]);
  const scale = useTransform(scrollProgress, [0, 0.5, 1], [0.8, 1.5, 0.8]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1] mix-blend-screen">
      <motion.div style={{ y: y1, rotate: rotate1, scale }} className="absolute top-[20%] left-[5%] w-64 h-64 rounded-[3rem] border border-[#FFB800]/30 shadow-[0_0_40px_rgba(255,184,0,0.1)] backdrop-blur-3xl" />
      <motion.div style={{ y: y2, rotate: rotate2, scale }} className="absolute top-[40%] right-[5%] w-96 h-96 bg-gradient-to-tr from-[#FFB800]/5 to-transparent blur-[80px] rounded-full" />
      <motion.div style={{ y: y3, rotate: rotate1 }} className="absolute top-[70%] left-[15%] w-48 h-48 border-[2px] border-dashed border-white/10 rounded-full opacity-50" />
      <motion.div style={{ y: y1, rotate: rotate2 }} className="absolute top-[80%] right-[20%] flex gap-4 opacity-30">
        {[1,2,3].map(i => <div key={i} className="w-4 h-16 rounded-full bg-gradient-to-t from-[#FFB800] to-transparent"></div>)}
      </motion.div>
    </div>
  );
};

const GlitchTextTransition = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), 3500);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <span className="inline-block relative h-[1.3em] w-full max-w-[800px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(20px) brightness(2)', scale: 1.05, y: 10 }}
          animate={{ opacity: 1, filter: 'blur(0px) brightness(1)', scale: 1, y: 0 }}
          exit={{ opacity: 0, filter: 'blur(20px) brightness(0)', scale: 0.95, y: -10 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFB800] via-yellow-100 to-white absolute left-0 right-0 mx-auto w-full text-center drop-shadow-[0_0_15px_rgba(255,184,0,0.5)]"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// ---------------------------------------------
// PÁGINA PRINCIPAL (Ordem Psicológica de Conversão)
// ---------------------------------------------

export function LandingPage({ onEnter, onNavigate }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'ugc' | '3d'>('ugc');
  const [creditPackages, setCreditPackages] = useState<any[]>([]);


  const [landingMedia, setLandingMedia] = useState<Record<string, string>>({});

  const fetchLandingMedia = async () => {
    try {
      const res = await apiFetch('/public/landing-media');
      const data = await res.json();
      if (data.success) {
        const mediaMap: Record<string, string> = {};
        data.media.forEach((m: any) => {
          mediaMap[m.slot_id] = m.media_url;
        });
        setLandingMedia(mediaMap);
      }
    } catch (e) {}
  };

  const fetchCreditPackages = async () => {
    try {
      const res = await apiFetch('/public/credit-packages');
      const data = await res.json();
      if (data.success) {
        setCreditPackages(data.packages);
      }
    } catch (e) {
      console.error('Failed to fetch packages:', e);
    }
  };

  useEffect(() => {
    fetchCreditPackages();
    fetchLandingMedia();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const token = localStorage.getItem('conversio_token');
  const user = localStorage.getItem('conversio_user');
  const isLoggedIn = !!(token && user);

  return (
    <div ref={containerRef} className="min-h-screen w-full font-sans overflow-x-hidden relative selection:bg-[#FFB800]/30 selection:text-text-primary bg-[#050505] text-text-primary">
      
      <DesignGridBackground />
      <ParticleBackground />

      {/* Scroll Progress Indicator */}
      <motion.div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-[#FFB800] to-accent origin-left z-[100] shadow-[0_0_20px_rgba(255,184,0,1)]" style={{ scaleX }} />


      {/* HEADER ELEGANTE */}
      <SharedHeader 
        onEnter={onEnter} 
        onNavigatePage={onNavigate} 
        isLoggedIn={isLoggedIn} 
      />

      {/* ─── BODY ─── */}
      <>

      {/* 🚀 1. HERO (Atenção Absoluta) */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
        {/* Shadow Overlay to separate hero content from grid */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/20 via-transparent to-[#050505]/40 pointer-events-none z-0"></div>

        {/* Floating UGC Cards */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 hidden lg:flex">
           <motion.div 
              animate={{ y: [0, -30, 0], rotateZ: [-6, -2, -6] }} 
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
              className="absolute left-[8%] top-[20%] w-60 aspect-[9/16] rounded-3xl border border-white/10 p-2 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden"
           >
              <video 
                src={landingMedia['hero_video_ugc'] || "/videos/ugc.mp4"} 
                autoPlay 
                muted 
                loop 
                playsInline 
                preload="metadata"
                className="w-full h-full object-cover rounded-2xl opacity-100 transition-all duration-1000 bg-black" 
              />
              <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-xl rounded-xl p-3 border border-white/10 shadow-lg">
                 <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]"></div><span className="text-[10px] text-white font-black uppercase tracking-wider">ROI +340%</span></div>
                 <div className="text-[10px] text-white/60 font-medium">TikTok UGC Ad</div>
              </div>
           </motion.div>

           <motion.div 
              animate={{ y: [0, 40, 0], rotateZ: [4, 8, 4] }} 
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} 
              className="absolute right-[8%] top-[15%] w-72 aspect-square rounded-[3rem] border border-[#FFB800]/20 p-2 bg-[#FFB800]/5 backdrop-blur-md shadow-[0_0_50px_rgba(255,184,0,0.15)]"
           >
              <img src={landingMedia['hero_product_img'] || "/images/conv.png"} fetchPriority="high" className="w-full h-full object-cover rounded-[2.5rem] opacity-90 transition-all duration-1000" />
           </motion.div>
        </div>

        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center mt-6">
          <Reveal delay={0.1}>
             <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-surface/30 backdrop-blur-2xl border border-white/10 text-white/90 text-[11px] font-black mb-10 shadow-xl uppercase tracking-[0.2em] backdrop-saturate-150">
               <span className="w-2 h-2 rounded-full bg-[#FFB800] shadow-[0_0_10px_#FFB800] animate-pulse"></span>
               Produção de Criativos 2.0
            </div>
          </Reveal>

          <Reveal delay={0.2} className="max-w-5xl relative z-10 w-full text-center flex flex-col items-center">
            <h1 className="text-6xl md:text-[7rem] font-black tracking-tighter text-white leading-[0.95] mb-8 drop-shadow-2xl">
               O futuro da criação <br/> de <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFB800] via-yellow-200 to-white">Anúncios.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.3} className="max-w-3xl relative z-10">
            <p className="text-xl md:text-2xl text-white/50 font-light mb-14 leading-relaxed mix-blend-screen">
              Escreva o que o seu produto faz. A nossa Inteligência Artificial gera dezenas de vídeos UGC e Banners insanos em segundos.
            </p>
          </Reveal>

          {/* Interactive Prompt / Search Bar */}
          <Reveal delay={0.4} className="w-full max-w-3xl relative z-20">
            <div className="relative group perspective-1000">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#FFB800]/50 to-orange-500/50 rounded-full blur-xl opacity-20 group-hover:opacity-60 transition duration-1000"></div>
              <div className="relative flex flex-col sm:flex-row items-center bg-[#0d0d12]/90 backdrop-blur-3xl border border-white/20 rounded-full p-2 pl-6 shadow-2xl transition-transform hover:scale-[1.01] duration-500">
                 <Sparkles className="text-[#FFB800] mr-3 hidden sm:block shrink-0" size={24} />
                 <div className="flex-1 w-full flex items-center h-14">
                    <span className="text-white/40 text-lg font-light w-full text-left truncate">
                      Um vídeo review estilo TikTok sobre<span className="animate-pulse">|</span>
                    </span>
                 </div>
                 <button onClick={onEnter} className="w-full sm:w-auto mt-2 sm:mt-0 bg-gradient-to-r from-[#FFB800] to-yellow-500 text-black px-8 py-4 rounded-full text-sm sm:text-base font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,184,0,0.5)]">
                   Gerar Anúncio <Wand2 size={18} className="shrink-0" />
                 </button>
              </div>
            </div>
            
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40 font-medium tracking-wide">
               <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Sem gravar vídeos</span>
               <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><CheckCircle2 size={16} className="text-green-500"/> Avatares Hiper-realistas</span>
               <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Formatos Facebook e TikTok</span>
            </div>
          </Reveal>

        </div>
      </section>



      {/* 🖼️ 2. PROVA VISUAL IMEDIATA (Exemplos Reais que vendem) */}
      <section id="exemplos" className="py-24 bg-surface/20 border-y border-border-subtle overflow-hidden relative z-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#FFB800]/5 blur-[150px] pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter mb-4">Veja com os seus <span className="text-[#FFB800]">próprios olhos</span></h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto font-light mb-10">O mesmo produto. Resultados completamente diferentes.</p>
            
            <div className="flex bg-surface border border-border-subtle p-1.5 rounded-full mx-auto w-max max-w-full">
              <div className="px-8 py-3 rounded-full text-sm font-bold bg-text-primary text-bg-base shadow-md">
                UGC Vídeos Virais
              </div>
            </div>
          </Reveal>

          <div className="flex justify-center gap-6 flex-wrap mt-10">
             <UgcVideoCard src={landingMedia['core_ugc_video_1'] || "/videos/ugc_hero.mp4"} title="Esse produto mudou a minha rotina!" creator="alimo_angola" isVideo />
             <UgcVideoCard src={landingMedia['core_ugc_video_2'] || "/videos/ugc2.mp4"} title="O meu skincare angolano em 30s. ✨" creator="nrc_angola" isVideo />
             <UgcVideoCard src={landingMedia['core_ugc_video_3'] || "/videos/ugc_viral_1.mp4"} title="Qualidade que fala por si. Incrível." creator="ncr_angola" isVideo />
          </div>
        </div>
      </section>

      {/* ⚙️ 3. COMO FUNCIONA (Reduz fricção mental) */}
      <section id="funciona" className="py-32 relative">
        <div className="container mx-auto px-6">
          <Reveal className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter mb-4">Pipeline <span className="text-[#FFB800]">Mágico</span></h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto font-light">Transforme ideias em anúncios convertíveis em três passos absolutos.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative max-w-5xl mx-auto h-full">
            {[
              { icon: <Upload />, title: "Carregue o seu produto", desc: "A IA entende o seu produto e remove fundos perfeitamente." },
              { icon: <Layers />, title: "Escolha o formato", desc: "Seja UGC Video com avatares falantes ou Banners Estáticos." },
              { icon: <Zap />, title: "Gere com IA", desc: "10 segundos depois, tem o anúncio pronto a vender no Ads." }
            ].map((step, i) => (
              <Scroll3DSection key={i} className="h-full">
                <BentoCard className="text-center group flex flex-col items-center h-full justify-start">
                  <div className="w-24 h-24 rounded-full bg-bg-base border-2 border-border-subtle flex items-center justify-center mb-8 relative z-20 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:border-[#FFB800] transition-colors shrink-0">
                    {React.cloneElement(step.icon as React.ReactElement<any>, { size: 36, className: "text-text-primary group-hover:text-[#FFB800] transition-colors" })}
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-3 relative z-20 shrink-0">{step.title}</h3>
                  <p className="text-text-secondary text-sm relative z-20 flex-grow">{step.desc}</p>
                </BentoCard>
              </Scroll3DSection>
            ))}
          </div>
        </div>
      </section>

      {/* 🔮 3. OS AGENTES SENSACIONAIS */}
      <section id="agentes" className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <Reveal className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-6 leading-tight">
              Os Agentes que transformam o seu <br className="hidden md:block"/> produto em <span className="text-[#FFB800]">anúncios que vendem</span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto font-light">
              Cada Agente é um motor de IA especializado. Escolhe o teu e gera anúncios prontos em segundos.
            </p>
          </Reveal>

          <div className="space-y-32">
            {/* AGENTE UGC IMAGEM */}
            <Reveal>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFB800] text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.4)]">
                         <ImageIcon size={24} />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter">Agente UGC — Imagem 🎨</h3>
                   </div>
                   <p className="text-xl text-text-secondary font-light mb-8 leading-relaxed">
                     Gera anúncios UGC ultra-realistas que parecem criados por utilizadores reais angolanos.
                   </p>
                   
                   <div className="grid sm:grid-cols-2 gap-6 mb-10">
                      <div className="space-y-4">
                         <h4 className="text-[#FFB800] font-black uppercase text-xs tracking-[0.2em]">Funcionalidades</h4>
                         <ul className="space-y-3">
                            {['Pessoas negras e morenas angolanas', '6 formatos (Review, Unboxing, etc)', 'Conteúdo autêntico e fidedigno'].map(f => (
                               <li key={f} className="flex items-center gap-2 text-sm text-text-primary font-medium">
                                  <CheckCircle2 size={16} className="text-[#FFB800] shrink-0" /> {f}
                               </li>
                            ))}
                         </ul>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-[#FFB800] font-black uppercase text-xs tracking-[0.2em]">Modelos IA</h4>
                         <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-surface border border-border-subtle text-[10px] font-bold text-text-secondary">Nano Banana 2</span>
                            <span className="px-3 py-1 rounded-full bg-surface border border-border-subtle text-[10px] font-bold text-text-secondary">Sora 2</span>
                         </div>
                      </div>
                   </div>
                   
                   <button onClick={onEnter} className="group flex items-center gap-2 text-[#FFB800] font-black uppercase text-xs tracking-widest hover:gap-4 transition-all">
                      Testar UGC RealisticLife <ArrowRight size={16} />
                   </button>
                </div>
                <div className="order-1 lg:order-2">
                   <BentoCard className="!p-4 bg-surface/30 backdrop-blur-xl border-border-subtle/50 relative overflow-hidden group">
                      <video 
                        src={landingMedia['comparison_video'] || "/videos/comparacao.mp4"} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        preload="none"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-1000 bg-black"
                      />
                      <ComparisonPlaceholder 
                        leftLabel="Foto do Produto" 
                        rightLabel="Anúncio UGC gerado pela IA" 
                        leftIcon={<Upload size={24} />} 
                        rightIcon={<Sparkles size={24} />} 
                        beforeImage={landingMedia['comparison_before'] || "/antes.png"}
                        afterImage={landingMedia['comparison_after'] || "/depois.png"}
                      />
                   </BentoCard>
                </div>
              </div>
            </Reveal>

            {/* AGENTE UGC VÍDEO */}
            <Reveal>
              <div className="grid lg:grid-cols-1 gap-16 items-center">
                <div>
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFB800] text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.4)]">
                         <Video size={24} />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter">Agente UGC — Vídeo 🎬</h3>
                   </div>
                   <p className="text-xl text-text-secondary font-light mb-8 leading-relaxed">
                     Gera vídeos UGC automáticos de alta conversão com narrador angolano profissional e CTA integrado no final. Powered by Veo 3.
                   </p>
                   
                   <div className="grid sm:grid-cols-2 gap-6 mb-10">
                      <div className="space-y-4">
                         <h4 className="text-[#FFB800] font-black uppercase text-xs tracking-[0.2em]">Funcionalidades</h4>
                         <ul className="space-y-3">
                            {['Narrador com sotaque angolano moderno', 'CTA integrado no final do vídeo', 'Formato vertical TikTok/Reels/Stories'].map(f => (
                               <li key={f} className="flex items-center gap-2 text-sm text-text-primary font-medium">
                                  <CheckCircle2 size={16} className="text-[#FFB800] shrink-0" /> {f}
                               </li>
                            ))}
                         </ul>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-[#FFB800] font-black uppercase text-xs tracking-[0.2em]">Motor de IA</h4>
                         <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-surface border border-border-subtle text-[10px] font-bold text-text-secondary">Google Veo 3</span>
                            <span className="px-3 py-1 rounded-full bg-surface border border-border-subtle text-[10px] font-bold text-text-secondary">GPT-4o</span>
                         </div>
                      </div>
                   </div>
                   
                   <button onClick={onEnter} className="group flex items-center gap-2 text-[#FFB800] font-black uppercase text-xs tracking-widest hover:gap-4 transition-all">
                       Usar Agente UGC Vídeo <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </Reveal>


          </div>
        </div>

        {/* FAIXA DE MODELOS (Marquee) */}
        <div className="mt-40">
          <div className="container mx-auto px-6 max-w-7xl mb-12">
             <Reveal className="text-center">
                <h4 className="text-text-primary font-black uppercase text-xs tracking-[0.4em] mb-4 opacity-50">Tecnologia de ponta mundial para o teu sucesso</h4>
             </Reveal>
          </div>
          <LogoMarquee />
        </div>

      </section>



      {/* 🏆 5. BENEFÍCIOS (Clarificam a Compra) */}
      <section id="beneficios" className="py-32 relative">
        <div className="container mx-auto px-6">
          <Reveal className="mb-24 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter mb-4">Vantagens <span className="text-[#FFB800]">Absolutas</span></h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto font-light">Foque no tráfego. Nós resolvemos o design.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <BentoCard className="md:col-span-2">
              <div className="flex gap-6 items-center flex-col md:flex-row h-full">
                <div className="w-20 h-20 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center flex-shrink-0 text-[#FFB800] shadow-[0_0_20px_rgba(255,184,0,0.2)] group-hover:scale-110 transition-transform">
                  <Zap size={40} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-text-primary mb-3">Criação em Segundos</h3>
                  <p className="text-lg text-text-secondary leading-relaxed">Crie campanhas inteiras enquanto a sua concorrência ainda procura freelancers. A Geração acontece em tempo real.</p>
                </div>
              </div>
            </BentoCard>

            <BentoCard>
              <div className="flex flex-col items-center text-center justify-center h-full">
                <div className="w-16 h-16 rounded-full bg-bg-base border border-border-subtle flex items-center justify-center mb-6 text-text-primary group-hover:text-[#FFB800] group-hover:border-[#FFB800]/50 transition-colors">
                  <Briefcase size={28} />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Sem Designer</h3>
                <p className="text-text-secondary">Nenhuma habilidade necessária. Digita. Clica. Gera.</p>
              </div>
            </BentoCard>

            {[
              { icon: <Target />, title: "Otimizado p/ Conversão", desc: "Algoritmos treinados com anúncios ultra vendedores." },
              { icon: <Share2 />, title: "Pronto p/ Redes Sociais", desc: "Formatos ajustados para Instagram, TikTok e Facebook." },
              { icon: <Globe />, title: "Escalável p/ Campanhas", desc: "Multiplique criativos com apenas um clique para testes A/B infinitos." }
            ].map((ben, i) => (
              <BentoCard key={i} className="flex flex-col text-center items-center justify-center">
                <div className="w-16 h-16 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center mb-6 text-text-primary group-hover:text-[#FFB800] group-hover:border-[#FFB800]/50 transition-colors">
                  {React.cloneElement(ben.icon as React.ReactElement<any>, { size: 28 })}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{ben.title}</h3>
                <p className="text-sm text-text-secondary">{ben.desc}</p>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* 📊 6. PROVA SOCIAL */}
      <section className="py-12 border-y border-border-subtle bg-surface/10 overflow-hidden">
        <div className="container mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-10">Empresas angolanas que já usam IA para escalar anúncios</p>
          <motion.div 
            className="flex w-max gap-24 items-center whitespace-nowrap opacity-40 hover:opacity-100 transition-opacity"
            animate={{ x: [0, -1200] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
             {[...Array(3)].map((_, j) => (
                <div key={j} className="flex gap-24 items-center shrink-0">
                  <div className="flex items-center gap-3 text-3xl font-black tracking-tighter"><MonitorPlay className="text-[#FFB800]"/> AngoAds</div>
                  <div className="flex items-center gap-3 text-3xl font-black tracking-tighter"><Target className="text-[#FFB800]"/> KambaDigital</div>
                  <div className="flex items-center gap-3 text-3xl font-black tracking-tighter"><ShoppingCart className="text-[#FFB800]"/> MwikaSales</div>
                  <div className="flex items-center gap-3 text-3xl font-black tracking-tighter"><ZapIcon className="text-[#FFB800]"/> LuandaGrowth</div>
                  <div className="flex items-center gap-3 text-3xl font-black tracking-tighter"><Users className="text-[#FFB800]"/> NdengueTech</div>
                </div>
             ))}
          </motion.div>
        </div>
      </section>

      {/* 👥 7. TESTEMUNHOS */}
      <section id="testemunhos" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-7xl">
          <Reveal className="text-center mb-20">
             <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter mb-4">Mentes de Escala</h2>
             <p className="text-xl text-text-secondary font-light">Casos de estudo absolutos de quem apostou na Conversio.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sebastião N.", role: "CEO @ AngoMarket", text: "Aumentamos as vendas em 3x com os anúncios UGC gerados. A facilidade de testar criativos é simplesmente surreal.", image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop" },
              { name: "Nádia K.", role: "Head of Growth", text: "Reduzi drasticamente o meu custo de criativos. Acabou a nossa dependência de estúdios e a lentidão na criação de campanhas.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop" },
              { name: "Agostinho M.", role: "E-commerce Owner", text: "Os criativos da IA são de alta qualidade e elevam imediatamente o valor percecionado da nossa marca corporativa no digital.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" }
            ].map((review, i) => (
              <Scroll3DSection key={i}>
                <BentoCard className="h-full">
                  <div className="relative z-20 flex flex-col h-full justify-between">
                    <div>
                      <Quote size={30} className="text-text-tertiary mb-6" />
                      <div className="flex gap-1 mb-6">
                        {[1,2,3,4,5].map(j => <Star key={j} size={16} className="fill-[#FFB800] text-[#FFB800]" />)}
                      </div>
                      <p className="text-text-secondary text-lg mb-8 font-medium leading-relaxed">"{review.text}"</p>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
                      <img src={review.image} alt={review.name} className="w-12 h-12 rounded-full object-cover border border-[#FFB800]/50 shadow-lg" />
                      <div>
                        <h4 className="font-bold text-text-primary">{review.name}</h4>
                        <p className="text-xs text-text-secondary">{review.role}</p>
                      </div>
                    </div>
                  </div>
                </BentoCard>
              </Scroll3DSection>
            ))}
          </div>
        </div>
      </section>

      {/* 🖥️ 8. DEMONSTRAÇÃO DO PRODUTO (Novo) */}
      <section className="py-32 bg-surface/30 border-y border-border-subtle">
        <div className="container mx-auto px-6 text-center max-w-6xl">
           <Reveal className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter mb-4">Veja a Plataforma em <span className="text-[#FFB800]">Ação</span></h2>
            <p className="text-xl text-text-secondary font-light">Sem surpresas. A interface desenhada para performance.</p>
          </Reveal>
          
          <Reveal>
             <div className="w-full aspect-video bg-bg-base border border-border-subtle rounded-3xl overflow-hidden shadow-2xl relative group">
                <video 
                  src={landingMedia['video_demo'] || "/videos/video_demo.mp4"} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors flex items-center justify-center pointer-events-none">
                   <div className="w-24 h-24 rounded-full bg-text-primary/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 shadow-[0_0_50px_rgba(255,184,0,0.3)] transition-all">
                      <Play size={36} className="text-[#FFB800] fill-[#FFB800] ml-2" />
                   </div>
                </div>
                <div className="absolute bottom-6 bg-surface/80 backdrop-blur-md px-6 py-3 rounded-full border border-border-subtle mx-auto left-1/2 -translate-x-1/2 font-medium">Demonstração Interativa - Gerando em 12s...</div>
             </div>
          </Reveal>
        </div>
      </section>

      {/* 🎙️ AUDIO — NARRAÇÃO + MÚSICA */}
      <section id="audio" className="py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <Reveal className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-500 text-xs font-black uppercase tracking-widest mb-6">
              <Wand2 size={14} /> Música IA
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-4">
              Música & <span className="text-[#FFB800]">Instrumentais.</span>
            </h2>
            <p className="text-xl text-text-secondary font-light max-w-2xl mx-auto">
              Gera trilhas sonoras e instrumentais exclusivos para os teus anúncios. A Conversio.AI integra Suno AI para criar emoção sonora única.
            </p>
          </Reveal>

          <div className="flex justify-center max-w-3xl mx-auto">
            {/* CARD — MÚSICA SUNO */}
            <Scroll3DSection>
              <div className="relative h-full bg-surface/60 backdrop-blur-xl border border-purple-500/20 rounded-[2.5rem] p-10 overflow-hidden group hover:border-purple-500/50 transition-all duration-500 shadow-[0_0_40px_rgba(168,85,247,0.05)] hover:shadow-[0_0_60px_rgba(168,85,247,0.12)]">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl group-hover:bg-purple-500/15 transition-colors pointer-events-none" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] shrink-0 group-hover:scale-110 transition-transform">
                      <Wand2 size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-black text-text-primary">Música para Anúncios</h3>
                        <span className="text-[9px] font-black bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Suno AI</span>
                      </div>
                      <p className="text-text-secondary font-light">Trilha sonora original. Impacto imediato.</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-text-secondary leading-relaxed mb-8 text-base">
                    O nosso agente treinado gera músicas originais para os teus anúncios, com géneros, tempo e emoção calibrados para maximizar o impacto comercial. Powered by <span className="text-purple-400 font-bold">Suno AI</span> — a IA musical mais avançada da actualidade.
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {[
                      'Agente treinado para criar trilhas comerciais perfeitas',
                      'Géneros: Afrobeat, Pop, R&B, Trap, Ambient e mais',
                      'Ajuste de BPM, mood e energia por prompt',
                      'Música 100% original — sem royalties ou direitos',
                      'Integração com vídeos gerados na plataforma',
                    ].map(f => (
                      <div key={f} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                        <span className="text-text-secondary">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Powered by badge */}
                  <div className="flex items-center gap-2 bg-bg-base/50 border border-border-subtle rounded-2xl px-4 py-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-black text-purple-500">S</span>
                    </div>
                    <span className="text-xs text-text-secondary font-medium">Powered by <span className="text-purple-400 font-bold">Suno AI</span> — Geração Musical de Nova Geração</span>
                  </div>
                </div>
              </div>
            </Scroll3DSection>
          </div>

          {/* Bottom CTA strip */}
          <Reveal className="mt-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface/40 border border-border-subtle rounded-[2rem] p-8">
              <div>
                <h4 className="text-xl font-black text-text-primary mb-1">Som + Imagem + Vídeo — Tudo numa Plataforma</h4>
                <p className="text-text-secondary text-sm">A única plataforma angolana que combina geração visual e sonora profissional.</p>
              </div>
              <button onClick={onEnter} className="shrink-0 flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FFB800] to-yellow-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,184,0,0.3)]">
                <Sparkles size={16} /> Criar Agora
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 💰 9. PACOTES DE CRÉDITO */}
      <section id="precos" className="py-32 relative">
        <GlowOverlay className="top-0 right-0 w-[500px] h-[500px] bg-[#FFB800]/5" />
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter mb-4">Escolha o seu Pacote de Créditos</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Adquira créditos avulsos para gerar imagens, vídeos e dublagens. Sem assinaturas, sem validade.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6 w-full max-w-[100rem] mx-auto items-stretch px-2 xl:px-4">
            {creditPackages.length > 0 ? (
              creditPackages.map((pkg, i) => {
                const isPopular = i === 1;
                const bonusCredits = Number(pkg.bonus_credits || 0);
                const estImages = pkg.est_images || Math.floor(pkg.total_credits / 15);
                const estVideos = pkg.est_videos || Math.floor(pkg.total_credits / 60);

                return (
                  <Scroll3DSection key={pkg.id}>
                    <div className={`
                      backdrop-blur-xl border p-6 xl:p-8 rounded-[2rem] xl:rounded-[2.5rem] relative flex flex-col h-full overflow-hidden transition-all duration-500 bg-[#0A0A0A] border-white/5 hover:border-[#FFB800]/50 group 
                      ${isPopular ? 'border-[#FFB800] shadow-[0_0_40px_rgba(255,184,0,0.15)] scale-[1.02] z-10' : 'shadow-2xl hover:-translate-y-2'}
                    `}>
                      {isPopular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#FFB800] text-black text-[10px] font-black px-6 py-1.5 rounded-b-xl uppercase tracking-widest shadow-xl flex items-center gap-2 z-10">
                          <Sparkles size={14} /> DESTAQUE
                        </div>
                      )}
                      
                      <div className="mb-6 mt-4">
                        <h3 className="text-2xl xl:text-3xl font-black text-white mb-2 flex flex-col xl:flex-row xl:flex-wrap items-start xl:items-center gap-2 xl:gap-3 leading-tight">
                          {pkg.name}
                          {bonusCredits > 0 && <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] xl:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">+{bonusCredits} BÓNUS</span>}
                        </h3>
                        <p className="text-text-tertiary text-xs font-medium">Pacote avulso. Sem validade.</p>
                      </div>

                      <div className="mb-8 p-5 bg-white/5 rounded-[1.5rem] border border-white/10 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl xl:text-5xl font-black text-white tracking-tighter">
                            {Number(pkg.price).toLocaleString()} <span className="text-xl ml-1 text-text-tertiary font-bold tracking-normal">Kz</span>
                          </span>
                        </div>
                        <div className="text-[9px] text-[#FFB800] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                          <CreditCard size={12} strokeWidth={2.5} /> PAGAMENTO ÚNICO
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFB800]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      </div>

                      <div className="mb-10">
                        <h4 className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-3">VOLUME ESTIMADO</h4>
                        <ul className="space-y-4">
                          <li className="flex items-center gap-4 text-sm">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20"><ImageIcon size={16}/></div>
                            <span className="text-text-secondary">Até <span className="font-extrabold text-white">{estImages}</span> Imagens HD</span>
                          </li>
                          <li className="flex items-center gap-4 text-sm">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20"><Video size={16}/></div>
                            <span className="text-text-secondary">Até <span className="font-extrabold text-white">{estVideos}</span> Vídeos 8s</span>
                          </li>
                          <li className="flex items-center gap-4 text-sm">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20"><Mic size={16}/></div>
                            <span className="text-text-secondary font-bold text-white">Centenas de Dublagens</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mb-10 flex-grow">
                        <h4 className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-3">BENEFÍCIOS</h4>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-3 text-sm">
                            <Check size={18} className="text-[#FFB800] mt-0.5 shrink-0" strokeWidth={3} />
                            <span className="text-white font-bold">{pkg.total_credits} Créditos na totalidade</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm">
                            <Check size={18} className="text-[#FFB800] mt-0.5 shrink-0" strokeWidth={3} />
                            <span className="text-white font-bold">Acesso a todos os Motores AI</span>
                          </li>
                        </ul>
                      </div>

                      <button 
                        onClick={onEnter}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all text-sm flex items-center justify-center gap-3 mt-auto ${isPopular ? 'bg-gradient-to-r from-[#FFB800] to-yellow-500 text-black hover:scale-[1.02] shadow-[0_15px_40px_rgba(255,184,0,0.3)]' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black group-hover:border-[#FFB800]'}`}
                      >
                        <Zap size={18} className={!isPopular ? "text-[#FFB800] group-hover:text-black" : ""} fill={!isPopular ? "currentColor" : "none"} /> ADQUIRIR PACOTE
                      </button>
                    </div>
                  </Scroll3DSection>
                );
              })
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 h-[600px] rounded-[2.5rem] animate-pulse"></div>
              ))
            )}
          </div>

          <div className="mt-16 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6 shadow-xl">
             <div className="flex items-center gap-4 mx-auto md:mx-0">
                <div className="w-12 h-12 rounded-full bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] shrink-0"><ShieldCheck size={24} /></div>
                <div className="text-left">
                   <h4 className="font-black text-white text-sm uppercase tracking-wider mb-1">Pagamento 100% Seguro</h4>
                   <p className="text-xs text-text-secondary leading-relaxed">Referência Multicaixa ou IBAN. Ativação manual via upload de comprovativo.</p>
                </div>
             </div>
             <img src="/multicaixa.png" className="h-8 object-contain opacity-80 mx-auto md:mx-0" alt="Multicaixa" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
        </div>
      </section>

      {/* ❓ 10. FAQ (Remove objeções) */}
      <section className="py-32 bg-surface/30 border-y border-border-subtle">
        <div className="container mx-auto px-6 max-w-4xl">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-black text-text-primary tracking-tighter mb-4">Perguntas <span className="text-[#FFB800]">Frequentes</span></h2>
          </Reveal>
          <div className="space-y-4">
            <Reveal delay={0.1}><FAQItem question="Preciso de experiência?" answer="Não! A nossa interface foi desenhada no modelo Dashboard minimalista. Tudo o que precisa é carregar a imagem e clicar num botão." /></Reveal>
            <Reveal delay={0.2}><FAQItem question="Funciona para anúncios pagos?" answer="Perfeitamente. O modelo de Vídeo e Banner da IA é exatamente formatado e otimizado para não sofrer penalização nos algoritmos de conversão do Meta Ads, TikTok Ads ou Google." /></Reveal>
            <Reveal delay={0.3}><FAQItem question="Quanto tempo demora?" answer="As suas gerações de anúncios completos ficam prontas em aproximadamente 10 a 20 segundos dependendo de o servidor estar saturado." /></Reveal>
            <Reveal delay={0.4}><FAQItem question="Precisa de designer?" answer="Absolutamente não. A Conversio assume exatamente a figura do Diretor Criativo e de Arte das suas campanhas em tempo real!" /></Reveal>
          </div>
        </div>
      </section>

      {/* 📞 11. CTA FINAL (Fechamento Urgente) */}
      <section className="py-40 relative overflow-hidden bg-surface/50 border-b border-border-subtle backdrop-blur-xl shrink-0">
        <GlowOverlay className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFB800]/5" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <Scroll3DSection>
            <div className="max-w-4xl mx-auto bg-bg-base/80 backdrop-blur-2xl border border-border-subtle rounded-[4rem] p-16 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-10 animate-spin" style={{ animationDuration: '8s' }}></div>
              <div className="relative z-10">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-text-primary mb-8 leading-[1.1]">
                  Comece a criar <br/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFB800] to-yellow-300">anúncios agora.</span>
                </h2>
                <div className="flex justify-center mt-10">
                  <button onClick={onEnter} className="bg-text-primary text-bg-base px-12 py-6 rounded-full text-xl font-black uppercase tracking-wide hover:scale-105 shadow-glow transition-all duration-300 flex items-center justify-center gap-3">
                    Aceder à Plataforma <ArrowRight size={24} />
                  </button>
                </div>
              </div>
            </div>
          </Scroll3DSection>
        </div>
      </section>

      {/* 🦶 12. FOOTER COMPLETO */}
      <SharedFooter />
      <PWAInstallBanner />
      </>
    </div>
  );
}

const LockIcon = ({size=14, className=""}: {size?:number, className?:string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);


