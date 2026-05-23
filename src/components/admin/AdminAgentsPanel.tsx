import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Video, 
  Image as ImageIcon, 
  Music, 
  Search, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Copy, 
  Download, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Settings,
  FileCode,
  Layout,
  Layers,
  Sparkles,
  BarChart3,
  Cpu,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';

type CategoryType = 'all' | 'engine' | 'analyzer' | 'video' | 'image' | 'music';

interface PromptAgent {
  id: number;
  technical_id?: string;
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  user_prompt_template?: string;
  few_shot_examples: string;
  model_id: string;
  params: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  is_active: boolean;
  created_at?: string;
}

const CATEGORIES: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'Todos os Agentes', icon: <Layers size={20} />, color: 'white' },
  { id: 'engine', label: 'Engine CORE', icon: <Cpu size={20} />, color: 'orange' },
  { id: 'analyzer', label: 'LuandaLooks/Visão', icon: <BarChart3 size={20} />, color: 'emerald' },
  { id: 'video', label: 'Vídeo AI', icon: <Video size={20} />, color: 'blue' },
  { id: 'image', label: 'Imagem Flux', icon: <ImageIcon size={20} />, color: 'violet' },
  { id: 'music', label: 'Voz/Música', icon: <Music size={20} />, color: 'pink' },
];

interface AdminAgentsPanelProps {
  onClose?: () => void;
}

