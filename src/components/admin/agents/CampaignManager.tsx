import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Search, Calendar, Users, Send, CheckCircle, BarChart3, Clock, X, Trash2, Filter, Pause, RefreshCw, Zap } from 'lucide-react';
import { api } from '../../../lib/api';

interface CampaignManagerProps {
    campaigns: any[];
    onRefresh?: () => void;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ campaigns, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        message_template: '',
        target_segment: 'all'
    });

    const statusIcons: any = {
        active: <Send className="text-emerald-400" size={14} />,
        paused: <Pause className="text-amber-400" size={14} />,
        completed: <CheckCircle className="text-blue-400" size={14} />,
        draft: <Clock className="text-slate-500" size={14} />
    };

    const handleCreate = async () => {
        if (!newCampaign.name || !newCampaign.message_template) return;
        setSaving(true);
        try {
            const res = await api.post('/admin/crm/campaigns', newCampaign);
            if (res.ok) {
                setIsCreateOpen(false);
                setNewCampaign({ name: '', message_template: '', target_segment: 'all' });
                if (onRefresh) onRefresh();
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface/40 backdrop-blur-xl border border-border-subtle rounded-[3rem] overflow-hidden shadow-2xl">
            {/* Table Header */}
            <div className="p-10 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface/20">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2.5xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] border border-[#FFB800]/20 shadow-xl shadow-[#FFB800]/5">
                        <Megaphone size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">Motor de Campanhas</h3>
                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1 italic">Gestão centralizada de disparos em massa.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group min-w-[280px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-[#FFB800] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Localizar campanha..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-bg-base/40 border border-border-subtle rounded-2xl pl-12 pr-5 py-3.5 text-xs font-bold text-text-primary outline-none focus:border-[#FFB800] shadow-inner"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-[#FFB800] text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-[#FFB800]/20"
                    >
                        <Plus size={18} strokeWidth={3} /> Nova Campanha
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-base/20 text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] border-b border-border-subtle">
                            <th className="px-10 py-6">Campanha</th>
                            <th className="px-10 py-6">Segmentação</th>
                            <th className="px-10 py-6">Performance</th>
                            <th className="px-10 py-6">Status</th>
                            <th className="px-10 py-6 text-right">Acções</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/30">
                        {campaigns.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-10 py-24 text-center">
                                     <div className="opacity-20 flex flex-col items-center gap-4">
                                          <Megaphone size={48} />
                                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhuma campanha activa no radar</p>
                                     </div>
                                </td>
                            </tr>
                        ) : (
                            campaigns.map((camp) => (
                                <tr key={camp.id} className="group hover:bg-[#FFB800]/5 transition-all">
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-black text-text-primary uppercase tracking-tight group-hover:text-[#FFB800] transition-colors">{camp.name}</span>
                                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">{new Date(camp.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border-subtle w-fit text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                            <Users size={12} className="text-[#FFB800]" /> {camp.target_segment || 'Todos'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden min-w-[80px] border border-border-subtle">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-[#FFB800] to-emerald-500 rounded-full shadow-[0_0_8px_#FFB80044]" 
                                                    style={{ width: `${(camp.sent_count > 0 ? (camp.sent_count / 100) * 100 : 0)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-black text-text-primary">
                                                {camp.sent_count || 0} Sent
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-bg-base rounded-lg border border-border-subtle">
                                                 {statusIcons[camp.status] || statusIcons.draft}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{camp.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex justify-end gap-3">
                                            <button className="p-3 bg-surface border border-border-subtle rounded-xl text-text-tertiary hover:text-[#FFB800] hover:border-[#FFB800]/30 transition-all shadow-sm">
                                                <BarChart3 size={16} />
                                            </button>
                                            <button className="p-3 bg-surface border border-border-subtle rounded-xl text-text-tertiary hover:text-red-500 hover:border-red-500/30 transition-all shadow-sm">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Premium Overlay Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-bg-dark border border-border-subtle w-full max-w-2xl rounded-[3.5rem] overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-12 border-b border-border-subtle flex items-center justify-between bg-surface/30">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-[#FFB800] text-black rounded-2xl flex items-center justify-center shadow-2xl shadow-[#FFB800]/20"><Plus strokeWidth={3} /></div>
                                     <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Nova Campanha Estratégica</h3>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-text-tertiary hover:text-white transition-all"><X /></button>
                            </div>
                            
                            <div className="p-12 space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest px-1">Identificador Público</label>
                                    <input 
                                        type="text" 
                                        value={newCampaign.name}
                                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                                        className="w-full bg-bg-base/50 border border-border-subtle rounded-2.5xl px-6 py-4 text-sm font-bold text-text-primary outline-none focus:border-[#FFB800] transition-all shadow-inner"
                                        placeholder="EX: Lançamento Alpha Fevereiro"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest px-1">Segmentação de Usuários</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                         {['all', 'VIP', 'Qualified', 'Prospect', 'inactive'].map(seg => (
                                              <button 
                                                   key={seg}
                                                   type="button"
                                                   onClick={() => setNewCampaign({...newCampaign, target_segment: seg})}
                                                   className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newCampaign.target_segment === seg ? 'bg-[#FFB800] text-black border-[#FFB800] shadow-xl shadow-[#FFB800]/20' : 'bg-surface text-text-tertiary border-border-subtle hover:border-[#FFB800]/30'}`}
                                              >
                                                   {seg}
                                              </button>
                                         ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between px-1">
                                         <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Copywriting da Campanha</label>
                                         <span className="text-[10px] font-black text-[#FFB800] uppercase flex items-center gap-2 cursor-pointer hover:underline"><Zap size={14} /> Sugestão IA</span>
                                    </div>
                                    <textarea 
                                        rows={6}
                                        value={newCampaign.message_template}
                                        onChange={(e) => setNewCampaign({...newCampaign, message_template: e.target.value})}
                                        className="w-full bg-bg-base/50 border border-border-subtle rounded-2.5xl px-6 py-5 text-sm font-medium text-text-primary outline-none focus:border-[#FFB800] transition-all resize-none shadow-inner leading-relaxed"
                                        placeholder="Dica: Use {name} para personalização hyper-humanizada."
                                    ></textarea>
                                </div>

                                <button 
                                    onClick={handleCreate}
                                    disabled={saving || !newCampaign.name || !newCampaign.message_template}
                                    className="w-full py-6 bg-[#FFB800] text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.25em] shadow-2xl shadow-[#FFB800]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4"
                                >
                                    {saving ? <RefreshCw className="animate-spin" size={18} /> : <><Send size={18} /> Comandar Disparo Agora</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

