import React, { useState, useRef, useEffect } from 'react';
import { ParticlesBackground } from './ui/ParticlesBackground';
import { ImagePlus, Sparkles, Smartphone, Copy, Mic, Send, Download, ThumbsUp, MoreHorizontal, X, Plus, Maximize2, ArrowRight, Globe, Loader2, CheckCircle2, AlertCircle, Zap, Trash2, Layers, ChevronRight, Camera, Package, MessagesSquare, MapPin, TrendingUp, MonitorPlay, BookOpen, Target, Users, Search, Box, Layout, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useMobile } from '../hooks/useMobile';
import { useEventTracker } from '../hooks/useEventTracker';
import { ProductCamera } from './ui/ProductCamera';
import { getUserPlan, PLANS, getBatchLimit } from '../utils/planUtils';

const LOADING_PHRASES = [
  "Interpretando sua ideia...",
  "Ajustando iluminação e composição...",
  "Renderizando texturas em alta definição...",
  "Aplicando toques finais de magia..."
];

// New Agent Cores and Styles
const AGENT_CORES = [
  { id: 'ugc-realistic', name: 'REELANGOLA UGC', agentTechnicalId: 'ugc-realistic', style_id: 'ugc-realistic', icon: Smartphone, description: 'Conteúdo autêntico e orgânico (Talking Head, Unboxing, Routine).', credit_cost: 4, category: 'normal' },
  { id: 'boutique-fashion', name: 'LUANDALOOKS AGENT', agentTechnicalId: 'boutique-fashion', style_id: 'boutique-fashion', icon: Sparkles, description: 'Especialista em Publicidade de Moda para Angola.', credit_cost: 4, category: 'normal' },
  { id: 'glow-angola', name: 'GLOWANGOLA PRO', agentTechnicalId: 'glow-angola', style_id: 'glow-angola', icon: Sparkles, description: 'Especialista em Cosmética, Cabelo e Beleza para Angola.', credit_cost: 4, category: 'normal' },
  { id: 'impact-ads-pro', name: 'VIBRA ANGOLA', agentTechnicalId: 'impact-ads-pro', style_id: 'impact-ads-pro', icon: Zap, description: 'Anúncios de alto impacto com inteligência visual.', credit_cost: 5, category: 'normal' },
  { id: 'branding-kit', name: 'Identidade de Marca Premium', agentTechnicalId: 'branding-kit', style_id: 'branding-kit', icon: Layers, description: 'Gera 5 anúncios consistentes de uma só vez para a sua marca.', credit_cost: 20, category: 'branding' },
  { id: 'social-ads-kit', name: 'Kit de Anúncios de Alta Conversão', agentTechnicalId: 'social-ads-kit', style_id: 'social-ads-kit', icon: Layout, description: 'Gera 6 anúncios variados para redes sociais com consistência visual.', credit_cost: 25, category: 'branding' },
  { id: 'brand-amazon', name: 'Estilo E-Commerce Minimalist', agentTechnicalId: 'brand-amazon', style_id: 'brand-amazon', icon: Package, description: 'Kit de 6 frames com estética limpa, focada no produto e fundo profissional de estúdio para qualquer e-commerce.', credit_cost: 25, category: 'branding' },
  { id: 'brand-cosmetics', name: 'Estilo Editorial Premium', agentTechnicalId: 'brand-cosmetics', style_id: 'brand-cosmetics', icon: Sparkles, description: 'Kit de 9 frames sofisticados com layout bipartido de revista e modelo interagindo com o seu produto.', credit_cost: 30, category: 'branding' },
  { id: 'brand-burger', name: 'Estilo Dinâmico de Impacto', agentTechnicalId: 'brand-burger', style_id: 'brand-burger', icon: Zap, description: 'Kit de 9 frames macro dinâmicos com efeitos de luz dramáticos, partículas em movimento rápido e badge de preço.', credit_cost: 30, category: 'branding' },
  { id: 'brand-sweets', name: 'Estilo Pop Pastel Vibrante', agentTechnicalId: 'brand-sweets', style_id: 'brand-sweets', icon: Sparkles, description: 'Kit de 9 frames alegres com cores pastéis vibrantes, tipografia moderna arredondada e composições criativas.', credit_cost: 30, category: 'branding' },
];

