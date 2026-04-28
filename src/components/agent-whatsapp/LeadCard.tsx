import React from 'react';
import { MessageSquare, Star, Clock, Users } from 'lucide-react';

interface LeadCardProps {
  contact: any;
  onView: () => void;
}

export function LeadCard({ contact, onView }: LeadCardProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('contactId', contact.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onClick={onView}
      className="bg-black/40 border border-white/[0.05] p-5 rounded-3xl hover:border-[#FFB800]/30 hover:bg-black/60 transition-all cursor-pointer group active:scale-95 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center overflow-hidden">
          {contact.profile_pic_url ? (
            <img src={contact.profile_pic_url} className="w-full h-full object-cover" />
          ) : (
            <Users className="text-white/20" size={16} />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-[13px] font-black text-white truncate group-hover:text-[#FFB800] transition-all">
            {contact.display_name || 'Desconhecido'}
          </div>
          <div className="text-[10px] font-bold text-white/30">+{contact.whatsapp_number}</div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={10} className={s <= (contact.score || 1) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-white/10'} />
            ))}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-white/20 uppercase tracking-widest">
            <Clock size={10} />
            {new Date(contact.last_message_at).toLocaleDateString()}
          </div>
        </div>

        {/* Tags / Info */}
        <div className="flex flex-wrap gap-1.5">
          {contact.tags?.slice(0, 2).map((tag: string, i: number) => (
            <span key={i} className="bg-white/5 px-2 py-1 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-wider">
              {tag}
            </span>
          ))}
          {contact.needs_human && (
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse">
              Humano
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
