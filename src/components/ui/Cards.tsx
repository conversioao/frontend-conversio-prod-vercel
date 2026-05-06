import React from 'react';
import { Download, Trash2, Maximize2, Check, X, Volume2, Mic } from 'lucide-react';
import { Button } from './Button';

// --- Base Card ---
export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-surface border border-border-subtle rounded-2xl p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

// --- Preview Card (Generated Content) ---
interface PreviewCardProps {
  imageUrl: string;
  title: string;
  type?: 'image' | 'video' | 'voice';
  badge?: string;
  status?: 'processing' | 'completed' | 'failed';
  onDownload?: () => void;
  onDelete?: () => void;
  onExpand?: () => void;
}

export const PreviewCard = React.memo(({ imageUrl, title, type = 'image', badge, status = 'completed', onDownload, onDelete, onExpand }: PreviewCardProps) => {
  if (status === 'processing') {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-border-subtle bg-surface aspect-square flex flex-col items-center justify-center p-6 text-center animate-pulse">
        <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-20"></div>
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#FFB800]/30 border-t-[#FFB800] animate-spin" />
          <p className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest">Processando...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-red-500/30 bg-red-500/5 aspect-square flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
            <X size={20} />
        </div>
        <p className="text-xs font-semibold text-red-500">Falha ao Gerar</p>
        <button onClick={onDelete} className="mt-3 text-[10px] text-red-400 hover:underline uppercase font-bold tracking-wider">Remover</button>
      </div>
    );
  }

  return (
    <div 
      onClick={onExpand}
      className="relative group rounded-2xl overflow-hidden border border-border-subtle bg-bg-base aspect-square hover:shadow-2xl hover:scale-[1.02] hover:border-accent/40 transition-all duration-300 cursor-pointer"
    >
      {type === 'video' ? (
        <video 
          src={imageUrl} 
          className="w-full h-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="none"
        />
      ) : type === 'voice' ? (
        <div className="w-full h-full bg-surface-hover flex flex-col items-center justify-center gap-4 group-hover:bg-accent/5 transition-colors">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent shadow-glow transition-transform group-hover:scale-110">
                <Volume2 size={24} />
            </div>
            <div className="flex gap-1 h-8 items-center">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 bg-accent/40 rounded-full animate-pulse" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>
        </div>
      ) : (
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
      )}
      
      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-2 z-10">
        {badge && (
          <span className="bg-accent/90 backdrop-blur-md text-bg-base text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">
            {badge}
          </span>
        )}
      </div>

      {/* Action Buttons (Top Right) */}
      <div className="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
          className="p-2 bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10 rounded-xl text-white transition-all shadow-xl active:scale-95"
        >
          <Download size={14} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="p-2 bg-red-500/80 backdrop-blur-md hover:bg-red-500 border border-red-500/20 rounded-xl text-white transition-all shadow-xl active:scale-95"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Info Overlay (Bottom) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-[11px] font-medium text-white line-clamp-2 leading-relaxed drop-shadow-md">
          {title}
        </p>
      </div>
    </div>
  );
});

// --- Selectable Card (Models, Styles) ---
interface SelectableCardProps {
  title: string;
  description: string;
  badge?: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const SelectableCard = React.memo(({ title, description, badge, selected, onClick, icon }: SelectableCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={`relative bg-surface border rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:bg-surface-hover ${
        selected ? 'border-accent shadow-[0_0_0_1px_rgba(255,184,0,1)]' : 'border-border-subtle'
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-accent">
          <Check size={16} />
        </div>
      )}
      <div className="flex items-start gap-3">
        {icon && <div className="p-2 bg-bg-base rounded-xl text-text-secondary">{icon}</div>}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-text-primary">{title}</h4>
            {badge && <span className="text-[10px] bg-surface-hover text-text-secondary px-1.5 py-0.5 rounded-md border border-border-subtle">{badge}</span>}
          </div>
          <p className="text-xs text-text-tertiary line-clamp-2">{description}</p>
        </div>
      </div>
    </div>
  );
});

// --- Pricing Card ---
interface PricingCardProps {
  planName: string;
  price: string;
  credits: string;
  features: string[];
  isPopular?: boolean;
  onSelect?: () => void;
}

export const PricingCard = React.memo(({ planName, price, credits, features, isPopular, onSelect }: PricingCardProps) => {
  return (
    <div className={`relative bg-surface border rounded-3xl p-6 flex flex-col h-full ${isPopular ? 'border-accent shadow-glow' : 'border-border-subtle'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg-base text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-text-primary mb-2">{planName}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-text-primary">{price}</span>
          <span className="text-sm text-text-secondary">/mo</span>
        </div>
        <p className="text-sm text-accent mt-2 font-medium">{credits} Credits</p>
      </div>
      
      <div className="flex-1">
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <Button variant={isPopular ? 'primary' : 'secondary'} fullWidth onClick={onSelect}>
        Choose Plan
      </Button>
    </div>
  );
});
