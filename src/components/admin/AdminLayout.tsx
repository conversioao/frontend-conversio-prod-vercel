import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Shield, ChevronRight, BarChart2, ShieldAlert, Megaphone, History, Box, Layers, ShieldCheck, TrendingUp, Bot, MessageSquare, ExternalLink, Sparkles, Layout, Activity, Server, X } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminPayments } from './AdminPayments';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminSettings } from './AdminSettings';
import { AdminPlans } from './AdminPlans';
import { AdminModeration } from './AdminModeration';
import { AdminBroadcasts } from './AdminBroadcasts';
import { AdminAudit } from './AdminAudit';
import { AdminModels } from './AdminModels';
import { AdminFinancial } from './AdminFinancial';
import AdminCRM from './AdminCRM';
import AdminOrchestrator from './AdminOrchestrator';
import AdminEngineMonitor from './AdminEngineMonitor';
import AdminWhatsAppControl from './AdminWhatsAppControl';
import AdminWhatsAppLeads from './AdminWhatsAppLeads';
import { AdminAgentsPanel } from './AdminAgentsPanel';
import { AdminMediaManager } from './AdminMediaManager';
import AdminCostCenter from './AdminCostCenter';
import { AdminBankSettings } from './AdminBankSettings';
import { AdminWhatsAppAgents } from './AdminWhatsAppAgents';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api';

interface AdminLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: any;
}

