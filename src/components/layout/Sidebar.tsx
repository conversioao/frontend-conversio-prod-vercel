import React from 'react';
import { Home, Image as ImageIcon, Video, Mic, Compass, Folder, CreditCard, Settings, AlertCircle, X, LogOut, ShieldAlert, ShieldCheck, LayoutDashboard, Headphones, Bot, PenTool, Film, Sparkles, Music, ChevronRight } from 'lucide-react';
import { getUserPlan, PLANS } from '../../utils/planUtils';

interface SidebarProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  user?: any;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  isGeneratingAudio?: boolean;
}

export function Sidebar({ activePage = 'home', onNavigate, onLogout, isOpen = false, onClose, user, isGeneratingImage, isGeneratingVideo, isGeneratingAudio }: SidebarProps) {
  const plan = getUserPlan(user);
  const planConfig = PLANS[plan];

  const navItems = [
    { id: 'home', icon: Home, label: 'Início', visible: true },
    { id: 'generate-image', icon: ImageIcon, label: 'Gerar Imagem', visible: true, generating: isGeneratingImage },
    { id: 'editor', icon: PenTool, label: 'Editor Pro', visible: planConfig.hasEditor },
    { id: 'generate-video', icon: Video, label: 'Gerar Vídeo', visible: planConfig.hasMediaGen, generating: isGeneratingVideo },
    { id: 'generate-audio', icon: Music, label: 'Gerar Música', visible: planConfig.hasMediaGen, generating: isGeneratingAudio },
    { id: 'audio-gallery', icon: Headphones, label: 'Biblioteca Áudio', visible: planConfig.hasMediaGen },
    { id: 'projects', icon: Folder, label: 'Projetos', visible: true },
    { id: 'billing', icon: CreditCard, label: 'Créditos', visible: true },
  ].filter(item => item.visible);

  // Bottom nav items (most important 4 for mobile bottom bar)
  const bottomNavItems = [
    { id: 'home', icon: Home, label: 'Início', visible: true },
    { id: 'generate-image', icon: ImageIcon, label: 'Imagem', visible: true, generating: isGeneratingImage },
    { id: 'generate-video', icon: Video, label: 'Vídeo', visible: true, generating: isGeneratingVideo },
    { id: 'billing', icon: CreditCard, label: 'Créditos', visible: true },
  ];

  return (
    <>
      {/* ─── MOBILE: Bottom Sheet Menu (slide-up drawer) ──────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] md:hidden"
            onClick={onClose}
          />
          {/* Slide-up drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="relative bg-[#0A0A0A] border-t border-white/10 rounded-t-[2rem] overflow-hidden shadow-2xl">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* User info header */}
              {user && (
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=FFB800&color=000`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.name || 'Utilizador'}</p>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-black">{plan} Plan</p>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20">
                    <span className="text-[11px] font-black text-[#FFB800]">{user.credits || 0}</span>
                    <span className="text-[9px] text-[#FFB800]/60 font-bold">CR</span>
                  </div>
                </div>
              )}

              {/* Nav Items Grid */}
              <div className="px-4 pt-3 pb-2">
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    const isGenerating = (item as any).generating;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onNavigate?.(item.id); onClose?.(); }}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 text-left relative overflow-hidden ${
                          isActive
                            ? 'bg-[#FFB800] text-black shadow-lg'
                            : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] active:scale-[0.97]'
                        }`}
                      >
                        {isGenerating && (
                          <div className="absolute inset-0 rounded-2xl border border-dashed border-[#FFB800]/60 animate-[spin_6s_linear_infinite]" />
                        )}
                        <div className="relative">
                          <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                          {isGenerating && !isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" />
                          )}
                        </div>
                        <span className={`text-[13px] font-semibold ${isActive ? 'text-black' : ''}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 mt-1">
                <button
                  onClick={() => { onNavigate?.('settings'); onClose?.(); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activePage === 'settings' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'text-text-secondary hover:text-white'}`}
                >
                  <Settings size={16} strokeWidth={1.5} />
                  Configurações
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => { onNavigate?.('admin-dashboard'); onClose?.(); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activePage?.startsWith('admin') ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'text-[#FFB800]/70 hover:text-[#FFB800]'}`}
                  >
                    <LayoutDashboard size={16} strokeWidth={2} />
                    Admin
                  </button>
                )}
                <button
                  onClick={() => { onLogout?.(); onClose?.(); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 transition-all"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  Sair
                </button>
              </div>

              {/* Safe area spacer for home indicator */}
              <div className="h-safe-bottom pb-2" />
            </div>
          </div>
        </>
      )}

      {/* ─── DESKTOP: Side capsule (unchanged) ────────────────────────── */}
      <div className={`hidden md:flex fixed left-3 lg:left-4 top-1/2 -translate-y-1/2 z-[100]`}>
        <div className="relative rounded-full p-[1px] overflow-hidden shadow-float group">
          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
          <aside className="relative bg-surface/95 backdrop-blur-xl rounded-[calc(9999px-1px)] py-3 px-1.5 flex flex-col items-center gap-5 border border-border-subtle">
            <div className="flex flex-col gap-3 items-center">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                const isGenerating = (item as any).generating;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className={`p-2 flex items-center justify-center rounded-full transition-colors relative ${
                      isActive ? 'bg-accent text-accent-fg shadow-glow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                    title={item.label}
                  >
                    <div className="relative">
                      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                      {isGenerating && (
                        <div className="absolute -inset-1.5 rounded-full border border-dashed border-[#FFB800] animate-[spin_3s_linear_infinite]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="w-6 h-[1px] bg-border-subtle" />

            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={() => onNavigate?.('settings')}
                className={`p-2 flex items-center justify-center rounded-full transition-colors ${activePage === 'settings' ? 'bg-accent text-accent-fg shadow-glow' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                title="Configurações"
              >
                <Settings size={20} strokeWidth={activePage === 'settings' ? 2 : 1.5} />
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => onNavigate?.('admin-dashboard')}
                  className={`p-2 flex items-center justify-center rounded-full transition-colors ${activePage?.startsWith('admin') ? 'bg-accent text-accent-fg shadow-glow' : 'text-[#FFB800] hover:bg-[#FFB800]/10'}`}
                  title="Painel Admin"
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-2 flex items-center justify-center rounded-full transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10"
                title="Sair"
              >
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
