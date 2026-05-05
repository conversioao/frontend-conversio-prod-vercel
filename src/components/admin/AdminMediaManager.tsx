import React, { useState, useEffect } from 'react';
import { 
  CloudUpload, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  RefreshCw, 
  Layout, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';

interface MediaSlot {
  id: number;
  slot_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  description: string;
  updated_at: string;
}

export function AdminMediaManager() {
  const [slots, setSlots] = useState<MediaSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/landing-media');
      const data = await res.json();
      if (data.success) {
        setSlots(data.media);
      }
    } catch (err) {
      showToast('Erro ao carregar mídias da landing page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleFileUpload = async (slotId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(slotId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/landing-media/${slotId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('conversio_token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Mídia atualizada para o slot: ${slotId}`);
        fetchSlots();
      } else {
        showToast(data.message || 'Erro no upload.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão ao carregar mídia.', 'error');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB800]/20 border-t-[#FFB800] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 pb-20">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <Layout className="text-[#FFB800]" size={32} />
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">LANDING_MEDIA_CMS</h1>
           </div>
           <p className="text-text-tertiary text-sm font-medium tracking-wide">Administre as imagens e vídeos da página inicial sem mexer no código.</p>
        </div>
        <button 
          onClick={fetchSlots}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar Lista
        </button>
      </header>

      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {slots.map(slot => (
          <div key={slot.id} className="group relative bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col hover:border-[#FFB800]/30 transition-all duration-500 shadow-xl">
             
             {/* Preview Area */}
             <div className="aspect-video relative bg-black/40 overflow-hidden flex items-center justify-center">
                {slot.media_type === 'video' ? (
                  <video 
                    src={slot.media_url} 
                    className="w-full h-full object-cover" 
                    muted 
                    loop 
                    onMouseEnter={e => e.currentTarget.play()}
                    onMouseLeave={e => {e.currentTarget.pause(); e.currentTarget.currentTime = 0;}}
                  />
                ) : (
                  <img src={slot.media_url} className="w-full h-full object-cover" alt={slot.description} />
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <a href={slot.media_url} target="_blank" rel="noreferrer" className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                      <Eye size={20} />
                   </a>
                </div>

                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white/70 border border-white/10 uppercase tracking-widest">
                   {slot.media_type === 'video' ? <Video size={10} className="inline mr-1" /> : <ImageIcon size={10} className="inline mr-1" />} 
                   {slot.slot_id}
                </div>
             </div>

             {/* Content Area */}
             <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-white font-bold text-lg mb-1 leading-tight">{slot.slot_id.replace(/_/g, ' ').toUpperCase()}</h3>
                <p className="text-text-tertiary text-xs mb-6 flex-1">{slot.description}</p>
                
                <div className="flex gap-3">
                   <div className="flex-1 relative">
                      <input 
                        type="file" 
                        id={`file-${slot.slot_id}`}
                        className="hidden"
                        accept={slot.media_type === 'video' ? 'video/*' : 'image/*'}
                        onChange={(e) => handleFileUpload(slot.slot_id, e)}
                        disabled={uploading === slot.slot_id}
                      />
                      <label 
                        htmlFor={`file-${slot.slot_id}`}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFB800] text-black rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-[1.02] transition-all shadow-lg active:scale-95 ${uploading === slot.slot_id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                         {uploading === slot.slot_id ? <RefreshCw size={14} className="animate-spin" /> : <CloudUpload size={14} />} 
                         {uploading === slot.slot_id ? 'A enviar...' : 'Carregar Nova'}
                      </label>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>

    </div>
  );
}