export function AdminLayout({ currentPage, onNavigate, onLogout, user }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const handleOpenMonitor = () => onNavigate('admin-agents');
    window.addEventListener('open-monitor-dashboard', handleOpenMonitor);
    return () => window.removeEventListener('open-monitor-dashboard', handleOpenMonitor);
  }, [onNavigate]);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${BASE_URL}/monitor/alerts`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('conversio_token')}` }
        });
        const data = await res.json();
        if (data.success) {
          setAlertCount(data.alerts.filter((a: any) => a.status === 'active').length);
        }
      } catch (e) {
        console.error('Error fetching alerts for badge:', e);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Check alerts every minute
    return () => clearInterval(interval);
  }, []);
  const navItems = [
    { id: 'admin-dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'admin-agents-panel', icon: <Sparkles size={20} />, label: 'Painel de Agentes' },
    { id: 'admin-agents', icon: <Bot size={20} />, label: 'Orquestrador' },
    { id: 'admin-engine-monitor', icon: <Server size={20} />, label: 'Motor de Geração' },
    { id: 'admin-users', icon: <Users size={20} />, label: 'CRM Usuários' },
    { id: 'admin-payments', icon: <CreditCard size={20} />, label: 'Pagamentos' },
    { id: 'admin-analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { id: 'admin-financial', icon: <TrendingUp size={20} />, label: 'Financeiro' },
    { id: 'admin-plans', icon: <Box size={20} />, label: 'Gestão Pacotes' },
    { id: 'admin-leads', icon: <Layers size={20} />, label: 'Leads WhatsApp' },
    { id: 'admin-whatsapp-agents', icon: <Bot size={20} />, label: 'Agentes WhatsApp' },
    { id: 'admin-whatsapp', icon: <MessageSquare size={20} />, label: 'Controlo WhatsApp' },
    { id: 'admin-media', icon: <Layout size={20} />, label: 'Gestão de Mídias' },
    { id: 'admin-cost-center', icon: <ShieldCheck size={20} />, label: 'Centro de Custo' },
    { id: 'admin-bank-settings', icon: <CreditCard size={20} />, label: 'Contas Bancárias' },
    { id: 'admin-settings', icon: <Settings size={20} />, label: 'Configurações' },
    { id: 'marketing-agents', icon: <Megaphone size={20} />, label: 'Gerador de Marketing' },
    { id: 'home', icon: <Shield size={20} />, label: 'Modo Usuário' },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'admin-dashboard':
      case 'admin-stats': return <AdminDashboard />;
      case 'admin-agents': 
      case 'admin-engine-monitor':
      case 'admin-users':
      case 'admin-media':
      case 'admin-agents-panel':
      case 'admin-whatsapp-agents':
      case 'admin-cost-center': return <AdminDashboard />; // Render dashboard behind the fullscreen overlays
      case 'admin-payments': return <AdminPayments />;
      case 'admin-analytics': return <AdminAnalytics />;
      case 'admin-financial': return <AdminFinancial />;
      case 'admin-plans': return <AdminPlans />;
      case 'admin-moderation': return <AdminModeration />;
      case 'broadcasts': return <AdminBroadcasts />;
      case 'models': return <AdminModels />;
      case 'audit': return <AdminAudit />;
      case 'admin-leads': return <AdminWhatsAppLeads />;
      case 'admin-whatsapp': return <AdminWhatsAppControl />;
      case 'admin-bank-settings': return <AdminBankSettings />;
      case 'admin-settings': return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex selection:bg-accent/30 selection:text-text-primary text-text-primary overflow-hidden">
      
      {/* HUD DASHBOARD OVERLAYS */}
      <AnimatePresence>
        {currentPage === 'admin-agents' && (
          <AdminOrchestrator onClose={() => onNavigate('admin-dashboard')} />
        )}
        {currentPage === 'admin-engine-monitor' && (
          <AdminEngineMonitor onClose={() => onNavigate('admin-dashboard')} />
        )}
        {currentPage === 'admin-users' && (
          <AdminCRM onClose={() => onNavigate('admin-dashboard')} />
        )}
        {currentPage === 'admin-agents-panel' && (
          <AdminAgentsPanel onClose={() => onNavigate('admin-dashboard')} />
        )}
        {currentPage === 'admin-cost-center' && (
          <AdminCostCenter onClose={() => onNavigate('admin-dashboard')} />
        )}
        {currentPage === 'admin-media' && (
          <div className="fixed inset-0 z-[80] bg-[#050706] text-white flex flex-col font-sans animation-fade-in overflow-y-auto custom-scrollbar">
             <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-3xl shrink-0">
               <div className="flex items-center gap-3">
                  <Layout className="text-[#FFB800]" size={32} />
                  <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Media Center</h1>
               </div>
               <button onClick={() => onNavigate('admin-dashboard')} className="p-3 bg-white/5 hover:bg-white/10 text-text-tertiary rounded-xl transition-all">
                  <X size={24} />
               </button>
             </div>
             <AdminMediaManager />
          </div>
        )}
        {currentPage === 'admin-whatsapp-agents' && (
          <AdminWhatsAppAgents onClose={() => onNavigate('admin-dashboard')} />
        )}
      </AnimatePresence>

      {/* Sidebar Admin */}
      <aside className={`fixed inset-y-0 left-0 bg-surface/80 backdrop-blur-2xl border-r border-border-subtle z-50 transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'} flex flex-col shadow-2xl md:shadow-none overflow-hidden group/sidebar`}>
        <div className={`p-6 border-b border-border-subtle relative overflow-hidden flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
           <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFB800]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
           
           {!isCollapsed && (
             <h1 className="flex items-center gap-2 relative z-10 cursor-pointer" onClick={() => window.location.href = '/'}>
                <img src="/logo.png" alt="Conversio.Admin" className="h-8 w-auto object-contain" />
                <span className="text-xs font-black bg-accent/20 text-accent px-2 py-1 rounded-md ml-1 tracking-widest uppercase">Admin</span>
             </h1>
           )}

           {isCollapsed && (
             <img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain relative z-10" />
           )}

           <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 bg-bg-base border border-border-subtle rounded-lg text-text-tertiary hover:text-[#FFB800] transition-all z-20"
           >
              <Layout size={14} className={isCollapsed ? 'rotate-180' : ''} />
           </button>
        </div>
        
        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-6'} space-y-2 overflow-y-auto custom-scrollbar`}>
           {!isCollapsed && <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-4 ml-2">Menu Principal</p>}
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => {
                   if (item.id === 'marketing-agents') {
                       window.open('/conversio-agents-marketing.html', '_blank');
                   } else {
                       onNavigate(item.id);
                   }
                   setIsSidebarOpen(false);
               }}
               title={isCollapsed ? item.label : ''}
               className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-5'} py-4 rounded-2xl transition-all font-bold text-sm group relative ${
                 currentPage === item.id 
                   ? 'bg-[#FFB800] text-black shadow-[0_10px_20px_rgba(255,184,0,0.2)]' 
                   : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
               }`}
             >
               <span className={`${currentPage === item.id ? 'text-black' : 'text-text-tertiary group-hover:text-[#FFB800]'} transition-colors`}>
                 {item.icon}
               </span>
               
               {!isCollapsed && (
                 <>
                   <span className="truncate">{item.label}</span>
                   {item.id === 'admin-agents' && alertCount > 0 && (
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-surface animate-pulse shadow-lg shadow-red-500/20">
                       {alertCount}
                     </span>
                   )}
                   {currentPage === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                 </>
               )}

               {isCollapsed && item.id === 'admin-agents' && alertCount > 0 && (
                 <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white border border-surface shadow-lg">
                   {alertCount}
                 </span>
               )}
             </button>
           ))}
        </nav>

        <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-t border-border-subtle bg-bg-base/30`}>
           <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-6 px-2`}>
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-[#FFB800] to-yellow-200 border-2 border-surface flex items-center justify-center text-black font-black text-xs shadow-sm">
                {user?.name?.substring(0,2).toUpperCase() || 'AD'}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-text-primary truncate">{user?.name || 'Administrador'}</span>
                  <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> Sistema
                  </span>
                </div>
              )}
           </div>
           <button 
              onClick={onLogout} 
              title={isCollapsed ? 'Sair do Painel' : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-5'} py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm border border-transparent hover:border-red-500/20`}
           >
              <LogOut size={18} />
              {!isCollapsed && <span>Sair do Painel</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isCollapsed ? 'md:ml-20' : 'md:ml-72'} bg-bg-base relative min-h-screen overflow-y-auto transition-all duration-300`}>
         {/* Background Ornaments */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFB800]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

         {/* Mobile Header */}
         <div className="md:hidden sticky top-0 bg-surface/80 backdrop-blur-md z-40 flex items-center justify-between p-6 border-b border-border-subtle">
             <div className="flex items-center gap-2" onClick={() => window.location.href = '/'}>
               <img src="/logo.png" alt="Conversio.Admin" className="h-7 w-auto object-contain" />
               <span className="text-[10px] font-black bg-accent/20 text-accent px-1.5 py-0.5 rounded ml-1 uppercase">Admin</span>
             </div>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-bg-base border border-border-subtle rounded-xl text-[#FFB800]">
                <LayoutDashboard size={20} />
             </button>
         </div>

         <div className="p-8 lg:p-12 relative z-10">
             <div className="max-w-6xl mx-auto">
                 {renderContent()}
             </div>
         </div>
      </main>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in transition-all" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
