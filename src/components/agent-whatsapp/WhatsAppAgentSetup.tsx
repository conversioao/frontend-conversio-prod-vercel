import React, { useState, useEffect } from 'react';
import { Bot, User, MessageSquare, BookOpen, Power, Save, Loader2, CheckCircle2, AlertCircle, Clock, Globe, Languages, ShieldAlert, Image as ImageIcon, ExternalLink, QrCode, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { CatalogUploader } from './CatalogUploader';

type TabType = 'identity' | 'personality' | 'catalog' | 'activation';

interface BusinessHours {
  [key: string]: { start: string; end: string; active: boolean };
}

const DAYS = [
  { id: 'mon', label: 'Segunda' },
  { id: 'tue', label: 'Terça' },
  { id: 'wed', label: 'Quarta' },
  { id: 'thu', label: 'Quinta' },
  { id: 'fri', label: 'Sexta' },
  { id: 'sat', label: 'Sábado' },
  { id: 'sun', label: 'Domingo' },
];

export function WhatsAppAgentSetup() {
  const [activeTab, setActiveTab] = useState<TabType>('identity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    agent_name: '',
    avatar_url: '',
    whatsapp_number: '',
    greeting_message: '',
    away_message: '',
    working_hours: DAYS.reduce((acc, day) => ({ ...acc, [day.id]: { start: '08:00', end: '18:00', active: true } }), {} as BusinessHours),
    tone: 'Profissional',
    language: 'Português Angola',
    custom_prompt: '',
    escalation_rules: '',
    forbidden_words: [] as string[],
    is_active: false,
    is_validated: false,
    message_credits: 0,
    subscription_status: 'inactive',
    paid_until: null as string | null,
    catalog_data: [] as any[],
    catalog_last_updated: ''
  });

  // Validation Flow State
  const [setupStep, setSetupStep] = useState<'validation' | 'otp' | 'ready'>('validation');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'open' | 'close' | 'connecting' | 'unknown'>('unknown');
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    fetchAgent();
  }, []);

  useEffect(() => {
    let interval: any;
    if (activeTab === 'activation') {
      fetchInstanceStatus();
      interval = setInterval(fetchInstanceStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchInstanceStatus = async () => {
    if (!formData.agent_name) return;
    try {
      const res = await apiFetch(`/user-agent/instance-status`);
      const data = await res.json();
      if (data.success) {
        setConnectionStatus(data.state);
        setQrCode(data.qr || null);
      }
    } catch (e) {}
  };

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/user-agent');
      const data = await res.json();
      if (data.success && data.agent) {
        setAgent(data.agent);
        setFormData({
          ...formData,
          ...data.agent,
          working_hours: data.agent.working_hours || formData.working_hours,
          forbidden_words: data.agent.forbidden_words || [],
          catalog_data: data.catalog?.processed_data || [],
          catalog_last_updated: data.catalog?.uploaded_at || ''
        });
        
        if (data.agent.is_validated) {
          setSetupStep('ready');
        }
      }
    } catch (err) {
      console.error('Error fetching agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await apiFetch('/user-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Falha ao guardar configurações');
      setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !formData.is_active;
    try {
      const res = await apiFetch('/user-agent/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, is_active: data.active });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleStartValidation = async () => {
    try {
      setSaving(true);
      const res = await apiFetch('/user-agent/validate-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: formData.whatsapp_number })
      });
      if (!res.ok) throw new Error('Falha ao enviar código');
      setSetupStep('otp');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setVerifying(true);
      const res = await apiFetch('/user-agent/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode })
      });
      if (!res.ok) throw new Error('Código inválido ou expirado');
      
      setMessage({ type: 'success', text: 'Agente validado com sucesso!' });
      setSetupStep('ready');
      fetchAgent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleInstanceAction = async (action: 'logout' | 'reset' | 'qr') => {
    try {
      setSaving(true);
      const res = await apiFetch(`/user-agent/instance-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error('Falha ao executar ação');
      setMessage({ type: 'success', text: 'Ação executada com sucesso.' });
      setTimeout(() => fetchAgent(), 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#FFB800] animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">A carregar configurações do agente...</p>
      </div>
    );
  }

  // STEP 1: Validation
  if (setupStep === 'validation') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-8">
        <div className="w-24 h-24 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-[2rem] flex items-center justify-center text-[#FFB800] mx-auto shadow-2xl">
          <ShieldAlert size={48} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Validação do Agente</h1>
          <p className="text-white/40 mt-3 font-medium">Insere o número de WhatsApp que será usado pelo teu agente inteligente.</p>
        </div>

        <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
          <div className="text-left">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Número WhatsApp Business</label>
            <input 
              type="text" 
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})}
              placeholder="+244 9XX XXX XXX"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-lg font-bold focus:border-[#FFB800]/50 transition-all outline-none"
            />
          </div>
          <button 
            onClick={handleStartValidation}
            disabled={saving || !formData.whatsapp_number}
            className="w-full py-5 bg-[#FFB800] text-black rounded-2xl font-black text-lg shadow-xl shadow-[#FFB800]/10 hover:bg-[#FFD700] transition-all flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="animate-spin" /> : <MessageSquare size={20} />}
            Receber Código via WhatsApp
          </button>
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
            Enviaremos um código de 6 dígitos para este número.
          </p>
        </div>
      </div>
    );
  }

  // STEP 2: OTP Verification
  if (setupStep === 'otp') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-8">
        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto shadow-2xl">
          <CheckCircle2 size={48} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Verificar Código</h1>
          <p className="text-white/40 mt-3 font-medium">Enviámos um código para o número <span className="text-white font-bold">{formData.whatsapp_number}</span></p>
        </div>

        <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
          <div className="text-left">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Código de 6 Dígitos</label>
            <input 
              type="text" 
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="000000"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-2xl font-black tracking-[1rem] text-center focus:border-emerald-500/50 transition-all outline-none"
            />
          </div>
          <button 
            onClick={handleVerifyOTP}
            disabled={verifying || otpCode.length < 6}
            className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/10 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
          >
            {verifying ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Validar e Criar Agente
          </button>
          <button 
            onClick={() => setSetupStep('validation')}
            className="text-xs font-bold text-white/40 hover:text-white transition-all underline underline-offset-4"
          >
            Alterar número de telefone
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header with Stats & Credits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-1 bg-[#0D0D0D] border border-white/[0.04] rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight">Estado do Agente</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${formData.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                {formData.is_active ? 'Ligado' : 'Desligado'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <MessageSquare size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight">Créditos Restantes</h2>
            <p className="text-xl font-black text-white mt-0.5">{formData.message_credits} <span className="text-[10px] text-white/40 uppercase font-medium">Mensagens</span></p>
          </div>
        </div>

        <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-3xl p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight">Assinatura Mensal</h2>
            <p className="text-xs font-bold text-emerald-500 mt-1 uppercase tracking-widest">{formData.subscription_status === 'active' ? 'Ativa' : 'Pendente'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#FFB800] flex items-center justify-center text-black shadow-lg shadow-[#FFB800]/20">
            <Bot size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Painel do Agente</h1>
            <p className="text-white/40 text-sm mt-2 font-medium">Número Validado: <span className="text-white font-bold">{formData.whatsapp_number}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-right-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {message.text}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FFB800] text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#FFD700] transition-all shadow-lg shadow-[#FFB800]/10 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Guardar Alterações
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0D0D0D] border border-white/[0.03] rounded-[2rem] mb-8 overflow-x-auto no-scrollbar shadow-2xl">
        {[
          { id: 'identity', label: 'Identidade', icon: <User size={16} /> },
          { id: 'personality', label: 'Personalidade', icon: <MessageSquare size={16} /> },
          { id: 'catalog', label: 'Catálogo', icon: <BookOpen size={16} /> },
          { id: 'activation', label: 'Gestão & QR', icon: <Power size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] text-sm font-black transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white/[0.07] text-white shadow-xl border border-white/10'
                : 'text-white/20 hover:text-white/40 hover:bg-white/[0.02]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                 <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <User className="text-[#FFB800]" size={20} />
                    Perfil do Agente
                 </h3>
                 <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Nome do Agente</label>
                      <input 
                        type="text" 
                        value={formData.agent_name}
                        onChange={(e) => setFormData({...formData, agent_name: e.target.value})}
                        placeholder="Ex: Ana da ModaLuanda"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Número WhatsApp (Bloqueado)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          readOnly
                          value={formData.whatsapp_number}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm text-white/40 outline-none cursor-not-allowed"
                        />
                        <ShieldAlert size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" />
                      </div>
                      <p className="text-[9px] text-white/20 mt-2 italic">* Contacta o suporte para alterar o número validado.</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Foto / Avatar</label>
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            {formData.avatar_url ? (
                              <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                              <Bot className="text-white/20" size={24} />
                            )}
                         </div>
                         <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">
                            Alterar Foto
                         </button>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                 <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <MessageSquare className="text-[#FFB800]" size={20} />
                    Mensagens Automáticas
                 </h3>
                 <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Saudação Inicial</label>
                      <textarea 
                        rows={3}
                        value={formData.greeting_message}
                        onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
                        placeholder="Olá! Sou a Ana, a tua assistente virtual. Em que posso ajudar hoje?"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Mensagem de Ausência</label>
                      <textarea 
                        rows={3}
                        value={formData.away_message}
                        onChange={(e) => setFormData({...formData, away_message: e.target.value})}
                        placeholder="Olá! De momento estamos fora do nosso horário de atendimento. Deixa a tua mensagem e responderemos assim que possível."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none resize-none"
                      />
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
               <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Clock className="text-[#FFB800]" size={20} />
                  Horário de Atendimento
               </h3>
               <div className="space-y-3">
                  {DAYS.map((day) => (
                    <div key={day.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            const bh = { ...formData.working_hours };
                            bh[day.id].active = !bh[day.id].active;
                            setFormData({ ...formData, working_hours: bh });
                          }}
                          className={`w-10 h-6 rounded-full transition-all relative ${formData.working_hours[day.id].active ? 'bg-[#FFB800]' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.working_hours[day.id].active ? 'left-5' : 'left-1'}`} />
                        </button>
                        <span className={`text-sm font-bold ${formData.working_hours[day.id].active ? 'text-white' : 'text-white/20'}`}>{day.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={formData.working_hours[day.id].start}
                          onChange={(e) => {
                            const bh = { ...formData.working_hours };
                            bh[day.id].start = e.target.value;
                            setFormData({ ...formData, working_hours: bh });
                          }}
                          className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-center outline-none focus:border-[#FFB800]/50" 
                        />
                        <span className="text-white/20">-</span>
                        <input 
                          type="text" 
                          value={formData.working_hours[day.id].end}
                          onChange={(e) => {
                            const bh = { ...formData.working_hours };
                            bh[day.id].end = e.target.value;
                            setFormData({ ...formData, working_hours: bh });
                          }}
                          className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-center outline-none focus:border-[#FFB800]/50" 
                        />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'personality' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                   <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                      <Languages className="text-[#FFB800]" size={20} />
                      Configurações de Voz
                   </h3>
                   <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Tom de Voz</label>
                        <select 
                          value={formData.tone}
                          onChange={(e) => setFormData({...formData, tone: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none appearance-none"
                        >
                          {['Formal', 'Descontraído', 'Profissional', 'Amigável', 'Técnico'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Idioma Principal</label>
                        <select 
                          value={formData.language}
                          onChange={(e) => setFormData({...formData, language: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none appearance-none"
                        >
                          {['Português Angola', 'Português Brasil', 'Inglês', 'Francês'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                   </div>
                </div>

                <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                   <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                      <ShieldAlert className="text-[#FFB800]" size={20} />
                      Segurança e Regras
                   </h3>
                   <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Instruções de Escalada</label>
                        <textarea 
                          rows={3}
                          value={formData.escalation_rules}
                          onChange={(e) => setFormData({...formData, escalation_rules: e.target.value})}
                          placeholder="Ex: Quando o cliente pedir descontos superiores a 10% ou reclamar de um produto, pede para falar com um humano."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block ml-1">Palavras Proibidas</label>
                        <input 
                          type="text" 
                          placeholder="Escreve e pressiona Enter para adicionar"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !formData.forbidden_words.includes(val)) {
                                setFormData({...formData, forbidden_words: [...formData.forbidden_words, val]});
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none"
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                           {formData.forbidden_words.map(w => (
                             <span key={w} className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold flex items-center gap-2">
                               {w}
                               <button onClick={() => setFormData({...formData, forbidden_words: formData.forbidden_words.filter(pw => pw !== w)})}>
                                 <AlertCircle size={10} />
                               </button>
                             </span>
                           ))}
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                   <Globe className="text-[#FFB800]" size={20} />
                   Prompt Personalizado e Instruções
                </h3>
                <textarea 
                  rows={8}
                  value={formData.custom_prompt}
                  onChange={(e) => setFormData({...formData, custom_prompt: e.target.value})}
                  placeholder="Descreve como o teu agente deve se comportar, o que pode e não pode dizer, como deve tratar os clientes, quais produtos destacar..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm focus:border-[#FFB800]/50 transition-all outline-none resize-none leading-relaxed"
                />
             </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <CatalogUploader 
            catalogData={formData.catalog_data} 
            lastUpdated={formData.catalog_last_updated}
            onUpdate={(data) => setFormData({...formData, catalog_data: data, catalog_last_updated: new Date().toISOString()})}
          />
        )}

        {activeTab === 'activation' && (
          <div className="max-w-4xl mx-auto space-y-8">
             <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[3rem] p-10 text-center space-y-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-col items-center gap-6 relative z-10">
                   <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${formData.is_active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-white/20'}`}>
                      <Power size={48} strokeWidth={2.5} className={formData.is_active ? 'animate-pulse' : ''} />
                   </div>
                   
                   <div>
                      <h2 className="text-3xl font-black uppercase tracking-tight italic">
                        Agente {formData.is_active ? 'Ativo' : 'Inativo'}
                      </h2>
                      <p className="text-white/40 mt-2 font-medium">
                        {formData.is_active 
                          ? 'O teu agente está pronto e a responder a todos os clientes no WhatsApp.' 
                          : 'Ativa o teu agente para que ele comece a atender os teus clientes.'}
                      </p>
                   </div>

                   <button 
                    onClick={handleToggleStatus}
                    className={`px-12 py-5 rounded-[2rem] font-black text-lg transition-all transform hover:scale-105 active:scale-95 ${formData.is_active ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-[#FFB800] text-black shadow-2xl shadow-[#FFB800]/20 hover:bg-[#FFD700]'}`}
                   >
                     {formData.is_active ? 'Desativar Agente' : 'Ativar Agente Agora'}
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                   <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                      <QrCode className="text-[#FFB800]" size={16} />
                      Gestão de Conexão
                   </h3>
                   <div className="space-y-3">
                      <button 
                        onClick={() => handleInstanceAction('qr')}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all"
                      >
                        <QrCode size={14} />
                        Gerar Novo QR Code
                      </button>
                      <button 
                        onClick={() => handleInstanceAction('logout')}
                        className="w-full py-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl flex items-center justify-center gap-2 font-black text-xs text-red-500 transition-all"
                      >
                        <Power size={14} />
                        Desconectar Telefone
                      </button>
                      <button 
                        onClick={() => handleInstanceAction('reset')}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all"
                      >
                        <RefreshCw size={14} />
                        Resetar Instância
                      </button>
                   </div>
                </div>

                <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl flex flex-col items-center justify-center">
                   <h3 className="text-sm font-black uppercase tracking-tight text-center">Conectar WhatsApp</h3>
                   
                   {connectionStatus === 'open' ? (
                      <div className="flex flex-col items-center gap-4 text-emerald-500">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                           <CheckCircle2 size={40} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">Conectado com sucesso!</p>
                      </div>
                   ) : qrCode ? (
                      <div className="aspect-square w-full max-w-[160px] mx-auto bg-white p-3 rounded-2xl">
                         <img src={qrCode} alt="QR Code" className="w-full h-full" />
                      </div>
                   ) : (
                      <div className="aspect-square w-full max-w-[160px] mx-auto bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-white/20" />
                        <p className="text-[10px] text-white/20 font-bold uppercase">A aguardar QR...</p>
                      </div>
                   )}
                   
                   <p className="text-[10px] text-center text-white/20 font-bold uppercase tracking-widest mt-4">Digitaliza no teu WhatsApp</p>
                </div>

                <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 space-y-6 shadow-2xl flex flex-col justify-between">
                   <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                         <ExternalLink className="text-[#FFB800]" size={16} />
                         Teste de Fogo
                      </h3>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Testa o teu agente agora mesmo abrindo uma conversa direta.
                      </p>
                   </div>
                   <a 
                    href={`https://wa.me/${formData.whatsapp_number?.replace(/\D/g, '')}?text=Olá!`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-[#FFB800] text-black rounded-2xl flex items-center justify-center gap-2 font-black text-sm hover:bg-[#FFD700] transition-all"
                   >
                     Abrir Chat de Teste
                   </a>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
