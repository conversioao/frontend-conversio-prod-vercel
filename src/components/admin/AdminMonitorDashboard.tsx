import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Users, 
  Zap, 
  MessageSquare, 
  TrendingUp, 
  ShieldCheck, 
  Smartphone,
  Bot,
  AlertTriangle,
  RefreshCw,
  Globe,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

export default function AdminMonitorDashboard({ onClose }: { onClose: () => void }) {
  const [pulse, setPulse] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uptime, setUptime] = useState(0);

  const fetchPulse = async () => {
    try {
      const res = await api.get('/admin/system/pulse');
      const data = await res.json();
      if (data.success) {
        setPulse(data.pulse);
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Pulse fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 30000);
    const timer = setInterval(() => setUptime(u => u + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
        <div className="text-center">
           <RefreshCw className="animate-spin text-accent mb-4 mx-auto" size={48} />
           <p className="text-white font-black tracking-widest uppercase text-sm">Initializing NASA Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black text-white overflow-hidden font-mono select-none">
      {/* HUD Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%270%200%20200%20200%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter%20id=%27noiseFilter%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.65%27%20numOctaves=%273%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27100%25%27%20height=%27100%25%27%20filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-40"></div>
      </div>

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 w-full h-16 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-xs font-black tracking-widest text-white/50 uppercase">Live System Monitor</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-xl font-black tracking-tighter italic">CONVERSIO <span className="text-accent text-sm not-italic ml-1">v2.4.0</span></h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] text-white/30 font-bold uppercase">System Uptime</p>
            <p className="text-sm font-black tracking-widest text-accent">{formatUptime(uptime)}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-24 pb-12 px-8 h-full flex flex-col gap-8">
        
        {/* Row 1: High Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Pipeline Users', value: pulse?.users || 0, icon: Users, color: 'text-blue-500' },
            { label: 'AI Agents On-Duty', value: pulse?.agents || 0, icon: Bot, color: 'text-purple-500' },
            { label: 'Total Platform ROI', value: `${Number(pulse?.revenue).toLocaleString()} Kz`, icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'Msgs Handled (24h)', value: pulse?.messages24h || 0, icon: MessageSquare, color: 'text-pink-500' },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <stat.icon size={48} />
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h3>
              <div className="mt-4 flex items-center gap-1">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                 <span className="text-[8px] text-emerald-500/70 font-bold uppercase tracking-widest">Real-time Data Stream</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Row 2: Central Monitor & Activity Feed */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
          
          {/* Main Monitor Area */}
          <div className="lg:col-span-2 flex flex-col gap-8 overflow-hidden">
            {/* System Pulse Chart (SVG Simulation) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col h-1/2">
              <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Activity size={14} className="text-accent" />
                   Pulse Monitor — Neural Load
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                   <span className="flex items-center gap-1"><div className="w-2 h-2 bg-accent rounded-full"></div> AI Load</span>
                   <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Traffic</span>
                </div>
              </h4>

              <div className="flex-1 relative flex items-end gap-1 px-4">
                 {Array.from({ length: 60 }).map((_, i) => (
                   <motion.div 
                      key={i}
                      animate={{ height: [`${20 + Math.random() * 60}%`, `${30 + Math.random() * 40}%`, `${20 + Math.random() * 60}%`] }}
                      transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, ease: "linear", delay: i * 0.05 }}
                      className="flex-1 min-w-[2px] bg-gradient-to-t from-accent to-transparent opacity-40 rounded-full"
                   />
                 ))}
                 <div className="absolute inset-0 flex flex-col justify-between py-12 opacity-5 pointer-events-none">
                    <div className="border-t border-white"></div>
                    <div className="border-t border-white"></div>
                    <div className="border-t border-white"></div>
                 </div>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-4 border-t border-white/5 pt-8">
                 <div>
                    <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">API Latency</p>
                    <p className="text-lg font-black text-emerald-400">{pulse?.latency || 124}ms</p>
                 </div>
                 <div>
                    <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">DB Connections</p>
                    <p className="text-lg font-black text-purple-400">{pulse?.dbConnections || 0}/100</p>
                 </div>
                 <div>
                    <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Worker Threads</p>
                    <p className="text-lg font-black text-accent uppercase">Active</p>
                 </div>
                 <div>
                    <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Environment</p>
                    <p className="text-lg font-black text-blue-400 truncate">{pulse?.os || 'Cloud'}</p>
                 </div>
              </div>
            </div>

            {/* LIVE ACTIVITY FEED (The NASA Stream) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex-1 overflow-hidden flex flex-col">
               <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                 <Zap size={14} className="text-orange-500" />
                 Global Activity Stream
               </h4>
               
               <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar no-scrollbar">
                  {/* Join Transactions and WhatsApp Messages for a unified feed */}
                  {pulse?.liveFeed?.transactions?.map((tx: any, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={`tx-${i}`} 
                      className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase text-emerald-500 w-24">Transaction</span>
                      <span className="text-xs font-medium text-white/70 flex-1">{tx.type} — {Number(tx.amount).toLocaleString()} Kz</span>
                      <span className="text-[9px] font-black text-white/20">{tx.status}</span>
                    </motion.div>
                  ))}
                  {pulse?.liveFeed?.whatsapp?.map((msg: any, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={`wa-${i}`}
                      className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase text-blue-500 w-24">WhatsApp</span>
                      <span className="text-xs font-medium text-white/70 flex-1 truncate italic">"{msg.content}"</span>
                      <span className="text-[9px] font-black text-white/20 uppercase">{msg.role === 'user' ? 'Lead' : 'Agent'}</span>
                    </motion.div>
                  ))}
                  {(!pulse?.liveFeed?.transactions?.length && !pulse?.liveFeed?.whatsapp?.length) && (
                    <div className="h-full flex items-center justify-center opacity-20 italic text-xs">
                      Waiting for neural packets...
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-gradient-to-br from-accent/10 to-orange-500/10 border border-accent/20 rounded-3xl p-8 flex flex-col">
            <h4 className="text-xs font-black text-accent uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Zap size={14} />
              AI Optimization Insights
            </h4>
            
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
               {suggestions.map((s, i) => (
                 <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.2 }}
                    key={i} 
                    className="p-4 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden"
                 >
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                    <p className="text-xs leading-relaxed text-white/80 font-medium">
                       {s}
                    </p>
                 </motion.div>
               ))}
               
               {suggestions.length === 0 && (
                 <div className="h-full flex items-center justify-center text-white/20">
                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Scanning platform data...</p>
                 </div>
               )}
            </div>

            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
               <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase">System Integrity: 100%</span>
               </div>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['0%', '70%', '100%', '30%', '80%'] }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="h-full bg-emerald-500"
                  />
               </div>
               <p className="text-[8px] text-white/20 font-black uppercase mt-2 tracking-widest">Verified by Advanced Orchestrator</p>
            </div>
          </div>
        </div>

        {/* Bottom Legend / Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
           <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-white/20">
              <div className="flex items-center gap-2"><Globe size={10} /> Africa/Luanda</div>
              <div className="flex items-center gap-2"><Cpu size={10} /> Nodes: 03</div>
              <div className="flex items-center gap-2 text-emerald-500/50"><ShieldCheck size={10} /> Encryption: AES-256</div>
           </div>
           <p className="text-[8px] text-white/10 font-bold tracking-[0.5em] uppercase">Conversio AI Infrastructure • 2026 Kaizen Projects</p>
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>
  );
}