// Styles are FREE — only Models and Cores have credit costs
const AGENT_STYLES: Record<string, any[]> = {
  'ugc-lite': [
    { id: 'Talking Head Testimonial', name: 'Talking Head', icon: Smartphone, desc: 'Pessoa real a falar diretamente para a câmara (estilo Reels/TikTok).' },
    { id: 'POV Product Review', name: 'POV / Em Mão', icon: Smartphone, desc: 'Foco no produto sendo segurado ou usado, fundo natural e orgânico.' },
  ],
  'ugc-realistic': [
    { id: 'Talking Head Testimonial', name: 'Talking Head', icon: Smartphone, desc: 'Pessoa real a falar diretamente para a câmara (estilo Reels/TikTok).' },
    { id: 'POV Product Review', name: 'POV / Em Mão', icon: Smartphone, desc: 'Foco no produto sendo segurado ou usado, fundo natural e orgânico.' },
    { id: 'Aesthetic Unboxing', name: 'Aesthetic Unboxing', icon: Package, desc: 'Momento de descoberta do produto com foco em detalhes e embalagem.' },
    { id: 'Daily Routine Focus', name: 'Daily Routine', icon: MessagesSquare, desc: 'O produto integrado numa atividade real do quotidiano.' },
    { id: 'Natural Results', name: 'Natural Results', icon: Sparkles, desc: 'Foto honesta após o uso, mostrando o benefício real do produto.' },
  ],
  'boutique-fashion': [
    { id: 'STYLE 1 — EDITORIAL CATALOGUE', name: 'Editorial Catalogue', icon: Camera, desc: 'Clean studio background, editorial pose, detail crops and typography.' },
    { id: 'STYLE 2 — LIFESTYLE URBANO BOLD', name: 'Lifestyle Urbano Bold', icon: Zap, desc: 'Split background, large bold condensed typography, urban pose.' },
    { id: 'STYLE 3 — OUTFIT OF THE DAY (OOTD)', name: 'Outfit of the Day (OOTD)', icon: Smartphone, desc: 'Soft pastel gradient, full-body shot, thin call-out lines.' },
    { id: 'STYLE 4 — STREET / ASPIRACIONAL', name: 'Street / Aspiracional', icon: Sparkles, desc: 'Outdoor urban Luanda, golden hour, background bokeh.' },
    { id: 'STYLE 5 — STREET STYLE / FASHION WEEK', name: 'Street Style / Fashion Week', icon: MapPin, desc: 'Urban Luanda street, strong stance, documentary feel.' },
  ],
  'glow-angola': [
    { id: 'Glow Surreal Scale', name: 'Glow Surreal Scale', icon: Box, desc: 'Produto de beleza gigante interagindo com modelo em estúdio luxuoso.' },
    { id: 'Glow Editorial Grid', name: 'Editorial Fashion Grid', icon: Layers, desc: 'Layout de revista sofisticado com detalhes do produto e modelo.' },
    { id: 'Glow Macro Texture', name: 'Glow Macro Texture', icon: Search, desc: 'Foco extremo na fórmula: gotas de sérum, texturas de cremes e brilho.' },
    { id: 'Glow Golden Aura', name: 'Golden Hour Aura', icon: Sparkles, desc: 'Iluminação premium de pôr do sol, pele radiante e tons quentes de luxo.' },
    { id: 'Glow Minimalist Lux', name: 'Minimalist Studio Lux', icon: Camera, desc: 'Estética limpa, sombras dramáticas e tipografia serifada premium.' },
  ],
  'impact-ads-pro': [
    { id: 'Vibra Gigante', name: 'Vibra Gigante 3D', icon: Box, desc: 'Produto em escala monumental num ambiente surreal com néon e assets 3D.' },
    { id: 'Vibra Pop Grid', name: 'Vibra Pop Design', icon: Zap, desc: 'Design dinâmico 3D focado no produto com partículas de energia vibrante.' },
    { id: 'Vibra Gloss Editorial', name: 'Vibra Gloss Pro', icon: Sparkles, desc: 'Destaque luxuoso para a textura e design do produto com tipografia premium.' },
    { id: 'Vibra Tech Energy', name: 'Vibra Tech Energy 3D', icon: MonitorPlay, desc: 'Pulsão tecnológica com trilhos de luz néon e interfaces HUD integradas.' },
    { id: 'Vibra Premium Service', name: 'Fintech Corporate Pro', icon: Target, desc: 'Cenário corporate digital com fluxos de dados 3D e cartões de vidro.' },
  ],
  'branding-kit': [
    { id: 'Brand Style 1', name: 'Minimalist Lux', icon: Sparkles, desc: 'Visual limpo e sofisticado com foco na marca.' },
    { id: 'Brand Style 2', name: 'Editorial Grid', icon: Layers, desc: 'Composição de revista com múltiplos ângulos.' },
    { id: 'Brand Style 3', name: 'Urban Premium', icon: MapPin, desc: 'A sua marca no contexto urbano de Luanda.' },
    { id: 'Brand Style 4', name: 'Product Close-up', icon: Search, desc: 'Foco total nos detalhes e textura do produto.' },
    { id: 'Brand Style 5', name: 'Social Identity', icon: Smartphone, desc: 'Anúncio vibrante para redes sociais.' },
  ],
  'social-ads-kit': [
    { id: 'Social 1', name: 'Facebook Feed', icon: Layout, desc: 'Otimizado para o feed principal do Facebook.' },
    { id: 'Social 2', name: 'Instagram Story', icon: Smartphone, desc: 'Formato vertical imersivo para Stories.' },
    { id: 'Social 3', name: 'TikTok Hook', icon: Zap, desc: 'Visual dinâmico para prender a atenção no TikTok.' },
    { id: 'Social 4', name: 'LinkedIn Pro', icon: Target, desc: 'Estética profissional para anúncios B2B.' },
    { id: 'Social 5', name: 'WhatsApp Status', icon: MessagesSquare, desc: 'Direto e eficaz para vendas no WhatsApp.' },
    { id: 'Social 6', name: 'Twitter/X Hook', icon: Sparkles, desc: 'Design impactante para o feed do X.' },
  ],
  'brand-amazon': [
    { id: 'amazon-frame-1', name: 'Hero Shot Principal', icon: Package, desc: 'Imagem hero limpa fundo branco, produto centrado com sombra suave e nome da marca.' },
    { id: 'amazon-frame-2', name: 'Ingredientes Botânicos', icon: Sparkles, desc: 'Composição flat-lay com folhas verdes, plantas e frascos de suplementos sobre fundo branco.' },
    { id: 'amazon-frame-3', name: 'Tabela de Benefícios', icon: Target, desc: 'Infográfico comparativo: ícones dos benefícios do produto lado a lado com texto em pt-AO.' },
    { id: 'amazon-frame-4', name: 'Close-up do Rótulo', icon: Search, desc: 'Zoom fotográfico no rótulo do produto: ingredientes ativos, dosagem e certificação.' },
    { id: 'amazon-frame-5', name: 'Estilo de Vida Saudável', icon: Users, desc: 'Modelo africano saudável usando/segurando o produto em ambiente clean (casa, ginásio).' },
    { id: 'amazon-frame-6', name: 'Balanço Diário', icon: Layers, desc: 'Flat-lay de rotina diária: produto + copo de água + frutas, em superfície neutra.' },
  ],
  'brand-cosmetics': [
    { id: 'cosm-frame-1', name: 'Hero de Luxo', icon: Sparkles, desc: 'Produto sobre fundo roxo/violeta profundo com iluminação rim dramática e partículas douradas.' },
    { id: 'cosm-frame-2', name: 'Gota de Sérum', icon: Search, desc: 'Macro extremo de gota de sérum saindo do conta-gotas: textura, brilho e viscosidade.' },
    { id: 'cosm-frame-3', name: 'Modelo Pele Radiante', icon: Camera, desc: 'Modelo feminina africana de pele luminosa com overlay de card elegante e copy em pt-AO.' },
    { id: 'cosm-frame-4', name: 'Rituais de Beleza', icon: MessagesSquare, desc: 'Flat-lay de ritual de skin: produto + pétala de rosa + toalha branca + pedras.' },
    { id: 'cosm-frame-5', name: 'Textura do Creme', icon: Layers, desc: 'Close-up de creme sendo espalhado na pele com textura suave e cor bege/nude.' },
    { id: 'cosm-frame-6', name: 'Resultado Antes/Depois', icon: Target, desc: 'Painel dividido mostrando resultado: pele antes e depois do uso do produto.' },
    { id: 'cosm-frame-7', name: 'Editorial Minimal', icon: Box, desc: 'Composição minimalista: produto + fundo branco liso + tipografia serifada premium em pt-AO.' },
    { id: 'cosm-frame-8', name: 'Glow Night Ritual', icon: Sparkles, desc: 'Ambiente noturno aconchegante: vela acesa + produto + espelho e toques dourados.' },
    { id: 'cosm-frame-9', name: 'Overlay Card Elegante', icon: Layout, desc: 'Produto com card sobreposição mostrando ingredientes-chave e benefício principal.' },
  ],
  'brand-burger': [
    { id: 'burger-frame-1', name: 'Hero Hambúrguer Voador', icon: Zap, desc: 'Hambúrguer explodindo em câmara lenta com ingredientes flutuando, fundo vermelho vibrante.' },
    { id: 'burger-frame-2', name: 'Close-up Queijo a Derreter', icon: Search, desc: 'Macro do queijo fundido e dourado a escorrer pelo pão artesanal com foco desfocado.' },
    { id: 'burger-frame-3', name: 'Combo Completo', icon: Package, desc: 'Combo com hambúrguer, batatas fritas e bebida em tabuleiro, fundo âmbar quente.' },
    { id: 'burger-frame-4', name: 'Badge de Oferta', icon: Target, desc: 'Hambúrguer com badge de desconto ou promoção sobreposto — cor vermelha e tipografia bold.' },
    { id: 'burger-frame-5', name: 'Scooter de Entrega', icon: Zap, desc: 'Entregador em scooter com caixa de entrega — fundo urbano estilizado, cor laranja/vermelho.' },
    { id: 'burger-frame-6', name: 'Ingredientes Premium', icon: Layers, desc: 'Flat-lay de ingredientes frescos: pão, carne, alface, tomate e queijo com fundo de madeira.' },
    { id: 'burger-frame-7', name: 'Mão Segurando', icon: Camera, desc: 'Mão segurando hambúrguer: ângulo POV casual, fundo bokeh de restaurante.' },
    { id: 'burger-frame-8', name: 'Grelha em Ação', icon: MonitorPlay, desc: 'Hambúrguer na grelha com chama e fumo visíveis, estética de churrascaria gourmet.' },
    { id: 'burger-frame-9', name: 'Menu Digital Bold', icon: Layout, desc: 'Layout de menu digital vibrante: produto + preço + nome em tipografia extra-bold.' },
  ],
  'brand-sweets': [
    { id: 'sweets-frame-1', name: 'Copo de Gelato Hero', icon: Sparkles, desc: 'Copo de gelato colorido em rosa/azul com bolas empilhadas e cobertura de frutas.' },
    { id: 'sweets-frame-2', name: 'Casquinha Waffle', icon: Camera, desc: 'Casquinha de waffle crocante com duas bolas de gelado em verde e amarelo, fundo pastel.' },
    { id: 'sweets-frame-3', name: 'Rostos Felizes', icon: Users, desc: 'Crianças/famílias africanas felizes segurando gelados — energia alegre e vibrante.' },
    { id: 'sweets-frame-4', name: 'Picolé Colorido', icon: Zap, desc: 'Picolés de frutas em fundo branco limpo, cores vibrantes laranja/vermelho/verde.' },
    { id: 'sweets-frame-5', name: 'Milkshake Premium', icon: Search, desc: 'Milkshake alto com creme, calda e fruta: fundo colorido, straw com padrão.' },
    { id: 'sweets-frame-6', name: 'Flat-lay de Doces', icon: Layers, desc: 'Vista de cima: variedade de gelados e doces sobre superfície azul claro com sprinkles.' },
    { id: 'sweets-frame-7', name: 'Textura Close-up', icon: Box, desc: 'Macro de textura de gelado: cremosidade, cores e cristais de gelo visíveis.' },
    { id: 'sweets-frame-8', name: 'Promoção Verão', icon: Target, desc: 'Arte de promoção verão: sol, ondas estilizadas e produto em destaque — tipografia bold.' },
    { id: 'sweets-frame-9', name: 'Embalagem para Levar', icon: Package, desc: 'Embalagem takeaway do produto com logo e cores da marca — fundo degrade pastel.' },
  ],
};

