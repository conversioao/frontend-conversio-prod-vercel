import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Settings, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Zap,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

interface SystemAgent {
  id: number;
  slug: string;
  name: string;
  instance_name: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'warming';
  health_score: number;
  daily_limit: number;
  current_day_count: number;
  config: any;
  api_key: string;
  instructions: {
    system_prompt: string;
    temperature: number;
    max_tokens: number;
    model: string;
  };
  updated_at: string;
}

export default function AdminPentagonControl() {
  const [agents, setAgents] = useState<SystemAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [testing, setTesting] = useState<number | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [instanceStates, setInstanceStates] = useState<Record<string, string>>({});
  const [editingAgent, setEditingAgent] = useState<SystemAgent | null>(null);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/admin/system-agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
        // Refresh statuses
        data.agents.forEach((a: SystemAgent) => {
          if (a.instance_name) checkStatus(a.instance_name);
        });
      }
    } catch (err) {
      console.error('Error fetching system agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (instance: string) => {
    setChecking(instance);
    try {
      const res = await api.get(`/admin/system-agents/status/${instance}`);
      const data = await res.json();
      if (data.success) {
        setInstanceStates(prev => ({ ...prev, [instance]: data.state }));
      }
    } catch (err) {
      setInstanceStates(prev => ({ ...prev, [instance]: 'error' }));
    } finally {
      setChecking(null);
    }
  };

  const handleTestMessage = async (id: number) => {
    setTesting(id);
    try {
      const res = await api.post(`/admin/system-agents/test/${id}`, {});
      const data = await res.json();
      if (data.success) {
        alert('✅ Mensagem de teste enviada com sucesso!');
      } else {
        alert('❌ Erro no teste: ' + data.error);
      }
    } catch (err) {
      alert('❌ Erro crítico no teste.');
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAgent = async (agent: SystemAgent) => {
    setSaving(agent.id);
    try {
      const res = await api.post(`/admin/system-agents/${agent.id}`, agent);
      if (res.ok) {
        setEditingAgent(null);
        fetchAgents();
      }
    } catch (err) {
      console.error('Error updating agent:', err);
    } finally {
      setSaving(null);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string, instanceName?: string) => {
    const liveState = instanceName ? instanceStates[instanceName] : null;
    
    return (
      <div className="flex items-center gap-2">
        {status === 'active' ? (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Ativo</span>
        ) : status === 'warming' ? (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Warm-up</span>
        ) : (
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[10px] font-black uppercase">Inativo</span>
        )}
        
        {instanceName && (
          <div className={`w-2 h-2 rounded-full ${liveState === 'open' ? 'bg-emerald-500 animate-pulse' : liveState === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} title={liveState || 'offline'} />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="animate-spin text-[#FFB800]" size={32} />
        <p className="text-text-tertiary font-bold uppercase tracking-widest text-xs">Mapeando Arquitectura Pentagon...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-primary flex items-center gap-3 italic">
            <Shield className="text-[#FFB800]" size={32} />
            PENTAGON CONTROL
          </h2>
          <p className="text-text-tertiary mt-1 font-medium">Gestão de instâncias especializadas e protecção Anti-Spam.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-surface/50 border border-border-subtle p-3 rounded-2xl flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-black text-text-tertiary uppercase">Saúde Global</p>
                    <p className="text-sm font-black text-emerald-500">EXCELENTE</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Activity size={20} />
                </div>
            </div>
            <button 
                onClick={fetchAgents}
                className="p-3 bg-surface/50 border border-border-subtle rounded-2xl text-text-secondary hover:text-[#FFB800] transition-all"
            >
                <RefreshCw className={checking ? "animate-spin" : ""} size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {agents.map((agent) => (
              <motion.div 
                key={agent.id}
                layout
                className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] p-6 hover:border-[#FFB800]/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#FFB800]/10 transition-all"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${agent.status === 'active' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'bg-white/5 text-white/20'}`}>
                      <Bot size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-text-primary">{agent.name}</h3>
                        {getStatusBadge(agent.status, agent.instance_name)}
                      </div>
                      <p className="text-xs font-bold text-text-tertiary mt-1 flex items-center gap-2">
                         <Smartphone size={12} />
                         {agent.phone_number || 'Não configurado'} 
                         {agent.instance_name && <span className="opacity-50">• {agent.instance_name}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-text-tertiary uppercase">Saúde</p>
                        <p className={`text-lg font-black ${getHealthColor(agent.health_score)}`}>{agent.health_score}%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-text-tertiary uppercase">Hoje</p>
                        <p className="text-lg font-black text-text-primary">{agent.current_day_count}<span className="text-[10px] text-text-tertiary ml-1">/ {agent.daily_limit}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                          onClick={() => handleTestMessage(agent.id)}
                          disabled={testing === agent.id}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-emerald-500 hover:text-black transition-all group/test"
                          title="Enviar Teste Real"
                      >
                          <Zap size={18} className={testing === agent.id ? "animate-pulse" : ""} />
                      </button>
                      <button 
                          onClick={() => setEditingAgent(agent)}
                          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-xs uppercase hover:bg-[#FFB800] hover:text-black transition-all"
                      >
                          Configurar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#FFB800]/10 to-orange-500/10 border border-[#FFB800]/20 rounded-[2.5rem] p-8">
                <h4 className="text-sm font-black text-[#FFB800] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={16} />
                    Protecção Activa
                </h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-secondary">Smart Buffer</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-secondary">Simulação Typing</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-secondary">Peak Throttle</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-[10px] text-text-tertiary font-medium leading-relaxed">
                        O sistema monitoriza automaticamente os padrões de envio para evitar detecção pelos algoritmos anti-spam do WhatsApp.
                    </p>
                </div>
            </div>

            <div className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] p-8">
                <h4 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" />
                    Métricas de Risco
                </h4>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                            <span className="text-text-tertiary">Fila de Espera</span>
                            <span className="text-text-primary">0 Mensagens</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: '0%' }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                            <span className="text-text-tertiary">Taxa de Banimento (Global)</span>
                            <span className="text-text-primary">BAIXA</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: '5%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingAgent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAgent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0D0D0D] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Configurar {editingAgent.name}</h3>
                    <p className="text-white/40 text-sm font-medium mt-1">Define a inteligência e infraestrutura deste agente.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/40 uppercase">Slug</p>
                    <p className="text-xs font-black text-[#FFB800]">{editingAgent.slug.toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* WhatsApp Infrastructure */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-white/5 pb-2">Infraestrutura WhatsApp</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Nome da Instância</label>
                        <input 
                          type="text" 
                          value={editingAgent.instance_name || ''}
                          onChange={(e) => setEditingAgent({...editingAgent, instance_name: e.target.value})}
                          placeholder="Ex: pentagon-vendas"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#FFB800]/50 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">API Key da Instância (Opcional)</label>
                        <input 
                          type="password" 
                          value={editingAgent.api_key || ''}
                          onChange={(e) => setEditingAgent({...editingAgent, api_key: e.target.value})}
                          placeholder="Usar Global por padrão"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#FFB800]/50 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Número WhatsApp</label>
                        <input 
                          type="text" 
                          value={editingAgent.phone_number || ''}
                          onChange={(e) => setEditingAgent({...editingAgent, phone_number: e.target.value})}
                          placeholder="+244923000000"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#FFB800]/50 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Limite Diário (Msg)</label>
                        <input 
                          type="number" 
                          value={editingAgent.daily_limit}
                          onChange={(e) => setEditingAgent({...editingAgent, daily_limit: parseInt(e.target.value)})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#FFB800]/50 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Estado Operacional</label>
                        <select 
                          value={editingAgent.status}
                          onChange={(e) => setEditingAgent({...editingAgent, status: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#FFB800]/50 outline-none transition-all appearance-none"
                        >
                          <option value="inactive">Inativo</option>
                          <option value="active">Activo</option>
                          <option value="warming">Warm-up</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                         <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/40 uppercase">Estado da Ligação</span>
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-black text-white">{instanceStates[editingAgent.instance_name] || 'N/A'}</span>
                               <div className={`w-2 h-2 rounded-full ${instanceStates[editingAgent.instance_name] === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Instructions */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                      <Settings size={12} />
                      Inteligência & Comportamento (OpenAI)
                    </h4>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">System Prompt (Instruções)</label>
                      <textarea 
                        value={editingAgent.instructions?.system_prompt || ''}
                        onChange={(e) => setEditingAgent({...editingAgent, instructions: { ...editingAgent.instructions, system_prompt: e.target.value }})}
                        rows={4}
                        placeholder="Define como o agente deve agir..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-[#FFB800]/50 outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Modelo</label>
                        <select 
                          value={editingAgent.instructions?.model || 'gpt-4o-mini'}
                          onChange={(e) => setEditingAgent({...editingAgent, instructions: { ...editingAgent.instructions, model: e.target.value }})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none"
                        >
                          <option value="gpt-4o-mini">GPT-4o Mini (Rápido)</option>
                          <option value="gpt-4o">GPT-4o (Poderoso)</option>
                          <option value="o1-mini">o1 Mini (Lógica)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Temperatura</label>
                        <input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="2"
                          value={editingAgent.instructions?.temperature || 0.7}
                          onChange={(e) => setEditingAgent({...editingAgent, instructions: { ...editingAgent.instructions, temperature: parseFloat(e.target.value) }})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Max Tokens</label>
                        <input 
                          type="number" 
                          value={editingAgent.instructions?.max_tokens || 1000}
                          onChange={(e) => setEditingAgent({...editingAgent, instructions: { ...editingAgent.instructions, max_tokens: parseInt(e.target.value) }})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Anti-Spam Params */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12} className="text-[#FFB800]" />
                        Parâmetros Anti-Spam (Fila)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] text-white/40 mb-1">Delay Min (seg)</p>
                            <input 
                                type="number" 
                                value={editingAgent.config?.delay_min || 2}
                                onChange={(e) => setEditingAgent({...editingAgent, config: { ...editingAgent.config, delay_min: parseInt(e.target.value) }})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs font-bold"
                            />
                        </div>
                        <div>
                            <p className="text-[9px] text-white/40 mb-1">Delay Max (seg)</p>
                            <input 
                                type="number" 
                                value={editingAgent.config?.delay_max || 9}
                                onChange={(e) => setEditingAgent({...editingAgent, config: { ...editingAgent.config, delay_max: parseInt(e.target.value) }})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs font-bold"
                            />
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingAgent(null)}
                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm uppercase hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleUpdateAgent(editingAgent)}
                    disabled={saving === editingAgent.id}
                    className="flex-[2] py-4 bg-[#FFB800] text-black rounded-2xl font-black text-sm uppercase shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {saving === editingAgent.id ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
