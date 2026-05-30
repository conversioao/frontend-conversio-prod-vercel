import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Server, Bot, Users, Target, ShieldAlert, Cpu, Network,
  RefreshCw, Play, AlertTriangle, CheckCircle, Clock, X, Terminal,
  Sparkles, ArrowRight, TrendingUp, Smile, AlertCircle, HelpCircle, Frown, Award, Send
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import UserBehaviorCard from './UserBehaviorCard';
import JourneyFunnelCard from './JourneyFunnelCard';

interface AdminControlRoomProps {
  onClose: () => void;
}

// Mapa de comandos cognitivos por agente
const AGENT_COMMANDS: Record<string, { value: string; label: string }[]> = {
  'Agente Onboarding':   [
    { value: 'welcome_onboarding', label: '🎉 Boas-vindas & Momento WOW' },
    { value: 'send_first_tip',     label: '💡 Enviar 1ª Dica de Uso' },
    { value: 'profile_complete_reminder', label: '📋 Lembrar Completar Perfil' },
  ],
  'Agente Nutrição':     [
    { value: 'weekly_tip',         label: '📰 Dica Semanal de Marketing' },
    { value: 'trend_report',       label: '📈 Relatório de Tendências AO' },
    { value: 'case_study',         label: '🏆 Caso de Sucesso Angolano' },
  ],
  'Agente Envios':       [
    { value: 'pricing_followup',   label: '💰 Follow-up: Abandono de Preços' },
    { value: 'cart_recovery',      label: '🛒 Recuperar Abandono de Créditos' },
    { value: 'promo_flash',        label: '⚡ Promoção Relâmpago (48h)' },
  ],
  'Agente Recuperação':  [
    { value: 'churn_risk',         label: '🚨 Alerta Risco de Churn' },
    { value: 'win_back_offer',     label: '🎁 Oferta de Reconquista' },
    { value: 'survey_inactive',    label: '📊 Questionário de Inactividade' },
  ],
  'Agente Atendimento':  [
    { value: 'support_escalation', label: '📞 Escalar para Atendimento Humano' },
    { value: 'bug_followup',       label: '🐛 Follow-up de Bug Reportado' },
    { value: 'satisfaction_check', label: '⭐ Verificação de Satisfação' },
  ],
  'Agente Upsell':       [
    { value: 'power_user_upgrade', label: '🚀 Oferta Upgrade Power User' },
    { value: 'credit_bundle',      label: '💎 Pacote de Créditos Premium' },
    { value: 'annual_plan',        label: '📅 Proposta Plano Anual' },
  ],
  'Agente Reactivação':  [
    { value: 'new_feature_announce', label: '✨ Anunciar Nova Funcionalidade' },
    { value: 'dormant_rescue',      label: '😴 Resgatar Conta Adormecida' },
    { value: 'competitor_alert',    label: '🔥 Alerta: Não Fiques para Trás' },
  ],
  'Agente Analítico':    [
    { value: 'monthly_report',     label: '📑 Relatório Mensal de ROI' },
    { value: 'segment_analysis',   label: '🔬 Análise de Segmento' },
    { value: 'cohort_review',      label: '📊 Revisão de Coorte' },
  ],
  'Agente Vendas':       [
    { value: 'lead_qualification', label: '🎯 Qualificação Elegante de Lead' },
    { value: 'close_deal',         label: '🤝 Fecho Comercial Personalizado' },
    { value: 'demo_invite',        label: '📹 Convite para Demonstração' },
  ],
};

