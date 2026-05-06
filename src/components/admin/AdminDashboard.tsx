import React, { useEffect, useState } from 'react';
import { Users, Activity, CreditCard, Layers, Zap, Clock, TrendingUp, Sparkles, BarChart3, Bot, PieChart as PieChartIcon } from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    usersWithBalance: 0,
    totalGenerations: 0,
    totalRevenue: 0,
    consumedCredits: 0,
    activeProcessing: 0,
    bonusUsersCount: 0,
    bonusCreditsUsed: 0,
    paidCreditsUsed: 0,
    revenueByMonth: [],
    generationsByDay: [],
    modelsUsage: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Simulate real-time by polling every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');
      const res = await apiFetch(`/admin/stats?adminId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#FFB800', '#FF8A00', '#FFD600', '#FFA800', '#FFC700'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin"></div>
      <p className="text-text-tertiary animate-pulse font-medium">Carregando métricas do ecossistema...</p>
    </div>
  );

  const kpis = [
    { title: 'Usuários Totais', value: stats.totalUsers, icon: <Users size={20} />, trend: '+12%', color: '#3B82F6' },
    { title: 'Usuários c/ Saldo', value: stats.usersWithBalance, icon: <Activity size={20} />, trend: '+5%', color: '#10B981' },
    { title: 'Faturamento Total', value: `${Number(stats.totalRevenue).toLocaleString()} Kz`, icon: <CreditCard size={20} />, trend: '+18%', color: '#FFB800' },
    { title: 'Gerações Realizadas', value: stats.totalGenerations, icon: <Layers size={20} />, trend: '+24%', color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Dashboard Executivo</h1>
          <p className="text-text-secondary mt-1">Monitoramento em tempo real da plataforma Conversio.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface/50 backdrop-blur-md border border-border-subtle p-2 rounded-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider">{stats.activeProcessing + 3} Usuários Live</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FFB800]/10 text-[#FFB800] rounded-xl border border-[#FFB800]/20">
             <Zap size={14} fill="currentColor" />
             <span className="text-xs font-bold uppercase tracking-wider">{stats.activeProcessing} Processando Agora</span>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-monitor-dashboard'))}
            className="flex items-center gap-2 px-4 py-2 bg-black text-accent rounded-xl border border-accent/30 hover:bg-accent/10 transition-colors shadow-[0_0_20px_rgba(255,184,0,0.1)] group"
          >
             <Bot size={14} className="group-hover:rotate-12 transition-transform" />
             <span className="text-xs font-black uppercase tracking-wider">Neural Terminal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-surface border border-border-subtle p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-[#FFB800]/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[4rem]"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 rounded-2xl bg-bg-base border border-border-subtle text-text-primary group-hover:scale-110 transition-transform">
                {kpi.icon}
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {kpi.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">{kpi.title}</p>
            <h3 className="text-2xl font-black text-text-primary tracking-tight">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart - Revenue */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Evolução Financeira</h3>
            </div>
            <select className="bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-xs font-bold text-text-secondary outline-none focus:border-[#FFB800]">
              <option value="6m">Últimos 6 Meses</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByMonth}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#888', fontSize: 10}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#888', fontSize: 10}} 
                  tickFormatter={(val) => `${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '16px', fontSize: '12px' }}
                  itemStyle={{ color: '#FFB800' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FFB800" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Usage Pie Chart */}
        <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Distribuição de Modelos</h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.modelsUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.modelsUsage.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '16px' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: '20px', fontSize: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Generations Bar Chart */}
        <div className="lg:col-span-3 bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Volume de Gerações (Últimos 7 dias)</h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.generationsByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#888', fontSize: 10}} 
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,184,0,0.05)'}}
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '16px' }}
                />
                <Bar dataKey="count" fill="#FFB800" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Segmentation Grid */}
      <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-sm mb-6">
         <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
               <Users size={20} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Segmentação de Utilizadores & Créditos</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl flex flex-col justify-center">
               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Utilizadores de Bónus</p>
               <h4 className="text-2xl font-black text-text-primary">{stats.bonusUsersCount || 0}</h4>
               <p className="text-xs text-text-tertiary mt-1">Nunca compraram créditos</p>
            </div>
            <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl flex flex-col justify-center">
               <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-2">Créditos de Bónus Consumidos</p>
               <h4 className="text-2xl font-black text-text-primary">{Number(stats.bonusCreditsUsed || 0).toLocaleString()}</h4>
               <p className="text-xs text-text-tertiary mt-1">Custo da conta gratuita</p>
            </div>
            <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl flex flex-col justify-center">
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Créditos Pagos Consumidos</p>
               <h4 className="text-2xl font-black text-text-primary">{Number(stats.paidCreditsUsed || 0).toLocaleString()}</h4>
               <p className="text-xs text-text-tertiary mt-1">Gerações de pacotes pagos</p>
            </div>
         </div>
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/5 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">
               <Sparkles size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Créditos IA Consumidos</p>
               <h4 className="text-xl font-black text-text-primary">{stats.consumedCredits.toLocaleString()}</h4>
            </div>
         </div>
         <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
               <Zap size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Gerações por Segundo (Média)</p>
               <h4 className="text-xl font-black text-text-primary">0.42 <span className="text-xs font-medium text-text-tertiary">gen/s</span></h4>
            </div>
         </div>
         <div className="bg-bg-base border border-border-subtle p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-500">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Tempo Médio de Resposta</p>
               <h4 className="text-xl font-black text-text-primary">8.5 <span className="text-xs font-medium text-text-tertiary">segundos</span></h4>
            </div>
         </div>
      </div>
    </div>
  );
}
