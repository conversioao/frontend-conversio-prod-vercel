/**
 * apiCache.ts — Cache em memória com TTL para requests de API
 * Estratégia: stale-while-revalidate para experiência instantânea em 4G lento
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // milliseconds
}

class ApiCache {
    private cache = new Map<string, CacheEntry<any>>();
    private maxSize = 50; // máximo de entradas

    set<T>(key: string, data: T, ttlSeconds = 30): void {
        // Evict oldest entry if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > entry.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    /** Retorna dados stale (expirados) se existirem — útil para stale-while-revalidate */
    getStale<T>(key: string): T | null {
        const entry = this.cache.get(key);
        return entry ? (entry.data as T) : null;
    }

    isStale(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return true;
        return Date.now() - entry.timestamp > entry.ttl;
    }

    invalidate(keyPrefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(keyPrefix)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }
}

export const apiCache = new ApiCache();
