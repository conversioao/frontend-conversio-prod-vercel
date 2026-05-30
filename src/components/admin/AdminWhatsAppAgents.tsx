import React, { useState, useEffect } from 'react';
import { Bot, Save, Globe, Key, Settings, Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw, Activity } from 'lucide-react';
import { whatsappAgentService, type WhatsAppAgentConfig } from '../../services/whatsappAgent.service';
import { BASE_URL } from '../../lib/api';

interface AdminWhatsAppAgentsProps {
  onClose: () => void;
}

export function AdminWhatsAppAgents({ onClose }: AdminWhatsAppAgentsProps) {
  const [config, setConfig] = useState<WhatsAppAgentConfig>({
    url: '',
    key: '',
    instance: '',
    active: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await whatsappAgentService.getConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error loading WhatsApp Agent config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await whatsappAgentService.saveConfig(config);
      setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setQrCode(null);
      const { state, qr } = await whatsappAgentService.testConnection({
        url: config.url,
        key: config.key,
        instance: config.instance
      });
      
      if (state === 'open' || state === 'CONNECTED') {
        setTestResult('success');
        setStatusText('Conectado');
      } else {
        setTestResult('error');
        setStatusText(`Desconectado (${state})`);
        if (qr) setQrCode(qr);
      }
    } catch (err: any) {
      setTestResult('error');
      setStatusText(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleCreateInstance = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await whatsappAgentService.createInstance({
        url: config.url,
        key: config.key,
        instance: config.instance
      });
      setMessage({ type: 'success', text: 'Instância criada com sucesso! Pode testar agora.' });
      handleTest();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // The webhook URL is now provided by the backend via the config object.

  if (loading) {
    return (
      <div className="fixed inset-0 z-[80] bg-[#050706] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#FFB800] animate-spin" />
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Carregando Configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[#050706] text-white flex flex-col font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-3xl shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="text-[#FFB800]" size={32} />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Agentes WhatsApp</h1>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Configuração Global da API de Agentes</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all"
        >
          <XCircle size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
        <div className="max-w-4xl mx-auto">
          {message && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              <span className="text-sm font-bold">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Settings className="text-[#FFB800]" size={20} />
                  Credenciais da Evolution API
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 ml-1">URL da API (Evolution)</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text"
                        value={config.url}
                        onChange={(e) => setConfig({...config, url: e.target.value})}
                        placeholder="https://api.instancia.com"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 ml-1">API Key (Global Token)</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="password"
                        value={config.key}
                        onChange={(e) => setConfig({...config, key: e.target.value})}
                        placeholder="Insira a sua chave API global"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 ml-1">URL da "Mente" do Agente (Brain)</label>
                    <div className="relative">
                      <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text"
                        value={config.brainUrl || ''}
                        onChange={(e) => setConfig({...config, brainUrl: e.target.value})}
                        placeholder="http://localhost:3010/api/agent/brain"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#FFB800]/50 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Estado Global da API</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${config.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${config.active ? 'text-emerald-500' : 'text-red-500'}`}>
                          {config.active ? 'Operacional' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig({...config, active: !config.active})}
                      className={`w-12 h-6 rounded-full transition-all relative ${config.active ? 'bg-[#FFB800]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.active ? 'left-7 shadow-sm' : 'left-1 opacity-40'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#FFB800] text-black font-black py-4 rounded-2xl hover:bg-[#FFD700] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFB800]/10 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? 'Guardando...' : 'Guardar Configurações'}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Activity className="text-[#FFB800]" size={20} />
                  Status & Integração
                </h2>

                <div className="space-y-6">
                  {/* Test Connection */}
                  <div className="p-6 bg-black/20 border border-white/5 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Estado da Ligação</span>
                      {testResult && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${testResult === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${testResult === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                          {statusText}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleTest}
                      disabled={testing || !config.url || !config.key || !config.instance}
                      className="w-full py-3 border border-white/10 hover:border-[#FFB800]/50 hover:bg-[#FFB800]/5 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-30"
                    >
                      {testing ? <Loader2 size={16} className="animate-spin text-[#FFB800]" /> : <RefreshCw size={16} />}
                      Testar Conexão agora
                    </button>

                    {statusText.includes('não encontrada') && (
                      <button 
                        onClick={handleCreateInstance}
                        disabled={saving}
                        className="w-full py-3 bg-white/5 border border-[#FFB800]/20 text-[#FFB800] rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                        Criar Instância "{config.instance}"
                      </button>
                    )}

                    {qrCode && (
                      <div className="pt-4 border-t border-white/5 flex flex-col items-center justify-center gap-3">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Digitaliza para Conectar</span>
                        <div className="p-3 bg-white rounded-xl">
                          <img src={qrCode} alt="QR Code" className="w-32 h-32" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Webhook Info */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">URL de Webhook (Agentes)</label>
                    <div className="group relative">
                      <input 
                        type="text"
                        readOnly
                        value={config.webhookUrl || ''}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-[10px] font-mono text-white/60 outline-none cursor-default"
                      />
                      <button 
                         onClick={() => navigator.clipboard.writeText(config.webhookUrl || '')}
                         className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/5 hover:bg-[#FFB800] hover:text-black rounded-lg text-[10px] font-black transition-all"
                      >
                        COPIAR
                      </button>
                    </div>
                    <p className="text-[10px] text-white/20 italic px-2">
                      * Configure este URL na sua instância da Evolution API para receber eventos dos agentes.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-2xl flex gap-3">
                    <ExternalLink className="text-[#FFB800] shrink-0" size={18} />
                    <p className="text-[11px] text-[#FFB800]/80 leading-relaxed">
                      Estas configurações são isoladas da API principal. Utilize uma instância dedicada para garantir a melhor performance dos Agentes Conversacionais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
