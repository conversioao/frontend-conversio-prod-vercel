import React, { useEffect, useState } from 'react';
import { Search, Edit, ShieldAlert, Check, User, History, CreditCard, Layers, X, ExternalLink, Filter, Zap, Mail, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<'users' | 'funnel' | 'campaigns'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [funnelLeads, setFunnelLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userActivity, setUserActivity] = useState<{generations: any[], transactions: any[]}>({ generations: [], transactions: [] });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [detailTab, setDetailTab] = useState<'activity' | 'billing'>('activity');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [loadingCampaignDetails, setLoadingCampaignDetails] = useState(false);
  const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
  const [approvingCampaign, setApprovingCampaign] = useState<number | null>(null);
  
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
  
  // Campaign form state
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campName, setCampName] = useState('');
  const [campType, setCampType] = useState('email');
  const [campMessage, setCampMessage] = useState('');

  const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`/admin/users?adminId=${adminId}&search=${search}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFunnel = async () => {
    try {
      const res = await apiFetch(`/admin/funnel?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setFunnelLeads(data.leads);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      // Buscar apenas campanhas direcionadas a utilizadores (audience_type = 'users')
      const res = await apiFetch(`/admin/campaigns?audience=users`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserActivity = async (userId: string) => {
    setLoadingActivity(true);
    try {
      const res = await apiFetch(`/admin/users/${userId}/activity?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setUserActivity({ generations: data.generations, transactions: data.transactions });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchCampaignDetails = async (camp: any) => {
    setSelectedCampaign(camp);
    setLoadingCampaignDetails(true);
    try {
      const res = await apiFetch(`/admin/campaigns/${camp.id}/details?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        // Map backend details to frontend state
        setCampaignLogs(data.recipients || []);
        // We can also store the stats in the campaign object if needed
        setSelectedCampaign({ ...camp, stats: data.stats });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCampaignDetails(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'funnel') fetchFunnel();
      if (activeTab === 'campaigns') fetchCampaigns();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          credits: editingUser.credits,
          role: editingUser.role,
          whatsapp: editingUser.whatsapp,
          status: editingUser.status
        })
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setModal({
      isOpen: true,
      title: 'Eliminar Utilizador',
      message: 'Tem a certeza que deseja eliminar este utilizador permanentemente? Todos os dados serão perdidos.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/admin/users/${userId}?adminId=${adminId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            fetchUsers();
            setModal(prev => ({ ...prev, isOpen: false }));
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await apiFetch(`/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, status: newStatus })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // audience_type = 'users' -> cria em pending_approval, requer aprovacão do admin
        body: JSON.stringify({ name: campName, type: campType, message: campMessage, audience_type: 'users' })
      });
      if (res.ok) {
        const data = await res.json();
        setShowCampaignForm(false);
        setCampName('');
        setCampMessage('');
        fetchCampaigns();
        if (data.needsApproval) {
          setModal({
            isOpen: true,
            title: '✅ Campanha Criada — Aguarda Aprovação',
            message: 'A campanha foi criada e está pendente de aprovação do administrador. Após aprovada, será enviada no próximo ciclo de campanhas.',
            type: 'info'
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCampaign = async (campId: number) => {
    setApprovingCampaign(campId);
    try {
      const res = await apiFetch(`/admin/campaigns/${campId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchCampaigns();
        setModal({ isOpen: true, title: '✅ Campanha Aprovada', message: 'Campanha aprovada e será enviada no próximo ciclo.', type: 'success' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingCampaign(null);
    }
  };

  const handleRejectCampaign = async (campId: number) => {
    setApprovingCampaign(campId);
    try {
      const res = await apiFetch(`/admin/campaigns/${campId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejeitado pelo administrador' })
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingCampaign(null);
    }
  };

  const handleSendCampaign = async (campId: number) => {
    // For demo, we send to funnel leads
    const userIds = funnelLeads.map(l => l.id);
    if (userIds.length === 0) {
      setModal({
        isOpen: true,
        title: 'Sem Alvos',
        message: 'A lista do funil está vazia. Não há utilizadores para enviar esta campanha.',
        type: 'warning'
      });
      return;
    }
    
    try {
      const res = await apiFetch('/admin/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, campaignId: campId, userIds })
      });
      if (res.ok) {
        setModal({
          isOpen: true,
          title: 'Campanha Enviada',
          message: 'Campanha enviada com sucesso para todos os leads no funil!',
          type: 'success'
        });
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
            CRM Clientes
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-md border border-emerald-500/20 uppercase tracking-widest animate-pulse">Servidor v2026.05.05</span>
          </h1>
          <p className="text-text-secondary text-sm">Gestão avançada de utilizadores, funis e campanhas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface border border-border-subtle rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              Clientes
            </button>
            <button 
              onClick={() => setActiveTab('funnel')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'funnel' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              Funil (Leads)
            </button>
            <button 
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'campaigns' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              Campanhas
            </button>
          </div>
          {activeTab === 'users' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
              <input 
                type="text" 
                placeholder="Nome ou email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-[#FFB800] w-64 transition-all"
              />
            </div>
          )}
          {activeTab === 'campaigns' && (
            <button 
              onClick={() => setShowCampaignForm(true)}
              className="px-4 py-2 bg-[#FFB800] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Nova Campanha
            </button>
          )}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="bg-surface border border-border-subtle rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-hover/50 text-text-tertiary text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                  <th className="p-6">Utilizador</th>
                  <th className="p-6">Contacto (WA)</th>
                  <th className="p-6">Créditos</th>
                  <th className="p-6">Estado</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-text-tertiary animate-pulse font-medium">Sincronizando base de dados...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-text-secondary">Nenhum utilizador encontrado.</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className={`border-b border-border-subtle hover:bg-surface-hover/30 transition-all text-sm group ${user.status === 'suspended' ? 'opacity-60 grayscale' : ''}`}>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-bg-base border border-border-subtle flex items-center justify-center text-text-primary group-hover:border-[#FFB800]/50 transition-colors">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-text-primary group-hover:text-[#FFB800] transition-colors">{user.name}</p>
                            <p className="text-xs text-text-tertiary">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        {user.whatsapp ? (
                          <a href={`https://wa.me/${user.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#25D366] font-bold hover:underline">
                            <Zap size={14} /> {user.whatsapp}
                          </a>
                        ) : (
                          <span className="text-text-tertiary text-xs italic">Não definido</span>
                        )}
                      </td>
                      <td className="p-6 text-accent font-black tracking-tight">{user.credits} <span className="text-[10px] text-text-tertiary font-bold uppercase ml-1">Kz</span></td>
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${user.status === 'suspended' ? 'text-red-500' : 'text-emerald-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          {user.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleToggleStatus(user)} className="p-2.5 bg-bg-base hover:bg-orange-500/10 rounded-xl text-text-secondary hover:text-orange-500 transition-all border border-border-subtle" title={user.status === 'suspended' ? 'Reativar' : 'Suspender'}>
                            <ShieldAlert size={16} />
                          </button>
                          <button onClick={() => { setSelectedUser(user); fetchUserActivity(user.id); }} className="p-2.5 bg-bg-base hover:bg-[#FFB800]/10 rounded-xl text-text-secondary hover:text-[#FFB800] transition-all border border-border-subtle" title="Ver Histórico">
                            <History size={16} />
                          </button>
                          <button onClick={() => setEditingUser(user)} className="p-2.5 bg-bg-base hover:bg-emerald-500/10 rounded-xl text-text-secondary hover:text-emerald-500 transition-all border border-border-subtle" title="Editar">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 bg-bg-base hover:bg-red-500/10 rounded-xl text-text-secondary hover:text-red-500 transition-all border border-border-subtle" title="Eliminar">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="bg-bg-base border border-dashed border-border-subtle rounded-3xl p-8 text-center">
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-2">Lead Scoring Automático</h3>
            <p className="text-sm text-text-secondary max-w-lg mx-auto">Filtragem de utilizadores registados há mais de 7 dias que ainda não converteram. Estes são os alvos prioritários para as suas campanhas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funnelLeads.length === 0 ? (
              <div className="col-span-full py-20 text-center text-text-tertiary">Sem leads identificados de momento.</div>
            ) : funnelLeads.map((lead) => (
              <div key={lead.id} className="bg-surface border border-border-subtle rounded-3xl p-6 flex flex-col gap-4 hover:border-[#FFB800]/30 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center text-text-secondary">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary group-hover:text-[#FFB800] transition-colors">{lead.name}</h4>
                      <p className="text-[10px] text-text-tertiary uppercase font-black">{new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-lg border border-red-500/20">Lead Frio</span>
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Mail size={12} className="text-text-tertiary" /> {lead.email}
                   </div>
                   {lead.whatsapp && (
                     <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Zap size={12} className="text-[#25D366]" /> {lead.whatsapp}
                     </div>
                   )}
                </div>

                <div className="flex gap-2 mt-2">
                   <a href={`mailto:${lead.email}`} className="flex-1 py-2 bg-bg-base border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/5 transition-colors">Seguir por Email</a>
                   {lead.whatsapp && (
                     <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-emerald-500/20 transition-colors">WhatsApp</a>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {campaigns.length === 0 && (
                <div className="lg:col-span-3 py-16 text-center text-text-tertiary text-sm">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                  Nenhuma campanha de utilizadores criada ainda.
                </div>
              )}
              {campaigns.map((camp) => {
                const isPending = camp.status === 'pending_approval';
                const isApproved = camp.status === 'approved' || camp.status === 'sent' || camp.status === 'sending';
                const isRejected = camp.status === 'rejected';
                return (
                  <div key={camp.id} className={`bg-surface border rounded-3xl p-6 relative overflow-hidden group transition-all ${isPending ? 'border-[#FFB800]/40 shadow-[0_0_20px_rgba(255,184,0,0.08)]' : isRejected ? 'border-red-500/20 opacity-60' : 'border-border-subtle'}`}>
                    {/* Status stripe */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${isPending ? 'bg-[#FFB800]' : isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-zinc-700'}`} />
                    
                    <div className="flex justify-between mb-4 mt-2">
                       <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${camp.type === 'email' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                         {camp.type === 'email' ? 'Email' : 'WhatsApp'}
                       </span>
                       <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                         isPending ? 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30' :
                         isApproved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                         isRejected ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                         'bg-zinc-700/30 text-zinc-400 border-zinc-700/40'
                       }`}>
                         {isPending ? <><Clock size={10} />Aguarda Aprovação</> :
                          isApproved ? <><CheckCircle size={10} />Aprovada</> :
                          isRejected ? <><XCircle size={10} />Rejeitada</> : 'Rascunho'}
                       </span>
                    </div>
                    <h4 className="text-lg font-black text-text-primary mb-2 line-clamp-1">{camp.name}</h4>
                    <p className="text-xs text-text-tertiary line-clamp-2 mb-4">{camp.message}</p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                       <div className="bg-bg-base/50 p-3 rounded-2xl border border-border-subtle">
                          <p className="text-[9px] text-text-tertiary font-black uppercase">Entregues</p>
                          <p className="text-sm font-black text-emerald-500">{camp.total_delivered || 0}</p>
                       </div>
                       <div className="bg-bg-base/50 p-3 rounded-2xl border border-border-subtle">
                          <p className="text-[9px] text-text-tertiary font-black uppercase">Lidos</p>
                          <p className="text-sm font-black text-blue-500">{camp.total_read || 0}</p>
                       </div>
                       <div className="bg-bg-base/50 p-3 rounded-2xl border border-border-subtle">
                          <p className="text-[9px] text-text-tertiary font-black uppercase">Respostas</p>
                          <p className="text-sm font-black text-orange-500">{camp.total_replied || 0}</p>
                       </div>
                       <div className="bg-bg-base/50 p-3 rounded-2xl border border-border-subtle">
                          <p className="text-[9px] text-text-tertiary font-black uppercase">Falhas</p>
                          <p className="text-sm font-black text-red-500">{camp.total_failed || 0}</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-subtle">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-text-tertiary uppercase font-black">Alcance Alvo</span>
                          <span className="text-sm font-black">{camp.target_count || 0} Utilizadores</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => fetchCampaignDetails(camp)}
                           className="p-2.5 bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-xl transition-all border border-white/5"
                           title="Ver Destinatários"
                         >
                           <Layers size={18} />
                         </button>
                         {isPending && (
                           <>
                             <button 
                               onClick={() => handleApproveCampaign(camp.id)}
                               disabled={approvingCampaign === camp.id}
                               className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                               title="Aprovar Campanha"
                             >
                               <CheckCircle size={14} />Aprovar
                             </button>
                             <button 
                               onClick={() => handleRejectCampaign(camp.id)}
                               disabled={approvingCampaign === camp.id}
                               className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
                               title="Rejeitar Campanha"
                             >
                               <XCircle size={14} />Rejeitar
                             </button>
                           </>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      <AnimatePresence>
        {selectedCampaign && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCampaign(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-3xl max-h-[85vh] bg-surface border border-border-subtle rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
               <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-base/30 shrink-0">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedCampaign.type === 'email' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {selectedCampaign.type === 'email' ? <Mail size={24} /> : <Zap size={24} />}
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter">{selectedCampaign.name}</h2>
                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{selectedCampaign.type === 'email' ? 'Campanha de Correio' : 'Campanha de WhatsApp'}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedCampaign(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                     <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <div className="bg-bg-base/50 p-6 rounded-[2rem] border border-border-subtle">
                     <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-4">Conteúdo da Mensagem</h3>
                     <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{selectedCampaign.message}</p>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Logs de Entrega</h3>
                     {loadingCampaignDetails ? (
                        <div className="py-20 text-center animate-pulse text-text-tertiary text-xs">Sincronizando logs de rede...</div>
                     ) : campaignLogs.length === 0 ? (
                        <div className="py-20 text-center bg-bg-base/20 border border-dashed border-border-subtle rounded-3xl text-text-tertiary text-xs">Nenhum log de entrega encontrado para esta campanha.</div>
                     ) : (
                        <div className="overflow-hidden border border-border-subtle rounded-2xl">
                           <table className="w-full text-left">
                              <thead className="bg-bg-base/50 text-[9px] font-black text-text-tertiary uppercase tracking-widest">
                                 <tr>
                                    <th className="px-6 py-4">Lead</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Data</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-border-subtle">
                                 {campaignLogs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors text-[11px]">
                                       <td className="px-6 py-4 font-bold text-text-primary">{log.user_name || log.recipient}</td>
                                       <td className="px-6 py-4">
                                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                             {log.status}
                                          </span>
                                       </td>
                                       <td className="px-6 py-4 text-text-tertiary font-medium">{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </div>
               </div>
               
               <div className="p-8 border-t border-border-subtle bg-bg-base/30 shrink-0">
                  <div className="flex items-center justify-between">
                     <div className="flex gap-8">
                        <div className="text-center">
                           <p className="text-[9px] font-black text-text-tertiary uppercase mb-1 tracking-[0.2em]">Enviados</p>
                           <p className="text-xl font-black text-white">{selectedCampaign.stats?.totalSent || 0}</p>
                        </div>
                        <div className="w-px h-10 bg-border-subtle"></div>
                        <div className="text-center">
                           <p className="text-[9px] font-black text-text-tertiary uppercase mb-1 tracking-[0.2em]">Lidos</p>
                           <p className="text-xl font-black text-blue-500">{selectedCampaign.stats?.totalRead || 0}</p>
                        </div>
                        <div className="w-px h-10 bg-border-subtle"></div>
                        <div className="text-center">
                           <p className="text-[9px] font-black text-text-tertiary uppercase mb-1 tracking-[0.2em]">Respostas</p>
                           <p className="text-xl font-black text-emerald-500">{selectedCampaign.stats?.totalReplies || 0}</p>
                        </div>
                        <div className="w-px h-10 bg-border-subtle"></div>
                        <div className="text-center">
                           <p className="text-[9px] font-black text-text-tertiary uppercase mb-1 tracking-[0.2em]">Falhas</p>
                           <p className="text-xl font-black text-red-500">{selectedCampaign.stats?.totalFailed || 0}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedCampaign(null)} className="px-8 py-3 bg-[#FFB800] text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#FFB800]/20">Fechar Detalhes</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Existing Detail Panels & Modals (with WhatsApp updates) */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="relative w-full max-w-xl h-[calc(100vh-2rem)] bg-surface border border-border-subtle rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-base/30">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFB800] flex items-center justify-center text-black">
                    <User size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-text-primary">{selectedUser.name}</h2>
                    <p className="text-sm text-text-secondary">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-surface-hover rounded-xl text-text-tertiary transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl">
                       <CreditCard className="text-[#FFB800] mb-3" size={20} />
                       <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Saldo Atual</p>
                       <h4 className="text-2xl font-black text-text-primary">{selectedUser.credits} Kz</h4>
                    </div>
                    <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl">
                       <Zap className={`mb-3 ${selectedUser.status === 'suspended' ? 'text-red-500' : 'text-emerald-500'}`} size={20} />
                       <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Estado CRM</p>
                       <h4 className="text-2xl font-black text-text-primary capitalize">{selectedUser.status || 'active'}</h4>
                    </div>
                 </div>
                  <div className="flex bg-bg-base p-1 rounded-2xl border border-border-subtle">
                    <button 
                      onClick={() => setDetailTab('activity')}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${detailTab === 'activity' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-primary'}`}
                    >
                      <History size={14} className="inline mr-2" /> Histórico Conta
                    </button>
                    <button 
                      onClick={() => setDetailTab('billing')}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${detailTab === 'billing' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-primary'}`}
                    >
                      <CreditCard size={14} className="inline mr-2" /> Planos & Créditos
                    </button>
                  </div>

                  <div className="space-y-6">
                    {detailTab === 'activity' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-text-primary uppercase tracking-tighter">Gerações Realizadas</h4>
                          <span className="text-[10px] font-bold text-text-tertiary">{userActivity.generations.length} items</span>
                        </div>
                        {loadingActivity ? (
                          <div className="py-10 text-center animate-pulse text-text-tertiary text-xs">A carregar registos...</div>
                        ) : userActivity.generations.length === 0 ? (
                          <div className="py-10 text-center bg-bg-base/30 rounded-3xl border border-dashed border-border-subtle text-text-tertiary text-xs">Nenhuma geração registada desde a criação.</div>
                        ) : (
                          <div className="space-y-3">
                            {userActivity.generations.map((gen: any) => (
                              <div key={gen.id} className="bg-bg-base/50 border border-border-subtle p-4 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gen.type === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {gen.type === 'video' ? <Video size={14} /> : <Layers size={14} />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-text-primary capitalize">{gen.type} - {gen.status}</p>
                                    <p className="text-[10px] text-text-tertiary">{new Date(gen.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                                {gen.result_url && (
                                  <a href={gen.result_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/5 rounded-lg text-text-tertiary hover:text-[#FFB800] transition-all">
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-text-primary uppercase tracking-tighter">Histórico de Transações</h4>
                          <span className="text-[10px] font-bold text-text-tertiary">{userActivity.transactions.length} items</span>
                        </div>
                        {loadingActivity ? (
                          <div className="py-10 text-center animate-pulse text-text-tertiary text-xs">A carregar facturação...</div>
                        ) : userActivity.transactions.length === 0 ? (
                          <div className="py-10 text-center bg-bg-base/30 rounded-3xl border border-dashed border-border-subtle text-text-tertiary text-xs">Nenhum plano comprado até ao momento.</div>
                        ) : (
                          <div className="space-y-3">
                            {userActivity.transactions.map((tx: any) => (
                              <div key={tx.id} className="bg-bg-base/50 border border-border-subtle p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    <CreditCard size={14} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-text-primary">{tx.amount.toLocaleString()} Kz - {tx.description || 'Compra de Créditos'}</p>
                                    <p className="text-[10px] text-text-tertiary">{new Date(tx.created_at).toLocaleString()} • <span className="uppercase">{tx.status}</span></p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border-t-4 border-t-[#FFB800]">
              <h2 className="text-2xl font-black mb-1 text-text-primary tracking-tight">Painel de Privilégios</h2>
              <p className="text-sm text-text-secondary mb-8">Gestão de <strong className="text-[#FFB800]">{editingUser.name}</strong></p>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Saldo Manual (Créditos)</label>
                  <input type="number" value={editingUser.credits} onChange={(e) => setEditingUser({...editingUser, credits: parseInt(e.target.value)})} className="w-full p-4 bg-bg-base border border-border-subtle rounded-2xl text-text-primary text-sm font-bold focus:border-[#FFB800] outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">WhatsApp</label>
                    <input type="text" value={editingUser.whatsapp || ''} onChange={(e) => setEditingUser({...editingUser, whatsapp: e.target.value})} placeholder="244..." className="w-full p-4 bg-bg-base border border-border-subtle rounded-2xl text-text-primary text-sm font-bold focus:border-[#FFB800] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Role</label>
                    <select value={editingUser.role || 'user'} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} className="w-full p-4 bg-bg-base border border-border-subtle rounded-2xl text-text-primary text-sm font-bold focus:border-[#FFB800] outline-none appearance-none">
                      <option value="user">Utilizador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 bg-bg-base border border-border-subtle rounded-2xl text-sm font-bold text-text-secondary hover:bg-surface-hover transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-[#FFB800] text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FFB800]/20"><Check size={18} /> Aplicar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCampaignForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative">
                <h2 className="text-2xl font-black mb-1 text-text-primary uppercase tracking-tighter">Criar Nova Campanha</h2>
                <p className="text-sm text-text-secondary mb-8">Defina o nome, canal e mensagem para automatizar o follow-up.</p>
                <form onSubmit={handleCreateCampaign} className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Nome da Campanha</label>
                      <input type="text" value={campName} onChange={(e) => setCampName(e.target.value)} required placeholder="Ex: Black Friday Follow-up" className="w-full p-4 bg-bg-base border border-border-subtle rounded-2xl text-text-primary text-sm font-bold focus:border-[#FFB800] outline-none" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Tipo de Canal</label>
                      <select value={campType} onChange={(e) => setCampType(e.target.value)} className="w-full p-4 bg-bg-base border border-border-subtle rounded-2xl text-text-primary text-sm font-bold focus:border-[#FFB800] outline-none appearance-none">
                        <option value="email">Marketing via Email (SMTP)</option>
                        <option value="whatsapp">Marketing via WhatsApp (API)</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 ml-1">Mensagem do Marketing</label>
                      <textarea value={campMessage} onChange={(e) => setCampMessage(e.target.value)} required rows={4} placeholder="Olá! Vimos que ainda não testou os nossos planos..." className="w-full p-4 bg-bg-base border border-border-subtle rounded-2xl text-text-primary text-sm font-bold focus:border-[#FFB800] outline-none" />
                   </div>
                   <div className="flex gap-4">
                      <button type="button" onClick={() => setShowCampaignForm(false)} className="flex-1 py-4 bg-bg-base border border-border-subtle rounded-2xl text-sm font-bold text-text-secondary">Cancelar</button>
                      <button type="submit" className="flex-1 py-4 bg-[#FFB800] text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FFB800]/20"><Check size={18} /> Salvar Campanha</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-12 py-6 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Servidor Activo • Conversio Engine v2026.05.05</span>
        </div>
        <div className="text-[10px] text-text-tertiary font-bold">
          © 2026 Conversio AI • Zero-Touch Marketing Architecture
        </div>
      </footer>
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
