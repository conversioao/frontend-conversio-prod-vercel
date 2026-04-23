import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Info, Clock, Check, X, Filter, AlertCircle } from 'lucide-react';

interface AlertCenterProps {
    alerts: any[];
    onResolve: (id: number, action: 'acknowledge' | 'resolve') => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ alerts, onResolve }) => {
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
    const [statusFilter, setStatusFilter] = useState<'active' | 'resolved' | 'acknowledged'>('active');

    const filteredAlerts = alerts.filter(a => {
        if (filter !== 'all' && a.severity !== filter) return false;
        if (a.status !== statusFilter) return false;
        return true;
    });

    const severityIcons: any = {
        critical: <ShieldAlert className="text-red-500" size={20} />,
        warning: <AlertCircle className="text-amber-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    return (
        <div className="bg-surface/50 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Centro de Alertas</h3>
                        <p className="text-sm font-medium text-text-tertiary">Monitoramento de anomalias e problemas críticos</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-bg-base/50 p-1 rounded-xl border border-border-subtle">
                        {['all', 'critical', 'warning', 'info'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === f ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-bg-base/50 border border-border-subtle rounded-xl px-4 py-2 text-[10px] font-black text-text-secondary uppercase tracking-widest outline-none focus:border-[#FFB800]"
                    >
                        <option value="active">Ativos</option>
                        <option value="acknowledged">Reconhecidos</option>
                        <option value="resolved">Resolvidos</option>
                    </select>
                </div>
            </div>

            <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto custom-scrollbar">
                <AnimatePresence initial={false}>
                    {filteredAlerts.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-12 text-center"
                        >
                            <CheckCircle size={48} className="text-emerald-500/20 mx-auto mb-4" />
                            <p className="text-text-tertiary font-medium">Sem alertas {filter !== 'all' ? `${filter}s` : ''} ativos no momento.</p>
                        </motion.div>
                    ) : (
                        filteredAlerts.map((alert) => (
                            <motion.div
                                key={alert.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-6 hover:bg-surface-hover/20 transition-colors group"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-shrink-0 mt-1">
                                        {severityIcons[alert.severity]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-black text-text-primary uppercase tracking-tight">{alert.title}</h4>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-bg-base border border-border-subtle text-text-tertiary">
                                                {new Date(alert.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-text-secondary mb-4 leading-relaxed">{alert.description}</p>
                                        
                                        {alert.status === 'active' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onResolve(alert.id, 'acknowledge')}
                                                    className="px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Reconhecer
                                                </button>
                                                <button
                                                    onClick={() => onResolve(alert.id, 'resolve')}
                                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Resolver
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-text-tertiary uppercase mb-2">
                                            <Clock size={12} /> há {Math.round((new Date().getTime() - new Date(alert.created_at).getTime()) / 60000)} min
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
