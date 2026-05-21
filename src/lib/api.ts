export const BASE_URL = (import.meta.env.VITE_API_URL || 'https://conversioai-conversio-ai-backend.odbegs.easypanel.host') + '/api';

// Timeout padrão de 25s — adequado para redes 4G lentas como Angola
const DEFAULT_TIMEOUT_MS = 25000;

// ─── STALE-WHILE-REVALIDATE CACHE ────────────────────────────────────────────
// Cache em memória para reduzir latência percebida em 4G
interface CacheEntry { data: Response; timestamp: number; }
const _cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000; // 30s — dados "frescos" durante navegação

function getCached(key: string): Response | null {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        _cache.delete(key);
        return null;
    }
    // Retornar clone para permitir múltiplos .json() calls
    return entry.data.clone();
}

function setCache(key: string, response: Response) {
    // Só cachear respostas de sucesso
    if (response.ok) {
        _cache.set(key, { data: response.clone(), timestamp: Date.now() });
    }
}

/** Invalida todas as entradas de cache que começam com o prefixo dado */
export function invalidateCache(prefix: string) {
    for (const key of _cache.keys()) {
        if (key.startsWith(prefix)) _cache.delete(key);
    }
}

// ─── CORE FETCH ───────────────────────────────────────────────────────────────
export const apiFetch = async (
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    useCache = false
): Promise<Response> => {
    const token = localStorage.getItem('conversio_token');

    const headers: any = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const cacheKey = url;

    // Tentar cache (apenas GET)
    if (useCache && (!options.method || options.method === 'GET')) {
        const cached = getCached(cacheKey);
        if (cached) {
            // Background revalidation (stale-while-revalidate)
            setTimeout(() => apiFetch(endpoint, options, timeoutMs, false).then(r => setCache(cacheKey, r)).catch(() => {}), 0);
            return cached;
        }
    }

    // AbortController para cancelar requests lentas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
            signal: controller.signal,
        });

        if (response.status === 401) {
            console.warn(`[apiFetch] 401 Unauthorized on ${url}. Token present: ${!!token}`);
        }

        // Guardar em cache se aplicável
        if (useCache && (!options.method || options.method === 'GET')) {
            setCache(cacheKey, response);
            return response.clone();
        }

        return response;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error('O pedido demorou demasiado. Verifique a sua ligação e tente novamente.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
};

// O tratamento de 401/403 é feito globalmente no window.fetch (main.tsx),
// disparando o evento 'session-expired' para mostrar o modal sem recarregar a página.

export const api = {
    // GET com cache automático (stale-while-revalidate)
    get: (endpoint: string, options: RequestInit = {}, cached = false) =>
        apiFetch(endpoint, { ...options, method: 'GET' }, DEFAULT_TIMEOUT_MS, cached),

    // GET com cache explícito
    getCached: (endpoint: string, options: RequestInit = {}) =>
        apiFetch(endpoint, { ...options, method: 'GET' }, DEFAULT_TIMEOUT_MS, true),

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

    delete: (endpoint: string, options: RequestInit = {}) =>
        apiFetch(endpoint, { ...options, method: 'DELETE' }),

    patch: (endpoint: string, body: any, options: RequestInit = {}) => apiFetch(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body)
    }),
};
