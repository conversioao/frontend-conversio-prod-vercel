import React, { useState, useRef, useEffect } from 'react';
import { ParticlesBackground } from './ui/ParticlesBackground';
import { 
  Video, Sparkles, Smartphone, Play, Camera, Zap, Package, 
  MessagesSquare, MapPin, TrendingUp, MonitorPlay, BookOpen, 
  Target, Users, Download, Maximize2, X, Plus, ImagePlus,
  Loader2, CheckCircle2, AlertCircle, Trash2, ChevronRight,
  ChevronDown, ArrowRight, Music, Send, Layers, Copy, Globe,
  Image as ImageIcon, Filter
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useMobile } from '../hooks/useMobile';
import { ProductCamera } from './ui/ProductCamera';
import { getUserPlan, PLANS } from '../utils/planUtils';

const VIDEO_CORES: any[] = [
  { id: 'ugc-smart-selector', name: '✨ Seletor Inteligente UGC', agentTechnicalId: 'ugc-smart-selector', icon: Sparkles, description: 'Orquestrador inteligente. Analisa a foto do produto e escolhe automaticamente o melhor estilo UGC para o produto.', credit_cost: 15 },
  { id: 'ugc-talking-head', name: '🗣️ Criador em Destaque (Selfie)', agentTechnicalId: 'ugc-talking-head', icon: Smartphone, description: 'Criador/a angolano/a a falar diretamente para a câmara (selfie). Autêntico, sem cortes, e com o produto na mão (escala real).', credit_cost: 15 },
  { id: 'ugc-product-demo', name: '🚀 Demonstração de Produto', agentTechnicalId: 'ugc-product-demo', icon: Zap, description: 'Demonstração ativa do produto em uso real num ambiente angolano moderno. Foco no processo de uso sem cortes.', credit_cost: 15 },
  { id: 'ugc-before-after', name: '🔄 Antes & Depois', agentTechnicalId: 'ugc-before-after', icon: TrendingUp, description: 'Demonstração da transformação real e orgânica: antes do produto vs depois com o produto.', credit_cost: 15 },
  { id: 'ugc-unboxing', name: '📦 Abertura de Embalagem (Unboxing)', agentTechnicalId: 'ugc-unboxing', icon: Package, description: 'Processo de abrir a embalagem e revelação gradual do produto com reação entusiasmada.', credit_cost: 15 },
  { id: 'ugc-pov', name: '👁️ POV (Primeira Pessoa)', agentTechnicalId: 'ugc-pov', icon: Camera, description: 'Câmara representa os seus olhos (primeira pessoa) a interagir com o produto em Luanda. Super imersivo.', credit_cost: 15 },
  { id: 'ugc-friend-recommendation', name: '🤝 Recomendação de Amigo', agentTechnicalId: 'ugc-friend-recommendation', icon: Users, description: 'Recomendação super casual e espontânea para um amigo, simulando mensagem de vídeo de WhatsApp.', credit_cost: 15 },
  { id: 'ugc-reaction-story', name: '🎭 História & Reação', agentTechnicalId: 'ugc-reaction-story', icon: MessagesSquare, description: 'Começa com uma frustração do dia-a-dia luandense e revela o produto como solução na segunda metade.', credit_cost: 15 }
];

const RATIOS = [
  { id: '9:16', name: '9:16', desc: 'Vertical (TikTok/Stories)' },
  { id: '16:9', name: '16:9', desc: 'Widescreen (YouTube)' },
  { id: '1:1', name: '1:1', desc: 'Quadrado (Instagram)' },
];

const QUANTITIES = [1, 2, 3, 4];

interface VideoGeneratorProps {
  initialCore?: string | null;
  onClearCore?: () => void;
  onProgressUpdate?: (percent: number | null) => void;
}

