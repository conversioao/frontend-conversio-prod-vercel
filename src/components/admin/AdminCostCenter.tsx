import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Save, Key, AlertTriangle, CheckCircle, RefreshCcw, 
  DollarSign, X, Zap, BarChart3, Settings, PlusCircle, 
  TrendingUp, TrendingDown, Eye, EyeOff, Wallet, List, Activity,
  Database, Clock, Cpu, Server, HardDrive, Globe, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────
interface APIKey {
  id?: number;
  provider: string;
  name: string;
  key_secret: string;
  status: 'working' | 'failed' | 'disabled';
  priority: number;
  last_error: string | null;
  updated_at: string;
}

interface ServiceBudget {
  service: string;
  credit_balance: number;
  credit_purchased: number;
  dollar_balance: number;
  dollar_purchased: number;
  token_budget: number;
  tokens_purchased: number;
  cost_per_unit: number;
  platform_markup: number;
  notes: string | null;
  updated_at: string;
}

interface UsageStat {
  provider: string;
  total_prompt: number;
  total_completion: number;
  total_cost: number;
  total_calls: number;
}

interface AgentStat {
  agent_name: string;
  provider: string;
  total_prompt: number;
  total_completion: number;
  total_cost: number;
  total_calls: number;
}

interface UsageLog {
  id: number;
  agent_name: string;
  provider: string;
  tokens_prompt: number;
  tokens_completion: number;
  cost_estimated: number;
  created_at: string;
}

