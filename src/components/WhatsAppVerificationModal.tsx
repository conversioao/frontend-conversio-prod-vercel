import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle2, AlertCircle, RefreshCcw, ArrowRight, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface WhatsAppVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  phoneNumber: string;
  tempToken?: string;
}

const WhatsAppVerificationModal: React.FC<WhatsAppVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  onVerified,
  phoneNumber,
  tempToken
}) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    setStatus('loading');
    setError('');
    
    try {
      const res = await apiFetch('/auth/verify-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tempToken ? { 'Authorization': `Bearer ${tempToken}` } : {})
        },
        body: JSON.stringify({ phoneNumber, code })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus('success');
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1500);
      } else {
        setStatus('error');
        setError(data.message || 'Código incorreto ou expirado');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setStatus('error');
      setError('Erro de conexão. Tente novamente.');
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    
    setResending(true);
    try {
      const res = await apiFetch('/auth/resend-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tempToken ? { 'Authorization': `Bearer ${tempToken}` } : {})
        },
        body: JSON.stringify({ phoneNumber })
      });
      
      const data = await res.json();
      if (data.success) {
        setTimer(60); // 1 minuto de cooldown
        setCode('');
      } else {
         setError(data.message || 'Erro ao reenviar o código.');
      }
    } catch (err) {
       setError('Erro de conexão ao tentar reenviar.');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFB800]/5 blur-[100px] rounded-full" />

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center border border-white/10">
              <Phone className="w-8 h-8 text-[#FFB800]" />
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tighter text-white text-center mb-2 leading-tight">Verifique o seu WhatsApp</h2>
          <p className="text-white/40 text-[15px] font-medium text-center mb-8 leading-relaxed">
            Enviamos um código de 6 dígitos para o número <span className="text-[#FFB800] font-bold">{phoneNumber}</span>
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={code[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val) {
                        const newCode = code.split('');
                        newCode[i] = val;
                        const finalCode = newCode.join('').slice(0, 6);
                        setCode(finalCode);
                        if (i < 5 && val) {
                           // focus next? handle via refs if needed, keeping it simple for now
                        }
                      } else {
                        const newCode = code.split('');
                        newCode[i] = '';
                        setCode(newCode.join(''));
                      }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !code[i] && i > 0) {
                            const newCode = code.split('');
                            newCode[i-1] = '';
                            setCode(newCode.join(''));
                        }
                    }}
                    className="w-12 h-14 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-[#FFB800]/50 focus:bg-[#FFB800]/[0.02] transition-all focus:ring-4 focus:ring-[#FFB800]/10"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm font-medium justify-center animate-shake">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {status === 'success' && (
                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-sm font-medium justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                  WhatsApp verificado! Redirecionando...
                </div>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || status === 'loading' || status === 'success'}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black font-black py-4 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-[#FFB800] transition-all flex justify-center items-center gap-2 group text-[15px]"
            >
              {status === 'loading' ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verificar Código
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className="w-full text-white/40 hover:text-[#FFB800] text-sm font-bold transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <RefreshCcw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {timer > 0 ? `Reenviar em ${timer}s` : 'Não recebi o código'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WhatsAppVerificationModal;
