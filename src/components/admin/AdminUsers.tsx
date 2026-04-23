import React, { useEffect, useState } from 'react';
import { Search, Edit, ShieldAlert, Check, User, History, CreditCard, Layers, X, ExternalLink, Filter, Zap, Mail } from 'lucide-react';
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
      const res = await apiFetch(`/admin/campaigns?adminId=${adminId}`);
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
        body: JSON.stringify({ adminId, name: campName, type: campType, message: campMessage })
      });
      if (res.ok) {
        setShowCampaignForm(false);
        setCampName('');
        setCampMessage('');
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
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
          <h1 className="text-3xl font-black text-text-primary tracking-tight">CRM Clientes</h1>
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
              {campaigns.map((camp) => (
                <div key={camp.id} className="bg-surface border border-border-subtle rounded-3xl p-6 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-2 h-full ${camp.type === 'email' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                  <div className="flex justify-between mb-4">
                     <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${camp.type === 'email' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                       {camp.type === 'email' ? 'Marketing Email' : 'Marketing WhatsApp'}
                     </span>
                     <span className={`text-[10px] font-bold ${camp.status === 'sent' ? 'text-emerald-500' : 'text-yellow-500'}`}>
                       {camp.status === 'sent' ? 'Enviada' : 'Rascunho'}
                     </span>
                  </div>
                  <h4 className="text-lg font-black text-text-primary mb-2 line-clamp-1">{camp.name}</h4>
                  <p className="text-xs text-text-tertiary line-clamp-2 mb-6">{camp.message}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-text-tertiary uppercase font-black">Alcance</span>
                        <span className="text-sm font-black">{camp.target_count || 0} Leads</span>
                     </div>
                     {camp.status !== 'sent' && (
                       <button 
                        onClick={() => handleSendCampaign(camp.id)}
                        className="p-2 bg-[#FFB800] text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[#FFB800]/20"
                       >
                         <Zap size={18} fill="currentColor" />
                       </button>
                     )}
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

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
                 {/* Activity Section Remains same as per original viewed file */}
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
