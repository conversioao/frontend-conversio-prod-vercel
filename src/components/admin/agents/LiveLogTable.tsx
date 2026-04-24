import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clipboard, Download, Search, Filter, CheckCircle2, XCircle, Info } from 'lucide-react';

interface LiveLogTableProps {
    logs: any[];
}

export const LiveLogTable: React.FC<LiveLogTableProps> = ({ logs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'running'>('all');
    const [agentFilter, setAgentFilter] = useState('all');

    const uniqueAgents = Array.from(new Set(logs.map(log => log.agent_name)));

    const filteredLogs = logs.filter(log => {
        if (searchTerm && !JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter !== 'all' && log.status !== statusFilter) return false;
        if (agentFilter !== 'all' && log.agent_name !== agentFilter) return false;
        return true;
    });

    const exportToCSV = () => {
        const headers = ['Agente', 'Ação', 'Usuário', 'Resultado', 'Timestamp'];
        const rows = filteredLogs.map(log => [
            log.agent_name,
            log.action,
            log.user_name || log.user_id,
            log.status,
            new Date(log.created_at).toLocaleString()
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," + 
            [headers, ...rows].map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `conversio-agents-logs-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="bg-surface/50 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
                        <Clipboard size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Logs em Tempo Real</h3>
                        <p className="text-sm font-medium text-text-tertiary">Histórico de ações e eventos da equipa</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-[#FFB800] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar log..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-bg-base/50 border border-border-subtle rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#FFB800] transition-all min-w-[200px]"
                        />
                    </div>
                    
                    <select 
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                        className="bg-bg-base/50 border border-border-subtle rounded-xl px-4 py-2 text-[10px] font-black text-text-secondary uppercase tracking-widest outline-none focus:border-[#FFB800]"
                    >
                        <option value="all">Agente Especializado</option>
                        {uniqueAgents.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <button 
                        onClick={exportToCSV}
                        className="p-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800] transition-all"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-base/30 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em] border-b border-border-subtle">
                            <th className="px-8 py-4">Agente</th>
                            <th className="px-8 py-4">Ação</th>
                            <th className="px-8 py-4">Utilizador</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-text-tertiary font-medium italic">Nenhum log encontrado para estes filtros.</td>
                            </tr>
                        ) : (
                            filteredLogs.map((log, i) => (
                                <motion.tr 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                    key={log.id} 
                                    className="group hover:bg-surface-hover/20 transition-colors"
                                >
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-[#FFB800]/5 border border-[#FFB800]/10 text-[#FFB800]">
                                                <Info size={12} />
                                            </div>
                                            <span className="text-xs font-black text-text-primary tracking-tight">{log.agent_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-[10px] font-black text-text-secondary uppercase border border-border-subtle px-2 py-1 rounded-md bg-bg-base/50">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-text-primary">{log.user_name || 'Desconhecido'}</span>
                                            <span className="text-[10px] text-text-tertiary font-mono">{log.user_id?.substring(0,8)}...</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                            log.status === 'success' ? 'text-emerald-500' : 'text-red-500'
                                        }`}>
                                            {log.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                            {log.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-[10px] font-bold text-text-tertiary">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                            <br />
                                            <span className="opacity-50">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </span>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-6 bg-bg-base/20 border-t border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Feed Ao Vivo Ativo</span>
                </div>
                <div className="text-[10px] font-bold text-text-tertiary italic underline decoration-[#FFB800]">A mostrar os últimos 200 eventos</div>
            </div>
        </div>
    );
};
