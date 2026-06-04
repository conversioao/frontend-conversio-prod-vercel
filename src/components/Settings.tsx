import React, { useState, useEffect, useRef } from 'react';
import { Upload, Palette, Save, Settings as SettingsIcon, Loader2, Sparkles, Check, RefreshCw, AlertTriangle, Type, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string | null;
  background: string;
  tone: string;
  palette: string[];
  palette_description: string;
}

interface BrandData {
  company_name: string;
  logo_url: string;
  brand_colors: BrandColors;
  confirmed: boolean;
}

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isNewAnalysis, setIsNewAnalysis] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localUser = JSON.parse(localStorage.getItem('conversio_user') || '{}');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!localUser.id) return;
      try {
        const res = await apiFetch(`/brands/${localUser.id}`);
        const data = await res.json();
        if (data.success && data.brand) {
          setBrandData(data.brand);
          setLogoPreview(data.brand.logo_url);
        }
      } catch (err) {
        console.error('Failed to fetch brand settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [localUser.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('O ficheiro é demasiado grande. Máximo 5MB.');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Tipo de ficheiro inválido. Use PNG, JPG, SVG ou WEBP.');
      return;
    }

    setLogoFile(file);
    setError(null);
    setMessage(null);
    
    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-trigger analysis
    autoAnalyze(file);
  };

  const autoAnalyze = async (file: File) => {
    setAnalyzing(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await apiFetch('/brands/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setBrandData({
          company_name: data.analysis.company_name,
          logo_url: data.logoUrl,
          brand_colors: data.analysis.brand_colors,
          confirmed: false
        });
        setIsNewAnalysis(true);
        setLogoFile(null);
      } else {
        setError(data.message || 'Falha na análise automática.');
      }
    } catch (err: any) {
      console.error('Auto analyze error:', err);
      setError(`Erro ao conectar ao servidor de análise: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!logoFile) return;

    setAnalyzing(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      // Direct call to mcp-server endpoint
      const res = await apiFetch('/brands/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setBrandData({
          company_name: data.analysis.company_name,
          logo_url: data.logoUrl,
          brand_colors: data.analysis.brand_colors,
          confirmed: false
        });
        setIsNewAnalysis(true);
        setLogoFile(null); // Clear selected file after success
      } else {
        // Display specific error message from the backend (ERRO_S3, ERRO_404, etc.)
        setError(data.message || 'Falha na análise. Verifique a conexão com o n8n.');
      }
    } catch (err: any) {
      console.error('Manual analyze error:', err);
      setError(`Erro crítico ao conectar ao servidor de análise: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!brandData) {
      setMessage({ type: 'error', text: 'Nenhuma configuração de marca para salvar.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await apiFetch('/brands/save', {
        method: 'POST',
        body: JSON.stringify({
          ...brandData,
          confirmed: true
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Configurações de workspace salvas com sucesso!' });
        setIsNewAnalysis(false);
        // Update user in localStorage (Including Company Name)
        const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');
        localStorage.setItem('conversio_user', JSON.stringify({ 
          ...user, 
          brand_logo_url: brandData.logo_url,
          company_name: brandData.company_name 
        }));
        // Dispatch event to update UI
        window.dispatchEvent(new Event('storage'));
      } else {
        setMessage({ type: 'error', text: data.message || 'Erro ao guardar configurações.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
    } finally {
      setSaving(false);
    }
  };

  const updateColor = (key: keyof BrandColors, value: string) => {
    if (!brandData) return;
    setBrandData({
      ...brandData,
      brand_colors: {
        ...brandData.brand_colors,
        [key]: value
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-2">Configurações do Workspace</h1>
        <p className="text-text-secondary">Gerencie a identidade visual e as preferências da sua marca.</p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <p className="font-semibold text-sm tracking-wide">{message.text}</p>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
          <p className="text-red-200 text-sm leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-10">
        
        {/* 1. BRAND SETTINGS */}
        <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors"></div>
          
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                <Palette size={24} />
             </div>
             <div>
                <h2 className="text-xl font-semibold text-white tracking-tight">Identidade de Marca</h2>
                <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-widest mt-1">Extração manual de cores via Webhook</p>
             </div>
          </div>
          
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 relative z-10">
            {/* Logo Upload Section */}
            <div className="flex flex-col gap-6">
              <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest pl-1">Logo da Empresa</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-64 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group/logo ${logoPreview ? 'border-accent/30 bg-accent/5' : 'border-border-subtle hover:border-accent/50 hover:bg-white/5'}`}
              >
                {analyzing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-accent" size={40} />
                    <p className="text-xs font-medium text-accent animate-pulse uppercase tracking-widest">Extraindo cores...</p>
                  </div>
                ) : logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo" className="max-h-48 max-w-[85%] object-contain drop-shadow-2xl" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                       <div className="flex items-center gap-3 px-6 py-3 bg-accent text-black font-semibold uppercase text-[10px] rounded-full shadow-2xl">
                         <RefreshCw size={16} /> Trocar Logo
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center group-hover/logo:scale-110 transition-transform">
                    <Upload size={40} className="mx-auto text-text-tertiary mb-4 group-hover/logo:text-accent transition-colors" />
                    <p className="text-sm font-medium text-white tracking-tight">Carregar logo da marca</p>
                    <p className="text-[10px] font-medium text-text-tertiary mt-1">PNG, JPG, SVG • Máx 5MB</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                />
              </div>

              {analyzing && (
                <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="text-accent mt-0.5 shrink-0" size={18} />
                  <p className="text-accent text-[10px] font-medium leading-relaxed">
                    Estamos a extrair automaticamente a paleta de cores e o nome da marca a partir do seu logótipo através da nossa IA de Branding.
                  </p>
                </div>
              )}
            </div>

            {/* Colors and Details Section */}
            <div className="flex flex-col gap-8">
              {brandData ? (
                <>
                  {/* Company Name */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest pl-1">
                      <Type size={12} className="inline mr-2" /> Nome da Empresa
                    </label>
                    <input 
                      type="text"
                      value={brandData.company_name}
                      onChange={(e) => setBrandData({...brandData, company_name: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-accent outline-none focus:ring-4 focus:ring-accent/5 transition-all"
                      placeholder="Nome da sua marca"
                    />
                  </div>

                  {/* Brand Colors Grid */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest pl-1">Cores da Identidade</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'primary', label: 'Primária' },
                        { key: 'secondary', label: 'Secundária' },
                        { key: 'accent', label: 'Destaque' },
                        { key: 'background', label: 'Fundo' },
                      ].map((color) => (
                        <div key={color.key} className="space-y-1.5 group/color">
                          <p className="text-[9px] font-medium text-text-tertiary uppercase tracking-tight pl-1">{color.label}</p>
                          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-2.5 transition-all group-hover/color:border-white/20">
                            <div 
                              className="w-8 h-8 rounded-lg border border-white/10 shrink-0 relative overflow-hidden"
                              style={{ backgroundColor: (brandData.brand_colors as any)[color.key] || '#000000' }}
                            >
                              <input 
                                type="color"
                                value={(brandData.brand_colors as any)[color.key] || '#000000'}
                                onChange={(e) => updateColor(color.key as keyof BrandColors, e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-150"
                              />
                            </div>
                            <input 
                              type="text"
                              value={(brandData.brand_colors as any)[color.key] || ''}
                              onChange={(e) => updateColor(color.key as keyof BrandColors, e.target.value)}
                              className="w-full bg-transparent text-xs font-mono font-medium text-white outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40 py-12">
                   <Palette size={40} className="text-text-tertiary mb-2" />
                   <p className="text-sm font-semibold uppercase tracking-widest">Aguardando Logótipo</p>
                   <p className="text-xs text-text-tertiary max-w-[240px]">
                     Carregue o logo do seu negócio para que a IA possa extrair e salvar a sua identidade visual.
                   </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. PREFERENCES */}
        <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <h2 className="text-xl font-semibold text-white tracking-tight mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
               <SettingsIcon size={24} />
            </div>
            Preferências do Workspace
          </h2>
          
          <div className="flex flex-col gap-4 relative z-10">
            <label className="flex items-center justify-between p-5 rounded-[1.5rem] border border-border-subtle bg-black/20 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-tertiary group-hover:text-accent transition-colors">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm tracking-tight">Notificações por Email</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Receba atualizações sobre novas gerações finalizadas.</p>
                </div>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-bg-base appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-accent" defaultChecked />
                <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-5 rounded-full bg-border-subtle cursor-pointer"></label>
              </div>
            </label>

            <label className="flex items-center justify-between p-5 rounded-[1.5rem] border border-border-subtle bg-black/20 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-tertiary group-hover:text-accent transition-colors">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm tracking-tight">Sugestões de IA Avançadas</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Permitir que a IA sugira prompts baseados no seu estilo.</p>
                </div>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-bg-base appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-5 checked:border-accent" />
                <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-5 rounded-full bg-border-subtle cursor-pointer"></label>
              </div>
            </label>
          </div>
        </section>

        {/* Global Save Action */}
        <div className="flex items-center justify-between p-8 bg-accent/5 border border-accent/20 rounded-[2.5rem] gap-6">
           <div className="hidden md:block">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest">Confirmar Configuração</p>
              <p className="text-[11px] text-text-tertiary mt-1 font-medium">Toda a sua identidade visual será guardada e aplicada às próximas gerações.</p>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={handleSaveSettings}
                disabled={saving || analyzing || !brandData}
                className="flex-1 md:flex-none px-12 py-4 rounded-2xl font-semibold uppercase text-[11px] tracking-widest bg-accent text-black hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(255,184,0,0.2)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> GUARDANDO...
                  </>
                ) : (
                  <>
                    <Save size={18} /> GUARDAR ALTERAÇÕES
                  </>
                )}
              </button>
           </div>
        </div>

      </div>
      
      {/* Custom CSS for toggle switches */}
      <style dangerouslySetInnerHTML={{__html: `
        .toggle-checkbox:checked {
          right: 0;
          border-color: #FFB800;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #FFB800;
        }
      `}} />
    </div>
  );
}

const CheckCircle2 = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const Bot = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
