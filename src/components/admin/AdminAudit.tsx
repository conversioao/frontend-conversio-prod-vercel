import React, { useEffect, useState } from 'react';
import { History, Shield, User, Clock, Info, Search, Filter, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/audit?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-widest text-sm">Acedendo aos Registos de Segurança...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
             <Shield size={32} className="text-[#FFB800]" /> Registos de Auditoria
          </h1>
          <p className="text-text-secondary text-sm font-medium">Rastreabilidade total das ações administrativas realizadas no sistema.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-[#FFB800] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisar ação ou admin..."
                className="pl-11 pr-6 py-3 bg-surface border border-border-subtle rounded-2xl text-xs font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50 min-w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button 
             onClick={fetchLogs}
             className="p-3 bg-surface border border-border-subtle rounded-xl text-text-tertiary hover:text-text-primary transition-all"
           >
              <RefreshCw size={18} />
           </button>
        </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] uppercase font-black tracking-widest text-text-tertiary border-b border-border-subtle bg-surface-hover/30">
                     <th className="px-8 py-5">Timestamp</th>
                     <th className="px-8 py-5">Administrador</th>
                     <th className="px-8 py-5">Ação Realizada</th>
                     <th className="px-8 py-5">Detalhes / Contexto</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-text-tertiary italic text-sm">Nenhum registo encontrado.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border-subtle hover:bg-bg-base/50 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-bg-base rounded-lg text-text-tertiary group-hover:text-[#FFB800] transition-colors">
                                 <Clock size={14} />
                              </div>
                              <span className="text-[11px] font-bold text-text-secondary">
                                 {new Date(log.created_at).toLocaleString('pt-PT')}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center font-black text-[10px] border border-[#FFB800]/20">
                                 {log.admin_name?.substring(0,2).toUpperCase()}
                              </div>
                              <span className="text-sm font-bold text-text-primary">{log.admin_name}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                              log.action.includes('DELETE') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              log.action.includes('APPROVE') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              log.action.includes('UPDATE') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-text-tertiary/10 text-text-tertiary border-border-subtle'
                           }`}>
                              {log.action.replace(/_/g, ' ')}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 max-w-[400px]">
                              <code className="text-[10px] font-bold text-text-tertiary bg-bg-base px-2 py-1 rounded truncate">
                                 {JSON.stringify(log.details)}
                              </code>
                              <button className="text-text-tertiary hover:text-[#FFB800] transition-colors shrink-0">
                                 <Info size={14} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <div className="p-8 bg-surface-hover/30 border border-border-subtle rounded-[2.5rem] flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center text-[#FFB800]">
               <Shield size={24} />
            </div>
            <div>
               <p className="text-sm font-bold text-text-primary">Integridade dos Registos</p>
               <p className="text-xs text-text-tertiary">Estes logs são imutáveis e refletem o estado real do sistema.</p>
            </div>
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Seguro
         </span>
      </div>
    </div>
  );
}
