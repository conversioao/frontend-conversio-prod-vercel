import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Terminal, ShieldAlert, Zap, RefreshCw, Megaphone, Bot, X, Activity, Server,
    Database, Headphones, Brain, CheckCircle2, XCircle, Clock, Play, AlertTriangle,
    ChevronDown, ChevronUp, BarChart2, Users, Target, TrendingUp, Sparkles, Loader2,
    Send, MessageSquare
} from 'lucide-react';
import { useAgentsDashboard } from '../../hooks/useAgentsDashboard';
import { apiFetch } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionPlan {
    id: number;
    type: 'campaign' | 'nurture' | 'followup' | 'recovery' | 'classification';
    title: string;
    description: string;
    priority: 1 | 2 | 3;
    target_segment: any;
    proposed_actions: any[];
    estimated_impact: string;
    status: 'pending_approval' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
    suggested_at: string;
    approved_at?: string;
    approved_by_name?: string;
    executed_at?: string;
    execution_report?: string;
}

interface PlanCounts {
    pending: string;
    approved: string;
    completed: string;
    rejected: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_TYPE_CONFIG = {
    campaign: { label: 'Campanha', icon: Megaphone, color: 'purple' },
    nurture: { label: 'Nutrição', icon: TrendingUp, color: 'emerald' },
    followup: { label: 'Follow-up', icon: Users, color: 'blue' },
    recovery: { label: 'Recuperação', icon: RefreshCw, color: 'orange' },
    classification: { label: 'Classificação', icon: Target, color: 'yellow' },
};

const PRIORITY_CONFIG = {
    1: { label: 'Urgente', color: 'red', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    2: { label: 'Alta', color: 'yellow', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    3: { label: 'Normal', color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const COMMAND_TEMPLATES: Record<string, { label: string, type: string, payload: string }[]> = {
    'monitor': [
        { label: 'Verificar Saúde do Sistema', type: 'health_check', payload: '{"force": true}' },
        { label: 'Alertar Admin (Teste)', type: 'send_alert', payload: '{"message": "Teste do Agente Monitor", "severity": "low"}' },
        { label: 'Verificar Latência das APIs', type: 'check_latency', payload: '{"targets": ["openai", "kie", "evolution"]}' },
        { label: 'Relatório de Erros (24h)', type: 'error_report', payload: '{"timeframe": "24h"}' },
        { label: 'Verificar Espaço em Disco', type: 'check_storage', payload: '{"check": "disk_and_database"}' },
    ],
    'funil': [
        { label: 'Avançar Leads Inativas', type: 'process_funnel', payload: '{"action": "advance_stale"}' },
        { label: 'Recalcular Scores de Todos os Leads', type: 'recalculate_scores', payload: '{"scope": "all"}' },
        { label: 'Promover Leads Quentes para Conversão', type: 'promote_hot', payload: '{"temperature": "hot", "min_score": 70}' },
        { label: 'Enviar Lembrete Abandono', type: 'send_reminder', payload: '{"phone": "244...", "stage": "cart_abandoned"}' },
        { label: 'Relatório de Funil Completo', type: 'funnel_report', payload: '{"include_segments": true}' },
    ],
    'recuperacao': [
        { label: 'Iniciar Ciclo de Recuperação', type: 'start_recovery', payload: '{"segment": "high_risk"}' },
        { label: 'Enviar Oferta Win-back', type: 'send_winback', payload: '{"phone": "244...", "discount": "20%"}' },
        { label: 'Reavaliar Riscos de Churn', type: 'update_churn_risks', payload: '{"threshold": 70}' },
        { label: 'Sequência de Recuperação (3 dias)', type: 'recovery_sequence', payload: '{"days": 3, "steps": 3}' },
        { label: 'Listar Utilizadores em Risco Alto', type: 'list_high_risk', payload: '{"min_churn_score": 80}' },
    ],
    'campanhas': [
        { label: 'Disparar Campanha de Retargeting', type: 'broadcast', payload: '{"segment": "active", "templateId": "promo_v1"}' },
        { label: 'Pausar Campanhas Activas', type: 'pause_campaigns', payload: '{"reason": "manual_override"}' },
        { label: 'Criar Campanha para Novos Utilizadores', type: 'create_campaign', payload: '{"segment": "new_users", "name": "Boas-vindas Semana"}' },
        { label: 'Processar Lotes Pendentes', type: 'process_batches', payload: '{"max_batch": 100}' },
        { label: 'Relatório de Desempenho', type: 'campaign_report', payload: '{"period": "7d"}' },
    ],
    'envios': [
        { label: 'Enviar Mensagem WhatsApp', type: 'send_message', payload: '{"phone": "244...", "message": "Olá, esta é uma mensagem de teste."}' },
        { label: 'Enviar Áudio WhatsApp', type: 'send_audio', payload: '{"phone": "244...", "audioUrl": "https://..."}' },
        { label: 'Processar Fila de Envios', type: 'process_queue', payload: '{"limit": 50}' },
        { label: 'Limpar Fila de Falhas', type: 'clear_failed', payload: '{"max_attempts": 3}' },
        { label: 'Teste de Conectividade WhatsApp', type: 'test_connection', payload: '{"verify": true}' },
    ],
    'atendimento': [
        { label: 'Assumir Chat Manual', type: 'takeover_chat', payload: '{"phone": "244..."}' },
        { label: 'Responder FAQ', type: 'answer_faq', payload: '{"phone": "244...", "questionId": "q_001"}' },
        { label: 'Listar Chats Abertos', type: 'list_open_chats', payload: '{"status": "waiting"}' },
        { label: 'Encerrar Conversas Inativas', type: 'close_inactive', payload: '{"inactive_hours": 24}' },
        { label: 'Encaminhar Lead para Vendas', type: 'escalate_to_sales', payload: '{"phone": "244...", "reason": "hot_lead"}' },
    ],
    'smart': [
        { label: 'Gerar Plano Estratégico Diário', type: 'generate_plan', payload: '{"timeframe": "24h"}' },
        { label: 'Avaliar Risco de Churn (Geral)', type: 'evaluate_churn', payload: '{"segment": "all"}' },
        { label: 'Forçar Execução de Planos Aprovados', type: 'execute_approved', payload: '{"force": true}' },
        { label: 'Analisar Sistema Completo', type: 'full_analysis', payload: '{"depth": "full"}' },
        { label: 'Criar Campanha de Nutrição Automática', type: 'auto_nurture', payload: '{"target": "cold_leads", "days_inactive": 7}' },
        { label: 'Lançar Sequência de Follow-up', type: 'auto_followup', payload: '{"temperature": "warm", "max_leads": 100}' },
        { label: 'Recalcular e Reclassificar Leads', type: 'reclassify_all', payload: '{"recalculate_scores": true}' },
        { label: 'Relatório de Performance dos Agentes', type: 'agent_performance', payload: '{"period": "7d"}' },
        { label: 'Activar Modo Recovery (Churn Alto)', type: 'emergency_recovery', payload: '{"threshold": 60, "urgency": "high"}' },
        { label: 'Resumo Executivo para Admin', type: 'executive_summary', payload: '{"include": ["leads", "revenue", "campaigns", "churn"]}' },
    ]
};

// ─── Action Plan Card ─────────────────────────────────────────────────────────

function ActionPlanCard({ plan, onApprove, onReject, processing }:
    { plan: ActionPlan; onApprove: (id: number) => void; onReject: (id: number) => void; processing: number | null }) {
    const [expanded, setExpanded] = useState(false);
    const typeConfig = PLAN_TYPE_CONFIG[plan.type] || PLAN_TYPE_CONFIG.campaign;
    const priorityConfig = PRIORITY_CONFIG[plan.priority] || PRIORITY_CONFIG[3];
    const TypeIcon = typeConfig.icon;
    const isPending = plan.status === 'pending_approval';
    const isProcessing = processing === plan.id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border bg-zinc-900/80 backdrop-blur-sm transition-all ${
                isPending ? 'border-[#FFB800]/30 hover:border-[#FFB800]/50' :
                plan.status === 'completed' ? 'border-emerald-500/20' :
                plan.status === 'rejected' ? 'border-zinc-800 opacity-60' :
                plan.status === 'approved' ? 'border-blue-500/30' :
                'border-zinc-800'
            }`}
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-${typeConfig.color}-500/10 text-${typeConfig.color}-400 border border-${typeConfig.color}-500/20`}>
                        <TypeIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border} border`}>
                                {priorityConfig.label}
                            </span>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                                {typeConfig.label}
                            </span>
                            <span className="text-[9px] text-zinc-600 ml-auto">
                                {new Date(plan.suggested_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-tight">{plan.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{plan.description}</p>
                    </div>
                </div>

                {/* Impact estimate */}
                {plan.estimated_impact && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl">
                        <BarChart2 size={12} className="text-[#FFB800]" />
                        <span className="text-[10px] text-zinc-400">{plan.estimated_impact}</span>
                    </div>
                )}

                {/* Execution report */}
                {plan.execution_report && plan.status === 'completed' && (
                    <div className="mt-3 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <p className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap">{plan.execution_report}</p>
                    </div>
                )}

                {/* Expand: show proposed actions */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-3 w-full flex items-center justify-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {expanded ? 'Ocultar detalhes' : `Ver ${plan.proposed_actions?.length || 0} acção(ões) planeada(s)`}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 space-y-2">
                                {(plan.proposed_actions || []).map((action: any, i: number) => (
                                    <div key={i} className="px-3 py-2 bg-zinc-800/60 rounded-lg">
                                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{action.action}</p>
                                        {action.message_template && (
                                            <p className="text-[10px] text-zinc-500 mt-1 italic">"{action.message_template}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                {isPending && (
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => onApprove(plan.id)}
                            disabled={isProcessing}
                            className="flex-1 py-2.5 rounded-xl bg-[#FFB800] text-black text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Aprovar
                        </button>
                        <button
                            onClick={() => onReject(plan.id)}
                            disabled={isProcessing}
                            className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-700 text-[11px] font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <XCircle size={12} /> Rejeitar
                        </button>
                    </div>
                )}

                {plan.status === 'approved' && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Clock size={12} className="text-blue-400 animate-pulse" />
                        <span className="text-[10px] text-blue-400 font-bold">Aguardando execução...</span>
                    </div>
                )}

                {plan.status === 'executing' && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-xl">
                        <Loader2 size={12} className="text-[#FFB800] animate-spin" />
                        <span className="text-[10px] text-[#FFB800] font-bold">A executar...</span>
                    </div>
                )}

                {plan.status === 'completed' && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold">Concluído por {plan.approved_by_name || 'Admin'}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminOrchestrator({ onClose }: { onClose: () => void }) {
    const { logs, refresh } = useAgentsDashboard();
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'plans' | 'terminal' | 'chat' | 'approvals'>('plans');
    const [liveTerminalOutput, setLiveTerminalOutput] = useState<any[]>([]);
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Chat state
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Plan state
    const [plans, setPlans] = useState<ActionPlan[]>([]);
    const [planCounts, setPlanCounts] = useState<PlanCounts>({ pending: '0', approved: '0', completed: '0', rejected: '0' });
    const [plansLoading, setPlansLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [processingPlan, setProcessingPlan] = useState<number | null>(null);
    const [triggeringAnalysis, setTriggeringAnalysis] = useState(false);

    const [cmdTaskType, setCmdTaskType] = useState('');
    const [cmdPayload, setCmdPayload] = useState('');
    const [sendingCmd, setSendingCmd] = useState(false);
    
    // Approval state
    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
    const [isApprovalsLoading, setIsApprovalsLoading] = useState(false);

    const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val || !selectedAgent) {
            setCmdTaskType('');
            setCmdPayload('');
            return;
        }
        const idx = parseInt(val);
        const template = COMMAND_TEMPLATES[selectedAgent]?.[idx];
        if (template) {
            setCmdTaskType(template.type);
            setCmdPayload(template.payload);
        }
    };

    const handleSendCommand = async () => {
        if (!selectedAgent) return;
        setSendingCmd(true);
        try {
            const payloadObj = JSON.parse(cmdPayload);
            const res = await apiFetch('/admin/orchestrator/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentName: selectedAgent, taskType: cmdTaskType, payload: payloadObj })
            });
            const data = await res.json();
            if (data.success) {
                refresh();
                alert('Comando enviado com sucesso!');
            } else {
                alert('Erro: ' + data.message);
            }
        } catch (e: any) {
            alert('Erro no payload JSON ou ao enviar: ' + e.message);
        }
        setSendingCmd(false);
    };

    const fetchChatHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const res = await apiFetch('/admin/orchestrator/chat/history');
            const data = await res.json();
            if (data.success) {
                setChatMessages(data.history || []);
            }
        } catch (e) {
            console.error('History error:', e);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleSendChatMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || isChatLoading) return;

        const msg = newMessage;
        setNewMessage('');
        setIsChatLoading(true);

        // Optimistic update
        setChatMessages(prev => [...prev, { role: 'user', content: msg, created_at: new Date().toISOString() }]);

        try {
            const res = await apiFetch('/admin/orchestrator/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            const data = await res.json();
            if (data.success) {
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply, created_at: new Date().toISOString() }]);
            }
        } catch (e) {
            console.error('Chat error:', e);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    useEffect(() => {
        if (activeTab === 'chat' && chatMessages.length === 0) {
            fetchChatHistory();
        }
    }, [activeTab]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalEndRef.current && activeTab === 'terminal') {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [liveTerminalOutput, activeTab]);

    // Polling for logs and plans
    useEffect(() => {
        fetchPlans();
        fetchPendingActions();
        const interval = setInterval(() => {
            refresh();
            fetchPlans();
            fetchPendingActions();
        }, 15000);
        return () => clearInterval(interval);
    }, [filterStatus]);

    const fetchPendingActions = async () => {
        try {
            const res = await apiFetch('/orchestrator/pending-actions');
            const data = await res.json();
            if (data.success) {
                setPendingTasks(data.tasks || []);
                setPendingCampaigns(data.campaigns || []);
            }
        } catch (e) {
            console.error('Error fetching pending actions:', e);
        }
    };

    const handleApproveTask = async (taskId: number) => {
        try {
            const res = await apiFetch(`/orchestrator/tasks/${taskId}/approve`, { method: 'POST' });
            const data = await res.json();
            if (data.success) fetchPendingActions();
        } catch (e) { console.error(e); }
    };

    const handleRejectTask = async (taskId: number) => {
        try {
            const res = await apiFetch(`/orchestrator/tasks/${taskId}/reject`, { method: 'POST' });
            const data = await res.json();
            if (data.success) fetchPendingActions();
        } catch (e) { console.error(e); }
    };

    const handleApproveCampaign = async (campaignId: number) => {
        try {
            const res = await apiFetch(`/campaigns/${campaignId}/launch`, { method: 'POST' });
            const data = await res.json();
            if (data.success) fetchPendingActions();
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (logs.length > 0) {
            const filtered = selectedAgent 
                ? logs.filter((l: any) => l.agent_name?.toLowerCase().includes(selectedAgent))
                : logs;
            setLiveTerminalOutput(filtered.slice(0, 50).reverse());
        }
    }, [logs, selectedAgent]);

    const fetchPlans = async () => {
        try {
            const url = filterStatus
                ? `/admin/orchestrator/action-plans?status=${filterStatus}`
                : `/admin/orchestrator/action-plans`;
            const res = await apiFetch(url);
            const data = await res.json();
            if (data.success) {
                setPlans(data.plans || []);
                setPlanCounts(data.counts || { pending: '0', approved: '0', completed: '0', rejected: '0' });
            }
        } catch (e) {
            console.error('Error fetching plans:', e);
        } finally {
            setPlansLoading(false);
        }
    };

    const handleApprove = async (planId: number) => {
        setProcessingPlan(planId);
        try {
            const res = await apiFetch(`/admin/orchestrator/action-plans/${planId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) await fetchPlans();
        } catch (e) { console.error(e); }
        finally { setProcessingPlan(null); }
    };

    const handleReject = async (planId: number) => {
        setProcessingPlan(planId);
        try {
            const res = await apiFetch(`/admin/orchestrator/action-plans/${planId}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) await fetchPlans();
        } catch (e) { console.error(e); }
        finally { setProcessingPlan(null); }
    };

    const handleTriggerAnalysis = async () => {
        setTriggeringAnalysis(true);
        try {
            await apiFetch('/admin/orchestrator/trigger-analysis', { method: 'POST' });
            setTimeout(() => fetchPlans(), 3000);
        } catch (e) { console.error(e); }
        finally {
            setTimeout(() => setTriggeringAnalysis(false), 5000);
        }
    };

    const systemAgents = [
        { id: 'monitor', name: 'Agente Monitor', role: 'O Guarda / DevOps', desc: 'Vigia e pune comportamentos anormais. Verifica sanidade do sistema, latência das APIs e gera Alertas para o Admin.', icon: ShieldAlert, color: 'red' },
        { id: 'funil', name: 'Agente Funil', role: 'Diretor Comercial', desc: 'Acompanha o ciclo de vida de cada utilizador. Garante que evoluem e injeta lembretes automáticos no WhatsApp.', icon: Zap, color: 'emerald' },
        { id: 'recuperacao', name: 'Agente Recuperação', role: 'O Negociador / Churn', desc: 'Se ocorreu Churn inicia uma sequência de reengajamento com as Leads durante X dias para recuperar vendas perdidas.', icon: RefreshCw, color: 'blue' },
        { id: 'campanhas', name: 'Agente Campanhas', role: 'Marketer Master', desc: 'Ativa e despacha transmissões em massa. Gere broadcasts de WhatsApp baseados em segmentos dinâmicos.', icon: Megaphone, color: 'purple' },
        { id: 'envios', name: 'Agente Envios', role: 'Carteiro CRM', desc: 'Especialista em WhatsApp API. Gere follow-ups, conversas 1x1 da IA e disparos seguros minimizando Rate Limits.', icon: Bot, color: 'yellow' },
        { id: 'atendimento', name: 'Agente Atendimento', role: 'Suporte & Triagem', desc: 'Responde a dúvidas dos subscritores no WhatsApp e encaminha leads quentes para fecho manual.', icon: Headphones, color: 'cyan' },
        { id: 'smart', name: 'Orquestrador IA', role: 'Estratega Central', desc: 'Analisa o estado do sistema a cada 6h e propõe Planos de Ação estratégicos. O Admin aprova antes da execução.', icon: Brain, color: 'amber' },
    ];

    const pendingCount = parseInt(planCounts.pending || '0');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-mono overflow-hidden"
        >
            {/* Header */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/20 rounded-full backdrop-blur-md">
                        <Activity className="text-green-500" size={14} />
                        <span className="text-green-500 text-[10px] font-bold tracking-widest uppercase">SISTEMA ONLINE</span>
                    </div>
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-full backdrop-blur-md cursor-pointer" onClick={() => { setActiveTab('plans'); setFilterStatus('pending_approval'); }}>
                            <Brain className="text-[#FFB800] animate-pulse" size={14} />
                            <span className="text-[#FFB800] text-[10px] font-bold tracking-widest uppercase">{pendingCount} PLANO(S) AGUARDAM APROVAÇÃO</span>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full transition-all pointer-events-auto backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>

            <div className="flex h-full pt-20">
                {/* Left: Agent Network */}
                <div className="w-1/3 h-full border-r border-[#FFB800]/20 bg-gradient-to-br from-black via-zinc-900 to-black p-8 flex flex-col relative overflow-hidden overflow-y-auto">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-screen opacity-50" />
                    <h1 className="text-xl font-bold text-[#FFB800] uppercase tracking-tighter mb-1 relative z-10">Orquestrador Central</h1>
                    <p className="text-zinc-500 text-xs mb-6 max-w-md relative z-10">Equipa Agentiva Autónoma</p>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        {systemAgents.map(agent => {
                            const Icon = agent.icon;
                            const isSelected = selectedAgent === agent.id;
                            return (
                                <motion.button
                                    key={agent.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                                        isSelected ? 'bg-[#FFB800]/5 border-[#FFB800]/30 shadow-[0_0_20px_rgba(255,184,0,0.05)]' : 'bg-zinc-900/30 border-zinc-800/50 hover:border-[#FFB800]/20'
                                    }`}
                                >
                                    <div className={`p-2.5 rounded-full bg-black/50 border border-zinc-700 relative`}>
                                        <Icon size={18} className={isSelected ? 'text-[#FFB800]' : 'text-zinc-400'} />
                                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 animate-ping`} />
                                    </div>
                                    <p className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-[#FFB800]' : 'text-zinc-300'}`}>{agent.name}</p>
                                </motion.button>
                            );
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedAgent && (
                            <motion.div
                                key={selectedAgent}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 p-4 bg-zinc-900/80 border border-[#FFB800]/30 rounded-2xl relative z-10"
                            >
                                {systemAgents.map(a => a.id === selectedAgent && (
                                    <div key={a.id}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <a.icon size={16} className="text-[#FFB800]" />
                                            <h4 className="text-sm font-bold text-white uppercase">{a.role}</h4>
                                        </div>
                                        <p className="text-zinc-400 text-xs leading-relaxed">{a.desc}</p>
                                        
                                        {/* Command Panel */}
                                        <div className="mt-4 pt-4 border-t border-zinc-800">
                                            <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Terminal size={12} /> Console de Comando Directo
                                            </h5>
                                            <div className="space-y-2">
                                                <select 
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFB800]/50 outline-none appearance-none"
                                                    onChange={handleTemplateSelect}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Seleccione uma instrução...</option>
                                                    {COMMAND_TEMPLATES[a.id]?.map((t, idx) => (
                                                        <option key={idx} value={idx}>{t.label}</option>
                                                    ))}
                                                    <option value="custom">-- Comando Personalizado --</option>
                                                </select>

                                                <input 
                                                    type="text" 
                                                    value={cmdTaskType}
                                                    onChange={e => setCmdTaskType(e.target.value)}
                                                    placeholder="Task Type (ex: send_message)"
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFB800]/50 outline-none"
                                                />
                                                <textarea 
                                                    value={cmdPayload}
                                                    onChange={e => setCmdPayload(e.target.value)}
                                                    placeholder='Payload JSON (ex: {"phone": "244...", "message": "..."})'
                                                    rows={3}
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono focus:border-[#FFB800]/50 outline-none resize-none"
                                                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
                                                />
                                                <button 
                                                    onClick={handleSendCommand}
                                                    disabled={sendingCmd || !cmdTaskType}
                                                    className="w-full py-2 bg-[#FFB800]/20 hover:bg-[#FFB800]/30 text-[#FFB800] border border-[#FFB800]/30 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                                                >
                                                    {sendingCmd ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                                    Executar Comando
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Terminal / Plans */}
                <div className="flex-1 h-full flex flex-col">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-6 pt-4 border-b border-zinc-800 shrink-0">
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`px-4 py-2.5 rounded-t-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                activeTab === 'plans' ? 'bg-zinc-900 text-[#FFB800] border-b-2 border-[#FFB800]' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            <Brain size={14} />
                            Planos de Ação
                            {pendingCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-[#FFB800] text-black text-[9px] font-black">{pendingCount}</span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-4 py-2.5 rounded-t-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                activeTab === 'chat' ? 'bg-zinc-900 text-amber-400 border-b-2 border-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            <MessageSquare size={14} />
                            Cérebro IA
                        </button>
                        <button
                            onClick={() => setActiveTab('terminal')}
                            className={`px-4 py-2.5 rounded-t-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                activeTab === 'terminal' ? 'bg-zinc-900 text-[#00FF41] border-b-2 border-[#00FF41]' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            <Terminal size={14} />
                            Kernel Log Stream
                        </button>
                        <button
                            onClick={() => setActiveTab('approvals')}
                            className={`px-4 py-2.5 rounded-t-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                activeTab === 'approvals' ? 'bg-zinc-900 text-pink-500 border-b-2 border-pink-500' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            <ShieldAlert size={14} />
                            Validação
                            {(pendingTasks.length + pendingCampaigns.length) > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[8px] font-bold animate-pulse">
                                    {pendingTasks.length + pendingCampaigns.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {/* Plans Panel */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'plans' && (
                                <motion.div
                                    key="plans"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col"
                                >
                                    {/* Plans toolbar */}
                                    <div className="px-6 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-800 shrink-0">
                                        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                                            {[
                                                { value: '', label: 'Todos' },
                                                { value: 'pending_approval', label: `Pendentes (${planCounts.pending})` },
                                                { value: 'approved', label: `Aprovados (${planCounts.approved})` },
                                                { value: 'completed', label: `Concluídos (${planCounts.completed})` },
                                                { value: 'rejected', label: `Rejeitados (${planCounts.rejected})` },
                                            ].map(f => (
                                                <button
                                                    key={f.value}
                                                    onClick={() => setFilterStatus(f.value)}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                                                        filterStatus === f.value
                                                            ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40'
                                                            : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleTriggerAnalysis}
                                            disabled={triggeringAnalysis}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-[11px] font-black uppercase tracking-wider hover:bg-[#FFB800]/20 transition-all disabled:opacity-50 shrink-0"
                                        >
                                            {triggeringAnalysis ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            Analisar Agora
                                        </button>
                                    </div>

                                    {/* Plans list */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                                        {plansLoading ? (
                                            <div className="flex items-center justify-center py-20">
                                                <Loader2 size={32} className="text-[#FFB800] animate-spin" />
                                            </div>
                                        ) : plans.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <Brain size={48} className="text-zinc-700 mb-4" />
                                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Nenhum plano de ação</p>
                                                <p className="text-zinc-700 text-xs mt-2">Clique em "Analisar Agora" para gerar planos estratégicos.</p>
                                            </div>
                                        ) : (
                                            plans.map((plan) => (
                                                <ActionPlanCard
                                                    key={plan.id}
                                                    plan={plan}
                                                    onApprove={handleApprove}
                                                    onReject={handleReject}
                                                    processing={processingPlan}
                                                />
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                                        {isHistoryLoading && (
                                            <div className="flex items-center justify-center py-10">
                                                <Loader2 size={24} className="text-amber-500 animate-spin" />
                                            </div>
                                        )}
                                        
                                        {!isHistoryLoading && chatMessages.length === 0 && (
                                            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] text-center max-w-lg mx-auto mt-10">
                                                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                                                    <Brain size={32} className="text-amber-500" />
                                                </div>
                                                <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">Conversa com o Orquestrador</h3>
                                                <p className="text-xs text-zinc-500 leading-relaxed">
                                                    Dá instruções directas ao cérebro do sistema. Pergunta sobre o estado das campanhas, pede sugestões de optimização ou define novas prioridades estratégicas.
                                                </p>
                                            </div>
                                        )}

                                        {chatMessages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-1 border ${
                                                        msg.role === 'user' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                                    }`}>
                                                        {msg.role === 'user' ? <Users size={14} /> : <Brain size={14} />}
                                                    </div>
                                                    <div className={`px-4 py-2.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                                                        msg.role === 'user' 
                                                            ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' 
                                                            : 'bg-zinc-950 border border-zinc-900 text-zinc-400 rounded-tl-none'
                                                    }`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {isChatLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-zinc-900 border border-zinc-800 px-5 py-3.5 rounded-2xl text-xs text-zinc-500 flex items-center gap-3">
                                                    <Loader2 size={14} className="animate-spin text-amber-500" />
                                                    O Orquestrador está a processar...
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-6 border-t border-zinc-800 bg-black/40 backdrop-blur-md">
                                        <form onSubmit={handleSendChatMessage} className="flex gap-3">
                                            <div className="flex-1 relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700"><Terminal size={14} /></div>
                                                <input 
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                    placeholder="Digite uma instrução ou pergunta para o sistema..."
                                                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/30 rounded-2xl pl-12 pr-4 py-4 text-xs text-white outline-none transition-all"
                                                />
                                            </div>
                                            <button 
                                                type="submit"
                                                disabled={!newMessage.trim() || isChatLoading}
                                                className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                                            >
                                                <Send size={20} />
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'approvals' && (
                                <motion.div
                                    key="approvals"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col p-6 overflow-y-auto"
                                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
                                >
                                    <h2 className="text-xl font-bold text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                                        <ShieldAlert className="text-pink-500" size={20} /> Acções Pendentes de Validação
                                    </h2>

                                    {(pendingTasks.length === 0 && pendingCampaigns.length === 0) ? (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                            <CheckCircle2 size={48} className="mb-4 text-emerald-500" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Tudo Validado</p>
                                            <p className="text-[10px] mt-2">Não existem tarefas ou campanhas pendentes de revisão.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {/* Campaigns Section */}
                                            {pendingCampaigns.length > 0 && (
                                                <section>
                                                    <h3 className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <Megaphone size={12} /> Campanhas Agendadas ({pendingCampaigns.length})
                                                    </h3>
                                                    <div className="grid gap-4">
                                                        {pendingCampaigns.map(c => (
                                                            <div key={c.id} className="bg-zinc-900/40 border border-pink-500/10 rounded-xl p-5 hover:border-pink-500/30 transition-all group">
                                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white">{c.name}</h4>
                                                                        <p className="text-[10px] text-zinc-500 uppercase mt-1">{c.type} • Proposta em {new Date(c.created_at).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => handleApproveCampaign(c.id)}
                                                                            className="px-4 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase transition-all"
                                                                        >
                                                                            Lançar Agora
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-black/40 rounded-xl p-4 border border-zinc-800 shadow-inner">
                                                                    <p className="text-[11px] text-zinc-300 leading-relaxed italic">"{c.message}"</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Tasks Section */}
                                            {pendingTasks.length > 0 && (
                                                <section>
                                                    <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <MessageSquare size={12} /> Mensagens Individuais ({pendingTasks.length})
                                                    </h3>
                                                    <div className="grid gap-4">
                                                        {pendingTasks.map(t => {
                                                            const payload = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload;
                                                            return (
                                                                <div key={t.id} className="bg-zinc-900/40 border border-orange-500/10 rounded-xl p-5 hover:border-orange-500/30 transition-all group">
                                                                    <div className="flex justify-between items-start gap-4 mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 text-[10px] font-black uppercase">
                                                                                {t.agent_name?.substring(0, 1) || 'A'}
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-sm font-bold text-white leading-none">{t.task_type}</h4>
                                                                                <p className="text-[10px] text-zinc-500 uppercase mt-1">Utilizador: {payload.userId || 'Sistema'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button 
                                                                                onClick={() => handleApproveTask(t.id)}
                                                                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all"
                                                                                title="Aprovar"
                                                                            >
                                                                                <CheckCircle2 size={16} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleRejectTask(t.id)}
                                                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all"
                                                                                title="Rejeitar"
                                                                            >
                                                                                <XCircle size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-black/40 rounded-xl p-4 border border-zinc-800 shadow-inner">
                                                                        <p className="text-[11px] text-zinc-300 leading-relaxed italic">"{payload.message}"</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Terminal Panel */}
                            {activeTab === 'terminal' && (
                                <motion.div
                                    key="terminal"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col p-6"
                                >
                                    <div className="flex-1 overflow-y-auto bg-zinc-950/50 border border-zinc-900 rounded-xl p-6 shadow-inner relative mb-4" style={{ scrollbarWidth: 'thin' }}>
                                        {liveTerminalOutput.length === 0 ? (
                                            <div className="text-zinc-600 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-zinc-600 animate-pulse rounded-full" /> Aguardando inputs do sistema...
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {liveTerminalOutput.map((log: any, index: number) => (
                                                    <div key={log.id || index} className="text-sm">
                                                        <span className="text-zinc-500">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                                        {log.type === 'command' ? (
                                                            <>
                                                                <span className="text-[#FFB800] ml-2 font-black tracking-widest uppercase">{">"} ADMIN_CMD:</span>
                                                                <span className="text-white ml-2">{log.action}</span>
                                                            </>
                                                        ) : log.type === 'response' ? (
                                                            <>
                                                                <span className="text-[#00FF41] ml-2 font-black tracking-widest uppercase">{"<"} KERNEL_RSP:</span>
                                                                <div className="text-white ml-10 p-3 bg-white/5 border-l-2 border-[#00FF41] mt-1 italic whitespace-pre-wrap">{log.action}</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-[#FFB800] ml-2">[{log.agent_name}]</span>
                                                                {log.result === 'error' ? (
                                                                    <span className="text-red-500 ml-2">❌ {log.action} falhou!</span>
                                                                ) : (
                                                                    <span className="text-[#00FF41] ml-2">✓ {log.action}</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                                <div ref={terminalEndRef} className="h-4" />
                                                <div className="text-[#00FF41] animate-pulse">_</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Command Input */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#00FF41]">
                                            <span className="font-black animate-pulse">{">"}</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="DIGITE UM COMANDO..."
                                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-4 pl-10 pr-16 text-[#00FF41] placeholder:text-zinc-700 outline-none focus:border-[#00FF41]/50 transition-all font-mono text-sm uppercase tracking-wider"
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    const input = e.currentTarget;
                                                    const val = input.value.trim();
                                                    if (!val) return;
                                                    setLiveTerminalOutput(prev => [...prev, {
                                                        type: 'command', agent_name: 'Kernel',
                                                        action: val, created_at: new Date().toISOString()
                                                    }]);
                                                    input.value = '';
                                                    try {
                                                        const res = await apiFetch('/admin/orchestrator/command', {
                                                            method: 'POST', body: JSON.stringify({ command: val })
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            setLiveTerminalOutput(prev => [...prev, {
                                                                type: 'response', agent_name: 'Kernel',
                                                                action: data.reply, created_at: new Date().toISOString()
                                                            }]);
                                                        }
                                                    } catch (err) {
                                                        setLiveTerminalOutput(prev => [...prev, {
                                                            type: 'error', agent_name: 'Kernel',
                                                            action: 'Erro de ligação ao cérebro central.', created_at: new Date().toISOString()
                                                        }]);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
            `}</style>
        </motion.div>
    );
}
