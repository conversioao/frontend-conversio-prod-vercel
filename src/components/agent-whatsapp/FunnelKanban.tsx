import React from 'react';
import { Bot } from 'lucide-react';
import { LeadCard } from './LeadCard';

interface FunnelKanbanProps {
  contacts: any[];
  onMove: (id: number, status: string) => void;
  onView: (contact: any) => void;
}

const COLUMNS = [
  { id: 'cold', label: 'Frio', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'warm', label: 'Morno', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { id: 'hot', label: 'Quente', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { id: 'negotiation', label: 'Em Negociação', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'closed', label: 'Fechado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
];

export function FunnelKanban({ contacts, onMove, onView }: FunnelKanbanProps) {
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: string) => {
    const id = parseInt(e.dataTransfer.getData('contactId'));
    onMove(id, status);
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {COLUMNS.map((column) => {
        const columnContacts = contacts.filter((c) => c.status === column.id);
        
        return (
          <div 
            key={column.id} 
            className="flex flex-col gap-3 min-h-[400px]"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
          >
            <div className={`px-3 py-2 rounded-lg border ${column.color} flex items-center justify-between`}>
              <span className="text-[9px] font-bold uppercase tracking-wider">{column.label}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold">{columnContacts.length}</span>
            </div>
            
            <div className="flex flex-col gap-3 flex-1 p-2 rounded-xl bg-zinc-900/30 border border-zinc-800 shadow-sm transition-colors hover:bg-zinc-900/50">
              {columnContacts.map((contact) => (
                <LeadCard 
                  key={contact.id} 
                  contact={contact} 
                  onView={() => onView(contact)}
                />
              ))}
              
              {columnContacts.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-10">
                  <span className="text-[8px] font-bold text-white uppercase tracking-widest text-center px-4 italic">
                    Empty
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
