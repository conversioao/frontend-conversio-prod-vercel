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
      className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all cursor-pointer group active:scale-95 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden group-hover:border-amber-500/30 transition-colors">
          {contact.profile_pic_url ? (
            <img src={contact.profile_pic_url} className="w-full h-full object-cover" />
          ) : (
            <Users className="text-zinc-600" size={14} />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-[13px] font-bold text-white group-hover:text-amber-500 transition-all truncate">
            {contact.display_name || 'Anónimo'}
          </div>
          <div className="text-[9px] font-medium text-zinc-500 flex items-center gap-1 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            +{contact.whatsapp_number}
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={8} className={s <= (contact.score || 1) ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'} />
            ))}
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
            <Clock size={8} />
            {new Date(contact.last_message_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {contact.tags?.slice(0, 1).map((tag: string, i: number) => (
            <span key={i} className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
              {tag}
            </span>
          ))}
          {contact.needs_human && (
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
              Manual
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
