import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Layers, Play } from 'lucide-react';

interface SharedHeaderProps {
  onEnter: () => void;
  onNavigateHome?: () => void;
  onNavigatePage?: (page: string) => void;
  isLoggedIn?: boolean;
}

export function SharedHeader({ onEnter, onNavigateHome, onNavigatePage, isLoggedIn }: SharedHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogoClick = () => {
    if (isLoggedIn) {
      window.location.href = '/';
    } else if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header 
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-bg-base/60 backdrop-blur-xl border-b border-border-subtle py-3 shadow-lg' : 'bg-transparent py-6'}`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={handleLogoClick}
        >
          <img src="/logo.png" alt="Conversio.AI" className="h-10 md:h-13 w-auto object-contain" />
        </div>

        <ul className="hidden md:flex items-center justify-center flex-1 gap-8 lg:gap-12 text-[13px] font-bold uppercase tracking-widest text-text-secondary">
          {[
            { label: 'Benefícios', id: 'beneficios' },
            { label: 'Testemunhos', id: 'testemunhos' },
            { label: 'Preços', id: 'precos' }
          ].map((item) => (
            <li key={item.id} className="hover:text-text-primary transition-colors hover:text-[#FFB800] relative group py-2 flex flex-col">
              <a 
                href={`#${item.id}`} 
                onClick={(e) => handleAnchorClick(e, item.id)}
                className="cursor-pointer"
              >
                {item.label}
              </a>
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-center pointer-events-none duration-300"></span>
            </li>
          ))}
          <li className="relative group py-2 flex flex-col">
            <button
              onClick={() => onNavigatePage && onNavigatePage('image-cores-info')}
              className="hover:text-[#FFB800] transition-colors flex items-center gap-1.5"
            >
              <Layers size={13} className="text-[#FFB800]" />
              Cores de Imagem
            </button>
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-center pointer-events-none duration-300"></span>
          </li>
          <li className="relative group py-2 flex flex-col">
            <button
              onClick={() => onNavigatePage && onNavigatePage('video-cores-info')}
              className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <Play size={13} className="text-blue-400" fill="currentColor" />
              Cores de Vídeo
            </button>
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-center pointer-events-none duration-300"></span>
          </li>
        </ul>

        <div className="flex items-center gap-6">
          <button 
            onClick={onEnter} 
            className="text-sm font-semibold text-text-secondary hover:text-accent hover:bg-accent/10 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            Entrar
          </button>
          <button 
            onClick={onEnter} 
            className="relative group bg-text-primary text-bg-base px-7 py-2.5 rounded-full text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-glow flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFB800] to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2 group-hover:text-black transition-colors">
              Começar grátis <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
