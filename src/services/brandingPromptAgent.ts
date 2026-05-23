import { apiFetch } from '../lib/api';

export interface LogoVariant {
  id: string;
  estilo: string;
  prompt: string;
  imageUrl: string | null;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface BrandingLogoResult {
  success: boolean;
  variants: LogoVariant[];
  totalGenerated: number;
  errors: number;
  message?: string;
}

export interface BrandingPromptInput {
  brandName: string;
  slogan?: string;
  sector: string;
  description: string;
  visualStyle: string;
  regenerateStyle?: { id: string; estilo: string };
  modelId?: string;
}

/**
 * brandingPromptAgent
 * Calls the backend /branding/generate-logo endpoint which:
 *   1. Uses GPT-4o-mini to generate distinct logo prompts from brand data
 *   2. Calls KIE.ai Nano Banana Pro in parallel
 *   3. Returns variants with image URLs
 */
export async function brandingPromptAgent(input: BrandingPromptInput): Promise<BrandingLogoResult> {
  const res = await apiFetch('/branding/generate-logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brandName: input.brandName,
      slogan: input.slogan || '',
      sector: input.sector,
      description: input.description,
      visualStyle: input.visualStyle,
      regenerateStyle: input.regenerateStyle,
      model_id: input.modelId || 'nano-banana-2'
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${res.status} ao gerar logótipos.`);
  }

  return res.json() as Promise<BrandingLogoResult>;
}