export default function AdminControlRoom({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>('pending');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Dispatch Modal/Form States
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchAgent, setDispatchAgent] = useState('');
  const [dispatchTaskType, setDispatchTaskType] = useState('');
  const [dispatchUserId, setDispatchUserId] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const fetchSummary = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    try {
      const res = await api.get('/control-room/summary');
      const data = await res.json();
      if (data.success) {
        setSummary(data);
      } else {
        toast.error('Erro ao carregar sumário: ' + data.message);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Falha de rede ao obter dados da Sala de Controlo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTasks = async (status: string) => {
    setLoadingTasks(true);
    try {
      const res = await api.get(`/control-room/tasks?status=${status}&limit=30`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => fetchSummary(false), 30000); // refresh every 30s silently
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTasks(selectedTaskStatus);
  }, [selectedTaskStatus]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchAgent || !dispatchTaskType || !dispatchUserId.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setDispatching(true);
    try {
      const res = await api.post('/control-room/dispatch', {
        agentName: dispatchAgent,
        taskType: dispatchTaskType,
        userId: dispatchUserId.trim(),
        note: dispatchNote.trim() || undefined,
      });
      const data = await res.json();
      if (data.success) {
        const label = AGENT_COMMANDS[dispatchAgent]?.find(c => c.value === dispatchTaskType)?.label || dispatchTaskType;
        toast.success(`✅ Comando "${label}" enviado! ID #${data.taskId}`);
        setShowDispatchModal(false);
        setDispatchUserId('');
        setDispatchNote('');
        fetchSummary(false);
        fetchTasks(selectedTaskStatus);
      } else {
        toast.error('Erro ao despachar tarefa: ' + data.message);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Falha ao comunicar com o servidor para despachar a tarefa.');
    } finally {
      setDispatching(false);
    }
  };

  const openDispatchForAgent = (agentName: string) => {
    setDispatchAgent(agentName);
    // Seleccionar o primeiro comando disponível para o agente
    const commands = AGENT_COMMANDS[agentName];
    setDispatchTaskType(commands?.length ? commands[0].value : 'send_message');
    setDispatchNote('');
    setDispatchUserId('');
    setShowDispatchModal(true);
  };

  const openDispatchWithUser = (userId: string) => {
    setDispatchAgent('Agente Onboarding');
    const commands = AGENT_COMMANDS['Agente Onboarding'];
    setDispatchTaskType(commands?.length ? commands[0].value : 'send_message');
    setDispatchNote('');
    setDispatchUserId(userId);
    setShowDispatchModal(true);
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'excited': return <Smile className="text-emerald-400" size={18} />;
      case 'frustrated': return <Frown className="text-red-500 animate-bounce" size={18} />;
      case 'confused': return <HelpCircle className="text-yellow-400 animate-pulse" size={18} />;
      default: return <Smile className="text-gray-400" size={18} />;
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'signup': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'login': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'generation_success': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'generation_failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'purchase': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'pricing_view': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'inactivity_detected': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'intense_use': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const getPriorityBadgeClass = (priority: number) => {
    if (priority === 1) return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (priority === 2) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[80] bg-[#050505] text-white flex flex-col items-center justify-center font-sans">
        <Activity className="text-[#FFB800] animate-spin mb-4" size={48} />
        <p className="text-text-secondary font-bold text-sm tracking-widest uppercase">A aceder à Sala de Controlo Cognitiva...</p>
      </div>
    );
  }

  const { overview = {}, whatsappStats = {}, leadConversions = {}, scoreDist = [], emotionDist = [], topEvents = [], recentEvents = [], agentPerformance = [] } = summary || {};

  return (
    <div className="fixed inset-0 z-[80] bg-[#050505] text-white flex flex-col font-sans overflow-y-auto custom-scrollbar pb-10">
      
      {/* GLOW BACKGROUND EFFECT */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-yellow-500/5 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* TOP HEADER CONTROLS */}
      <div className="h-24 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 bg-black/40 backdrop-blur-3xl shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl relative">
            <Cpu className="text-[#FFB800] animate-pulse" size={28} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#050505] animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black text-white tracking-tighter uppercase">Sala de Controlo</h1>
              <span className="text-[10px] font-bold bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 px-2 py-0.5 rounded-full uppercase tracking-widest">ACE v2.0</span>
            </div>
            <p className="text-[11px] lg:text-xs text-text-secondary font-medium">Orquestração Multiagente & Telemetria Emocional em Tempo Real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchSummary(true)} 
            disabled={refreshing}
            className="p-3 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 hover:bg-[#FFB800] border border-white/5 hover:border-transparent text-white hover:text-black rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* ROW 1: OVERVIEW KPI METRICS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          
          {/* Card 1: Users */}
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl transition-all group-hover:scale-125"></div>
            <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block mb-2">Utilizadores Activos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{overview.activeToday}</span>
              <span className="text-xs text-text-tertiary">/ {overview.totalUsers || 0} total</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Online nas últimas 24h</span>
            </div>
          </div>

          {/* Card 2: Churn Risk */}
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl transition-all group-hover:scale-125"></div>
            <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block mb-2">Risco de Churn</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-500">{overview.churnRisks}</span>
              <span className="text-xs text-text-tertiary">inactivos &gt;14d</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-red-400 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded-lg w-fit">
              <AlertCircle size={12} />
              <span>Requer Acção de Retenção</span>
            </div>
          </div>

          {/* Card 3: Quality Metrics */}
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl transition-all group-hover:scale-125"></div>
            <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block mb-2">Qualificação CRM</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{leadConversions.premium_leads || 0}</span>
              <span className="text-xs text-text-tertiary">leads VIP / premium</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp size={12} />
              <span>Score Médio: {leadConversions.avg_score || 0}%</span>
            </div>
          </div>

          {/* Card 4: Task Queue Stats */}
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl transition-all group-hover:scale-125"></div>
            <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block mb-2">Fila de Tarefas (ACE)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#FFB800]">{overview.pendingTasks + overview.runningTasks}</span>
              <span className="text-xs text-text-tertiary">activas no motor</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10px] text-text-secondary font-bold">
              <span className="text-emerald-400">✓ {overview.completedTasks || 0} OK</span>
              <span className="text-red-400">✗ {overview.failedTasks || 0} FALHA</span>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ROW 1.25: WHATSAPP AGENT METRICS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-12">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Agente Alex · WhatsApp SDR em Tempo Real</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/30 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-white">{(whatsappStats as any).totalLeads ?? '—'}</div>
                <div className="text-[10px] font-bold text-text-secondary uppercase mt-1">Total de Leads</div>
              </div>
              <div className="bg-black/30 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-yellow-400">{(whatsappStats as any).qualifiedLeads ?? '—'}</div>
                <div className="text-[10px] font-bold text-text-secondary uppercase mt-1">Qualificados</div>
              </div>
              <div className="bg-black/30 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-400">{(whatsappStats as any).convertedLeads ?? '—'}</div>
                <div className="text-[10px] font-bold text-text-secondary uppercase mt-1">Convertidos</div>
              </div>
              <div className="bg-black/30 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-blue-400">{(whatsappStats as any).activeAgentSessions ?? '—'}</div>
                <div className="text-[10px] font-bold text-text-secondary uppercase mt-1">Sessões Activas</div>
              </div>
            </div>
          </div>
        </div>


        {/* ========================================================================= */}
        <div className="lg:col-span-12">
          <UserBehaviorCard onSelectUser={openDispatchWithUser} />
          <JourneyFunnelCard />
        </div>

        {/* ========================================================================= */}
        {/* ROW 2: EMOTIONS & RECENT LOGS */}
        {/* ========================================================================= */}
        
        {/* Column Left: Emotional Analytics & Interests */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Emotion Matrix */}
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle p-6 rounded-3xl flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Smile size={18} className="text-[#FFB800]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Monitor de Emoção (CRM)</h2>
            </div>

            {/* Check if there is frustrated users and display warning */}
            {emotionDist.find((e: any) => e.current_emotion === 'frustrated' && parseInt(e.count) > 0) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex gap-3 text-xs leading-relaxed text-red-300 animate-pulse-glow">
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <div>
                  <span className="font-bold block text-white">Utilizadores Frustrados Detectados!</span>
                  O sistema silenciou o bot de inteligência e activou o controlo humano para estes casos.
                </div>
              </div>
            )}

            <div className="space-y-4">
              {['excited', 'neutral', 'confused', 'frustrated'].map((emotion) => {
                const item = emotionDist.find((e: any) => e.current_emotion === emotion);
                const count = item ? parseInt(item.count) : 0;
                const total = emotionDist.reduce((acc: number, cur: any) => acc + parseInt(cur.count), 0) || 1;
                const percentage = Math.round((count / total) * 100);

                let label = 'Neutro';
                let colorClass = 'bg-gray-500';
                if (emotion === 'excited') { label = 'Entusiasmado'; colorClass = 'bg-emerald-500'; }
                if (emotion === 'confused') { label = 'Confuso'; colorClass = 'bg-yellow-500'; }
                if (emotion === 'frustrated') { label = 'Frustrado / Falhas'; colorClass = 'bg-red-500'; }

                return (
                  <div key={emotion} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-text-secondary">
                      <span className="flex items-center gap-1.5 text-white">
                        {getEmotionIcon(emotion)}
                        {label}
                      </span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interest Map */}
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle p-6 rounded-3xl flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Target size={18} className="text-blue-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Preferências / Interesses</h2>
            </div>
            
            <div className="space-y-3">
              {summary && summary.scoreDist && summary.scoreDist.length > 0 ? (
                summary.scoreDist.map((lead: any) => (
                  <div key={lead.lead_score_status} className="flex items-center justify-between text-xs p-3 bg-white/5 rounded-2xl">
                    <span className="font-bold capitalize text-white">{lead.lead_score_status}</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded-full font-bold">{lead.count} Leads</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-text-tertiary text-xs">Sem dados de pontuação disponíveis.</div>
              )}
            </div>
          </div>

        </div>

        {/* Column Right: Live Event Feed (Camada 4) */}
        <div className="lg:col-span-8 flex flex-col">
          
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle rounded-3xl p-6 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Network size={18} className="text-purple-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">Eventos do ACE (Real-Time Feed)</h2>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Escuta Activa</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar space-y-3 pr-2">
              {recentEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <Terminal className="text-text-tertiary mb-2" size={32} />
                  <p className="text-xs text-text-tertiary font-medium">Nenhum evento registado nas últimas horas.</p>
                </div>
              ) : (
                recentEvents.map((ev: any, index: number) => (
                  <div key={index} className="flex items-start justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs hover:bg-white/[0.05] transition-all group">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 px-2 py-0.5 text-[9px] font-black rounded-lg border uppercase tracking-wider ${getEventBadgeClass(ev.event_type)}`}>
                        {ev.event_type.replace('_', ' ')}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white group-hover:text-[#FFB800] transition-colors">{ev.user_name || 'Usuário Não Registado'}</span>
                        <span className="text-[10px] text-text-tertiary">ID: {ev.user_id || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-text-secondary font-mono flex items-center gap-1 shrink-0">
                      <Clock size={10} />
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ROW 3: SPECIALIST AGENT PERFORMANCE MATRIX (Camada 2) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-12">
          
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle rounded-3xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#FFB800]" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">Ecosistema de Agentes Especialistas</h2>
              </div>
              <p className="text-xs text-text-secondary hidden md:block">Clique para despachar comandos e testar respostas cognitivas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {[
                { name: 'SDR AI (Alex)', class: 'Agente Vendas', desc: 'Qualificação elegente & fecho comercial' },
                { name: 'Onboarding Agent', class: 'Agente Onboarding', desc: 'Facilitação do Momento WOW nas primeiras 24h' },
                { name: 'Nutrition Agent', class: 'Agente Nutrição', desc: 'Dicas semanais & tendências digitais angolanas' },
                { name: 'Follow-up Agent', class: 'Agente Envios', desc: 'Recuperação de abandonos & leads quentes' },
                { name: 'Retention Agent', class: 'Agente Recuperação', desc: 'Prevenção de churn & monitoramento de inactivos' },
                { name: 'Support Agent (Carlos)', class: 'Agente Atendimento', desc: 'Resolução técnica e escalada para equipa' },
                { name: 'Upsell Agent', class: 'Agente Upsell', desc: 'Upgrades de planos e recargas de créditos' },
                { name: 'Reactivation Agent', class: 'Agente Reactivação', desc: 'Despertar de contas adormecidas (+30 dias)' },
                { name: 'Analytical Agent', class: 'Agente Analítico', desc: 'Mineração de logs, ROI & relatórios semanais' }
              ].map((agent) => {
                const perf = agentPerformance.find((p: any) => p.agent_name === agent.class);
                const total = perf ? parseInt(perf.total_tasks) : 0;
                const completed = perf ? parseInt(perf.completed) : 0;
                const failed = perf ? parseInt(perf.failed) : 0;
                const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;

                return (
                  <div key={agent.name} className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.04] transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-white text-xs lg:text-sm">{agent.name}</span>
                        <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-text-secondary">{agent.class}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed mb-4">{agent.desc}</p>
                    </div>

                    <div className="space-y-4">
                      {/* Stats metrics */}
                      <div className="flex items-center justify-between text-[10px] font-bold text-text-tertiary">
                        <span>Rate: <strong className="text-emerald-400 font-black">{successRate}%</strong></span>
                        <span>Tarefas: <strong className="text-white">{total}</strong></span>
                      </div>

                      {/* Action button */}
                      <button 
                        onClick={() => openDispatchForAgent(agent.class)}
                        className="w-full py-2.5 bg-yellow-500/10 hover:bg-[#FFB800] border border-yellow-500/20 hover:border-transparent text-[#FFB800] hover:text-black text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Play size={12} />
                        Despachar Comando
                      </button>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ROW 4: DETAILED ACTIVE TASK QUEUE LIST */}
        {/* ========================================================================= */}
        <div className="lg:col-span-12">
          
          <div className="bg-surface/30 backdrop-blur-md border border-border-subtle rounded-3xl p-6 lg:p-8 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">Fila Global de Processamento de Tarefas</h2>
              </div>
              
              {/* Task filters */}
              <div className="flex flex-wrap gap-2">
                {['pending', 'running', 'completed', 'failed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedTaskStatus(status)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all capitalize ${
                      selectedTaskStatus === status
                        ? 'bg-[#FFB800] text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white'
                    }`}
                  >
                    {status === 'pending' ? 'Pendente' : status === 'running' ? 'Em Execução' : status === 'completed' ? 'Sucesso' : 'Falha'}
                  </button>
                ))}
              </div>
            </div>

            {/* Task list container */}
            <div className="overflow-x-auto">
              {loadingTasks ? (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <RefreshCw size={24} className="text-[#FFB800] animate-spin mb-2" />
                  <span className="text-xs text-text-tertiary">A carregar fila de tarefas...</span>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-10 text-text-tertiary text-xs">
                  Não há tarefas registadas com o estado <span className="capitalize font-bold text-white">"{selectedTaskStatus}"</span>.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-text-secondary font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Agente</th>
                      <th className="py-3 px-4">Tipo de Acção</th>
                      <th className="py-3 px-4">Utilizador / Alvo</th>
                      <th className="py-3 px-4">Prioridade</th>
                      <th className="py-3 px-4">Criado em</th>
                      <th className="py-3 px-4">Dados (Payload)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-4 font-mono text-text-tertiary">#{task.id}</td>
                        <td className="py-4 px-4 font-bold text-white">{task.agent_name}</td>
                        <td className="py-4 px-4"><span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-mono">{task.task_type}</span></td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{task.user_name || 'N/A'}</span>
                            <span className="text-[10px] text-text-secondary">{task.user_whatsapp || 'WhatsApp N/D'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority === 1 ? 'Urgente' : task.priority === 2 ? 'Alta' : 'Normal'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-text-secondary">
                          {new Date(task.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-4 px-4 max-w-[200px] truncate text-text-secondary font-mono" title={JSON.stringify(task.payload)}>
                          {typeof task.payload === 'string' ? task.payload : JSON.stringify(task.payload)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* DISPATCH TASK DIALOG/MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDispatchModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0E1110] border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Send className="text-[#FFB800]" size={20} />
                  <h3 className="text-md font-black uppercase tracking-wider text-white">Despachar Comando Cognitivo</h3>
                </div>
                <button 
                  onClick={() => setShowDispatchModal(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleDispatch} className="space-y-5 text-sm">
                
                {/* Agent field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Agente Responsável</label>
                  <div className="w-full px-4 py-3 bg-white/5 border border-yellow-500/20 rounded-2xl text-[#FFB800] font-bold flex items-center gap-2">
                    <Bot size={14} className="text-[#FFB800]" />
                    {dispatchAgent}
                  </div>
                </div>

                {/* Task Type — dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Comando Cognitivo</label>
                  {AGENT_COMMANDS[dispatchAgent]?.length ? (
                    <select
                      required
                      value={dispatchTaskType}
                      onChange={(e) => setDispatchTaskType(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0E1110] border border-white/10 hover:border-white/20 focus:border-[#FFB800] rounded-2xl text-white outline-none transition-all appearance-none cursor-pointer"
                    >
                      {AGENT_COMMANDS[dispatchAgent].map(cmd => (
                        <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={dispatchTaskType}
                      onChange={(e) => setDispatchTaskType(e.target.value)}
                      placeholder="Ex: send_message"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#FFB800] rounded-2xl text-white font-mono outline-none transition-all"
                    />
                  )}
                  <p className="text-[10px] text-text-tertiary font-mono pt-0.5">task_type: <span className="text-[#FFB800]">{dispatchTaskType}</span></p>
                </div>

                {/* User ID field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">UUID do Utilizador Alvo <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={dispatchUserId}
                    onChange={(e) => setDispatchUserId(e.target.value)}
                    placeholder="Cole o UUID do utilizador registado na base de dados"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#FFB800] rounded-2xl text-white font-mono text-xs outline-none transition-all"
                  />
                </div>

                {/* Optional note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Nota Interna (opcional)</label>
                  <textarea
                    rows={2}
                    value={dispatchNote}
                    onChange={(e) => setDispatchNote(e.target.value)}
                    placeholder="Ex: Utilizador mencionou dificuldades com a geração de UGC em vídeo vertical..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#FFB800] rounded-2xl text-white text-xs resize-none outline-none transition-all"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={dispatching || !dispatchUserId.trim()}
                  className="w-full py-4 bg-[#FFB800] hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {dispatching ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Play size={16} fill="black" />
                      Emitir Comando Cognitivo
                    </>
                  )}
                </button>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
