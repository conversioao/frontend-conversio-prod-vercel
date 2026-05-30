import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Image, Video, FileText, Search, Filter, RefreshCw, ExternalLink, 
    User, Calendar, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
    Download, Eye, Sparkles, Mic
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Generation {
    id: string;
    type: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result_url: string | null;
    created_at: string;
    metadata: any;
    user_id: string;
    user_name: string;
    user_email: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    image: { label: 'Imagem', icon: Image, color: 'purple' },
    video: { label: 'Vídeo', icon: Video, color: 'blue' },
    ugc_video: { label: 'UGC Vídeo', icon: Video, color: 'indigo' },
    audio: { label: 'Áudio', icon: Mic, color: 'amber' },
    music: { label: 'Música', icon: Mic, color: 'amber' },
    musica: { label: 'Música', icon: Mic, color: 'amber' },
    voice: { label: 'Voz', icon: Mic, color: 'amber' },
    text: { label: 'Texto', icon: FileText, color: 'emerald' },
    default: { label: 'Geração', icon: Sparkles, color: 'amber' }
};

const STATUS_CONFIG = {
    completed: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    failed: { label: 'Falhado', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    processing: { label: 'A processar', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
};

export function AdminGenerations() {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
    const LIMIT = 20;

    const fetchGenerations = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                ...(filterType && { type: filterType }),
                ...(filterStatus && { status: filterStatus })
            });
            const res = await apiFetch(`/admin/generations?${params}`);
            const data = await res.json();
            if (data.success) {
                setGenerations(data.generations);
                setTotal(data.total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, filterType, filterStatus]);

    useEffect(() => {
        fetchGenerations();
        const interval = setInterval(fetchGenerations, 30000);
        return () => clearInterval(interval);
    }, [fetchGenerations]);

    const filteredGenerations = search 
        ? generations.filter(g => 
            g.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            g.user_email?.toLowerCase().includes(search.toLowerCase()) ||
            g.prompt?.toLowerCase().includes(search.toLowerCase())
          )
        : generations;

    const totalPages = Math.ceil(total / LIMIT);
    const successCount = generations.filter(g => g.status === 'completed').length;
    const failCount = generations.filter(g => g.status === 'failed').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
                        Gerações dos Utilizadores
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded-md border border-purple-500/20 uppercase tracking-widest">
                            Total: {total}
                        </span>
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Monitorização completa de todas as criações de conteúdo.
                    </p>
                </div>
                <button
                    onClick={fetchGenerations}
                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-xl text-text-secondary text-xs font-bold hover:text-text-primary transition-all hover:border-[#FFB800]/30"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total (Página)', value: generations.length, color: 'text-text-primary', bg: 'bg-surface' },
                    { label: 'Concluídas', value: successCount, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                    { label: 'Falhadas', value: failCount, color: 'text-red-400', bg: 'bg-red-500/5' },
                    { label: 'Total Geral', value: total, color: 'text-[#FFB800]', bg: 'bg-[#FFB800]/5' }
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} border border-border-subtle rounded-2xl p-4`}>
                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Pesquisar por utilizador ou prompt..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-[#FFB800]/50 transition-all"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-[#FFB800]/50 transition-all appearance-none cursor-pointer"
                >
                    <option value="">Todos os Tipos</option>
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                    <option value="ugc_video">UGC Vídeo</option>
                    <option value="text">Texto</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-[#FFB800]/50 transition-all appearance-none cursor-pointer"
                >
                    <option value="">Todos os Estados</option>
                    <option value="completed">Concluídas</option>
                    <option value="failed">Falhadas</option>
                    <option value="pending">Pendentes</option>
                    <option value="processing">A Processar</option>
                </select>
            </div>

            {/* Generations Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-surface border border-border-subtle rounded-2xl h-64 animate-pulse" />
                    ))}
                </div>
            ) : filteredGenerations.length === 0 ? (
                <div className="py-24 text-center">
                    <Sparkles size={40} className="mx-auto mb-4 text-text-tertiary opacity-30" />
                    <p className="text-text-tertiary text-sm">Nenhuma geração encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredGenerations.map((gen) => {
                        const typeConf = TYPE_CONFIG[gen.type] || TYPE_CONFIG.default;
                        const statusConf = STATUS_CONFIG[gen.status] || STATUS_CONFIG.pending;
                        const TypeIcon = typeConf.icon;
                        const StatusIcon = statusConf.icon;
                        const isMedia = gen.type === 'image' || gen.type === 'video' || gen.type === 'ugc_video';

                        return (
                            <motion.div
                                key={gen.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-surface border border-border-subtle rounded-2xl overflow-hidden hover:border-[#FFB800]/20 transition-all group cursor-pointer"
                                onClick={() => setSelectedGen(gen)}
                            >
                                {/* Preview Area */}
                                <div className={`relative h-36 bg-gradient-to-br from-${typeConf.color}-500/5 to-${typeConf.color}-500/10 flex items-center justify-center overflow-hidden`}>
                                    {gen.result_url && isMedia ? (
                                        gen.type === 'video' || gen.type === 'ugc_video' ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <Video size={32} className="text-white opacity-60" />
                                                <img
                                                    src={gen.result_url}
                                                    alt=""
                                                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                src={gen.result_url}
                                                alt={gen.prompt?.substring(0, 50)}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        )
                                    ) : (
                                        <TypeIcon size={32} className={`text-${typeConf.color}-400 opacity-60`} />
                                    )}
                                    
                                    {/* Status badge */}
                                    <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusConf.bg} ${statusConf.color} ${statusConf.border} border backdrop-blur-sm`}>
                                        <StatusIcon size={9} />
                                        {statusConf.label}
                                    </div>

                                    {/* Type badge */}
                                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 text-white/80 backdrop-blur-sm`}>
                                        {typeConf.label}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center shrink-0">
                                            <User size={10} className="text-[#FFB800]" />
                                        </div>
                                        <span className="text-xs font-bold text-text-primary truncate">{gen.user_name || 'Desconhecido'}</span>
                                    </div>
                                    <p className="text-[11px] text-text-tertiary line-clamp-2 leading-relaxed">
                                        {gen.prompt || 'Sem prompt'}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                                        <Calendar size={10} />
                                        {new Date(gen.created_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 bg-surface border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-text-secondary font-bold">
                        Página {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 bg-surface border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedGen && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedGen(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-2xl max-h-[90vh] bg-surface border border-border-subtle rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-base/30">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-${(TYPE_CONFIG[selectedGen.type] || TYPE_CONFIG.default).color}-500/10 flex items-center justify-center`}>
                                        {React.createElement((TYPE_CONFIG[selectedGen.type] || TYPE_CONFIG.default).icon, { 
                                            size: 18, 
                                            className: `text-${(TYPE_CONFIG[selectedGen.type] || TYPE_CONFIG.default).color}-400` 
                                        })}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-primary text-lg">{selectedGen.user_name}</h3>
                                        <p className="text-xs text-text-tertiary">{selectedGen.user_email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedGen(null)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Media Preview */}
                                {selectedGen.result_url && (
                                    <div className="rounded-2xl overflow-hidden bg-black/20 border border-border-subtle">
                                        {selectedGen.type === 'video' || selectedGen.type === 'ugc_video' ? (
                                            <video
                                                src={selectedGen.result_url}
                                                controls
                                                className="w-full max-h-64 object-contain"
                                            />
                                        ) : (
                                            <img
                                                src={selectedGen.result_url}
                                                alt={selectedGen.prompt}
                                                className="w-full max-h-64 object-contain"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-subtle">
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Tipo</p>
                                        <p className="text-sm font-bold text-text-primary">{(TYPE_CONFIG[selectedGen.type] || TYPE_CONFIG.default).label}</p>
                                    </div>
                                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-subtle">
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Estado</p>
                                        <p className={`text-sm font-bold ${(STATUS_CONFIG[selectedGen.status] || STATUS_CONFIG.pending).color}`}>
                                            {(STATUS_CONFIG[selectedGen.status] || STATUS_CONFIG.pending).label}
                                        </p>
                                    </div>
                                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-subtle col-span-2">
                                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Data</p>
                                        <p className="text-sm font-bold text-text-primary">
                                            {new Date(selectedGen.created_at).toLocaleString('pt-AO', { 
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                                                hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Prompt */}
                                <div className="bg-bg-base/50 p-4 rounded-xl border border-border-subtle">
                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Prompt</p>
                                    <p className="text-sm text-text-secondary leading-relaxed">{selectedGen.prompt || 'Sem prompt disponível'}</p>
                                </div>

                                {/* Actions */}
                                {selectedGen.result_url && (
                                    <div className="flex gap-3">
                                        <a
                                            href={selectedGen.result_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FFB800] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            <Eye size={14} />Ver Original
                                        </a>
                                        <a
                                            href={selectedGen.result_url}
                                            download
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface border border-border-subtle text-text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-surface-hover transition-all"
                                        >
                                            <Download size={14} />Download
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminGenerations;
