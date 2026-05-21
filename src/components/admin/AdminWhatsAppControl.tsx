import React, { useState, useEffect } from 'react';
import {
  Smartphone, RefreshCw, LogOut, ShieldCheck, ShieldAlert, MessageSquare,
  Activity, Terminal, QrCode, CheckCircle2, AlertCircle, Clock, Bot,
  Zap, Users, ArrowRight, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

interface SystemAgent {
  id: number;
  slug: string;
  name: string;
  instance_name: string;
  phone_number: string;
  status: string;
  daily_limit: number;
  health_score: number;
  api_key?: string;
  whatsapp_state?: 'open' | 'close' | 'connecting' | 'unknown' | 'not_found' | 'error';
  whatsappState?: 'open' | 'close' | 'connecting' | 'unknown' | 'not_found' | 'error';
  loading?: boolean;
}

interface WhatsAppLog {
  id: number;
  recipient: string;
  type: string;
  content: string;
  status: string;
  instance_name: string;
  created_at: string;
}

const STATE_COLOR: Record<string, string> = {
  open: 'text-emerald-500',
  close: 'text-red-400',
  connecting: 'text-amber-400',
  unknown: 'text-text-tertiary',
};

const STATE_BG: Record<string, string> = {
  open: 'bg-emerald-500',
  close: 'bg-red-500',
  connecting: 'bg-amber-500 animate-pulse',
  unknown: 'bg-gray-500',
};

const STATE_LABEL: Record<string, string> = {
  open: 'CONECTADO',
  close: 'DESCONECTADO',
  connecting: 'A CONECTAR',
  unknown: 'DESCONHECIDO',
};

export default function AdminWhatsAppControl() {
  const [agents, setAgents] = useState<SystemAgent[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('venda');
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs'>('monitor');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');

  const selectedAgent = agents.find(a => a.slug === selectedSlug) || agents[0];

  // Fetch all system agents from DB
  const fetchAgents = async () => {
    try {
      const res = await api.get('/admin/whatsapp/pentagon-agents');
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        // Sort: venda first, then rest
        const sorted = [...data.agents].sort((a, b) => {
          if (a.slug === 'venda') return -1;
          if (b.slug === 'venda') return 1;
          return a.name.localeCompare(b.name);
        });
        setAgents(sorted.map(a => ({ 
          ...a, 
          whatsappState: a.whatsapp_state || 'unknown', 
          loading: true 
        })));
        // Fetch status for each agent
        sorted.forEach(agent => {
          if (agent.instance_name) fetchAgentStatus(agent.instance_name, agent.slug);
        });
      }
    } catch (e) {
      console.error('Error fetching system agents:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentStatus = async (instance: string, slug: string) => {
    try {
      const res = await api.get(`/admin/whatsapp/agent-status/${instance}`);
      const data = await res.json();
      const state = data.state?.toLowerCase() || 'unknown';
      setAgents(prev => prev.map(a =>
        a.slug === slug ? { ...a, whatsappState: state, loading: false } : a
      ));
    } catch {
      setAgents(prev => prev.map(a =>
        a.slug === slug ? { ...a, whatsappState: 'unknown', loading: false } : a
      ));
    }
  };

  const fetchLogs = async (instance?: string) => {
    try {
      const q = instance ? `?instance=${instance}` : '';
      const res = await api.get(`/admin/whatsapp/logs${q}`);
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch {}
  };

  const fetchMetrics = async (instance?: string) => {
    try {
      const q = instance ? `?instance=${instance}` : '';
      const res = await api.get(`/admin/whatsapp/metrics${q}`);
      const data = await res.json();
      if (data.success) setMetrics(data.metrics || []);
    } catch {}
  };

  const handleConnect = async () => {
    if (!selectedAgent) return;
    setActionLoading(true);
    setQrCode(null);
    try {
      const res = await api.post('/admin/whatsapp/reconnect', { instance: selectedAgent.instance_name });
      const data = await res.json();
      if (data.success && data.qrcode?.base64) setQrCode(data.qrcode.base64);
    } catch {}
    setActionLoading(false);
  };

  const handleDisconnect = async () => {
    if (!selectedAgent || !window.confirm(`Desconectar ${selectedAgent.name}?`)) return;
    setActionLoading(true);
    try {
      await api.post('/admin/whatsapp/logout', { instance: selectedAgent.instance_name });
      fetchAgentStatus(selectedAgent.instance_name, selectedAgent.slug);
    } catch {}
    setActionLoading(false);
    setQrCode(null);
  };

  const handleRefreshAll = () => {
    agents.forEach(a => {
      if (a.instance_name) fetchAgentStatus(a.instance_name, a.slug);
    });
    if (selectedAgent?.instance_name) {
      fetchLogs(selectedAgent.instance_name);
      fetchMetrics(selectedAgent.instance_name);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent?.instance_name) {
      fetchLogs(selectedAgent.instance_name);
      fetchMetrics(selectedAgent.instance_name);
      setQrCode(null);
    }
  }, [selectedSlug]);

  const isConnected = selectedAgent?.whatsappState === 'open';
  const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const successRate = logs.length > 0
    ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)
    : 0;

  const METRIC_CATS = [
    { key: 'venda', label: 'Mensagens Venda', color: 'text-orange-400' },
    { key: 'suporte', label: 'Suporte', color: 'text-blue-400' },
    { key: 'campaign', label: 'Campanhas', color: 'text-purple-400' },
    { key: 'agent_action', label: 'Ações Agentes', color: 'text-indigo-400' },
    { key: 'followup', label: 'Follow-ups', color: 'text-pink-400' },
    { key: 'auth', label: 'Verificação', color: 'text-cyan-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-[#FFB800]" size={32} />
        <span className="ml-3 text-text-secondary font-bold">A carregar agentes Pentagon...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Smartphone className="text-[#FFB800]" size={32} />
            WhatsApp Control
            <span className="text-xs font-bold bg-[#FFB800]/20 text-[#FFB800] px-2 py-1 rounded-full">PENTAGON</span>
          </h2>
          <p className="text-text-tertiary mt-1 font-medium">Monitorização em tempo real de todas as instâncias dos agentes.</p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="p-3 bg-surface/50 border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] transition-all"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Agent Grid - All agents at a glance */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {agents.map(agent => (
          <button
            key={agent.slug}
            onClick={() => setSelectedSlug(agent.slug)}
            className={`p-4 rounded-2xl border text-left transition-all group ${
              selectedSlug === agent.slug
                ? 'bg-[#FFB800] border-[#FFB800] shadow-xl shadow-[#FFB800]/20'
                : 'bg-surface/30 border-border-subtle hover:border-[#FFB800]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-black uppercase tracking-wider ${selectedSlug === agent.slug ? 'text-black' : 'text-text-tertiary'}`}>
                {agent.name}
              </span>
              {agent.loading ? (
                <RefreshCw size={10} className={`animate-spin ${selectedSlug === agent.slug ? 'text-black/50' : 'text-text-tertiary'}`} />
              ) : (
                <span className={`w-2.5 h-2.5 rounded-full ${STATE_BG[agent.whatsappState || 'unknown']}`} />
              )}
            </div>
            <p className={`text-[10px] font-medium truncate ${selectedSlug === agent.slug ? 'text-black/70' : 'text-text-tertiary'}`}>
              {agent.instance_name || 'Sem instância'}
            </p>
            <p className={`text-[10px] font-black mt-1 ${selectedSlug === agent.slug ? 'text-black' : STATE_COLOR[agent.whatsappState || 'unknown']}`}>
              {agent.loading ? '...' : STATE_LABEL[agent.whatsappState || 'unknown']}
            </p>
            {/* Health Bar Mini */}
            <div className="mt-2 w-full h-1 bg-black/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${agent.health_score > 80 ? 'bg-emerald-400' : agent.health_score > 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${agent.health_score}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Selected Agent Detail */}
      {selectedAgent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Status Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-3xl p-8 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${isConnected ? 'bg-emerald-500/5' : 'bg-red-500/5'}`} />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {isConnected ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Agente Selecionado</span>
                    <h3 className="text-2xl font-black text-white">{selectedAgent.name}</h3>
                    <p className="text-sm text-text-tertiary font-medium">{selectedAgent.instance_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className={`text-xs font-bold ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                        {selectedAgent.loading ? 'A verificar...' : STATE_LABEL[selectedAgent.whatsappState || 'unknown']}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isConnected && (
                    <button
                      onClick={handleConnect}
                      disabled={actionLoading}
                      className="px-5 py-3 bg-[#FFB800] text-black rounded-xl font-bold text-sm shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={16} />}
                      Conectar
                    </button>
                  )}
                  {isConnected && (
                    <button
                      onClick={handleDisconnect}
                      disabled={actionLoading}
                      className="px-5 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <LogOut size={16} />
                      Desconectar
                    </button>
                  )}
                </div>
              </div>

              {selectedAgent.phone_number && (
                <div className="mt-6 flex items-center gap-3 p-3 bg-bg-base/50 rounded-xl border border-border-subtle">
                  <Smartphone size={16} className="text-[#FFB800]" />
                  <span className="text-sm font-bold text-text-primary">{selectedAgent.phone_number}</span>
                  <span className={`ml-auto text-[10px] font-black px-2 py-1 rounded-md ${selectedAgent.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {selectedAgent.status?.toUpperCase()}
                  </span>
                </div>
              )}

              {/* QR Code */}
              {qrCode && !isConnected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-6 bg-white rounded-2xl flex flex-col items-center gap-3"
                >
                  <p className="text-black font-black">Digitalize para Conectar {selectedAgent.name}</p>
                  <p className="text-gray-500 text-xs">Abra o WhatsApp e leia o QR Code</p>
                  <img src={qrCode} alt="QR Code" className="w-56 h-56" />
                  <button onClick={() => setQrCode(null)} className="text-gray-400 text-xs font-bold hover:text-black">Cancelar</button>
                </motion.div>
              )}
            </div>

            {/* Tab Nav */}
            <div className="flex gap-2">
              {(['monitor', 'logs'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-[#FFB800] text-black' : 'bg-surface/30 border border-border-subtle text-text-tertiary hover:text-white'}`}
                >
                  {tab === 'monitor' ? 'Métricas' : 'Logs de Envio'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'monitor' ? (
                <motion.div key="metrics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {METRIC_CATS.map(cat => {
                      const d = metrics.find((m: any) => m.category === cat.key) || { total: 0, success: 0, failed: 0 };
                      return (
                        <div key={cat.key} className="bg-surface/30 border border-border-subtle rounded-2xl p-4">
                          <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${cat.color}`}>{cat.label}</p>
                          <p className="text-2xl font-black text-white">{d.total}</p>
                          <div className="flex gap-3 mt-1 text-[10px] font-bold">
                            <span className="text-emerald-500">{d.success} ✓</span>
                            {d.failed > 0 && <span className="text-red-500">{d.failed} ✗</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden">
                    <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Terminal size={16} className="text-[#FFB800]" />
                        Últimas 100 Mensagens — {selectedAgent.name}
                      </h4>
                      <span className="text-[10px] font-black text-text-tertiary border border-border-subtle px-2 py-1 rounded-md">
                        {logs.length} registos
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-bg-base/80">
                          <tr className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                            <th className="px-4 py-3">Hora</th>
                            <th className="px-4 py-3">Destinatário</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Conteúdo</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {logs.map(log => (
                            <tr key={log.id} className="hover:bg-bg-base/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(log.created_at).toLocaleTimeString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-text-secondary">{log.recipient}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-500/10 text-blue-400">{log.type}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-text-tertiary max-w-[200px] truncate">{log.content}</td>
                              <td className="px-4 py-3">
                                <span className={`flex items-center gap-1 text-xs font-bold ${log.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {log.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                  {log.status === 'success' ? 'OK' : 'Falhou'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {logs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-tertiary">
                                Nenhum log para esta instância.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-surface/30 border border-border-subtle rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Activity size={16} className="text-[#FFB800]" />
                Resumo — {selectedAgent.name}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-bg-base/30 border border-border-subtle">
                  <span className="text-xs font-bold text-text-secondary">Mensagens Hoje</span>
                  <span className="text-sm font-black text-white">{todayLogs}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-bg-base/30 border border-border-subtle">
                  <span className="text-xs font-bold text-text-secondary">Taxa Sucesso</span>
                  <span className={`text-sm font-black ${successRate >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{successRate}%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-bg-base/30 border border-border-subtle">
                  <span className="text-xs font-bold text-text-secondary">Limite Diário</span>
                  <span className="text-sm font-black text-white">{selectedAgent.daily_limit || '∞'}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-bg-base/30 border border-border-subtle">
                  <span className="text-xs font-bold text-text-secondary">Estado BD</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-md ${selectedAgent.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {selectedAgent.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* All Agents Summary */}
            <div className="bg-surface/30 border border-border-subtle rounded-3xl p-6">
              <h4 className="text-sm font-black text-white flex items-center gap-2 mb-4">
                <Bot size={16} className="text-[#FFB800]" />
                Estado Pentagon
              </h4>
              <div className="space-y-2">
                {agents.map(agent => (
                  <button
                    key={agent.slug}
                    onClick={() => setSelectedSlug(agent.slug)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      selectedSlug === agent.slug
                        ? 'border-[#FFB800]/50 bg-[#FFB800]/5'
                        : 'border-border-subtle hover:border-[#FFB800]/20'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-text-primary">{agent.name}</p>
                      <p className="text-[10px] text-text-tertiary truncate max-w-[140px]">{agent.instance_name || 'sem instância'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.loading ? (
                        <RefreshCw size={10} className="animate-spin text-text-tertiary" />
                      ) : (
                        <>
                          <span className={`w-2 h-2 rounded-full ${STATE_BG[agent.whatsappState || 'unknown']}`} />
                          {agent.whatsappState === 'open' ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-red-400" />}
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Notification Config */}
            <div className="bg-surface/30 border border-border-subtle rounded-3xl p-6">
              <h4 className="text-sm font-black text-white flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-emerald-500" />
                Notificações Admin
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminPhone}
                  onChange={e => setAdminPhone(e.target.value)}
                  placeholder="244923000000"
                  className="flex-1 bg-bg-base border border-border-subtle rounded-xl px-3 py-2.5 text-sm font-bold text-text-primary focus:border-[#FFB800] outline-none transition-all"
                />
                <button
                  onClick={async () => {
                    await api.post('/admin/whatsapp/config', { key: 'admin_whatsapp', value: adminPhone });
                    alert('Salvo!');
                  }}
                  className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all"
                >
                  Salvar
                </button>
              </div>
              <p className="text-[10px] text-text-tertiary mt-2">Formato: 244... (sem +)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
