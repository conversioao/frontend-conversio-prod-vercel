import React, { useEffect, useState } from 'react';
import { Eye, Trash2, Ban, ShieldAlert, Filter, Video, Image as ImageIcon, RefreshCw, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export function AdminModeration() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'video' | 'image'>('all');
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const fetchGenerations = async () => {
    try {
      setLoading(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/moderation?adminId=${adminId}&page=${page}`);
      const data = await res.json();
      if (data.success) {
        setGenerations(prev => page === 1 ? data.generations : [...prev, ...data.generations]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, [page]);

  const handleDelete = async (id: string) => {
    setModal({
      isOpen: true,
      title: 'Eliminar Geração',
      message: 'Tem certeza que deseja eliminar esta geração permanentemente? Esta ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
          const res = await apiFetch(`/generations/${id}?userId=admin&adminId=${adminId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            setGenerations(prev => prev.filter(g => g.id !== id));
            setModal(prev => ({ ...prev, isOpen: false }));
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const filteredGens = generations.filter(g => {
    if (filter === 'all') return true;
    return g.type === filter;
  });

  if (loading && page === 1) return <div className="p-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-widest text-sm">Escaneando Conteúdo Global...</div>;

  return (
    <>
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
             <ShieldAlert size={32} className="text-red-500" /> Moderação de Conteúdo
          </h1>
          <p className="text-text-secondary text-sm font-medium">Galeria global de monitorização e proteção da plataforma.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-surface p-1.5 rounded-2xl border border-border-subtle shadow-sm">
           <button 
             onClick={() => setFilter('all')}
             className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-primary'}`}
           >Todos</button>
           <button 
             onClick={() => setFilter('video')}
             className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'video' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-text-tertiary hover:text-text-primary'}`}
           ><Video size={14} className="inline mr-1" /> Vídeo</button>
           <button 
             onClick={() => setFilter('image')}
             className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'image' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-text-tertiary hover:text-text-primary'}`}
           ><ImageIcon size={14} className="inline mr-1" /> Imagem</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {filteredGens.map((gen, index) => (
           <motion.div 
             key={gen.id}
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: (index % 10) * 0.05 }}
             className="bg-surface border border-border-subtle rounded-3xl overflow-hidden group shadow-sm flex flex-col"
           >
              <div className="aspect-square bg-bg-base relative overflow-hidden">
                 {gen.result_url ? (
                   gen.type === 'video' ? (
                     <video src={gen.result_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" muted onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                   ) : (
                     <img src={gen.result_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={gen.prompt} />
                   )
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <ShieldAlert size={40} className="animate-pulse opacity-20" />
                   </div>
                 )}
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleDelete(gen.id)}
                         className="flex-1 py-3 bg-red-500 text-black rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-red-600 transition-colors"
                       >
                          <Trash2 size={14} /> Eliminar
                       </button>
                       <button className="flex-1 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-white/20 transition-colors">
                          <Ban size={14} /> Banir
                       </button>
                    </div>
                 </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${gen.type === 'video' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                       {gen.type}
                    </span>
                    <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                       <Calendar size={10} /> {new Date(gen.created_at).toLocaleDateString()}
                    </p>
                 </div>
                 <p className="text-xs text-text-secondary font-medium line-clamp-2 leading-relaxed h-8 italic">"{gen.prompt || 'Sem descrição'}"</p>
                 <div className="mt-auto pt-4 border-t border-border-subtle flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-bg-base border border-border-subtle text-[8px] flex items-center justify-center font-black">
                       {gen.user_name?.substring(0,2).toUpperCase()}
                    </div>
                    <p className="text-[10px] font-bold text-text-primary truncate">{gen.user_name}</p>
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      {generations.length > 0 && (
         <div className="flex justify-center pt-8">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="px-12 py-5 bg-surface border border-border-subtle rounded-3xl text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/50 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-3"
            >
               {loading ? <RefreshCw size={18} className="animate-spin" /> : <Eye size={18} />}
               Ver Carregar Mais
            </button>
         </div>
      )}
    </div>

    <ConfirmationModal 
      isOpen={modal.isOpen}
      title={modal.title}
      message={modal.message}
      type={modal.type}
      onConfirm={() => {
        if (modal.onConfirm) modal.onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      }}
      onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  );
}