export function AdminAgentsPanel({ onClose }: AdminAgentsPanelProps) {
  const [agents, setAgents] = useState<PromptAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedAgent, setSelectedAgent] = useState<PromptAgent | null>(null);
  const [editForm, setEditForm] = useState<Partial<PromptAgent>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/prompt-agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar agentes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSelectAgent = (agent: PromptAgent) => {
    setSelectedAgent(agent);
    setEditForm({ ...agent });
  };

  const handleUpdate = async () => {
    if (!selectedAgent || !editForm.name) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`/admin/prompt-agents/${selectedAgent.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setAgents(agents.map(a => a.id === selectedAgent.id ? data.agent : a));
        setSelectedAgent(data.agent);
        showToast('Agente atualizado com sucesso!');
      }
    } catch (err) {
      showToast('Erro ao salvar agente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!editForm.name || !editForm.category || !editForm.system_prompt) {
        showToast('Preencha os campos obrigatórios.', 'error');
        return;
    }
    setIsSaving(true);
    try {
      const res = await apiFetch('/admin/prompt-agents', {
        method: 'POST',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setAgents([...agents, data.agent]);
        setShowModal(false);
        showToast('Novo agente criado!');
        handleSelectAgent(data.agent);
      }
    } catch (err) {
      showToast('Erro ao criar agente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este agente?')) return;
    try {
      const res = await apiFetch(`/admin/prompt-agents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAgents(agents.filter(a => a.id !== id));
        if (selectedAgent?.id === id) {
          setSelectedAgent(null);
          setEditForm({});
        }
        showToast('Agente eliminado.');
      }
    } catch (err) {
      showToast('Erro ao eliminar agente.', 'error');
    }
  };

  const handleDuplicate = async () => {
    if (!selectedAgent) return;
    const duplicatedAgent = { ...selectedAgent, name: `${selectedAgent.name} (Cópia)`, id: undefined };
    setEditForm(duplicatedAgent);
    setShowModal(true);
  };

  const exportJSON = () => {
    if (!editForm) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editForm, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${editForm.name}_config.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredAgents = selectedCategory === 'all' ? agents : agents.filter(a => a.category === selectedCategory);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[#050706] text-white flex flex-col font-sans animation-fade-in">
      
      {/* NASA Top HUD Bar */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-3xl shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <Bot className="text-[#FFB800] animate-pulse" size={32} />
             <div>
               <h1 className="text-2xl font-black text-text-primary uppercase tracking-tighter">AGENT_CORE_MANAGER</h1>
               <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.3em]">Conversio OS v2.4 // NASA_PROTO_HUD</p>
             </div>
          </div>
          <div className="h-8 w-px bg-white/10 hidden md:block"></div>
          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <Activity size={12} /> Sistemas_Nominais
             </div>
             <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 text-[10px] font-black uppercase tracking-widest">
                <Cpu size={12} /> CPU_64_CORES
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
                setEditForm({ category: selectedCategory, is_active: true, params: { temperature: 0.7, max_tokens: 2000 } });
                setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#FFB800] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,184,0,0.2)]"
          >
            <Plus size={18} /> Novo_Agente
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

      <div className="flex-1 flex overflow-hidden">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="text-sm font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {/* Sidebar - Categorias */}
      <aside className="w-24 md:w-56 bg-black/30 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center md:items-stretch py-6 shrink-0">

        <nav className="flex-1 w-full space-y-1 px-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-5 py-4 rounded-2xl transition-all duration-300 group ${selectedCategory === cat.id ? 'bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800]' : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'}`}
            >
              <div className={`shrink-0 transition-transform duration-300 ${selectedCategory === cat.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {cat.icon}
              </div>
              <div className="flex-1 text-left">
                <span className="text-[10px] md:text-sm font-black uppercase tracking-widest md:tracking-normal block">{cat.label}</span>
                <span className="text-[8px] font-bold opacity-40">{agents.filter(a => a.category === cat.id).length} Agentes</span>
              </div>
            </button>
          ))}
        </nav>

      </aside>

      {/* Área Central - Lista de Cards */}
      <main className="flex-1 flex flex-col min-w-0 bg-bg-base/20">
        {/* Header da Área Central */}
        <header className="h-24 border-b border-white/5 px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight capitalize">{selectedCategory}</h2>
            <p className="text-xs text-text-tertiary font-medium">{filteredAgents.length} Agentes nesta categoria</p>
          </div>
          <button 
            onClick={() => {
                setEditForm({ category: selectedCategory, is_active: true, params: { temperature: 0.7, max_tokens: 2000 } });
                setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#FFB800] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#FFB800]/20"
          >
            <Plus size={18} /> Novo Agente
          </button>
        </header>

        {/* Grid de Cards */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {filteredAgents.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Sparkles size={64} className="mb-4 text-text-tertiary" />
                <p className="text-lg font-bold text-text-secondary">Nenhum agente configurado</p>
                <p className="text-sm">Crie o primeiro agente de {selectedCategory} para começar.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredAgents.map(agent => (
                 <div
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className={`group relative p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${selectedAgent?.id === agent.id ? 'bg-[#FFB800]/10 border-[#FFB800]/30 shadow-2xl scale-[1.02]' : 'bg-surface/30 border-white/5 hover:border-white/10 hover:bg-surface/50'}`}
                 >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${selectedAgent?.id === agent.id ? 'bg-[#FFB800] text-black' : 'bg-bg-base border-white/10 text-[#FFB800]'}`}>
                        <Cpu size={24} />
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${agent.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {agent.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {agent.is_active ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-text-primary mb-1 tracking-tight line-clamp-1">{agent.name}</h3>
                    {agent.technical_id && (
                      <p className="text-[9px] font-mono text-[#FFB800] uppercase tracking-widest mb-2 opacity-70">ID: {agent.technical_id}</p>
                    )}
                    <p className="text-xs text-text-secondary mb-6 line-clamp-2 leading-relaxed min-h-[32px]">{agent.description}</p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                       <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                         {agent.model_id || 'Modelo Padrão'}
                       </span>
                    </div>

                    <div className={`absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 ${selectedAgent?.id === agent.id ? 'opacity-100 translate-x-0' : ''}`}>
                       <ChevronRight className="text-[#FFB800]" size={20} />
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </main>

      {/* Modal de Edição de Agente (Expandido) */}
      <AnimatePresence>
        {(selectedAgent || showModal) && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl transition-all overflow-y-auto custom-scrollbar">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative flex flex-col max-h-[92vh]"
            >
              {/* Header do Modal */}
              <header className="h-24 border-b border-white/5 px-10 flex items-center justify-between shrink-0 bg-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800] shadow-[0_0_30px_rgba(255,184,0,0.1)]">
                    {showModal && !selectedAgent ? <Plus size={24} /> : <Settings size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-text-primary tracking-tighter uppercase">
                      {showModal && !selectedAgent ? 'Criar Novo Agente Inteligente' : `Editor: ${editForm.name}`}
                    </h2>
                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.3em]">Refinamento de Lógica & Prompt Engineering</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedAgent && (
                    <button 
                      onClick={handleDuplicate}
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                    >
                      <Copy size={14} /> Duplicar
                    </button>
                  )}
                  <button 
                    onClick={() => {
                        setSelectedAgent(null);
                        setShowModal(false);
                        setEditForm({});
                    }} 
                    className="p-3 bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-2xl transition-all border border-white/5"
                  >
                    <X size={24} />
                  </button>
                </div>
              </header>

              {/* Corpo do Modal - Scrollable */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Coluna Esquerda: Configurações Básicas */}
                  <div className="lg:col-span-4 space-y-8">
                    <section className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                      <h4 className="text-[11px] font-black text-[#FFB800] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                         <Layout size={16} /> Identidade do Agente
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="p-5 bg-accent/5 border border-accent/20 rounded-2.5xl">
                          <label className="text-[9px] font-black text-accent uppercase tracking-widest mb-2 block">ID Técnico (Slug Único)</label>
                          <input 
                            type="text" 
                            placeholder="ex: boutique-fashion"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-accent focus:border-accent/50 outline-none transition-all"
                            value={editForm.technical_id || ''}
                            onChange={e => setEditForm({...editForm, technical_id: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-2 block px-1">Nome de Exibição</label>
                          <input 
                            type="text" 
                            className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-text-primary focus:border-[#FFB800]/50 outline-none transition-all"
                            value={editForm.name || ''}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            placeholder="Ex: LuandaLooks Fashion"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-2 block px-1">Categoria de Orquestração</label>
                          <select 
                             className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-text-primary focus:border-[#FFB800]/50 outline-none appearance-none"
                             value={editForm.category}
                             onChange={e => setEditForm({...editForm, category: e.target.value as any})}
                          >
                             {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-2 block px-1">Curta Descrição</label>
                          <textarea 
                            rows={3}
                            className="w-full bg-bg-base/40 border border-white/10 rounded-2xl p-4 text-sm font-medium text-text-secondary focus:border-[#FFB800]/50 outline-none transition-all resize-none"
                            value={editForm.description || ''}
                            onChange={e => setEditForm({...editForm, description: e.target.value})}
                            placeholder="Explique o que este agente faz..."
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                      <h4 className="text-[11px] font-black text-[#FFB800] uppercase tracking-[0.2em] flex items-center gap-3">
                         <Cpu size={16} /> Parâmetros do Modelo
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-2 block px-1">Modelo AI</label>
                          <input 
                            type="text" 
                            className="w-full bg-bg-base border border-white/10 rounded-xl p-3 text-xs font-bold text-text-primary focus:border-[#FFB800]/50 outline-none"
                            value={editForm.model_id || 'gpt-4o'}
                            onChange={e => setEditForm({...editForm, model_id: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-2 block px-1">Temperatura</label>
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="2"
                            className="w-full bg-bg-base border border-white/10 rounded-xl p-3 text-xs font-bold text-text-primary focus:border-[#FFB800]/50 outline-none"
                            value={editForm.params?.temperature ?? 0.7}
                            onChange={e => setEditForm({...editForm, params: {...(editForm.params || {}), temperature: parseFloat(e.target.value)}})}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Status de Operação</span>
                        <button 
                          onClick={() => setEditForm({...editForm, is_active: !editForm.is_active})}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editForm.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                        >
                          {editForm.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {editForm.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* Coluna Direita: Prompt Engineering (Destaque) */}
                  <div className="lg:col-span-8 space-y-8">
                    <section className="bg-bg-base/40 p-8 rounded-[3rem] border border-white/5 space-y-6 shadow-inner">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[11px] font-black text-[#FFB800] uppercase tracking-[0.2em] flex items-center gap-3">
                            <Sparkles size={16} /> Lógica de Prompt do Sistema
                         </h4>
                         <span className="text-[9px] font-mono text-text-tertiary uppercase">Markdown & Instruções Directas</span>
                      </div>
                      <textarea 
                        rows={18}
                        className="w-full bg-black/60 border border-white/10 rounded-[2rem] p-8 text-sm font-medium text-text-primary focus:border-[#FFB800]/50 outline-none transition-all resize-none shadow-2xl font-mono leading-relaxed custom-scrollbar"
                        placeholder="Define a personalidade, regras e limitações do agente..."
                        value={editForm.system_prompt || ''}
                        onChange={e => setEditForm({...editForm, system_prompt: e.target.value})}
                      />
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="bg-bg-base/40 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                              <FileCode size={16} /> Mensagem do Utilizador (User Prompt)
                           </h4>
                        </div>
                        <textarea 
                          rows={8}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xs font-mono text-text-secondary focus:border-blue-400/50 outline-none transition-all resize-none"
                          placeholder="Input: ${analysis} ..."
                          value={editForm.user_prompt_template || ''}
                          onChange={e => setEditForm({...editForm, user_prompt_template: e.target.value})}
                        />
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                          <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Zap size={10} /> Variáveis Ativas:
                          </p>
                          <div className="flex flex-wrap gap-2">
                             {['image', 'analyzer'].includes(editForm.category || '') && (
                               <>
                                 <code className="text-[9px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${analysis}"}</code>
                                 <code className="text-[9px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${userPrompt}"}</code>
                                 <code className="text-[9px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${style}"}</code>
                               </>
                             )}
                             {['video'].includes(editForm.category || '') && <code className="text-[9px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-300 font-mono">{"${prompt}"}</code>}
                             {!editForm.category && <span className="text-[9px] text-text-tertiary">Seleccione categoria...</span>}
                          </div>
                        </div>
                      </section>

                      <section className="bg-bg-base/40 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                         <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Layers size={16} /> Exemplo (Few-Shot/Notas)
                         </h4>
                         <textarea 
                           rows={11}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xs font-mono text-text-secondary focus:border-emerald-400/50 outline-none transition-all resize-none"
                           placeholder="Notas técnicas ou exemplos de output esperado..."
                           value={editForm.few_shot_examples || ''}
                           onChange={e => setEditForm({...editForm, few_shot_examples: e.target.value})}
                         />
                      </section>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Fixo */}
              <footer className="p-8 border-t border-white/5 bg-black/60 backdrop-blur-3xl flex items-center justify-between px-10 shrink-0">
                 <div className="flex items-center gap-4">
                    {selectedAgent && (
                      <button 
                        onClick={() => handleDelete(selectedAgent.id)}
                        className="flex items-center gap-2 px-6 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/10"
                      >
                        <Trash2 size={16} /> Eliminar Agente
                      </button>
                    )}
                    <button 
                      onClick={exportJSON}
                      className="px-6 py-4 bg-blue-500/10 text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all border border-blue-500/10 flex items-center gap-2"
                    >
                      <Download size={16} /> Exportar JSON
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                          setSelectedAgent(null);
                          setShowModal(false);
                      }}
                      className="px-10 py-4 bg-white/5 text-text-tertiary rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={selectedAgent ? handleUpdate : handleCreate}
                      disabled={isSaving}
                      className="px-12 py-5 bg-[#FFB800] text-black rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,184,0,0.2)] disabled:opacity-50"
                    >
                      {isSaving ? 'A Processar...' : (selectedAgent ? 'Guardar Configurações' : 'Activar Novo Agente')}
                    </button>
                 </div>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>{/* end flex-1 flex overflow-hidden */}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .animation-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />

    </div>
  );
}
