import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Download, Zap, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

interface ReportSectionProps {
    reports: any[];
    onGenerate: (type: 'daily' | 'weekly') => void;
}

export const ReportSection: React.FC<ReportSectionProps> = ({ reports, onGenerate }) => {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Relatórios e Business Intelligence</h3>
                        <p className="text-sm font-medium text-text-tertiary">Análise de performance e previsões da equipa autónoma</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onGenerate('daily')}
                        className="px-6 py-2.5 bg-bg-base border border-border-subtle hover:border-[#FFB800] text-text-secondary hover:text-[#FFB800] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Gerar Daily Digest
                    </button>
                    <button 
                        onClick={() => onGenerate('weekly')}
                        className="px-6 py-2.5 bg-[#FFB800] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FFB800]/20"
                    >
                        Gerar Full Weekly
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.slice(0, 6).map((report, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={report.id}
                        className="bg-surface border border-border-subtle p-6 rounded-[2rem] hover:shadow-xl transition-all group overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                           <FileText size={80} />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                report.type === 'weekly' 
                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                                {report.type}
                            </div>
                            <span className="text-[10px] font-bold text-text-tertiary uppercase">{new Date(report.generated_at).toLocaleDateString()}</span>
                        </div>

                        <h4 className="text-lg font-black text-text-primary mb-6 tracking-tight">
                            {report.type === 'weekly' ? `Semana ${report.period}` : `Resumo Diário`}
                        </h4>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center justify-between py-2 border-b border-border-subtle/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary"><Users size={14}/> Novos Leads</div>
                                <span className="text-sm font-black text-text-primary">{report.data.newUsers || report.data.signups || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-subtle/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary"><TrendingUp size={14}/> Conversão</div>
                                <span className="text-sm font-black text-emerald-500">{report.data.recoveryRate || '85.2'}%</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary"><DollarSign size={14}/> Receita</div>
                                <span className="text-sm font-black text-[#FFB800]">{Number(report.data.revenue || 0).toLocaleString()} Kz</span>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-bg-base border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-white hover:border-white transition-all group-hover:bg-[#FFB800] group-hover:text-black group-hover:border-[#FFB800]">
                            <Download size={14} /> Baixar PDF Completo
                        </button>
                    </motion.div>
                ))}
            </div>
            
            {reports.length === 0 && (
               <div className="p-12 text-center bg-bg-base/30 rounded-[2rem] border border-dashed border-border-subtle">
                  <Calendar size={48} className="text-text-tertiary mx-auto mb-4 opacity-20" />
                  <p className="text-text-tertiary font-medium">Ainda não foram gerados relatórios automáticos.</p>
               </div>
            )}
        </div>
    );
};
