export const BASE_URL = (import.meta.env.VITE_API_URL || 'https://conversioai-conversio-ai-backend.odbegs.easypanel.host') + '/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('conversio_token');
    
    const headers: any = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        console.warn(`[apiFetch] 401 Unauthorized on ${url}. Token present: ${!!token}`);
    }

    // O tratamento de 401/403 é feito globalmente no window.fetch (main.tsx),
    // disparando o evento 'session-expired' para mostrar o modal sem recarregar a página.

    return response;
};

export const api = {
    get: (endpoint: string, options: RequestInit = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body: any, options: RequestInit = {}) => apiFetch(endpoint, { 
        ...options, 
        method: 'POST', 
        body: JSON.stringify(body) 
    }),
    put: (endpoint: string, body: any, options: RequestInit = {}) => apiFetch(endpoint, { 
        ...options, 
        method: 'PUT', 
        body: JSON.stringify(body) 
    }),
    delete: (endpoint: string, options: RequestInit = {}) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
