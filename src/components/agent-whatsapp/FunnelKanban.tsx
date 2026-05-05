import React from 'react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {COLUMNS.map((column) => {
        const columnContacts = contacts.filter((c) => c.status === column.id);
        
        return (
          <div 
            key={column.id} 
            className="flex flex-col gap-4 min-h-[400px]"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
          >
            <div className={`p-4 rounded-2xl border ${column.color} flex items-center justify-between`}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{column.label}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold">{columnContacts.length}</span>
            </div>
            
            <div className="flex flex-col gap-4 flex-1 p-2 rounded-2xl bg-black/20 border border-dashed border-white/[0.03]">
              {columnContacts.map((contact) => (
                <LeadCard 
                  key={contact.id} 
                  contact={contact} 
                  onView={() => onView(contact)}
                />
              ))}
              
              {columnContacts.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white/5 uppercase tracking-widest text-center px-4">
                    Sem leads nesta fase
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
