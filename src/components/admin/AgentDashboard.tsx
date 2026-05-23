import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Zap, Target, Bot, Activity, Shield, Database, Layout, MessageSquare, TrendingUp, Play, Pause, Settings, RefreshCw, Layers, AlertCircle, WifiOff, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api';
// --- INLINE ICONS ---
const SparklesIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

const WhatsappIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 3.4L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// --- AGENT DATA ---
const NODES = [
  { id: 'orchestrator', name: 'Smart Orchestrator', category: 'trigger', icon: <Zap size={16}/>, color: '#f56565', x: 100, y: 150 },
  { id: 'recovery', name: 'Recovery Agent', category: 'strategy', icon: <TrendingUp size={16}/>, color: '#ed8936', x: 100, y: 280 },
  { id: 'funnel', name: 'Funnel Agent', category: 'strategy', icon: <Target size={16}/>, color: '#ed8936', x: 100, y: 410 },
  { id: 'marketing', name: 'Marketing Agent', category: 'action', icon: <Bot size={16}/>, color: '#4299e1', x: 400, y: 100 },
  { id: 'campaigns', name: 'Campaigns Agent', category: 'action', icon: <Layout size={16}/>, color: '#4299e1', x: 400, y: 220 },
  { id: 'customer_success', name: 'Customer Success', category: 'action', icon: <SparklesIcon size={16}/>, color: '#4299e1', x: 400, y: 340 },
  { id: 'post_sale', name: 'Post-Sale Agent', category: 'action', icon: <Activity size={16}/>, color: '#4299e1', x: 400, y: 460 },
  { id: 'sales_funnel', name: 'Sales Funnel Auto', category: 'action', icon: <TrendingUp size={16}/>, color: '#4299e1', x: 400, y: 580 },
  { id: 'central', name: 'Central Orchestrator', category: 'core', icon: <Layers size={16}/>, color: '#48bb78', x: 750, y: 340 },
  { id: 'pentagon', name: 'Pentagon Agent', category: 'security', icon: <Shield size={16}/>, color: '#805ad5', x: 1050, y: 200 },
  { id: 'lead_agent', name: 'WhatsApp Lead Agent', category: 'communication', icon: <WhatsappIcon size={16}/>, color: '#38b2ac', x: 1050, y: 340 },
  { id: 'payment', name: 'Payment Verification', category: 'finance', icon: <Database size={16}/>, color: '#e53e3e', x: 1050, y: 480 },
  { id: 'monitor', name: 'Monitor Agent', category: 'infra', icon: <Activity size={16}/>, color: '#a0aec0', x: 1350, y: 200 },
  { id: 'watchdog', name: 'Evolution Watchdog', category: 'infra', icon: <Shield size={16}/>, color: '#a0aec0', x: 1350, y: 340 },
  { id: 'daily_report', name: 'Daily Report', category: 'infra', icon: <Layout size={16}/>, color: '#a0aec0', x: 1350, y: 480 },
  { id: 'key_manager', name: 'Key Manager', category: 'security', icon: <Shield size={16}/>, color: '#805ad5', x: 1350, y: 620 },
];

const EDGES = [
  { source: 'orchestrator', target: 'marketing' },
  { source: 'orchestrator', target: 'campaigns' },
  { source: 'recovery', target: 'central' },
  { source: 'funnel', target: 'orchestrator' },
  { source: 'marketing', target: 'central' },
  { source: 'campaigns', target: 'central' },
  { source: 'customer_success', target: 'central' },
  { source: 'post_sale', target: 'central' },
  { source: 'sales_funnel', target: 'central' },
  { source: 'central', target: 'pentagon' },
  { source: 'central', target: 'lead_agent' },
  { source: 'central', target: 'payment' },
  { source: 'pentagon', target: 'monitor' },
  { source: 'pentagon', target: 'key_manager' },
  { source: 'lead_agent', target: 'watchdog' },
  { source: 'payment', target: 'daily_report' },
];

const NODE_WIDTH = 240;
const NODE_HEIGHT = 64;

