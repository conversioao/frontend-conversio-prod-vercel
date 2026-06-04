import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Clock, ArrowUpRight, ArrowDownRight, UserCheck, CircuitBoard, DollarSign, CheckCircle2, XCircle, Activity, Cpu, BarChart2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, Cell, PieChart, Pie, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';

const COLORS = ['#FFB800', '#A855F7', '#10B981', '#3B82F6', '#EF4444', '#F97316'];

const StatCard = ({ icon: Icon, label, value, sub, color = '#FFB800', delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-surface border border-border-subtle p-6 rounded-[2rem] relative overflow-hidden group hover:border-white/20 transition-all"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
      <Icon size={72} style={{ color }} />
    </div>
    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-3">{label}</p>
    <h3 className="text-4xl font-black text-text-primary tracking-tighter mb-1">{value}</h3>
    {sub && <p className="text-xs font-bold flex items-center gap-1 mt-1" style={{ color }}>{sub}</p>}
  </motion.div>
);

const SectionTitle = ({ icon: Icon, title, sub, color = '#FFB800' }: any) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}20` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">{title}</h4>
      {sub && <p className="text-[10px] text-text-tertiary font-medium">{sub}</p>}
    </div>
  </div>
);

export function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBehaviorStats = async () => {
    try {
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/behavior-stats?adminId=${adminId}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehaviorStats();
    const interval = setInterval(fetchBehaviorStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
      <div className="w-16 h-16 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin" />
      <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] animate-pulse">
        Analisando o ecossistema...
      </p>
    </div>
  );

  const ps = data?.platformStats || {};
  const sr = data?.successRate || {};
  const successPct = sr.total > 0 ? Math.round((sr.completed / sr.total) * 100) : 0;

  return (
    <div className="space-y-10 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase flex items-center gap-3">
            <Activity className="text-[#FFB800]" size={28} />
            Analytics & Sistema
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">
            Dashboard em tempo real — atualiza a cada 30 segundos.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-black uppercase tracking-widest">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          LIVE
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Utilizadores" value={Number(ps.total_users || 0).toLocaleString()} sub={<><ArrowUpRight size={12}/> +{ps.new_users_7d || 0} esta semana</>} delay={0} />
        <StatCard icon={Zap} label="Gerações Totais" value={Number(ps.total_gens || 0).toLocaleString()} sub={<><ArrowUpRight size={12}/> {ps.gens_24h || 0} hoje</>} delay={0.05} />
        <StatCard icon={DollarSign} label="Receita Total" value={`${Number(ps.total_revenue || 0).toLocaleString()} Kz`} color="#10B981" delay={0.1} />
        <StatCard icon={CircuitBoard} label="Créditos Consumidos" value={Number(ps.total_credits_consumed || 0).toLocaleString()} color="#A855F7" delay={0.15} />
        <StatCard icon={CheckCircle2} label="Taxa de Sucesso" value={`${successPct}%`} sub={<><CheckCircle2 size={12}/> Últimos 7 dias</>} color={successPct >= 80 ? '#10B981' : '#EF4444'} delay={0.2} />
        <StatCard icon={Clock} label="Gerações 24h" value={Number(ps.gens_24h || 0).toLocaleString()} sub="Atividade recente" color="#3B82F6" delay={0.25} />
      </div>

      {/* Hourly Activity + Daily Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface border border-border-subtle p-8 rounded-[2.5rem]">
          <SectionTitle icon={TrendingUp} title="Atividade nas Últimas 24h" sub="Gerações distribuídas por hora" />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourlyGens || []}>
                <defs>
                  <linearGradient id="gradGens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB800" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill:'#555',fontSize:10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#555',fontSize:10}} />
                <Tooltip contentStyle={{backgroundColor:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12}} itemStyle={{color:'#FFB800',fontWeight:'bold'}} />
                <Area type="monotone" dataKey="count" stroke="#FFB800" strokeWidth={2.5} fillOpacity={1} fill="url(#gradGens)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem]">
          <SectionTitle icon={Users} title="Novos Utilizadores" sub="Últimos 30 dias" color="#A855F7" />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyUsers || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#555',fontSize:10}} />
                <Tooltip contentStyle={{backgroundColor:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12}} />
                <Bar dataKey="count" fill="#A855F7" radius={[4,4,0,0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue + Type Breakdown + Success Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Revenue */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle p-8 rounded-[2.5rem]">
          <SectionTitle icon={DollarSign} title="Receita Semanal (8 Semanas)" sub="Transações aprovadas por semana" color="#10B981" />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.weeklyRevenue || []}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill:'#555',fontSize:9}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#555',fontSize:10}} />
                <Tooltip contentStyle={{backgroundColor:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12}} formatter={(v: any) => [`${Number(v).toLocaleString()} Kz`, 'Receita']} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generation Types */}
        <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem]">
          <SectionTitle icon={BarChart2} title="Tipos de Geração" sub="Distribuição últimos 30 dias" color="#3B82F6" />
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.genTypes || []} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                  {(data?.genTypes || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {(data?.genTypes || []).map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-text-secondary font-bold uppercase tracking-wider">{g.type}</span>
                </div>
                <span className="font-black text-text-primary">{Number(g.count).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Models + Success Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Models */}
        <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem]">
          <SectionTitle icon={Cpu} title="Modelos Mais Usados" sub="Últimos 30 dias" color="#F97316" />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topModels || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill:'#555',fontSize:10}} />
                <YAxis type="category" dataKey="model" axisLine={false} tickLine={false} tick={{fill:'#888',fontSize:9}} width={120} />
                <Tooltip contentStyle={{backgroundColor:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12}} />
                <Bar dataKey="count" radius={[0,4,4,0]} barSize={14}>
                  {(data?.topModels || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success vs Fail */}
        <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem]">
          <SectionTitle icon={CheckCircle2} title="Taxa de Sucesso vs Falha" sub="Últimos 7 dias" color="#10B981" />
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="14"
                  strokeDasharray={`${successPct * 2.513} 251.3`} strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="14"
                  strokeDasharray={`${(100 - successPct) * 2.513} 251.3`} 
                  strokeDashoffset={`-${successPct * 2.513}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <span className="text-4xl font-black text-text-primary">{successPct}%</span>
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Sucesso</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
              <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-emerald-500">{Number(sr.completed || 0).toLocaleString()}</p>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Completas</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
              <XCircle size={20} className="text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-red-500">{Number(sr.failed || 0).toLocaleString()}</p>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Falhas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Active Users */}
      <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-border-subtle">
          <SectionTitle icon={UserCheck} title="Top 10 Power Users" sub="Utilizadores mais produtivos nos últimos 30 dias" color="#FFB800" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black tracking-widest text-text-tertiary border-b border-border-subtle">
                <th className="px-8 py-4">#</th>
                <th className="px-8 py-4">Utilizador</th>
                <th className="px-8 py-4">Email</th>
                <th className="px-8 py-4">Gerações</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.activeUsers || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-text-tertiary text-sm italic">
                    Sem dados suficientes.
                  </td>
                </tr>
              ) : (data?.activeUsers || []).map((user: any, index: number) => (
                <tr key={index} className="border-b border-border-subtle/50 hover:bg-bg-base/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${index === 0 ? 'bg-[#FFB800] text-black border-[#FFB800]' : index === 1 ? 'bg-white/10 text-white border-white/10' : 'bg-bg-base text-text-tertiary border-border-subtle'}`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-8 py-4 font-bold text-text-primary group-hover:text-[#FFB800] transition-colors text-sm">{user.name}</td>
                  <td className="px-8 py-4 text-text-tertiary text-xs">{user.email}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-[#FFB800]">{user.gen_count}</span>
                      <div className="flex-1 max-w-[120px] h-1.5 bg-bg-base rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FFB800] to-yellow-500 rounded-full"
                          style={{ width: `${data?.activeUsers?.[0] ? Math.min(100, (user.gen_count / data.activeUsers[0].gen_count) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${index < 3 ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {index < 3 ? 'Power' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
