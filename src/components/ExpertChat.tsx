import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, MessageSquare, TrendingUp, Megaphone, Lightbulb, Loader2, Eraser } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export function ExpertChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem('conversio_user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      setInitialLoading(true);
      const res = await api.get(`/expert/history?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/expert/chat', { userId: user.id, message: text });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpa, tive um problema ao processar a tua mensagem. Podes tentar novamente?' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { label: 'Estratégia para Instagram em Luanda', icon: <Megaphone size={14} /> },
    { label: 'Ideias de anúncios para sapatos', icon: <Lightbulb size={14} /> },
    { label: 'Como vender no WhatsApp em Angola', icon: <MessageSquare size={14} /> },
    { label: 'Tendências de Marketing 2024', icon: <TrendingUp size={14} /> }
  ];

  if (initialLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="animate-spin text-[#FFB800] mb-4" size={40} />
        <p className="text-text-tertiary font-black uppercase tracking-widest animate-pulse italic">
          Chamando o Especialista...
        </p>
      </div>
    );
  }

  return (
    <div className="relative p-[2px] rounded-[2.5rem] h-[calc(100vh-140px)] w-full max-w-4xl mx-auto overflow-hidden shadow-[0_0_50px_rgba(255,184,0,0.15)] group transition-shadow duration-500 hover:shadow-[0_0_80px_rgba(255,184,0,0.2)]">
      {/* Gemini-Style Animated Gradient Border */}
      <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_150deg,#FFB800_200deg,transparent_360deg)] opacity-60 transition-opacity duration-700 group-hover:opacity-100 mix-blend-screen pointer-events-none" />
      
      {/* Inner Chat Container */}
      <div className="relative flex flex-col h-full bg-surface rounded-[calc(2.5rem-2px)] overflow-hidden z-10 border border-black/50">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFB800]/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-border-subtle bg-bg-base/30 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FFB800] p-[1px]">
             <div className="w-full h-full rounded-2xl bg-bg-base flex items-center justify-center text-[#FFB800]">
                <Bot size={24} strokeWidth={1.5} />
             </div>
          </div>
          <div>
            <h2 className="font-black text-text-primary text-lg leading-tight">Especialista Sénior</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Marketing Angola • Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="p-3 rounded-xl bg-bg-base border border-border-subtle text-text-tertiary hover:text-red-500 transition-all shadow-sm group">
              <Eraser size={18} />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
               className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8"
            >
               <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#FFB800]/20 to-transparent flex items-center justify-center text-[#FFB800]">
                  <Sparkles size={48} />
               </div>
               <div>
                 <h3 className="text-xl font-black text-white mb-3">Consultoria de Marketing Instantânea</h3>
                 <p className="text-sm text-text-tertiary font-medium leading-relaxed">
                   Olá! Sou o teu consultor especializado no mercado angolano. Como posso ajudar o teu negócio a escalar hoje?
                 </p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {suggestions.map((s, i) => (
                    <button 
                       key={i}
                       onClick={() => handleSend(s.label)}
                       className="p-4 bg-bg-base border border-border-subtle rounded-2xl text-left hover:border-[#FFB800]/50 transition-all group"
                    >
                       <div className="text-[#FFB800] mb-2">{s.icon}</div>
                       <p className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">{s.label}</p>
                    </button>
                  ))}
               </div>
            </motion.div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                    msg.role === 'user' ? 'bg-bg-base border-border-subtle text-text-tertiary' : 'bg-[#FFB800] border-[#FFB800] text-black'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-5 rounded-2xl shadow-sm text-sm font-medium leading-[1.6] ${
                    msg.role === 'user' 
                      ? 'bg-bg-base border border-border-subtle text-text-primary rounded-tr-none' 
                      : 'bg-[#FFB800]/10 border border-[#FFB800]/20 text-text-primary rounded-tl-none'
                  }`}>
                    {msg.content.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-4 items-center bg-[#FFB800]/5 p-5 border border-[#FFB800]/10 rounded-2xl italic text-xs text-text-tertiary">
                 <Loader2 size={14} className="animate-spin text-[#FFB800]" />
                 Pensando na melhor estratégia...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border-subtle bg-bg-base/30 backdrop-blur-md z-10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center gap-4 bg-bg-base border border-border-subtle rounded-2xl p-2 pr-4 focus-within:border-[#FFB800]/50 transition-all shadow-lg"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Qual é o teu próximo mambo criativo? Pergunta aqui..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-text-primary placeholder-text-tertiary p-3"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-3 rounded-xl transition-all shadow-sm flex items-center justify-center ${
              input.trim() && !loading ? 'bg-[#FFB800] text-black hover:scale-105 active:scale-95' : 'bg-surface text-text-tertiary opacity-50 cursor-not-allowed border border-border-subtle'
            }`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-center gap-2">
           <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary/60">
             Power by GPT-4o-Mini • Optimized for Angola Market
           </p>
        </div>
        </div>
      </div>
    </div>
  );
}
