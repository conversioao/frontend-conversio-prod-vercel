import React, { useState, useEffect } from 'react';
import { 
  Box, Save, Trash2, Plus, Zap, RefreshCw, 
  Video, Mic, Share2, Check, X, Search, Filter, AlertCircle,
  TrendingUp, CircleDollarSign, Wallet, Gauge, PiggyBank, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface Package {
  id: number;
  name: string;
  credits: number;
  price: number;
  is_active: boolean;
  bonus_credits?: number;
  est_images?: number;
  est_videos?: number;
  est_music?: number;
  est_narration?: number;
}


interface AIModel {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  style_id: string;
  credit_cost: number;
  kie_cost?: number;
  is_active: boolean;
  category: string;
}

export function AdminPlans() {
  const [activeTab, setActiveTab] = useState<'packages' | 'models'>('packages');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [data, setData] = useState<{
    packages: Package[];
    models: AIModel[];
  }>({
    packages: [],
    models: []
  });
  const [kieStats, setKieStats] = useState<{
    balance: number;
    dollarBalance: number;
    kwanzaBalance: number;
    totalConsumption: number;
    totalEarnings: number;
    margin: number;
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<any>({});
  
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  const userStr = localStorage.getItem('conversio_user');
  const adminId = userStr ? JSON.parse(userStr).id : null;

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab;
      const apiUrl = `/admin/${endpoint}?adminId=${adminId}`;
      
      const response = await apiFetch(apiUrl);
      const result = await response.json();
      
      if (result.success) {
        // Map backend response key (packages, models) to local state key
        const dataKey = activeTab === 'packages' ? 'packages' : 'models';
        setData(prev => ({ 
          ...prev, 
          [activeTab]: result[dataKey] || [] 
        }));
      } else {
        setModal({
          isOpen: true,
          title: 'Erro de Dados',
          message: result.message || 'Falha ao carregar informações da base de dados.',
          type: 'error'
        });
      }

      if (activeTab === 'models') {
        const statsRes = await apiFetch('/admin/kie/stats');
        const statsData = await statsRes.json();
        if (statsData.success) setKieStats(statsData.stats);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocalState = (id: string | number, field: string, value: any, type: 'packages' | 'models') => {
    setData(prev => {
      const newData = {
        ...prev,
        [type]: prev[type].map((item: any) => 
          item.id === id ? { ...item, [field]: value } : item
        )
      };
      
      // Auto-save logic for packages
      if (type === 'packages') {
        const item = newData.packages.find(p => p.id === id);
        if (item) debouncedSave(item, 'packages');
      }
      
      return newData;
    });
  };

  // Debounce saving to avoid too many requests
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const debouncedSave = (item: any, type: 'packages' | 'models') => {
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(() => {
      handleUpdate(item, type);
    }, 1000); // 1 second debounce
    setSaveTimeout(timeout);
  };

  const handleUpdate = async (item: any, type: 'packages' | 'models') => {
    setSavingId(item.id);
    try {
      const response = await apiFetch(`/admin/${type}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, adminId })
      });
      const result = await response.json();
      if (!result.success) {
        setModal({
          isOpen: true,
          title: 'Erro de Atualização',
          message: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor para atualizar o item.',
        type: 'error'
      });
    } finally {
      setTimeout(() => setSavingId(null), 500);
    }
  };

  const handleAdd = async () => {
    try {
      const response = await apiFetch(`/admin/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, adminId })
      });
      const result = await response.json();
      if (!result.success) {
        setModal({
          isOpen: true,
          title: 'Erro ao Adicionar',
          message: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Erro de Rede',
        message: 'Falha ao criar novo item na base de dados.',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: string | number, type: 'packages' | 'models') => {
    setModal({
      isOpen: true,
      title: 'Eliminar Item',
      message: 'Tem certeza que deseja eliminar este item permanentemente? Esta ação não pode ser revertida.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await apiFetch(`/admin/${type}/${id}?adminId=${adminId}`, {
            method: 'DELETE'
          });
          const result = await response.json();
          if (result.success) {
            fetchData();
            setModal(prev => ({ ...prev, isOpen: false }));
          } else {
            setModal({
              isOpen: true,
              title: 'Erro ao Eliminar',
              message: result.message,
              type: 'error'
            });
          }
        } catch (error) {
          setModal({
            isOpen: true,
            title: 'Erro de Conexão',
            message: 'Erro ao tentar eliminar o item.',
            type: 'error'
          });
        }
      }
    });
  };

  const syncDatabase = async () => {
    setModal({
      isOpen: true,
      title: 'Sincronizar Base de Dados',
      message: 'Isto irá recriar as tabelas base e inserir dados padrão se estiverem vazias. Deseja continuar?',
      type: 'confirm',
      onConfirm: async () => {
        setLoading(true);
        try {
          const resp = await apiFetch(`/admin/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId })
          });
          const res = await resp.json();
          setModal({
            isOpen: true,
            title: 'Sincronização',
            message: res.message,
            type: res.success ? 'success' : 'error'
          });
          fetchData();
        } catch (e) {
          setModal({
            isOpen: true,
            title: 'Erro de Sincronização',
            message: 'Não foi possível completar a configuração da base de dados.',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };
  const renderModelCard = (model: AIModel) => (
                  <div key={model.id} className="bg-surface border border-border-subtle rounded-3xl p-6 space-y-4 hover:border-[#FFB800]/50 transition-all relative overflow-hidden group">
                     {savingId === model.id && (
                        <div className="absolute inset-0 bg-bg-base/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                           <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-border-subtle shadow-xl">
                              <RefreshCw size={16} className="animate-spin text-[#FFB800]" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">A gravar...</span>
                           </div>
                        </div>
                     )}
                     <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          model.type === 'image' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                          model.type === 'video' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                           {model.type}
                        </span>
                        <span className="text-[9px] font-bold text-text-tertiary">ID Interno: {model.id}</span>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-text-tertiary uppercase mb-1">Nome do Modelo/Estilo</p>
                        <input 
                          className="bg-bg-base/50 p-2 rounded-lg border border-border-subtle text-lg font-black text-text-primary focus:border-[#FFB800] w-full" 
                          value={model.name} 
                          onChange={(e) => updateLocalState(model.id, 'name', e.target.value, 'models')} 
                        />
                        <div className="flex items-center justify-between mt-2">
                           <p className="text-[10px] text-text-tertiary font-medium italic">Style ID: <span className="text-white not-italic">{model.style_id}</span></p>
                           <p className="text-[10px] text-text-tertiary font-black uppercase">{model.category}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        <div className="flex items-center gap-4">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-text-tertiary uppercase mb-1">Custo Cliente</span>
                              <div className="flex items-center gap-1.5 bg-bg-base/50 px-3 py-1.5 rounded-xl border border-border-subtle">
                                 <Zap size={12} className="text-[#FFB800]" />
                                 <input type="number" className="bg-transparent font-black w-10 text-xs focus:outline-none text-text-primary" value={model.credit_cost} onChange={(e) => updateLocalState(model.id, 'credit_cost', e.target.value, 'models')} />
                              </div>
                           </div>
                           {model.category === 'model' && (
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-blue-500 uppercase mb-1">Custo Kie.ai</span>
                                 <div className="flex items-center gap-1.5 bg-bg-base/50 px-3 py-1.5 rounded-xl border border-blue-500/30">
                                    <Zap size={12} className="text-blue-500" />
                                    <input type="number" step="0.01" className="bg-transparent font-black w-12 text-xs focus:outline-none text-text-primary" value={model.kie_cost || 0} onChange={(e) => updateLocalState(model.id, 'kie_cost', e.target.value, 'models')} />
                                 </div>
                              </div>
                           )}
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleUpdate(model, 'models')} 
                             disabled={savingId === model.id}
                             className="p-3 bg-[#FFB800] text-black hover:bg-yellow-400 rounded-xl transition-all shadow-lg shadow-[#FFB800]/10"
                           >
                              <Save size={18} />
                           </button>
                           <button 
                             onClick={() => updateLocalState(model.id, 'is_active', !model.is_active, 'models')} 
                             className={`p-3 rounded-xl transition-all border ${model.is_active ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-text-tertiary bg-bg-base border-border-subtle opacity-50'}`}
                           >
                              {model.is_active ? <Check size={18} /> : <X size={18} />}
                           </button>
                           <button onClick={() => handleDelete(model.id, 'models')} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"><Trash2 size={18} /></button>
                        </div>
                     </div>
                  </div>
  );

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-3">
            <Box className="text-[#FFB800]" size={40} />
            Centro de Gestão Logística
          </h1>
          <p className="text-text-secondary mt-2 font-medium">Configura pacotes de créditos e motores de IA em tempo real.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={syncDatabase}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl font-black uppercase text-xs hover:bg-blue-500 hover:text-white transition-all"
          >
            <RefreshCw size={16} /> Sincronizar DB
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-8 py-3 bg-[#FFB800] text-black rounded-2xl font-black uppercase text-xs hover:scale-105 transition-all shadow-xl shadow-[#FFB800]/20"
          >
            <Plus size={18} /> Novo {activeTab === 'packages' ? 'Pacote' : 'Modelo'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-surface border border-border-subtle rounded-[2rem] w-fit">
        {[
          { id: 'packages', label: 'Pacotes Créditos', icon: <Zap size={18} /> },
          { id: 'models', label: 'IA & Motores', icon: <Box size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' 
                : 'text-text-tertiary hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-base/50 backdrop-blur-sm z-50 rounded-[3rem]">
            <div className="flex flex-col items-center gap-4">
               <RefreshCw size={48} className="animate-spin text-[#FFB800]" />
               <span className="text-xs font-black uppercase tracking-[0.3em] text-text-tertiary">Carregando Logística...</span>
            </div>
          </div>
        )}

        {!loading && data[activeTab].length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border-subtle border-dashed rounded-[3rem] text-center">
              <AlertCircle size={48} className="text-text-tertiary mb-4 opacity-20" />
              <p className="font-black text-text-tertiary uppercase tracking-widest">Nenhum item encontrado em {activeTab}</p>
              <p className="text-xs text-text-secondary">Usa o botão <span className="text-blue-500 font-bold">Sincronizar DB</span> acima para carregar as definições iniciais.</p>
            </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'packages' && (
            <motion.div key="packages" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                {data.packages.map(pkg => (
                  <div key={pkg.id} className="bg-surface border border-border-subtle rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
                     {savingId === pkg.id && (
                        <div className="absolute inset-0 bg-bg-base/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                           <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-border-subtle shadow-xl">
                              <RefreshCw size={16} className="animate-spin text-[#FFB800]" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">A gravar...</span>
                           </div>
                        </div>
                     )}
                     <div className="w-12 h-12 bg-bg-base rounded-2xl flex items-center justify-center text-[#FFB800] border border-border-subtle group-hover:scale-110 transition-transform shrink-0"><Zap size={24} /></div>
                     <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                         <div>
                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Título do Pacote</p>
                            <input className="bg-bg-base/50 p-2 rounded-lg border border-border-subtle w-full font-bold text-sm focus:border-[#FFB800]" value={pkg.name} onChange={(e) => updateLocalState(pkg.id, 'name', e.target.value, 'packages')} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Créditos Base</p>
                            <input type="number" className="bg-bg-base/50 p-2 rounded-lg border border-border-subtle w-full font-bold text-sm" value={pkg.credits} onChange={(e) => updateLocalState(pkg.id, 'credits', e.target.value, 'packages')} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Bónus Créditos</p>
                            <input type="number" className="bg-bg-base/50 p-2 rounded-lg border border-border-subtle w-full font-bold text-sm text-emerald-400" value={pkg.bonus_credits || 0} onChange={(e) => updateLocalState(pkg.id, 'bonus_credits', e.target.value, 'packages')} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Preço Kz</p>
                            <input type="number" className="bg-bg-base/50 p-2 rounded-lg border border-border-subtle w-full font-bold text-sm text-[#FFB800]" value={pkg.price} onChange={(e) => updateLocalState(pkg.id, 'price', e.target.value, 'packages')} />
                         </div>
                         <div className="col-span-2 md:col-span-3 lg:col-span-2">
                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Estimativas de Geração</p>
                            <div className="grid grid-cols-4 gap-2">
                               <div>
                                  <p className="text-[8px] text-text-tertiary mb-0.5">🖼 Imgs</p>
                                  <input type="number" className="bg-bg-base/50 p-1.5 rounded-lg border border-border-subtle w-full font-bold text-xs text-blue-400" value={pkg.est_images || 0} onChange={(e) => updateLocalState(pkg.id, 'est_images', e.target.value, 'packages')} />
                               </div>
                               <div>
                                  <p className="text-[8px] text-text-tertiary mb-0.5">🎬 Vídeos</p>
                                  <input type="number" className="bg-bg-base/50 p-1.5 rounded-lg border border-border-subtle w-full font-bold text-xs text-purple-400" value={pkg.est_videos || 0} onChange={(e) => updateLocalState(pkg.id, 'est_videos', e.target.value, 'packages')} />
                               </div>
                               <div>
                                  <p className="text-[8px] text-text-tertiary mb-0.5">🎵 Música</p>
                                  <input type="number" className="bg-bg-base/50 p-1.5 rounded-lg border border-border-subtle w-full font-bold text-xs text-emerald-400" value={pkg.est_music || 0} onChange={(e) => updateLocalState(pkg.id, 'est_music', e.target.value, 'packages')} />
                               </div>
                               <div>
                                  <p className="text-[8px] text-text-tertiary mb-0.5">🎙 Narração</p>
                                  <input type="number" className="bg-bg-base/50 p-1.5 rounded-lg border border-border-subtle w-full font-bold text-xs text-orange-400" value={pkg.est_narration || 0} onChange={(e) => updateLocalState(pkg.id, 'est_narration', e.target.value, 'packages')} />
                               </div>
                            </div>
                         </div>
                      </div>
                     <div className="flex items-center gap-4">
                        <button onClick={() => updateLocalState(pkg.id, 'is_active', !pkg.is_active, 'packages')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${pkg.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                           {pkg.is_active ? 'Ativo' : 'Pausado'}
                        </button>
                        <div className="flex gap-2">
                           <button onClick={() => handleUpdate(pkg, 'packages')} disabled={savingId === pkg.id} className="p-3 bg-[#FFB800] text-black rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-[#FFB800]/20"><Save size={18} /></button>
                           <button onClick={() => handleDelete(pkg.id, 'packages')} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"><Trash2 size={18} /></button>
                        </div>
                     </div>
                  </div>
                ))}
            </motion.div>
          )}


          {activeTab === 'models' && (
            <motion.div key="models" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                
                {/* FINANCIAL HUD */}
                {kieStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                     <div className="bg-gradient-to-br from-bg-base to-surface border border-border-subtle rounded-[2.5rem] p-6 shadow-sm group hover:border-[#FFB800]/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                           <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                              <Wallet size={20} />
                           </div>
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-2 py-1 rounded-lg">Live Budget</span>
                        </div>
                        <p className="text-text-tertiary text-xs font-bold uppercase tracking-widest mb-1">Saldo KIE.AI</p>
                        <h3 className="text-2xl font-black text-text-primary tracking-tighter mb-2">
                           {kieStats.balance.toLocaleString()} <span className="text-xs text-text-tertiary">credits</span>
                        </h3>
                        <div className="flex items-center gap-3 border-t border-border-subtle/30 pt-3 mt-3">
                           <div className="flex flex-col">
                              <span className="text-[10px] text-text-tertiary font-bold uppercase">Dólares</span>
                              <span className="text-sm font-black text-[#FFB800] tracking-tighter">${kieStats.dollarBalance.toFixed(2)}</span>
                           </div>
                           <div className="w-px h-6 bg-border-subtle/30"></div>
                           <div className="flex flex-col">
                              <span className="text-[10px] text-text-tertiary font-bold uppercase">Kwanzas</span>
                              <span className="text-sm font-black text-emerald-500 tracking-tighter">{kieStats.kwanzaBalance.toLocaleString()} Kz</span>
                           </div>
                        </div>
                     </div>

                     <div className="bg-gradient-to-br from-bg-base to-surface border border-border-subtle rounded-[2.5rem] p-6 shadow-sm group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                           <div className="p-3 bg-[#FFB800]/10 rounded-2xl text-[#FFB800]">
                              <Gauge size={20} />
                           </div>
                           <span className="text-[10px] font-black text-text-tertiary uppercase tracking-tighter bg-bg-base px-2 py-1 rounded-lg">Consumption</span>
                        </div>
                        <p className="text-text-tertiary text-xs font-bold uppercase tracking-widest mb-1">Consumo Total</p>
                        <h3 className="text-2xl font-black text-text-primary tracking-tighter">
                           {kieStats.totalConsumption.toLocaleString()} <span className="text-xs text-text-tertiary">credits</span>
                        </h3>
                        <p className="text-[10px] text-text-tertiary mt-2 font-medium">Investimento acumulado em APIs KIE</p>
                     </div>

                     <div className="bg-gradient-to-br from-bg-base to-surface border border-border-subtle rounded-[2.5rem] p-6 shadow-sm group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                           <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                              <CircleDollarSign size={20} />
                           </div>
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-2 py-1 rounded-lg">Revenue</span>
                        </div>
                        <p className="text-text-tertiary text-xs font-bold uppercase tracking-widest mb-1">Faturação (Créditos)</p>
                        <h3 className="text-2xl font-black text-text-primary tracking-tighter">
                           {kieStats.totalEarnings.toLocaleString()} <span className="text-xs text-text-tertiary">credits</span>
                        </h3>
                        <p className="text-[10px] text-text-tertiary mt-2 font-medium">Retorno bruto em conversão de usuários</p>
                     </div>

                     <div className="bg-[#FFB800] border-0 rounded-[2.5rem] p-6 shadow-2xl shadow-[#FFB800]/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                           <div className="p-3 bg-black/10 rounded-2xl text-black">
                              <TrendingUp size={20} />
                           </div>
                           <span className="text-[10px] font-bold text-black uppercase tracking-tighter bg-white/20 px-2 py-1 rounded-lg">Net Profit</span>
                        </div>
                        <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Margem Luctrativa</p>
                        <h3 className="text-2xl font-black text-black tracking-tighter relative z-10">
                           {kieStats.margin.toLocaleString()} <span className="text-[10px] uppercase font-bold text-black/40">credits profit</span>
                        </h3>
                        <div className="mt-4 flex items-center gap-2 relative z-10">
                           <div className="h-1.5 flex-1 bg-black/10 rounded-full overflow-hidden">
                              <div className="h-full bg-black rounded-full" style={{ width: `${Math.min(100, (kieStats.margin / kieStats.totalEarnings) * 100 || 0)}%` }}></div>
                           </div>
                           <span className="text-[10px] font-black text-black">
                              {((kieStats.margin / kieStats.totalEarnings) * 100 || 0).toFixed(0)}%
                           </span>
                        </div>
                     </div>
                  </div>
                )}

                <div className="space-y-4">
                   <h4 className="text-xl font-bold text-white uppercase tracking-widest pl-2 border-l-4 border-emerald-500">Agentes / Cores</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {data.models.filter(m => m.category === 'core').map(renderModelCard)}
                   </div>
                   
                   <h4 className="text-xl font-bold text-white mt-12 uppercase tracking-widest pl-2 border-l-4 border-blue-500">Modelos Base</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {data.models.filter(m => m.category === 'model').map(renderModelCard)}
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-border-subtle rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black text-text-primary uppercase tracking-wider">Novo {activeTab === 'packages' ? 'Pacote' : 'Modelo'}</h2>
                 <button onClick={() => setShowAddModal(false)} className="text-text-tertiary hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                 {activeTab === 'packages' && (
                    <>
                       <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Título do Pacote</label><input className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Créditos Base</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white" value={newItem.credits || 0} onChange={e => setNewItem({...newItem, credits: e.target.value})} /></div>
                          <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Bónus (Créditos)</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white text-emerald-400" value={newItem.bonus_credits || 0} onChange={e => setNewItem({...newItem, bonus_credits: e.target.value})} /></div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Preço (Kz)</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white text-[#FFB800]" value={newItem.price || 0} onChange={e => setNewItem({...newItem, price: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-2">
                             <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Imgs</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white text-blue-400" value={newItem.est_images || 0} onChange={e => setNewItem({...newItem, est_images: e.target.value})} /></div>
                             <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Vids</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white text-purple-400" value={newItem.est_videos || 0} onChange={e => setNewItem({...newItem, est_videos: e.target.value})} /></div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Música</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white text-emerald-400" value={newItem.est_music || 0} onChange={e => setNewItem({...newItem, est_music: e.target.value})} /></div>
                          <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Voz</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white text-orange-400" value={newItem.est_narration || 0} onChange={e => setNewItem({...newItem, est_narration: e.target.value})} /></div>
                       </div>
                    </>
                 )}

                 {activeTab === 'models' && (
                    <>
                       <div>
                          <label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Tipo de Motor</label>
                          <select className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white" value={newItem.type || 'image'} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                             <option value="image">Imagem</option>
                             <option value="video">Vídeo</option>
                             <option value="audio">Áudio/Música</option>
                          </select>
                       </div>
                       <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Nome do Modelo</label><input className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} /></div>
                       <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Style ID (n8n integration)</label><input className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white" value={newItem.style_id || ''} onChange={e => setNewItem({...newItem, style_id: e.target.value})} /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Categoria</label>
                             <select className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white" value={newItem.category || 'model'} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                <option value="model">Modelo Base</option>
                                <option value="style">Estilo / Core</option>
                                <option value="core">Motor Nativo</option>
                             </select>
                          </div>
                          <div><label className="text-[10px] font-black uppercase text-text-tertiary mb-2 block">Custo Cliente (Créditos)</label><input type="number" className="bg-bg-base p-4 rounded-2xl w-full border border-border-subtle text-white text-[#FFB800]" value={newItem.credit_cost || 1} onChange={e => setNewItem({...newItem, credit_cost: e.target.value})} /></div>
                          <div><label className="text-[10px] font-black uppercase text-blue-500 mb-2 block">Custo Kie.ai (Créditos)</label><input type="number" step="0.01" className="bg-bg-base p-4 rounded-2xl w-full border border-blue-500/30 text-white" value={newItem.kie_cost || 0} onChange={e => setNewItem({...newItem, kie_cost: e.target.value})} /></div>
                       </div>
                    </>
                 )}

                 <button 
                   onClick={handleAdd}
                   className="w-full py-5 mt-4 bg-[#FFB800] text-black font-black uppercase tracking-widest text-sm rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                 >
                    Confirmar e Publicar
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      <div className="p-10 bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-[3rem] flex flex-col md:flex-row items-center gap-8">
         <div className="w-16 h-16 rounded-3xl bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center shrink-0">
            <Box size={32} />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-text-primary mb-2">Engenharia de Expansão</h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
              Este painel liga diretamente aos seletores do utilizador final. Novos modelos e pacotes aparecem instantaneamente no Gerador e na Landing Page. 
              Garante que os `Style IDs` coincidem com as configurações do teu workflow n8n para evitar erros de geração.
            </p>
         </div>
      </div>
    </div>

    <ConfirmationModal 
      isOpen={modal.isOpen}
      title={modal.title}
      message={modal.message}
      type={modal.type}
      onConfirm={() => {
        if (modal.onConfirm) modal.onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      }}
      onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  );
}
