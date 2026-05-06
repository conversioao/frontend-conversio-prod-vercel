import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Users, Bot, User, Loader2, Paperclip, Smile } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface ConversationModalProps {
  contact: any;
  onClose: () => void;
}

export function ConversationModal({ contact, onClose }: ConversationModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [contact.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/agent/contacts/${contact.id}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const res = await apiFetch(`/agent/contacts/${contact.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage })
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl h-full max-h-[800px] bg-[#0D0D0D] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {contact.profile_pic_url ? (
                <img src={contact.profile_pic_url} className="w-full h-full object-cover" />
              ) : (
                <Users className="text-white/20" size={20} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">{contact.display_name || 'Desconhecido'}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">+{contact.whatsapp_number}</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e71a7a313901917564129bb23.png')] bg-repeat bg-opacity-5"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">A recuperar histórico...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/20 text-xs font-bold uppercase tracking-widest">
              Nenhuma mensagem trocada ainda.
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-[2rem] p-5 relative group ${
                  msg.direction === 'inbound' 
                    ? 'bg-white/5 border border-white/10 rounded-bl-none' 
                    : 'bg-[#FFB800] text-black font-medium rounded-br-none shadow-[0_10px_30px_rgba(255,184,0,0.2)]'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  <div className={`flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-wider ${
                    msg.direction === 'inbound' ? 'text-white/20' : 'text-black/40'
                  }`}>
                    {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    
                    {msg.direction === 'outbound' && (
                      <div className="flex items-center gap-1">
                        • {msg.message_type === 'human' ? (
                          <span className="flex items-center gap-1"><User size={10}/> Humano</span>
                        ) : (
                          <span className="flex items-center gap-1"><Bot size={10}/> Agente IA</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <button type="button" className="p-3 hover:bg-white/5 rounded-xl transition-all text-white/20 hover:text-white">
              <Paperclip size={20} />
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escreve uma resposta manual..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[#FFB800]/50 transition-all"
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all">
                <Smile size={20} />
              </button>
            </div>

            <button 
              type="submit" 
              disabled={!newMessage.trim() || sending}
              className="p-4 bg-[#FFB800] hover:bg-[#E6A600] disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl transition-all shadow-[0_10px_20px_rgba(255,184,0,0.2)]"
            >
              {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            </button>
          </form>
          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em] mt-4 text-center">
            Ao responder manualmente, o Agente IA será pausado para este contacto até nova ordem.
          </p>
        </div>
      </div>
    </div>
  );
}
