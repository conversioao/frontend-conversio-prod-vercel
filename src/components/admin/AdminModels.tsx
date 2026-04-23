import React, { useEffect, useState, useCallback } from 'react';
import { Layers, Trash2, Zap, RefreshCw, Plus, Save, Image as ImageIcon, Video, Music, Box, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

type Category = 'core' | 'model';
type ModelType = 'image' | 'video' | 'audio';

interface AIModel {
  id: number;
  type: ModelType;
  name: string;
  style_id: string;
  category: Category;
  credit_cost: number;
  is_active: boolean;
}

// Groups we want to display (styles are hidden/deleted)
const GROUPS: { key: string; label: string; type: ModelType; category: Category; icon: React.ReactNode; color: string }[] = [
  { key: 'image-core',  label: 'Cores de Imagem',        type: 'image', category: 'core',  icon: <ImageIcon size={16} />, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { key: 'video-core',  label: 'Cores de Vídeo',         type: 'video', category: 'core',  icon: <Video size={16} />,     color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { key: 'image-model', label: 'Modelos — Geração Imagem', type: 'image', category: 'model', icon: <ImageIcon size={16} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'video-model', label: 'Modelos — Geração Vídeo',  type: 'video', category: 'model', icon: <Video size={16} />,     color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { key: 'audio-model', label: 'Modelos — Geração Música', type: 'audio', category: 'model', icon: <Music size={16} />,     color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
];

const EMPTY_FORM = { name: '', style_id: '', type: 'image' as ModelType, category: 'core' as Category, credit_cost: 1 };

export function AdminModels() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  const [showAddForm, setShowAddForm] = useState<string | null>(null); // group key
  const [newModel, setNewModel] = useState(EMPTY_FORM);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [globalSurcharge, setGlobalSurcharge] = useState<number>(2);
  const [updatingSurcharge, setUpdatingSurcharge] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/models');
      const data = await res.json();
      if (data.success) {
        // Only show cores and models — filter out styles at UI level
        setModels((data.models || []).filter((m: AIModel) => m.category === 'core' || m.category === 'model'));
      }

      // Also fetch global config for surcharge
      const configRes = await apiFetch('/admin/config');
      const configData = await configRes.json();
      if (configData.success && configData.config?.financial?.composition_cost) {
        setGlobalSurcharge(Number(configData.config.financial.composition_cost));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cleanup: delete all style-category entries from DB
  const handleCleanupStyles = async () => {
    setCleaningUp(true);
    try {
      const res = await apiFetch('/admin/models/cleanup-styles', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`${data.deleted} estilos eliminados da base de dados.`);
        fetchModels();
      } else {
        showToast(data.message || 'Erro ao limpar estilos.', 'error');
      }
    } catch {
      showToast('Erro de ligação ao eliminar estilos.', 'error');
    } finally {
      setCleaningUp(false);
    }
  };

  const handleUpdateGlobalSurcharge = async () => {
    try {
      setUpdatingSurcharge(true);
      const res = await apiFetch('/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            financial_composition_cost: globalSurcharge.toString()
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Taxa de composição atualizada!');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar taxa', 'error');
    } finally {
      setUpdatingSurcharge(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleUpdateCost = async (model: AIModel, newCost: number) => {
    setSaving(prev => ({ ...prev, [model.id]: true }));
    try {
      await apiFetch(`/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: model.is_active, name: model.name, style_id: model.style_id, category: model.category, credit_cost: newCost })
      });
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, credit_cost: newCost } : m));
      showToast('Custo atualizado!');
    } catch {
      showToast('Erro ao atualizar custo.', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [model.id]: false }));
    }
  };

  const handleToggleActive = async (model: AIModel) => {
    try {
      await apiFetch(`/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !model.is_active, name: model.name, style_id: model.style_id, category: model.category, credit_cost: model.credit_cost })
      });
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, is_active: !m.is_active } : m));
    } catch {
      showToast('Erro ao alterar estado.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/admin/models/${id}`, { method: 'DELETE' });
      setModels(prev => prev.filter(m => m.id !== id));
      setDeleteModal({ open: false, id: null });
      showToast('Modelo eliminado.');
    } catch {
      showToast('Erro ao eliminar modelo.', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent, group: typeof GROUPS[0]) => {
    e.preventDefault();
    if (!newModel.name || !newModel.style_id) return;
    setCreating(true);
    try {
      const payload = { ...newModel, type: group.type, category: group.category };
      const res = await apiFetch('/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setNewModel(EMPTY_FORM);
        setShowAddForm(null);
        fetchModels();
        showToast('Modelo criado com sucesso!');
      } else {
        showToast(data.message || 'Erro ao criar modelo.', 'error');
      }
    } catch {
      showToast('Erro de ligação.', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-2 border-[#FFB800]/30 border-t-[#FFB800] rounded-full animate-spin" />
        <p className="text-text-tertiary text-xs font-black uppercase tracking-widest">Sincronizando Motores de IA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm font-bold">{toast.text}</span>
        </div>
      )}

      {/* Global Configs */}
      <div className="bg-surface/60 border border-[#FFB800]/20 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-xl mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800]">
              <Zap size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Definições Globais de IA</h2>
              <p className="text-text-tertiary text-xs font-bold uppercase tracking-widest mt-1">Surcharges e comportamentos globais</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            <div className="bg-bg-base/80 border border-white/5 px-6 py-4 rounded-3xl flex items-center gap-4">
              <div>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Taxa de Composição</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#FFB800]">+</span>
                  <input 
                    type="number"
                    value={globalSurcharge}
                    onChange={(e) => setGlobalSurcharge(Number(e.target.value))}
                    onBlur={() => handleUpdateGlobalSurcharge()}
                    className="w-12 bg-transparent border-b border-[#FFB800]/30 text-xl font-black text-white focus:outline-none focus:border-[#FFB800] transition-colors"
                  />
                  <Zap size={16} className="text-[#FFB800]" />
                </div>
              </div>
              {updatingSurcharge && <RefreshCw size={16} className="animate-spin text-text-tertiary" />}
            </div>

            <button
              onClick={handleCleanupStyles}
              disabled={cleaningUp}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {cleaningUp ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Limpar Cache Estilos
            </button>
          </div>
        </div>
      </div>

      {/* Group List Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-3">
             Motores e Agentes Específicos
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">
            Gere os cores e modelos ativos. Defina o custo base para cada um.
          </p>
        </div>
      </div>

      {/* Groups */}
      {GROUPS.map(group => {
        const groupModels = models.filter(m => m.type === group.type && m.category === group.category);
        const isAddingHere = showAddForm === group.key;

        return (
          <section key={group.key} className="bg-surface/40 border border-white/5 rounded-[2.5rem] p-8 shadow-sm">
            {/* Group header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${group.color}`}>
                  {group.icon}
                </div>
                <div>
                  <h2 className="text-lg font-black text-text-primary uppercase tracking-wide">{group.label}</h2>
                  <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">{groupModels.length} configurados</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(isAddingHere ? null : group.key);
                  setNewModel({ ...EMPTY_FORM, type: group.type, category: group.category });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isAddingHere ? 'bg-white/10 text-text-secondary' : 'bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] hover:bg-[#FFB800]/20'}`}
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {/* Add Form */}
            {isAddingHere && (
              <form onSubmit={(e) => handleCreate(e, group)} className="mb-6 p-6 bg-bg-base/60 rounded-2xl border border-[#FFB800]/20 flex flex-wrap gap-4 items-end animate-in slide-in-from-top-2 duration-300">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Nome</label>
                  <input
                    type="text"
                    placeholder="Ex: UGC RealisticLife"
                    className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm font-bold text-text-primary outline-none focus:border-[#FFB800]/50"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Style ID</label>
                  <input
                    type="text"
                    placeholder="Ex: ugc-realistic"
                    className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm font-bold text-text-primary outline-none focus:border-[#FFB800]/50"
                    value={newModel.style_id}
                    onChange={(e) => setNewModel({ ...newModel, style_id: e.target.value })}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Créditos</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FFB800]" size={14} />
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-surface border border-border-subtle rounded-xl p-3 pl-9 text-sm font-black text-[#FFB800] outline-none focus:border-[#FFB800]/50"
                      value={newModel.credit_cost}
                      onChange={(e) => setNewModel({ ...newModel, credit_cost: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-[46px] px-6 bg-[#FFB800] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar
                </button>
              </form>
            )}

            {/* Models Grid */}
            {groupModels.length === 0 ? (
              <div className="py-10 text-center text-text-tertiary text-sm italic border border-dashed border-border-subtle rounded-2xl">
                Nenhum {group.category === 'core' ? 'core' : 'modelo'} configurado nesta categoria.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupModels.map(model => (
                  <div
                    key={model.id}
                    className={`relative p-5 rounded-2xl border transition-all ${model.is_active ? 'border-white/8 bg-white/[0.02]' : 'border-red-500/20 bg-red-500/5 opacity-60'}`}
                  >
                    {/* Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${group.color}`}>
                          {group.category}
                        </span>
                        <h4 className="text-base font-black text-text-primary mt-2 leading-tight">{model.name}</h4>
                        <code className="text-[9px] text-text-tertiary font-mono">{model.style_id}</code>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleActive(model)}
                          title={model.is_active ? 'Desativar' : 'Ativar'}
                          className={`p-1.5 rounded-lg transition-colors ${model.is_active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-text-tertiary hover:bg-white/5'}`}
                        >
                          {model.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, id: model.id })}
                          className="p-1.5 text-text-tertiary hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Credit Cost Inline Editor */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Custo / Cr.</span>
                        <div className="flex items-center gap-1 bg-bg-base border border-border-subtle rounded-xl px-3 py-1.5">
                          <input
                            type="number"
                            min="0"
                            className="w-10 bg-transparent text-xs font-black text-[#FFB800] text-center outline-none"
                            value={model.credit_cost}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setModels(prev => prev.map(m => m.id === model.id ? { ...m, credit_cost: v } : m));
                            }}
                            onBlur={(e) => handleUpdateCost(model, Number(e.target.value))}
                          />
                          <Zap size={11} className="text-[#FFB800]" />
                          {saving[model.id] && <RefreshCw size={10} className="animate-spin text-text-tertiary ml-1" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        title="Eliminar Motor de IA"
        message="Tem certeza que deseja eliminar este modelo permanentemente? Esta ação não pode ser revertida."
        confirmLabel="Eliminar Definitivamente"
        type="error"
        onConfirm={() => deleteModal.id && handleDelete(deleteModal.id)}
        onCancel={() => setDeleteModal({ open: false, id: null })}
      />
    </div>
  );
}