export function VideoGenerator({ initialCore, onClearCore, onProgressUpdate }: VideoGeneratorProps = {}) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('conversio_user') || '{}'));
  
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedCore, setSelectedCore] = useState<any>(VIDEO_CORES[0]);
  const [ratio, setRatio] = useState('9:16');
  const [quantity, setQuantity] = useState(1);
  const [prompt, setPrompt] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // Can be Blob URL or Gallery URL
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [sseProgress, setSseProgress] = useState<{ percent: number; label: string; elapsed: number } | null>(null);
  
  const [showToast, setShowToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<any>({ title: '', message: '', onConfirm: () => {} });

  // ─── PROMPT PREVIEW (Botão de Teste) ──────────────────────────────────────
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  
  // UI States
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const sseRef = useRef<EventSource | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();

  const totalCost = (selectedModel?.credit_cost || 10) * quantity + (selectedCore?.credit_cost || 0);

  useEffect(() => {
    fetchModels();
    const handleStorage = () => setUser(JSON.parse(localStorage.getItem('conversio_user') || '{}'));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchModels = async () => {
    try {
      const res = await apiFetch('/models?type=video&category=model');
      const data = await res.json();
      if (data.success) {
        setAvailableModels(data.models || []);
        if (data.models && data.models.length > 0) {
           setSelectedModel(
             data.models.find((m: any) => m.name.includes('Veo 3.1 Lite')) || 
             data.models.find((m: any) => m.name.includes('Lite')) || 
             data.models[0]
           );
        }
      }
    } catch (e) {
      console.warn('[Fetch] Failed to load video models');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadedImage(URL.createObjectURL(file));
      setCapturedFile(null);
    }
  };

  // ─── HANDLER: Dry-run para preview do prompt que seria enviado ao Kie.ai ───
  const handlePromptPreview = async () => {
    if (!uploadedImage && !prompt.trim()) {
      setConfirmModalConfig({
        title: 'Dados em Falta',
        message: 'Carrega uma imagem do produto e/ou escreve uma descrição para simular o prompt.',
        type: 'warning',
        onConfirm: () => setShowConfirmModal(false)
      });
      setShowConfirmModal(true);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewPrompt(null);
    setShowPromptModal(true);

    try {
      const formData = new FormData();
      formData.append('userPrompt', prompt);
      formData.append('prompt', prompt);
      formData.append('model_name', selectedModel?.name || 'Veo 3');
      formData.append('model_id', selectedModel?.id || '');
      formData.append('core_id', selectedCore?.agentTechnicalId || 'ugc-daily-action');
      formData.append('core_model', selectedCore?.agentTechnicalId || '');
      formData.append('core_name', selectedCore?.name || '');
      formData.append('aspectRatio', ratio);
      formData.append('quantity', '1');
      formData.append('mode', 'video');
      formData.append('dry_run', 'true'); // Sinaliza ao backend para NÃO gerar, apenas retornar o prompt
      formData.append('userId', user.id || 'preview-test');

      if (uploadedFile) {
        formData.append('image', uploadedFile);
      } else if (capturedFile) {
        formData.append('image', capturedFile);
      } else if (uploadedImage && uploadedImage.startsWith('http')) {
        formData.append('referenceImageUrl', uploadedImage);
      }

      const res = await apiFetch('/generate/video/preview', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.prompt) {
        setPreviewPrompt(data.prompt);
      } else {
        // Fallback: mostrar o prompt simulado localmente com os dados disponíveis
        setPreviewPrompt(buildLocalPromptPreview());
      }
    } catch (err) {
      // Se o endpoint de preview não existir ainda, simula localmente
      setPreviewPrompt(buildLocalPromptPreview());
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Constrói uma simulação local do prompt para preview se o endpoint não existir
  const buildLocalPromptPreview = () => {
    const agentName = selectedCore?.name || 'UGC Agente';
    const agentId = selectedCore?.agentTechnicalId || 'ugc-daily-action';
    const now = new Date().toISOString();
    return {
      _meta: {
        agent_id: agentId,
        agent_name: agentName,
        model: selectedModel?.name || 'Veo 3',
        aspect_ratio: ratio,
        duration: '8 segundos',
        simulated_at: now,
        note: 'Este é um preview simulado localmente. O prompt real é gerado pelo backend com análise GPT-4o da imagem do produto.'
      },
      video_prompt: {
        agent_id: agentId,
        agent_style: agentName,
        product_reference: {
          name: '[Nome do produto será extraído da imagem pelo GPT-4o]',
          visual_description: '[Descrição visual 100% fiel extraída pelo GPT-4o Vision da imagem carregada]',
          scale_note: 'CRITICAL: Manter escala real 1:1. Produto na mão do criador em todo o vídeo.',
          consistency_note: 'O produto no vídeo DEVE ser idêntico à imagem de referência fornecida.'
        },
        talent: {
          description: 'Criador/a Black Angolano/a, tom de pele escuro a castanho-rico, cabelo natural afro / tranças / twists, roupa casual moderna de Luanda.',
          casting_note: 'OBRIGATÓRIO: Elenco Black Angolano/a. Estética urbana de Luanda.',
          energy: 'Caloroso, autêntico, relatable — como gravar um WhatsApp Status para amigos'
        },
        setting: {
          location: '[Cenário da casa de Luanda autêntico e perfeitamente adaptado ao produto analisado pelo GPT-4o]',
          angolan_authenticity_cues: 'Elementos visuais angolanos: decoração moderna, madeira natural, tons quentes de Luanda'
        },
        camera: {
          style: 'POV Smartphone, vertical 9:16, 4K HD, handheld selfie',
          shots: [
            'Shot 1 — HOOK (00:00–00:03): Criador segura o produto perto da lente. Gancho inicial em PT-AO.',
            'Shot 2 — BENEFÍCIO (00:03–00:06): Demonstração do produto em uso real no cenário angolano.',
            'Shot 3 — CTA (00:06–00:08): Sorriso caloroso, produto visível, CTA em PT-AO. Fim suave sem corte.'
          ],
          ending_rule: 'CRÍTICO: O vídeo termina de forma natural e suave. SEM corte abrupto. SEM tela preta súbita.'
        },
        audio: {
          voice_language: 'INSTRUÇÃO CRÍTICA PARA VEO 3: Gerar áudio de voz em 100% Português de Angola (pt-AO) com sotaque nativo de Luanda. NÃO Português do Brasil. NÃO Português de Portugal.',
          voice_tone: 'Caloroso, rápido, conversacional e autêntico — como um amigo de Luanda a partilhar uma recomendação',
          music: 'Afrobeat subtil ou Afro-house suave de fundo (volume baixo, sem dominar a voz)'
        },
        narration_script: {
          shot_1_hook: `[Gancho de 3s em PT-AO gerado pelo GPT-4o com base no produto: "${prompt || 'produto a ser analisado'}"]`,
          shot_2_benefit: '[Benefício de 3s em PT-AO gerado pelo GPT-4o com base na análise do produto]',
          shot_3_cta: '[CTA de 2s em PT-AO gerado pelo GPT-4o — casual e angolano]'
        },
        duration_seconds: 8,
        aspect_ratio: ratio,
        format: agentName,
        pacing: 'Rápido, autêntico, estilo redes sociais angolanas'
      },
      copy: '[Legenda persuasiva em PT-AO gerada pelo GPT-4o com gancho, benefícios e CTA angolano]',
      hashtags: '#Angola #Luanda #MarketingAngola #ConversioAI + hashtags específicas do produto'
    };
  };

  const handleCopyPrompt = () => {
    if (previewPrompt) {
      navigator.clipboard.writeText(JSON.stringify(previewPrompt, null, 2));
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage && !prompt.trim()) return;

    const currentUser = JSON.parse(localStorage.getItem('conversio_user') || '{}');
    if (currentUser.credits < totalCost) {
      setConfirmModalConfig({
        title: 'Créditos Insuficientes',
        message: `Precisas de ${totalCost} créditos, mas tens apenas ${currentUser.credits}.`,
        type: 'warning',
        onConfirm: () => setShowConfirmModal(false)
      });
      setShowConfirmModal(true);
      return;
    }

    const formData = new FormData();
    const fullPrompt = prompt;

    formData.append('userId', user.id);
    formData.append('userPrompt', fullPrompt);
    formData.append('prompt', fullPrompt); // Backwards compatibility
    formData.append('model_name', selectedModel?.name || '');
    formData.append('model_id', selectedModel?.id || '');
    formData.append('core_id', selectedCore?.agentTechnicalId || '');
    formData.append('core_model', selectedCore?.agentTechnicalId || ''); // Backwards compatibility
    formData.append('core_name', selectedCore?.name || '');
    formData.append('aspectRatio', ratio);
    formData.append('quantity', quantity.toString());
    formData.append('mode', 'video');

    // Handle File vs Gallery URL
    if (uploadedFile) {
        formData.append('image', uploadedFile);
    } else if (capturedFile) {
        formData.append('image', capturedFile);
    } else if (uploadedImage && uploadedImage.startsWith('http')) {
        // This is a gallery URL
        formData.append('referenceImageUrl', uploadedImage);
    }

    setStatus('generating');

    try {
      const res = await apiFetch('/generate/video', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setShowToast(true);
        if (data.batchId) {
            connectToProgress(data.batchId);
            // Fetch fresh records to show them in the grid immediately
            const fetchLatest = async () => {
                try {
                    const r = await apiFetch(`/generations?userId=${user.id}`);
                    const rData = await r.json();
                    if (rData.success) {
                        setGeneratedItems(rData.generations.filter((g: any) => g.batch_id === data.batchId));
                    }
                } catch (err) {}
            };
            fetchLatest();
            // Trigger immediate list refresh in App.tsx
            window.dispatchEvent(new CustomEvent('refreshGenerations'));
        }
      } else {
        setConfirmModalConfig({ title: 'Erro', message: data.message || 'Falha na geração.', type: 'error', onConfirm: () => setShowConfirmModal(false) });
        setShowConfirmModal(true);
        setStatus('idle');
      }
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  const connectToProgress = (batchId: string) => {
    let elapsed = 0;
    setSseProgress({ percent: 0, label: 'A iniciar pipeline...', elapsed: 0 });
    elapsedRef.current = setInterval(() => { elapsed++; setSseProgress(prev => prev ? { ...prev, elapsed } : null); }, 1000);

    const apiBase = (import.meta.env.VITE_API_URL || 'https://conversioai-conversio-ai-backend.odbegs.easypanel.host');
    const es = new EventSource(`${apiBase}/api/generations/progress/${batchId}`);
    sseRef.current = es;

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'progress') {
            if (data.status === 'generating') {
              setSseProgress({ percent: data.pipeline_progress || 0, label: data.pipeline_status || 'A processar...', elapsed });
              if (onProgressUpdate) onProgressUpdate(data.pipeline_progress);
            }
            if (data.status === 'completed' || data.status === 'failed') {
              es.close();
              if (elapsedRef.current) clearInterval(elapsedRef.current);
              setSseProgress(null);
              setStatus('done');
              const res = await apiFetch(`/generations?userId=${user.id}`);
              const resData = await res.json();
              if (resData.success) {
                  setGeneratedItems(resData.generations.filter((g: any) => g.batch_id === batchId));
              }
              window.dispatchEvent(new Event('storage'));
            }
        }
      } catch(e) {}
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] w-full max-w-6xl mx-auto relative px-4 sm:px-0 scrollbar-hide overflow-y-auto">
      <ParticlesBackground type="video" />

      {/* ─── Results & Progress Area ─── */}
      {(status === 'done' || (status === 'generating' && sseProgress)) && (
        <div className="w-full max-w-4xl mx-auto mt-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-center justify-between mb-6 px-4">
            <div>
              <h2 className="text-xl font-black text-text-primary tracking-tight">
                {status === 'generating' ? 'Forjando Vídeo Premium...' : 'Conteúdo Gerado'}
              </h2>
            </div>
            {status === 'done' && (
              <button 
                onClick={() => setStatus('idle')}
                className="text-xs font-bold text-accent hover:text-[#FFB800] transition-colors flex items-center gap-2"
              >
                <Plus size={14} /> Gerar Mais
              </button>
            )}
          </div>
          
          <div className={`relative px-4 sm:px-0 transition-all ${
            (generatedItems.length === 1 || (generatedItems.length === 0 && quantity === 1)) 
              ? 'max-w-md mx-auto' 
              : 'max-w-5xl mx-auto'
          }`}>
            <div className={`grid gap-8 ${
              (generatedItems.length === 1 || (generatedItems.length === 0 && quantity === 1)) 
                ? 'grid-cols-1' 
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
            }`}>
                {(generatedItems.length > 0 ? generatedItems : Array.from({ length: quantity })).map((item, idx) => (
                    <div key={item?.id || `placeholder-${idx}`} className="flex flex-col gap-4">
                        <div className="rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/10 relative group/result aspect-[9/16] bg-surface shrink-0">
                            {!item || item.status === 'processing' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-10 bg-surface/80 backdrop-blur-md animate-pulse-glow">
                                    {/* Centered Percentage and Yellow Spinner */}
                                    <div className="relative flex items-center justify-center w-28 h-28">
                                        <div className="absolute inset-0 rounded-full border-4 border-[#FFB800]/5" />
                                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FFB800] animate-spin shadow-[0_0_20px_rgba(255,184,0,0.3)]" />
                                        
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-[#FFB800] drop-shadow-[0_0_10px_rgba(255,184,0,0.4)]">
                                                {Math.round(sseProgress?.percent || 0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-lg font-black text-text-primary tracking-tight">
                                            {sseProgress?.label || 'A Iniciar Produção...'}
                                        </p>
                                        <p className="text-[10px] text-[#FFB800] font-black uppercase tracking-[0.3em] opacity-80">
                                            {idx + 1} de {quantity} • Vídeo Premium
                                        </p>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5">
                                        <div 
                                            className="h-full bg-[#FFB800] transition-all duration-700 shadow-[0_0_20px_rgba(255,184,0,0.4)]" 
                                            style={{ width: `${sseProgress?.percent || 0}%` }} 
                                        />
                                    </div>
                                </div>
                            ) : item.status === 'completed' ? (
                                <>
                                    <video 
                                        src={item.result_url} 
                                        className="w-full h-full object-cover"
                                        controls
                                        autoPlay={idx === 0}
                                        loop
                                        muted
                                    />
                                    <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover/result:opacity-100 transition-opacity translate-x-4 group-hover/result:translate-x-0 group-hover/result:duration-500">
                                        <a href={item.result_url} download className="p-4 rounded-2xl bg-[#FFB800] text-black hover:scale-110 transition-all shadow-2xl">
                                            <Download size={22} />
                                        </a>
                                    </div>
                                    <div className="absolute top-6 left-6">
                                        <div className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <Play size={10} className="text-[#FFB800]" fill="#FFB800" />
                                            Conversio Video
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/5 gap-6 p-10 text-center">
                                    <AlertCircle size={48} className="text-red-500/50" />
                                    <div>
                                        <p className="text-xl font-black text-white uppercase tracking-widest mb-2">Falha na Produção</p>
                                        <p className="text-xs text-text-tertiary leading-relaxed px-4">
                                            {item.metadata?.error || 'Ocorreu um erro ao processar o vídeo. Os teus créditos foram devolvidos.'}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setStatus('idle')}
                                        className="mt-4 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                                    >
                                        Tentar Novamente
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Copy & Hashtags Display */}
                        {item?.status === 'completed' && (item.copy || item.hashtags) && (
                            <div className="p-6 rounded-[2rem] bg-surface/50 backdrop-blur-md border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-4 text-[#FFB800]">
                                    <MessagesSquare size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Copywriting Gerado</span>
                                </div>
                                {item.copy && (
                                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-4 font-medium">
                                        {item.copy}
                                    </p>
                                )}
                                {item.hashtags && (
                                    <p className="text-xs text-[#FFB800] font-medium leading-relaxed">
                                        {item.hashtags}
                                    </p>
                                )}
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(`${item.copy || ''}\n\n${item.hashtags || ''}`)}
                                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all flex items-center gap-2 border border-white/5"
                                    >
                                        <Copy size={14} /> Copiar Texto
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto animate-in fade-in duration-700 ${status === 'idle' ? '' : 'hidden'}`}>
          <div className="w-full text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Produção de <span className="text-[#FFB800]">Vídeo</span> AI
            </h1>
            <p className="text-text-secondary text-sm mt-2 opacity-80">Transforme produtos em campanhas virais de alta conversão.</p>
          </div>

          <div className="relative w-full rounded-[2rem] p-[1px] shadow-2xl group transition-all">
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#FFB800_100%)] opacity-30"></div>
            </div>
            
            <div className="relative bg-surface/95 backdrop-blur-2xl rounded-[calc(2rem-1px)] p-4 flex flex-col gap-3 h-full w-full border border-border-subtle hover:border-accent/30 transition-colors">
               <div className="flex gap-4 items-start">
                 {uploadedImage && (
                   <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-accent/20 shrink-0 group/img shadow-xl">
                     <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                     <button 
                       onClick={() => { setUploadedImage(null); setUploadedFile(null); setCapturedFile(null); }} 
                       className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                     >
                       <X size={14} className="text-white" />
                     </button>
                   </div>
                 )}
                 <textarea
                   value={prompt}
                   onChange={e => setPrompt(e.target.value)}
                   placeholder="Descreve o mood ou roteiro do vídeo em detalhes..."
                   className="w-full bg-transparent text-text-primary placeholder:text-text-tertiary resize-none outline-none min-h-[80px] py-1 text-base scrollbar-hide"
                 />
               </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <div className="flex items-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] transition-colors">
                            <ImagePlus size={18} />
                        </button>
                        <button 
                            onClick={() => setShowGalleryModal(true)}
                            className="p-2.5 rounded-full bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] transition-colors"
                        >
                            <ImageIcon size={18} />
                        </button>
                    </div>
                   
                   <div className="relative">
                     <button onClick={() => setActiveDropdown(activeDropdown === 'model' ? null : 'model')} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-base border border-border-subtle text-[10px] font-bold text-text-secondary hover:text-[#FFB800] transition-colors">
                        <Sparkles size={12} className="text-[#FFB800]" /> {selectedModel?.name || 'Modelo'}
                     </button>
                     {activeDropdown === 'model' && (
                       <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                         {availableModels.map(m => (
                           <button key={m.id} onClick={() => { setSelectedModel(m); setActiveDropdown(null); }} className={`w-full text-left px-4 py-2 transition-colors ${selectedModel?.id === m.id ? "bg-[#FFB800]/10" : "hover:bg-surface-hover"}`}>
                             <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-[13px] font-bold text-text-primary">{m.name}</span>
                               <span className="px-1.5 py-0.5 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black">{m.credit_cost} CR.</span>
                             </div>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                   
                    <button
                        onClick={() => { setWizardStep(1); setShowWizardModal(true); }}
                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 overflow-hidden
                        ${selectedCore
                            ? 'bg-[#FFB800]/20 border border-[#FFB800]/50 text-[#FFB800] shadow-[0_0_12px_rgba(255,184,0,0.3)]'
                            : 'bg-bg-base border border-border-subtle text-text-secondary hover:text-[#FFB800] hover:border-[#FFB800]/30'}`}
                    >
                        <Layers size={12} className={selectedCore ? 'text-[#FFB800]' : ''} />
                        <span className="flex items-center gap-1.5 line-clamp-1">
                            {selectedCore ? selectedCore.name : 'Configurar Vídeo'}
                            {selectedCore && (
                                <span className="hidden sm:inline opacity-60 font-medium border-l border-[#FFB800]/20 pl-1.5 ml-0.5">{ratio} • x{quantity}</span>
                            )}
                        </span>
                        <ChevronRight size={10} className="opacity-50" />
                    </button>
                  </div>

                 <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={handleGenerate}
                      disabled={status === 'generating' || (!uploadedImage && !prompt.trim())}
                      className="px-6 py-3.5 rounded-full bg-[#FFB800] text-black animate-pulse-glow hover:scale-105 transition-all shadow-lg disabled:opacity-50 flex items-center gap-3"
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

      {showWizardModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-500"
          onClick={() => setShowWizardModal(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0A0A0A]/60 backdrop-blur-[40px] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500"
            onClick={e => e.stopPropagation()}
          >
            {/* Wizard Progress Indicator */}
            <div className="flex items-center px-10 pt-6 gap-3 shrink-0">
              {[1, 2].map(step => (
                <div key={step} className="flex-1 flex flex-col gap-2">
                  <div className={`h-1 rounded-full transition-all duration-700 ${wizardStep >= step ? 'bg-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.4)]' : 'bg-white/10'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${wizardStep === step ? 'text-[#FFB800]' : 'text-text-tertiary'}`}>
                    Passo 0{step}
                  </span>
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between px-10 pt-8 pb-6 shrink-0">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.3)]">
                    {wizardStep === 1 && <Layers size={20} className="text-black" />}
                    {wizardStep === 2 && <Smartphone size={20} className="text-black" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {wizardStep === 1 && <>Escolher <span className="text-[#FFB800]">Agente</span></>}
                      {wizardStep === 2 && <>Ajustar <span className="text-[#FFB800]">Detalhes</span></>}
                    </h2>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowWizardModal(false)} 
                className="p-2.5 rounded-xl bg-white/5 text-text-tertiary hover:text-white transition-all border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto px-10 pb-10 flex-1 custom-scrollbar">
              
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {VIDEO_CORES.map((core) => {
                    const isSelected = selectedCore?.id === core.id;
                    const Icon = core.icon;
                    return (
                      <button
                        key={core.id}
                        onClick={() => { setSelectedCore(core); }}
                        className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col items-center text-center ${
                          isSelected
                            ? 'bg-[#FFB800]/10 border-[#FFB800]/50 shadow-[0_0_30px_rgba(255,184,0,0.1)]'
                            : 'bg-white/[0.02] border-white/5 hover:border-[#FFB800]/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${isSelected ? 'bg-[#FFB800] text-black shadow-lg' : 'bg-white/5 text-text-secondary group-hover:text-[#FFB800]'}`}>
                          <Icon size={24} strokeWidth={isSelected ? 2 : 1.5} />
                        </div>
                        <p className={`text-lg font-medium tracking-tight mb-1.5 ${isSelected ? 'text-[#FFB800]' : 'text-white'}`}>{core.name}</p>
                        <p className={`text-xs font-normal leading-relaxed opacity-80 ${isSelected ? 'text-[#FFB800]/80' : 'text-text-secondary'}`}>{core.description}</p>
                        {isSelected && <div className="absolute top-4 right-4 text-[#FFB800]"><CheckCircle2 size={18} /></div>}
                      </button>
                    );
                  })}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Formato de Saída</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {RATIOS.map(r => (
                        <button 
                          key={r.id}
                          onClick={() => setRatio(r.id)}
                          className={`p-4 rounded-xl border text-center transition-all ${ratio === r.id ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]' : 'bg-white/[0.02] border-white/5 text-text-tertiary hover:border-white/10'}`}
                        >
                          <span className="text-sm font-medium">{r.name}</span>
                          <span className="text-[10px] block opacity-50 font-normal mt-0.5">{r.desc.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest px-1">Versões em Massa</h4>
                    <div className="flex items-center gap-2">
                      {QUANTITIES.map(q => (
                        <button 
                          key={q} 
                          onClick={() => setQuantity(q)}
                          className={`flex-1 py-3 flex flex-col items-center justify-center rounded-xl transition-all ${
                            quantity === q 
                              ? 'bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800]' 
                              : 'bg-white/[0.02] border border-white/5 text-text-tertiary hover:border-white/10'
                          }`}
                        >
                          <span className="text-base font-semibold">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation Footer */}
            <div className="shrink-0 px-10 py-6 border-t border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl">
              <button 
                onClick={() => wizardStep === 1 ? setShowWizardModal(false) : setWizardStep(prev => prev - 1)}
                className="px-6 py-2.5 rounded-full text-sm font-medium text-text-tertiary hover:text-white transition-all flex items-center gap-2"
              >
                {wizardStep === 1 ? 'Cancelar' : <><ArrowRight className="rotate-180" size={16} /> Voltar</>}
              </button>
              
              <button 
                onClick={() => {
                  if (wizardStep === 1 && selectedCore) setWizardStep(2);
                  else if (wizardStep === 2) setShowWizardModal(false);
                }}
                disabled={(wizardStep === 1 && !selectedCore)}
                className="px-8 py-3 rounded-full bg-[#FFB800] text-black text-sm font-bold uppercase tracking-wide flex items-center gap-2 shadow-[0_0_30px_rgba(255,184,0,0.2)] disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
              >
                {wizardStep === 2 ? 'Finalizar' : 'Próximo'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Gallery Modal ─── */}
      {showGalleryModal && (
          <GalleryPickerModal 
            userId={user.id} 
            onSelect={(url) => {
                setUploadedImage(url);
                setUploadedFile(null);
                setCapturedFile(null);
                setShowGalleryModal(false);
            }} 
            onClose={() => setShowGalleryModal(false)} 
          />
      )}

      <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} {...confirmModalConfig} />
      {showToast && (
        <div className="fixed bottom-10 right-10 z-[300] animate-in slide-in-from-right-10 duration-700">
            <div className="bg-[#111] border border-[#FFB800]/30 rounded-2xl p-5 shadow-2xl flex items-center gap-4">
                <div className="p-2.5 bg-[#FFB800] text-black rounded-xl">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <p className="text-sm font-black text-text-primary uppercase">Pipeline Iniciado</p>
                    <p className="text-[10px] text-text-secondary font-bold opacity-60">As tuas criações estão a ser forjadas.</p>
                </div>
            </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: PREVIEW DO PROMPT (BOTÃO TESTAR PROMPT — TEMPORÁRIO)
      ══════════════════════════════════════════════════════════════════════ */}
      {showPromptModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setShowPromptModal(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#080808] border border-[#FFB800]/20 rounded-[2.5rem] shadow-[0_0_120px_rgba(255,184,0,0.08)] overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center">
                  <Zap size={18} className="text-[#FFB800]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Preview do Prompt — <span className="text-[#FFB800]">{selectedCore?.name || 'Agente UGC'}</span></h3>
                  <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-[0.2em] mt-0.5">Prompt exato que seria enviado ao Kie.ai / Veo 3</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPrompt}
                  disabled={!previewPrompt}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFB800] text-black text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 shadow-lg"
                >
                  {promptCopied ? <><CheckCircle2 size={14} /> Copiado!</> : <><Copy size={14} /> Copiar JSON</>}
                </button>
                <button onClick={() => setShowPromptModal(false)} className="p-2.5 rounded-xl bg-white/5 text-text-tertiary hover:text-white transition-all border border-white/10">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Badges de info */}
            <div className="flex items-center gap-2 px-8 py-3 bg-black/20 shrink-0 border-b border-white/5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-[10px] font-black uppercase tracking-widest">
                {selectedCore?.agentTechnicalId || 'ugc-kitchen-home'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-text-secondary text-[10px] font-black uppercase tracking-widest">
                {selectedModel?.name || 'Veo 3'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-text-secondary text-[10px] font-black uppercase tracking-widest">
                {ratio} • 8s
              </span>
              <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">
                ✓ PT-AO Angola
              </span>
              <span className="ml-auto text-[10px] text-text-tertiary font-bold">
                🔧 Modo Teste — Sem consumo de créditos
              </span>
            </div>

            {/* Body — JSON preview */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-[#FFB800]/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FFB800] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-white uppercase tracking-widest">A Simular Pipeline...</p>
                    <p className="text-[10px] text-text-tertiary mt-1">GPT-4o está a analisar a imagem e a construir o prompt</p>
                  </div>
                </div>
              ) : previewPrompt ? (
                <div className="p-6">
                  {/* _meta info block */}
                  {previewPrompt._meta && (
                    <div className="mb-4 p-4 rounded-2xl bg-[#FFB800]/5 border border-[#FFB800]/15">
                      <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-2">ℹ️ Informação da Simulação</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{previewPrompt._meta.note}</p>
                    </div>
                  )}
                  {/* Final Prompt Highlight */}
                  {previewPrompt.final_veo3_prompt && (
                    <div className="mb-4 p-5 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 shadow-[0_0_20px_rgba(255,184,0,0.1)]">
                      <p className="text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={14} /> Prompt Final para Veo 3
                      </p>
                      <p className="text-sm font-medium text-white leading-relaxed whitespace-pre-wrap">
                        {previewPrompt.final_veo3_prompt}
                      </p>
                    </div>
                  )}
                  <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 mt-6">JSON Bruto Retornado</p>
                  <pre className="text-xs text-green-300/90 leading-relaxed whitespace-pre-wrap break-words font-mono bg-black/40 rounded-2xl p-6 border border-white/5 overflow-x-auto">
                    {JSON.stringify(previewPrompt, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center opacity-40">
                  <AlertCircle size={40} className="text-red-400" />
                  <p className="text-sm font-black text-white uppercase">Não foi possível gerar o preview</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-8 py-4 border-t border-white/5 bg-black/30 flex items-center justify-between">
              <p className="text-[10px] text-text-tertiary">
                💡 Copia este JSON e cola diretamente no painel do <strong className="text-text-secondary">Kie.ai</strong> para testar manualmente.
              </p>
              <button
                onClick={handleCopyPrompt}
                disabled={!previewPrompt}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-[11px] font-black uppercase tracking-widest hover:bg-[#FFB800]/20 transition-all disabled:opacity-30"
              >
                {promptCopied ? <><CheckCircle2 size={13} /> Copiado!</> : <><Copy size={13} /> Copiar Prompt</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * GalleryPickerModal
 * Allow selecting from previous image generations
 */
function GalleryPickerModal({ userId, onSelect, onClose }: { userId: string, onSelect: (url: string) => void, onClose: () => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await apiFetch(`/generations?userId=${userId}&type=image&status=completed&limit=24`);
                const data = await res.json();
                if (data.success) setItems(data.generations || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [userId]);

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl bg-[#080808] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col h-[85vh] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-widest uppercase">Escolher da Galeria</h3>
                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-[0.2em] mt-1">Gerações de Imagens Anteriores</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-text-tertiary hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#FFB800]" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.result_url)}
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 hover:border-[#FFB800]/50 transition-all shadow-lg"
                                >
                                    <img src={item.result_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Plus size={32} className="text-[#FFB800]" />
                                    </div>
                                </button>
                            ))}
                            {items.length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-40">
                                    <ImageIcon size={48} className="mx-auto mb-4" />
                                    <p className="text-white font-bold uppercase tracking-widest">Nenhuma imagem gerada</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
