import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, Phone } from 'lucide-react';
import { api } from '../lib/api';

interface LoginScreenProps {
  onLogin: () => void;
  onNavigate: (page: string) => void;
}

export function LoginScreen({ onLogin, onNavigate }: LoginScreenProps) {
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!whatsapp || whatsapp.length !== 9) {
        throw new Error('Insira um número de WhatsApp válido (9 dígitos).');
      }

      const res = await api.post('/auth/login', { 
        whatsapp: `+244${whatsapp}`, 
        password 
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Credenciais inválidas.');
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

  return (
    <div className="login-screen-container">
      <div className="splash-grid-bg" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="login-logo">CONVERSIO<span>.</span></div>
          <h1 className="login-title">Bem-vindo de volta</h1>
          <p className="login-subtitle">Entra na tua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label>WhatsApp</label>
            <div className="input-wrapper">
              <span className="prefix">+244</span>
              <input 
                type="tel" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="9xx xxx xxx"
                required
              />
              <Phone className="input-icon" size={18} />
            </div>
          </div>

          <div className="input-group">
            <label>Palavra-passe</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Lock className="input-icon" size={18} />
              <button 
                type="button" 
                className="eye-button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            <button type="button" onClick={() => {}}>Esqueceste a senha?</button>
          </div>

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>A entrar...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>ou</span>
        </div>

        <button 
          type="button" 
          className="register-button"
          onClick={() => onNavigate('auth')}
        >
          Criar uma conta nova
        </button>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-screen-container {
          position: fixed; inset: 0;
          background: #0A0A0A;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          z-index: 100;
          overflow-y: auto;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #111111;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 32px;
          position: relative;
          z-index: 1;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          font-size: 28px;
          font-weight: 900;
          color: #F5A623;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
        }
        .login-logo span { color: #F5A623; }

        .login-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-left: 4px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper input {
          width: 100%;
          background: #1A1A1A;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 14px 16px 14px 48px;
          color: white;
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #F5A623;
          background: #222222;
          box-shadow: 0 0 0 4px rgba(245, 166, 35, 0.1);
        }

        .input-wrapper .prefix {
          position: absolute;
          left: 16px;
          font-size: 14px;
          font-weight: 700;
          color: #F5A623;
          pointer-events: none;
          display: none; /* Only show for tel input if needed */
        }

        /* Special case for WhatsApp input with prefix */
        .input-group:nth-child(2) .input-wrapper input {
          padding-left: 85px;
        }
        .input-group:nth-child(2) .input-wrapper .prefix {
          display: block;
          border-right: 1px solid rgba(255,255,255,0.1);
          padding-right: 8px;
        }
        .input-group:nth-child(2) .input-wrapper .input-icon {
          left: auto;
          right: 16px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: rgba(255, 255, 255, 0.2);
          pointer-events: none;
        }

        .eye-button {
          position: absolute;
          right: 16px;
          color: rgba(255, 255, 255, 0.4);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .eye-button:hover { color: white; }

        .forgot-password {
          display: flex;
          justify-content: flex-end;
          margin-top: -8px;
        }

        .forgot-password button {
          background: none;
          border: none;
          color: #F5A623;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .login-button {
          background: #F5A623;
          color: #0A0A0A;
          border: none;
          border-radius: 14px;
          padding: 16px;
          font-size: 16px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .login-button:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .login-button:active { transform: scale(0.98); }
        .login-button:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
          color: rgba(255, 255, 255, 0.15);
        }

        .login-divider::before, .login-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: currentColor;
        }

        .login-divider span {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .register-button {
          width: 100%;
          background: transparent;
          border: 1px solid #F5A623;
          color: #F5A623;
          border-radius: 14px;
          padding: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .register-button:hover { background: rgba(245, 166, 35, 0.05); }

        .error-banner {
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.2);
          color: #ff6666;
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
      `}} />
    </div>
  );
}
