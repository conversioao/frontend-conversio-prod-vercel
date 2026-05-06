import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Database, Server, Cpu, Activity, AlignLeft, Eye, Zap, AlertCircle, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { BASE_URL } from '../../lib/api';

interface LogEntry {
    agent: string;
    message: string;
    status: 'info' | 'success' | 'warning' | 'error';
    metadata?: any;
    timestamp: string;
}

export default function AdminEngineMonitor({ onClose }: { onClose: () => void }) {
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-scroll
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const connectSSE = useCallback(() => {
        // Close any existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        const token = localStorage.getItem('conversio_token');
        if (!token) return;

        // EventSource doesn't support custom headers, so we pass token as query param
        const sseUrl = `${BASE_URL}/admin/engine/logs/stream?token=${encodeURIComponent(token)}`;
        
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
            setConnected(true);
            setReconnecting(false);
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (!data.agent) return; // skip SSE heartbeats/pings
                setLogs(prev => {
                    const updated = [...prev, data];
                    // Keep only last 300 log entries
                    return updated.slice(-300);
                });
            } catch (_) {}
        };

        es.onerror = () => {
            setConnected(false);
            es.close();
            eventSourceRef.current = null;

            // Reconnect after 3s
            setReconnecting(true);
            reconnectTimerRef.current = setTimeout(() => {
                connectSSE();
            }, 3000);
        };
    }, []);

    useEffect(() => {
        connectSSE();
        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        };
    }, [connectSSE]);

    const activeNodes = [
        { id: 'video_ugc', name: 'VideoPipeline / UGC', icon: <Zap size={24} />, desc: 'Gerador Veo 3 / Sora — Renderiza vídeos curtos e scripts.' },
        { id: 'image_ugc', name: 'ImagePipeline / Flux', icon: <Eye size={24} />, desc: 'Gerador Nano Banana / Flux — Processa Fotografia AI Premium.' },
        { id: 'analysis', name: 'VisionAI Analyst', icon: <Activity size={24} />, desc: 'Examina a imagem do produto enviado para compor os prompts.' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'error': return 'text-red-400';
            case 'warning': return 'text-yellow-400';
            case 'success': return 'text-[#00FF41]';
            default: return 'text-[#00FF41]';
        }
    };

    const getAgentColor = (agent: string) => {
        const lower = agent.toLowerCase();
        if (lower.includes('pipeline') || lower.includes('agent')) return 'text-[#FFB800]';
        if (lower.includes('engine') || lower.includes('kieai')) return 'text-cyan-400';
        if (lower.includes('error') || lower.includes('fail')) return 'text-red-400';
        return 'text-purple-400';
    };

    const formatPayload = (metadata: any) => {
        if (!metadata || Object.keys(metadata).length === 0) return null;
        try {
            return JSON.stringify(metadata, null, 2);
        } catch (_) {
            return String(metadata);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#050706] text-white flex flex-col md:flex-row font-mono overflow-hidden"
        >
            {/* Header */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-full animate-pulse backdrop-blur-md">
                        <Server className="text-[#FFB800]" size={16} />
                        <span className="text-[#FFB800] text-xs font-black tracking-widest">GENERATION ENGINE — AO VIVO</span>
                    </div>
                    {/* Connection status badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border pointer-events-none ${
                        connected
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : reconnecting
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                        {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {connected ? 'SSE Conectado' : reconnecting ? 'Reconectando...' : 'Desconectado'}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full transition-all pointer-events-auto backdrop-blur-md border border-red-500/30"
                >
                    &times;
                </button>
            </div>

            {/* Left HUD */}
            <div className="w-full md:w-1/3 h-full border-r border-[#FFB800]/20 bg-gradient-to-br from-black via-[#0a0a09] to-[#120f00] p-10 flex flex-col pt-24 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,184,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,184,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-screen" />

                <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 relative z-10 flex items-center gap-3">
                    <Cpu size={32} className="text-[#FFB800]" /> Motor de Geração
                </h1>
                <p className="text-zinc-500 text-sm mb-12 relative z-10">
                    Stream em tempo real dos logs de execução do motor de IA — via SSE.
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

                    {/* Log count */}
                    <div className="mt-auto p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-500 text-xs">Logs capturados</span>
                        <span className="text-[#FFB800] font-bold">{logs.length}</span>
                    </div>

                    {/* Clear button */}
                    <button
                        onClick={() => setLogs([])}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white text-xs transition-all"
                    >
                        <Trash2 size={12} /> Limpar terminal
                    </button>

                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <span className="text-red-500 font-bold block text-xs uppercase tracking-widest mb-1">Avisos do Cluster</span>
                            <span className="text-zinc-400 text-xs text-balance">
                                Se o stream mostrar "Motor offline", verifique se o motor de geração está a correr na porta 3010.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Terminal */}
            <div className="w-full md:w-2/3 h-full bg-[#050505] flex flex-col pt-24 p-8 outline outline-1 outline-white/5 shadow-2xl relative font-mono text-[11px] md:text-xs">
                <div className="flex justify-between items-end mb-4 border-b border-zinc-800 pb-3 shrink-0">
                    <div>
                        <h2 className="text-[#00FF41] text-lg font-bold flex items-center gap-3 uppercase tracking-widest">
                            <Terminal size={20} /> Kernel Log Stream
                        </h2>
                        <p className="text-zinc-600 text-xs uppercase mt-1">Observatório de Payloads e Execução de Agentes — Tempo Real</p>
                    </div>
                    <Database size={20} className={`animate-pulse ${connected ? 'text-green-500' : 'text-zinc-700'}`} />
                </div>

                <div className="flex-1 overflow-y-auto bg-black border border-white/10 rounded-xl p-6 shadow-inner relative custom-scrollbar flex flex-col">
                    {logs.length === 0 ? (
                        <div className="text-zinc-600 flex items-center gap-2 m-auto flex-col">
                            <span className="w-2 h-2 bg-zinc-600 animate-pulse rounded-full" />
                            {connected
                                ? 'Aguardando tráfego do motor...'
                                : reconnecting
                                ? '🔄 Reconectando ao motor de geração...'
                                : '❌ Motor de geração offline'}
                        </div>
                    ) : (
                        <div className="space-y-3 pb-20">
                            <AnimatePresence initial={false}>
                                {logs.map((log, index) => {
                                    const payloadStr = formatPayload(log.metadata);
                                    const isError = log.status === 'error';
                                    const isWarn = log.status === 'warning';

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className={`text-sm ${isError ? 'bg-red-950/20 border-l-2 border-red-500 pl-3 py-1' : isWarn ? 'bg-yellow-950/20 border-l-2 border-yellow-500 pl-3 py-1' : ''}`}
                                        >
                                            <div className="flex items-start gap-2 flex-wrap">
                                                <span className="text-zinc-600 shrink-0">
                                                    [{new Date(log.timestamp).toLocaleTimeString()}]
                                                </span>
                                                <span className={`font-bold shrink-0 ${getAgentColor(log.agent)}`}>
                                                    [{log.agent}]
                                                </span>
                                                <span className={getStatusColor(log.status)}>
                                                    {isError ? '❌ ' : isWarn ? '⚠️ ' : ''}
                                                    {log.message}
                                                </span>
                                            </div>

                                            {payloadStr && payloadStr !== '{}' && payloadStr !== 'null' && (
                                                <div className="mt-2 ml-4 md:ml-16">
                                                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase font-bold mb-1">
                                                        <AlignLeft size={12} /> Payload
                                                    </div>
                                                    <pre className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-lg text-emerald-400 overflow-x-auto custom-scrollbar font-mono text-[10px]">
                                                        {payloadStr}
                                                    </pre>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={terminalEndRef} className="h-4" />
                            <div className="text-[#00FF41] animate-pulse">_</div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
            `}} />
        </motion.div>
    );
}
