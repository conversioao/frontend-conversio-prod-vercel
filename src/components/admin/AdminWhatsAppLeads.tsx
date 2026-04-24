import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, Search, Filter, MessageSquare, User, Briefcase, Target, 
  Send, Bot, UserCheck, Clock, CheckCircle2, AlertCircle,
  ToggleLeft, ToggleRight, MessageCircle, X, ChevronRight,
  Shield, Brain, Zap, ArrowRight, RefreshCcw, Layers, Save, Cpu
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
  role: 'user' | 'agent' | 'human';
  content: string;
  created_at: string;
}

export default function AdminWhatsAppLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [agentGlobalEnabled, setAgentGlobalEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'settings'>('leads');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [instanceStatus, setInstanceStatus] = useState<any>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    inProgress: 0,
    messagesToday: 0
  });

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setAgentGlobalEnabled(data.agentEnabled);
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
        const [promptRes, phoneRes, statusRes] = await Promise.all([
          fetch(`${BASE_URL}/admin/whatsapp/config/whatsapp_agent_prompt`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          }),
          fetch(`${BASE_URL}/admin/whatsapp/config/admin_whatsapp`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          }),
          fetch(`${BASE_URL}/admin/whatsapp/instance-status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
          })
        ]);

        const promptData = await promptRes.json();
        const phoneData = await phoneRes.json();
        const statusData = await statusRes.json();

        if (promptData.success) setAgentPrompt(promptData.value);
        if (phoneData.success) setAdminPhone(phoneData.value);
        if (statusData.success) setInstanceStatus(statusData);

    } catch (e) { console.error('Error fetching config:', e); }
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
      const res = await fetch(`${BASE_URL}/admin/whatsapp/leads/${leadId}/messages`, {
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
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [filter]);

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
    <div className="h-screen flex flex-col bg-[#050A08] text-white font-sans selection:bg-[#FFB800]/30 overflow-hidden">
      
      {/* Top Navigation Bar: Minimalist & Brand-Consistent */}
      <div className="flex items-center justify-between gap-6 px-6 h-16 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              Gestor de Leads <span className="text-[#FFB800] ml-1">v2</span>
            </h2>
          </div>

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
            {[
              { id: 'leads', label: 'Conversas' },
              { id: 'settings', label: 'IA Config' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' 
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-4 px-4 py-1.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className={`w-2 h-2 rounded-full ${agentGlobalEnabled ? 'bg-[#FFB800] animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Agente Central</span>
              <button
                onClick={() => updateGlobalConfig('whatsapp_agent_enabled', !agentGlobalEnabled)}
                className="ml-1 text-white/20 hover:text-[#FFB800] transition-colors"
              >
                {agentGlobalEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
           </div>

          <button 
            onClick={() => { fetchLeads(); fetchConfig(); }}
            className="p-2 text-white/20 hover:text-white transition-all"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leads' ? (
          <motion.div 
            key="leads-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex overflow-hidden"
          >
            {/* Sidebar: Clean Lead Explorer */}
            <div className="w-80 flex flex-col border-r border-white/5 bg-black/10">
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-[#FFB800]/30 transition-all placeholder:text-white/10"
                  />
                </div>

                <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar border-b border-white/10">
                  {['all', 'new', 'in_progress', 'qualified'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                        filter === s 
                          ? 'text-[#FFB800] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#FFB800]' 
                          : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      {s === 'all' ? 'Todos' : s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 border-b border-white/[0.02] cursor-pointer transition-all duration-200 flex items-center gap-3 relative ${
                      selectedLead?.id === lead.id 
                        ? 'bg-[#FFB800]/[0.03] border-l-2 border-l-[#FFB800]' 
                        : 'bg-transparent hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      selectedLead?.id === lead.id ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'bg-white/5 text-white/30'
                    }`}>
                      {lead.name ? lead.name[0].toUpperCase() : <User size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`text-xs font-bold truncate ${selectedLead?.id === lead.id ? 'text-white' : 'text-white/70'}`}>
                          {lead.name || lead.phone}
                        </h3>
                        <span className="text-[9px] text-white/20 font-medium">
                          {new Date(lead.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] text-white/30 font-bold truncate leading-none">{lead.phone}</span>
                         {getStatusBadge(lead.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Compact Stats at Bottom of Sidebar */}
              <div className="p-4 border-t border-white/5 bg-black/20 space-y-3">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
                   <span>Pipeline Total</span>
                   <span className="text-white/60">{leads.length}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#FFB800]/60">
                   <span>Qualificados</span>
                   <span className="text-[#FFB800]">{stats.qualified}</span>
                 </div>
              </div>
            </div>

            {/* Neural Terminal: Minimalist Dark Chat */}
            <div className="flex-1 flex flex-col bg-[#080E0C] relative">
              <AnimatePresence mode="wait">
                {selectedLead ? (
                  <motion.div 
                    key={selectedLead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    {/* Compact Chat Header */}
                    <div className="px-6 h-16 border-b border-white/5 bg-black/10 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-bold text-[#FFB800] text-sm">
                            {selectedLead.name ? selectedLead.name[0].toUpperCase() : 'L'}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white/90">{selectedLead.name || 'Terminal Ativo'}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[10px] font-bold text-white/30">{selectedLead.phone}</span>
                               <span className="text-[9px] text-[#FFB800] font-black uppercase tracking-[0.2em] animate-pulse">• Neural Active</span>
                            </div>
                          </div>
                       </div>
                       <button 
                        onClick={() => toggleLeadAgent(selectedLead)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                          selectedLead.agent_active 
                            ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' 
                            : 'bg-white/5 border-white/10 text-white/20'
                        }`}
                       >
                         {selectedLead.agent_active ? <Zap size={14} /> : <UserCheck size={14} />}
                         {selectedLead.agent_active ? 'AI Activa' : 'Manual'}
                       </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#050A08]">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[75%] p-4 px-5 rounded-2xl shadow-sm border ${
                            msg.role === 'user' 
                              ? 'bg-white/[0.05] border-white/5 rounded-tl-none text-white/80' 
                              : 'bg-[#FFB800] border-transparent text-black font-semibold rounded-tr-none'
                          }`}>
                             <div className="flex items-center justify-between gap-6 mb-1.5 opacity-40">
                                <span className="text-[8px] uppercase font-black tracking-widest">
                                    {msg.role === 'user' ? 'Cliente' : 'Alex IA'}
                                </span>
                                <span className="text-[8px] font-medium">
                                   {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                             <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-center p-2 opacity-20">
                           <RefreshCcw className="animate-spin text-white" size={20} />
                        </div>
                      )}
                    </div>

                    {/* Input Area Streamlined */}
                    <div className="p-4 bg-black/20 border-t border-white/5">
                      <form onSubmit={handleSendMessage} className="flex gap-3 relative px-2">
                        <input 
                          type="text" 
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Injectar comando ou responder..."
                          className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl py-3.5 px-5 text-sm font-medium focus:outline-none focus:border-[#FFB800]/30 transition-all placeholder:text-white/10"
                        />
                        <button type="submit" disabled={!messageInput.trim()} className="bg-[#FFB800] text-black px-8 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:grayscale transition-all hover:bg-[#FFC940]">
                          Enviar
                        </button>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                    <MessageSquare size={48} className="text-white mb-4" />
                    <h3 className="text-xl font-bold uppercase tracking-widest italic">Terminal Offline</h3>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Intel Panel: Integrated Information Column */}
            <div className="w-80 flex flex-col border-l border-white/5 bg-black/10 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {selectedLead && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 flex flex-col gap-8"
                  >
                    <div className="flex flex-col gap-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFB800] flex items-center gap-2">
                         <div className="w-4 h-1 bg-[#FFB800] rounded-full"></div> Intel Extract
                       </h4>
                       
                       <div className="space-y-6">
                         <div>
                           <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-2">Vertical de Negócio</label>
                           <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 text-[12px] text-white/80 font-bold tracking-tight">
                             {selectedLead.business_info || 'Scanning...'}
                           </div>
                         </div>
                         
                         <div>
                           <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-2">Padrões de Interesse</label>
                           <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 text-[12px] text-white/60 font-medium leading-relaxed italic">
                             {selectedLead.needs || 'Analyzing sentiment...'}
                           </div>
                         </div>
                       </div>

                       <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                             <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Classificação</span>
                             {getStatusBadge(selectedLead.status)}
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-8">
                       <button className="w-full py-4 bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FFB800]/20 transition-all">Forçar Conversão</button>
                       <button className="w-full py-4 bg-white/5 border border-white/10 text-white/40 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all text-center">Assumir Controlo</button>
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
            className="flex-1 flex flex-col p-12 overflow-hidden bg-[#050A08]"
          >
            <div className="flex items-center justify-between mb-12">
               <div>
                 <h3 className="text-2xl font-bold tracking-tighter uppercase italic">Neural Protocol Center</h3>
                 <p className="text-white/20 text-[10px] font-black tracking-[0.5em] uppercase mt-2">Configuração da Identidade de Resposta</p>
               </div>
               <button 
                onClick={() => updateGlobalConfig('whatsapp_agent_prompt', agentPrompt)}
                className="px-10 py-4 bg-[#FFB800] text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#FFC940] transition-all"
               >
                 Actualizar Cérebro
               </button>
            </div>

            <div className="flex-1 flex gap-10 overflow-hidden">
               <textarea 
                  value={agentPrompt}
                  onChange={(e) => setAgentPrompt(e.target.value)}
                  className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-8 text-base font-semibold text-white/80 focus:outline-none focus:border-[#FFB800]/40 transition-all resize-none custom-scrollbar leading-relaxed"
                  placeholder="Defina as diretrizes aqui..."
               />
               <div className="w-80 flex flex-col gap-6">
                   <div className="p-8 bg-white/[0.03] border border-white/5 rounded-2xl">
                      <h6 className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-6">Neural Webhook</h6>
                      <button onClick={setupWebhook} className="w-full py-4 bg-white/5 border border-white/10 text-white/60 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Sincronizar Canal</button>
                   </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      in_progress: 'Analysing',
      qualified: 'Lead Gold',
      converted: 'Convertido',
      human: 'Manual'
    };
    return (
      <span className={`px-3 py-1 rounded-lg text-[8px] font-black border uppercase tracking-widest leading-none ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };
