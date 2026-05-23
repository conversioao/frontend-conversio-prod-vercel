import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Award, Zap, AlertTriangle, Users, Layers, PieChart,
    RefreshCw, Play, BarChart2, ShieldAlert
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function JourneyFunnelCard() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [manualUserId, setManualUserId] = useState('');
    const [manualSequenceType, setManualSequenceType] = useState('onboarding');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/journey/funnel-stats');
            const data = await res.json();
            if (data.success) {
                setStats(data);
            } else {
                toast.error(data.message || 'Erro ao carregar estatísticas.');
            }
        } catch (e: any) {
            console.error(e);
            toast.error('Erro ao conectar ao servidor para obter o funil.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleStartJourney = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = manualUserId.trim();
        if (!userId) {
            toast.error('Por favor, insira o UUID do utilizador.');
            return;
        }

        setActionLoading(true);
        try {
            const res = await api.post('/journey/start', {
                userId,
                sequenceType: manualSequenceType
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Jornada "${manualSequenceType}" iniciada com sucesso!`);
                setManualUserId('');
                fetchStats();
            } else {
                toast.error(data.message || 'Erro ao iniciar jornada.');
            }
        } catch (e) {
            toast.error('Erro de rede ao iniciar jornada.');
        } finally {
            setActionLoading(false);
        }
    };

    // Estágios fictícios padrão se não houver dados
    const mockStages = [
        { stage: 'Descoberta / Leads', count: 120, pct: 100, color: 'from-[#FFB800] to-[#FF8A00]' },
        { stage: 'SDR Contactado', count: 85, pct: 70, color: 'from-blue-500 to-indigo-500' },
        { stage: 'Qualificados', count: 48, pct: 40, color: 'from-teal-500 to-emerald-500' },
        { stage: 'Ativação (Moment WOW)', count: 32, pct: 26, color: 'from-purple-500 to-pink-500' },
        { stage: 'Clientes Premium (Upsell)', count: 12, pct: 10, color: 'from-red-500 to-rose-500' }
    ];

    const stagesToRender = stats?.stages && stats.stages.length > 0 
        ? stats.stages.map((stg: any, i: number) => {
            const total = stats.stages[0]?.count || 1;
            const pct = Math.round((stg.count / total) * 100);
            const colors = [
                'from-[#FFB800] to-[#FF8A00]',
                'from-blue-500 to-indigo-500',
                'from-teal-500 to-emerald-500',
                'from-purple-500 to-pink-500',
                'from-red-500 to-rose-500'
            ];
            return {
                stage: stg.stage.replace('_', ' ').toUpperCase(),
                count: parseInt(stg.count),
                pct,
                color: colors[i % colors.length]
            };
          })
        : mockStages;

    return (
        <div className="bg-[#0f0f15]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl mt-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Layers className="text-[#FFB800]" size={22} />
                        Autonomous Journey & Conversion Funnel
                    </h3>
                    <p className="text-xs text-white/50 mt-1">
                        Funil de conversão autónomo segmentado por nichos reais de Angola.
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. VISUAL FUNNEL CHART */}
                <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-6">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart2 size={16} className="text-[#FFB800]" />
                        Taxas de Conversão do Funil
                    </h4>

                    <div className="space-y-4">
                        {stagesToRender.map((stage: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-white/70 flex items-center gap-1.5">
                                        <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${stage.color}`} />
                                        {stage.stage}
                                    </span>
                                    <span className="text-white font-mono">{stage.count} leads ({stage.pct}%)</span>
                                </div>
                                <div className="h-4 w-full bg-white/5 rounded-lg overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stage.pct}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className={`h-full bg-gradient-to-r ${stage.color} rounded-lg`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. NICHE & PLAN BREAKDOWN */}
                <div className="space-y-6">
                    {/* Nichos */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <PieChart size={16} className="text-[#FFB800]" />
                            Breakdown por Nichos (Angola)
                        </h4>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] text-white/40 uppercase block">Moda</span>
                                <p className="text-lg font-bold text-[#FFB800] mt-0.5">
                                    {stats?.niches?.moda || 0}
                                </p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] text-white/40 uppercase block">Agências</span>
                                <p className="text-lg font-bold text-blue-400 mt-0.5">
                                    {stats?.niches?.agencias || 0}
                                </p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] text-white/40 uppercase block">Criadores</span>
                                <p className="text-lg font-bold text-purple-400 mt-0.5">
                                    {stats?.niches?.criadores || 0}
                                </p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] text-white/40 uppercase block">Geral</span>
                                <p className="text-lg font-bold text-white/70 mt-0.5">
                                    {stats?.niches?.geral || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Active Sequences */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Zap size={16} className="text-teal-400" />
                            Sequências de Jornada Ativas
                        </h4>

                        <div className="space-y-2">
                            {stats?.activeSequences && stats.activeSequences.length > 0 ? (
                                stats.activeSequences.map((seq: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                        <span className="capitalize text-white/70 font-semibold">{seq.sequence_type}</span>
                                        <span className="bg-teal-500/10 text-teal-400 font-mono font-bold px-2 py-0.5 rounded border border-teal-500/20">
                                            {seq.count} ativas
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-white/30 text-center py-2">Sem sequências activas no momento.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. TRIGGER MANUAL DE JORNADA */}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 mt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Play size={16} className="text-emerald-400" />
                            Despacho Manual de Jornada
                        </h4>
                        <p className="text-xs text-white/40 mt-0.5">
                            Selecione um utilizador e inicie imediatamente uma sequência temporária de teste.
                        </p>
                    </div>

                    <form onSubmit={handleStartJourney} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="UUID do Utilizador..."
                            value={manualUserId}
                            onChange={(e) => setManualUserId(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FFB800] transition flex-1 min-w-[200px]"
                        />
                        <select
                            value={manualSequenceType}
                            onChange={(e) => setManualSequenceType(e.target.value)}
                            className="bg-[#0f0f15] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#FFB800] transition"
                        >
                            <option value="onboarding">Onboarding (D0-D7)</option>
                            <option value="nutrition">Nutrição (D10-D21)</option>
                            <option value="retention">Retenção (Anti-Churn)</option>
                            <option value="reactivation">Reactivação (Dormant)</option>
                        </select>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="bg-[#FFB800] text-black font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-[#e0a200] active:scale-95 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {actionLoading ? <RefreshCw className="animate-spin" size={14} /> : 'Iniciar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
