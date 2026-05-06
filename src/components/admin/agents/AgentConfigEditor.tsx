import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw, Clock, ShieldCheck, Percent, MessageSquare } from 'lucide-react';
import { api } from '../../../lib/api';

interface AgentConfigEditorProps {
    configs: any[];
    onSave: (id: number, data: any) => void;
}

export const AgentConfigEditor: React.FC<AgentConfigEditorProps> = ({ configs, onSave }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<any>(null);

    const handleEdit = (config: any) => {
        setEditingId(config.id);
        setEditData({ ...config });
    };

    const handleSave = () => {
        if (editingId && editData) {
            onSave(editingId, editData);
            setEditingId(null);
        }
    };

    return (
        <div className="bg-surface/50 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight">Configurações Especialistas</h3>
                        <p className="text-sm font-medium text-text-tertiary">Ajuste fino de horários, descontos e alertas.</p>
                    </div>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[700px] overflow-y-auto">
                {configs.map((config) => (
                    <motion.div 
                        key={config.id}
                        layout
                        className={`p-6 rounded-[2rem] border transition-all ${
                            editingId === config.id 
                            ? 'bg-bg-base border-[#FFB800] shadow-xl' 
                            : 'bg-bg-base/30 border-border-subtle hover:border-[#FFB800]/30 hover:bg-bg-base/50'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="font-black text-text-primary tracking-tight uppercase">{config.agent_name}</h4>
                            {editingId === config.id ? (
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-lg hover:scale-110 active:scale-95 transition-all shadow-lg"><Save size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-2 bg-bg-base border border-border-subtle text-text-tertiary rounded-lg"><RotateCcw size={14} /></button>
                                </div>
                            ) : (
                                <button onClick={() => handleEdit(config)} className="p-2 bg-bg-base border border-border-subtle text-text-tertiary hover:text-[#FFB800] hover:border-[#FFB800] rounded-lg transition-all">
                                    <Settings size={14} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                                    <Clock size={12} /> Intervalo (Min)
                                </div>
                                {editingId === config.id ? (
                                    <input 
                                        type="number"
                                        value={editData.timing_minutes}
                                        onChange={(e) => setEditData({...editData, timing_minutes: parseInt(e.target.value)})}
                                        className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-[#FFB800]"
                                    />
                                ) : (
                                    <div className="text-sm font-black text-text-secondary">{config.timing_minutes}m</div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                                    <Percent size={12} /> Desconto Recup.
                                </div>
                                {editingId === config.id ? (
                                    <input 
                                        type="number"
                                        value={editData.recovery_discount_pct}
                                        onChange={(e) => setEditData({...editData, recovery_discount_pct: parseInt(e.target.value)})}
                                        className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-[#FFB800]"
                                    />
                                ) : (
                                    <div className="text-sm font-black text-text-secondary">{config.recovery_discount_pct}%</div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-[#FFB800] uppercase tracking-widest">
                                    <MessageSquare size={12} /> WhatsApp Alertas (Admin)
                                </div>
                                {editingId === config.id ? (
                                    <input 
                                        type="text"
                                        value={editData.admin_alert_whatsapp || ''}
                                        onChange={(e) => setEditData({...editData, admin_alert_whatsapp: e.target.value})}
                                        className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-[#FFB800]"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-bold text-text-secondary truncate flex-1">{config.admin_alert_whatsapp || 'Defeito (Sincronizado)'}</div>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const res = await api.post('/admin/whatsapp/test-connection', {});
                                                    const data = await res.json();
                                                    alert(data.message);
                                                } catch (e) {
                                                    alert('Falha ao testar conexão.');
                                                }
                                            }}
                                            className="px-2 py-1 bg-white/5 border border-border-subtle rounded-md text-[8px] font-black text-text-tertiary hover:text-[#FFB800] hover:border-[#FFB800] transition-all"
                                        >
                                            TESTAR
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {editingId === config.id && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 pt-4 border-t border-border-subtle space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-text-tertiary uppercase">Alertas Ativos</span>
                                    <div className="flex items-center gap-2">
                                        <div 
                                          onClick={() => setEditData({...editData, alert_toggles: {...editData.alert_toggles, errors: !editData.alert_toggles?.errors}})}
                                          className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative ${editData.alert_toggles?.errors ? 'bg-emerald-500' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${editData.alert_toggles?.errors ? 'left-4.5' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
            
            <div className="p-6 bg-purple-500/5 text-center flex items-center justify-center gap-3">
                <ShieldCheck size={16} className="text-purple-500" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Alterações afetam o motor de execução imediatamente</span>
            </div>
        </div>
    );
};
