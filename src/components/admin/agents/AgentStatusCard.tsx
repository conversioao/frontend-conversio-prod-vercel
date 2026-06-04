import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Pause, AlertCircle, Clock, Zap, Square } from 'lucide-react';

interface AgentStatusCardProps {
    agent: any;
    onToggle: (name: string, currentStatus: string) => void;
    onRun: (name: string) => void;
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ agent, onToggle, onRun }) => {
    const isPaused = agent.status === 'paused';
    const hasError = agent.last_error_at && (new Date().getTime() - new Date(agent.last_error_at).getTime() < 86400000);

    const statusColors: any = {
        active: 'bg-emerald-500',
        paused: 'bg-gray-500',
        alert: 'bg-amber-500',
        error: 'bg-red-500'
    };

    const currentStatus = hasError ? 'error' : agent.status;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/50 backdrop-blur-xl border border-border-subtle p-6 rounded-[2rem] relative overflow-hidden group shadow-sm hover:shadow-xl hover:border-[#FFB800]/30 transition-all"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFB800]/5 rounded-bl-[4rem] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl bg-bg-base border border-border-subtle text-text-primary group-hover:scale-110 transition-transform`}>
                    <Bot size={24} className={isPaused ? 'text-text-tertiary' : 'text-[#FFB800]'} />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusColors[currentStatus] || 'bg-gray-500'} animate-pulse`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{currentStatus}</span>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-black text-text-primary tracking-tight">{agent.name}</h3>
                <p className="text-xs font-medium text-text-tertiary mt-0.5 line-clamp-1">{agent.mission || 'Operação Autónoma'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-base/50 p-2.5 rounded-xl border border-border-subtle">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase mb-1">
                        <Clock size={10} /> Última
                    </div>
                    <div className="text-xs font-black text-text-secondary">
                        {agent.last_run ? `há ${Math.round((new Date().getTime() - new Date(agent.last_run).getTime()) / 60000)}m` : '---'}
                    </div>
                </div>
                <div className="bg-bg-base/50 p-2.5 rounded-xl border border-border-subtle">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary uppercase mb-1">
                        <Zap size={10} /> Tarefas
                    </div>
                    <div className="text-xs font-black text-text-secondary">{agent.pending_tasks || 0} na fila</div>
                </div>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => onToggle(agent.name, agent.status)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isPaused 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                >
                    {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                    {isPaused ? 'Retomar' : 'Pausar'}
                </button>
                <button 
                    onClick={() => onRun(agent.name)}
                    disabled={isPaused}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFB800] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FFB800]/20 disabled:opacity-50 disabled:scale-100"
                >
                    <Zap size={12} fill="currentColor" />
                </button>
            </div>
        </motion.div>
    );
};
