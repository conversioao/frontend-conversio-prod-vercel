import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert, 
  MessageSquare, 
  Activity, 
  Terminal,
  ExternalLink,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

interface WhatsAppLog {
  id: number;
  recipient: string;
  type: string;
  content: string;
  status: string;
  error_details: string;
  created_at: string;
}

interface InstanceStatus {
  success: boolean;
  status: {
    instance: {
      instanceName: string;
      owner?: string;
      profilePicUrl?: string;
      state: string;
    }
  };
  adminWhatsapp: string;
  platformInstance: string;
}

export default function AdminWhatsAppControl() {
  const [status, setStatus] = useState<InstanceStatus | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState('');
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs'>('monitor');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [apiHealth, setApiHealth] = useState<'open' | 'close' | 'error'>('close');

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/admin/whatsapp/instance-status');
      const data = await res.json();
      if (data.success) {
        setStatus({
          ...data,
          status: {
            instance: {
              instanceName: data.instanceName,
              owner: data.owner,
              state: data.state
            }
          }
        });
        setAdminPhone(data.adminWhatsapp || '');
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/whatsapp/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setApiHealth(data.apiStatus);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/whatsapp/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp logs:', err);
    }
  };

  const handleReconnect = async () => {
    try {
      setRefreshing(true);
      const res = await api.post('/admin/whatsapp/reconnect', {});
      const data = await res.json();
      if (data.success && data.qrcode) {
        setQrCode(data.qrcode.base64);
      }
    } catch (err) {
      console.error('Error reconnecting:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp da plataforma?')) return;
    try {
      setRefreshing(true);
      await api.post('/admin/whatsapp/logout', {});
      setStatus(null);
      setQrCode(null);
      fetchStatus();
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateAdminPhone = async () => {
    try {
      await api.post('/admin/whatsapp/config', { 
         key: 'admin_whatsapp', 
         value: adminPhone 
      });
      alert('Número do Administrador atualizado!');
    } catch (err) {
      alert('Erro ao atualizar número.');
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      fetchMetrics();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const isConnected = status?.status?.instance?.state === 'open';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-primary flex items-center gap-3">
            <Smartphone className="text-[#FFB800]" size={32} />
            Evolution API Control
          </h2>
          <p className="text-text-tertiary mt-1 font-medium">Monitorização em tempo real e gestão da conectividade WhatsApp.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { fetchStatus(); fetchLogs(); fetchMetrics(); }}
            disabled={refreshing}
            className="p-3 bg-surface/50 border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] transition-all disabled:opacity-50"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
          </button>
          
          <div className="bg-surface/50 border border-border-subtle p-1 rounded-xl flex">
            <button 
              onClick={() => setActiveTab('monitor')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'monitor' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Monitorização
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'logs' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Logs de Envio
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'monitor' ? (
          <motion.div 
            key="monitor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Status Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-all duration-700"></div>
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {isConnected ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Instância Plataforma</span>
                      <h3 className="text-2xl font-black text-text-primary">{status?.platformInstance || 'Conversio-Oficial'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`text-xs font-bold ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isConnected && (
                      <button 
                        onClick={handleReconnect}
                        className="px-6 py-3 bg-[#FFB800] text-black rounded-xl font-bold text-sm shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                      >
                        <RefreshCw size={18} />
                        Conectar
                      </button>
                    )}
                    {isConnected && (
                      <button 
                        onClick={handleLogout}
                        className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <LogOut size={18} />
                        Desconectar
                      </button>
                    )}
                  </div>
                </div>

                {isConnected && status?.status?.instance?.owner && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <div className="bg-bg-base/50 rounded-2xl p-4 border border-border-subtle flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg text-accent">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase">Número Ativo</p>
                        <p className="text-sm font-bold text-text-primary">{status.status.instance.owner.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="bg-bg-base/50 rounded-2xl p-4 border border-border-subtle flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg text-accent">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase">Estado da API</p>
                        <p className="text-sm font-bold text-text-primary flex items-center gap-2">
                           {apiHealth === 'open' ? 'Operacional' : 'Instável'}
                           <span className={`w-2 h-2 rounded-full ${apiHealth === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {qrCode && !isConnected && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-6 bg-white rounded-3xl flex flex-col items-center gap-4 border-4 border-accent/20"
                  >
                    <div className="text-center">
                      <p className="text-black font-black text-lg">Digitalize para Conectar</p>
                      <p className="text-gray-500 text-xs font-medium">Use o WhatsApp do seu telemóvel para ler o QR Code.</p>
                    </div>
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 shadow-2xl" />
                    <button 
                      onClick={() => setQrCode(null)}
                      className="text-gray-400 hover:text-black text-xs font-bold uppercase transition-all"
                    >
                      Cancelar
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Categorized Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {[
                    { key: 'auth', label: 'Cód. Verificação', icon: ShieldCheck, color: 'text-blue-500' },
                    { key: 'payment_user', label: 'Pagamento (User)', icon: CheckCircle2, color: 'text-emerald-500' },
                    { key: 'payment_admin', label: 'Alertas Admin', icon: ShieldAlert, color: 'text-amber-500' },
                    { key: 'campaign', label: 'Campanhas', icon: Bot, color: 'text-purple-500' },
                    { key: 'followup', label: 'Follow-ups', icon: RefreshCw, color: 'text-pink-500' },
                    { key: 'agent_action', label: 'Ações Agentes', icon: Activity, color: 'text-indigo-500' }
                 ].map(cat => {
                    const data = metrics.find(m => m.category === cat.key) || { total: 0, success: 0, failed: 0 };
                    return (
                       <div key={cat.key} className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-2xl p-4 hover:border-accent/30 transition-all group">
                          <div className="flex items-center gap-3 mb-3">
                             <div className={`p-2 bg-bg-base rounded-lg ${cat.color} group-hover:scale-110 transition-transform`}>
                                <cat.icon size={16} />
                             </div>
                             <span className="text-[10px] font-bold text-text-tertiary uppercase truncate">{cat.label}</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                             <p className="text-xl font-black text-text-primary">{data.total}</p>
                             <div className="text-[10px] font-black flex gap-2">
                                <span className="text-emerald-500">{data.success} ✓</span>
                                {data.failed > 0 && <span className="text-red-500">{data.failed} ✗</span>}
                             </div>
                          </div>
                       </div>
                    );
                 })}
              </div>

              {/* Admin Phone Config */}
              <div className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-3xl p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-text-primary">Notificações Administrativas</h4>
                       <p className="text-text-tertiary text-sm font-medium">Este número receberá alertas de pagamentos e erros críticos.</p>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <div className="flex-1 relative">
                       <input 
                         type="text" 
                         value={adminPhone}
                         onChange={(e) => setAdminPhone(e.target.value)}
                         placeholder="Ex: 244923000000"
                         className="w-full bg-bg-base border border-border-subtle focus:border-[#FFB800] rounded-xl px-4 py-4 text-sm font-bold text-text-primary transition-all pr-12"
                       />
                       <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                    </div>
                    <button 
                      onClick={handleUpdateAdminPhone}
                      className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Salvar
                    </button>
                 </div>
                 <p className="mt-4 text-[10px] text-text-tertiary flex items-center gap-2 font-bold uppercase tracking-wider">
                    <AlertCircle size={12} />
                    Formato Internacional sem o prefixo + (Ex: 244...)
                 </p>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-monitor-dashboard'))}
                className="w-full bg-gradient-to-r from-accent to-orange-500 p-6 rounded-3xl flex items-center justify-between group hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20"
              >
                <div className="text-left">
                  <h4 className="text-white font-black text-lg">NASA Control</h4>
                  <p className="text-white/70 text-xs font-bold uppercase">Painel Full ecrã</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
                  <ExternalLink size={24} />
                </div>
              </button>

              <div className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-3xl p-6">
                <h4 className="text-sm font-black text-text-primary flex items-center gap-2 mb-6">
                  <Activity size={18} className="text-[#FFB800]" />
                  Métricas Diárias
                </h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-bg-base/30 border border-border-subtle/50">
                    <span className="text-xs font-bold text-text-secondary">Mensagens Hoje</span>
                    <span className="text-sm font-black text-text-primary">{logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-bg-base/30 border border-border-subtle/50">
                    <span className="text-xs font-bold text-text-secondary">Taxa de Sucesso</span>
                    <span className="text-sm font-black text-emerald-500">
                      {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-bg-base/30 border border-border-subtle/50">
                    <span className="text-xs font-bold text-text-secondary">Alertas Admin</span>
                    <span className="text-sm font-black text-text-primary">{logs.filter(l => l.type === 'admin_alert').length}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <h5 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Endpoints Ativos</h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Notificação de Pagamento
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Recuperação de Carrinho
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Alerta de Créditos
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FFB800]/20 to-orange-500/20 border border-[#FFB800]/30 rounded-3xl p-6 relative overflow-hidden">
                <Bot className="absolute -bottom-4 -right-4 text-[#FFB800]/20" size={100} />
                <h4 className="text-sm font-black text-[#FFB800] mb-2">Dica de Gestão</h4>
                <p className="text-xs text-text-secondary font-medium leading-relaxed relative z-10">
                  Mantenha sempre a instância ligada a um número com bateria carregada e internet estável para garantir que os utilizadores recebam as notificações de pagamento instantaneamente.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-surface/30 backdrop-blur-xl border border-border-subtle rounded-3xl overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
                <Terminal size={18} className="text-[#FFB800]" />
                Monitor de Logs (Últimas 100 Mensagens)
              </h4>
              <span className="text-[10px] font-black text-text-tertiary uppercase border border-border-subtle px-2 py-1 rounded-md">
                Live Refresh: 30s
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg-base/30 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Destinatário</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Conteúdo</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-bg-base/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-primary">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-text-secondary">
                        {log.recipient}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                          log.type === 'admin_alert' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-text-tertiary max-w-xs truncate">
                        {log.content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${
                          log.status === 'success' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {log.status === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                          {log.status === 'success' ? 'Enviado' : 'Falhou'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <MessageSquare className="mx-auto text-text-tertiary mb-3 opacity-20" size={48} />
                        <p className="text-sm font-bold text-text-tertiary">Nenhum log de envio registado até ao momento.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
