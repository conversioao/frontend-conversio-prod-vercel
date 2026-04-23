import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useAgentsDashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const safeJson = async (res: Response) => {
        if (res.ok) {
            try { return await res.json(); } catch(e) { return {}; }
        }
        return {};
      };

      const [logsRes] = await Promise.all([
        api.get('/admin/agents/logs')
      ]);

      const [logsData] = await Promise.all([
        safeJson(logsRes)
      ]);

      if (logsData.success) setLogs(logsData.logs || []);
      
      // Cleanup unused state defaults to avoid rendering errors if accessed
      setAgents([]);
      setMetrics([]);
      setAlerts([]);
      setCampaigns([]);
      setConfigs([]);
      setReports([]);

      setError(null);
    } catch (err: any) {
      console.error('[Dashboard Hook] Error fetching data:', err);
      setError('Falha ao sincronizar dados dos agentes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Polling 30s
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Actions
  const toggleAgent = async (agentName: string, status: 'active' | 'paused') => {
    const endpoint = status === 'active' ? `/orchestrator/pause/${agentName}` : `/orchestrator/resume/${agentName}`;
    const res = await api.post(endpoint, {});
    if (res.ok) fetchAllData();
  };

  const runAgentNow = async (agentName: string) => {
    const res = await api.post(`/orchestrator/run/${agentName}`, {});
    return res.ok;
  };

  const resolveAlert = async (alertId: number, action: 'acknowledge' | 'resolve') => {
    const res = await api.post(`/monitor/alerts/${alertId}/${action}`, {});
    if (res.ok) fetchAllData();
  };

  const saveConfig = async (configId: number, data: any) => {
    const res = await api.put(`/admin/agents/config/${configId}`, data);
    if (res.ok) fetchAllData();
  };

  return {
    agents,
    metrics,
    alerts,
    logs,
    campaigns,
    configs,
    reports,
    loading,
    error,
    refresh: fetchAllData,
    toggleAgent,
    runAgentNow,
    resolveAlert,
    saveConfig
  };
}
