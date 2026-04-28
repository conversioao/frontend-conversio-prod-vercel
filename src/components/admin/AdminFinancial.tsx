import React, { useEffect, useState } from 'react';
import {
  TrendingUp, DollarSign, Package, Users, Activity, Image as ImageIcon,
  Video, Mic, Zap, RefreshCw, AlertCircle, BarChart2, Music, Clock,
  CheckCircle2, XCircle, ChevronRight, ArrowUpRight, Wallet, ReceiptText,
  Cpu, ShoppingCart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, AreaChart, Area, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { apiFetch } from '../../lib/api';

const COLORS = ['#FFB800', '#4ADE80', '#818CF8', '#F87171', '#38BDF8', '#FB923C', '#A78BFA', '#34D399'];

function formatKz(val: number) {
  return new Intl.NumberFormat('pt-AO').format(Math.round(val)) + ' Kz';
}

function StatCard({ icon, label, value, sub, color = 'text-[#FFB800]', bg = 'bg-[#FFB800]/10', border = 'border-[#FFB800]/20' }: any) {
  return (
    <div className={`bg-surface border ${border} rounded-[2rem] p-6 flex flex-col gap-3 relative overflow-hidden group hover:scale-[1.01] transition-all`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg} ${color} border ${border}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-2xl font-black text-text-primary tracking-tighter">{value}</h3>
        {sub && <p className={`text-xs font-bold mt-1 ${color}`}>{sub}</p>}
      </div>
      <div className={`absolute bottom-0 right-0 w-20 h-20 blur-3xl opacity-20 ${bg} rounded-full translate-x-1/3 translate-y-1/3`} />
    </div>
  );
}

const typeIconMap: Record<string, any> = {
  image: <ImageIcon size={14} className="text-blue-400" />,
  video: <Video size={14} className="text-purple-400" />,
  audio: <Mic size={14} className="text-emerald-400" />,
  voice: <Mic size={14} className="text-orange-400" />,
  musica: <Music size={14} className="text-pink-400" />,
};

export function AdminFinancial() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const userStr = localStorage.getItem('conversio_user');
  const adminId = userStr ? JSON.parse(userStr).id : null;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/admin/financial?adminId=${adminId}`);
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.message || 'Erro ao carregar dados financeiros.');
    } catch (e: any) {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (txId: string) => {
    setApprovingId(txId);
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/transactions/${txId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      const json = await res.json();
      if (json.success) fetchData();
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (txId: string) => {
    setApprovingId(txId);
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/transactions/${txId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      const json = await res.json();
      if (json.success) fetchData();
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw size={48} className="animate-spin text-[#FFB800]" />
        <span className="text-xs font-black uppercase tracking-[0.3em] text-text-tertiary">Carregando dados financeiros...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} className="text-red-500 opacity-50" />
        <p className="text-text-secondary font-medium">{error}</p>
        <button onClick={fetchData} className="px-6 py-3 bg-[#FFB800] text-black font-black uppercase text-xs rounded-2xl">
          Tentar novamente
        </button>
      </div>
    </div>
  );

  const totalGenCount = (data?.genByType || []).reduce((a: number, b: any) => a + Number(b.count), 0);
  const conversionRate = data?.totalUsers > 0
    ? ((data?.totalTransactions / data?.totalUsers) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-16">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-3">
            <BarChart2 className="text-[#FFB800]" size={40} />
            Controlo Financeiro
          </h1>
          <p className="text-text-secondary mt-2 font-medium">
            Receita, conversão, pacotes e motores IA — dados em tempo real.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-3 bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 rounded-2xl font-black uppercase text-xs hover:bg-[#FFB800] hover:text-black transition-all"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* KPI Cards Row 1 — Revenue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={20} />}
          label="MRR (Este Mês)"
          value={formatKz(data?.mrr || 0)}
          sub="Transações aprovadas"
          color="text-[#FFB800]" bg="bg-[#FFB800]/10" border="border-[#FFB800]/20"
        />
        <StatCard
          icon={<Wallet size={20} />}
          label="Receita Total"
          value={formatKz(data?.totalRevenue || 0)}
          sub="Desde sempre"
          color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20"
        />
        <StatCard
          icon={<ReceiptText size={20} />}
          label="Transações Aprovadas"
          value={(data?.totalTransactions || 0).toLocaleString()}
          sub={`${data?.pendingTransactions || 0} pendentes`}
          color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20"
        />
        <StatCard
          icon={<ArrowUpRight size={20} />}
          label="Taxa de Conversão"
          value={`${conversionRate}%`}
          sub="Utilizadores que compraram"
          color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20"
        />
      </div>

      {/* KPI Cards Row 2 — Users & Activity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Total Utilizadores"
          value={(data?.totalUsers || 0).toLocaleString()}
          sub={`${data?.activeUsers || 0} ativos (7d)`}
          color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Online Agora"
          value={data?.onlineUsers || 0}
          sub="Ativos nos últ. 5 min"
          color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Total Gerações"
          value={totalGenCount.toLocaleString()}
          sub="Todos os tipos"
          color="text-[#FFB800]" bg="bg-[#FFB800]/10" border="border-[#FFB800]/20"
        />
        <StatCard
          icon={<ShoppingCart size={20} />}
          label="Pacotes Populares"
          value={(data?.packageStats?.length || 0)}
          sub="Variedades vendidas"
          color="text-pink-400" bg="bg-pink-500/10" border="border-pink-500/20"
        />
      </div>

      {/* Pending Payments Alert + Action Table */}
      {data?.pendingPayments?.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] overflow-hidden">
          <div className="flex items-center gap-4 p-6 border-b border-amber-500/20">
            <AlertCircle size={24} className="text-amber-500 shrink-0" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest text-amber-500">
                {data.pendingTransactions} Pagamento(s) Aguardando Aprovação
              </h4>
              <p className="text-xs font-medium text-text-secondary">
                Clique em Aprovar ou Rejeitar para processar cada transação.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase font-black tracking-widest text-text-tertiary border-b border-amber-500/10">
                  <th className="px-6 py-3 text-left">Utilizador</th>
                  <th className="px-6 py-3 text-left">Método</th>
                  <th className="px-6 py-3 text-left">Valor</th>
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingPayments.map((p: any) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">{p.user_name || 'Desconhecido'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                        {p.payment_method || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-[#FFB800]">{formatKz(p.amount)}</td>
                    <td className="px-6 py-4 text-text-tertiary text-xs">
                      {new Date(p.created_at).toLocaleDateString('pt-AO')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={approvingId === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 size={12} /> Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={approvingId === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          <XCircle size={12} /> Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Chart + Package Performance */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#FFB800]" /> Evolução da Receita (6 meses)
          </h3>
          {data?.monthlyRevenue?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthlyRevenue} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#666', fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,184,0,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px' }}
                  formatter={(v: any) => [formatKz(v), 'Receita']}
                />
                <Bar dataKey="revenue" radius={[12, 12, 0, 0]}>
                  {data.monthlyRevenue.map((_: any, i: number) => (
                    <Cell key={i} fill={i === data.monthlyRevenue.length - 1 ? '#FFB800' : '#FFB800' + '50'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-text-tertiary text-sm italic">
              Sem dados históricos disponíveis
            </div>
          )}
        </div>

        {/* Device Stats */}
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-8 flex items-center gap-2">
            <Activity size={16} className="text-purple-400" /> Dispositivos
          </h3>
          <div className="space-y-5">
            {data?.deviceStats?.length > 0 ? data.deviceStats.map((d: any, i: number) => {
              const total = data.deviceStats.reduce((a: number, b: any) => a + Number(b.count), 0);
              const pct = Math.round((d.count / total) * 100);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black uppercase tracking-widest text-text-secondary">{d.device || 'Desconhecido'}</span>
                    <span className="font-bold text-text-primary">{pct}% <span className="text-text-tertiary font-normal">({d.count})</span></span>
                  </div>
                  <div className="h-2 bg-bg-base rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-center py-10 text-text-tertiary italic text-sm">Aguardando dados de dispositivos...</p>
              </div>
            )}
          </div>

          {/* Conversion Summary */}
          <div className="mt-8 pt-6 border-t border-border-subtle space-y-3">
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Funil de Conversão</p>
            {[
              { label: 'Cadastros', value: data?.totalUsers || 0, color: '#3B82F6' },
              { label: 'Compraram', value: data?.totalTransactions || 0, color: '#FFB800' },
              { label: 'Ativos (7d)', value: data?.activeUsers || 0, color: '#10B981' },
            ].map((item, i) => {
              const pct = i === 0 ? 100 : Math.round((item.value / (data?.totalUsers || 1)) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary w-24 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-xs font-black text-text-primary w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Consumers + Model Stats */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#FFB800]" /> Power Users (Top Consumidores)
          </h3>
          <div className="space-y-3">
            {data?.topConsumers?.map((u: any, i: number) => {
              const max = data.topConsumers[0]?.total_spent || 1;
              const pct = Math.round((u.total_spent / max) * 100);
              return (
                <div key={i} className="flex items-center gap-4 p-4 bg-bg-base/30 border border-border-subtle rounded-2xl group hover:border-[#FFB800]/30 transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${i === 0 ? 'bg-[#FFB800] text-black' : i === 1 ? 'bg-white/10 text-white' : 'bg-bg-base text-text-tertiary border border-border-subtle'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-text-primary group-hover:text-[#FFB800] transition-colors truncate">{u.name}</p>
                    <div className="mt-1 h-1 bg-bg-base rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFB800] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#FFB800]">{Number(u.total_spent || 0).toLocaleString()} CR</p>
                    <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">{u.generations} gerações</p>
                  </div>
                </div>
              );
            })}
            {!data?.topConsumers?.length && (
              <p className="text-center py-10 text-text-tertiary italic text-sm">Nenhum dado de consumo disponível.</p>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" /> Motores IA mais usados (30d)
          </h3>
          <div className="space-y-4">
            {data?.modelStats?.slice(0, 7).map((m: any, i: number) => {
              const max = data.modelStats[0]?.count || 1;
              const pct = Math.round((m.count / max) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-text-primary truncate max-w-[160px]">{m.model || 'Desconhecido'}</span>
                      {m.type && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-text-tertiary">{m.type}</span>}
                    </div>
                    <span className="text-text-tertiary shrink-0 ml-2">{Number(m.count).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-bg-base rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {!data?.modelStats?.length && (
              <p className="text-center py-10 text-text-tertiary italic text-sm">Sem dados de modelos ainda.</p>
            )}
          </div>
        </div>
      </div>

      {/* Package Performance + Generations by Type */}
      <div className="grid lg:grid-cols-2 gap-8">

        {/* Package Sales */}
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
            <Package size={16} className="text-orange-400" /> Desempenho de Pacotes
          </h3>
          <div className="space-y-3">
            {data?.packageStats?.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-bg-base/30 border border-border-subtle rounded-2xl">
                <div>
                  <p className="text-sm font-black text-text-primary">{p.name || p.package_id || 'N/A'}</p>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">{p.sales} vendas</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#FFB800]">{formatKz(Number(p.revenue))}</p>
                  <p className="text-[9px] text-text-tertiary uppercase tracking-widest font-bold">Receita</p>
                </div>
              </div>
            ))}
            {!data?.packageStats?.length && (
              <p className="text-center py-10 text-text-tertiary italic text-sm">Nenhum pacote vendido ainda.</p>
            )}
          </div>
        </div>

        {/* Generations by Type */}
        <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap size={16} className="text-[#FFB800]" /> Gerações por Tipo (Total)
          </h3>
          <div className="space-y-3">
            {data?.genByType?.length > 0 ? data.genByType.map((g: any, i: number) => {
              const pct = totalGenCount > 0 ? Math.round((Number(g.count) / totalGenCount) * 100) : 0;
              return (
                <div key={i} className="bg-bg-base/50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: COLORS[i % COLORS.length] + '20', border: `1px solid ${COLORS[i % COLORS.length]}30` }}>
                      {typeIconMap[g.type] || <Zap size={16} style={{ color: COLORS[i % COLORS.length] }} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-primary capitalize">{g.type}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-1 w-16 bg-bg-base rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                        <span className="text-[10px] text-text-tertiary font-bold">{pct}%</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl font-black" style={{ color: COLORS[i % COLORS.length] }}>
                    {Number(g.count).toLocaleString()}
                  </span>
                </div>
              );
            }) : (
              <div className="text-center text-text-tertiary text-sm py-8 italic">Nenhuma geração registada.</div>
            )}
            {totalGenCount > 0 && (
              <div className="pt-3 border-t border-border-subtle flex justify-between items-center">
                <span className="text-xs text-text-tertiary uppercase font-black tracking-widest">Total Gerações</span>
                <span className="text-xl font-black text-[#FFB800]">{totalGenCount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Approved Transactions */}
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
            <ReceiptText size={16} className="text-emerald-400" /> Últimas Transações Aprovadas
          </h3>
          <span className="text-xs text-text-tertiary font-bold">Últimas 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase font-black tracking-widest text-text-tertiary border-b border-border-subtle">
                <th className="px-8 py-4 text-left">Utilizador</th>
                <th className="px-8 py-4 text-left">Método</th>
                <th className="px-8 py-4 text-left">Valor</th>
                <th className="px-8 py-4 text-left">Data</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentTransactions?.map((tx: any, i: number) => (
                <tr key={i} className="border-b border-border-subtle/50 hover:bg-bg-base/50 transition-colors">
                  <td className="px-8 py-4 font-bold text-text-primary">{tx.user_name || 'Desconhecido'}</td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                      {tx.payment_method || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-4 font-black text-[#FFB800]">{formatKz(tx.amount)}</td>
                  <td className="px-8 py-4 text-text-tertiary text-xs">
                    {new Date(tx.created_at).toLocaleDateString('pt-AO')}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
                      Aprovada
                    </span>
                  </td>
                </tr>
              ))}
              {!data?.recentTransactions?.length && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-text-tertiary text-sm italic">
                    Nenhuma transação aprovada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