interface AgentStatus {
  slug: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'offline';
  lastRun?: string;
  nextRun?: string;
  tasksToday?: number;
  errorsToday?: number;
}

interface AgentLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  metadata?: any;
}

interface SystemLog {
  agent: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  metadata?: any;
}

interface AgentMetrics {
  tasksProcessed: number;
  errors24h: number;
  lastCycle?: string;
  nextCycle?: string;
}

export function AgentDashboard({ onClose, onNavigate }: { onClose: () => void, onNavigate?: (page: string) => void }) {
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // App State
  const baseUrl = BASE_URL;
  const [agentsStatus, setAgentsStatus] = useState<Record<string, AgentStatus>>({});
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [globalLogs, setGlobalLogs] = useState<SystemLog[]>([]);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const [isUpdatingGlobal, setIsUpdatingGlobal] = useState(false);
  const [isUpdatingLocal, setIsUpdatingLocal] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});

  const mapRef = useRef<HTMLDivElement>(null);
  const terminalLogsRef = useRef<HTMLDivElement>(null);

  // Initial Mock Data Fallback
  useEffect(() => {
    const initial: Record<string, AgentStatus> = {};
    NODES.forEach(n => {
      initial[n.id] = { slug: n.id, name: n.name, status: 'active', tasksToday: 0, errorsToday: 0 };
    });
    setAgentsStatus(initial);
  }, []);

  // Auto scroll terminal
  useEffect(() => {
    if (terminalLogsRef.current) {
      terminalLogsRef.current.scrollTop = terminalLogsRef.current.scrollHeight;
    }
  }, [globalLogs]);

  // Fetch Global Status
  const fetchGlobalStatus = useCallback(async () => {
    if (!baseUrl) return;
    setIsUpdatingGlobal(true);
    try {
      const token = localStorage.getItem('conversio_token');
      const res = await fetch(`${baseUrl}/agent-status-global`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data: AgentStatus[] = await res.json();
      
      const statusMap: Record<string, AgentStatus> = {};
      data.forEach(d => { statusMap[d.slug] = d; });
      
      setAgentsStatus(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(slug => {
          if (statusMap[slug]) {
             updated[slug] = statusMap[slug];
          }
        });
        return updated;
      });
      setFailedAttempts(prev => ({ ...prev, global: 0 }));
    } catch (e) {
      setFailedAttempts(prev => ({ ...prev, global: (prev.global || 0) + 1 }));
    } finally {
      setIsUpdatingGlobal(false);
    }
  }, [baseUrl]);

  // Fetch Node Details
  const fetchNodeDetails = useCallback(async (slug: string) => {
    if (!baseUrl) return;
    setIsUpdatingLocal(true);
    // Limpar logs anteriores para dar feedback imediato de carregamento
    setAgentLogs([]);
    setAgentMetrics(null);
    
    try {
      const token = localStorage.getItem('conversio_token');
      const [logsRes, metricsRes] = await Promise.all([
        fetch(`${baseUrl}/agents/${slug}/logs?limit=20`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${baseUrl}/agents/${slug}/metrics`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (logsRes.ok) setAgentLogs(await logsRes.json());
      if (metricsRes.ok) setAgentMetrics(await metricsRes.json());
      
      setFailedAttempts(prev => ({ ...prev, [slug]: 0 }));
    } catch (e) {
      setFailedAttempts(prev => ({ ...prev, [slug]: (prev[slug] || 0) + 1 }));
    } finally {
      setIsUpdatingLocal(false);
    }
  }, [baseUrl]);

  // Global Polling — every 60s
  useEffect(() => {
    if (showConfigModal || !baseUrl) return;
    fetchGlobalStatus();
    const interval = setInterval(fetchGlobalStatus, 60000);
    return () => clearInterval(interval);
  }, [baseUrl, showConfigModal, fetchGlobalStatus]);

  // Local Polling — every 60s
  useEffect(() => {
    if (!selectedNode || showConfigModal || !baseUrl) return;
    fetchNodeDetails(selectedNode);
    const interval = setInterval(() => fetchNodeDetails(selectedNode), 60000);
    return () => clearInterval(interval);
  }, [selectedNode, baseUrl, showConfigModal, fetchNodeDetails]);

  // SSE Global Logs — with auto-reconnect
  useEffect(() => {
    if (showConfigModal || !baseUrl) return;
    let sse: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 2000;
    let active = true;

    const connect = () => {
      if (!active) return;
      const token = localStorage.getItem('conversio_token');
      sse = new EventSource(`${baseUrl}/admin/system/logs/stream?token=${token}&_t=${Date.now()}`);

      sse.onopen = () => {
        console.log('[SSE] Connected to logs stream');
        reconnectDelay = 2000; // reset backoff on success
        setGlobalLogs(prev => [
          ...prev,
          { agent: 'system', message: 'Stream SSE conectado.', status: 'info' as const, timestamp: new Date().toISOString() }
        ].slice(-100));
      };

      sse.onerror = () => {
        console.warn('[SSE] Connection lost, reconnecting in', reconnectDelay, 'ms');
        sse?.close();
        if (active) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000); // max 30s backoff
            connect();
          }, reconnectDelay);
        }
      };

      sse.onmessage = (e) => {
        if (e.data.startsWith(': ping') || e.data === ': ping') return;
        try {
          const log: SystemLog = JSON.parse(e.data);
          setGlobalLogs(prev => [...prev, log].slice(-100));
          if (log.status === 'success' || log.status === 'error') {
            const id = Math.random().toString(36).substr(2, 9);
            const notifType: 'success' | 'error' = log.status === 'success' ? 'success' : 'error';
            setNotifications(prev => [...prev, { id, message: `${log.agent}: ${log.message}`, type: notifType }].slice(-5));
            setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
          }
        } catch (_) {}
      };
    };

    connect();
    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      sse?.close();
    };
  }, [baseUrl, showConfigModal]);

  // Toggle Agent
  const toggleAgentStatus = async (slug: string, currentStatus: string) => {
    if (!baseUrl) return;
    const isActive = currentStatus === 'active';
    try {
      setAgentsStatus(prev => ({
        ...prev,
        [slug]: { ...prev[slug], status: isActive ? 'paused' : 'active' }
      }));
      
      await fetch(`${baseUrl}/agents/${slug}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !isActive })
      });
      fetchGlobalStatus();
    } catch (e) {
      console.error('Toggle failed', e);
    }
  };

  // Input Handlers
  const handleConfigSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    localStorage.setItem('conversio_api_url', url);
    window.location.reload();
    setShowConfigModal(false);
  };

  // Pan / Zoom Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.n8n-node') || (e.target as HTMLElement).closest('.side-panel') || (e.target as HTMLElement).closest('.config-modal') || (e.target as HTMLElement).closest('.terminal-panel')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    if ((e.target as HTMLElement).closest('.side-panel') || (e.target as HTMLElement).closest('.config-modal') || (e.target as HTMLElement).closest('.terminal-panel')) return;
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    setScale(prev => Math.min(Math.max(0.3, prev + delta), 2));
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (map) {
        map.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);

  const drawEdge = (sourceId: string, targetId: string) => {
    const source = NODES.find(n => n.id === sourceId);
    const target = NODES.find(n => n.id === targetId);
    if (!source || !target) return null;

    const startX = source.x + NODE_WIDTH;
    const startY = source.y + NODE_HEIGHT / 2;
    const endX = target.x;
    const endY = target.y + NODE_HEIGHT / 2;

    const cp1X = startX + Math.abs(endX - startX) * 0.5;
    const cp1Y = startY;
    const cp2X = endX - Math.abs(endX - startX) * 0.5;
    const cp2Y = endY;

    const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    const isSelected = selectedNode === sourceId || selectedNode === targetId;
    const isSourceActive = agentsStatus[sourceId]?.status === 'active';

    return (
      <g key={`${sourceId}-${targetId}`}>
        <path
          d={path}
          fill="none"
          stroke={isSelected ? '#FFB800' : isSourceActive ? '#10b98140' : '#333333'}
          strokeWidth={isSelected ? 3 : 2}
          className={`transition-all duration-300 ${isSourceActive ? 'glow-line' : ''}`}
        />
        {isSourceActive && (
          <path
            d={path}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="8 6"
            className="animate-flow transition-all duration-300"
          />
        )}
      </g>
    );
  };

  const selectedAgentData = NODES.find(n => n.id === selectedNode);
  const selectedAgentStatus = selectedNode ? agentsStatus[selectedNode] : null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a1a1a] flex flex-col font-sans overflow-hidden text-gray-200">
      
      {/* Notifications Overlay */}
      <div className="fixed top-20 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-md flex items-center gap-3 min-w-[280px] max-w-[400px] ${n.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100'}`}
            >
              <div className={`w-2 h-2 rounded-full ${n.type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></div>
              <p className="text-xs font-bold truncate">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Config Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 config-modal"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#222222] border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Settings size={20} className="text-[#FFB800]"/> Configuração da API
              </h2>
              <p className="text-sm text-gray-400 mb-6">Insira a Base URL do backend para conectar os agentes em tempo real.</p>
              
              <form onSubmit={handleConfigSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Base URL</label>
                  <input 
                    name="url" 
                    type="url" 
                    defaultValue={baseUrl} 
                    placeholder="http://localhost:3003" 
                    required
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:border-[#FFB800] outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  {baseUrl && (
                    <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white">Cancelar</button>
                  )}
                  <button type="submit" className="px-6 py-2 bg-[#FFB800] text-black font-bold text-sm rounded-lg hover:bg-[#FFB800]/90">Guardar & Conectar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-14 border-b border-gray-800 bg-[#222222] flex items-center justify-between px-6 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#FFB800] flex items-center justify-center shadow-[0_0_10px_rgba(255,184,0,0.3)]">
              <Activity className="text-black" size={18} />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white">Workflow Editor</h1>
          </div>
          <div className="h-4 w-px bg-gray-700 mx-2"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium bg-gray-800 px-2 py-1 rounded flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${(failedAttempts.global || 0) < 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
              Sistema Autónomo
            </span>
            {isUpdatingGlobal && <RefreshCw size={12} className="text-gray-500 animate-spin" />}
            {(failedAttempts.global || 0) >= 3 && <span className="text-xs text-red-500 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded"><WifiOff size={12}/> OFFLINE</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
              onClick={() => onNavigate ? onNavigate('admin-sales-crm') : window.location.hash = '#admin-sales-crm'}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
          >
              <MessageSquare size={14} /> Sales CRM AI
          </button>
          <button 
              onClick={() => onNavigate ? onNavigate('admin-dashboard') : window.location.hash = '#admin-dashboard'}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
          >
              <Activity size={14} /> Radar
          </button>
          <button 
            onClick={() => setShowConfigModal(true)}
            className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
            title="Configurações da API"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Status Summary Bar */}
      <div className="h-10 bg-[#2d2d2d]/50 border-b border-gray-800 flex items-center px-6 gap-6 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Agentes:</span>
          <span className="text-xs font-bold text-white">{NODES.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] text-gray-400 uppercase font-medium">Activos:</span>
          <span className="text-xs font-bold text-emerald-400">{Object.values(agentsStatus).filter(s => s.status === 'active').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
          <span className="text-[10px] text-gray-400 uppercase font-medium">Pausados:</span>
          <span className="text-xs font-bold text-amber-400">{Object.values(agentsStatus).filter(s => s.status === 'paused').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          <span className="text-[10px] text-gray-400 uppercase font-medium">Falhas:</span>
          <span className="text-xs font-bold text-red-400">{Object.values(agentsStatus).filter(s => s.status === 'error' || (s.errorsToday || 0) > 0).length}</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={mapRef}
        className="flex-1 relative overflow-hidden bg-[#1a1a1a]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className="absolute inset-0 transition-transform duration-75"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            width: '100%', 
            height: '100%' 
          }}
        >
          {/* SVG Edges */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <style>{`
                @keyframes flow {
                  from { stroke-dashoffset: 24; }
                  to { stroke-dashoffset: 0; }
                }
                .animate-flow {
                  animation: flow 1s linear infinite;
                }
                .glow-line {
                  filter: url(#glow);
                  stroke-opacity: 0.8;
                }
              `}</style>
            </defs>
            {EDGES.map(edge => drawEdge(edge.source, edge.target))}
          </svg>

          {/* HTML Nodes */}
          {NODES.map(node => {
            const isSelected = selectedNode === node.id;
            const statusData = agentsStatus[node.id];
            const isError = statusData?.status === 'error';
            const isOffline = (failedAttempts.global || 0) >= 3;
            const isCached = !isOffline && (failedAttempts.global || 0) > 0;
            const isPaused = statusData?.status === 'paused';
            const isActive = statusData?.status === 'active';
            const isWhatsapp = node.category === 'communication';

            return (
              <div
                key={node.id}
                onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                className={`n8n-node absolute flex items-center bg-[#2d2d2d] border ${isSelected ? 'border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.2)]' : isError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : isActive ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-gray-700 shadow-sm'} rounded-lg overflow-visible cursor-pointer hover:border-gray-500 transition-colors`}
                style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
              >
                {/* Badges */}
                {isOffline && <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow z-10">OFFLINE</div>}
                {isCached && !isOffline && <div className="absolute -top-3 -right-3 bg-gray-600 text-gray-200 text-[9px] font-bold px-2 py-0.5 rounded shadow z-10">CACHED</div>}
                {isPaused && !isOffline && <div className="absolute -top-3 -right-3 bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow z-10">PAUSED</div>}
                {isWhatsapp && isActive && <div className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-10 flex items-center gap-1"><WifiOff size={8} className="hidden"/> WS-LIVE</div>}
                {isWhatsapp && !isActive && <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-10 flex items-center gap-1"><WifiOff size={8}/> NO-WS</div>}

                {/* Icon Area */}
                <div 
                  className="w-14 h-full flex items-center justify-center shrink-0 border-r border-gray-700/50 rounded-l-lg"
                  style={{ backgroundColor: isActive ? '#10b98120' : `${node.color}20`, color: isActive ? '#10b981' : node.color }}
                >
                  {node.icon}
                </div>
                
                {/* Content Area */}
                <div className="flex-1 px-3 py-2 flex flex-col justify-center min-w-0 relative">
                  <div className="text-xs font-bold text-gray-200 truncate pr-4">{node.name}</div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 flex justify-between items-center">
                    <span>{node.category}</span>
                    {statusData && (
                      <div className="flex items-center gap-2">
                        {statusData.errorsToday ? (
                          <span className="flex items-center gap-1 text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">
                            <AlertCircle size={8}/> {statusData.errorsToday}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <Activity size={8}/> {statusData.tasksToday || 0}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input/Output Ports (Visual only) */}
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-600 border border-[#2d2d2d]"></div>
                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-600 border border-[#2d2d2d]"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel (n8n style parameters panel) */}
      <AnimatePresence>
        {selectedNode && selectedAgentData && (
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="side-panel absolute right-0 top-14 bottom-0 w-[450px] bg-[#222222] border-l border-gray-800 shadow-2xl flex flex-col z-30"
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedAgentData.color}20`, color: selectedAgentData.color }}
                >
                  {selectedAgentData.icon}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    {selectedAgentData.name}
                    {isUpdatingLocal && <RefreshCw size={12} className="text-gray-500 animate-spin" />}
                  </h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{selectedAgentData.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              
              {/* Detailed Metrics */}
              <div className="p-5 border-b border-gray-800 grid grid-cols-2 gap-3 bg-[#1e1e1e]">
                 <div className="bg-[#2a2a2a] p-4 rounded-xl border border-gray-700">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Tarefas Processadas</span>
                    <span className="text-2xl font-bold text-white flex items-center gap-2">
                      <Activity size={16} className="text-emerald-500"/>
                      {agentMetrics?.tasksProcessed || selectedAgentStatus?.tasksToday || 0}
                    </span>
                 </div>
                 <div className="bg-[#2a2a2a] p-4 rounded-xl border border-gray-700">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Erros (24h)</span>
                    <span className={`text-2xl font-bold flex items-center gap-2 ${agentMetrics?.errors24h ? 'text-red-400' : 'text-emerald-400'}`}>
                      {agentMetrics?.errors24h ? <AlertCircle size={16}/> : <Shield size={16}/>}
                      {agentMetrics?.errors24h || selectedAgentStatus?.errorsToday || 0}
                    </span>
                 </div>
              </div>

              {/* Advanced Parameters */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado do Agente</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleAgentStatus(selectedNode, selectedAgentStatus?.status || 'active')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedAgentStatus?.status === 'active' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20'}`}
                    >
                      {selectedAgentStatus?.status === 'active' ? <Pause size={12}/> : <Play size={12}/>}
                      {selectedAgentStatus?.status === 'active' ? 'PAUSAR' : 'ACTIVAR'}
                    </button>
                    <button 
                      onClick={async () => {
                        const token = localStorage.getItem('conversio_token');
                        try {
                          const res = await fetch(`${baseUrl}/admin/agents/${selectedNode}/repair`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const data = await res.json();
                          if (data.success) {
                            const id = Math.random().toString(36).substr(2, 9);
                            setNotifications(prev => [...prev, { id, message: 'Conexão reparada com sucesso!', type: 'success' }]);
                            setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
                            fetchGlobalStatus();
                            fetchNodeDetails(selectedNode);
                          } else {
                            throw new Error(data.error || 'Falha ao reparar');
                          }
                        } catch (err: any) {
                          const id = Math.random().toString(36).substr(2, 9);
                          setNotifications(prev => [...prev, { id, message: `Erro: ${err.message}`, type: 'error' }]);
                          setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all text-[10px] font-bold"
                      title="Reparar Webhooks e Sincronização"
                    >
                      <Zap size={12}/>
                      REPARAR
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                   <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase block mb-1">Última Execução</span>
                      <span className="text-xs text-gray-300 font-mono">
                        {selectedAgentStatus?.lastRun ? new Date(selectedAgentStatus.lastRun).toLocaleTimeString() : '---'}
                      </span>
                   </div>
                   <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase block mb-1">Próxima Execução</span>
                      <span className="text-xs text-emerald-500 font-mono">
                        {selectedAgentStatus?.nextRun ? new Date(selectedAgentStatus.nextRun).toLocaleTimeString() : '---'}
                      </span>
                   </div>
                </div>

                {selectedAgentData.category === 'communication' && (
                  <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <WhatsappIcon size={14}/>
                       <span className="text-xs text-gray-300">Conexão WhatsApp (Baileys)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedAgentStatus?.status === 'active' ? 'bg-emerald-500 text-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500 text-white'}`}>
                      {selectedAgentStatus?.status === 'active' ? 'WS-LIVE' : 'NO-WS'}
                    </span>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-800"></div>

              {/* Granular Logs */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center justify-between">
                   Histórico Granular (Live)
                   {(failedAttempts[selectedNode] || 0) > 0 && <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Disconnected</span>}
                </h3>
                <div className="space-y-6 flex-1 relative before:absolute before:inset-0 before:ml-[15px] before:w-0.5 before:bg-gradient-to-b before:from-gray-700 before:to-transparent">
                  {isUpdatingLocal && agentLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                       <RefreshCw size={24} className="animate-spin text-[#FFB800]"/>
                       <span className="text-[10px] font-bold uppercase tracking-widest">Carregando Histórico...</span>
                    </div>
                  ) : agentLogs.length > 0 ? agentLogs.map((log, i) => (
                    <div key={i} className="relative flex items-start group">
                      <div className={`w-8 h-8 rounded-full border-4 border-[#222222] shrink-0 z-10 flex items-center justify-center ${log.level === 'error' ? 'bg-red-500 text-red-900' : log.level === 'warn' ? 'bg-amber-500 text-amber-900' : 'bg-emerald-500 text-emerald-900'}`}>
                         {log.level === 'error' ? <X size={12}/> : log.level === 'warn' ? <AlertCircle size={12}/> : <Activity size={12}/>}
                      </div>
                      <div className="ml-4 w-full bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 transition-colors p-4 rounded-xl shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : 'text-emerald-400'}`}>{log.level}</span>
                          <span className="text-[10px] text-gray-500 bg-black/40 px-2 py-1 rounded font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${log.level === 'error' ? 'text-red-300' : 'text-gray-300'}`}>{log.message}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-3 p-2.5 bg-black/30 rounded-lg border border-gray-800/50 flex flex-col gap-1.5">
                            {Object.entries(log.metadata).map(([key, val]) => (
                                <div key={key} className="flex items-start gap-2 text-[10px]">
                                    <span className="text-gray-500 font-bold uppercase shrink-0 min-w-[70px]">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-gray-400 break-words">
                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                    </span>
                                </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                     <div className="text-center text-gray-500 text-xs py-8 relative z-10">
                        A aguardar nova execução...
                     </div>
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] flex gap-2 shrink-0">
               <button 
                  onClick={() => toggleAgentStatus(selectedNode, selectedAgentStatus?.status || 'active')}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2 ${selectedAgentStatus?.status === 'active' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}
               >
                  {selectedAgentStatus?.status === 'active' ? <><Pause size={14} /> Suspender Agente</> : <><Play size={14} /> Ativar Agente</>}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Live Terminal */}
      <div className={`terminal-panel absolute bottom-0 left-0 right-0 bg-[#0c0c0c] border-t border-gray-800 transition-all duration-300 z-40 ${isTerminalOpen ? 'h-64' : 'h-10'}`}>
        <div className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-[#1a1a1a] transition-colors">
          <div 
            className="flex-1 flex items-center gap-3"
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          >
            <Terminal size={14} className="text-[#FFB800]"/>
            <span className="text-xs font-bold text-gray-300">SERVER TERMINAL STREAM</span>
            {globalLogs.length > 0 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                {globalLogs.length} EVENTOS LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isTerminalOpen && (
              <button 
                onClick={(e) => { e.stopPropagation(); setGlobalLogs([]); }}
                className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded transition-colors"
              >
                LIMPAR CONSOLA
              </button>
            )}
            <div className="text-gray-500" onClick={() => setIsTerminalOpen(!isTerminalOpen)}>
              {isTerminalOpen ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
            </div>
          </div>
        </div>
        
        {isTerminalOpen && (
          <div ref={terminalLogsRef} className="h-54 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed custom-scrollbar">
            {globalLogs.length === 0 ? (
              <div className="text-gray-600 italic flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin"/> Conectando ao orquestrador SSE...
              </div>
            ) : (
              globalLogs.map((log, i) => (
                <div key={i} className="mb-1 flex hover:bg-white/5 px-2 py-1 rounded">
                  <span className="text-gray-600 mr-3 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`w-20 font-bold shrink-0 ${log.status === 'error' ? 'text-red-500' : log.status === 'warning' ? 'text-amber-500' : log.status === 'success' ? 'text-emerald-500' : 'text-blue-400'}`}>
                    [{log.agent.toUpperCase().substring(0, 8)}]
                  </span>
                  <span className={`flex-1 break-words ${log.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className={`absolute right-6 flex items-center bg-[#222222] border border-gray-800 rounded-lg overflow-hidden shadow-lg z-20 transition-all duration-300 ${isTerminalOpen ? 'bottom-72' : 'bottom-16'}`}>
        <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700">-</button>
        <span className="text-xs font-medium text-gray-300 px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700">+</button>
        <div className="w-px h-4 bg-gray-700 mx-1"></div>
        <button onClick={() => { setScale(0.8); setPan({x: 50, y: 50}); }} className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700" title="Reset View">
           <RefreshCw size={14} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}} />
    </div>
  );
}
