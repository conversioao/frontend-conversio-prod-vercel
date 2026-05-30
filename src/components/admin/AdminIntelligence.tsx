import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Users, TrendingUp, AlertTriangle, Target, Zap, Eye, Search, RefreshCw, ChevronRight, Activity, BarChart3, MessageSquare, Cpu, Heart, Star, Loader2, Send, X, CheckCircle } from 'lucide-react';
import { BASE_URL } from '../../lib/api';

// ─── API helpers ──────────────────────────────────────────────────────────────
const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('conversio_token')}`
});

// ─── Emotion colour map ────────────────────────────────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
    excited:    '#22d3ee',
    satisfied:  '#4ade80',
    neutral:    '#94a3b8',
    confused:   '#f59e0b',
    frustrated: '#f87171',
    urgent:     '#fb923c',
};

const CHURN_COLORS: Record<string, string> = {
    baixa:  '#4ade80',
    media:  '#f59e0b',
    alta:   '#f87171',
};

const ENGAGEMENT_COLORS: Record<string, string> = {
    alto:   '#4ade80',
    medio:  '#38bdf8',
    baixo:  '#f87171',
};

// ─── Score badge helper ────────────────────────────────────────────────────────
function ScoreBadge({ score, label }: { score: number; label: string }) {
    const color = score >= 80 ? '#4ade80' : score >= 50 ? '#f59e0b' : '#f87171';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: `3px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color,
                background: `${color}15`
            }}>
                {score}
            </div>
            <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        </div>
    );
}

