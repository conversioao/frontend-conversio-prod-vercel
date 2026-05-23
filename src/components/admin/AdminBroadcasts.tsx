import React, { useEffect, useState } from 'react';
import { Megaphone, Send, History, AlertTriangle, CheckCircle, Info, RefreshCw, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/broadcasts?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setBroadcasts(data.broadcasts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    try {
      setSending(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, message, type })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('');
        fetchBroadcasts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-widest text-sm">Carregando Estúdio de Broadcast...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Estúdio de Broadcast</h1>
          <p className="text-text-secondary text-sm font-medium">Envia mensagens globais para todos os usuários da plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Editor Section */}
         <div className="lg:col-span-1 bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm h-fit">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-wider mb-8 flex items-center gap-2">
               <Send size={20} className="text-[#FFB800]" /> Nova Mensagem
            </h3>
            <form onSubmit={handleSend} className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Mensagem do Comunicado</label>
                  <textarea 
                    className="w-full bg-bg-base border border-border-subtle rounded-2xl p-4 text-sm text-text-primary h-32 focus:outline-none focus:border-[#FFB800]/50 transition-all resize-none"
                    placeholder="Ex: Teremos manutenção preventiva às 23:00..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
               </div>
               
               <div>
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Tipo de Alerta</label>
                  <div className="grid grid-cols-3 gap-3">
                     {[
                       { id: 'info', icon: <Info size={14} />, color: 'blue' },
                       { id: 'warning', icon: <AlertTriangle size={14} />, color: 'yellow' },
                       { id: 'success', icon: <CheckCircle size={14} />, color: 'emerald' }
                     ].map((t) => (
                        <button 
                          key={t.id}
                          type="button"
                          onClick={() => setType(t.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${type === t.id ? `bg-${t.color}-500/10 border-${t.color}-500/30 text-${t.color}-500` : 'bg-bg-base border-border-subtle text-text-tertiary hover:border-text-secondary'}`}
                        >
                           {t.icon}
                           <span className="text-[8px] font-black uppercase">{t.id}</span>
                        </button>
                     ))}
                  </div>
               </div>

               <button 
                 type="submit"
                 disabled={sending || !message}
                 className="w-full py-5 bg-[#FFB800] text-black font-black text-sm uppercase tracking-widest rounded-3xl shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {sending ? <RefreshCw size={18} className="animate-spin" /> : <Megaphone size={18} />}
                  Disparar Aviso
               </button>
            </form>
         </div>

         {/* History Section */}
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-wider flex items-center gap-2 ml-4">
               <History size={20} className="text-text-tertiary" /> Histórico de Comunicados
            </h3>
            
            <div className="space-y-4">
               {broadcasts.length === 0 ? (
                 <div className="p-12 text-center bg-surface border border-dashed border-border-subtle rounded-[2.5rem] text-text-tertiary italic text-sm">Nenhum comunicado enviado recentemente.</div>
               ) : (
                 broadcasts.map((b) => (
                   <motion.div 
                     key={b.id} 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="bg-surface border border-border-subtle p-6 rounded-[2rem] shadow-sm relative overflow-hidden group"
                   >
                      <div className={`absolute top-0 left-0 w-2 h-full ${b.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-text-tertiary'} opacity-50`}></div>
                      <div className="flex items-start justify-between gap-6">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                               <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${b.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' : b.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                  {b.type}
                               </span>
                               <span className="text-[10px] text-text-tertiary font-bold">{new Date(b.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary leading-relaxed">{b.message}</p>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${b.is_active ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' : 'border-border-subtle text-text-tertiary bg-bg-base'}`}>
                               {b.is_active ? 'Ativo' : 'Expansivo'}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
