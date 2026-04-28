import React, { useEffect, useState } from 'react';
import { Settings, Globe, Database, HardDrive, ShieldCheck, Cpu, RefreshCw, Copy, ExternalLink, Zap, X, Edit2, Check, Save, Box, Layers, Bot, CreditCard, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export function AdminSettings() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
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

  const mkEmptyKey = (provider: string, name: string, priority: number) =>
    ({ provider, name, key_secret: '', status: 'working', priority, last_error: null, updated_at: '' });

  const [openai1, setOpenai1] = useState(mkEmptyKey('openai', 'Principal', 1));
  const [openai2, setOpenai2] = useState(mkEmptyKey('openai', 'Redundante', 2));
  const [kie1, setKie1] = useState(mkEmptyKey('kie', 'Principal', 1));
  const [kie2, setKie2] = useState(mkEmptyKey('kie', 'Secundária', 2));
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const [resConfig, resKeys] = await Promise.all([
        api.get(`/admin/config?adminId=${adminId}`),
        api.get(`/admin/config/keys`)
      ]);
      const data = await resConfig.json();
      const keysData = await resKeys.json();
      
      if (data.success) {
        setConfig(data.config);
      }
      
      if (keysData.success) {
        const keys = keysData.keys || [];
        const find = (p: string, n: string) => keys.find((k: any) => k.provider === p && k.name === n);
        if (find('openai', 'Principal')) setOpenai1(find('openai', 'Principal')!);
        if (find('openai', 'Redundante')) setOpenai2(find('openai', 'Redundante')!);
        if (find('kie', 'Principal')) setKie1(find('kie', 'Principal')!);
        if (find('kie', 'Secundária')) setKie2(find('kie', 'Secundária')!);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveKey = async (key: any, slotId: string) => {
    if (!key.key_secret) return alert('Insira a chave antes de salvar.');
    setSavingKey(slotId);
    try {
      const res = await api.post(`/admin/config/keys`, { 
        provider: key.provider, name: key.name, key_secret: key.key_secret, priority: key.priority 
      });
      const d = await res.json();
      if (!d.success) alert('Erro: ' + d.message);
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setSavingKey(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    // Flat map the section data for the form
    const formData: any = {};
    if (section === 'storage') {
      formData.storage_bucket = config.storage?.bucket;
      formData.storage_region = config.storage?.region;
      formData.storage_endpoint = config.storage?.endpoint;
      formData.storage_access_key = config.storage?.access_key;
      formData.storage_secret_key = config.storage?.secret_key;
      formData.storage_quota_gb = config.storage?.quota_gb || 100;
    } else if (section === 'database') {
      formData.db_host = config.database.host;
      formData.db_user = config.database.user;
      formData.db_port = config.database.port;
      formData.db_name = config.database.name;
    } else if (section === 'ai_agent') {
      formData.marketing_agent_prompt = config.ai_agent?.marketing_agent_prompt;
      formData.openai_api_key = config.ai_agent?.openai_api_key;
      formData.kie_ai_api_key = config.ai_agent?.kie_ai_api_key;
    } else if (section === 'financial') {
      formData.financial_initial_credits = config.financial?.initial_credits;
      formData.financial_beneficiary_name = config.financial?.beneficiary_name;
      formData.financial_bank_accounts = JSON.stringify(config.financial?.bank_accounts || []);
      formData.financial_mcx_express = JSON.stringify(config.financial?.mcx_express || []);
    }
    setEditForm(formData);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await api.post(`/admin/config`, { adminId, settings: editForm });
      const data = await res.json();
      if (data.success) {
        setEditingSection(null);
        await fetchConfig();
        setModal({
          isOpen: true,
          title: 'Sucesso',
          message: data.message || 'Configurações guardadas com sucesso.',
          type: 'success'
        });
      }
    } catch (err) {
      console.error(err);
      setModal({
        isOpen: true,
        title: 'Erro de Rede',
        message: 'Não foi possível conectar ao servidor de configurações.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const runSetup = async () => {
    setModal({
      isOpen: true,
      title: 'Executar Manutenção DB',
      message: 'Tem certeza que deseja executar a migração do banco de dados? Isso recriará as tabelas se não existirem.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
          const res = await api.post(`/admin/setup`, { adminId });
          const data = await res.json();
          if (data.success) {
            setModal({
              isOpen: true,
              title: 'Sucesso',
              message: 'Base de dados atualizada com sucesso!',
              type: 'success'
            });
            fetchConfig();
          } else {
            setModal({
              isOpen: true,
              title: 'Erro no Setup',
              message: data.message,
              type: 'error'
            });
          }
        } catch (err) {
          console.error(err);
          setModal({
            isOpen: true,
            title: 'Erro de Conexão',
            message: 'Falha ao conectar com o serviço de manutenção.',
            type: 'error'
          });
        }
      }
    });
  };

  if (loading && !config) return <div className="p-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-widest">Acedendo ao motor do sistema...</div>;

  const ConfigCard = ({ title, icon, section, children, badge }: any) => (
    <div className="bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm group hover:border-[#FFB800]/30 transition-all flex flex-col h-full">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center text-text-tertiary group-hover:text-[#FFB800] transition-colors">
                {icon}
             </div>
             <h3 className="font-black text-text-primary tracking-tight text-lg uppercase tracking-wider">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {badge && (
               <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 shadow-sm mr-2">
                  {badge}
               </span>
            )}
            {section && (
              <button 
                onClick={() => editingSection === section ? saveSettings() : startEditing(section)}
                className={`p-2 rounded-xl transition-all ${editingSection === section ? 'bg-emerald-500 text-black' : 'bg-bg-base text-text-tertiary hover:text-[#FFB800] hover:border-[#FFB800]/50 border border-border-subtle'}`}
                disabled={saving}
              >
                {editingSection === section ? (saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />) : <Edit2 size={16} />}
              </button>
            )}
          </div>
       </div>
       <div className="space-y-4 flex-grow">
          {children}
       </div>
       {editingSection === section && (
         <div className="mt-6 pt-6 border-t border-border-subtle flex gap-3">
            <button 
              onClick={() => setEditingSection(null)}
              className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-red-500 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={saveSettings}
              disabled={saving}
              className="flex-1 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              Confirmar Alterações
            </button>
         </div>
       )}
    </div>
  );

  const SettingRow = ({ label, value, field, isCopyable = false, isSecret = false }: any) => {
    const isEditing = editingSection !== null && field in editForm;

    if (isEditing) {
      return (
        <div className="flex flex-col gap-1.5 p-4 bg-bg-base rounded-2xl border border-[#FFB800]/30 transition-all">
           <label className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest">{label}</label>
           <input 
             type={isSecret ? "text" : "text"} 
             value={editForm[field] || ''}
             onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
             className="bg-transparent border-none p-0 text-xs font-bold text-text-primary focus:ring-0 placeholder-text-tertiary w-full"
             placeholder={`Introduzir ${label}...`}
           />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5 p-4 bg-bg-base/50 rounded-2xl border border-border-subtle/50 group/row">
         <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{label}</p>
         <div className="flex items-center justify-between gap-4">
            <code className={`text-xs font-bold ${isSecret && !copiedField ? 'blur-sm select-none hover:blur-none transition-all' : 'text-text-primary'} truncate`}>
               {value || 'Não configurado'}
            </code>
            {isCopyable && value && (
               <button 
                 onClick={() => copyToClipboard(value, label)}
                 className={`p-2 rounded-lg transition-all ${copiedField === label ? 'text-emerald-500' : 'text-text-tertiary hover:text-[#FFB800] hover:bg-surface'}`}
               >
                  {copiedField === label ? <ShieldCheck size={14} /> : <Copy size={14} />}
               </button>
            )}
         </div>
      </div>
    );
  };

  const KeySlot = ({ k, setK, label, badge, slotId }: { k: any; setK: (v: any) => void; label: string; badge: string; slotId: string }) => {
    const visible = showKeys[slotId];
    const isWorking = k.status === 'working' || !k.last_error;
    return (
      <div className="border border-border-subtle rounded-2xl p-5 space-y-3 hover:border-[#FFB800]/30 transition-colors bg-bg-base/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${badge === '1' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'bg-surface text-text-tertiary'}`}>
              #{badge}
            </span>
            <span className="text-xs font-bold text-text-primary uppercase tracking-widest">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {k.key_secret && (
              <span className={`text-[9px] font-bold flex items-center gap-1 ${isWorking ? 'text-emerald-500' : 'text-red-400'}`}>
                {isWorking ? <Check size={10} /> : <X size={10} />}
                {isWorking ? 'OK' : 'FALHA'}
              </span>
            )}
            <button onClick={() => setShowKeys(s => ({ ...s, [slotId]: !s[slotId] }))} className="text-text-tertiary hover:text-text-primary transition-colors">
              {visible ? "Esconder" : "Ver"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-2.5 border border-border-subtle">
          <Zap size={12} className="text-text-tertiary shrink-0" />
          <input
            type={visible ? 'text' : 'password'}
            value={k.key_secret}
            onChange={e => setK({ ...k, key_secret: e.target.value })}
            placeholder={k.provider === 'openai' ? 'sk-proj-...' : 'chave kie.ai...'}
            className="flex-1 bg-transparent text-xs font-mono text-text-primary outline-none placeholder-text-tertiary w-full"
          />
        </div>
        <button
          onClick={() => saveKey(k, slotId)}
          disabled={savingKey === slotId}
          className="w-full h-9 bg-surface hover:bg-surface-hover border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all flex items-center justify-center gap-2"
        >
          {savingKey === slotId ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
          {savingKey === slotId ? 'A guardar...' : 'Salvar'}
        </button>
      </div>
    );
  };

  return (
    <>
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Configurações do Sistema</h1>
          <p className="text-text-secondary text-sm font-medium">Motor técnico e infraestrutura do SaaS.</p>
        </div>
        <button 
          onClick={fetchConfig}
          className="flex items-center gap-2 px-6 py-3 bg-surface border border-border-subtle rounded-2xl text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/50 transition-all font-bold text-sm shadow-sm"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Sincronizar Nodes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Infraestrutura Operacional (API Keys) */}
         <ConfigCard title="Infraestrutura Operacional" icon={<Cpu size={24} />} badge="Chaves Ativadas">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Zap size={13} className="text-emerald-500" /></div>
                <p className="text-xs font-black uppercase tracking-widest text-text-primary">OpenAI</p>
              </div>
              <KeySlot k={openai1} setK={setOpenai1} label="Slot Principal" badge="1" slotId="oi1" />
              <KeySlot k={openai2} setK={setOpenai2} label="Slot Redundante" badge="2" slotId="oi2" />
            </div>
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center"><Zap size={13} className="text-blue-500" /></div>
                <p className="text-xs font-black uppercase tracking-widest text-text-primary">Kie.ai</p>
              </div>
              <KeySlot k={kie1} setK={setKie1} label="Slot Principal" badge="1" slotId="kie1" />
              <KeySlot k={kie2} setK={setKie2} label="Slot Secundário" badge="2" slotId="kie2" />
            </div>
         </ConfigCard>

         {/* Storage Section */}
         <ConfigCard title="Object Storage (S3/R2)" icon={<HardDrive size={24} />} badge="Contabo / R2" section="storage">
            <div className="grid grid-cols-2 gap-4">
              <SettingRow label="Bucket Name" value={config?.storage?.bucket} field="storage_bucket" />
              <SettingRow label="Região" value={config?.storage?.region} field="storage_region" />
            </div>
            <SettingRow label="Endpoint URL" value={config?.storage?.endpoint} field="storage_endpoint" />
            <SettingRow label="Access Key" value={config?.storage?.access_key} field="storage_access_key" isSecret isCopyable />
            <SettingRow label="Secret Key" value={config?.storage?.secret_key} field="storage_secret_key" isSecret isCopyable />
            <SettingRow label="Storage Quota (GB)" value={config?.storage?.quota_gb || 100} field="storage_quota_gb" />
         </ConfigCard>

         {/* Database Section */}
         <ConfigCard title="Base de Dados" icon={<Database size={24} />} badge={config?.system.db_status} section="database">
            <div className="flex items-center gap-4 p-4 bg-bg-base/50 rounded-2xl border border-border-subtle/50 mb-2">
               <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={20} />
               </div>
               <div>
                  <p className="text-xs font-bold text-text-primary">PostgreSQL Cluster</p>
                  <p className="text-[10px] text-text-tertiary">Conexão ativa em: <span className="text-emerald-500">{config?.database.host}:{config?.database.port}</span></p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SettingRow label="Host" value={config?.database.host} field="db_host" />
              <SettingRow label="Porta" value={config?.database.port} field="db_port" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SettingRow label="Utilizador" value={config?.database.user} field="db_user" />
              <SettingRow label="Base de Dados" value={config?.database.name} field="db_name" />
            </div>
         </ConfigCard>

         {/* AI Config Section */}
         <ConfigCard title="Agente IA (Especialista)" icon={<Bot size={24} />} badge="Motores IA Ativos" section="ai_agent">
            <SettingRow label="OpenAI API Key" value={config?.ai_agent?.openai_api_key} field="openai_api_key" isSecret isCopyable />
            <SettingRow label="KIE.ai API Key (Imagens/Suno)" value={config?.ai_agent?.kie_ai_api_key} field="kie_ai_api_key" isSecret isCopyable />
            {editingSection === 'ai_agent' ? (
              <div className="flex flex-col gap-1.5 p-4 bg-bg-base rounded-2xl border border-[#FFB800]/30 transition-all mt-4">
                <label className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest">System Prompt (Marketing Agent)</label>
                <textarea 
                  value={editForm.marketing_agent_prompt || ''}
                  onChange={(e) => setEditForm({ ...editForm, marketing_agent_prompt: e.target.value })}
                  className="bg-transparent border-none p-0 text-xs font-medium text-text-primary focus:ring-0 placeholder-text-tertiary w-full min-h-[120px] resize-y"
                  placeholder="Define o comportamento do Agente IA..."
                />
              </div>
            ) : (
               <div className="flex flex-col gap-1.5 p-4 bg-bg-base/50 rounded-2xl border border-border-subtle/50 mt-4">
                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">System Prompt Ativo</p>
                 <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">
                   {config?.ai_agent?.marketing_agent_prompt || 'Padrão do Sistema'}
                 </p>
               </div>
            )}
         </ConfigCard>

         {/* System Info */}
         <ConfigCard title="Core Engine" icon={<Cpu size={24} />}>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-bg-base/50 rounded-3xl border border-border-subtle flex flex-col items-center">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase mb-2">Build Version</p>
                  <p className="text-xl font-black text-text-primary">{config?.system.version}</p>
               </div>
               <div className="p-6 bg-bg-base/50 rounded-3xl border border-border-subtle flex flex-col items-center">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase mb-2">Node.js</p>
                  <p className="text-xl font-black text-text-primary">v20.x</p>
               </div>
            </div>
            <button 
              onClick={runSetup}
              className="w-full py-4 mt-2 bg-[#FFB800] text-black text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
               <Database size={16} /> Executar Manutenção DB
            </button>
            <button className="w-full py-4 mt-2 bg-surface border border-border-subtle text-text-secondary text-sm font-bold rounded-2xl hover:bg-surface-hover transition-all flex items-center justify-center gap-2">
               <ExternalLink size={16} /> Monitorizar Infrastrutura
            </button>
         </ConfigCard>

          {/* Logistics Summary (New Section) */}
          <ConfigCard title="Logística & Ofertas" icon={<Box size={24} />} badge="Gestão Ativa">
             <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-bg-base/30 border border-border-subtle rounded-2xl text-center">
                   <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Status</p>
                   <p className="text-lg font-black text-emerald-500">Online</p>
                </div>
                <div className="p-4 bg-bg-base/30 border border-border-subtle rounded-2xl text-center">
                   <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Pacotes</p>
                   <p className="text-lg font-black text-white">Disponíveis</p>
                </div>
                <div className="p-4 bg-bg-base/30 border border-border-subtle rounded-2xl text-center">
                   <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">IA Models</p>
                   <p className="text-lg font-black text-[#FFB800]">Multi-Core</p>
                </div>
             </div>
             <p className="text-[11px] text-text-secondary font-medium mt-2 px-1">
                A gestão de preços e créditos é feita no centro de logística dedicado.
             </p>
             <button 
               onClick={() => {
                 const event = new CustomEvent('conversio_navigate', { detail: 'admin-plans' });
                 window.dispatchEvent(event);
               }}
               className="w-full py-4 mt-4 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#FFB800] hover:text-black transition-all flex items-center justify-center gap-2"
             >
                <Layers size={16} /> Ir para Gestão de Pacotes
             </button>
          </ConfigCard>

          {/* Financial Section (NEW) */}
          <ConfigCard title="Financeiro & Pagamentos" icon={<CreditCard size={24} />} badge="Gestão de Receita" section="financial">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingRow label="Créditos Iniciais" value={config?.financial?.initial_credits} field="financial_initial_credits" />
                <SettingRow label="Nome do Beneficiário" value={config?.financial?.beneficiary_name} field="financial_beneficiary_name" />
             </div>
             
             <div className="space-y-4">
                <div className="flex flex-col gap-1.5 p-4 bg-bg-base/50 rounded-2xl border border-border-subtle/50">
                   <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Contas Bancárias (JSON)</p>
                   {editingSection === 'financial' ? (
                      <textarea 
                        value={editForm.financial_bank_accounts || '[]'}
                        onChange={(e) => setEditForm({ ...editForm, financial_bank_accounts: e.target.value })}
                        className="bg-transparent border-none p-0 text-xs font-medium text-text-primary focus:ring-0 placeholder-text-tertiary w-full min-h-[80px] font-mono"
                        placeholder='Exemplo: [{"bank": "BFA", "iban": "AO06.0006.0000.1234.5678.1012.3"}, {"bank": "BAI", "iban": "AO06.0040.0000.9876.5432.1012.3"}]'
                      />
                   ) : (
                       <div className="space-y-2">
                          {Array.isArray(config?.financial?.bank_accounts) && config.financial.bank_accounts.map((acc: any, i: number) => (
                             <div key={i} className="flex items-center justify-between text-xs font-bold text-text-secondary">
                                <span>{acc.bank}</span>
                                <span className="text-text-tertiary font-mono">{acc.iban}</span>
                             </div>
                          ))}
                          {(!config?.financial?.bank_accounts || !Array.isArray(config?.financial?.bank_accounts) || config?.financial?.bank_accounts.length === 0) && <p className="text-xs text-text-tertiary italic">Nenhuma conta configurada</p>}
                       </div>
                   )}
                </div>

                <div className="flex flex-col gap-1.5 p-4 bg-bg-base/50 rounded-2xl border border-border-subtle/50">
                   <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Multicaixa Express (JSON)</p>
                   {editingSection === 'financial' ? (
                      <textarea 
                        value={editForm.financial_mcx_express || '[]'}
                        onChange={(e) => setEditForm({ ...editForm, financial_mcx_express: e.target.value })}
                        className="bg-transparent border-none p-0 text-xs font-medium text-text-primary focus:ring-0 placeholder-text-tertiary w-full min-h-[80px] font-mono"
                        placeholder='Exemplo: [{"name": "Vendas Conversio", "number": "923 000 000"}]'
                      />
                   ) : (
                       <div className="space-y-2">
                          {Array.isArray(config?.financial?.mcx_express) && config.financial.mcx_express.map((mcx: any, i: number) => (
                             <div key={i} className="flex items-center justify-between text-xs font-bold text-text-secondary">
                                <span>{mcx.name}</span>
                                <span className="text-text-tertiary font-mono">{mcx.number}</span>
                             </div>
                          ))}
                          {(!config?.financial?.mcx_express || !Array.isArray(config?.financial?.mcx_express) || config?.financial?.mcx_express.length === 0) && <p className="text-xs text-text-tertiary italic">Nenhum contacto configurado</p>}
                       </div>
                   )}
                </div>
             </div>
          </ConfigCard>
      </div>

      <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] mt-12">
         <h4 className="text-red-500 font-black flex items-center gap-2 text-sm uppercase tracking-widest mb-2">
            <X size={18} /> Painel de Recuperação
         </h4>
         <p className="text-xs text-text-tertiary leading-relaxed mb-6 font-medium">
           As alterações nas configurações de infraestrutura são críticas. Se perder o acesso à base de dados ou ao storage, o sistema entrará em modo de segurança.
         </p>
         <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-red-500 text-black font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-red-600 transition-colors shadow-sm">Reset Global ao .ENV</button>
            <button className="px-6 py-3 bg-transparent border border-red-500/50 text-red-500 font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-red-500/10 transition-colors">Invalidar Cache Config</button>
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