// ─── Mini donut bar ────────────────────────────────────────────────────────────
function DistributionBar({ data, colorMap }: { data: { key: string; count: number }[]; colorMap: Record<string, string> }) {
    const total = data.reduce((s, d) => s + Number(d.count), 0) || 1;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map(d => (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 90, fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' }}>{d.key}</span>
                    <div style={{ flex: 1, background: '#1e293b', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{
                            width: `${(Number(d.count) / total) * 100}%`,
                            height: '100%',
                            background: colorMap[d.key] || '#6366f1',
                            borderRadius: 4,
                            transition: 'width 0.6s ease'
                        }} />
                    </div>
                    <span style={{ width: 30, textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>{d.count}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#6366f1' }: any) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: `1px solid ${color}30`,
            borderRadius: 16, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: `0 0 20px ${color}10`
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminIntelligence() {
    const [insights, setInsights] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [learnMessage, setLearnMessage] = useState('');
    const [learnResult, setLearnResult] = useState<any>(null);
    const [learnLoading, setLearnLoading] = useState(false);
    const [tab, setTab] = useState<'insights' | 'users' | 'memory'>('insights');

    // ── Load aggregate insights ──────────────────────────────────────────────
    const loadInsights = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/intelligence/insights`, { headers: authHeaders() });
            const data = await res.json();
            if (data.success) setInsights(data.insights);
        } catch (e) { /* silent */ }
    }, []);

    // ── Load user list ───────────────────────────────────────────────────────
    const loadUsers = useCallback(async (page = 1, q = search) => {
        setLoading(true);
        try {
            const url = `${BASE_URL}/admin/intelligence/users?page=${page}&limit=15${q ? `&search=${encodeURIComponent(q)}` : ''}`;
            const res = await fetch(url, { headers: authHeaders() });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
                setPagination(data.pagination);
            }
        } catch (e) { /* silent */ } finally {
            setLoading(false);
        }
    }, [search]);

    // ── Load user profile/memory ─────────────────────────────────────────────
    const loadUserProfile = async (userId: string) => {
        setProfileLoading(true);
        setLearnResult(null);
        try {
            const res = await fetch(`${BASE_URL}/admin/intelligence/profile/${userId}`, { headers: authHeaders() });
            const data = await res.json();
            if (data.success) setUserProfile(data);
        } catch (e) { /* silent */ } finally {
            setProfileLoading(false);
        }
    };

    // ── Trigger learning ─────────────────────────────────────────────────────
    const triggerLearn = async () => {
        if (!learnMessage.trim() || !selectedUser) return;
        setLearnLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/intelligence/learn`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ userId: selectedUser.id, message: learnMessage })
            });
            const data = await res.json();
            if (data.success) {
                setLearnResult(data.extractedData);
                setLearnMessage('');
                // Refresh profile after learning
                await loadUserProfile(selectedUser.id);
            }
        } catch (e) { /* silent */ } finally {
            setLearnLoading(false);
        }
    };

    // ── Initial load ─────────────────────────────────────────────────────────
    useEffect(() => {
        loadInsights();
        loadUsers(1);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers(1, search);
    };

    const selectUser = (u: any) => {
        setSelectedUser(u);
        setUserProfile(null);
        loadUserProfile(u.id);
        setTab('memory');
    };

    // ── Styles ───────────────────────────────────────────────────────────────
    const s = {
        container: {
            minHeight: '100vh',
            background: '#020817',
            color: '#e2e8f0',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            padding: 24,
        } as React.CSSProperties,
        header: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 28,
        } as React.CSSProperties,
        title: { display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties,
        h1: { fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: -0.5, margin: 0 } as React.CSSProperties,
        subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 } as React.CSSProperties,
        tabs: { display: 'flex', gap: 8, marginBottom: 24 } as React.CSSProperties,
        tab: (active: boolean) => ({
            padding: '8px 20px',
            borderRadius: 10,
            border: `1px solid ${active ? '#6366f1' : '#1e293b'}`,
            background: active ? '#6366f1' : 'transparent',
            color: active ? '#fff' : '#64748b',
            fontWeight: 600, fontSize: 13,
            cursor: 'pointer', transition: 'all 0.2s',
        } as React.CSSProperties),
        grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
        grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 } as React.CSSProperties,
        card: {
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid #1e293b',
            borderRadius: 16, padding: 24,
        } as React.CSSProperties,
        cardTitle: { fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: 1 },
        table: { width: '100%', borderCollapse: 'collapse' as const },
        th: { fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'left' as const, padding: '8px 12px', borderBottom: '1px solid #1e293b', textTransform: 'uppercase' as const, letterSpacing: 0.8 },
        td: { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #0f172a', verticalAlign: 'middle' as const },
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={s.container}>
            {/* Header */}
            <div style={s.header}>
                <div style={s.title}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 style={s.h1}>Intelligence & Memory Dashboard</h1>
                        <p style={s.subtitle}>Sistema de Memória Central · Aprendizado Comportamental · Perfis de Utilizadores</p>
                    </div>
                </div>
                <button
                    onClick={() => { loadInsights(); loadUsers(pagination.page); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                    <RefreshCw size={15} /> Atualizar
                </button>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
                {(['insights', 'users', 'memory'] as const).map(t => (
                    <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
                        {t === 'insights' ? '📊 Insights Globais' : t === 'users' ? '👥 Utilizadores' : '🧠 Memória & Perfil'}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: INSIGHTS ═══ */}
            {tab === 'insights' && insights && (
                <>
                    {/* KPI row */}
                    <div style={s.grid4}>
                        <StatCard icon={<Users size={20} />} label="Total de Perfis" value={insights.averageScores.total_profiles || 0} sub="utilizadores rastreados" color="#6366f1" />
                        <StatCard icon={<TrendingUp size={20} />} label="Lead Score Médio" value={insights.averageScores.avg_lead_score || 0} sub="pontuação média" color="#22d3ee" />
                        <StatCard icon={<Brain size={20} />} label="Aprenderam (7d)" value={insights.recentLearningCount || 0} sub="memórias atualizadas" color="#a855f7" />
                        <StatCard icon={<Star size={20} />} label="Premium Score Médio" value={insights.averageScores.avg_premium_score || 0} sub="potencial premium" color="#f59e0b" />
                    </div>

                    <div style={{ ...s.grid2, marginBottom: 24 }}>
                        {/* Emotion Distribution */}
                        <div style={s.card}>
                            <div style={s.cardTitle}>❤️ Distribuição de Emoções</div>
                            <DistributionBar
                                data={(insights.emotionDistribution || []).map((e: any) => ({ key: e.last_emotion, count: e.count }))}
                                colorMap={EMOTION_COLORS}
                            />
                        </div>

                        {/* Churn Risk */}
                        <div style={s.card}>
                            <div style={s.cardTitle}>⚠️ Risco de Churn</div>
                            <DistributionBar
                                data={(insights.churnRisk || []).map((c: any) => ({ key: c.churn_probability, count: c.count }))}
                                colorMap={CHURN_COLORS}
                            />
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                                <div style={s.cardTitle}>📈 Engajamento</div>
                                <DistributionBar
                                    data={(insights.engagementDistribution || []).map((e: any) => ({ key: e.engagement_level, count: e.count }))}
                                    colorMap={ENGAGEMENT_COLORS}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ ...s.grid2, marginBottom: 24 }}>
                        {/* Top Interests */}
                        <div style={s.card}>
                            <div style={s.cardTitle}>🎯 Top Interesses</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(insights.topInterests || []).map((it: any, i: number) => (
                                    <div key={it.primary_interest} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6366f1', fontWeight: 700 }}>{i + 1}</span>
                                        <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1', textTransform: 'capitalize' }}>{it.primary_interest.replace(/_/g, ' ')}</span>
                                        <span style={{ background: '#1e293b', borderRadius: 6, padding: '2px 10px', fontSize: 12, color: '#94a3b8' }}>{it.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Models */}
                        <div style={s.card}>
                            <div style={s.cardTitle}>🤖 Modelos IA Mais Usados</div>
                            {insights.topModelsUsed?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {insights.topModelsUsed.map((m: any, i: number) => (
                                        <div key={m.model} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#a855f720', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#a855f7', fontWeight: 700 }}>{i + 1}</span>
                                            <span style={{ flex: 1, fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace' }}>{m.model}</span>
                                            <span style={{ background: '#1e293b', borderRadius: 6, padding: '2px 10px', fontSize: 12, color: '#94a3b8' }}>{m.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>
                                    Nenhum dado de modelo ainda. As preferências aparecem após gerações.
                                </div>
                            )}

                            {/* Top Objectives */}
                            {insights.topObjectives?.length > 0 && (
                                <>
                                    <div style={{ ...s.cardTitle, marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e293b' }}>🎯 Objetivos Mais Comuns</div>
                                    {insights.topObjectives.slice(0, 5).map((o: any) => (
                                        <div key={o.objective} style={{ padding: '6px 0', fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #0f172a' }}>
                                            "{o.objective}" <span style={{ color: '#475569' }}>({o.count}x)</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ═══ TAB: USERS ═══ */}
            {tab === 'users' && (
                <div style={s.card}>
                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Pesquisar por nome ou email..."
                                style={{
                                    width: '100%', padding: '9px 12px 9px 38px',
                                    background: '#0f172a', border: '1px solid #1e293b',
                                    borderRadius: 10, color: '#e2e8f0', fontSize: 13,
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <button type="submit" style={{ padding: '9px 20px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            Pesquisar
                        </button>
                    </form>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
                    ) : (
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Utilizador</th>
                                    <th style={s.th}>Plano</th>
                                    <th style={s.th}>Lead Score</th>
                                    <th style={s.th}>Emoção</th>
                                    <th style={s.th}>Churn Risk</th>
                                    <th style={s.th}>Gerações</th>
                                    <th style={s.th}>Interesse</th>
                                    <th style={s.th}>Memória</th>
                                    <th style={s.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const hasMemory = u.memory_json && Object.keys(u.memory_json).length > 0;
                                    const objCount = u.memory_json?.objectives?.length || 0;
                                    return (
                                        <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => selectUser(u)}>
                                            <td style={s.td}>
                                                <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{u.name}</div>
                                                <div style={{ fontSize: 11, color: '#475569' }}>{u.email}</div>
                                            </td>
                                            <td style={s.td}>
                                                <span style={{
                                                    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                    background: u.plan === 'premium' ? '#a855f720' : '#1e293b',
                                                    color: u.plan === 'premium' ? '#a855f7' : '#64748b'
                                                }}>{u.plan || 'free'}</span>
                                            </td>
                                            <td style={s.td}>
                                                <span style={{
                                                    fontWeight: 700, fontSize: 16,
                                                    color: u.lead_score >= 80 ? '#4ade80' : u.lead_score >= 50 ? '#f59e0b' : '#f87171'
                                                }}>{u.lead_score || 20}</span>
                                            </td>
                                            <td style={s.td}>
                                                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: `${EMOTION_COLORS[u.last_emotion] || '#94a3b8'}20`, color: EMOTION_COLORS[u.last_emotion] || '#94a3b8' }}>
                                                    {u.last_emotion || 'neutral'}
                                                </span>
                                            </td>
                                            <td style={s.td}>
                                                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: `${CHURN_COLORS[u.churn_probability] || '#94a3b8'}20`, color: CHURN_COLORS[u.churn_probability] || '#94a3b8' }}>
                                                    {u.churn_probability || '–'}
                                                </span>
                                            </td>
                                            <td style={{ ...s.td, color: '#94a3b8' }}>{u.total_generations || 0}</td>
                                            <td style={{ ...s.td, fontSize: 12, color: '#64748b', textTransform: 'capitalize' as const }}>{(u.primary_interest || '–').replace(/_/g, ' ')}</td>
                                            <td style={s.td}>
                                                {hasMemory ? (
                                                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#4ade8020', color: '#4ade80' }}>
                                                        {objCount > 0 ? `${objCount} objetivos` : '✓ activa'}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: '#334155' }}>sem memória</span>
                                                )}
                                            </td>
                                            <td style={s.td}>
                                                <ChevronRight size={16} color="#475569" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, color: '#475569', fontSize: 13 }}>
                        <span>{pagination.total} utilizadores encontrados</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => loadUsers(pagination.page - 1)}
                                style={{ padding: '6px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', opacity: pagination.page <= 1 ? 0.4 : 1 }}>
                                ← Anterior
                            </button>
                            <span style={{ padding: '6px 14px', color: '#64748b' }}>Pág. {pagination.page} / {pagination.totalPages}</span>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => loadUsers(pagination.page + 1)}
                                style={{ padding: '6px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}>
                                Próximo →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TAB: MEMORY / PROFILE ═══ */}
            {tab === 'memory' && (
                <div style={s.grid2}>
                    {/* Left: user selector */}
                    <div style={s.card}>
                        <div style={s.cardTitle}>👥 Selecionar Utilizador</div>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Pesquisar..."
                                style={{ flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                            />
                            <button type="submit" onClick={() => loadUsers(1, search)} style={{ padding: '8px 14px', borderRadius: 8, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Ir</button>
                        </form>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto' }}>
                            {users.map(u => (
                                <div key={u.id} onClick={() => selectUser(u)} style={{
                                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                                    background: selectedUser?.id === u.id ? '#6366f120' : '#0f172a',
                                    border: `1px solid ${selectedUser?.id === u.id ? '#6366f1' : '#1e293b'}`,
                                    transition: 'all 0.2s',
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9' }}>{u.name}</div>
                                    <div style={{ fontSize: 11, color: '#475569' }}>{u.email} · Lead: <span style={{ color: '#6366f1' }}>{u.lead_score || 20}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: profile detail */}
                    <div>
                        {profileLoading && (
                            <div style={{ ...s.card, textAlign: 'center', padding: 60, color: '#475569' }}>
                                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                                <div>A carregar memória...</div>
                            </div>
                        )}

                        {!profileLoading && !selectedUser && (
                            <div style={{ ...s.card, textAlign: 'center', padding: 60, color: '#334155' }}>
                                <Brain size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                <div>Seleciona um utilizador para ver o perfil e a memória compilada.</div>
                            </div>
                        )}

                        {!profileLoading && selectedUser && userProfile && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Score badges */}
                                <div style={s.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{selectedUser.name}</div>
                                            <div style={{ fontSize: 12, color: '#475569' }}>{selectedUser.email}</div>
                                        </div>
                                        <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#6366f120', color: '#6366f1' }}>
                                            {selectedUser.plan || 'free'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0', borderTop: '1px solid #1e293b' }}>
                                        <ScoreBadge score={userProfile.profile?.leadScore || 0} label="Lead" />
                                        <ScoreBadge score={userProfile.profile?.userScore || 0} label="User" />
                                        <ScoreBadge score={userProfile.profile?.premiumScore || 0} label="Premium" />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 12 }}>
                                        {[
                                            { l: '🧠 Nível', v: userProfile.profile?.technicalLevel },
                                            { l: '📊 Engaj.', v: userProfile.profile?.engagementLevel },
                                            { l: '❤️ Emoção', v: userProfile.profile?.lastEmotion },
                                            { l: '⚠️ Churn', v: userProfile.profile?.churnProbability },
                                        ].map(item => (
                                            <span key={item.l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#1e293b', color: '#94a3b8' }}>
                                                {item.l}: <strong style={{ color: '#e2e8f0' }}>{item.v || '–'}</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Análise Preditiva & Créditos */}
                                {userProfile.profile?.memoryJson?.credit_intelligence && (
                                    <div style={s.card}>
                                        <div style={s.cardTitle}>📊 Inteligência Preditiva & Créditos</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                                            <div style={{ background: '#0f172a', padding: 12, borderRadius: 10, border: '1px solid #1e293b' }}>
                                                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Velocidade de Consumo</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, color: 
                                                    userProfile.profile.memoryJson.credit_intelligence.velocity === 'high' ? '#f87171' : 
                                                    userProfile.profile.memoryJson.credit_intelligence.velocity === 'medium' ? '#fb923c' : '#4ade80'
                                                }}>
                                                    <Activity size={16} /> 
                                                    {userProfile.profile.memoryJson.credit_intelligence.velocity === 'high' ? 'Alta / Acelerada' : 
                                                     userProfile.profile.memoryJson.credit_intelligence.velocity === 'medium' ? 'Média / Estável' : 
                                                     userProfile.profile.memoryJson.credit_intelligence.velocity === 'low' ? 'Baixa / Ocasional' : 'Estável'}
                                                </div>
                                            </div>
                                            <div style={{ background: '#0f172a', padding: 12, borderRadius: 10, border: '1px solid #1e293b' }}>
                                                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Previsão de Duração</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, color: 
                                                    userProfile.profile.memoryJson.credit_intelligence.daysUntilExhaustion <= 3 ? '#f87171' : '#cbd5e1'
                                                }}>
                                                    <RefreshCw size={14} className={userProfile.profile.memoryJson.credit_intelligence.daysUntilExhaustion <= 3 ? 'animate-pulse' : ''} /> 
                                                    {userProfile.profile.memoryJson.credit_intelligence.daysUntilExhaustion === 999 ? 'Sem consumo / Estável' : `${userProfile.profile.memoryJson.credit_intelligence.daysUntilExhaustion} dias`}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ background: '#0f172a', padding: 12, borderRadius: 10, border: '1px solid #1e293b', fontSize: 12, lineHeight: 1.5 }}>
                                            <div style={{ color: '#64748b', fontWeight: 600, marginBottom: 4 }}>RECOMENDAÇÃO AUTOMÁTICA DE UPSELL</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <div>📦 <strong>Pacote Ideal:</strong> {userProfile.profile.memoryJson.credit_intelligence.recommendedPackage}</div>
                                                <div>🚀 <strong>Plano Ideal:</strong> {userProfile.profile.memoryJson.credit_intelligence.recommendedPlan}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Retenção & Engajamento */}
                                {userProfile.profile?.memoryJson?.retention_intelligence && (
                                    <div style={s.card}>
                                        <div style={s.cardTitle}>⚠️ Retenção & Análise de Churn</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                                            <div style={{ background: '#0f172a', padding: 12, borderRadius: 10, border: '1px solid #1e293b' }}>
                                                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Variação de Gerações (7d)</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: 
                                                    userProfile.profile.memoryJson.retention_intelligence.hasGensDropped ? '#f87171' : '#4ade80'
                                                }}>
                                                    {userProfile.profile.memoryJson.retention_intelligence.hasGensDropped ? `Queda de ${userProfile.profile.memoryJson.retention_intelligence.percentDrop}% 📉` : 'Uso Estável / Em Alta 📈'}
                                                </div>
                                                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                                                    Média: {userProfile.profile.memoryJson.retention_intelligence.priorGensWeeklyAvg}/sem | Recente: {userProfile.profile.memoryJson.retention_intelligence.recentGens7d}
                                                </div>
                                            </div>
                                            <div style={{ background: '#0f172a', padding: 12, borderRadius: 10, border: '1px solid #1e293b' }}>
                                                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Risco Global de Churn</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, color: 
                                                    userProfile.profile.memoryJson.retention_intelligence.riskStatus === 'critical' || userProfile.profile.memoryJson.retention_intelligence.riskStatus === 'high' ? '#f87171' : 
                                                    userProfile.profile.memoryJson.retention_intelligence.riskStatus === 'medium' ? '#fb923c' : '#4ade80'
                                                }}>
                                                    {userProfile.profile.memoryJson.retention_intelligence.churnRiskScore}% ({userProfile.profile.memoryJson.retention_intelligence.riskStatus.toUpperCase()})
                                                </div>
                                            </div>
                                        </div>
                                        {userProfile.profile.memoryJson.retention_intelligence.suggestedHookMessage && (
                                            <div style={{ background: '#e2e8f008', padding: 10, borderRadius: 8, border: '1px dashed #fb923c40', fontSize: 11, lineHeight: 1.5, color: '#cbd5e1' }}>
                                                💡 <strong>Gancho sugerido para WhatsApp:</strong> "{userProfile.profile.memoryJson.retention_intelligence.suggestedHookMessage}"
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Memory JSON */}
                                {userProfile.profile?.memoryJson && (
                                    <div style={s.card}>
                                        <div style={s.cardTitle}>🧠 Memória Aprendida</div>
                                        {/* Objectives */}
                                        {userProfile.profile.memoryJson.objectives?.length > 0 && (
                                            <div style={{ marginBottom: 14 }}>
                                                <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, marginBottom: 6 }}>OBJETIVOS</div>
                                                {userProfile.profile.memoryJson.objectives.map((o: string, i: number) => (
                                                    <div key={i} style={{ fontSize: 12, color: '#94a3b8', padding: '4px 0', borderBottom: '1px solid #0f172a' }}>→ {o}</div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Challenges */}
                                        {userProfile.profile.memoryJson.challenges?.length > 0 && (
                                            <div style={{ marginBottom: 14 }}>
                                                <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700, marginBottom: 6 }}>DIFICULDADES</div>
                                                {userProfile.profile.memoryJson.challenges.map((c: string, i: number) => (
                                                    <div key={i} style={{ fontSize: 12, color: '#94a3b8', padding: '4px 0', borderBottom: '1px solid #0f172a' }}>⚡ {c}</div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Favorite Models */}
                                        {userProfile.profile.memoryJson.favorite_models?.length > 0 && (
                                            <div style={{ marginBottom: 14 }}>
                                                <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 700, marginBottom: 6 }}>MODELOS FAVORITOS</div>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                                                    {userProfile.profile.memoryJson.favorite_models.map((m: string) => (
                                                        <span key={m} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#a855f720', color: '#a855f7', fontFamily: 'monospace' }}>{m}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {Object.keys(userProfile.profile.memoryJson).length === 0 && (
                                            <div style={{ color: '#334155', fontSize: 13, textAlign: 'center', padding: 20 }}>
                                                Nenhuma memória aprendida ainda. Use o campo abaixo para disparar uma aprendizagem.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Compiled memory prompt */}
                                {userProfile.compiledMemoryPrompt && (
                                    <div style={s.card}>
                                        <div style={s.cardTitle}>📄 Prompt de Memória Compilado</div>
                                        <pre style={{
                                            fontSize: 11, color: '#64748b', whiteSpace: 'pre-wrap' as const,
                                            background: '#0f172a', borderRadius: 8, padding: 12,
                                            maxHeight: 220, overflowY: 'auto', lineHeight: 1.6
                                        }}>
                                            {userProfile.compiledMemoryPrompt}
                                        </pre>
                                    </div>
                                )}

                                {/* Learning trigger */}
                                <div style={s.card}>
                                    <div style={s.cardTitle}>⚡ Disparar Aprendizagem Contínua</div>
                                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                                        Simula uma mensagem do utilizador para o motor de IA extrair objetivos, dificuldades e emoções automaticamente.
                                    </div>
                                    <textarea
                                        value={learnMessage}
                                        onChange={e => setLearnMessage(e.target.value)}
                                        placeholder="Ex: Quero vender moda feminina online em Luanda mas tenho dificuldade em configurar anúncios no Instagram..."
                                        rows={3}
                                        style={{
                                            width: '100%', padding: 12, background: '#0f172a',
                                            border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0',
                                            fontSize: 13, outline: 'none', resize: 'vertical' as const,
                                            boxSizing: 'border-box' as const, lineHeight: 1.5
                                        }}
                                    />
                                    <button
                                        onClick={triggerLearn}
                                        disabled={learnLoading || !learnMessage.trim()}
                                        style={{
                                            marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 20px', borderRadius: 10,
                                            background: learnLoading ? '#334155' : 'linear-gradient(135deg,#6366f1,#a855f7)',
                                            border: 'none', color: '#fff', fontWeight: 600, fontSize: 13,
                                            cursor: learnLoading ? 'not-allowed' : 'pointer'
                                        }}>
                                        {learnLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> A aprender...</> : <><Send size={14} /> Extrair & Aprender</>}
                                    </button>

                                    {learnResult && (
                                        <div style={{ marginTop: 14, padding: 12, background: '#0f172a', borderRadius: 10, border: '1px solid #4ade8030' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#4ade80', fontWeight: 700, fontSize: 13 }}>
                                                <CheckCircle size={14} /> Aprendizagem concluída
                                            </div>
                                            <pre style={{ fontSize: 11, color: '#64748b', whiteSpace: 'pre-wrap' as const, lineHeight: 1.6 }}>
                                                {JSON.stringify(learnResult, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Spin keyframe injection */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
