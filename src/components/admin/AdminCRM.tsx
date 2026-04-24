import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Layout, 
  Send, 
  History, 
  MoreVertical, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Zap,
  RefreshCcw,
  X,
  Bell,
  Bot,
  Check
} from 'lucide-react';
import { api } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface Lead {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    whatsapp_verified: boolean;
    credits: number;
    created_at: string;
    crm_stage_id: string;
    last_interaction: string | null;
    category?: string;
    temperature?: string;
}

interface Stage {
    id: string;
    name: string;
    order_index: number;
}

interface AdminCRMProps {
    onClose?: () => void;
}

const AdminCRM: React.FC<AdminCRMProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'pipeline' | 'campaigns' | 'automation' | 'media' | 'logs' | 'feed'>('feed');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<any[]>([]);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('all');

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

    const [campaignModal, setCampaignModal] = useState(false);
    const [automations, setAutomations] = useState<any[]>([]);
    const [loadingAutomations, setLoadingAutomations] = useState(true);

    useEffect(() => {
        fetchStages();
        fetchLeads();
        const interval = setInterval(fetchLeads, 10000); // 10s auto-refresh for real-time Kanban moves
        return () => clearInterval(interval);
    }, []);

    const fetchStages = async () => {
        const res = await api.get('/admin/crm/stages');
        const data = await res.json();
        if (data.success) setStages(data.stages.sort((a: any, b: any) => a.order_index - b.order_index));
    };

    const fetchLeads = async () => {
        try {
            const res = await api.get('/admin/crm/pipeline');
            const data = await res.json();
            if (data.success) setLeads(data.leads);
        } catch (err) {
            console.error('Error fetching leads:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stagesRes, leadsRes] = await Promise.all([
                api.get('/admin/crm/stages'),
                api.get('/admin/crm/pipeline')
            ]);
            
            const stagesData = await stagesRes.json();
            const leadsData = await leadsRes.json();

            if (stagesData.success) setStages(stagesData.stages.sort((a: any, b: any) => a.order_index - b.order_index));
            if (leadsData.success) setLeads(leadsData.leads);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (id: string) => {
        setDraggedLeadId(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (stageId: string) => {
        if (!draggedLeadId) return;
        
        const lead = leads.find(l => l.id === draggedLeadId);
        if (lead && String(lead.crm_stage_id) !== String(stageId)) {
            // Optimistic update
            setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, crm_stage_id: stageId } : l));
            await updateStage(draggedLeadId, stageId);
        }
        setDraggedLeadId(null);
    };

    const updateStage = async (userId: string, stageId: string) => {
        const res = await api.post('/admin/crm/update-stage', { userId, stageId });
        const data = await res.json();
        if (!data.success) {
            fetchData(); // Rollback on error
        }
    };

    const fetchUserDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        const res = await api.get(`/admin/crm/user/${lead.id}`);
        const data = await res.json();
        if (data.success) {
            setInteractions(data.interactions);
        }
    };

    const fetchAutomations = async () => {
        setLoadingAutomations(true);
        try {
            const res = await api.get('/admin/crm/automations');
            const data = await res.json();
            if (data.success) setAutomations(data.automations);
        } finally {
            setLoadingAutomations(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/admin/crm/automations/${id}`);
            setAutomations(prev => prev.filter(a => a.id !== id));
            setModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (activeTab === 'automation') fetchAutomations();
    }, [activeTab]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
            <div className="w-16 h-16 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] animate-pulse italic">Mapeando ecossistema de leads...</p>
        </div>
    );

    return (
        <>
        <div className="fixed inset-0 z-[80] bg-[#050706] text-white flex flex-col font-sans animation-fade-in overflow-hidden">
            
            {/* NASA Top HUD Bar for CRM */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-3xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Users className="text-[#FFB800] animate-pulse" size={32} />
                        <div>
                            <h1 className="text-2xl font-black text-text-primary uppercase tracking-tighter">CRM_ECOSYSTEM_OVERWATCH</h1>
                            <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.3em]">Conversio OS v2.4 // NASA_PROTO_CRM</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-xl border border-white/10 overflow-x-auto max-w-full">
                        {[
                            { id: 'feed', label: 'Radar Operacional' },
                            { id: 'pipeline', label: 'Funil de Vendas' },
                            { id: 'campaigns', label: 'Campanhas' },
                            { id: 'automation', label: 'Automações IA' },
                            { id: 'media', label: 'Gestão de Mídias' },
                            { id: 'logs', label: 'Registos' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' 
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button 
                         onClick={() => setCampaignModal(true)}
                         className="px-6 py-3 bg-[#FFB800] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#FFB800]/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Criar_Campanha
                    </button>
                    <button 
                        onClick={() => onClose ? onClose() : (window.location.hash = '#admin-dashboard')}
                        className="p-3 bg-white/5 hover:bg-white/10 text-text-tertiary rounded-xl transition-all"
                        title="Sair do HUD"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-screen opacity-50" />

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'pipeline' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-6 overflow-x-auto pb-10 custom-scrollbar min-h-[700px] items-start"
                    >
                        {stages.map(stage => (
                            <div 
                                key={stage.id} 
                                className="min-w-[320px] flex flex-col gap-6"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage.id)}
                            >
                                <div className="flex items-center justify-between px-6 bg-surface/40 backdrop-blur-md py-4 rounded-[1.5rem] border border-border-subtle mx-2">
                                    <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full shadow-[0_0_8px_#FFB800]" style={{ backgroundColor: '#FFB800' }}></span>
                                        {stage.name}
                                    </h3>
                                    <span className="bg-[#FFB800]/10 text-[#FFB800] px-3 py-1 rounded-full text-[10px] font-black border border-[#FFB800]/20">
                                        {leads.filter(l => String(l.crm_stage_id) === String(stage.id)).length}
                                    </span>
                                </div>

                                <div className={`flex flex-col gap-4 min-h-[600px] p-4 rounded-[2.5rem] border-2 border-dashed transition-colors ${draggedLeadId ? 'bg-[#FFB800]/5 border-[#FFB800]/20' : 'bg-transparent border-transparent'}`}>
                                    {leads.filter(l => String(l.crm_stage_id) === String(stage.id)).length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-[10px] font-black text-text-tertiary uppercase tracking-widest italic opacity-20 text-center px-10">
                                            Arraste leads para esta etapa
                                        </div>
                                    ) : (
                                        leads.filter(l => String(l.crm_stage_id) === String(stage.id)).map(lead => (
                                            <motion.div
                                                key={lead.id}
                                                draggable
                                                onDragStart={() => handleDragStart(lead.id)}
                                                onClick={() => fetchUserDetails(lead)}
                                                layoutId={lead.id}
                                                className="bg-surface/80 border border-border-subtle p-6 rounded-[2rem] hover:border-[#FFB800]/50 hover:bg-surface cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden shadow-sm"
                                            >
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#FFB800]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="font-black text-text-primary group-hover:text-[#FFB800] transition-colors uppercase tracking-tight text-sm flex items-center gap-2">
                                                        {lead.name}
                                                        {lead.temperature === 'hot' && <Zap size={10} className="text-[#FFB800] fill-[#FFB800] animate-pulse" />}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                                            lead.category === 'VIP' ? 'bg-[#FFB800] text-black' : 
                                                            lead.category === 'Qualified' ? 'bg-emerald-500 text-white' : 
                                                            'bg-bg-base text-text-tertiary border border-border-subtle'
                                                        }`}>
                                                            {lead.category || 'Standard'}
                                                        </div>
                                                        <div className={`w-2 h-2 rounded-full ${lead.whatsapp_verified ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-text-tertiary opacity-30'}`} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2 mb-4">
                                                     <div className="text-[10px] font-bold text-text-secondary flex items-center gap-2">
                                                         <Phone className="w-3 h-3 text-[#FFB800]" /> {lead.whatsapp}
                                                     </div>
                                                     <div className={`text-[8px] font-black uppercase tracking-tighter ${
                                                         lead.temperature === 'hot' ? 'text-red-500' : 
                                                         lead.temperature === 'warm' ? 'text-amber-500' : 
                                                         'text-text-tertiary'
                                                     }`}>
                                                         {lead.temperature || 'cold'}
                                                     </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-subtle/30">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-text-tertiary uppercase tracking-wider">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(lead.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 px-2.5 py-1 rounded-lg text-[9px] font-black text-[#FFB800] uppercase tracking-widest">
                                                        {lead.credits || 0} CR
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'campaigns' && (
                    <div className="space-y-10">
                         <CampaignList />
                    </div>
                )}
                
                {activeTab === 'automation' && (
                    <AutomationView 
                        automations={automations}
                        loading={loadingAutomations}
                        setAutomations={setAutomations}
                        setModal={setModal} 
                        onDelete={handleDelete}
                    />
                )}
                {activeTab === 'media' && <MediaManagerView />}
                {activeTab === 'logs' && <WhatsAppLogsView />}
                {activeTab === 'feed' && <AdminFeedView />}
            </AnimatePresence>
            </main>

            {/* Campaign Creation Modal (Standalone) */}
            {campaignModal && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                      <motion.div 
                           initial={{ scale: 0.9, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className="bg-bg-dark border border-border-subtle rounded-[3.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative"
                      >
                           <button onClick={() => setCampaignModal(false)} className="absolute top-8 right-8 p-3 bg-white/5 border border-white/10 rounded-2xl text-text-tertiary hover:text-[#FFB800] transition-colors z-10">
                                <X size={20} />
                           </button>
                           <div className="h-full overflow-y-auto p-12 custom-scrollbar">
                                <CampaignView stages={stages} leads={leads} setModal={setModal} onClose={() => setCampaignModal(false)} />
                           </div>
                      </motion.div>
                 </div>
            )}

            {/* Lead Details Drawer */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedLead(null)}>
                    <motion.div 
                        initial={{ x: 500 }}
                        animate={{ x: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md h-full bg-surface border-l border-border-subtle p-10 shadow-2xl relative overflow-y-auto custom-scrollbar rounded-l-[3.5rem]"
                    >
                        <button onClick={() => setSelectedLead(null)} className="absolute top-8 left-8 p-3 bg-bg-base border border-border-subtle rounded-2xl text-text-tertiary hover:text-[#FFB800] transition-colors shadow-lg">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mt-16 space-y-12">
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] font-black text-4xl border border-[#FFB800]/20 mx-auto mb-6 shadow-2xl shadow-[#FFB800]/10">
                                    {selectedLead.name.charAt(0)}
                                </div>
                                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tight mb-2">{selectedLead.name}</h2>
                                <div className="flex items-center justify-center gap-2">
                                     <span className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.3em] px-3 py-1 bg-[#FFB800]/5 rounded-full">Lead Inteligente</span>
                                     {(selectedLead as any).origin === 'whatsapp_lead' && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] px-3 py-1 bg-emerald-500/5 rounded-full">WhatsApp Origin</span>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-bg-base/50 rounded-2.5xl border border-border-subtle flex items-center justify-between group hover:border-[#FFB800]/30 transition-all">
                                     <div className="flex items-center gap-4">
                                          <div className="p-3 bg-surface rounded-xl text-text-tertiary group-hover:text-[#FFB800] transition-colors"><Mail size={18} /></div>
                                          <div className="text-sm font-bold text-text-primary">{selectedLead.email || 'Sem e-mail'}</div>
                                     </div>
                                </div>
                                <div className="p-5 bg-bg-base/50 rounded-2.5xl border border-border-subtle flex items-center justify-between group hover:border-[#FFB800]/30 transition-all">
                                     <div className="flex items-center gap-4">
                                          <div className="p-3 bg-surface rounded-xl text-text-tertiary group-hover:text-[#FFB800] transition-colors"><Phone size={18} /></div>
                                          <div className="text-sm font-bold text-text-primary">{selectedLead.whatsapp}</div>
                                     </div>
                                     {selectedLead.whatsapp_verified && <CheckCircle2 size={20} className="text-emerald-500" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-bg-base/30 p-6 rounded-[2.5rem] border border-border-subtle">
                                    <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-3">Estágio Funil</div>
                                    <select 
                                        value={selectedLead.crm_stage_id || ''} 
                                        onChange={(e) => updateStage(selectedLead.id, e.target.value)}
                                        className="bg-transparent text-[#FFB800] font-black text-[11px] outline-none w-full appearance-none cursor-pointer uppercase tracking-tight"
                                    >
                                        <option value="" disabled>Alterar Estágio...</option>
                                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="bg-bg-base/30 p-6 rounded-[2.5rem] border border-border-subtle">
                                    <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-3">Saldo Créditos</div>
                                    <div className="text-text-primary font-black text-base">{selectedLead.credits || 0} <span className="text-[11px] opacity-30 tracking-widest ml-1 uppercase">CR</span></div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <History className="w-5 h-5 text-[#FFB800]" />
                                    Histórico de Interações
                                </h3>
                                <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-0 before:w-[1px] before:bg-border-subtle/50">
                                    {interactions.map((int: any) => (
                                        <div key={int.id} className="relative pl-12 pb-2">
                                            <div className="absolute left-[13px] top-1.5 w-[9px] h-[9px] rounded-full bg-[#FFB800] shadow-[0_0_8px_#FFB800] border-2 border-surface" />
                                            <div className="text-[10px] font-black text-text-tertiary mb-3 uppercase tracking-wider">{new Date(int.created_at).toLocaleString()}</div>
                                            <div className="text-[11px] font-medium text-text-secondary bg-bg-base/40 p-5 rounded-2xl border border-border-subtle leading-relaxed group hover:bg-bg-base/60 transition-all">
                                                <span className="font-black text-[#FFB800] text-[10px] uppercase block mb-2 tracking-[0.1em]">{int.type}</span>
                                                {int.content}
                                            </div>
                                        </div>
                                    ))}
                                    {interactions.length === 0 && <div className="text-text-tertiary text-[11px] font-bold italic ml-12 opacity-30">Sem registros para este lead.</div>}
                                </div>
                            </div>

                            <div className="pt-10 border-t border-border-subtle grid grid-cols-1 gap-4">
                                <button className="w-full flex items-center justify-center gap-3 py-5 bg-[#FFB800] text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] transition-all">
                                    <Bot className="w-5 h-5" /> Abrir Terminal Alex IA
                                </button>
                                <button className="w-full flex items-center justify-center gap-3 py-5 bg-bg-base border border-border-subtle text-text-secondary rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-surface transition-all">
                                    <Plus className="w-5 h-5" /> Nova Nota de Campanha
                                </button>
                            </div>
                        </div>
                    </motion.div>
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
};

const CampaignList = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [filter, setFilter] = useState<'all' | 'running' | 'completed'>('all');

    useEffect(() => {
         fetchCampaigns();
         const i = setInterval(fetchCampaigns, 10000);
         return () => clearInterval(i);
    }, []);

    const fetchCampaigns = async () => {
         try {
              const res = await api.get('/admin/crm/campaigns');
              const data = await res.json();
              if (data.success) setCampaigns(data.campaigns);
         } finally { setLoading(false); }
    };

    const handleViewDetails = async (id: string, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        setSelectedCampaignId(id);
        setLoadingStats(true);
        try {
            const res = await api.get(`/admin/campaigns/${id}/details`);
            const data = await res.json();
            if (data.success) {
                setStatsData({ stats: data.stats, recipients: data.recipients });
            }
        } finally {
            setLoadingStats(false);
        }
    };

    const handleDeleteCampaign = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem a certeza que deseja eliminar esta campanha permanentemente da visualização?')) {
            try {
                const res = await api.delete(`/admin/crm/campaigns/${id}`);
                const data = await res.json();
                if (data.success) {
                    setCampaigns(prev => prev.filter(c => c.id !== id));
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (loading) return <div className="p-10 text-center text-[10px] font-black text-text-tertiary uppercase tracking-widest animate-pulse">Acedendo ao Arquivo Central...</div>;

    const filteredCampaigns = campaigns.filter(c => {
        if (filter === 'completed') return c.status === 'completed';
        if (filter === 'running') return c.status !== 'completed';
        return true;
    });

    return (
         <>
             <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-xl border border-white/10 w-fit mb-8">
                 {[
                     { id: 'all', label: 'Todas as Campanhas' },
                     { id: 'running', label: 'Em Processo' },
                     { id: 'completed', label: 'Concluídas' }
                 ].map(tab => (
                     <button
                         key={tab.id}
                         onClick={() => setFilter(tab.id as any)}
                         className={`px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                             filter === tab.id 
                             ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' 
                             : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
                         }`}
                     >
                         {tab.label}
                     </button>
                 ))}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCampaigns.map(camp => (
                       <div key={camp.id} onClick={() => handleViewDetails(camp.id)} className="cursor-pointer group bg-surface/40 backdrop-blur-md border border-border-subtle p-8 rounded-[2.5rem] hover:border-[#FFB800]/30 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8">
                                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${camp.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20'}`}>
                                      {camp.status}
                                 </div>
                                 <div className="flex items-center gap-2">
                                      <button onClick={(e) => handleDeleteCampaign(camp.id, e)} className="text-text-tertiary hover:text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-all" title="Eliminar"><X size={16} /></button>
                                      <button onClick={(e) => handleViewDetails(camp.id, e)} className="text-text-tertiary hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"><MoreVertical size={16} /></button>
                                 </div>
                            </div>
                            <h4 className="text-lg font-black text-text-primary uppercase tracking-tight mb-3 group-hover:text-[#FFB800] transition-colors">{camp.name}</h4>
                            <div className="text-[10px] font-bold text-text-tertiary italic line-clamp-2 mb-8 h-8">"{camp.message_template}"</div>
                            
                            <div className="grid grid-cols-2 gap-4 py-6 border-t border-border-subtle/50">
                                 <div>
                                      <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-1">Alcance</div>
                                      <div className="text-sm font-black text-text-primary">{camp.sent_count || 0} <span className="text-[9px] opacity-30">LEADS</span></div>
                                 </div>
                                 <div>
                                      <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-1">Estatísticas</div>
                                      <div className="text-[10px] font-bold text-[#FFB800] uppercase tracking-wider group-hover:text-[#FFB800] transition-colors mt-1 flex items-center gap-1">Ver Relatório <ChevronRight size={12}/></div>
                                 </div>
                            </div>
                       </div>
                  ))}
             </div>

             <AnimatePresence>
                {selectedCampaignId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6" onClick={() => setSelectedCampaignId(null)}>
                        <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-surface border border-border-subtle rounded-[2.5rem] p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-8 shrink-0">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Estatísticas da Campanha</h2>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Dados de Entrega & Conversão</p>
                                </div>
                                <button onClick={() => setSelectedCampaignId(null)} className="text-zinc-500 bg-white/5 rounded-full hover:bg-white/10 hover:text-white p-3 rotate-transition"><X size={20} /></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-4" style={{scrollbarWidth:'thin', scrollbarColor:'#333 transparent'}}>
                                {loadingStats ? (
                                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                                         <RefreshCcw size={24} className="text-[#FFB800] animate-spin" />
                                         <div className="text-[#FFB800] text-xs font-bold uppercase tracking-widest">Carregando métricas avançadas...</div>
                                    </div>
                                ) : statsData ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Envios (Total)</p>
                                                <p className="text-3xl font-black text-white">{statsData.stats.totalSent}</p>
                                                <p className="text-[10px] font-bold text-zinc-600 mt-1">/ {statsData.stats.expectedCount} TARGETS</p>
                                            </div>
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden">
                                                <div className="absolute -right-4 -bottom-4 opacity-5"><CheckCircle2 size={100} /></div>
                                                <p className="text-[10px] text-emerald-500/70 font-bold uppercase mb-2">Lidos (Abertura)</p>
                                                <p className="text-3xl font-black text-emerald-400">{statsData.stats.totalRead}</p>
                                                <p className="text-[10px] font-bold text-emerald-500/50 mt-1">{statsData.stats.totalSent > 0 ? Math.round((statsData.stats.totalRead/statsData.stats.totalSent)*100) : 0}% OVERALL</p>
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl relative overflow-hidden">
                                                <div className="absolute -right-4 -bottom-4 opacity-5"><MessageSquare size={100} /></div>
                                                <p className="text-[10px] text-blue-500/70 font-bold uppercase mb-2">Respostas (Conversão)</p>
                                                <p className="text-3xl font-black text-blue-400">{statsData.stats.totalReplies}</p>
                                                <p className="text-[10px] font-bold text-blue-500/50 mt-1">{statsData.stats.totalSent > 0 ? Math.round((statsData.stats.totalReplies/statsData.stats.totalSent)*100) : 0}% REPLY RATE</p>
                                            </div>
                                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl relative overflow-hidden">
                                                <div className="absolute -right-4 -bottom-4 opacity-5"><AlertCircle size={100} /></div>
                                                <p className="text-[10px] text-red-500/70 font-bold uppercase mb-2">Falhados (Bounces)</p>
                                                <p className="text-3xl font-black text-red-400">{statsData.stats.totalFailed}</p>
                                                <p className="text-[10px] font-bold text-red-500/50 mt-1">ERROS DE ENVIO</p>
                                            </div>
                                        </div>

                                        <div className="bg-black/20 border border-white/5 rounded-3xl p-6 md:p-8">
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Lista de Destinatários</h3>
                                            <div className="space-y-3">
                                                {statsData.recipients.length === 0 ? (
                                                    <div className="text-zinc-600 text-xs py-8 text-center italic">Nenhum envio processado para esta campanha.</div>
                                                ) : (
                                                    statsData.recipients.map((rec: any) => (
                                                        <div key={rec.id} className="flex justify-between items-center bg-surface/50 p-4 px-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 relative">
                                                                     {rec.name?.[0]?.toUpperCase() || '?'}
                                                                     {rec.status === 'read' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#121212] rounded-full"></div>}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-white leading-none mb-1.5">{rec.name || 'Desconhecido'}</p>
                                                                    <p className="text-[10px] text-zinc-500 font-medium">{rec.phone || 'N/D'} • {new Date(rec.created_at).toLocaleString('pt-PT')}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest border ${rec.status==='read'?'text-emerald-400 border-emerald-400/20 bg-emerald-400/5':rec.status==='failed'?'text-red-400 border-red-400/20 bg-red-400/5':rec.status==='delivered'?'text-blue-400 border-blue-400/20 bg-blue-400/5':'text-zinc-400 border-zinc-600/20'}`}>
                                                                {rec.status === 'read' ? 'Lido' : rec.status === 'delivered' ? 'Entregue' : rec.status === 'sent' ? 'Enviado' : rec.status === 'failed' ? 'Falhou' : rec.status || 'Pendente'}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
             </AnimatePresence>
         </>
    );
};

const CampaignView: React.FC<{ 
    stages: Stage[];
    leads: Lead[]; 
    setModal: (m: any) => void;
    onClose?: () => void;
}> = ({ stages, leads, setModal, onClose }) => {
    const [name, setName] = useState('');
    const [template, setTemplate] = useState('Olá {name}, estamos a expandir os limites da IA na Conversio! Vê agora o que podes criar...');
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [segment, setSegment] = useState('all');
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleGenerateAI = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/admin/crm/campaign/generate', { promptInput: name || 'Campanha de Conversão' });
            const data = await res.json();
            if (data.success && data.aiGenerated) {
                setTemplate(data.aiGenerated.messageTemplate);
                // logic for AI audience would go here
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleSend = async () => {
        if (!name || !template) return;
        setSending(true);
        try {
            const res = await api.post('/admin/crm/campaigns', { 
                 name, 
                 message_template: template, 
                 target_segment: { segment, stages: selectedStages } 
            });
            const data = await res.json();
            if (data.success) {
                setModal({
                    isOpen: true,
                    title: 'Operação Comandada',
                    message: 'Campanha injetada com sucesso. O Agente de Campanhas iniciará o envio por lotes.',
                    type: 'success'
                });
                if (onClose) onClose();
            }
        } finally {
            setSending(false);
        }
    };

    const filteredLeads = leads.filter(l => {
         if (segment === 'stages' && selectedStages.length > 0) {
             return selectedStages.includes(String(l.crm_stage_id));
         }
         if (segment === 'all') return true;
         if (segment === 'whatsapp_only') return (l as any).origin === 'whatsapp_lead';
         if (segment === 'pro') return l.credits > 500;
         return true;
    });

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-4">
                        <Zap className="w-10 h-10 text-[#FFB800] shadow-[0_0_20px_#FFB80033]" />
                        Criar Impacto em Massa
                    </h2>
                    <p className="text-text-tertiary text-sm mt-2 font-medium">Configure a segmentação, copie e estratégia para o Agente de Campanhas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="space-y-6 bg-surface/30 p-8 rounded-[3rem] border border-border-subtle">
                        <div>
                            <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest block mb-3 px-1">Título da Campanha (Interno)</label>
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ex: Recuperação Inverno 2026"
                                className="w-full bg-bg-base border border-border-subtle p-6 rounded-2.5xl text-text-primary text-sm font-bold outline-none focus:border-[#FFB800] transition-all placeholder:opacity-20"
                            />
                        </div>

                        <div>
                             <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest block mb-3 px-1">Segmentação Estratégica</label>
                             <div className="grid grid-cols-2 gap-3 mb-4">
                                  {['all', 'stages', 'whatsapp_only', 'pro'].map(s => (
                                       <button 
                                            key={s}
                                            onClick={() => setSegment(s)}
                                            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${segment === s ? 'bg-[#FFB800] text-black border-[#FFB800]' : 'bg-surface text-text-tertiary border-border-subtle hover:border-text-tertiary'}`}
                                       >
                                            {s === 'stages' ? 'Por Etapa do Funil' : s.replace('_', ' ')}
                                       </button>
                                  ))}
                              </div>

                              {segment === 'stages' && (
                                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid grid-cols-2 gap-2 p-4 bg-bg-base rounded-2xl border border-border-subtle overflow-hidden">
                                     {stages.map(stage => (
                                         <button
                                             key={stage.id}
                                             onClick={() => {
                                                 setSelectedStages(prev => 
                                                     prev.includes(stage.id) 
                                                         ? prev.filter(id => id !== stage.id) 
                                                         : [...prev, stage.id]
                                                 );
                                             }}
                                             className={`px-4 py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center justify-between border transition-all ${
                                                 selectedStages.includes(stage.id) 
                                                     ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30' 
                                                     : 'bg-surface text-text-tertiary border-border-subtle'
                                             }`}
                                         >
                                             {stage.name}
                                             {selectedStages.includes(stage.id) && <Check size={12} />}
                                         </button>
                                     ))}
                                 </motion.div>
                             )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3 px-1">
                                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Script da Mensagem</label>
                                <button onClick={handleGenerateAI} disabled={generating} className="text-[10px] font-black text-[#FFB800] uppercase flex items-center gap-2 hover:underline">
                                     {generating ? <RefreshCcw size={12} className="animate-spin" /> : <Zap size={12} />} IA Refine
                                </button>
                            </div>
                            <textarea 
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                rows={8}
                                className="w-full bg-bg-base border border-border-subtle p-6 rounded-2.5xl text-text-primary text-sm font-medium outline-none focus:border-[#FFB800] transition-all resize-none leading-relaxed"
                            />
                            <div className="flex justify-between mt-4">
                                 <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Variável: <code className="text-[#FFB800]">{`{name}`}</code></p>
                                 <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">{template.length} / 1200 Caracteres</p>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="bg-surface/50 p-10 rounded-[3rem] border border-border-subtle flex flex-col items-center justify-center text-center space-y-8">
                     <div className="w-24 h-24 bg-[#FFB800] text-black rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-[#FFB800]/20">
                          <Send size={40} />
                     </div>
                     <div>
                          <h3 className="text-2xl font-black text-text-primary uppercase mb-2">Resumo da Execução</h3>
                          <p className="text-text-tertiary text-[11px] font-bold uppercase tracking-widest leading-loose">
                                Audiência Estimada: <span className="text-white">{filteredLeads.length} Leads</span><br />
                                Custo de Disparo: <span className="text-emerald-500">Free (Internal Agent)</span><br />
                                Duração: <span className="text-white">Estimado 2h (Rate Limit Applied)</span>
                          </p>
                     </div>
                     <div className="w-full pt-6">
                         <button
                             onClick={handleSend}
                             disabled={sending || !name || !template}
                             className="w-full py-6 bg-[#FFB800] hover:bg-[#FFB800]/90 disabled:opacity-20 text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2.5xl transition-all shadow-2xl shadow-[#FFB800]/30 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95"
                         >
                             {sending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <>Disparar Campanha</>}
                         </button>
                         {onClose && (
                              <button onClick={onClose} className="w-full mt-4 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-widest hover:text-white transition-colors">
                                   Cancelar Operação
                              </button>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};


const AutomationView: React.FC<{ 
    automations: any[]; 
    loading: boolean;
    setAutomations: React.Dispatch<React.SetStateAction<any[]>>;
    setModal: (m: any) => void;
    onDelete: (id: number) => void;
}> = ({ automations, loading, setAutomations, setModal, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', delay_days: 0, message_template: '', trigger_type: 'days_after_signup' });

    const handleSave = async () => {
        if (!form.name || !form.message_template) return;
        setSaving(true);
        try {
            const res = await api.post('/admin/crm/automations', form);
            const data = await res.json();
            if (data.success) {
                setAutomations(prev => [...prev, data.automation]);
                setShowModal(false);
                setForm({ name: '', delay_days: 0, message_template: '', trigger_type: 'days_after_signup' });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: number) => {
        const res = await api.put(`/admin/crm/automations/${id}/toggle`, {});
        const data = await res.json();
        if (data.success) {
            setAutomations(prev => prev.map(a => a.id === id ? data.automation : a));
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
                        <Zap className="w-6 h-6 text-[#FFB800]" />
                        Sequências de Follow-Up IA
                    </h2>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-1">Estratégias de retenção automatizada pós-registo.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="px-8 py-4 bg-bg-base border border-border-subtle hover:border-[#FFB800] text-text-secondary hover:text-[#FFB800] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-lg"
                >
                    <Plus className="w-5 h-5" /> Nova Sequência
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest animate-pulse">Sincronizando Automações...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {automations.map(auto => (
                        <div key={auto.id} className="group bg-surface/50 backdrop-blur-xl border border-border-subtle p-8 rounded-[2.5rem] hover:border-[#FFB800]/30 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start mb-8">
                                <div className={`p-4 rounded-2.5xl ${auto.is_active ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'bg-bg-base text-text-tertiary border border-border-subtle'}`}>
                                    <Bot className="w-6 h-6" />
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={auto.is_active} 
                                        onChange={() => handleToggle(auto.id)}
                                    />
                                    <div className="w-12 h-6 bg-bg-base border border-border-subtle rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-text-tertiary peer-checked:after:bg-black after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FFB800] peer-checked:border-[#FFB800]"></div>
                                </label>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-text-primary font-black uppercase tracking-tight text-lg mb-2 group-hover:text-[#FFB800] transition-colors">{auto.name}</h4>
                                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-text-tertiary"></span>
                                    Delay: <span className="text-[#FFB800]">{auto.delay_days} Dias</span>
                                </div>
                            </div>

                            <div className="bg-bg-base/40 p-5 rounded-2xl border border-border-subtle mb-8 min-h-[80px]">
                                <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-3">Copywriting Ativo</div>
                                <div className="text-[10px] font-medium text-text-secondary leading-relaxed italic line-clamp-3">
                                    {auto.message_template}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-6 border-t border-border-subtle/50">
                                <button className="p-3 bg-bg-base/50 text-text-tertiary hover:text-[#FFB800] transition-colors rounded-xl border border-border-subtle hover:border-[#FFB800]/50">
                                    <History size={16} />
                                </button>
                                <button 
                                    onClick={() => onDelete(auto.id)}
                                    className="p-3 bg-bg-base/50 text-text-tertiary hover:text-red-500 transition-colors rounded-xl border border-border-subtle hover:border-red-500/50"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div onClick={() => setShowModal(true)} className="border-2 border-border-subtle border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-12 hover:border-[#FFB800]/30 transition-all group cursor-pointer h-full min-h-[340px]">
                        <div className="w-16 h-16 bg-surface border border-border-subtle rounded-3xl flex items-center justify-center text-text-tertiary group-hover:bg-[#FFB800] group-hover:text-black transition-all shadow-xl mb-6">
                            <Plus size={32} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] group-hover:text-text-primary transition-colors">Criar Nova Sequência</span>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-border-subtle p-10 rounded-[3rem] w-full max-w-xl shadow-2xl relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-text-tertiary hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                        <div className="mb-10 text-center">
                            <div className="w-16 h-16 bg-[#FFB800]/10 text-[#FFB800] rounded-3xl flex items-center justify-center mb-6 mx-auto border border-[#FFB800]/20">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Nova Automação IA</h3>
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-2">Configure o comportamento do robô de vendas.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2 px-1">Nome Interno</label>
                                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-bg-base border border-border-subtle p-5 rounded-2xl text-text-primary font-medium outline-none focus:border-[#FFB800] transition-all" placeholder="ex: Boas vindas 24h" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2 px-1">Atraso (Dias)</label>
                                    <input type="number" value={form.delay_days} onChange={e => setForm({...form, delay_days: parseInt(e.target.value)})} className="w-full bg-bg-base border border-border-subtle p-5 rounded-2xl text-text-primary font-medium outline-none focus:border-[#FFB800] transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2 px-1">Script de Mensagem</label>
                                <textarea value={form.message_template} onChange={e => setForm({...form, message_template: e.target.value})} className="w-full bg-bg-base border border-border-subtle p-5 rounded-2xl text-text-primary font-medium outline-none focus:border-[#FFB800] transition-all h-32 resize-none" placeholder="Use {name} para personalização de alto nível..." />
                            </div>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.message_template} className="w-full py-5 bg-[#FFB800] hover:bg-[#FFB800]/90 disabled:opacity-30 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-[#FFB800]/30 flex items-center justify-center gap-3 mt-4">
                                {saving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Ativar Sequência</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

const AdminFeedView: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchFeed = async () => {
        try {
            const res = await api.get('/admin/notifications');
            const data = await res.json();
            if (data.success) setNotifications(data.notifications);
        } finally { setLoading(false); }
    };
    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 10000);
        return () => clearInterval(interval);
    }, []);
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="bg-surface/50 backdrop-blur-xl border border-border-subtle rounded-[3rem] p-10">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-border-subtle">
                    <div>
                        <h2 className="text-xl font-black text-text-primary flex items-center gap-3 uppercase tracking-tight">
                            <Bell className="w-6 h-6 text-[#FFB800]" />
                            Radar de Atividade em Tempo Real
                        </h2>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-1 italic">Vigilância contínua do ecossistema Conversio AI.</p>
                    </div>
                </div>
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                            <Bot className="w-12 h-12 animate-bounce text-text-tertiary" />
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Sintonizando frequências...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-20 bg-bg-base/30 rounded-[2.5rem] border border-border-subtle border-dashed">
                            <Bell className="w-10 h-10 text-text-tertiary mx-auto mb-4 opacity-20" />
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest italic">Silêncio absoluto no radar.</p>
                        </div>
                    ) : (
                        notifications.map((notif: any) => (
                            <div key={notif.id} className="group flex gap-6 p-6 rounded-[2rem] bg-bg-base/40 border border-border-subtle hover:border-[#FFB800]/30 hover:bg-surface/50 transition-all items-start overflow-hidden relative">
                                <div className={`p-4 rounded-2xl shrink-0 ${notif.type === 'payment' ? 'bg-amber-500/10 text-amber-500' : notif.type === 'agent_execution' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#FFB800]/10 text-[#FFB800]'}`}>
                                    {notif.type === 'payment' ? <Zap className="w-6 h-6" /> : notif.type === 'agent_execution' ? <Bot className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-text-primary font-black uppercase tracking-tight text-base group-hover:text-[#FFB800] transition-colors">{notif.title}</h4>
                                        <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest bg-bg-base px-2 py-1 rounded-md border border-border-subtle">{new Date(notif.created_at).toLocaleTimeString('pt-PT')}</div>
                                    </div>
                                    <p className="text-text-secondary text-xs font-medium leading-relaxed italic line-clamp-2">{notif.message}</p>
                                </div>
                            </div>
                        ))
                    ) }
                </div>
            </div>
        </motion.div>
    );
};


const WhatsAppLogsView: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/whatsapp/logs');
            const data = await res.json();
            if (data.success) setLogs(data.logs);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="bg-surface/50 backdrop-blur-xl border border-border-subtle rounded-[3rem] p-10 overflow-hidden">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-border-subtle">
                    <div>
                        <h2 className="text-xl font-black text-text-primary flex items-center gap-3 uppercase tracking-tight">
                            <MessageSquare className="w-6 h-6 text-[#FFB800]" />
                            Logs de Comunicação Evolution API
                        </h2>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-1">Auditoria detalhada de todos os disparos transacionais e de marketing.</p>
                    </div>
                    <button 
                        onClick={fetchLogs} 
                        className="p-4 bg-bg-base border border-border-subtle rounded-2xl text-text-tertiary hover:text-[#FFB800] hover:border-[#FFB800] transition-all group active:rotate-180 duration-700"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto rounded-[2rem] border border-border-subtle bg-bg-base/20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-base/50 text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                <th className="p-6 border-b border-border-subtle">Timestamp</th>
                                <th className="p-6 border-b border-border-subtle">Destinatário</th>
                                <th className="p-6 border-b border-border-subtle">Gateway/Tipo</th>
                                <th className="p-6 border-b border-border-subtle">Payload</th>
                                <th className="p-6 border-b border-border-subtle text-center">Outcome</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="w-12 h-12 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Indexando histórico de disparos...</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-text-tertiary font-bold italic opacity-30">Vácuo de dados. Nenhuma mensagem registrada no log.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b border-border-subtle/30 hover:bg-surface/50 transition-colors group">
                                        <td className="p-6 text-text-secondary font-black tabular-nums">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                            <span className="block text-[8px] font-bold text-text-tertiary mt-1">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-medium text-text-primary mb-1 underline decoration-[#FFB800]/30 underline-offset-4">{log.recipient}</div>
                                            <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">ID_{log.id.toString().slice(-4)}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="bg-bg-base px-3 py-1.5 rounded-lg border border-border-subtle text-[9px] font-black text-[#FFB800] uppercase tracking-widest">
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="p-6 text-text-tertiary max-w-sm">
                                            <div className="truncate italic group-hover:text-text-secondary transition-colors" title={log.content}>
                                                {log.content}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            {log.status === 'delivered' ? (
                                                <div className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-emerald-500/20" title="Sucesso Absoluto">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <div className="inline-flex flex-col items-center gap-1 group/err relative">
                                                    <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                                        <AlertCircle className="w-5 h-5" />
                                                    </div>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-red-600 text-white text-[8px] font-black p-2 rounded-lg opacity-0 group-hover/err:opacity-100 transition-opacity z-10 pointer-events-none uppercase tracking-tighter text-center">
                                                        {log.error_details || 'Falha Desconhecida'}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const MediaManagerView: React.FC = () => {
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [newSlotName, setNewSlotName] = useState<string>('');

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/landing-media');
            const data = await res.json();
            if (data.success) {
                setMedia(data.media);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (slotId: string, file: File) => {
        // Validate MIME type for lightweight constraint
        const validTypes = ['image/webp', 'video/mp4'];
        if (!validTypes.includes(file.type)) {
            alert('Formato não otimizado! Por favor carregue apenas imagens em WebP ou vídeos em MP4 para garantir o carregamento ultra-rápido no WhatsApp e Landing Pages.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadingId(slotId);
        try {
            const res = await fetch(`/api/admin/landing-media/${slotId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                fetchMedia();
            } else {
                alert('Erro ao carregar mídia: ' + data.message);
            }
        } catch (e: any) {
            alert('Erro crítico no upload: ' + e.message);
        } finally {
            setUploadingId(null);
        }
    };

    const handleDelete = async (slotId: string) => {
        if (!confirm('Eliminar esta mídia irá ativar o Placeholder na página pública e nos WhatsApps enviados. Continuar?')) return;
        
        try {
            const res = await api.delete(`/admin/landing-media/${slotId}`);
            const data = await res.json();
            if (data.success) {
                fetchMedia();
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
                        <Layout className="w-6 h-6 text-[#FFB800]" />
                        Gestor de Mídias de Alta Performance
                    </h2>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-1">Imagens e Vídeos usados pelos Agentes IA e na Página Principal.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest animate-pulse">Sincronizando CDN...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {media.map(m => (
                        <div key={m.slot_id} className="group bg-surface/50 backdrop-blur-xl border border-border-subtle p-6 rounded-[2rem] hover:border-[#FFB800]/30 transition-all relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-sm font-black text-text-primary uppercase tracking-tight mb-1">{m.slot_id}</h4>
                                    <div className="text-[9px] font-bold text-text-tertiary tracking-widest uppercase line-clamp-1">{m.description || 'Bloco dinâmico'}</div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${m.media_type === 'video' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20'}`}>
                                    {m.media_type}
                                </span>
                            </div>

                            <div className="relative w-full h-40 bg-black/60 rounded-xl overflow-hidden mb-4 border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all">
                                {uploadingId === m.slot_id ? (
                                    <RefreshCcw className="text-[#FFB800] animate-spin" />
                                ) : m.media_type === 'video' ? (
                                    <video src={m.media_url} preload="none" controls className="w-full h-full object-contain" />
                                ) : (
                                    <img src={m.media_url} alt={m.slot_id} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                )}

                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                    <label className="px-5 py-2.5 bg-[#FFB800] text-black text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-[#FFB800]/20">
                                        Upload Novo
                                        <input 
                                            type="file" 
                                            accept="image/webp,video/mp4" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    handleFileUpload(m.slot_id, e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                    <button 
                                        onClick={() => handleDelete(m.slot_id)}
                                        className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                                    >
                                        Limpar Slot
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-auto">
                                <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-widest text-center truncate italic p-2 bg-black/30 rounded-lg border border-border-subtle">
                                    URL: {m.media_url.replace(/https?:\/\/.*?\//, '/.../')}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="group bg-surface/50 backdrop-blur-xl border border-border-subtle border-dashed p-6 rounded-[2rem] hover:border-[#FFB800]/50 transition-all flex flex-col justify-center items-center relative col-span-full md:col-span-2 lg:col-span-3">
                        <div className="text-center w-full max-w-md mx-auto">
                            <h4 className="text-sm font-black text-[#FFB800] uppercase tracking-tight mb-2">Adicionar Novo Slot Especializado</h4>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold mb-6">Selecione o elemento do site que deseja substituir</p>
                            
                            <select 
                                value={newSlotName}
                                onChange={(e) => setNewSlotName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-bold text-white uppercase tracking-widest text-center focus:border-[#FFB800] outline-none mb-6 cursor-pointer hover:bg-black/60 transition-colors"
                            >
                                <option value="">--- Selecione um Slot ---</option>
                                <option value="login_video">Página de Login - Vídeo de Fundo</option>
                                <option value="test_login">Página de Login - (Teste Alternativo)</option>
                                <option value="hero_video_ugc">Landing - Vídeo Hero (Topo Flutuante)</option>
                                <option value="hero_product_img">Landing - Imagem Hero (Topo Produto)</option>
                                <option value="core_ugc_video_1">Landing - Vídeo UGC 1 (Aba UGC)</option>
                                <option value="core_ugc_video_2">Landing - Vídeo UGC 2 (Aba UGC)</option>
                                <option value="core_ugc_video_3">Landing - Vídeo UGC 3 (Aba UGC)</option>
                                <option value="3d_before">Landing - Aba 3D (Imagem Antes)</option>
                                <option value="3d_after">Landing - Aba 3D (Imagem Depois)</option>
                                <option value="comparison_before">Landing - Agente UGC Imagem (Antes)</option>
                                <option value="comparison_after">Landing - Agente UGC Imagem (Depois)</option>
                                <option value="comparison_video">Landing - Agente UGC Imagem (Vídeo Fundo)</option>
                                <option value="video_demo">Landing - Agente UGC Video (Apresentação Duração)</option>
                            </select>

                            <div className="relative">
                                <label className={`inline-flex px-8 py-4 ${newSlotName ? 'bg-[#FFB800] text-black hover:scale-[1.05]' : 'bg-white/5 text-white/30 cursor-not-allowed'} text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg`}>
                                    Fazer Upload
                                    <input 
                                        type="file" 
                                        accept="image/webp,video/mp4" 
                                        className="hidden" 
                                        disabled={!newSlotName}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0] && newSlotName) {
                                                handleFileUpload(newSlotName, e.target.files[0]).then(() => {
                                                    setNewSlotName('');
                                                    alert('Upload concluído! A sua página está atualizada.');
                                                });
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4">
                 <AlertCircle className="text-blue-500 shrink-0 w-6 h-6" />
                 <div>
                      <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-1">Restrição de Performance</h4>
                      <p className="text-blue-500/80 text-xs font-medium leading-relaxed">Para garantir sucesso nas métricas em conexões móveis angolanas, o sistema só aceita vídeos no formato <strong className="text-white">.MP4</strong> optimizados ou imagens compressas em <strong className="text-white">.WEBP</strong>. Evite carregar mídias com mais de 2MB.</p>
                 </div>
            </div>
        </motion.div>
    );
};

export default AdminCRM;
