import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Activity, ShieldAlert, Clipboard, 
  Megaphone, Settings, BarChart3, RefreshCw,
  TrendingUp, Users, DollarSign, Zap
} from 'lucide-react';

// Hooks
import { useAgentsDashboard } from '../../hooks/useAgentsDashboard';

// Components
import { AgentStatusCard } from './agents/AgentStatusCard';
import { MetricWidget } from './agents/MetricWidget';
import { AlertCenter } from './agents/AlertCenter';
import { LiveLogTable } from './agents/LiveLogTable';
import { CampaignManager } from './agents/CampaignManager';
import { AgentConfigEditor } from './agents/AgentConfigEditor';
import { ReportSection } from './agents/ReportSection';
import { api } from '../../lib/api';

export default function AdminAgentTeam() {
    const { 
        agents, metrics, alerts, logs, campaigns, configs, reports,
        loading, error, refresh, toggleAgent, runAgentNow, resolveAlert, saveConfig 
    } = useAgentsDashboard();

    const [activeTab, setActiveTab] = useState('overview');

    if (loading && agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin"></div>
                <p className="text-text-tertiary animate-pulse font-bold tracking-widest uppercase text-[10px]">Sincronizando Ecossistema Autónomo...</p>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Monitorização', icon: <Activity size={18} /> },
        { id: 'campaigns', label: 'Campanhas', icon: <Megaphone size={18} /> },
        { id: 'reporting', label: 'Relatórios & BI', icon: <BarChart3 size={18} /> },
        { id: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Extremo */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#FFB800] text-black rounded-lg">
                            <Bot size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">Equipa de Agentes Autónomos</h1>
                    </div>
                    <p className="text-text-secondary font-medium">Controlo total sobre a inteligência de conversão da Conversio AI.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-surface/50 backdrop-blur-md border border-border-subtle p-1.5 rounded-2xl flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' 
                                    : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
                                }`}
                            >
                                {tab.icon}
                                <span className="hidden lg:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={refresh}
                        className="p-3 bg-surface/50 border border-border-subtle rounded-2xl text-text-tertiary hover:text-[#FFB800] hover:border-[#FFB800] transition-all active:rotate-180 duration-500"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </header>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 text-red-500 text-sm font-bold"
                >
                    <ShieldAlert size={20} />
                    {error}
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-10"
                    >
                        {/* Section 0: Team Alpha Hub Metrics */}
                        <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Zap size={200} /></div>
                           <div className="flex flex-col gap-2">
                              <h3 className="text-sm font-black text-[#FFB800] uppercase tracking-[0.3em]">Performance da Célula Neural</h3>
                              <p className="text-2xl font-black text-text-primary italic">Status: <span className="text-emerald-500">OPTIMIZADO</span></p>
                           </div>
                           
                           <div className="flex flex-1 justify-around w-full md:w-auto items-center gap-12">
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Taxa Sucesso</p>
                                 <p className="text-4xl font-black text-emerald-500">98.2%</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Latência</p>
                                 <p className="text-4xl font-black text-blue-500">124ms</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Tarefas/m</p>
                                 <p className="text-4xl font-black text-purple-500">42</p>
                              </div>
                           </div>
                           
                           <button className="px-10 py-5 bg-[#FFB800] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Sincronização Total</button>
                        </div>

                        {/* Section 1: Agent Neural Nexus (Visual Communication) */}
                        <div className="bg-surface/30 backdrop-blur-3xl border border-border-subtle rounded-[3rem] p-10 relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 via-transparent to-purple-500/5 pointer-events-none" />
                             
                             <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                                  {/* Central Hub: Agente Alex */}
                                  <div className="lg:w-1/3 flex flex-col items-center text-center gap-6">
                                       <div className="relative">
                                            <div className="w-32 h-32 rounded-[2.5rem] bg-[#FFB800] flex items-center justify-center text-black shadow-[0_0_50px_rgba(255,184,0,0.3)] animate-pulse">
                                                 <Bot size={56} strokeWidth={2.5} />
                                            </div>
                                            <div className="absolute -inset-4 border-2 border-dashed border-[#FFB800]/30 rounded-[3rem] animate-[spin_20s_linear_infinite]" />
                                       </div>
                                       <div>
                                            <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">Agente Alex</h3>
                                            <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.3em] mt-1">Orquestrador Neural Central</p>
                                       </div>
                                  </div>

                                  {/* Connection Lines (Visual/CSS) */}
                                  <div className="hidden lg:flex flex-1 justify-center relative h-1">
                                       <div className="absolute w-full h-[2px] bg-gradient-to-r from-[#FFB800] via-text-tertiary to-[#FFB800] opacity-20" />
                                       <div className="absolute h-4 w-4 bg-[#FFB800] rounded-full blur-sm animate-[ping-pong_4s_easeInOut_infinite]" />
                                  </div>

                                  {/* Specialized Agents Grid */}
                                  <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                                       {[
                                            { name: 'Monitor', icon: <ShieldAlert size={18} />, color: 'red', task: 'Saúde dos Sistemas' },
                                            { name: 'Funnel', icon: <Zap size={18} />, color: 'emerald', task: 'Qualificação Pipeline' },
                                            { name: 'Recovery', icon: <RefreshCw size={18} />, color: 'blue', task: 'Engajamento Churn' },
                                            { name: 'Campaign', icon: <Megaphone size={18} />, color: 'purple', task: 'Escala de Audiência' }
                                       ].map(agent => (
                                            <div key={agent.name} className="p-5 bg-bg-base/40 border border-border-subtle rounded-2.5xl flex items-center gap-4 hover:border-[#FFB800]/50 transition-all group">
                                                 <div className={`p-3 rounded-xl bg-${agent.color}-500/10 text-${agent.color}-500 group-hover:scale-110 transition-transform shadow-lg`}>
                                                      {agent.icon}
                                                 </div>
                                                 <div>
                                                      <p className="text-[10px] font-black text-text-primary uppercase tracking-wider">{agent.name}</p>
                                                      <p className="text-[9px] font-medium text-text-tertiary">{agent.task}</p>
                                                 </div>
                                            </div>
                                       ))}
                                  </div>
                             </div>
                        </div>

                        {/* Section 2: Agent Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            {agents.map((agent) => (
                                <AgentStatusCard 
                                    key={agent.id} 
                                    agent={agent} 
                                    onToggle={toggleAgent}
                                    onRun={runAgentNow}
                                />
                            ))}
                        </div>

                        {/* Section 2: Métricas Rápidas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricWidget 
                                title="Lead Score Médio"
                                value="78.5"
                                trend="+12.4%"
                                isPositive={true}
                                icon={<Zap size={20} />}
                                data={[{value: 20}, {value: 45}, {value: 38}, {value: 65}, {value: 48}, {value: 78}]}
                                color="#FFB800"
                            />
                            <MetricWidget 
                                title="Recuperação Churn"
                                value="142"
                                trend="+8.2%"
                                isPositive={true}
                                icon={<RefreshCw size={20} />}
                                data={[{value: 10}, {value: 20}, {value: 15}, {value: 30}, {value: 25}, {value: 40}]}
                                color="#10B981"
                            />
                            <MetricWidget 
                                title="Conversão Campanha"
                                value="12.4%"
                                trend="+2.1%"
                                isPositive={true}
                                icon={<TrendingUp size={20} />}
                                data={[{value: 5}, {value: 8}, {value: 7}, {value: 12}, {value: 10}, {value: 13}]}
                                color="#3B82F6"
                            />
                            <MetricWidget 
                                title="Erros Técnicos (24h)"
                                value="04"
                                trend="-45%"
                                isPositive={true}
                                icon={<ShieldAlert size={20} />}
                                data={[{value: 20}, {value: 15}, {value: 10}, {value: 8}, {value: 5}, {value: 4}]}
                                color="#EF4444"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Section 3: Centro de Alertas */}
                            <div className="lg:col-span-1">
                                <AlertCenter alerts={alerts} onResolve={resolveAlert} />
                            </div>
                            
                            {/* Section 4: Live Logs */}
                            <div className="lg:col-span-2">
                                <LiveLogTable logs={logs} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'campaigns' && (
                    <motion.div 
                        key="campaigns"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <CampaignManager campaigns={campaigns} />
                    </motion.div>
                )}

                {activeTab === 'reporting' && (
                    <motion.div 
                        key="reporting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <ReportSection reports={reports} onGenerate={(type) => api.post('/admin/reports/generate', { type }).then(() => refresh())} />
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div 
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <AgentConfigEditor configs={configs} onSave={saveConfig} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
