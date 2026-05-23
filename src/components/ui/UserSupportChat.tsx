import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles, Clock, Minus, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, BASE_URL } from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function UserSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `user_${Date.now()}`);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! Sou o Carlos, do suporte da Conversio AI. Como posso ajudar-te hoje?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessage(false);
    }
  }, [messages, isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/support/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}`
        },
        body: JSON.stringify({
          message: userMsg.content,
          sessionId,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        setMessages(prev => [...prev, {
          id: `agent_${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        }]);
        if (!isOpen || isMinimized) setHasNewMessage(true);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Epa, tive um problema na ligação. Podes repetir?',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="w-[380px] h-[520px] bg-[#0a0b0d] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl pointer-events-auto mb-2"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255,184,0,0.05)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-black/40 to-[#FFB800]/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center">
                    <Bot size={20} className="text-[#FFB800]" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0b0d]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Suporte Conversio</h3>
                  <p className="text-[10px] text-white/40 flex items-center gap-1">Carlos · Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={14} className="text-[#FFB800]/70" />
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#FFB800] text-black font-medium rounded-tr-none shadow-lg shadow-[#FFB800]/10' 
                        : 'bg-white/5 text-white/80 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-[#FFB800]/70" />
                  </div>
                  <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-2xl rounded-tl-none flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1 h-1 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-2xl p-2 px-3 focus-within:border-[#FFB800]/30 transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escreve aqui..."
                  className="flex-1 bg-transparent text-white/90 placeholder:text-white/20 text-xs outline-none py-1"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-[#FFB800] text-black flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`pointer-events-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl relative group overflow-hidden transition-all duration-500 ${
          isOpen && !isMinimized ? 'bg-white/5 text-white/30' : 'bg-[#FFB800] text-black'
        }`}
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        {isOpen && !isMinimized ? <X size={24} /> : <MessageCircle size={24} />}
        
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-bg-base rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
