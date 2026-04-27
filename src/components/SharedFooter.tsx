import React from 'react';
import { Twitter, Instagram, Linkedin } from 'lucide-react';

export function SharedFooter() {
  return (
    <footer className="pt-24 pb-12 bg-bg-base relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFB800]/30 to-transparent"></div>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="col-span-1 md:col-span-4">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/logo.png" alt="Conversio.AI" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-text-secondary text-sm leading-relaxed mb-8 pr-10">
              A tecnologia definitiva em IA generativa para Performance Marketing. Elevamos marcas através da criação de conteúdo autêntico, escalável e de altíssima conversão.
            </p>
            <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors hover:shadow-glow"><Twitter size={18}/></a>
                <a href="#" className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors hover:shadow-glow"><Instagram size={18}/></a>
                <a href="#" className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors hover:shadow-glow"><Linkedin size={18}/></a>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-text-primary font-bold mb-6 tracking-wider uppercase text-xs">Páginas</h4>
            <ul className="space-y-4 text-text-secondary text-sm">
              <li><a href="#" className="hover:text-[#FFB800] transition-colors">Como Funciona</a></li>
              <li><a href="#" className="hover:text-[#FFB800] transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-[#FFB800] transition-colors">Benefícios</a></li>
              <li><a href="#" className="hover:text-[#FFB800] transition-colors">Testemunhos</a></li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-text-primary font-bold mb-6 tracking-wider uppercase text-xs">Apoio</h4>
            <ul className="space-y-4 text-text-secondary text-sm">
              <li><a href="#" className="hover:text-text-primary transition-colors">Perguntas Frequentes</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Documentação</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Vendas</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-4">
              <h4 className="text-text-primary font-bold mb-6 tracking-wider uppercase text-xs">Receba Estratégias de Anúncios</h4>
              <p className="text-text-secondary text-sm mb-4">Junte-se a +10k media buyers na nossa newsletter criativa.</p>
              <div className="flex gap-2 relative">
                <input type="email" placeholder="O seu melhor email" className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-[#FFB800]/50 transition-colors" />
                <button className="bg-text-primary text-bg-base px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform">Assinar</button>
              </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-tertiary text-sm">© 2026 Conversio.ai Inc. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm text-text-tertiary">
            <a href="#" className="hover:text-text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
