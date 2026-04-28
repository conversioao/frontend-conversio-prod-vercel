import { apiFetch } from '../lib/api';

export interface WhatsAppAgentConfig {
  url: string;
  key: string;
  instance: string;
  active: boolean;
  brainUrl?: string;
  webhookUrl?: string;
}

export const whatsappAgentService = {
  async getConfig(): Promise<WhatsAppAgentConfig> {
    const res = await apiFetch('/admin/configs/whatsapp-agent');
    if (!res.ok) throw new Error('Falha ao obter configurações');
    const data = await res.json();
    
    return {
      url: data.config.agent_evolution_url || '',
      key: data.config.agent_evolution_key || '',
      instance: data.config.agent_evolution_instance || '',
      active: data.config.agent_evolution_active === 'true',
      brainUrl: data.config.agent_brain_url || '',
      webhookUrl: data.webhookUrl || ''
    };
  },

  async saveConfig(config: WhatsAppAgentConfig): Promise<void> {
    const res = await apiFetch('/admin/configs/whatsapp-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao guardar configurações');
    }
  },

  async testConnection(config: Pick<WhatsAppAgentConfig, 'url' | 'key' | 'instance'>): Promise<{state: string, qr: string | null}> {
    const res = await apiFetch('/admin/configs/whatsapp-agent/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao testar conexão');
    }
    const data = await res.json();
    return { state: data.state, qr: data.qr };
  },

  async createInstance(config: Pick<WhatsAppAgentConfig, 'url' | 'key' | 'instance'>): Promise<void> {
    const res = await apiFetch('/admin/configs/whatsapp-agent/create-instance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao criar instância');
    }
  }
};
