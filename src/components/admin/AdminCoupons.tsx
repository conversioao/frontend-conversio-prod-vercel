import React, { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Calendar, Percent, Zap, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: 0,
    credits_bonus: 0,
    expires_at: '',
    max_uses: 100
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/coupons?adminId=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const adminId = JSON.parse(localStorage.getItem('conversio_user') || '{}').id;
      const res = await apiFetch(`/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCoupon, adminId })
      });
      const data = await res.json();
      if (data.success) {
        setNewCoupon({
          code: '',
          discount_type: 'percent',
          discount_value: 0,
          credits_bonus: 0,
          expires_at: '',
          max_uses: 100
        });
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-text-tertiary animate-pulse font-black uppercase tracking-widest text-sm">Gerando Códigos Promocionais...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
             <Ticket size={32} className="text-[#FFB800]" /> Gestão de Cupões
          </h1>
          <p className="text-text-secondary text-sm font-medium">Cria campanhas de marketing com descontos e bónus de créditos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Creator Card */}
         <div className="lg:col-span-1 bg-surface border border-border-subtle rounded-[2.5rem] p-8 shadow-sm h-fit">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-wider mb-8 flex items-center gap-2">
               <Plus size={20} className="text-[#FFB800]" /> Novo Cupão
            </h3>
            <form onSubmit={handleCreate} className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Código do Cupão</label>
                  <input 
                    type="text" 
                    placeholder="Ex: KAIZEN2024"
                    className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-sm font-bold text-text-primary uppercase tracking-widest focus:outline-none focus:border-[#FFB800]/50"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Tipo Desconto</label>
                    <select 
                      className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-xs font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                      value={newCoupon.discount_type}
                      onChange={(e) => setNewCoupon({...newCoupon, discount_type: e.target.value})}
                    >
                       <option value="percent">Percentagem (%)</option>
                       <option value="fixed">Fixo (Kz)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Valor</label>
                    <input 
                      type="number" 
                      className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                      value={newCoupon.discount_value}
                      onChange={(e) => setNewCoupon({...newCoupon, discount_value: Number(e.target.value)})}
                    />
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Bónus de Créditos (Opcional)</label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB800]" size={16} />
                    <input 
                      type="number" 
                      className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 pl-12 text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                      value={newCoupon.credits_bonus}
                      onChange={(e) => setNewCoupon({...newCoupon, credits_bonus: Number(e.target.value)})}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Expira em</label>
                    <input 
                      type="date" 
                      className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-xs font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                      value={newCoupon.expires_at}
                      onChange={(e) => setNewCoupon({...newCoupon, expires_at: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">Limite de Usos</label>
                    <input 
                      type="number" 
                      className="w-full bg-bg-base border border-border-subtle rounded-xl p-4 text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFB800]/50"
                      value={newCoupon.max_uses}
                      onChange={(e) => setNewCoupon({...newCoupon, max_uses: Number(e.target.value)})}
                    />
                  </div>
               </div>

               <button 
                 type="submit"
                 disabled={creating || !newCoupon.code}
                 className="w-full py-5 bg-[#FFB800] text-black font-black text-sm uppercase tracking-widest rounded-3xl shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {creating ? <RefreshCw size={18} className="animate-spin" /> : <Ticket size={18} />}
                  Criar Cupão
               </button>
            </form>
         </div>

         {/* Coupons List */}
         <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2 ml-4">
               <h3 className="text-lg font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw size={20} className="text-text-tertiary" /> Cupões Ativos
               </h3>
               <span className="text-[10px] font-black text-[#FFB800] bg-[#FFB800]/10 px-3 py-1 rounded-full border border-[#FFB800]/20 tracking-widest">
                  Total: {coupons.length}
               </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {coupons.map((coupon) => (
                 <motion.div 
                   key={coupon.id} 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-surface border border-border-subtle rounded-[2rem] p-6 relative overflow-hidden group shadow-sm"
                 >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                       <Ticket size={80} className="text-[#FFB800]" />
                    </div>
                    
                    <div className="flex items-start justify-between mb-6">
                       <div className="px-5 py-2.5 bg-bg-base border border-border-subtle rounded-2xl">
                          <p className="text-xl font-black text-[#FFB800] tracking-widest font-mono">{coupon.code}</p>
                       </div>
                       <button className="p-2 text-text-tertiary hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Percent size={14} className="text-text-tertiary" />
                             <span className="text-xs font-bold text-text-primary">
                                {coupon.discount_value}{coupon.discount_type === 'percent' ? '%' : ' Kz'} Desconto
                             </span>
                          </div>
                          {coupon.credits_bonus > 0 && (
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md">
                                <Zap size={10} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-500">+{coupon.credits_bonus} CRÉDITOS</span>
                             </div>
                          )}
                       </div>

                       <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                             <span className="text-text-tertiary uppercase tracking-widest">Uso Global</span>
                             <span className="text-text-primary">{coupon.uses_count} / {coupon.max_uses}</span>
                          </div>
                          <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-subtle/50">
                             <div 
                               className="h-full bg-[#FFB800] rounded-full" 
                               style={{ width: `${Math.min(100, (coupon.uses_count / coupon.max_uses) * 100)}%` }}
                             ></div>
                          </div>
                       </div>

                       <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                          <p className="text-[10px] font-bold text-text-tertiary flex items-center gap-1.5">
                             <Calendar size={12} /> {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Sem Expiração'}
                          </p>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${coupon.uses_count < coupon.max_uses ? 'text-emerald-500' : 'text-red-500'}`}>
                             {coupon.uses_count < coupon.max_uses ? 'Ativo' : 'Esgotado'}
                          </span>
                       </div>
                    </div>
                 </motion.div>
               ))}
               
               {coupons.length === 0 && (
                 <div className="md:col-span-2 p-12 text-center bg-bg-base/30 border border-dashed border-border-subtle rounded-[2rem] text-text-tertiary italic text-sm">Nenhum cupão configurado.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