const RATIOS = [
  { id: '1:1', name: '1:1', desc: 'Quadrado (Instagram)' },
  { id: '16:9', name: '16:9', desc: 'Widescreen (YouTube/TV)' },
  { id: '9:16', name: '9:16', desc: 'Vertical (TikTok/Stories)' },
  { id: '4:5', name: '4:5', desc: 'Retrato (Instagram Post)' },
];

const QUANTITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface ImageGeneratorProps {
  initialCore?: string | null;
  onClearCore?: () => void;
  onProgressUpdate?: (percent: number | null) => void;
}

export function ImageGenerator({ initialCore, onClearCore, onProgressUpdate }: ImageGeneratorProps = {}) {
  const plan = getUserPlan(JSON.parse(localStorage.getItem('conversio_user') || '{}'));
  const planConfig = PLANS[plan];

  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [availableCores, setAvailableCores] = useState<any[]>(AGENT_CORES);
  
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedCore, setSelectedCore] = useState<any>(AGENT_CORES[0]); // Default: REELANGOLA UGC
  const [styleConfigs, setStyleConfigs] = useState<Record<string, {checked: boolean, quantity: number, aspectRatio: string}>>({});
  const [useBrandLogo, setUseBrandLogo] = useState(false);
  const [useBrandColors, setUseBrandColors] = useState(false);
  const [brandData, setBrandData] = useState<any>(null);
  const [checkingBrand, setCheckingBrand] = useState(false);
  
  const [ratio, setRatio] = useState('9:16');
  const [quantity, setQuantity] = useState(1); // Default: 1 image
  const [prompt, setPrompt] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [capturedFile, setCapturedFile] = useState<File | null>(null);


  // Fetch composition surcharge from env config or use default "2"
  const [compositionSurcharge, setCompositionSurcharge] = useState<number>(2);

  // Styles are FREE — cost = Model + Core
  const unitCost = (selectedModel?.credit_cost || 1) + (selectedCore?.credit_cost || 0);
  
  const [backgroundTasks, setBackgroundTasks] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'background' | 'done'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]); // Store full objects
  const [expandedImage, setExpandedImage] = useState<any | null>(null);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sseProgress, setSseProgress] = useState<{ percent: number; label: string; elapsed: number } | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);
  
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{id: string, success: boolean, message: string} | null>(null);
  const [generationMode, setGenerationMode] = useState<'standard' | 'text-only'>('standard');
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Agent, 2: Design
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  }>({ title: '', message: '', onConfirm: () => {} });
  const isMobile = useMobile();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('1k');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('conversio_user') || '{}'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const characterFileInputRef = useRef<HTMLInputElement>(null);

  // Event Tracking for Funnel AI
  const { trackFeatureUsed, trackGenerationStarted, trackGenerationCompleted } = useEventTracker(user?.id);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'conversio-ai-generation.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  // Compute total quantity and cost based on modes
  const isBrandingKit = selectedCore?.id === 'branding-kit';
  const isSocialAdsKit = selectedCore?.id === 'social-ads-kit';
  const isKit = isBrandingKit || isSocialAdsKit;

  const isAgentWithStyles = generationMode === 'standard' && selectedCore && (AGENT_STYLES[selectedCore.agentTechnicalId] || AGENT_STYLES[selectedCore.id]);
  const activeStyleConfigs = Object.values(styleConfigs).filter(c => c.checked);
  
  const totalQuantity = isBrandingKit
    ? 5
    : isSocialAdsKit
      ? 6
      : (isAgentWithStyles && activeStyleConfigs.length > 0
        ? activeStyleConfigs.reduce((sum, c) => sum + c.quantity, 0)
        : quantity);
    
  const surcharge = (generationMode === 'standard' && (capturedFile || uploadedImage || characterFile) && selectedCore) ? compositionSurcharge : 0;
  const resSurcharge = selectedResolution === '2k' ? 10 : selectedResolution === '4k' ? 25 : 0;
  
  const totalCost = (isBrandingKit || isSocialAdsKit)
    ? (selectedCore?.credit_cost || 0) + ((selectedModel?.credit_cost || 0) + surcharge + resSurcharge) * totalQuantity
    : ((selectedModel?.credit_cost || 0) + (selectedCore?.credit_cost || 0) + surcharge + resSurcharge) * totalQuantity;


  useEffect(() => {
    const handleStorage = () => {
      setUser(JSON.parse(localStorage.getItem('conversio_user') || '{}'));
    };
    window.addEventListener('storage', handleStorage);

    const syncUser = async () => {
      if (user?.id) {
        try {
          const res = await apiFetch('/user/stats');
          const data = await res.json();
          if (data.success) {
            const updatedUser = { ...user, credits: data.credits };
            setUser(updatedUser);
            localStorage.setItem('conversio_user', JSON.stringify(updatedUser));
          }
        } catch (e) {
          console.warn('[Sync] Failed to fetch latest user stats');
        }
      }
    };
    syncUser();

    const fetchConfig = async () => {
      try {
        const res = await apiFetch('/public/config');
        const data = await res.json();
        if (data.success) {
          setCompositionSurcharge(data.compositionSurcharge);
        }
      } catch (e) {
        console.warn('[ImageGenerator] Could not fetch public config, using default surcharge.');
      }
    };
    fetchConfig();

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchModels = async () => {
    try {
      const [modelsRes, coresRes, brandingRes] = await Promise.all([
        apiFetch('/models?category=model&type=image'),
        apiFetch('/models?category=core&type=image'),
        apiFetch('/models?category=branding&type=image')
      ]);
      const modelsData = await modelsRes.json();
      const coresData = await coresRes.json();
      const brandingData = await brandingRes.json();

      if (modelsData.success) {
        let models = modelsData.models;
        models.sort((a: any, b: any) => {
          const isANano = (a.style_id && a.style_id.includes('nano-banana-lite')) || (a.id && a.id.toString().includes('nano-banana-lite'));
          const isBNano = (b.style_id && b.style_id.includes('nano-banana-lite')) || (b.id && b.id.toString().includes('nano-banana-lite'));
          if (isANano && !isBNano) return -1;
          if (!isANano && isBNano) return 1;
          return 0;
        });

        setAvailableModels(models);
        setSelectedModel(models[0]);
      }

      let dbCores = [];
      if (coresData.success && coresData.models) {
        dbCores.push(...coresData.models);
      }
      if (brandingData.success && brandingData.models) {
        dbCores.push(...brandingData.models);
      }

      if (dbCores.length > 0) {
        const mergedCores = dbCores.map((dbCore: any) => {
          const staticCore = AGENT_CORES.find(c => 
            c.style_id === dbCore.style_id || 
            c.id === dbCore.id || 
            (dbCore.style_id === 'glow-angola' && c.id === 'glow-angola') ||
            (dbCore.style_id === 'V-PRO' && c.id === 'impact-ads-pro') ||
            (dbCore.style_id === 'CV-02' && c.id === 'boutique-fashion') ||
            (dbCore.style_id === 'CV-01' && c.id === 'ugc-realistic') ||
            (dbCore.style_id === 'brand-amazon' && c.id === 'brand-amazon') ||
            (dbCore.style_id === 'brand-cosmetics' && c.id === 'brand-cosmetics') ||
            (dbCore.style_id === 'brand-burger' && c.id === 'brand-burger') ||
            (dbCore.style_id === 'brand-sweets' && c.id === 'brand-sweets') ||
            (dbCore.name?.toLowerCase().includes('glow') && c.id === 'glow-angola') ||
            (dbCore.name?.toLowerCase().includes('impact') && c.id === 'impact-ads-pro') ||
            (dbCore.name?.toLowerCase().includes('ugc') && c.id === 'ugc-realistic') ||
            (dbCore.name?.toLowerCase().includes('brand') && c.id === 'boutique-fashion')
          ) || AGENT_CORES[0];
          
          return {
            ...staticCore,
            ...dbCore,
            name: staticCore.name, 
            agentTechnicalId: staticCore.id,
            icon: staticCore.icon || (staticCore.id === 'boutique-fashion' ? Sparkles : AGENT_CORES[0].icon),
            description: staticCore.description || AGENT_CORES[0].description
          };
        });

        const unmatchedStaticCores = AGENT_CORES.filter(sc => 
          !mergedCores.some(mc => mc.agentTechnicalId === sc.id || mc.id === sc.id)
        );

        const finalCores = [...mergedCores, ...unmatchedStaticCores];
        setAvailableCores(finalCores);
        setSelectedCore(finalCores.find((c: any) => c.is_active) || finalCores[0]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchModels();
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialCore) {
      const core = AGENT_CORES.find(m => m.style_id === initialCore);
      if (core) {
        setSelectedCore(core);
        onClearCore?.();
      }
    }
  }, [initialCore]);

  const handleDropdownClick = (e: React.MouseEvent, dropdown: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'character' = 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'product') {
        setUploadedImage(URL.createObjectURL(file));
        setCapturedFile(null); 
      } else {
        setCharacterPreview(URL.createObjectURL(file));
        setCharacterFile(file);
      }
    }
  };

  const handleCapture = (blob: Blob, url: string) => {
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setCapturedFile(file);
    setUploadedImage(url);
  };

  const handleGenerate = async () => {
    if (!selectedCore) {
      setConfirmModalConfig({ title: 'Agente em Falta', message: 'Por favor, selecione um Agente (Core) no Configurar Design.', type: 'info', onConfirm: () => setShowConfirmModal(false) });
      setShowConfirmModal(true);
      return;
    }
    
    if (generationMode === 'standard' && !uploadedImage) {
      setConfirmModalConfig({ title: 'Fotografia em Falta', message: 'A imagem do produto original é obrigatória para este Agente. Por favor, faça o upload de uma imagem do seu produto antes de gerar.', type: 'warning', onConfirm: () => setShowConfirmModal(false) });
      setShowConfirmModal(true);
      return;
    }

    if (!user || !user.id) {
      setConfirmModalConfig({ title: 'Sessão Expirada', message: 'Por favor, faça login novamente para continuar.', type: 'warning', onConfirm: () => { window.location.reload(); } });
      setShowConfirmModal(true);
      return;
    }

    const userCredits = Number(user.credits) || 0;
    const finalCost = Number(totalCost) || 0;

    if (userCredits < finalCost) {
      setConfirmModalConfig({
        title: 'Créditos Insuficientes',
        message: `Precisas de ${finalCost} créditos para esta geração, mas tens apenas ${userCredits}. Carrega mais créditos na secção de Faturação.`,
        type: 'warning',
        onConfirm: () => setShowConfirmModal(false)
      });
      setShowConfirmModal(true);
      return;
    }
    
    
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('prompt', prompt);
    formData.append('model_id', selectedModel?.id || '');
    
    const isTextOnly = generationMode === 'text-only';
    
    if (!isTextOnly) {
      formData.append('core_id', selectedCore?.agentTechnicalId || '');
      formData.append('core_name', selectedCore?.name || '');
      
      const activeConfigs = Object.entries(styleConfigs).filter(([_, conf]) => conf.checked);
      if (activeConfigs.length > 0) {
        const selections = activeConfigs.map(([name, conf]) => ({
            style_id: name,
            style_name: name,
            quantity: conf.quantity,
            aspectRatio: conf.aspectRatio
        }));
        formData.append('selections', JSON.stringify(selections));
      } else {
        formData.append('style', '');
      }

      formData.append('use_brand_logo', useBrandLogo.toString());
      formData.append('use_brand_colors', useBrandColors.toString());
      if (brandData) {
          formData.append('brand_colors', JSON.stringify(brandData.brand_colors || brandData.colors || {}));
      }
      formData.append('aspect_ratio', ratio);

      if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0]);
      } else if (capturedFile) {
        formData.append('image', capturedFile);
      }

      if (characterFile) {
        formData.append('character_image', characterFile);
      }
    } else {
      formData.append('core_id', '');
      formData.append('core_name', '');
      formData.append('style', '');
      if (characterFile) {
        formData.append('character_image', characterFile);
      }
      formData.append('use_brand_logo', useBrandLogo.toString());
      formData.append('use_brand_colors', useBrandColors.toString());
      formData.append('aspect_ratio', ratio);
      formData.append('quantity', quantity.toString());
    }
    
    formData.append('model_name', selectedModel?.name || 'Flux.1');
    formData.append('aspectRatio', ratio);
    formData.append('quantity', quantity.toString());
    formData.append('resolution', selectedResolution);

    try {
      if (!selectedModel) {
        setConfirmModalConfig({ title: 'Modelo em Falta', message: 'Por favor, selecione um modelo de IA antes de gerar.', type: 'warning', onConfirm: () => setShowConfirmModal(false) });
        setShowConfirmModal(true);
        return;
      }

      setStatus('generating');
      trackGenerationStarted('image', selectedModel?.name || 'unknown');
      trackFeatureUsed('image_generation', { core: selectedCore?.name, model: selectedModel?.name });

      window.dispatchEvent(new CustomEvent('generation-started', { 
        detail: { 
          type: generationMode === 'text-only' ? 'text' : 'image',
          estimatedTime: 30
        } 
      }));

      const response = await apiFetch('/generate/image', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowToast(true);
        setPrompt('');
        setUploadedImage(null);
        setCapturedFile(null);
        setCharacterFile(null);
        setCharacterPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        setTimeout(() => {
          setConfirmModalConfig({
            title: 'Geração em Curso',
            message: 'Estamos a processar o seu anúncio premium. O processo demora cerca de 30-40 segundos. Pode continuar a criar novas gerações enquanto espera!',
            type: 'info',
            onConfirm: () => setShowConfirmModal(false)
          });
          setShowConfirmModal(true);
        }, 5000);

        setTimeout(() => setShowToast(false), 5000);
        
        if (data.batchId) {
          connectToProgress(data.batchId);
          setStatus('idle');
          window.dispatchEvent(new CustomEvent('refreshGenerations'));
        }
      } else {
        setStatus('idle');
        setConfirmModalConfig({
          title: 'Erro ao Gerar',
          message: data.message || 'Ocorreu um erro inesperado ao processar sua geração.',
          type: 'error',
          onConfirm: () => setShowConfirmModal(false)
        });
        setShowConfirmModal(true);
      }
    } catch (err: any) {
      console.error('[ImageGenerator] Error during generation:', err);
      setStatus('idle');
      setConfirmModalConfig({
        title: 'Erro de Sistema',
        message: 'Não foi possível comunicar com o servidor. Verifique a sua ligação.',
        type: 'error',
        onConfirm: () => setShowConfirmModal(false)
      });
      setShowConfirmModal(true);
    }
  };


  const connectToProgress = (batchId: string) => {
    setBackgroundTasks(prev => prev + 1);
    setSseProgress({ percent: 0, label: 'A iniciar pipeline...', elapsed: 0 });

    let elapsed = 0;
    elapsedRef.current = setInterval(() => {
      elapsed += 1;
      setSseProgress(prev => prev ? { ...prev, elapsed } : null);
    }, 1000);

    const apiBase = (import.meta.env.VITE_API_URL || 'https://conversioai-conversio-ai-backend.odbegs.easypanel.host');
    const es = new EventSource(`${apiBase}/api/generations/progress/${batchId}`);
    sseRef.current = es;

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        if (data.type === 'progress') {
          if (data.status === 'generating' && data.pipeline_progress !== undefined) {
            setSseProgress({ percent: data.pipeline_progress, label: data.pipeline_status || 'A processar...', elapsed });
            if (onProgressUpdate) onProgressUpdate(data.pipeline_progress);
          }

          if (data.status === 'completed' || data.status === 'failed') {
            try {
              const res = await apiFetch(`/generations?userId=${user.id}`);
              const resData = await res.json();
              if (resData.success) {
                const batch = resData.generations.filter((g: any) => g.batch_id === batchId);
                setGeneratedItems(batch);
                
                const allFinished = batch.length > 0 && batch.every((g: any) => g.status === 'completed' || g.status === 'failed');
                
                if (allFinished) {
                  es.close();
                  if (elapsedRef.current) clearInterval(elapsedRef.current);
                  setSseProgress(null);
                  if (onProgressUpdate) onProgressUpdate(null);
                  setBackgroundTasks(prev => Math.max(0, prev - 1));
                  setStatus('done');
                  trackGenerationCompleted('image', selectedModel?.name || 'unknown');
                  window.dispatchEvent(new CustomEvent('generation-completed', { 
                    detail: { 
                      batchId, 
                      items: batch 
                    } 
                  }));
                  window.dispatchEvent(new Event('storage'));
                }
              }
            } catch (e) {}

            if (data.status === 'failed') {
              setConfirmModalConfig({
                title: 'Erro na Geração',
                message: 'Parte da geração de imagem falhou. Os seus créditos foram devolvidos proporcionalmente.',
                type: 'error',
                onConfirm: () => setShowConfirmModal(false)
              });
              setShowConfirmModal(true);
            }
          }
        }
      } catch (e) {}
    };

    es.onerror = () => {
      es.close();
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      fallbackPoll(batchId);
    };
  };

  const fallbackPoll = (batchId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/generations?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          const batch = data.generations.filter((g: any) => g.batch_id === batchId);
          const allFinished = batch.length > 0 && batch.every((g: any) => g.status === 'completed' || g.status === 'failed');
          if (allFinished) {
            clearInterval(interval);
            setSseProgress(null);
            setBackgroundTasks(prev => Math.max(0, prev - 1));
            setGeneratedItems(batch.filter((g: any) => g.status === 'completed' || g.status === 'failed'));
            setStatus('done');
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {}
    }, 4000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModalConfig({
      title: 'Eliminar Geração',
      message: 'Deseja eliminar permanentemente esta geração? Esta ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/generations/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            setGeneratedItems(prev => prev.filter((g: any) => g.id !== id));
          } else {
            setConfirmModalConfig({
              title: 'Erro ao Eliminar',
              message: data.message || 'Não foi possível eliminar a geração.',
              type: 'error',
              onConfirm: () => setShowConfirmModal(false)
            });
            setShowConfirmModal(true);
          }
        } catch(err) { console.error('Erro ao deletar', err); }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handlePublish = async (item: any) => {
    if (!user.id || publishing) return;
    setPublishing(item.id);
    setPublishStatus(null);
    try {
      const res = await apiFetch('/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          generationId: item.id,
          type: item.type,
          imageUrl: item.result_url,
          prompt: item.prompt
        })
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus({ id: item.id, success: true, message: 'Publicado!' });
      } else {
        setPublishStatus({ id: item.id, success: false, message: data.message || 'Erro' });
      }
    } catch (err) {
      setPublishStatus({ id: item.id, success: false, message: 'Erro' });
    } finally {
      setPublishing(null);
      setTimeout(() => setPublishStatus(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] w-full max-w-4xl mx-auto relative px-4 sm:px-0 overflow-visible">
      <ParticlesBackground type="image" />

      {(status === 'done' || (status === 'generating' && sseProgress)) && (
        <div className="w-full max-w-4xl mx-auto mt-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {status === 'generating' ? 'Gerando Anúncio...' : 'Criações Geradas'}
              </h2>
              <p className="text-text-secondary text-xs mt-0.5 opacity-70">
                {status === 'generating' ? 'A sua marca está a ganhar vida...' : `${generatedItems.filter(g => g.status === 'completed').length} imagem(ns) pronta(s)`}
              </p>
            </div>
            <button
              onClick={() => { setStatus('idle'); setGeneratedItems([]); }}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
            >
              <X size={12} /> Nova geração
            </button>
          </div>

          <div className={`grid gap-6 ${
            (generatedItems.length === 1 || (generatedItems.length === 0 && quantity === 1)) 
              ? 'grid-cols-1 max-w-md mx-auto' 
              : 'grid-cols-1 sm:grid-cols-2'
          }`}>
            
            {(generatedItems.length > 0 ? generatedItems : Array.from({ length: totalQuantity })).map((item: any, idx) => (
              <div key={item?.id || `placeholder-${idx}`} className="relative">
                {!item || item.status === 'processing' ? (
                  <div className="group relative aspect-square rounded-[2rem] overflow-hidden border border-[#FFB800]/20 bg-surface/40 p-8 shadow-2xl flex flex-col items-center justify-center gap-6 animate-pulse-glow"
                       style={{ boxShadow: '0 0 40px rgba(255,184,0,0.05)' }}>
                    
                    <div className="relative flex items-center justify-center w-20 h-20 md:w-28 md:h-28">
                      <div className="absolute inset-0 rounded-full border-4 border-[#FFB800]/5" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFB800] animate-spin shadow-[0_0_15px_rgba(255,184,0,0.2)]" />
                      
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xl md:text-2xl font-black text-[#FFB800] drop-shadow-[0_0_10px_rgba(255,184,0,0.4)]">
                          {Math.round(sseProgress?.percent || 0)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-center relative z-10">
                      <p className="text-[10px] md:text-xs text-[#FFB800]/80 font-black uppercase tracking-[0.2em] animate-pulse mb-1">
                        A Forjar Media Premium
                      </p>
                      <p className="text-[8px] md:text-[9px] text-text-tertiary font-bold uppercase tracking-widest opacity-60">
                        {idx + 1} de {totalQuantity}
                      </p>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-[#FFB800]/30 transition-all duration-700" 
                        style={{ width: `${sseProgress?.percent || 0}%` }}
                      />
                    </div>
                  </div>
                ) : item.status === 'completed' && item.result_url ? (
                  <div className="group relative rounded-[2rem] overflow-hidden border border-border-subtle bg-surface hover:border-[#FFB800]/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#FFB800]/5">
                    <img
                      src={item.result_url}
                      alt={item.prompt || 'Geração'}
                      className="w-full aspect-square object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
                      onClick={() => setExpandedImage(item)}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center gap-3 p-6">
                      <button
                        onClick={() => setExpandedImage(item)}
                        className="flex-1 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Maximize2 size={16} /> Ver
                      </button>
                      <button
                        onClick={() => handleDownload(item.result_url, `conversio-${item.id}.png`)}
                        className="flex-1 py-3 rounded-2xl bg-[#FFB800] text-black text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Download size={16} /> Baixar
                      </button>
                    </div>

                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] shadow-[0_0_8px_#FFB800]" />
                         Premium Visual
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-[2rem] border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center p-8 gap-4">
                    <AlertCircle size={40} className="text-red-500/50" />
                    <div>
                       <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Falha na Geração</p>
                       <p className="text-[10px] text-text-tertiary leading-relaxed">
                         {item.metadata?.error || 'Ocorreu um erro no processamento. Tens os créditos de volta.'}
                       </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto animate-in fade-in duration-700 overflow-visible">

          <div className="w-full text-center mb-6 md:mb-8 px-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              O que vamos <span className="text-[#FFB800]">criar</span> hoje?
            </h1>
            <p className="text-text-secondary text-sm mt-2 opacity-80">Dê vida às suas ideias com a nossa inteligência artificial</p>
          </div>


          <div className="relative w-full rounded-[2rem] p-[1px] shadow-2xl group transition-all overflow-visible">
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-30" /></div>
            
            <div className="relative bg-surface/95 backdrop-blur-2xl rounded-[calc(2rem-1px)] p-4 flex flex-col gap-3 h-full w-full border border-border-subtle hover:border-accent/30 transition-colors overflow-visible">
               <div className="flex gap-4 items-start">
                 {uploadedImage && (
                   <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-accent/20 shrink-0 group/img shadow-xl">
                     <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                     <button 
                       onClick={() => { setUploadedImage(null); setCapturedFile(null); }} 
                       className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                     >
                       <X size={14} className="text-white" />
                     </button>
                   </div>
                 )}
                 <textarea
                   value={prompt}
                   onChange={e => setPrompt(e.target.value)}
                   placeholder={generationMode === 'text-only' ? "Descreva a sua ideia (Obrigatório)..." : "Descreva a sua ideia em detalhes..."}
                   className="w-full bg-transparent text-text-primary placeholder:text-text-tertiary resize-none outline-none min-h-[80px] py-1 text-base scrollbar-hide"
                 />
               </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap overflow-visible">
                    {generationMode === 'standard' && (
                      <>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <div className="flex items-center gap-2">
                           <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] transition-colors"><ImagePlus size={18} /></button>
                           {isMobile && (
                             <button onClick={() => setIsCameraOpen(true)} className="p-2.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] hover:bg-[#FFB800]/20 transition-all animate-pulse-glow">
                               <Camera size={18} />
                             </button>
                           )}
                        </div>
                      </>
                    )}

                   
                   <div className="relative overflow-visible">
                     <button onClick={(e) => handleDropdownClick(e, 'model')} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-base border border-border-subtle text-[10px] font-bold text-text-secondary hover:text-[#FFB800] transition-colors whitespace-nowrap">
                       <Sparkles size={12} /> {selectedModel?.name || 'Modelo'}
                        {selectedModel?.credit_cost && <span className="px-1.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{selectedModel.credit_cost} CR.</span>}
                     </button>
                     {activeDropdown === 'model' && (
                       <div className="absolute bottom-full left-0 mb-2 w-60 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[500] py-1 animate-in fade-in slide-in-from-bottom-2 duration-200" onClick={e => e.stopPropagation()}>
                         {availableModels.map(m => (
                           <button key={m.id} onClick={() => { setSelectedModel(m); setActiveDropdown(null); }} className={`w-full text-left px-4 py-3 transition-colors ${selectedModel?.id === m.id ? "bg-[#FFB800]/10" : "hover:bg-white/5"}`}>
                             <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-[13px] font-bold text-text-primary">{m.name}</span>
                               {m.credit_cost && <span className="px-1 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{m.credit_cost} CR.</span>}
                             </div>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>

                    {generationMode === 'standard' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setWizardStep(1); setShowCoreModal(true); }}
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 overflow-hidden
                          ${selectedCore
                            ? 'bg-[#FFB800]/20 border border-[#FFB800]/50 text-[#FFB800] shadow-[0_0_12px_rgba(255,184,0,0.3)]'
                            : 'bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/30'}`}
                      >
                        {!selectedCore && (
                          <span className="absolute inset-0 rounded-full border border-[#FFB800]/30 animate-ping opacity-60" />
                        )}
                        <Layers size={12} className={selectedCore ? 'text-[#FFB800]' : 'animate-pulse'} />
                        <span className="flex items-center gap-1.5">
                          {selectedCore ? selectedCore.name : 'Configurar Design'}
                          {activeStyleConfigs.length > 0 && (
                             <span className="hidden sm:inline opacity-60 font-medium border-l border-[#FFB800]/20 pl-1.5 ml-0.5">{activeStyleConfigs.length} Estilo{activeStyleConfigs.length > 1 ? 's' : ''}</span>
                          )}
                          {selectedCore && (
                             <span className="hidden sm:inline opacity-60 font-medium border-l border-[#FFB800]/20 pl-1.5">{useBrandLogo ? 'C/ Logo' : 'S/ Logo'}</span>
                          )}
                        </span>
                        {selectedCore && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FFB800] text-black text-[8px] font-black">{selectedCore.style_id}</span>
                        )}
                        <ChevronRight size={10} className="opacity-50" />
                      </button>
                    )}
                  </div>

                 <div className="flex flex-col items-end gap-1 shrink-0">
                    <button 
                      onClick={handleGenerate}
                      className="px-6 py-3.5 rounded-full bg-[#FFB800] text-black animate-pulse-glow hover:scale-105 transition-all shadow-lg flex items-center gap-3"
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest border-r border-black/20 pr-3">{totalCost} CR.</span>
                      <span className="font-bold text-sm">Gerar</span>
                      <Send size={16} />
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      {expandedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300" onClick={() => setExpandedImage(null)}>
           <button className="absolute top-8 right-8 text-white hover:scale-110 transition-transform"><X size={32} /></button>
           <div className="w-full max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center" onClick={e => e.stopPropagation()}>
              
              <div className="relative group">
                <img src={expandedImage.result_url} className="rounded-[2rem] shadow-2xl w-full object-contain max-h-[75vh] border border-white/10" />
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6">
                  
                  <div>
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 opacity-60">Ponto de Partida</h4>
                    <p className="text-white/80 text-sm leading-relaxed italic">"{prompt || expandedImage.prompt || 'Sem descrição.'}"</p>
                  </div>

                  <div className="h-px bg-white/5 w-full" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">Copy do Anúncio</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(expandedImage.metadata?.copy || '');
                        }}
                        className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-black transition-all"
                        title="Copiar Legenda"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-4 text-white/90 text-[13px] leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-line">
                      {expandedImage.metadata?.copy || "Gerando sugestão de copy persuasiva..."}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-3">Hashtags Estratégicas</h4>
                    <div className="flex flex-wrap gap-2">
                      {(expandedImage.metadata?.hashtags || "").split(' ').map((tag: string, i: number) => (
                        tag.startsWith('#') && (
                          <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-accent/80 hover:text-accent font-medium transition-colors">
                            {tag}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handlePublish(expandedImage)}
                    className="flex-1 py-4 bg-[#FFB800] text-black rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,184,0,0.2)]"
                  >
                    <Globe size={18} /> Publicar Comunidade
                  </button>
                  <button 
                    onClick={() => handleDownload(expandedImage.result_url, `conversio-premium-${expandedImage.id}.png`)}
                    className="px-8 py-4 bg-white/5 text-white rounded-2xl font-bold flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
                  >
                    <Download size={18} /> Baixar
                  </button>
                </div>
              </div>
           </div>
         </div>
      )}

      {showCoreModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-500"
          onClick={() => setShowCoreModal(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white/[0.01] backdrop-blur-[60px] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500"
            onClick={e => e.stopPropagation()}
          >
            {/* Minimalist Glass Header Accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Very Subtle Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] flex gap-0.5 px-0.5 z-50">
                <div className={`h-full flex-1 transition-all duration-700 ${wizardStep >= 1 ? 'bg-[#FFB800]' : 'bg-white/5'}`} />
                <div className={`h-full flex-1 transition-all duration-700 ${wizardStep >= 2 ? 'bg-[#FFB800]/40' : 'bg-white/5'}`} />
            </div>

            <div className="relative flex items-center justify-between px-10 pt-10 pb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">
                    {wizardStep === 1 ? 'Escolha o seu Agente' : 'Personalize o seu Design'}
                </h2>
                <p className="text-[10px] text-[#FFB800] font-black uppercase tracking-[0.2em] opacity-80">
                    {wizardStep === 1 ? 'Selecione a inteligência especializada' : 'Ajuste os detalhes finais da campanha'}
                </p>
              </div>
              <button 
                onClick={() => setShowCoreModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 text-white/40 hover:bg-[#FFB800]/10 hover:text-[#FFB800] transition-all flex items-center justify-center border border-white/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-10 pb-10 flex-1 custom-scrollbar">
              
              {wizardStep === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.2em] px-2 opacity-60">Agentes de Criação Individual</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {availableCores.filter(c => c.category !== 'branding').map((core: any) => {
                        const isSelected = selectedCore?.id === core.id;
                        const Icon = core.icon;
                        return (
                          <button
                            key={core.id}
                            onClick={() => { 
                              setSelectedCore(core); 
                              const coreStyles = AGENT_STYLES[core.agentTechnicalId] || AGENT_STYLES[core.id] || [];
                              const initialConfigs: Record<string, {checked: boolean, quantity: number, aspectRatio: string}> = {};
                              const isKit = core.category === 'branding';
                              coreStyles.forEach((s: any, idx: number) => {
                                  initialConfigs[s.name] = { checked: isKit ? true : idx === 0, quantity: 1, aspectRatio: '9:16' };
                              });
                              setStyleConfigs(initialConfigs);
                              setWizardStep(2);
                            }}
                            className={`group relative text-left p-5 rounded-[2rem] border transition-all duration-300 overflow-hidden flex flex-col items-center text-center ${
                              isSelected
                                ? 'bg-[#FFB800]/10 border-[#FFB800]/50 shadow-[0_0_30px_rgba(255,184,0,0.1)]'
                                : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${isSelected ? 'bg-[#FFB800] text-black' : 'bg-white/5 text-text-secondary group-hover:text-white'}`}>
                              <Icon size={20} strokeWidth={2} />
                            </div>
                            <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${isSelected ? 'text-[#FFB800]' : 'text-white'}`}>{core.name}</p>
                            <p className={`text-[8px] font-medium leading-relaxed opacity-50 line-clamp-2 ${isSelected ? 'text-[#FFB800]/80' : 'text-text-secondary'}`}>{core.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-[10px] font-black text-[#FFB800] uppercase tracking-[0.2em] px-2 opacity-60">Branding & Social Kits (Multi-Imagens)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {availableCores.filter(c => c.category === 'branding').map((core: any) => {
                        const isSelected = selectedCore?.id === core.id;
                        const Icon = core.icon;
                        return (
                          <button
                            key={core.id}
                            onClick={() => { 
                              setSelectedCore(core); 
                              const coreStyles = AGENT_STYLES[core.agentTechnicalId] || AGENT_STYLES[core.id] || [];
                              const initialConfigs: Record<string, {checked: boolean, quantity: number, aspectRatio: string}> = {};
                              coreStyles.forEach((s: any) => {
                                  initialConfigs[s.name] = { checked: true, quantity: 1, aspectRatio: '9:16' };
                              });
                              setStyleConfigs(initialConfigs);
                              setWizardStep(2);
                            }}
                            className={`group relative text-left p-5 rounded-[2rem] border transition-all duration-300 overflow-hidden flex flex-col items-center text-center ${
                              isSelected
                                ? 'bg-[#FFB800]/10 border-[#FFB800]/50 shadow-[0_0_40px_rgba(255,184,0,0.15)]'
                                : 'bg-white/[0.02] border-white/5 hover:border-[#FFB800]/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${isSelected ? 'bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.4)]' : 'bg-white/5 text-text-secondary group-hover:text-[#FFB800]'}`}>
                              <Icon size={20} strokeWidth={2} />
                            </div>
                            <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${isSelected ? 'text-[#FFB800]' : 'text-white'}`}>{core.name}</p>
                            <p className={`text-[8px] font-medium leading-relaxed opacity-50 line-clamp-2 ${isSelected ? 'text-[#FFB800]/80' : 'text-text-secondary'}`}>{core.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && selectedCore && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10 pb-4">
                  
                  {/* Left Column: Core Setup (5 Grid Columns) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Unified Settings Card */}
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-3.5 bg-[#FFB800] rounded-full" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Parâmetros Base</span>
                      </div>

                      {/* Aspect Ratio */}
                      <div className="space-y-2.5">
                        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Formato da Imagem</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {RATIOS.map(r => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setRatio(r.id);
                                setStyleConfigs(prev => {
                                  const next = { ...prev };
                                  Object.keys(next).forEach(key => {
                                    next[key] = { ...next[key], aspectRatio: r.id };
                                  });
                                  return next;
                                });
                              }}
                              className={`py-2 rounded-xl text-[10px] font-black transition-all border ${ratio === r.id ? 'bg-[#FFB800] text-black border-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.2)]' : 'bg-white/5 text-text-secondary border-white/5 hover:border-white/10'}`}
                            >
                              {r.id}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantity (Non-Kits) */}
                      {!isKit && (
                        <div className="space-y-2.5 pt-2 border-t border-white/5">
                          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Quantidade de Criativos</span>
                          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {QUANTITIES.filter(q => q <= getBatchLimit({ plan: plan })).map(q => (
                              <button
                                key={q}
                                onClick={() => setQuantity(q)}
                                className={`w-8 h-8 shrink-0 rounded-lg text-[10px] font-black transition-all border ${quantity === q ? 'bg-[#FFB800] text-black border-[#FFB800]' : 'bg-white/5 text-text-secondary border-white/5 hover:border-white/10'}`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Kit Badge Summary */}
                      {isKit && (
                        <div className="p-4 rounded-2xl bg-[#FFB800]/5 border border-[#FFB800]/10 flex items-start gap-3">
                          <Layers size={14} className="text-[#FFB800] shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-white uppercase tracking-wider block">{selectedCore.name}</span>
                            <p className="text-[8px] text-text-tertiary leading-relaxed opacity-70">
                              Esta campanha gera automaticamente {selectedCore.id === 'brand-amazon' ? '6' : selectedCore.id === 'branding-kit' ? '5' : '9'} frames premium com consistência visual.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Premium Resolution (If applicable) */}
                    {(selectedModel?.style_id === 'nano-banana-2' || selectedModel?.style_id === 'nano-banana-pro' || selectedModel?.style_id === 'google/nano-banana-edit' || selectedModel?.style_id === 'gpt-image-2-image-to-image' || selectedModel?.name?.includes('Nano Banana') || selectedModel?.name?.includes('GPT Image 2')) && (
                      <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-3.5 bg-[#FFB800] rounded-full" />
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Resolução Premium</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {['1k', '2k', '4k'].map(res => (
                            <button
                              key={res}
                              onClick={() => setSelectedResolution(res)}
                              className={`py-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 group ${selectedResolution === res ? 'bg-[#FFB800]/10 border-[#FFB800]/40 shadow-[0_0_15px_rgba(255,184,0,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                            >
                              <span className={`text-[10px] font-black uppercase tracking-wider ${selectedResolution === res ? 'text-[#FFB800]' : 'text-white/60 group-hover:text-white'}`}>{res}</span>
                              <span className="text-[7px] opacity-40 uppercase font-bold tracking-tighter">
                                {res === '1k' ? 'Standard' : res === '2k' ? 'HD' : 'Ultra HD'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brand & Creative Optimization */}
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-3.5 bg-[#FFB800] rounded-full" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Otimização de Marca</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={async () => {
                            if (useBrandColors) { setUseBrandColors(false); return; }
                            setCheckingBrand(true);
                            try {
                              const res = await apiFetch(`/brands/${user.id}`);
                              const data = await res.json();
                              if (data.success && data.brand) {
                                setBrandData(data.brand);
                                setUseBrandColors(true);
                              } else {
                                setConfirmModalConfig({ title: 'Marca não Configurada', message: 'Ainda não tem uma identidade de marca configurada.', type: 'info', onConfirm: () => setShowConfirmModal(false) });
                                setShowConfirmModal(true);
                              }
                            } catch (e) { setUseBrandColors(false); } finally { setCheckingBrand(false); }
                          }}
                          className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 text-left group ${useBrandColors ? 'bg-[#FFB800]/10 border-[#FFB800]/30 shadow-[0_0_15px_rgba(255,184,0,0.08)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${useBrandColors ? 'bg-[#FFB800] text-black shadow-md' : 'bg-white/5 text-text-tertiary group-hover:text-white'}`}>
                              {checkingBrand ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${useBrandColors ? 'bg-[#FFB800] border-[#FFB800]' : 'border-white/10'}`}>
                              {useBrandColors && <CheckCircle2 size={10} className="text-black" />}
                            </div>
                          </div>
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-wider block ${useBrandColors ? 'text-white' : 'text-text-secondary'}`}>Identidade</span>
                            <span className="text-[8px] opacity-40 block mt-0.5">Aplicar cores da marca</span>
                          </div>
                        </button>

                        {brandData?.logo_url && (
                          <button 
                            onClick={() => setUseBrandLogo(!useBrandLogo)}
                            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 text-left group ${useBrandLogo ? 'bg-[#FFB800]/10 border-[#FFB800]/30 shadow-[0_0_15px_rgba(255,184,0,0.08)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${useBrandLogo ? 'bg-[#FFB800] text-black shadow-md' : 'bg-white/5 text-text-tertiary group-hover:text-white'}`}>
                                <ImageIcon size={16} />
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${useBrandLogo ? 'bg-[#FFB800] border-[#FFB800]' : 'border-white/10'}`}>
                                {useBrandLogo && <CheckCircle2 size={10} className="text-black" />}
                              </div>
                            </div>
                            <div>
                              <span className={`text-[10px] font-black uppercase tracking-wider block ${useBrandLogo ? 'text-white' : 'text-text-secondary'}`}>Logótipo</span>
                              <span className="text-[8px] opacity-40 block mt-0.5">Visível nos criativos</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Character Upload (Conditional) */}
                    {(['ugc-realistic', 'boutique-fashion'].includes(selectedCore?.agentTechnicalId) || ['ugc-realistic', 'boutique-fashion'].includes(selectedCore?.id)) && (
                      <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-3.5 bg-[#FFB800] rounded-full" />
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Personagem de Referência</span>
                        </div>

                        <div 
                          onClick={() => characterFileInputRef.current?.click()}
                          className={`relative group cursor-pointer aspect-[16/7] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2.5 overflow-hidden ${characterPreview ? 'border-[#FFB800]/40 bg-[#FFB800]/5' : 'border-white/10 hover:border-[#FFB800]/20 bg-white/[0.01]'}`}
                        >
                          {characterPreview ? (
                            <>
                              <img src={characterPreview} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                              <div className="relative z-10 flex items-center gap-4 px-4 py-2">
                                <div className="w-12 h-12 rounded-full border-2 border-[#FFB800]/50 p-0.5 bg-black/40 backdrop-blur-md overflow-hidden">
                                  <img src={characterPreview} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className="text-left">
                                  <span className="text-[9px] font-black text-[#FFB800] uppercase tracking-wider block">Personagem Ativa</span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setCharacterPreview(null); setCharacterFile(null); }} 
                                    className="text-[8px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest mt-0.5"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-9 h-9 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] group-hover:scale-105 transition-transform">
                                <Users size={16} />
                              </div>
                              <div className="text-center">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest block">Foto de Referência</span>
                                <span className="text-[8px] text-text-tertiary mt-0.5 block opacity-50">Mantém o mesmo rosto no criativo</span>
                              </div>
                            </>
                          )}
                          <input type="file" ref={characterFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'character')} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Style/Frames Selection (7 Grid Columns) */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* IF BRANDING KIT: Show integrated checklist frames */}
                    {isKit && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className="w-1.5 h-4 bg-[#FFB800] rounded-full" />
                          <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Frames de Campanha Integrados</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                          {(AGENT_STYLES[selectedCore.agentTechnicalId] || AGENT_STYLES[selectedCore.id] || []).map((s: any, idx: number) => {
                            const Icon = s.icon || Sparkles;
                            return (
                              <div key={s.id} className="flex items-start gap-4.5 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
                                  <span className="text-[10px] font-black">#{idx + 1}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black text-white block leading-tight uppercase tracking-wider">{s.name}</span>
                                  <p className="text-[8.5px] text-text-tertiary leading-relaxed opacity-70">{s.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* IF REGULAR AGENT: Show checklist of Narrative Styles */}
                    {!isKit && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className="w-1.5 h-4 bg-[#FFB800] rounded-full" />
                          <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Estilos Narrativos</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                          {(AGENT_STYLES[selectedCore.agentTechnicalId as keyof typeof AGENT_STYLES] || AGENT_STYLES[selectedCore.id as keyof typeof AGENT_STYLES] || []).map((s: any) => {
                            const config = styleConfigs[s.name] || { checked: false, quantity: 1, aspectRatio: '9:16' };
                            const isSelected = config.checked;
                            const Icon = s.icon || Sparkles;
                            return (
                              <div 
                                key={s.id} 
                                onClick={() => setStyleConfigs(prev => ({ ...prev, [s.name]: { ...config, checked: !config.checked } }))}
                                className={`flex items-start gap-4 p-4 rounded-3xl border transition-all cursor-pointer group ${isSelected ? 'bg-[#FFB800]/5 border-[#FFB800]/40 shadow-[0_0_20px_rgba(255,184,0,0.06)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                              >
                                <div className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-[#FFB800] text-black shadow-md' : 'bg-white/5 text-text-tertiary group-hover:text-white'}`}>
                                  <Icon size={16} />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <span className={`text-[10px] font-black uppercase tracking-wider block leading-tight ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{s.name}</span>
                                  {s.desc && <span className="text-[8.5px] text-text-tertiary leading-relaxed block opacity-70 line-clamp-2">{s.desc}</span>}
                                </div>
                                <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#FFB800] border-[#FFB800]' : 'border-white/10 group-hover:border-white/20'}`}>
                                  {isSelected && <CheckCircle2 size={10} className="text-black" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>

            {/* Navigation Footer */}
            <div className="shrink-0 px-10 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
              <button 
                onClick={() => wizardStep === 1 ? setShowCoreModal(false) : setWizardStep(prev => prev - 1)}
                className="px-6 py-2.5 rounded-full text-sm font-medium text-text-tertiary hover:text-white transition-all flex items-center gap-2"
              >
                {wizardStep === 1 ? 'Cancelar' : <><ArrowRight className="rotate-180" size={16} /> Voltar</>}
              </button>
              
              <div className="flex items-center gap-6">
                {wizardStep === 2 && (
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase tracking-widest text-[#FFB800]/80 block font-bold mb-0.5">Total</span>
                    <span className="text-xl font-black text-white leading-none">{totalCost} <span className="text-[12px] text-text-tertiary font-bold tracking-normal">CR.</span></span>
                  </div>
                )}
                
                <button 
                  onClick={() => {
                    if (wizardStep === 1 && selectedCore) setWizardStep(2);
                    else if (wizardStep === 2) setShowCoreModal(false);
                  }}
                  disabled={(wizardStep === 1 && !selectedCore)}
                  className="px-8 py-3 rounded-full bg-[#FFB800] text-black text-sm font-bold uppercase tracking-wide flex items-center gap-2 shadow-[0_0_30px_rgba(255,184,0,0.2)] disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                >
                  {wizardStep === 2 ? 'Finalizar' : 'Próximo'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay Temporário (Apenas enquanto espera batchId) */}
      {status === 'generating' && !sseProgress && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-[#FFB800]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#FFB800] rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Sparkles className="text-[#FFB800] animate-pulse" size={32} />
              </div>
           </div>
           <h3 className="text-2xl font-black tracking-tight text-white mb-2">A iniciar geração...</h3>
           <p className="text-text-secondary text-sm">O seu pedido foi adicionado à fila.</p>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
           <div className="bg-surface/90 backdrop-blur-2xl border border-[#FFB800]/30 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFB800]/20 flex items-center justify-center">
                 <ImagePlus size={20} className="text-[#FFB800]" />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-text-primary">Geração iniciada!</p>
                 <p className="text-[10px] text-text-tertiary">Acompanha o status no botão superior "A gerar".</p>
              </div>
           </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ProductCamera 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
}
