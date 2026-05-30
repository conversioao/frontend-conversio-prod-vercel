import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Shield, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { api } from '../lib/api';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
  onSuccess: () => void; // called after password reset → go to login/home
}

type Step = 'phone' | 'code' | 'password' | 'done';

export function ForgotPasswordPage({ onNavigate, onSuccess }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>('phone');
  const [whatsapp, setWhatsapp] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── STEP 1: Send code to WhatsApp ───────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (whatsapp.length !== 9 || !/^\d+$/.test(whatsapp)) {
      setError('Insira 9 dígitos numéricos válidos.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { whatsapp: `+244${whatsapp}` });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erro ao enviar código.');
      setSuccessMsg(data.message || 'Código enviado!');
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP 2: Verify code ─────────────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('O código deve ter 6 dígitos numéricos.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-code', { whatsapp: `+244${whatsapp}`, code });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Código inválido ou expirado.');
      
      // Auto-login after verification
      localStorage.setItem('conversio_token', data.accessToken);
      localStorage.setItem('conversio_user', JSON.stringify(data.user));
      
      // Notify parent and go home
      onSuccess(); // Redirects to home in App.tsx
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP 3: Reset password ───────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { reset_token: resetToken, new_password: newPassword });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erro ao alterar senha.');
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = { phone: 1, code: 2, password: 3, done: 4 };
  const currentStepNum = stepLabels[step] ?? 1;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#050508',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', zIndex: 100, overflow: 'auto'
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(circle, rgba(255,184,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%', maxWidth: '440px',
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '40px 36px',
          position: 'relative', zIndex: 1,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)'
        }}
      >
        {/* Back button */}
        <button
          onClick={() => step === 'phone' ? onNavigate('auth') : setStep(step === 'code' ? 'phone' : 'code')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            marginBottom: '28px', padding: 0, transition: 'color 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFB800')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        {/* Step Indicators */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3].map(n => (
            <div
              key={n}
              style={{
                flex: 1, height: '3px', borderRadius: '2px',
                background: currentStepNum > n ? '#FFB800' : currentStepNum === n ? '#FFB800' : 'rgba(255,255,255,0.1)',
                opacity: currentStepNum >= n ? 1 : 0.4,
                transition: 'background 0.3s, opacity 0.3s'
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'rgba(255,184,0,0.1)',
            border: '1px solid rgba(255,184,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {step === 'phone' && <Phone size={24} color="#FFB800" />}
            {step === 'code' && <Shield size={24} color="#FFB800" />}
            {step === 'password' && <Lock size={24} color="#FFB800" />}
            {step === 'done' && <CheckCircle2 size={24} color="#22c55e" />}
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {step === 'phone' && 'Recuperar Senha'}
            {step === 'code' && 'Confirmar Identidade'}
            {step === 'password' && 'Nova Senha'}
            {step === 'done' && 'Senha Alterada!'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {step === 'phone' && 'Insira o número de WhatsApp da sua conta. Enviaremos um código de verificação.'}
            {step === 'code' && `Código enviado para +244${whatsapp}. Verifique o seu WhatsApp.`}
            {step === 'password' && 'Escolha uma nova senha segura para a sua conta.'}
            {step === 'done' && 'A sua senha foi alterada com sucesso. Pode fazer login agora.'}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', borderRadius: '12px', padding: '12px 14px',
                fontSize: '13px', fontWeight: 600, marginBottom: '20px'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── STEP 1: Phone ─── */}
        {step === 'phone' && (
          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                Número WhatsApp
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{
                  position: 'absolute', left: '14px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '10px',
                  color: '#FFB800', fontSize: '14px', fontWeight: 800
                }}>
                  <Phone size={16} />
                  +244
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="9xx xxx xxx"
                  required
                  style={{
                    width: '100%', background: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '14px 14px 14px 105px',
                    color: 'white', fontSize: '15px', outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#FFB800'; e.target.style.boxShadow = '0 0 0 3px rgba(255,184,0,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || whatsapp.length !== 9}
              style={{
                width: '100%', background: '#FFB800', color: '#000',
                border: 'none', borderRadius: '14px', padding: '15px',
                fontSize: '15px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: isLoading || whatsapp.length !== 9 ? 'not-allowed' : 'pointer',
                opacity: isLoading || whatsapp.length !== 9 ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> A enviar...</> : <><span>Enviar Código via WhatsApp</span> <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* ─── STEP 2: Code ─── */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                Código de 6 Dígitos
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  style={{
                    width: '100%', background: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '14px 14px 14px 48px',
                    color: 'white', fontSize: '22px', fontWeight: 700,
                    letterSpacing: '0.3em', outline: 'none', textAlign: 'center',
                    transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#FFB800'; e.target.style.boxShadow = '0 0 0 3px rgba(255,184,0,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#FFB800', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '10px', padding: 0 }}
              >
                Não recebeu o código? Reenviar
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              style={{
                width: '100%', background: '#FFB800', color: '#000',
                border: 'none', borderRadius: '14px', padding: '15px',
                fontSize: '15px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: isLoading || code.length !== 6 ? 'not-allowed' : 'pointer',
                opacity: isLoading || code.length !== 6 ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> A verificar...</> : <><span>Verificar Código</span> <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* ─── STEP 3: New Password ─── */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                Nova Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  style={{
                    width: '100%', background: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '14px 48px 14px 48px',
                    color: 'white', fontSize: '15px', outline: 'none',
                    transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#FFB800'; e.target.style.boxShadow = '0 0 0 3px rgba(255,184,0,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                Confirmar Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  style={{
                    width: '100%', background: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '14px 14px 14px 48px',
                    color: 'white', fontSize: '15px', outline: 'none',
                    transition: 'all 0.2s', boxSizing: 'border-box',
                    borderColor: confirmPassword && newPassword !== confirmPassword ? 'rgba(239,68,68,0.5)' : undefined
                  }}
                  onFocus={e => { e.target.style.borderColor = '#FFB800'; e.target.style.boxShadow = '0 0 0 3px rgba(255,184,0,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = confirmPassword && newPassword !== confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>As senhas não coincidem</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              style={{
                width: '100%', background: '#FFB800', color: '#000',
                border: 'none', borderRadius: '14px', padding: '15px',
                fontSize: '15px', fontWeight: 800, marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: isLoading || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                opacity: isLoading || !newPassword || !confirmPassword ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> A alterar...</> : <><span>Alterar Senha</span> <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* ─── STEP 4: Done ─── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}
            >
              <CheckCircle2 size={40} color="#22c55e" />
            </motion.div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
              A sua senha foi alterada com sucesso. Pode fazer login com a sua nova senha agora.
            </p>
            <button
              onClick={() => onNavigate('auth')}
              style={{
                width: '100%', background: '#FFB800', color: '#000',
                border: 'none', borderRadius: '14px', padding: '15px',
                fontSize: '15px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <span>Fazer Login</span> <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Footer */}
        {step !== 'done' && (
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '24px' }}>
            Lembrou-se da senha?{' '}
            <button onClick={() => onNavigate('auth')} style={{ background: 'none', border: 'none', color: '#FFB800', fontWeight: 700, cursor: 'pointer', fontSize: '13px', padding: 0 }}>
              Fazer login
            </button>
          </p>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
