import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Database, Server, Cpu, Activity, AlignLeft, Eye, Zap, AlertCircle } from 'lucide-react';
import { useAgentsDashboard } from '../../hooks/useAgentsDashboard';

export default function AdminEngineMonitor({ onClose }: { onClose: () => void }) {
    const { logs, refresh } = useAgentsDashboard();
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const [liveTerminalOutput, setLiveTerminalOutput] = useState<any[]>([]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [liveTerminalOutput]);

    // Speed up polling for "live" feel in terminal
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
        }, 5000); // 5 seconds polling for fast real-time monitoring
        return () => clearInterval(interval);
    }, [refresh]);

    // Feed terminal progressively so it looks "live"
    useEffect(() => {
        if (logs.length > 0) {
            // Filter strictly for Generation Engine logs
            const engineLogs = logs.filter((log: any) => {
                const name = log.agent_name?.toLowerCase() || '';
                
                // Exclude the CRM/WhatsApp orchestrator agents
                if (name.includes('agente monitor') || name.includes('agente funil') || name.includes('agente envios') || name.includes('atendimento')) {
                    return false;
                }

                // Explicitly allow Generation Engine modules
                return name.includes('pipeline') || 
                       name.includes('promptagent') ||
                       name.includes('fashionagent') ||
                       name.includes('musicagent') ||
                       name.includes('kieainode') ||
                       name.includes('coreconfig') ||
                       name.includes('engine');
            });
            setLiveTerminalOutput(engineLogs.slice(0, 100).reverse());
        }
    }, [logs]);

    const activeNodes = [
        { id: 'video_ugc', name: 'VideoPipeline / UGC', icon: <Zap size={24} />, desc: 'Gerador Veo 3 / Sora - Renderiza vídeos curtos e scripts.' },
        { id: 'image_ugc', name: 'ImagePipeline / Flux', icon: <Eye size={24} />, desc: 'Gerador Nano Banana / Flux - Processa a Fotografia AI Premium.' },
        { id: 'analysis', name: 'VisionAI Analyst', icon: <Activity size={24} />, desc: 'Examina a imagem do produto enviado pelo utilizador para compor as prompts.' },
    ];

    // Helper to beautifully stringify nested JSON
    const formatPayload = (payload: any) => {
        if (!payload) return null;
        try {
            // Attempt to parse if it's a string that looks like JSON
            if (typeof payload === 'string' && payload.startsWith('{')) {
                payload = JSON.parse(payload);
            }
            return JSON.stringify(payload, null, 2);
        } catch (e) {
            return String(payload);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#050706] text-white flex flex-col md:flex-row font-mono overflow-hidden"
        >
            {/* Header / Botão de fechar */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-full animate-pulse backdrop-blur-md">
                        <Server className="text-[#FFB800]" size={16} />
                        <span className="text-[#FFB800] text-xs font-black tracking-widest">GENERATION ENGINE - AO VIVO</span>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full transition-all pointer-events-auto backdrop-blur-md border border-red-500/30"
                >
                    &times;
                </button>
            </div>

            {/* Lado Esquerdo: HUD Interativo */}
            <div className="w-full md:w-1/3 h-full border-r border-[#FFB800]/20 bg-gradient-to-br from-black via-[#0a0a09] to-[#120f00] p-10 flex flex-col pt-24 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,184,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,184,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-screen" />
                
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 relative z-10 flex items-center gap-3">
                    <Cpu size={32} className="text-[#FFB800]" /> Motor de Escrita
                </h1>
                <p className="text-zinc-500 text-sm mb-12 relative z-10">
                    Monitorize a injeção em tempo real de schemas JSON no cluster OpenAI e Veo3.
                </p>

                <div className="flex-1 relative z-10 flex flex-col gap-6">
                    <h2 className="text-[#FFB800] font-black uppercase text-xs tracking-widest border-b border-white/5 pb-2 mb-2">Nós Ativos (Workers)</h2>
                    
                    {activeNodes.map(node => (
                        <div key={node.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex gap-4 hover:border-[#FFB800]/50 transition-all">
                            <div className="p-3 bg-black/50 rounded-xl text-[#FFB800] shrink-0 h-min shadow-inner">
                                {node.icon}
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm uppercase tracking-wider">{node.name}</h3>
                                <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{node.desc}</p>
                            </div>
                        </div>
                    ))}
                    
                    <div className="mt-auto p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <span className="text-red-500 font-bold block text-xs uppercase tracking-widest mb-1">Avisos do Cluster</span>
                            <span className="text-zinc-400 text-xs text-balance">
                                Se notar atrasos prolongados nos logs ou payloads JSON incompletos, 
                                verifique as rotas de conexão à base de dados.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lado Direito: Terminal Streaming com Expansão de JSON */}
            <div className="w-full md:w-2/3 h-full bg-[#050505] flex flex-col pt-24 p-8 outline outline-1 outline-white/5 shadow-2xl relative font-mono text-[11px] md:text-xs">
                <div className="flex justify-between items-end mb-4 border-b border-zinc-800 pb-3 shrink-0">
                    <div>
                        <h2 className="text-[#00FF41] text-lg font-bold flex items-center gap-3 uppercase tracking-widest">
                            <Terminal size={20} /> Kernel Log Stream
                        </h2>
                        <p className="text-zinc-600 text-xs uppercase mt-1">Observatório de Payloads e Execução de Agentes</p>
                    </div>
                    <Database size={20} className="text-zinc-700 animate-pulse" />
                </div>

                <div className="flex-1 overflow-y-auto bg-black border border-white/10 rounded-xl p-6 shadow-inner relative custom-scrollbar flex flex-col">
                    {liveTerminalOutput.length === 0 ? (
                        <div className="text-zinc-600 flex items-center gap-2 m-auto">
                            <span className="w-2 h-2 bg-zinc-600 animate-pulse rounded-full" /> Aguardando tráfego do motor...
                        </div>
                    ) : (
                        <div className="space-y-4 pb-20">
                            {liveTerminalOutput.map((log: any, index: number) => {
                                const payloadStr = formatPayload(log.metadata);
                                const isEngineLog = log.agent_name?.toLowerCase().includes('agent') || log.agent_name?.toLowerCase().includes('pipeline');
                                
                                return (
                                    <div key={log.id || index} className="text-sm">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-zinc-500">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                            <span className={isEngineLog ? 'text-[#FFB800] font-bold' : 'text-cyan-500'}>
                                                [{log.agent_name || 'Sistema'}]
                                            </span>
                                            {log.result === 'error' ? (
                                                <span className="text-red-500">❌ ACHTUNG: {log.action}</span>
                                            ) : (
                                                <span className="text-[#00FF41]">✓ {log.action}</span>
                                            )}
                                        </div>

                                        {/* Auto-expanded Payload Block for easy tracking of UGC/Veo3 Prompts */}
                                        {payloadStr && payloadStr !== '{}' && payloadStr !== 'null' && (
                                            <div className="mt-2 ml-4 md:ml-10">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase font-bold mb-1">
                                                    <AlignLeft size={12} /> Payload Detectado (Auto-expandido)
                                                </div>
                                                <pre className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-lg text-emerald-400 overflow-x-auto custom-scrollbar font-mono text-[10px]">
                                                    {payloadStr}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={terminalEndRef} className="h-4" />
                            <div className="text-[#00FF41] animate-pulse">_</div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Custom Styles for Scrollbar in this component only */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
            `}} />
        </motion.div>
    );    
}
