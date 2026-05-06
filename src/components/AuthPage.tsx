import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Mail, Lock, User, Command, Chrome, Apple, AlertCircle, Loader2, Phone } from 'lucide-react';
import { api } from '../lib/api';
import WhatsAppVerificationModal from './WhatsAppVerificationModal';

interface AuthPageProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

export function AuthPage({ onLogin, onNavigate }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [videoSrc, setVideoSrc] = useState<string>('/videos/video_demo.mp4');

  React.useEffect(() => {
     fetch('/api/public/landing-media')
         .then(r => r.json())
         .then(data => {
             if (data.success && data.media) {
                 const found = data.media.find((m: any) => m.slot_id === 'login_video');
                 if (found && found.media_url) {
                     setVideoSrc(found.media_url);
                 }
             }
         })
         .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!whatsapp || whatsapp.length !== 9 || !/^\d+$/.test(whatsapp)) {
        throw new Error('O WhatsApp deve ter exatamente 9 dígitos numéricos.');
      }

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { whatsapp: `+244${whatsapp}`, password } 
        : { name, password, whatsapp: `+244${whatsapp}` };
      
      const res = await api.post(endpoint, body);
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erro de autenticação. Verifica os dados.');
      }
      
      if (!isLogin) {
        // If registration, show WhatsApp verification modal first
        setTempUserData(data);
        setShowVerification(true);
        return;
      }

      localStorage.setItem('conversio_token', data.token);
      localStorage.setItem('conversio_user', JSON.stringify(data.user));
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Social login removed as per request

  const handleTestLogin = () => {
     // Omit Auth
     localStorage.setItem('conversio_token', 'test_token');
     localStorage.setItem('conversio_user', JSON.stringify({ name: 'Tester', role: 'user' }));
     onLogin();
  };

  return (
    <div className="flex min-h-screen bg-[#050508] font-sans text-white overflow-hidden selection:bg-[#FFB800]/30 selection:text-white">
      {/* Left Column: Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 md:px-24 relative z-10 overflow-y-auto min-h-screen custom-scrollbar py-12">
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[400px] mx-auto flex flex-col my-auto"
        >
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => onNavigate('landing')}>
            <img src="/logo.png" alt="Conversio.AI" className="h-16 w-auto object-contain" />
          </div>

          <h2 className="text-2xl font-black tracking-tighter mb-3 leading-tight">
            {isLogin ? 'Bem-vindo de volta' : 'Comece a escalar'}
          </h2>
          <p className="text-white/40 text-[15px] mb-10 font-medium leading-relaxed">
            {isLogin ? 'Insira seus dados criativos para continuar operando.' : 'Milhares de criativos à distância de um clique. Sem design, sem gravações.'}
          </p>

          {/* Social login buttons removed */}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl flex items-center gap-2 font-medium mb-4">
                 <AlertCircle size={16} /> {error}
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                  exit={{ opacity: 0, height: 0, filter: 'blur(5px)' }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="relative group mb-4">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#FFB800] transition-colors" size={20} strokeWidth={1.5} />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} placeholder="Nome completo" className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#FFB800]/50 focus:bg-[#FFB800]/[0.02] transition-all text-sm font-medium focus:ring-4 focus:ring-[#FFB800]/10" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white/30 group-focus-within:text-[#FFB800] transition-colors border-r border-white/10 pr-3 mr-2">
                  <Phone size={20} strokeWidth={1.5} />
                  <span className="text-xs font-bold">+244</span>
              </div>
              <input 
                type="tel" 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 9))} 
                required
                placeholder="WhatsApp (9 dígitos)" 
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl py-4 pl-28 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#FFB800]/50 focus:bg-[#FFB800]/[0.02] transition-all text-sm font-medium focus:ring-4 focus:ring-[#FFB800]/10" 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#FFB800] transition-colors" size={20} strokeWidth={1.5} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Palavra-passe" className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-[#FFB800]/50 focus:bg-[#FFB800]/[0.02] transition-all text-sm font-medium focus:ring-4 focus:ring-[#FFB800]/10" />
              {isLogin && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFB800] text-xs font-bold cursor-pointer hover:underline">Esqueceu?</span>}
            </div>

            <button type="submit" disabled={isLoading} className="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black font-black py-4 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-[#FFB800] transition-all mt-4 flex justify-center items-center gap-2 group text-[15px]">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                <>{isLogin ? 'Fazer Login' : 'Criar Conta Gratuita'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>



          <p className="text-center text-sm text-white/40 mt-12 font-medium">
            {isLogin ? 'Ainda não é membro?' : 'Já faz parte da Conversio?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-white hover:text-[#FFB800] font-bold transition-colors">
              {isLogin ? 'Criar uma conta' : 'Fazer login'}
            </button>
          </p>
        </motion.div>
      </div>

      <WhatsAppVerificationModal 
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        phoneNumber={whatsapp.startsWith('+') ? whatsapp : `+244${whatsapp}`}
        tempToken={tempUserData?.token}
        onVerified={() => {
            if (tempUserData) {
                localStorage.setItem('conversio_token', tempUserData.token);
                localStorage.setItem('conversio_user', JSON.stringify(tempUserData.user));
                onLogin();
            }
        }}
      />

      {/* Right Column: Visual Showcase */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center overflow-hidden bg-[#0a0a0f] border-l border-white/[0.02]">
         {/* Dynamic Aurora Background */}
         <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(255,184,0,0.06)_0%,transparent_70%)] opacity-100" />
           <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute -top-[10%] -right-[10%] w-[800px] h-[800px] bg-gradient-to-tr from-[#FFB800]/10 to-transparent blur-[100px] rounded-full" />
           <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/5 to-transparent blur-[100px] rounded-full" />
           <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%270%200%20200%20200%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter%20id=%27noiseFilter%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.65%27%20numOctaves=%273%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27100%25%27%20height=%27100%25%27%20filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-[0.04] mix-blend-overlay"></div>
         </div>

         {/* Floating App Preview Grid */}
         <div className="relative w-full max-w-2xl aspect-square z-10 flex items-center justify-center">
            {/* Main Center UI Pseudo */}
            <motion.div 
               animate={{ y: [-15, 15, -15], rotateY: [-5, 5, -5], rotateX: [5, -5, 5] }}
               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               className="relative w-full max-w-[500px] bg-[#0d0d12]/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,1)] overflow-hidden"
               style={{ perspective: 2000 }}
            >
               <div className="h-12 border-b border-white/5 flex items-center px-5 gap-2 bg-white/5">
                 <div className="w-3 h-3 rounded-full bg-white/10"></div>
                 <div className="w-3 h-3 rounded-full bg-white/10"></div>
                 <div className="w-3 h-3 rounded-full bg-white/10"></div>
                 <div className="mx-auto text-[10px] text-white/30 uppercase tracking-widest font-black">AI Studio</div>
               </div>
               
               <div className="p-6">
                 <div className="w-full aspect-video rounded-xl overflow-hidden relative border border-white/5 bg-black/50 shadow-2xl">
                    <video 
                      src={videoSrc} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline 
                      className="w-full h-full object-cover opacity-80" 
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                       <div className="w-full flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-6 h-6 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(255,184,0,0.5)]"></div>
                           <div className="text-xs font-black text-white uppercase tracking-widest">IA EM OPERAÇÃO...</div>
                         </div>
                         <div className="text-[10px] font-black text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 rounded-full border border-[#FFB800]/20">LIVE DEMO</div>
                       </div>
                    </div>
                 </div>
               </div>
            </motion.div>
            
            {/* Floating badges */}
            <motion.div 
               animate={{ y: [-20, 20, -20] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-1/4 -right-12 bg-[#050508]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-20"
            >
               <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold border border-green-500/30">+34%</div>
               <div className="pr-2">
                  <div className="text-white font-bold text-sm">CTR Escalado</div>
                  <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider mt-0.5">Campanha Atual</div>
               </div>
            </motion.div>

            <motion.div 
               animate={{ y: [20, -20, 20] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
               className="absolute bottom-1/4 -left-12 bg-gradient-to-r from-[#FFB800]/20 to-yellow-600/10 backdrop-blur-xl border border-[#FFB800]/30 p-4 rounded-2xl shadow-[0_0_40px_rgba(255,184,0,0.15)] flex items-center gap-4 z-20"
            >
               <div className="w-12 h-12 rounded-xl bg-[#FFB800] flex items-center justify-center text-black shadow-inner">
                 <Sparkles size={20} />
               </div>
               <div className="pr-4">
                  <div className="text-white font-black text-sm">Criação Finalizada</div>
                  <div className="text-white/60 text-xs font-medium">10 UGC Videos prontos</div>
               </div>
            </motion.div>
            
            <motion.div 
               animate={{ y: [-10, 10, -10] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
               className="absolute -top-10 left-10 bg-[#050508]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-0"
            >
               <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
                 <User size={14} />
               </div>
               <div className="text-white/80 font-bold text-xs">Novo Lead: +$140</div>
            </motion.div>
         </div>
      </div>
    </div>
  );
}
