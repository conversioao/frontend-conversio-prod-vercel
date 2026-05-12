import { useCallback, useRef } from 'react';

/**
 * useEventTracker — Frontend behavioral event tracking hook
 * 
 * Sends events to POST /api/track for lead scoring, funnel analysis,
 * and SmartOrchestrator intelligence.
 * 
 * Supported events:
 * - 'pricing_viewed' — User opened the pricing page
 * - 'upgrade_attempted' — User clicked on an upgrade/buy button
 * - 'feature_used' — User engaged with a core feature (image gen, video gen, etc.)
 * - 'link_clicked' — User clicked a CTA link
 * - 'page_viewed' — User visited a key page
 * - 'generation_started' — User started a content generation
 * - 'generation_completed' — User completed a content generation
 * - 'credits_low' — User's credits fell below threshold
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

// Debounce map to prevent duplicate events within 5 seconds
const recentEvents = new Map<string, number>();

function isDuplicate(eventKey: string): boolean {
    const now = Date.now();
    const last = recentEvents.get(eventKey);
    if (last && now - last < 5000) return true;
    recentEvents.set(eventKey, now);
    // Clean old entries every 50 events
    if (recentEvents.size > 50) {
        const cutoff = now - 30000;
        for (const [key, ts] of recentEvents) {
            if (ts < cutoff) recentEvents.delete(key);
        }
    }
    return false;
}

export function useEventTracker(userId?: string) {
    const userIdRef = useRef(userId);
    userIdRef.current = userId;

    const track = useCallback(async (
        event: string,
        metadata?: Record<string, any>
    ) => {
        try {
            const eventKey = `${event}:${userIdRef.current || 'anon'}`;
            if (isDuplicate(eventKey)) return;

            await fetch(`${API_BASE}/api/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event,
                    userId: userIdRef.current || null,
                    metadata: {
                        ...metadata,
                        timestamp: new Date().toISOString(),
                        url: window.location.pathname,
                    },
                }),
            }).catch(() => {
                // Silent fail — tracking should never break the UI
            });
        } catch {
            // Silent fail
        }
    }, []);

    const trackPricingViewed = useCallback(() => {
        track('pricing_viewed');
    }, [track]);

    const trackUpgradeAttempted = useCallback((planId?: string) => {
        track('upgrade_attempted', { planId });
    }, [track]);

    const trackFeatureUsed = useCallback((feature: string, details?: Record<string, any>) => {
        track('feature_used', { feature, ...details });
    }, [track]);

    const trackGenerationStarted = useCallback((type: string, model?: string) => {
        track('generation_started', { type, model });
    }, [track]);

    const trackGenerationCompleted = useCallback((type: string, model?: string) => {
        track('generation_completed', { type, model });
    }, [track]);

    const trackPageViewed = useCallback((pageName: string) => {
        track('page_viewed', { page: pageName });
    }, [track]);

    return {
        track,
        trackPricingViewed,
        trackUpgradeAttempted,
        trackFeatureUsed,
        trackGenerationStarted,
        trackGenerationCompleted,
        trackPageViewed,
    };
}
