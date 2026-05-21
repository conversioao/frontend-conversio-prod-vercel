import React, { useState, useEffect } from 'react';
import { Users, User, Zap, Target, MessageCircle, Search, Filter, MessageSquare, UserCheck, Star, Clock, ExternalLink, Loader2, ArrowRight, ShoppingCart, TrendingUp, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { FunnelKanban } from '../../components/agent-whatsapp/FunnelKanban';
import { ConversationModal } from '../../components/agent-whatsapp/ConversationModal';

export function CRMPanel({ onClose, onNavigateToLead, adminMode }: { onClose?: () => void, onNavigateToLead?: (id: string) => void, adminMode?: boolean }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instances, setInstances] = useState<any[]>([]);

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
      const [contactsRes, ordersRes, agentsRes] = await Promise.all([
        apiFetch(`/agent/contacts${adminMode ? '?admin_leads=true' : ''}`),
        apiFetch('/agent/orders'),
        adminMode ? apiFetch('/admin/whatsapp/pentagon-agents') : Promise.resolve({ json: () => ({ success: false }) })
      ]);
      
      const contactsData = await contactsRes.json();
      const ordersData = await ordersRes.json();
      const agentsData = await (agentsRes as any).json();
      
      if (contactsData.success) setContacts(contactsData.contacts);
      if (ordersData.success) setOrders(ordersData.orders);
      if (agentsData.success) setInstances(agentsData.agents.filter((a: any) => ['venda', 'sistema'].includes(a.slug)));
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
    <div className="max-w-7xl mx-auto py-6 px-8 space-y-8 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Sales CRM Intelligence</h1>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-zinc-500 text-[11px] mt-1 font-medium uppercase tracking-wider">Automated Leads & Sales Flow</p>
        </div>

        <div className="flex items-center gap-3">
          {adminMode && instances.length > 0 && (
            <div className="flex items-center gap-2 mr-4 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-1.5">
              {instances.map(inst => (
                <div key={inst.id} className="flex items-center gap-2 px-2 border-r last:border-0 border-zinc-800">
                  <span className={`w-1.5 h-1.5 rounded-full ${inst.whatsapp_state === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{inst.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input 
              type="text" 
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:border-amber-500/50 outline-none transition-all placeholder:text-zinc-700 font-medium"
            />
          </div>
          <button 
            onClick={fetchAll}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-95"
          >
            <Loader2 className={loading ? 'animate-spin' : ''} size={16} />
          </button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 transition-all active:scale-95"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Area */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: <Users size={16} /> },
          { label: 'Hot Deals', value: stats.hot, icon: <Zap size={16} /> },
          { label: 'Conversion', value: `${stats.conversion}%`, icon: <TrendingUp size={16} /> },
          { label: 'Revenue', value: `${stats.totalSales.toLocaleString()} Kz`, icon: <ShoppingCart size={16} /> },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-amber-500 transition-colors">
                {stat.icon}
              </div>
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Live</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white tracking-tight">{stat.value}</h3>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Funnel Kanban */}
        <div className="col-span-2 space-y-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <Target className="text-amber-500" size={16} />
                        Pipeline Operacional
                    </h2>
                </div>
                
                {loading && contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest italic">Syncing...</p>
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
                            if (onNavigateToLead) {
                                onNavigateToLead(contact.id);
                            } else {
                                setSelectedContact(contact);
                                setIsModalOpen(true);
                            }
                        }}
                    />
                )}
            </div>

            {/* Leads Table */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <Users className="text-amber-500" size={16} />
                        Contact Management
                    </h2>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest focus:border-amber-500/50 outline-none transition-all"
                    >
                        <option value="all">All</option>
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
                            <tr className="bg-zinc-900/50">
                                <th className="px-6 py-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Lead Info</th>
                                <th className="px-6 py-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Activity</th>
                                <th className="px-6 py-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                            {filteredContacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-zinc-900/30 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative">
                                                {contact.profile_pic_url ? (
                                                    <img src={contact.profile_pic_url} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <User className="text-zinc-700" size={16} />
                                                )}
                                                {contact.needs_human && (
                                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-bold text-white group-hover:text-amber-500 transition-all tracking-tight">{contact.display_name || 'Anónimo'}</div>
                                                <div className="text-[9px] font-medium text-zinc-600">+{contact.whatsapp_number}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                                            contact.status === 'hot' ? 'text-orange-500 border-orange-500/20' :
                                            contact.status === 'closed' ? 'text-emerald-500 border-emerald-500/20' :
                                            contact.status === 'negotiation' ? 'text-blue-500 border-blue-500/20' :
                                            'text-zinc-500 border-zinc-800'
                                        }`}>
                                            {contact.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                            <Clock size={10} />
                                            {new Date(contact.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => onNavigateToLead ? onNavigateToLead(contact.id) : (setSelectedContact(contact), setIsModalOpen(true))}
                                                className="p-2.5 text-zinc-600 hover:text-white transition-all"
                                            >
                                                <MessageSquare size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleTakeover(contact.id)}
                                                className={`p-2.5 rounded-lg border transition-all ${
                                                    contact.needs_human ? 'bg-amber-500 border-amber-500 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-white'
                                                }`}
                                            >
                                                <UserCheck size={14} />
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

        {/* Sidebar: Recent Sales */}
        <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
                    <ShoppingCart className="text-amber-500" size={16} />
                    Recent Sales
                </h2>
                
                <div className="space-y-3">
                    {orders.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-zinc-700 text-[9px] font-bold uppercase tracking-widest italic">No sales recorded</p>
                        </div>
                    ) : (
                        orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-amber-500/20 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">ID {order.id.toString().slice(-4)}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest ${
                                        order.status === 'confirmed' ? 'text-emerald-500' : 'text-zinc-500'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <h4 className="text-[11px] font-bold text-white group-hover:text-amber-500 transition-colors truncate">{order.product_name}</h4>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="text-[11px] font-bold text-white">{parseFloat(order.price).toLocaleString()} Kz</div>
                                    <span className="text-[9px] font-medium text-zinc-600 truncate max-w-[80px]">{order.display_name}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {orders.length > 0 && (
                    <button className="w-full mt-6 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
                        View History
                    </button>
                )}
            </div>
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
      
        {isModalOpen && selectedContact && !onNavigateToLead && (
          <ConversationModal 
            contact={selectedContact} 
            adminMode={adminMode}
            onClose={() => {
              setIsModalOpen(false);
              fetchAll();
            }} 
          />
        )}
      </div>
    );
  }


