/**
 * Plan tiers and their capabilities
 */
export type UserPlan = 'starter' | 'growth' | 'scale';

export const PLANS: Record<UserPlan, {
  name: string;
  color: string;
  maxBatchSize: number;
  hasAllModels: boolean;
  hasAllCores: boolean;
  hasMediaGen: boolean;
  hasEditor: boolean;
  hasWhatsApp: boolean;
  hasBranding: boolean;
}> = {
  starter: {
    name: 'Premium',
    color: '#FFB800',
    maxBatchSize: 10,
    hasAllModels: true,
    hasAllCores: true,
    hasMediaGen: true,
    hasEditor: true,
    hasWhatsApp: true,
    hasBranding: true,
  },
  growth: {
    name: 'Premium',
    color: '#FFB800',
    maxBatchSize: 10,
    hasAllModels: true,
    hasAllCores: true,
    hasMediaGen: true,
    hasEditor: true,
    hasWhatsApp: true,
    hasBranding: true,
  },
  scale: {
    name: 'Premium',
    color: '#FFB800',
    maxBatchSize: 10,
    hasAllModels: true,
    hasAllCores: true,
    hasMediaGen: true,
    hasEditor: true,
    hasWhatsApp: true,
    hasBranding: true,
  }
};

export function getUserPlan(user: any): UserPlan {
  if (!user || !user.plan) return 'starter';
  const plan = user.plan.toLowerCase();
  if (['scale', 'grande', 'heavy'].includes(plan)) return 'scale';
  if (['growth', 'medio', 'standard'].includes(plan)) return 'growth';
  return 'starter';
}

export function canGenerateVideo(user: any) {
  return true;
}

export function canGenerateAudio(user: any) {
  return true;
}

export function canUseEditor(user: any) {
  return true;
}

export function canUseBranding(user: any) {
  return true;
}

export function canSeeWhatsAppOption(user: any) {
  return true;
}

export function getBatchLimit(user: any) {
  return 10;
}
