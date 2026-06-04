import { useEffect, useState } from 'react';
import { BASE_URL } from '../lib/api';

export function useAgentRealtime(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let sse: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    const connect = () => {
      const token = localStorage.getItem('conversio_token');
      const url = `${BASE_URL}/agent/realtime/stream?token=${token}`;
      
      sse = new EventSource(url);

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('[AgentRealtime] Connected to stream');
            retryCount = 0;
            return;
          }

          if (data.type === 'new_message') {
            if (data.direction === 'inbound') {
              setUnreadCount(prev => prev + 1);
            }
            // Dispatch global event for CRM components to refresh
            window.dispatchEvent(new CustomEvent('agent_update', { detail: data }));
            
            // Trigger toast via CustomEvent (if App handles it)
            window.dispatchEvent(new CustomEvent('agent_notification', { 
              detail: { 
                title: data.contactName || 'Nova Mensagem', 
                message: data.preview,
                type: 'message'
              } 
            }));
          }

          if (data.type === 'lead_updated') {
            window.dispatchEvent(new CustomEvent('agent_update', { detail: data }));
          }

          if (data.type === 'new_order_alert') {
            window.dispatchEvent(new CustomEvent('agent_notification', { 
              detail: { 
                title: '🎉 Nova Venda!', 
                message: `${data.productName} - ${data.totalValue} Kz`,
                type: 'order'
              } 
            }));
            window.dispatchEvent(new CustomEvent('agent_update', { detail: data }));
          }

          if (data.type === 'agent_error') {
             console.error('[AgentRealtime] Error:', data.error);
          }

        } catch (err) {
          console.error('[AgentRealtime] Error parsing event:', err);
        }
      };

      sse.onerror = (err) => {
        console.error('[AgentRealtime] SSE Error:', err);
        sse?.close();
        
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          console.log(`[AgentRealtime] Retrying in ${delay}ms...`);
          setTimeout(connect, delay);
          retryCount++;
        }
      };
    };

    connect();

    return () => {
      sse?.close();
    };
  }, [userId]);

  return { unreadCount, setUnreadCount };
}
