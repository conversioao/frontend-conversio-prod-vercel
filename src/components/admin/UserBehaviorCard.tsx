import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Brain, TrendingUp, Cpu, Award, Zap, AlertTriangle, CheckCircle,
    User, HelpCircle, Frown, Smile, ShoppingCart, RefreshCw, Eye, History, Activity
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface BehavioralProfile {
    userId: string;
    primaryInterest: string;
    technicalLevel: string;
    engagementLevel: string;
    usageFrequency: string;
    purchaseIntention: string;
    churnProbability: string;
    leadScore: number;
    userScore: number;
    premiumScore: number;
    lastEmotion: string;
    sessionCount: number;
    totalGenerations: number;
    failedGenerations: number;
    creditsUsed: number;
    pricingPageVisits: number;
    lastActiveAt: string;
    updatedAt: string;
    memoryJson: any;
}

interface UserBehaviorCardProps {
    onSelectUser?: (userId: string) => void;
}

export default function UserBehaviorCard({ onSelectUser }: UserBehaviorCardProps) {
    const [userIdSearch, setUserIdSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const uuid = userIdSearch.trim();
        if (!uuid) {
            toast.error('Insira um UUID de utilizador válido.');
            return;
        }

        // Simples validação de formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
            toast.error('O formato do UUID do utilizador é inválido.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/orchestrator/profile/${uuid}`);
            const data = await res.json();
            if (data.success) {
                setProfileData(data);
                toast.success('Perfil comportamental obtido em tempo real!');
            } else {
                toast.error(data.message || 'Utilizador não encontrado ou sem perfil.');
                setProfileData(null);
            }
        } catch (e: any) {
            console.error(e);
            toast.error('Erro ao conectar ao servidor para obter o perfil.');
            setProfileData(null);
        } finally {
            setLoading(false);
        }
    };

    const getEmotionIcon = (emotion: string) => {
        switch (emotion) {
            case 'excited': return <Smile className="text-emerald-400" size={20} />;
            case 'frustrated': return <Frown className="text-red-500 animate-bounce" size={20} />;
            case 'confused': return <HelpCircle className="text-yellow-400 animate-pulse" size={20} />;
            case 'urgent': return <Zap className="text-orange-400 animate-pulse" size={20} />;
            case 'satisfied': return <CheckCircle className="text-green-400" size={20} />;
            default: return <Smile className="text-gray-400" size={20} />;
        }
    };

    const getEmotionLabel = (emotion: string) => {
        switch (emotion) {
            case 'excited': return 'Entusiasmado(a)';
            case 'frustrated': return 'Frustrado(a) (Urgente)';
            case 'confused': return 'Confuso(a)';
            case 'urgent': return 'Compra Iminente';
            case 'satisfied': return 'Satisfeito(a)';
            default: return 'Neutro / Estável';
        }
    };

    const getChurnClass = (prob: string) => {
        switch (prob) {
            case 'alta': return 'bg-red-500/20 text-red-400 border border-red-500/30';
            case 'media': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            default: return 'bg-green-500/20 text-green-400 border border-green-500/30';
        }
    };

    const getIntentClass = (intent: string) => {
        switch (intent) {
            case 'alta': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'media': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/20';
        }
    };

    const getTechnicalBadgeClass = (level: string) => {
        switch (level) {
            case 'avancado': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
            case 'intermedio': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            default: return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
        }
    };

    const getInterestLabel = (interest: string) => {
        switch (interest) {
            case 'videos': return 'Criativos de Vídeo';
            case 'branding': return 'Branding & Identidade';
            case 'ugc': return 'Vídeos UGC Estilo Humano';
            case 'moda': return 'Catálogo de Moda/Fashion';
            case 'social_media': return 'Postagens Redes Sociais';
            case 'campanhas_premium': return 'Campanhas Enterprise';
            default: return 'Geral / Redes Sociais';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'from-purple-500 to-indigo-500';
        if (score >= 60) return 'from-emerald-500 to-teal-500';
        if (score >= 40) return 'from-yellow-500 to-amber-500';
        return 'from-red-500 to-orange-500';
    };

    return (
        <div className="bg-[#0f0f15]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl mt-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Brain className="text-[#FFB800]" size={22} />
                        Motor de Perfil Comportamental Supremo ao Vivo
                    </h3>
                    <p className="text-xs text-white/50">
                        Insira o UUID do utilizador para analisar live scores, intenção de compra, emoção e histórico de eventos.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="UUID do Utilizador..."
                            value={userIdSearch}
                            onChange={(e) => setUserIdSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FFB800] transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#FFB800] text-black font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#e0a200] active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Analisar'}
                    </button>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {profileData ? (
                    <motion.div
                        key={profileData.profile.userId}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        {/* HEADER DE DADOS GERAIS */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#FFB800]/10 text-[#FFB800] rounded-xl">
                                    <User size={24} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white flex items-center gap-2">
                                        Utilizador Identificado
                                        <span className="text-[10px] text-white/40 font-mono tracking-wider font-normal bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                            {profileData.profile.userId}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/40">
                                        Última atividade: {new Date(profileData.profile.lastActiveAt).toLocaleString('pt-AO')}
                                    </p>
                                </div>
                            </div>
                            
                            {onSelectUser && (
                                <button
                                    onClick={() => onSelectUser(profileData.profile.userId)}
                                    className="bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs px-3 py-1.5 rounded-lg active:scale-95 transition flex items-center gap-1.5"
                                >
                                    <Zap size={14} className="text-[#FFB800]" />
                                    Despachar Comando Manual
                                </button>
                            )}
                        </div>

                        {/* ROW DE SCORES COGNITIVOS EM DESTAQUE E PREMIUNS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* LEAD SCORE CARD */}
                            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.04] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-xs text-white/40 font-semibold tracking-wider uppercase">Lead Score Comercial</span>
                                        <h4 className="text-3xl font-extrabold text-white mt-1">{profileData.profile.leadScore}%</h4>
                                    </div>
                                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                                <div className="w-full mt-4">
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getScoreColor(profileData.profile.leadScore)} rounded-full`}
                                            style={{ width: `${profileData.profile.leadScore}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                        <span>Frio (0)</span>
                                        <span>Premium (100)</span>
                                    </div>
                                </div>
                            </div>

                            {/* USER SCORE (PROFICIENCY) */}
                            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.04] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-xs text-white/40 font-semibold tracking-wider uppercase">Proficiência na Plataforma</span>
                                        <h4 className="text-3xl font-extrabold text-white mt-1">{profileData.profile.userScore}%</h4>
                                    </div>
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                        <Cpu size={20} />
                                    </div>
                                </div>
                                <div className="w-full mt-4">
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getScoreColor(profileData.profile.userScore)} rounded-full`}
                                            style={{ width: `${profileData.profile.userScore}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                        <span>Iniciante</span>
                                        <span>Power User</span>
                                    </div>
                                </div>
                            </div>

                            {/* PREMIUM SCORE (ENTERPRISE POTENTIAL) */}
                            <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.04] border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-xs text-white/40 font-semibold tracking-wider uppercase">Potencial Corporativo</span>
                                        <h4 className="text-3xl font-extrabold text-white mt-1">{profileData.profile.premiumScore}%</h4>
                                    </div>
                                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                                        <Award size={20} />
                                    </div>
                                </div>
                                <div className="w-full mt-4">
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getScoreColor(profileData.profile.premiumScore)} rounded-full`}
                                            style={{ width: `${profileData.profile.premiumScore}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                        <span>Básico / Free</span>
                                        <span>Agência / Enterprise</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW CENTRAL DE DETALHES COMPORTAMENTAIS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* CARACTERÍSTICAS COMPORTAMENTAIS */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                                <h5 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Activity size={16} className="text-[#FFB800]" />
                                    Perfis de Segmentação
                                </h5>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/50">Interesse Principal:</span>
                                        <span className="text-white font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                            {getInterestLabel(profileData.profile.primaryInterest)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/50">Nível Técnico:</span>
                                        <span className={`font-bold px-2.5 py-1 rounded-lg text-xs capitalize ${getTechnicalBadgeClass(profileData.profile.technicalLevel)}`}>
                                            {profileData.profile.technicalLevel}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/50">Probabilidade de Churn:</span>
                                        <span className={`font-bold px-2.5 py-1 rounded-lg text-xs capitalize flex items-center gap-1.5 ${getChurnClass(profileData.profile.churnProbability)}`}>
                                            {profileData.profile.churnProbability === 'alta' && <AlertTriangle size={12} />}
                                            {profileData.profile.churnProbability}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/50">Intenção de Compra:</span>
                                        <span className={`font-bold px-2.5 py-1 rounded-lg text-xs capitalize flex items-center gap-1.5 ${getIntentClass(profileData.profile.purchaseIntention)}`}>
                                            {profileData.profile.purchaseIntention === 'alta' && <ShoppingCart size={12} />}
                                            {profileData.profile.purchaseIntention}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/50">Estado Emocional Recente:</span>
                                        <span className="text-white font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2">
                                            {getEmotionIcon(profileData.profile.lastEmotion)}
                                            {getEmotionLabel(profileData.profile.lastEmotion)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* MÉTRICAS E CONTADORES */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                                <h5 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                                    <TrendingUp size={16} className="text-[#FFB800]" />
                                    Métricas e Estatísticas Acumuladas
                                </h5>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-white/40 uppercase font-semibold">Sessões Totais</span>
                                        <p className="text-lg font-bold text-white">{profileData.profile.sessionCount}</p>
                                    </div>
                                    
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-white/40 uppercase font-semibold">Gerações OK</span>
                                        <p className="text-lg font-bold text-emerald-400">{profileData.profile.totalGenerations}</p>
                                    </div>

                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-white/40 uppercase font-semibold">Gerações Falhadas</span>
                                        <p className={`text-lg font-bold ${profileData.profile.failedGenerations > 0 ? 'text-red-400' : 'text-white/60'}`}>
                                            {profileData.profile.failedGenerations}
                                        </p>
                                    </div>

                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-white/40 uppercase font-semibold">Preços Visitados</span>
                                        <p className="text-lg font-bold text-blue-400">{profileData.profile.pricingPageVisits}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW DO TIMELINE E HISTÓRICO DE TAREFAS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* EVENTOS RECENTES TIMELINE */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                                <h5 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                                    <History size={16} className="text-[#FFB800]" />
                                    Eventos Comportamentais Recentes
                                </h5>

                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                    {profileData.recentEvents && profileData.recentEvents.length > 0 ? (
                                        profileData.recentEvents.map((evt: any, i: number) => (
                                            <div key={i} className="flex gap-3 text-xs items-start border-l border-white/10 pl-3 pb-3 relative">
                                                <div className="absolute w-2 h-2 rounded-full bg-[#FFB800] -left-[5px] top-1" />
                                                <div className="flex-1">
                                                    <span className="font-mono text-white tracking-wide block font-semibold">{evt.event_type}</span>
                                                    <span className="text-[10px] text-white/30 block mt-0.5">
                                                        {new Date(evt.created_at).toLocaleString('pt-AO')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-white/30 text-center py-4">Nenhum evento comportamental registado.</p>
                                    )}
                                </div>
                            </div>

                            {/* HISTÓRICO DE TAREFAS MULTIAGENTE */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                                <h5 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                                    <History size={16} className="text-[#FFB800]" />
                                    Últimas Ações dos Agentes Autónomos
                                </h5>

                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                    {profileData.agentHistory && profileData.agentHistory.length > 0 ? (
                                        profileData.agentHistory.map((task: any) => (
                                            <div key={task.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-2 text-xs">
                                                <div>
                                                    <div className="font-bold text-white flex items-center gap-1.5">
                                                        {task.agent_name}
                                                        <span className="text-[10px] text-white/40 font-normal">({task.task_type})</span>
                                                    </div>
                                                    <span className="text-[10px] text-white/30 block mt-0.5">
                                                        Criada em {new Date(task.created_at).toLocaleTimeString('pt-AO')}
                                                    </span>
                                                </div>

                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                                    task.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    task.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-white/30 text-center py-4">Nenhuma ação registada recentemente.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <Brain className="text-white/10 mb-3 animate-pulse" size={48} />
                        <h4 className="text-sm font-semibold text-white/60">Sem Perfil Carregado</h4>
                        <p className="text-xs text-white/30 max-w-sm mt-1">
                            Pesquise um UUID de utilizador válido acima para carregar a análise cognitiva e ver as interações em tempo real.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
