import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, CheckCircle2, X, Building2, CreditCard, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface BankAccount {
    id: number;
    bank_name: string;
    account_holder: string;
    iban?: string;
    account_number?: string;
    multicaixa_reference?: string;
    multicaixa_entity?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
}

const EMPTY_FORM = {
    bank_name: '',
    account_holder: '',
    iban: '',
    account_number: '',
    multicaixa_reference: '',
    multicaixa_entity: '',
    notes: '',
    is_active: true
};

// Bank logos/colors by name
const BANK_STYLES: Record<string, string> = {
    'bfa': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    'bai': 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    'bcgta': 'bg-green-500/10 border-green-500/30 text-green-400',
    'bpc': 'bg-red-500/10 border-red-500/30 text-red-400',
    'atlantico': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    'multicaixa': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

function getBankStyle(name: string) {
    const key = name.toLowerCase();
    for (const k of Object.keys(BANK_STYLES)) {
        if (key.includes(k)) return BANK_STYLES[k];
    }
    return 'bg-surface-hover border-border-subtle text-text-secondary';
}

export function AdminBankSettings() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState<{
        isOpen: boolean; title: string; message: string;
        type: 'info' | 'warning' | 'error' | 'success' | 'confirm'; onConfirm?: () => void;
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    const fetchAccounts = async () => {
        try {
            const res = await apiFetch('/admin/bank-accounts');
            const data = await res.json();
            if (data.success) setAccounts(data.accounts || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const handleSave = async () => {
        if (!form.bank_name.trim() || !form.account_holder.trim()) {
            setModal({ isOpen: true, title: 'Campos obrigatórios', message: 'Nome do banco e titular são obrigatórios.', type: 'warning' });
            return;
        }
        setSaving(true);
        try {
            const endpoint = editingId ? `/admin/bank-accounts/${editingId}` : '/admin/bank-accounts';
            const method = editingId ? 'PUT' : 'POST';
            const res = await apiFetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                fetchAccounts();
                setShowForm(false);
                setEditingId(null);
                setForm({ ...EMPTY_FORM });
            } else {
                setModal({ isOpen: true, title: 'Erro', message: data.message, type: 'error' });
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleEdit = (acc: BankAccount) => {
        setForm({
            bank_name: acc.bank_name,
            account_holder: acc.account_holder,
            iban: acc.iban || '',
            account_number: acc.account_number || '',
            multicaixa_reference: acc.multicaixa_reference || '',
            multicaixa_entity: acc.multicaixa_entity || '',
            notes: acc.notes || '',
            is_active: acc.is_active
        });
        setEditingId(acc.id);
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        setModal({
            isOpen: true,
            title: 'Eliminar Conta',
            message: 'Tem certeza que deseja remover esta conta bancária? As verificações de comprovativos já realizadas não serão afetadas.',
            type: 'confirm',
            onConfirm: async () => {
                await apiFetch(`/admin/bank-accounts/${id}`, { method: 'DELETE' });
                fetchAccounts();
                setModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">Contas Bancárias</h1>
                        <p className="text-text-secondary text-sm">Dados bancários utilizados pelo Agente AI para verificar comprovativos de pagamento.</p>
                    </div>
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
                        className="flex items-center gap-2 px-5 py-3 bg-[#FFB800] text-black font-black rounded-2xl text-sm uppercase tracking-wider hover:scale-[1.02] transition-all shadow-lg"
                    >
                        <Plus size={18} /> Adicionar Conta
                    </button>
                </div>

                {/* How it works info */}
                <div className="p-5 bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-2xl flex items-start gap-4">
                    <ShieldCheck size={20} className="text-[#FFB800] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-text-primary mb-1">Como funciona o Agente Verificador</p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Quando um utilizador submete um comprovativo de pagamento (PDF ou imagem), o Agente AI analisa o documento automaticamente — extrai o IBAN, valor e referência — e compara com as contas cadastradas aqui.
                            Se o IBAN coincidir, o pagamento é classificado como <strong className="text-emerald-400">Válido</strong>. Caso contrário, é marcado como <strong className="text-red-400">Suspeito</strong>. O Admin é sempre notificado via WhatsApp antes de qualquer crédito ser atribuído.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-surface border border-[#FFB800]/30 rounded-[2rem] p-8 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-text-primary">
                                    {editingId ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
                                </h3>
                                <button onClick={cancelForm} className="p-2 rounded-xl text-text-tertiary hover:text-text-primary transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Nome do Banco *</label>
                                    <input
                                        value={form.bank_name}
                                        onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                                        placeholder="Ex: BFA, BAI, BPC..."
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary outline-none focus:border-[#FFB800]/50 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Titular da Conta *</label>
                                    <input
                                        value={form.account_holder}
                                        onChange={e => setForm(f => ({ ...f, account_holder: e.target.value }))}
                                        placeholder="Nome completo do titular"
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary outline-none focus:border-[#FFB800]/50 text-sm"
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">IBAN</label>
                                    <input
                                        value={form.iban}
                                        onChange={e => setForm(f => ({ ...f, iban: e.target.value.toUpperCase() }))}
                                        placeholder="AO06 XXXX XXXX XXXX XXXX XXXX X"
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary outline-none focus:border-[#FFB800]/50 text-sm font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Número de Conta</label>
                                    <input
                                        value={form.account_number}
                                        onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                                        placeholder="Número de conta bancária"
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary outline-none focus:border-[#FFB800]/50 text-sm font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Referência Multicaixa Express</label>
                                    <input
                                        value={form.multicaixa_reference}
                                        onChange={e => setForm(f => ({ ...f, multicaixa_reference: e.target.value }))}
                                        placeholder="Referência para pagamentos Multicaixa"
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary outline-none focus:border-[#FFB800]/50 text-sm font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Entidade Multicaixa</label>
                                    <input
                                        value={form.multicaixa_entity}
                                        onChange={e => setForm(f => ({ ...f, multicaixa_entity: e.target.value }))}
                                        placeholder="Número de entidade (se aplicável)"
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary outline-none focus:border-[#FFB800]/50 text-sm font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Notas</label>
                                    <input
                                        value={form.notes}
                                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Ex: conta principal para transferências..."
                                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-text-primary outline-none focus:border-[#FFB800]/50 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-[#FFB800]' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <span className="text-sm text-text-secondary font-medium">Conta activa para verificação</span>
                                </label>

                                <div className="flex gap-3">
                                    <button onClick={cancelForm} className="px-5 py-2.5 rounded-xl text-text-secondary hover:text-text-primary border border-border-subtle text-sm font-medium transition-all">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#FFB800] text-black font-black rounded-xl text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                        {editingId ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Accounts list */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="text-[#FFB800] animate-spin" />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border-subtle rounded-[2rem]">
                        <Building2 size={48} className="text-text-tertiary mb-4 opacity-30" />
                        <p className="text-text-tertiary font-bold uppercase tracking-widest text-sm">Nenhuma conta cadastrada</p>
                        <p className="text-text-tertiary opacity-50 text-xs mt-2">Adicione as contas bancárias para activar a verificação automática de comprovativos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {accounts.map(acc => (
                            <motion.div
                                key={acc.id}
                                layout
                                className={`relative bg-surface border rounded-2xl p-6 ${!acc.is_active ? 'opacity-50' : ''}`}
                            >
                                {/* Status indicator */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${getBankStyle(acc.bank_name)}`}>
                                        <Building2 size={14} />
                                        {acc.bank_name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!acc.is_active && (
                                            <span className="text-[9px] text-text-tertiary bg-surface-hover px-2 py-1 rounded-full">Inactiva</span>
                                        )}
                                        <button onClick={() => handleEdit(acc)} className="p-1.5 hover:bg-surface-hover rounded-lg text-text-tertiary hover:text-[#FFB800] transition-all">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(acc.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-tertiary hover:text-red-500 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <p className="font-bold text-text-primary text-sm mb-3">{acc.account_holder}</p>

                                {acc.iban && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard size={12} className="text-text-tertiary" />
                                        <span className="text-xs font-mono text-text-secondary">{acc.iban}</span>
                                    </div>
                                )}

                                {acc.multicaixa_reference && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Multicaixa</span>
                                        <span className="text-xs font-mono text-text-secondary">{acc.multicaixa_reference}</span>
                                        {acc.multicaixa_entity && <span className="text-[10px] text-text-tertiary">Entidade: {acc.multicaixa_entity}</span>}
                                    </div>
                                )}

                                {acc.notes && (
                                    <p className="text-[10px] text-text-tertiary mt-2 italic">{acc.notes}</p>
                                )}

                                {acc.is_active && (
                                    <div className="absolute bottom-3 right-4 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] text-emerald-500 font-bold">Activa</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={() => { if (modal.onConfirm) modal.onConfirm(); setModal(prev => ({ ...prev, isOpen: false })); }}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
}
