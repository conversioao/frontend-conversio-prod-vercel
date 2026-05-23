import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, Search, Filter, MessageSquare, User, Briefcase, Target, 
  Send, Bot, UserCheck, Clock, CheckCircle2, AlertCircle,
  ToggleLeft, ToggleRight, MessageCircle, X, ChevronRight,
  Shield, Brain, Zap, ArrowRight, RefreshCcw, Layers, Save, Cpu, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api';

console.log('AdminWhatsAppLeads Loaded Correctly');

interface Lead {
  id: string;
  phone: string;
  name: string;
  business_info: string;
  needs: string;
  status: 'new' | 'in_progress' | 'qualified' | 'converted' | 'human';
  agent_active: boolean;
  last_interaction: string;
  created_at: string;
}

interface Message {
  id: number;
  role: 'user' | 'agent' | 'human' | 'system';
  content: string;
  instance_name?: string;
  created_at: string;
}

interface AdminWhatsAppLeadsProps {
  onClose?: () => void;
  initialLeadId?: string | null;
}

export default function AdminWhatsAppLeads({ onClose, initialLeadId }: AdminWhatsAppLeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [agentGlobalEnabled, setAgentGlobalEnabled] = useState(true);
  const [chatInstanceType, setChatInstanceType] = useState<'agent' | 'system'>('agent');
  const [activeTab, setActiveTab] = useState<'leads' | 'settings'>('leads');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentName, setAgentName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [instanceStatus, setInstanceStatus] = useState<any>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingAgentConfig, setIsSavingAgentConfig] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState('venda');
  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    inProgress: 0,
    messagesToday: 0
  });

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads?status=${filter}&instance=${selectedInstance}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setAgentGlobalEnabled(data.agentEnabled);
        
        // Calculate stats for current view
        setStats({
          total: data.leads.length,
          qualified: data.leads.filter((l: any) => l.status === 'qualified').length,
          inProgress: data.leads.filter((l: any) => l.status === 'in_progress').length,
          messagesToday: 0 // Fetching real message count would require a separate query or count in logs
        });
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
        const [agentConfigRes, phoneRes, statusRes] = await Promise.all([
          fetch(`${BASE_URL}/admin/whatsapp/agent-config/${selectedInstance}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          }),
          fetch(`${BASE_URL}/admin/whatsapp/config/admin_whatsapp`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          }),
          fetch(`${BASE_URL}/admin/whatsapp/instance-status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          })
        ]);

        const agentConfigData = await agentConfigRes.json();
        const phoneData = await phoneRes.json();
        const statusData = await statusRes.json();

        if (agentConfigData.success) {
          setAgentPrompt(agentConfigData.agent.system_prompt || '');
          setAgentName(agentConfigData.agent.name || '');
        }
        if (phoneData.success) setAdminPhone(phoneData.value);
        if (statusData.success) setInstanceStatus(statusData);

    } catch (e) { console.error('Error fetching config:', e); }
  };

  const [syncing, setSyncing] = useState(false);

  const syncChats = async () => {
    if (!instanceStatus?.status?.instanceName) {
      alert('Aguarde o carregamento do status da instância.');
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ instanceName: selectedInstance })
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
        alert(`Sincronização concluída! ${data.syncedCount} conversas processadas.`);
      } else {
        alert(`Erro na sincronização: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao sincronizar com Evolution API.');
    } finally {
      setSyncing(false);
    }
  };

  const updateGlobalConfig = async (key: string, value: any) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
          if (key === 'whatsapp_agent_enabled') setAgentGlobalEnabled(value);
          if (key === 'admin_whatsapp') setAdminPhone(value);
          if (key === 'whatsapp_agent_prompt') alert('Conhecimento atualizado com sucesso!');
          fetchLeads();
          fetchConfig();
      }
    } catch (e) { console.error(e); }
    finally { setIsSavingConfig(false); }
  };

  const saveAgentConfig = async () => {
    setIsSavingAgentConfig(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/agent-config/${selectedInstance}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ name: agentName, system_prompt: agentPrompt })
      });
      const data = await res.json();
      if (data.success) {
        alert('Configurações do agente salvas com sucesso!');
        fetchConfig();
      } else {
        alert(`Erro ao salvar: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao conectar com o servidor.');
    } finally {
      setIsSavingAgentConfig(false);
    }
  };

  const setupWebhook = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/setup-webhook`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchConfig();
      } else {
        alert('Erro ao ativar: ' + data.message);
      }
    } catch (e) { console.error(e); }
    finally { setIsSavingConfig(false); }
  };

  const fetchMessages = async (leadId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads/${leadId}/messages?instance=${selectedInstance}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchConfig();
    // Reset conversation panel when switching instances
    setSelectedLead(null);
    setMessages([]);
    const interval = setInterval(fetchLeads, 5000);
    return () => clearInterval(interval);
  }, [filter, selectedInstance]);

  // Auto-sync contacts when instance is available
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  useEffect(() => {
    if (instanceStatus?.status?.instanceName && !hasAutoSynced) {
      setHasAutoSynced(true);
      syncChats();
    }
  }, [instanceStatus?.status?.instanceName, hasAutoSynced]);

  useEffect(() => {
    if (initialLeadId && leads.length > 0) {
      const lead = leads.find(l => String(l.id) === String(initialLeadId));
      if (lead) {
        setSelectedLead(lead);
      }
    }
  }, [initialLeadId, leads]);

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id);
      const interval = setInterval(() => fetchMessages(selectedLead.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedLead?.id]);

  const toggleLeadAgent = async (lead: Lead) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads/${lead.id}/toggle-agent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ active: !lead.agent_active })
      });
      if (res.ok) {
        fetchLeads();
        if (selectedLead?.id === lead.id) {
            setSelectedLead({ ...selectedLead, agent_active: !lead.agent_active });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !messageInput.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads/${selectedLead.id}/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` 
        },
        body: JSON.stringify({ text: messageInput })
      });
      const data = await res.json();
      if (data.success) {
        setMessageInput('');
        fetchMessages(selectedLead.id);
        fetchLeads();
      }
    } catch (e) { console.error(e); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black border border-blue-500/30 uppercase tracking-widest">Novo</span>;
      case 'in_progress': return <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-[9px] font-black border border-yellow-500/30 uppercase tracking-widest">Qualificando</span>;
      case 'qualified': return <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-500/30 uppercase tracking-widest">Qualificado</span>;
      case 'converted': return <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[9px] font-black border border-purple-500/30 uppercase tracking-widest">Convertido</span>;
      case 'human': return <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[9px] font-black border border-orange-500/30 uppercase tracking-widest">Humano</span>;
      default: return null;
    }
  };

  const filteredLeads = leads.filter(l => 
    l.phone.includes(search) || 
    (l.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans overflow-hidden"
    >
       {/* Minimalist Header */}
      <div className="h-20 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight">CRM & Leads</h1>
            <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
              {instanceStatus?.instances ? (
                instanceStatus.instances.map((inst: any, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedInstance(inst.instanceName)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      selectedInstance === inst.instanceName 
                        ? 'bg-zinc-800 text-[#FFB800] border border-zinc-700 shadow-lg' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${inst.state === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] uppercase tracking-widest font-black">
                      {inst.label}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium px-4">Carregando...</p>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800 mx-2 hidden sm:block"></div>

          <div className="flex bg-zinc-900 p-1 rounded-xl">
            {[
              { id: 'leads', label: 'Conversas' },
              { id: 'settings', label: 'Protocolos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-[#FFB800]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
            <div className={`w-2 h-2 rounded-full ${agentGlobalEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">IA {agentGlobalEnabled ? 'Ativa' : 'Pausada'}</span>
            <button
               onClick={() => updateGlobalConfig('whatsapp_agent_enabled', !agentGlobalEnabled)}
               className="ml-2"
             >
               {agentGlobalEnabled ? (
                 <ToggleRight className="text-[#FFB800]" size={20} />
               ) : (
                 <ToggleLeft className="text-zinc-600" size={20} />
               )}
             </button>
          </div>

          <button
            onClick={syncChats}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-2 bg-[#FFB800] text-black font-bold text-[11px] rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            <RefreshCcw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button 
            onClick={() => onClose ? onClose() : (window.location.href = '/admin')}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex h-full overflow-hidden">

      <AnimatePresence mode="wait">
        {activeTab === 'leads' ? (
          <motion.div 
            key="leads-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex overflow-hidden"
          >
            {/* Sidebar: Minimalist Lead Explorer */}
            <div className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-950 shrink-0">
              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#FFB800]/50 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar border-b border-zinc-900">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'new', label: 'Novos' },
                    { id: 'in_progress', label: 'Análise' },
                    { id: 'qualified', label: 'Vendas' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFilter(s.id)}
                      className={`pb-2 text-[10px] font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                        filter === s.id 
                          ? 'text-[#FFB800] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#FFB800]' 
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-8 space-y-1">
                {filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full p-4 rounded-xl transition-all flex items-center gap-4 text-left ${
                      selectedLead?.id === lead.id 
                        ? 'bg-zinc-900 border border-zinc-800' 
                        : 'hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      selectedLead?.id === lead.id 
                        ? 'bg-[#FFB800] text-black' 
                        : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {lead.name ? lead.name[0].toUpperCase() : <User size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold truncate text-white">
                          {lead.name || lead.phone}
                        </h3>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(lead.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[11px] text-zinc-500">{lead.phone}</span>
                         {getStatusBadge(lead.status)}
                      </div>
                    </div>
                  </button>
                ))}

                {filteredLeads.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Search size={40} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sem resultados</p>
                  </div>
                )}
              </div>
              
              {/* Premium Dashboard Metrics at Bottom */}
              <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-2xl grid grid-cols-2 gap-4">
                 <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Total Pipeline</p>
                    <p className="text-xl font-black text-white">{leads.length}</p>
                 </div>
                 <div className="bg-[#FFB800]/5 p-4 rounded-2xl border border-[#FFB800]/10">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#FFB800]/40 mb-1">Qualificados</p>
                    <p className="text-xl font-black text-[#FFB800]">{stats.qualified}</p>
                 </div>
              </div>
            </div>

            {/* Main Chat Terminal: Fullscreen Neural View */}
            <div className="flex-1 flex flex-col bg-[#050706] relative shadow-2xl z-10">
              <AnimatePresence mode="wait">
                {selectedLead ? (
                  <motion.div 
                    key={selectedLead.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    {/* Simplified Chat Header */}
                    <div className="px-8 h-20 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center font-bold text-[#FFB800]">
                            {selectedLead.name ? selectedLead.name[0].toUpperCase() : 'L'}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white leading-none mb-1">{selectedLead.name || 'Terminal'}</h3>
                            <div className="flex items-center gap-2">
                               <span className="text-[11px] text-zinc-500">{selectedLead.phone}</span>
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                               <span className="text-[10px] text-emerald-500/80 font-medium uppercase tracking-wider">Sync Active</span>
                            </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                          <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Feed Unificado</span>
                          </div>
                          <button 
                            onClick={() => toggleLeadAgent(selectedLead)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[11px] uppercase transition-all ${
                              selectedLead.agent_active 
                                ? 'bg-zinc-900 text-[#FFB800] border border-zinc-800' 
                                : 'bg-emerald-600 text-white hover:bg-emerald-500'
                            }`}
                          >
                            {selectedLead.agent_active ? <Zap size={14} /> : <UserCheck size={14} />}
                            {selectedLead.agent_active ? 'Pausar IA' : 'Ativar IA'}
                          </button>
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-950">
                      {messages.map((msg, idx) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[80%]`}>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                              msg.role === 'user' 
                                ? 'bg-zinc-900 text-zinc-300' 
                                : msg.role === 'system'
                                   ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                   : 'bg-zinc-100 text-black font-medium'
                            }`}>
                               <div className="flex items-center justify-between gap-8 mb-2 opacity-40 text-[9px] uppercase font-bold tracking-wider">
                                  <span>
                                    {msg.role === 'user' ? 'Cliente' : 
                                     msg.role === 'system' ? 'Sistema (Conversio)' :
                                     msg.role === 'human' ? 'Operador Humano' : 'Alex (IA)'}
                                     {msg.instance_name && ` • ${msg.instance_name}`}
                                  </span>
                                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               </div>
                               <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {chatLoading && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                           <RefreshCcw className="animate-spin text-white" size={40} />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Acedendo ao Histórico...</span>
                        </div>
                      )}
                    </div>

                    {/* Minimalist Input */}
                    <div className="p-6 bg-zinc-950">
                      <form onSubmit={handleSendMessage} className="flex gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-zinc-700 transition-all">
                        <input 
                          type="text" 
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Responder manualmente..."
                          className="flex-1 bg-transparent border-none py-2 px-3 text-sm focus:outline-none placeholder:text-zinc-600"
                        />
                        <button 
                          type="submit" 
                          disabled={!messageInput.trim()} 
                          className="bg-[#FFB800] text-black px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-30 transition-all hover:bg-[#FFD700]"
                        >
                          Enviar
                        </button>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center bg-[#050706]">
                    <div className="relative mb-8">
                       <div className="absolute inset-0 bg-[#FFB800] blur-3xl opacity-5"></div>
                       <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center relative">
                          <Brain size={48} className="text-white/10" />
                       </div>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-[0.5em] text-white/20 italic">Select a Terminal</h3>
                    <p className="text-[10px] font-bold text-white/5 uppercase tracking-widest mt-4">Aguarda monitorização ativa de leads</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
                     {/* Intelligence Panel: Clean */}
            <div className="w-80 flex flex-col border-l border-zinc-800 bg-zinc-950 shrink-0">
              <AnimatePresence>
                {selectedLead && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 flex flex-col gap-8 h-full"
                  >
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Dados do Lead</h4>
                       
                       <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-medium uppercase text-zinc-600 block mb-2">Negócio</label>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                              {selectedLead.business_info || 'Analisando...'}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-[10px] font-medium uppercase text-zinc-600 block mb-2">Necessidades</label>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-xs text-zinc-400 italic">
                              "{selectedLead.needs || 'Aguardando interação...'}"
                            </div>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-medium uppercase text-zinc-600">Estado</span>
                             {getStatusBadge(selectedLead.status)}
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-medium uppercase text-zinc-600">Desde</span>
                             <span className="text-[10px] text-zinc-400">{new Date(selectedLead.created_at).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mt-auto space-y-2">
                       <button className="w-full py-3 bg-[#FFB800] text-black rounded-lg font-bold text-[11px] uppercase tracking-wider hover:opacity-90">Forçar Venda</button>
                       <button className="w-full py-3 bg-zinc-900 text-zinc-400 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:text-white transition-all">Exportar Dados</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="settings-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col p-12 overflow-y-auto bg-zinc-950"
          >
            <div className="max-w-4xl mx-auto w-full space-y-12">
              <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-2xl font-bold text-white mb-2">Protocolos do Agente</h3>
                   <p className="text-zinc-500 text-sm">Configure o comportamento e conhecimento do agente (IA).</p>
                 </div>
                 <button 
                  onClick={saveAgentConfig}
                  disabled={isSavingAgentConfig}
                  className="px-8 py-3 bg-[#FFB800] text-black rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2"
                 >
                   {isSavingAgentConfig ? <RefreshCcw className="animate-spin" size={14} /> : <Save size={14} />}
                   Guardar Alterações
                 </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                       <h4 className="text-sm font-bold text-white mb-2">Cérebro e Personalidade</h4>
                       <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                         Defina como o agente deve interagir. Use português de Angola (pt-AO) e mantenha um tom profissional mas acessível.
                       </p>
                       <div className="space-y-2">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Nome do Agente</label>
                          <input 
                             type="text"
                             value={agentName}
                             onChange={(e) => setAgentName(e.target.value)}
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-[#FFB800]/30 transition-all"
                             placeholder="Nome do agente (ex: Alex, Carlos...)"
                          />
                       </div>
                    </div>
                    
                    <textarea 
                       value={agentPrompt}
                       onChange={(e) => setAgentPrompt(e.target.value)}
                       className="w-full h-96 bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-sm text-zinc-300 focus:outline-none focus:border-[#FFB800]/30 transition-all resize-none leading-relaxed"
                       placeholder="Instruções do sistema..."
                    />
                 </div>

                 <div className="space-y-6">
                    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">
                       <div className="flex items-center gap-2 text-[#FFB800]">
                          <Zap size={18} />
                          <h6 className="text-xs font-bold uppercase tracking-wider">Conexão Real-time</h6>
                       </div>
                       <p className="text-xs text-zinc-500 leading-relaxed">Active o Webhook para respostas instantâneas.</p>
                       <button onClick={setupWebhook} disabled={isSavingConfig} className="w-full py-3 bg-zinc-800 text-zinc-300 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-700 transition-all">
                         {isSavingConfig ? 'Sincronizando...' : 'Configurar Webhook'}
                       </button>
                    </div>
                    
                    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">
                       <h6 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status do Sistema</h6>
                       <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Auto-Nutrição</span>
                            <span className="text-[9px] text-emerald-500 font-bold">ON</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Smart Upsell</span>
                            <span className="text-[9px] text-emerald-500 font-bold">ON</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}

const getStatusBadge = (status: string) => {
    const styles: any = {
      new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      qualified: 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20',
      converted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      human: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };
    const labels: any = {
      new: 'Novo',
      in_progress: 'Análise',
      qualified: 'Venda',
      converted: 'Convertido',
      human: 'Manual'
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[9px] font-bold border uppercase tracking-wider leading-none ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };
