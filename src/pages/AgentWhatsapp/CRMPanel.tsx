import React, { useState, useEffect } from 'react';
import { Users, User, Zap, Target, MessageCircle, Search, Filter, MessageSquare, UserCheck, Star, Clock, ExternalLink, Loader2, ArrowRight, ShoppingCart, TrendingUp } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { FunnelKanban } from '../../components/agent-whatsapp/FunnelKanban';
import { ConversationModal } from '../../components/agent-whatsapp/ConversationModal';

export function CRMPanel() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    
    // Polling as fallback for real-time
    const interval = setInterval(fetchAll, 10000);
    
    // Custom event listener for SSE updates
    const handleRealtimeUpdate = (e: any) => {
      if (e.detail?.type === 'agent_message' || e.detail?.type === 'agent_order') {
        fetchAll();
      }
    };
    
    window.addEventListener('agent_update', handleRealtimeUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('agent_update', handleRealtimeUpdate);
    };
  }, []);

  const fetchAll = async () => {
    try {
      if (contacts.length === 0) setLoading(true);
      const [contactsRes, ordersRes] = await Promise.all([
        apiFetch('/agent/contacts'),
        apiFetch('/agent/orders')
      ]);
      
      const contactsData = await contactsRes.json();
      const ordersData = await ordersRes.json();
      
      if (contactsData.success) setContacts(contactsData.contacts);
      if (ordersData.success) setOrders(ordersData.orders);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeover = async (id: number) => {
    try {
      await apiFetch(`/agent/contacts/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'negotiation' })
      });
      
      await apiFetch(`/agent/contacts/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Olá! Sou um atendente humano e estou a assumir esta conversa para te dar um suporte mais personalizado. Como posso ajudar?' })
      });

      fetchAll();
    } catch (err) {
      console.error('Error taking over:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiFetch(`/agent/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAll();
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const stats = {
    total: contacts.length,
    hot: contacts.filter(c => c.status === 'hot').length,
    conversion: contacts.length > 0 ? ((contacts.filter(c => c.status === 'closed').length / contacts.length) * 100).toFixed(1) : 0,
    totalSales: orders.filter(o => o.status === 'confirmed').reduce((acc, o) => acc + (parseFloat(o.price) || 0), 0)
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = (c.display_name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                         c.whatsapp_number.includes(search);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Sales CRM IA</h1>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-white/40 text-sm mt-2 font-medium">Gestão inteligente de leads e fecho de vendas automatizado</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Procurar lead por nome ou tel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-[#FFB800]/50 outline-none transition-all placeholder:text-white/10"
            />
          </div>
          <button 
            onClick={fetchAll}
            className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <Loader2 className={loading ? 'animate-spin' : ''} size={20} />
          </button>
        </div>
      </div>

      {/* Metrics Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Leads', value: stats.total, icon: <Users size={20} />, color: 'from-blue-500/20' },
          { label: 'Oportunidades Quentes', value: stats.hot, icon: <Zap size={20} />, color: 'from-orange-500/20' },
          { label: 'Taxa de Conversão', value: `${stats.conversion}%`, icon: <TrendingUp size={20} />, color: 'from-emerald-500/20' },
          { label: 'Volume de Vendas', value: `${stats.totalSales.toLocaleString()} Kz`, icon: <ShoppingCart size={20} />, color: 'from-purple-500/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0D0D0D] border border-white/[0.04] rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/20 transition-all shadow-2xl">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all group-hover:scale-150`} />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="p-3.5 bg-white/[0.03] rounded-2xl text-white/60 group-hover:text-[#FFB800] transition-colors border border-white/5">
                {stat.icon}
              </div>
              <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Tempo Real</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Funnel Kanban (Takes 2 columns) */}
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[3rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FFB800]/10 rounded-xl flex items-center justify-center">
                            <Target className="text-[#FFB800]" size={20} />
                        </div>
                        Funil de Vendas Automatizado
                    </h2>
                </div>
                
                {loading && contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-[#FFB800] animate-spin" />
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Sincronizando funil...</p>
                    </div>
                ) : (
                    <FunnelKanban 
                        contacts={contacts} 
                        onMove={(id, status) => {
                            setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
                            apiFetch(`/agent/contacts/${id}/status`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status })
                            });
                        }}
                        onView={(contact) => {
                            setSelectedContact(contact);
                            setIsModalOpen(true);
                        }}
                    />
                )}
            </div>

            {/* Leads Table */}
            <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Users className="text-blue-500" size={20} />
                        </div>
                        Gestão de Contactos
                    </h2>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest focus:border-[#FFB800]/50 outline-none transition-all"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="cold">Frio</option>
                        <option value="warm">Morno</option>
                        <option value="hot">Quente</option>
                        <option value="negotiation">Negociação</option>
                        <option value="closed">Fechado</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Lead</th>
                                <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest">Actividade</th>
                                <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredContacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-white/[0.02] transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                                                {contact.profile_pic_url ? (
                                                    <img src={contact.profile_pic_url} className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <Users className="text-white/20" size={20} />
                                                )}
                                                {contact.needs_human && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0D0D0D] animate-pulse" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-white group-hover:text-[#FFB800] transition-all">{contact.display_name || 'Anónimo'}</div>
                                                <div className="text-[10px] font-bold text-white/20">+{contact.whatsapp_number}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${
                                            contact.status === 'hot' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                            contact.status === 'closed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            contact.status === 'negotiation' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            'bg-white/5 text-white/30 border-white/10'
                                        }`}>
                                            {contact.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                            <Clock size={12} />
                                            {new Date(contact.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => { setSelectedContact(contact); setIsModalOpen(true); }}
                                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all active:scale-95"
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleTakeover(contact.id)}
                                                className={`p-3 border border-white/10 rounded-xl transition-all active:scale-95 ${
                                                    contact.needs_human ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' : 'bg-white/5 text-white/40 hover:bg-[#FFB800] hover:text-black'
                                                }`}
                                            >
                                                <UserCheck size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Sidebar: Recent Orders & Alerts */}
        <div className="space-y-8">
            <div className="bg-[#0D0D0D] border border-white/[0.04] rounded-[3rem] p-8 shadow-2xl">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="text-purple-500" size={20} />
                    </div>
                    Vendas Recentes
                </h2>
                
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="py-12 text-center">
                            <ShoppingCart className="mx-auto text-white/5 mb-3" size={32} />
                            <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">Nenhuma venda registada</p>
                        </div>
                    ) : (
                        orders.slice(0, 10).map((order) => (
                            <div key={order.id} className={`p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group ${
                                order.status === 'confirmed' ? 'border-emerald-500/30' : 
                                order.status === 'rejected' ? 'border-red-500/30 opacity-50' : ''
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest">Pedido #{order.id.toString().slice(-4)}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                            order.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                            order.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-bold text-white/20">{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                                <h4 className="text-sm font-black text-white group-hover:text-[#FFB800] transition-colors">{order.product_name}</h4>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="text-[10px] font-bold text-white/30">Qtd: {order.quantity}</div>
                                    <div className="text-lg font-black text-white">{parseFloat(order.price).toLocaleString()} Kz</div>
                                </div>

                                {order.status === 'pending' && (
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                            className="py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Confirmar
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                                            className="py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Recusar
                                        </button>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                                        <User size={12} className="text-white/20" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40">{order.display_name}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {orders.length > 0 && (
                    <button className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
                        Ver Todo o Histórico
                    </button>
                )}
            </div>

            {/* Pro Tips / Status */}
            <div className="bg-gradient-to-br from-[#FFB800] to-[#E6A600] rounded-[3rem] p-8 text-black relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <h3 className="text-xl font-black uppercase tracking-tight mb-2 relative z-10">Dica Pro</h3>
                <p className="text-xs font-bold leading-relaxed opacity-80 relative z-10">
                    O teu Agente IA move automaticamente os leads para "Quente" quando detecta interesse real em produtos do catálogo.
                </p>
                <div className="mt-6 flex items-center gap-2 relative z-10">
                    <div className="px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                        Saber mais
                    </div>
                </div>
            </div>
        </div>
      </div>

      {isModalOpen && selectedContact && (
        <ConversationModal 
          contact={selectedContact} 
          onClose={() => {
            setIsModalOpen(false);
            fetchAll();
          }} 
        />
      )}
    </div>
  );
}


