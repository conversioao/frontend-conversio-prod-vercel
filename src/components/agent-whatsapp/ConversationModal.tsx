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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl h-[600px] bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
              {contact.profile_pic_url ? (
                <img src={contact.profile_pic_url} className="w-full h-full object-cover" />
              ) : (
                <Users className="text-zinc-600" size={16} />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{contact.display_name || 'Anónimo'}</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-medium text-zinc-500">+{contact.whatsapp_number}</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-lg transition-all text-zinc-600 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-950"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Syncing history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-700 text-[10px] font-bold uppercase tracking-widest">
              Empty conversation
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 relative ${
                  msg.direction === 'inbound' 
                    ? 'bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-bl-none' 
                    : 'bg-amber-500 text-black font-medium rounded-br-none shadow-lg shadow-amber-500/10'
                }`}>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  <div className={`flex items-center gap-2 mt-1.5 text-[9px] font-bold uppercase tracking-wider ${
                    msg.direction === 'inbound' ? 'text-zinc-600' : 'text-black/50'
                  }`}>
                    {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    
                    {msg.direction === 'outbound' && (
                      <div className="flex items-center gap-1">
                        • {msg.message_type === 'human' ? 'Manual' : 'AI Agent'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send a message..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-700"
              />
            </div>

            <button 
              type="submit" 
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black rounded-xl transition-all shadow-lg shadow-amber-500/10"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-3 text-center">
            Manual intervention pauses the AI for this contact.
          </p>
        </div>
      </div>
    </div>
  );
}
