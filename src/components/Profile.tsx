import React, { useState, useEffect, useRef } from 'react';
import { Save, User, Mail, Shield, Key, Camera, Loader2, Image as ImageIcon, Upload, Check, X, Phone } from 'lucide-react';
import { api, apiFetch } from '../lib/api';
import { getUserPlan, PLANS } from '../utils/planUtils';

export function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [togglingNotifications, setTogglingNotifications] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const localUser = JSON.parse(localStorage.getItem('conversio_user') || '{}');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/user/profile`);
      const data = (await res.json()) as any;
      if (data.success) {
        setUserData(data.user);
        setName(data.user.name);
        setWhatsapp(data.user.whatsapp || '');
        setBrandLogoUrl(data.user.brand_logo_url || '');
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post('/user/profile/update', {
        name, 
        brandLogoUrl,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      const data = (await res.json()) as any;
      
      if (data.success) {
        setUserData(data.user);
        localStorage.setItem('conversio_user', JSON.stringify(data.user));
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        // Dispatch event to update Topbar/Sidebar
        window.dispatchEvent(new Event('storage'));
      } else {
        setMessage({ type: 'error', text: data.message || 'Erro ao atualizar perfil' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await apiFetch(`/user/upload-avatar`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
         setUserData({ ...userData, avatar_url: data.avatarUrl });
         setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
         window.dispatchEvent(new Event('storage'));
      } else {
         setMessage({ type: 'error', text: data.message || 'Erro ao carregar avatar.' });
      }
    } catch (error) {
       setMessage({ type: 'error', text: 'Erro no upload.' });
    } finally {
       setUploadingAvatar(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('PNG')) {
      setMessage({ type: 'error', text: 'Apenas ficheiros PNG com fundo transparente.' });
      return;
    }

    setUploadingLogo(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await apiFetch(`/user/upload-logo`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
         setBrandLogoUrl(data.logoUrl);
         setMessage({ type: 'success', text: 'Logótipo da marca carregado!' });
      } else {
         setMessage({ type: 'error', text: data.message || 'Erro no upload.' });
      }
    } catch (error) {
       setMessage({ type: 'error', text: 'Erro no upload.' });
    } finally {
       setUploadingLogo(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setTogglingNotifications(true);
    try {
      const res = await apiFetch('/user/notifications/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (data.success) {
        setUserData({ ...userData, whatsapp_notifications_enabled: enabled });
        // Update local storage too
        const newUser = { ...localUser, whatsapp_notifications_enabled: enabled };
        localStorage.setItem('conversio_user', JSON.stringify(newUser));
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erro ao alterar notificações.' });
    } finally {
      setTogglingNotifications(false);
    }
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center h-96 gap-4">
         <Loader2 className="animate-spin text-[#FFB800]" size={48} />
         <p className="text-text-tertiary font-medium animate-pulse">Carregando perfil...</p>
       </div>
     );
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight mb-2 uppercase italic">Meu Perfil</h1>
          <p className="text-text-secondary font-medium">Personalize sua experiência na Conversio AI.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 border border-border-subtle rounded-full cursor-default">
             <Shield size={14} className="text-[#FFB800]" />
             <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Acesso Ilimitado</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 border border-border-subtle rounded-full cursor-default opacity-60">
             <Shield size={14} className="text-text-tertiary" />
             <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{userData?.role || 'User'} Account</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 shadow-lg ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
             {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          </div>
          <p className="font-bold text-sm tracking-wide">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col gap-10">
        
        {/* 1. PERSONAL INFO SECTION */}
        <section className="bg-surface/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFB800]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#FFB800]/10 transition-colors"></div>
          
          <div className="flex flex-col md:flex-row gap-12 relative z-10">
            {/* Avatar Section */}
            <div className="flex flex-col items-center shrink-0">
               <div className="relative group/avatar">
                  <div className={`w-36 h-36 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${uploadingAvatar ? 'border-[#FFB800] animate-pulse' : 'border-white/10 group-hover/avatar:border-[#FFB800] group-hover/avatar:scale-105'}`}>
                    <img 
                      src={userData?.avatar_url || `https://ui-avatars.com/api/?name=${name || 'User'}&background=FFB800&color=000&bold=true&length=1`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-[#FFB800]" size={32} />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-[#FFB800] text-black shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-4 border-[#0A0A0A] z-20"
                  >
                    <Camera size={20} />
                  </button>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
               </div>
               <div className="mt-6 text-center">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{name || 'Usuário'}</h3>
                  <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-[0.2em] mt-1">{whatsapp || 'Número Indisponível'}</p>
               </div>
            </div>

            {/* Form Fields & Notifications */}
            <div className="flex-1 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest pl-1">Nome de Exibição</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-[#FFB800] transition-colors">
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-[#FFB800]/50 focus:ring-4 focus:ring-[#FFB800]/5 transition-all outline-none"
                        placeholder="Seu nome"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest pl-1">WhatsApp Registado</label>
                    <div className="relative group border border-white/5 rounded-2xl bg-black/20">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary">
                        <Phone size={18} />
                      </div>
                      <input 
                        type="tel" 
                        value={whatsapp}
                        readOnly
                        className="w-full bg-transparent py-4 pl-12 pr-4 text-white/50 font-bold outline-none cursor-not-allowed"
                        placeholder="+244 xxx xxx xxx"
                      />
                    </div>
                  </div>
               </div>

               {/* WhatsApp Notifications Toggle */}
               {true && (
                 <div className="p-6 bg-[#FFB800]/5 rounded-3xl border border-[#FFB800]/20 flex items-center justify-between group/wa hover:bg-[#FFB800]/10 transition-colors">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center shrink-0 border border-[#FFB800]/20 group-hover/wa:scale-105 transition-transform">
                          <Phone size={24} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white uppercase tracking-tight">Notificações no WhatsApp</p>
                          <p className="text-[10px] text-text-tertiary font-medium">Receba um aviso assim que as gerações terminarem.</p>
                       </div>
                    </div>
                    <button
                      onClick={() => handleToggleNotifications(!userData?.whatsapp_notifications_enabled)}
                      disabled={togglingNotifications}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${userData?.whatsapp_notifications_enabled ? 'bg-[#FFB800]' : 'bg-white/10'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${userData?.whatsapp_notifications_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      {togglingNotifications && (
                        <div className="absolute inset-x-0 -bottom-6 flex justify-center">
                          <Loader2 size={10} className="animate-spin text-[#FFB800]" />
                        </div>
                      )}
                    </button>
                 </div>
               )}

               <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                     <Shield size={24} />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-white">Status da Conta: Verificada</p>
                     <p className="text-xs text-text-tertiary font-medium">Benefícios do nível {PLANS[getUserPlan(userData)].name} ativos.</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* 2. BRANDING & LOGO */}
        {true && (
          <section className="bg-surface/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                     <ImageIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Identidade Visual (Branding)</h2>
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-1">Gerações personalizadas com a sua marca.</p>
                  </div>
               </div>
            </div>
            
            <div className="bg-bg-base/50 p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-10">
               <div className={`shrink-0 w-32 h-32 md:w-40 md:h-40 bg-surface rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${brandLogoUrl ? 'border-accent/30 p-4' : 'border-white/10'}`}>
                  {brandLogoUrl ? (
                    <img src={brandLogoUrl} className="max-w-full max-h-full object-contain" alt="Logo" />
                  ) : (
                    <ImageIcon size={40} className="text-text-tertiary opacity-20" />
                  )}
               </div>
               
               <div className="flex-1 space-y-4">
                  <p className="text-sm text-text-secondary leading-relaxed">Carregue o seu logótipo em <span className="font-bold text-white">PNG transparente</span> para que os Agentes Conversio possam integrá-lo automaticamente nas gerações Premium.</p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase text-white hover:bg-white hover:text-black transition-all flex items-center gap-2"
                    >
                      {uploadingLogo ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} 
                      {brandLogoUrl ? 'Trocar Logótipo' : 'Carregar Logótipo'}
                    </button>
                    {brandLogoUrl && (
                       <button onClick={() => setBrandLogoUrl('')} className="px-6 py-3 rounded-xl text-xs font-black uppercase text-red-400 hover:text-red-300 transition-colors">Remover</button>
                    )}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/png" onChange={handleLogoUpload} />
               </div>
            </div>
          </section>
        )}

        {/* 2. SECURITY & PASSWORD */}
        <section className="bg-surface/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 text-[#FFB800] flex items-center justify-center border border-[#FFB800]/20">
                <Key size={24} />
             </div>
             <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Segurança da Conta</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest pl-1">Senha Atual</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-[#FFB800]/50 focus:ring-4 focus:ring-[#FFB800]/5 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest pl-1">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-[#FFB800]/50 focus:ring-4 focus:ring-[#FFB800]/5 transition-all outline-none"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>
        </section>


        {/* GLOBAL ACTIONS */}
        <div className="flex items-center justify-between p-8 bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-[2rem] gap-6">
           <div className="hidden md:block">
              <p className="text-xs font-bold text-[#FFB800] uppercase tracking-widest">Atenção ao Salvar</p>
              <p className="text-[10px] text-text-tertiary mt-1">Ao salvar, toda a sua sessão será atualizada para refletir as novas credenciais e identidade.</p>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 md:flex-none px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-text-tertiary hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Resetar
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={saving || !name}
                className="flex-1 md:flex-none px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-[#FFB800] text-black hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(255,184,0,0.3)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} /> SALVAR ALTERAÇÕES
                  </>
                )}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