interface PlatformStat {
  creditsSold: number;
  creditsConsumed: number;
  revenue: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const KIE_USD_RATE = 0.005; // 1 credit = $0.005
const KIE_AOA_RATE = 6;     // 1 credit = 6 Kzs
const OPENAI_CONSERVATIVE_RATE = 0.40 / 1000000; // $0.40 per 1M tokens

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color = '#FFB800', label = '', secondaryLabel = '' }: { value: number; max: number; color?: string; label?: string; secondaryLabel?: string }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const danger = pct > 80;
  const barColor = danger ? '#ef4444' : color;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        {label && <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</div>}
        <div className="text-[10px] font-bold" style={{ color: barColor }}>{pct.toFixed(1)}% {secondaryLabel && <span className="text-white/20 ml-1">| {secondaryLabel}</span>}</div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor, boxShadow: `0 0 8px ${barColor}60` }}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCostCenter({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'control' | 'keys' | 'report' | 'logs'>('control');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Stats state
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
  const [platform, setPlatform] = useState<PlatformStat>({ creditsSold: 0, creditsConsumed: 0, revenue: 0 });

  // Keys state
  const mkEmptyKey = (provider: string, name: string, priority: number): APIKey =>
    ({ provider, name, key_secret: '', status: 'working', priority, last_error: null, updated_at: '' });

  const [openai1, setOpenai1] = useState<APIKey>(mkEmptyKey('openai', 'Principal', 1));
  const [openai2, setOpenai2] = useState<APIKey>(mkEmptyKey('openai', 'Redundante', 2));
  const [kie1, setKie1] = useState<APIKey>(mkEmptyKey('kie', 'Principal', 1));
  const [kie2, setKie2] = useState<APIKey>(mkEmptyKey('kie', 'Secundária', 2));

  // Budget state
  const [kieBudget, setKieBudget] = useState<ServiceBudget>({ service: 'kie', credit_balance: 0, credit_purchased: 0, dollar_balance: 0, dollar_purchased: 0, token_budget: 0, tokens_purchased: 0, cost_per_unit: 0.003, platform_markup: 0.30, notes: null, updated_at: '' });
  const [openAiBudget, setOpenAiBudget] = useState<ServiceBudget>({ service: 'openai', credit_balance: 0, credit_purchased: 0, dollar_balance: 0, dollar_purchased: 0, token_budget: 10000000, tokens_purchased: 10000000, cost_per_unit: 0.00015, platform_markup: 0.20, notes: null, updated_at: '' });
  
  const [kieAddAmount, setKieAddAmount] = useState('');
  const [showKieAdd, setShowKieAdd] = useState(false);
  
  const [oiAddAmount, setOiAddAmount] = useState('');
  const [showOiAdd, setShowOiAdd] = useState(false);

  // Infrastructure expiration dates
  const [infraDates, setInfraDates] = useState<{server: string; storage: string; domain: string}>({ server: '', storage: '', domain: '' });
  const [infraSaving, setInfraSaving] = useState(false);

  const token = () => localStorage.getItem('conversio_token');
  const authHeaders = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, costsRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/config/keys`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/admin/stats/costs`, { headers: authHeaders() }),
      ]);
      const keysData = await keysRes.json();
      const costsData = await costsRes.json();

      if (keysData.success) {
        const keys: APIKey[] = keysData.keys || [];
        const find = (p: string, n: string) => keys.find(k => k.provider === p && k.name === n);
        if (find('openai', 'Principal')) setOpenai1(find('openai', 'Principal')!);
        if (find('openai', 'Redundante')) setOpenai2(find('openai', 'Redundante')!);
        if (find('kie', 'Principal')) setKie1(find('kie', 'Principal')!);
        if (find('kie', 'Secundária')) setKie2(find('kie', 'Secundária')!);
      }

      if (costsData.success) {
        setStats(costsData.stats || []);
        setAgentStats(costsData.agentStats || []);
        setRecentLogs(costsData.recentLogs || []);
        setPlatform(costsData.platform || { creditsSold: 0, creditsConsumed: 0, revenue: 0 });
        const budgets: ServiceBudget[] = costsData.budgets || [];
        const kb = budgets.find(b => b.service === 'kie');
        const ob = budgets.find(b => b.service === 'openai');
        if (kb) setKieBudget(kb);
        if (ob) setOpenAiBudget(ob);
      }

      // Load infrastructure dates
      try {
        const infraRes = await fetch(`${BASE_URL}/admin/config`, { headers: authHeaders() });
        const infraData = await infraRes.json();
        if (infraData.success) {
          const settings: Record<string, string> = {};
          (infraData.settings || []).forEach((s: any) => { settings[s.key] = s.value; });
          setInfraDates({
            server: settings['infra_server_expiry'] || '',
            storage: settings['infra_storage_expiry'] || '',
            domain: settings['infra_domain_expiry'] || '',
          });
        }
      } catch (e) { /* non-critical */ }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveKey = async (key: APIKey, slotId: string) => {
    if (!key.key_secret) return alert('Insira a chave antes de salvar.');
    setSaving(slotId);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/keys`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ provider: key.provider, name: key.name, key_secret: key.key_secret, priority: key.priority })
      });
      const d = await res.json();
      if (!d.success) alert('Erro: ' + d.message);
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setSaving(null);
    }
  };

  const saveBudget = async (service: string, budget: ServiceBudget) => {
    setSaving(`budget_${service}`);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/budgets/${service}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(budget)
      });
      const d = await res.json();
      if (!d.success) alert('Erro: ' + d.message);
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setSaving(null);
    }
  };

  const addKieCredits = async () => {
    const amount = parseFloat(kieAddAmount);
    if (isNaN(amount) || amount <= 0) return;
    const updated = {
      ...kieBudget,
      credit_balance: Number(kieBudget.credit_balance) + amount,
      credit_purchased: Number(kieBudget.credit_purchased) + amount
    };
    setKieBudget(updated);
    await saveBudget('kie', updated);
    setKieAddAmount('');
    setShowKieAdd(false);
  };

  const addOiDollars = async () => {
    const amount = parseFloat(oiAddAmount);
    if (isNaN(amount) || amount <= 0) return;
    const updated = {
      ...openAiBudget,
      dollar_balance: Number(openAiBudget.dollar_balance) + amount,
      dollar_purchased: Number(openAiBudget.dollar_purchased) + amount
    };
    updated.token_budget = Math.floor(updated.dollar_purchased / OPENAI_CONSERVATIVE_RATE);
    
    setOpenAiBudget(updated);
    await saveBudget('openai', updated);
    setOiAddAmount('');
    setShowOiAdd(false);
  };

  const resetService = async (service: 'openai' | 'kie') => {
    if (!confirm(`TEM CERTEZA? Isto irá recomeçar os saldos e APAGAR todos os logs de uso da ${service}.`)) return;
    setSaving(`reset_${service}`);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/budgets/${service}/reset`, {
        method: 'POST',
        headers: authHeaders()
      });
      const d = await res.json();
      if (!d.success) alert('Erro: ' + d.message);
      else load();
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setSaving(null);
    }
  };

  const saveInfraDates = async () => {
    setInfraSaving(true);
    try {
      const settings = {
        'infra_server_expiry': infraDates.server,
        'infra_storage_expiry': infraDates.storage,
        'infra_domain_expiry': infraDates.domain,
      };

      const res = await fetch(`${BASE_URL}/admin/config`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ settings })
      });
      
      const d = await res.json();
      if (!d.success) throw new Error(d.message);

      alert('Datas de infraestrutura guardadas com sucesso!');
    } catch (e: any) {
      alert('Erro ao guardar datas: ' + e.message);
    } finally {
      setInfraSaving(false);
    }
  };

  const getDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDaysBadge = (days: number | null) => {
    if (days === null) return { text: 'Não definido', color: 'text-white/20', bg: 'bg-white/5' };
    if (days <= 0) return { text: `EXPIRADO há ${Math.abs(days)}d`, color: 'text-red-500', bg: 'bg-red-500/10' };
    if (days <= 6) return { text: `${days} dias — URGENTE`, color: 'text-red-400', bg: 'bg-red-500/10' };
    if (days <= 30) return { text: `${days} dias`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { text: `${days} dias`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  };

  // Metrics
  const openaiUsage = stats.find(s => s.provider === 'openai');
  const openaiCostUsed = parseFloat(String(openaiUsage?.total_cost || 0));
  
  const estimatedRemainingTokens = Math.max(0, Math.floor(Number(openAiBudget.dollar_balance) / OPENAI_CONSERVATIVE_RATE));
  const totalEstimatedCapacity = Math.floor(Number(openAiBudget.dollar_purchased) / OPENAI_CONSERVATIVE_RATE);

  const totalRevenue = platform.revenue;
  const totalAiCost = stats.reduce((a, s) => a + parseFloat(String(s.total_cost || 0)), 0);
  const margin = totalRevenue - totalAiCost;

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'control', label: 'Controle de Saldo', icon: <Wallet size={14} /> },
    { id: 'logs', label: 'Logs de Atividade', icon: <Activity size={14} /> },
    { id: 'report', label: 'Relatório Financeiro', icon: <BarChart3 size={14} /> }
  ];

  // ─── Rendering ─────────────────────────────────────────────────────────────
  
  const KeySlot = ({ k, setK, label, badge, slotId }: { k: APIKey; setK: (v: APIKey) => void; label: string; badge: string; slotId: string }) => {
    const visible = showKeys[slotId];
    const isWorking = k.status === 'working' || !k.last_error;
    return (
      <div className="border border-white/8 rounded-2xl p-5 space-y-3 hover:border-white/15 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${badge === '1' ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/40'}`}>
              #{badge}
            </span>
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {k.key_secret && (
              <span className={`text-[9px] font-bold flex items-center gap-1 ${isWorking ? 'text-emerald-500' : 'text-red-400'}`}>
                {isWorking ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                {isWorking ? 'OK' : 'FALHA'}
              </span>
            )}
            <button onClick={() => setShowKeys(s => ({ ...s, [slotId]: !s[slotId] }))} className="text-white/20 hover:text-white/60 transition-colors">
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/20 rounded-xl px-4 py-2.5 border border-white/5">
          <Key size={12} className="text-white/20 shrink-0" />
          <input
            type={visible ? 'text' : 'password'}
            value={k.key_secret}
            onChange={e => setK({ ...k, key_secret: e.target.value })}
            placeholder={k.provider === 'openai' ? 'sk-proj-...' : 'chave kie.ai...'}
            className="flex-1 bg-transparent text-xs font-mono text-white/80 outline-none placeholder:text-white/20"
          />
        </div>
        {k.last_error && <p className="text-[9px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-1.5">{k.last_error}</p>}
        <button
          onClick={() => saveKey(k, slotId)}
          disabled={saving === slotId}
          className="w-full h-9 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white/80 transition-all flex items-center justify-center gap-2"
        >
          {saving === slotId ? <RefreshCcw size={12} className="animate-spin" /> : <Save size={12} />}
          {saving === slotId ? 'A guardar...' : 'Salvar'}
        </button>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#070808] text-white flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/6 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFB800]/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-[#FFB800]" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Centro de Custo AI</h1>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Gestão Financeira & Orçamentos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-white/10 text-white shadow-xl shadow-black/20' : 'text-white/30 hover:text-white/60'}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-all">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 rounded-lg text-white/30 hover:text-red-400 transition-all">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── TAB: CONTROLE DE SALDO ────────────────────────────────────────── */}
          {tab === 'control' && (
            <motion.div key="control" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* OpenAI */}
                <div className="bg-white/3 border border-white/8 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                    <Zap size={80} strokeWidth={1} />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Zap size={20} className="text-emerald-500" /></div>
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-widest">OpenAI (Tokens)</h2>
                        <p className="text-[10px] text-white/40 uppercase font-bold">GPT-4o mini Centralized</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => resetService('openai')} disabled={saving === 'reset_openai'} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                         Redefinir
                       </button>
                       <button onClick={() => setShowOiAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                         <PlusCircle size={14} /> Carregar Dólares
                       </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-center">
                      <p className="text-[10px] font-black uppercase text-white/30 mb-2">Saldo Atual</p>
                      <p className="text-3xl font-black text-emerald-400">${Number(openAiBudget.dollar_balance).toFixed(2)}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-center">
                      <p className="text-[10px] font-black uppercase text-white/30 mb-2">Capacidade Est.</p>
                      <p className="text-3xl font-black text-white">{estimatedRemainingTokens.toLocaleString()}</p>
                    </div>
                  </div>
                  <ProgressBar value={estimatedRemainingTokens} max={totalEstimatedCapacity || 1} color="#10b981" label="Orçamento de Tokens" secondaryLabel={`${estimatedRemainingTokens.toLocaleString()} restantes`} />
                </div>

                {/* Kie.ai */}
                <div className="bg-white/3 border border-white/8 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                    <Zap size={80} strokeWidth={1} />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Zap size={20} className="text-blue-500" /></div>
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-widest">Kie.ai (Créditos)</h2>
                        <p className="text-[10px] text-white/40 uppercase font-bold">Pipeline Estendido</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => resetService('kie')} disabled={saving === 'reset_kie'} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                         Redefinir
                       </button>
                       <button onClick={() => setShowKieAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                         <PlusCircle size={14} /> Carregar Créditos
                       </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-center">
                      <p className="text-[10px] font-black uppercase text-white/30 mb-2">Créditos Atuais</p>
                      <p className="text-3xl font-black text-blue-400">{Number(kieBudget.credit_balance).toLocaleString()}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-center">
                      <p className="text-[10px] font-black uppercase text-white/30 mb-2">Valor Estimado</p>
                      <p className="text-3xl font-black text-white">${(Number(kieBudget.credit_balance) * KIE_USD_RATE).toFixed(2)}</p>
                    </div>
                  </div>
                  <ProgressBar value={platform.creditsSold} max={Number(kieBudget.credit_balance) || 1} color={platform.creditsSold > Number(kieBudget.credit_balance) ? '#ef4444' : '#3b82f6'} label="Cobertura de Créditos Oferecidos" secondaryLabel={`${Math.round((platform.creditsSold / (Number(kieBudget.credit_balance) || 1)) * 100)}% Comprometido`} />
                </div>
              </div>
              
              {/* ── INFRAESTRUTURA CONTABO ──────────────────────────────── */}
              <div className="bg-white/3 border border-white/8 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
                  <Server size={80} strokeWidth={1} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Server size={20} className="text-purple-500" /></div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-widest">Infraestrutura</h2>
                      <p className="text-[10px] text-white/40 uppercase font-bold">Validades Contabo & Domínio</p>
                    </div>
                  </div>
                  <button
                    onClick={saveInfraDates}
                    disabled={infraSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {infraSaving ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                    {infraSaving ? 'A guardar...' : 'Guardar Datas'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  {[
                    { key: 'server' as const, label: 'Servidor VPS', icon: <Server size={16} className="text-purple-400" />, desc: 'Contabo VPS' },
                    { key: 'storage' as const, label: 'Object Storage', icon: <HardDrive size={16} className="text-blue-400" />, desc: 'Contabo S3' },
                    { key: 'domain' as const, label: 'Domínio', icon: <Globe size={16} className="text-emerald-400" />, desc: 'Registo DNS' },
                  ].map(item => {
                    const days = getDaysUntil(infraDates[item.key]);
                    const badge = getDaysBadge(days);
                    return (
                      <div key={item.key} className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4 hover:border-purple-500/20 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <div>
                              <p className="text-xs font-black text-white/80 uppercase tracking-widest">{item.label}</p>
                              <p className="text-[9px] text-white/30">{item.desc}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${badge.bg} ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-3 border border-white/5 focus-within:border-purple-500/30 transition-all">
                          <Calendar size={14} className="text-white/20 shrink-0" />
                          <input
                            type="date"
                            value={infraDates[item.key]}
                            onChange={e => setInfraDates(prev => ({ ...prev, [item.key]: e.target.value }))}
                            className="flex-1 bg-transparent text-xs font-mono text-white/80 outline-none [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Consumers Preview */}
              <div className="bg-white/3 border border-white/8 rounded-[2rem] p-8">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center"><Cpu size={16} className="text-orange-500" /></div>
                       <h3 className="text-xs font-black uppercase tracking-widest text-white/80">Top Consumidores (Últimos 30 dias)</h3>
                    </div>
                    <button onClick={() => setTab('report')} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Ver Relatório Completo →</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {agentStats.slice(0, 3).map((a, i) => (
                       <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/5 relative group hover:border-[#FFB800]/20 transition-all overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-white/10 transition-colors"><BarChart3 size={40} /></div>
                          <p className="text-[9px] font-black uppercase text-white/30 mb-1">{a.provider}</p>
                          <h4 className="text-sm font-black text-white mb-4 truncate pr-8">{a.agent_name}</h4>
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-[8px] font-black uppercase text-white/20">Consumo</p>
                                <p className="text-lg font-black text-[#FFB800]">
                                   {a.provider === 'openai' ? `$${Number(a.total_cost).toFixed(4)}` : `${Math.round(Number(a.total_cost) / 0.005).toLocaleString()} CR`}
                                </p>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] font-black uppercase text-white/20">{a.provider === 'openai' ? 'Tokens' : 'Chamadas'}</p>
                                <p className="text-xs font-black text-white/60">
                                   {a.provider === 'openai' ? (parseInt(String(a.total_prompt)) + parseInt(String(a.total_completion))).toLocaleString() : a.total_calls}
                                </p>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

          {/* ── TAB: LOGS DE ATIVIDADE ────────────────────────────────────────── */}
          {tab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 max-w-6xl mx-auto flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest">Logs de Processamento</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Histórico detalhado de cada ação dos agentes</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 border border-white/8 rounded-xl px-4 py-2">
                     <Clock size={14} className="text-white/20" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Mostrando últimos 100 registos</span>
                  </div>
               </div>

               <div className="flex-1 bg-white/2 border border-white/8 rounded-[2rem] overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-white/5 border-b border-white/10 sticky top-0 z-10">
                          <tr>
                             {['Momento', 'Agente', 'Provider', 'Tokens (I/O)', 'Custo Real', 'ID Log'].map(h => (
                                <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/25">{h}</th>
                             ))}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/4">
                          {recentLogs.length === 0 ? (
                             <tr><td colSpan={6} className="px-6 py-20 text-center text-xs font-black text-white/20 uppercase tracking-widest italic">A aguardar primeira atividade...</td></tr>
                          ) : recentLogs.map((log) => (
                             <tr key={log.id} className="hover:bg-white/2 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-white/40">
                                   {new Date(log.created_at).toLocaleString('pt-AO')}
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${log.agent_name.includes('Error') ? 'bg-red-500' : 'bg-[#FFB800]'}`} />
                                      <span className="text-xs font-bold text-white group-hover:text-[#FFB800] transition-colors">{log.agent_name}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                                   <span className={`px-2 py-0.5 rounded ${log.provider === 'openai' ? 'text-emerald-500 bg-emerald-500/5 border border-emerald-500/10' : 'text-blue-400 bg-blue-500/5 border border-blue-500/10'}`}>
                                      {log.provider}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-[10px] font-mono text-white/60">
                                   <span className="group-hover:text-white transition-colors">{log.tokens_prompt.toLocaleString()}</span>
                                   <span className="mx-1 text-white/20">/</span>
                                   <span className="text-white/30">{log.tokens_completion.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4 text-xs font-black text-[#00FFA3]">
                                   {log.provider === 'openai' ? `$${Number(log.cost_estimated).toFixed(6)}` : `${Math.round(Number(log.cost_estimated) / 0.005).toLocaleString()} CR`}
                                </td>
                                <td className="px-6 py-4 text-[9px] font-mono text-white/20">#{log.id}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            </motion.div>
          )}

          {/* ── TAB: RELATÓRIO ───────────────────────────────────────────── */}
          {tab === 'report' && (
            <motion.div key="report" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Receita Plataforma', value: `$${totalRevenue.toFixed(2)}`, sub: 'últimos 30 dias', color: 'text-[#00FFA3]', icon: <TrendingUp size={16} /> },
                  { label: 'Custo IA Total', value: `$${totalAiCost.toFixed(4)}`, sub: 'OpenAI + Kie.ai', color: 'text-red-400', icon: <TrendingDown size={16} /> },
                  { label: 'Margem Bruta', value: `$${margin.toFixed(2)}`, sub: margin >= 0 ? 'lucrativo' : 'prejuízo', color: margin >= 0 ? 'text-[#FFB800]' : 'text-red-500', icon: <DollarSign size={16} /> },
                  { label: 'Créditos Vendidos', value: String(Math.round(platform.creditsSold)), sub: `${Math.round(platform.creditsConsumed)} utilizados`, color: 'text-blue-400', icon: <Zap size={16} /> },
                ].map((k, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{k.label}</p>
                      <span className={k.color}>{k.icon}</span>
                    </div>
                    <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                    <p className="text-[9px] text-white/20">{k.sub}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/6 flex items-center justify-between bg-white/2">
                   <div className="flex items-center gap-3">
                      <Cpu size={16} className="text-white/40" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Ranqueamento de Agentes (Tokens & Custo)</h3>
                   </div>
                   <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Baseado em logs de processamento real</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/4">
                          {['Rank', 'Agente', 'Provider', 'Chamadas', 'Total Tokens (I/O)', 'Investimento'].map(h => (
                            <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/25">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/4">
                        {agentStats.map((a, i) => (
                          <tr key={i} className="hover:bg-white/2 transition-colors group">
                            <td className="px-6 py-4 text-xs font-black text-white/10 group-hover:text-[#FFB800] transition-colors">#0{i+1}</td>
                            <td className="px-6 py-4 text-xs font-bold text-white/80">{a.agent_name}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${a.provider === 'openai' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                {a.provider}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-white/40">{a.total_calls}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white/60">
                               {a.provider === 'openai' ? (
                                 <>
                                   {(parseInt(String(a.total_prompt)) + parseInt(String(a.total_completion))).toLocaleString()}
                                   <span className="text-[10px] text-white/20 ml-2">({a.total_prompt}/{a.total_completion})</span>
                                 </>
                               ) : (
                                 <span className="text-white/20 italic">-</span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-[#00FFA3]">
                               {a.provider === 'openai' ? `$${Number(a.total_cost).toFixed(6)}` : `${Math.round(Number(a.total_cost) / 0.005).toLocaleString()} CR`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
            </motion.div>
          )}



        </AnimatePresence>
      </div>

      {/* Advanced Setting Modal (reusing standard layout) */}
      <AnimatePresence>
          {showOiAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0A0B0B] border border-white/10 rounded-[2.5rem] p-10 w-full max-w-md space-y-8 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><DollarSign size={20} className="text-emerald-500" /></div>
                    <h3 className="text-lg font-black uppercase tracking-widest">Recarregar OpenAI</h3>
                  </div>
                  <button onClick={() => setShowOiAdd(false)} className="p-2 hover:bg-white/5 rounded-full text-white/30 transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest ml-1">Valor USD</p>
                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-6 py-5 focus-within:border-emerald-500/50 transition-all">
                      <span className="text-2xl font-black text-emerald-500">$</span>
                      <input type="number" step="1" value={oiAddAmount} onChange={e => setOiAddAmount(e.target.value)} placeholder="50" className="bg-transparent text-white font-black text-3xl outline-none flex-1 placeholder:text-white/5" autoFocus />
                    </div>
                  </div>
                </div>
                <button onClick={addOiDollars} disabled={!oiAddAmount || parseFloat(oiAddAmount) <= 0} className="w-full h-16 bg-emerald-500 text-black rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20">Confirmar Depósito</button>
              </motion.div>
            </motion.div>
          )}

          {showKieAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0A0B0B] border border-white/10 rounded-[2.5rem] p-10 w-full max-w-md space-y-8 shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Zap size={20} className="text-blue-500" /></div>
                    <h3 className="text-lg font-black uppercase tracking-widest">Recarregar Kie.ai</h3>
                  </div>
                  <button onClick={() => setShowKieAdd(false)} className="p-2 hover:bg-white/5 rounded-full text-white/30 transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest ml-1">Total de Créditos</p>
                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-6 py-5 focus-within:border-blue-500/50 transition-all">
                      <Zap size={20} className="text-blue-500" />
                      <input type="number" step="100" value={kieAddAmount} onChange={e => setKieAddAmount(e.target.value)} placeholder="1000" className="bg-transparent text-white font-black text-3xl outline-none flex-1 placeholder:text-white/5" autoFocus />
                    </div>
                  </div>
                </div>
                <button onClick={addKieCredits} disabled={!kieAddAmount || parseFloat(kieAddAmount) <= 0} className="w-full h-16 bg-blue-500 text-black rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20">Confirmar Créditos</button>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
}
