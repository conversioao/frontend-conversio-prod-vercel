import { apiFetch } from '../lib/api';

export interface IdentityItem {
    id: string;
    name: string;
    aspectRatio: string;
    quality: string;
    promptTemplate: string;
    imageUrl?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export const BRANDING_ITEMS: Omit<IdentityItem, 'imageUrl' | 'status'>[] = [
    {
        id: 'cartao_frente',
        name: 'Cartão de Visita (Frente)',
        aspectRatio: '16:9',
        quality: '2K',
        promptTemplate: 'Premium ultra-modern business card front design for [nomeMarca], [nicho] industry, [estiloGeral], [paleta], sleek minimalist typography, dark premium background with subtle glowing gradient accents, central minimalist logo placement, dribbble top corporate identity mockup, highly detailed, photorealistic'
    },
    {
        id: 'cartao_verso',
        name: 'Cartão de Visita (Verso)',
        aspectRatio: '16:9',
        quality: '2K',
        promptTemplate: 'Premium modern business card back design for [nomeMarca], solid dark/premium [corPrimaria] background, clean sleek layout, futuristic glassmorphism elements, minimal contact info placeholders, [estiloGeral], professional print-ready mockup, 8k resolution'
    },
    {
        id: 'papel_timbrado',
        name: 'Papel Timbrado',
        aspectRatio: '3:4',
        quality: '2K',
        promptTemplate: 'High-end corporate letterhead mockup for [nomeMarca], A4 format, sleek minimalist aesthetic, logo top left, [paleta], subtle abstract geometric header and footer design, [estiloGeral], professional corporate document, elegant presentation'
    },
    {
        id: 'banner_quadrado',
        name: 'Banner para Redes Sociais',
        aspectRatio: '1:1',
        quality: '2K',
        promptTemplate: 'Sleek premium social media post template for [nomeMarca], modern SaaS/Tech brand, [paleta], dark mode aesthetic with vivid neon [corPrimaria] accents, [elementosVisuais], [estiloGeral], bold typography placeholder, high impact marketing, dribbble UI'
    },
    {
        id: 'banner_vertical',
        name: 'Banner para Stories / Reel',
        aspectRatio: '9:16',
        quality: '2K',
        promptTemplate: 'Premium Instagram Story template for [nomeMarca], vertical format, modern startup aesthetic, dark background with smooth 3D/glass gradients, [paleta], [estiloGeral], bold call-to-action area bottom, sleek marketing design'
    },
    {
        id: 'banner_outdoor',
        name: 'Banner Digital / Outdoor',
        aspectRatio: '16:9',
        quality: '2K',
        promptTemplate: 'High-impact digital billboard advertising banner for [nomeMarca], [nicho] brand, futuristic corporate look, bold minimal headline area, sleek logo placement, [paleta], [estiloGeral], dark background with luminous gradients, 8k render'
    },
    {
        id: 'mockup_embalagem',
        name: 'Mockup de Embalagem / Produto',
        aspectRatio: '1:1',
        quality: '2K',
        promptTemplate: 'Ultra-premium product packaging mockup for [nomeMarca], high-end modern tech/luxury brand, box/bag/bottle shape appropriate to [nicho], minimalist sleek typography, [paleta], [estiloGeral], dark moody studio lighting, photorealistic 8k'
    },
    {
        id: 'mockup_tshirt',
        name: 'Mockup de T-shirt / Merchandise',
        aspectRatio: '1:1',
        quality: '2K',
        promptTemplate: 'Premium T-shirt clothing mockup for [nomeMarca] corporate merchandise, high-quality fabric texture, dark or neutral modern color complementing [paleta], sleek center minimal logo print, flat lay or studio mannequin style, professional product photography'
    },
    {
        id: 'apresentacao',
        name: 'Apresentação / Slide Cover',
        aspectRatio: '16:9',
        quality: '2K',
        promptTemplate: 'Premium pitch deck presentation slide cover template for [nomeMarca], dark mode SaaS aesthetic, sleek minimal layout, [paleta], centered title area with glowing abstract geometric [elementosVisuais], [estiloGeral], top tier corporate design'
    },
    {
        id: 'assinatura_email',
        name: 'Assinatura de Email / Email Header',
        aspectRatio: '4:1',
        quality: '1K',
        promptTemplate: 'Sleek modern email signature banner for [nomeMarca], horizontal format, minimalist dark corporate theme, logo left, stylish contact placeholder right, [paleta], [estiloGeral], very clean professional design'
    }
];

export async function brandingIdentityAgent(
    input: {
        nomeMarca: string;
        slogan: string;
        nicho: string;
        descricao: string;
        estiloVisual: string;
        logotipoAprovado: { imageUrl: string; prompt: string; estilo: string };
    },
    onProgress: (status: string, completedItems: number, totalItems: number, itemUpdate?: IdentityItem) => void
) {
    onProgress('A extrair DNA Visual...', 0, BRANDING_ITEMS.length);

    // 1. Extrair o DNA Visual
    const dnaRes = await apiFetch('/branding/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            brandName: input.nomeMarca,
            slogan: input.slogan,
            sector: input.nicho,
            description: input.descricao,
            visualStyle: input.estiloVisual,
            approvedLogoPrompt: input.logotipoAprovado.prompt
        })
    });

    if (!dnaRes.ok) throw new Error('Falha ao extrair o DNA Visual da marca.');
    const { dna } = await dnaRes.json();

    const paletaStr = `cores: primária ${dna.paleta.primaria}, secundária ${dna.paleta.secundaria}, fundo ${dna.paleta.fundo}`;

    let completed = 0;
    const finalItems: IdentityItem[] = [];

    // 2. Gerar os 10 itens em paralelo
    onProgress('A gerar materiais da marca...', 0, BRANDING_ITEMS.length);

    const promises = BRANDING_ITEMS.map(async (item) => {
        // Parse the prompt template with DNA
        let prompt = item.promptTemplate
            .replace('[nomeMarca]', input.nomeMarca)
            .replace('[nicho]', input.nicho)
            .replace('[estiloGeral]', dna.estiloGeral)
            .replace('[elementosVisuais]', dna.elementosVisuais)
            .replace('[paleta]', paletaStr)
            .replace('[corPrimaria]', dna.paleta.primaria);

        try {
            const res = await apiFetch('/branding/generate-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    aspectRatio: item.aspectRatio,
                    inputImageUrl: input.logotipoAprovado.imageUrl,
                    resolution: item.quality
                })
            });

            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            completed++;
            const resultItem: IdentityItem = { ...item, status: 'completed', imageUrl: data.imageUrl };
            finalItems.push(resultItem);
            onProgress(`A gerar materiais... (${completed}/${BRANDING_ITEMS.length})`, completed, BRANDING_ITEMS.length, resultItem);
            return resultItem;
        } catch (e) {
            completed++;
            const resultItem: IdentityItem = { ...item, status: 'failed' };
            finalItems.push(resultItem);
            onProgress(`Erro em ${item.name} (${completed}/${BRANDING_ITEMS.length})`, completed, BRANDING_ITEMS.length, resultItem);
            return resultItem;
        }
    });

    await Promise.all(promises);

    return { dna, items: finalItems };
}
