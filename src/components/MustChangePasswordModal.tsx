import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';

interface MustChangePasswordModalProps {
  onSuccess: () => void;
}

export function MustChangePasswordModal({ onSuccess }: MustChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Usamos a rota normal de perfil ou uma específica para reset obrigatório
      const res = await api.post('/auth/force-change-password', { new_password: newPassword });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erro ao alterar senha.');
      
      // Atualizar user no localStorage para remover flag
      const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');
      user.must_change_password = false;
      localStorage.setItem('conversio_user', JSON.stringify(user));
      
      setIsDone(true);
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%', maxWidth: '420px', background: '#111111',
          border: '1px solid rgba(255,184,0,0.2)', borderRadius: '24px',
          padding: '40px', boxShadow: '0 0 100px rgba(255,184,0,0.1)'
        }}
      >
        {!isDone ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px',
                background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <ShieldAlert size={32} color="#FFB800" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>Alteração Obrigatória</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Por segurança, deve definir uma nova senha permanente antes de aceder ao painel.
              </p>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', borderRadius: '12px', padding: '12px',
                fontSize: '13px', fontWeight: 600, marginBottom: '24px'
              }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nova Senha"
                  required
                  style={{
                    width: '100%', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '14px 48px 14px 48px', color: 'white',
                    fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#FFB800'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar Nova Senha"
                  required
                  style={{
                    width: '100%', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '14px 14px 14px 48px', color: 'white',
                    fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#FFB800'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                style={{
                  width: '100%', background: '#FFB800', color: '#000',
                  border: 'none', borderRadius: '14px', padding: '15px',
                  fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Guardar e Aceder ao Painel'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}
            >
              <CheckCircle2 size={40} color="#22c55e" />
            </motion.div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Senha Atualizada!</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>A entrar no painel...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
