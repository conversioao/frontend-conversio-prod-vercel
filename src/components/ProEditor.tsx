import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MousePointer, Image as ImageIcon, Type, Square, Sliders, Layers, Download, Undo, Redo, ZoomIn, ZoomOut, Maximize, Trash2, Copy, Eye, EyeOff, Lock, Unlock, X, Circle, Star, Minus, FlipHorizontal2, FlipVertical2, Crop, PlusCircle, AlignCenter, AlignLeft, AlignRight, RotateCcw, FilePlus } from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface ElementBase {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode: string;
  locked: boolean;
  visible: boolean;
  shadow: { active: boolean, color: string, blur: number, offsetX: number, offsetY: number };
}

interface ImageElement extends ElementBase {
  type: 'image';
  src: string;
  imgElement?: HTMLImageElement;
}

interface TextElement extends ElementBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: number;
  lineHeight: number;
  align: 'left' | 'center' | 'right' | 'justify';
  bgActive: boolean;
  bgColor: string;
  padding: number;
}

interface ShapeElement extends ElementBase {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'line' | 'star';
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

type CanvasElement = ImageElement | TextElement | ShapeElement;

interface AppState {
  width: number;
  height: number;
  artboardBg: string; // artboard background color
  elements: CanvasElement[];
}

const FONTS = ['Roboto', 'Open Sans', 'Montserrat', 'Playfair Display', 'Lato', 'Oswald', 'Raleway', 'Merriweather', 'Pacifico', 'Dancing Script', 'Bebas Neue', 'Anton'];

const initialFilters = { brightness: 0, contrast: 0, saturate: 0, hue: 0, blur: 0, sepia: 0, opacity: 100, colorOverlay: '#000000', bw: false, vignette: 0, temp: 0, sharpen: 0 };

const FORMAT_PRESETS = [
  { label: 'Quadrado (1:1)', w: 1080, h: 1080, icon: '□' },
  { label: 'Instagram Feed (4:5)', w: 1080, h: 1350, icon: '📷' },
  { label: 'Stories / Reels (9:16)', w: 1080, h: 1920, icon: '📱' },
  { label: 'Facebook Post', w: 1200, h: 628, icon: '👤' },
  { label: 'Twitter / X', w: 1200, h: 675, icon: '𝕏' },
  { label: 'LinkedIn Post', w: 1200, h: 627, icon: '💼' },
  { label: 'YouTube Thumbnail', w: 1280, h: 720, icon: '▶' },
  { label: 'Pinterest (2:3)', w: 1000, h: 1500, icon: '📌' },
  { label: 'A4 Horizontal', w: 2480, h: 1754, icon: '📄' },
  { label: 'Livre / Personalizado', w: 800, h: 600, icon: '✏' },
];

interface ProEditorProps {
  onExit?: () => void;
}

export function ProEditor({ onExit }: ProEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [db, setDb] = useState<AppState>({
    width: 1080,
    height: 1080,
    artboardBg: '#ffffff',
    elements: []
  });
  
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activePanel, setActivePanel] = useState<'properties' | 'adjustments' | 'layers'>('layers');
  const [isReady, setIsReady] = useState(false);
  const [projectName, setProjectName] = useState('Arte Em Branco');
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_PRESETS[0]);
  const [textEditing, setTextEditing] = useState<{ id: string; text: string } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showNewArtModal, setShowNewArtModal] = useState(false);


  // Interaction refs to avoid state closures in event listeners
  const interaction = useRef({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    dragHandle: null as string | null,
    startX: 0,
    startY: 0,
    origElem: null as any
  });

  const stateRef = useRef(db);
  const selectedRef = useRef(selectedId);
  const zoomRef = useRef(zoomLevel);

  useEffect(() => {
    stateRef.current = db;
    selectedRef.current = selectedId;
    zoomRef.current = zoomLevel;
  }, [db, selectedId, zoomLevel]);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS.map(f => f.replace(/ /g, '+')).join('&family=')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    setIsReady(true);
    
    // Initial history save
    saveState(db);
  }, []);

  const saveState = (newState: AppState) => {
    const stateStr = JSON.stringify(newState, (k, v) => k === 'imgElement' ? undefined : v);
    setHistory(prev => {
       const newHist = prev.slice(0, historyIndex + 1);
       const finalHist = [...newHist, stateStr];
       if (finalHist.length > 30) finalHist.shift();
       setHistoryIndex(finalHist.length - 1);
       return finalHist;
    });
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      restoreState(history[newIdx]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      restoreState(history[newIdx]);
    }
  }, [historyIndex, history]);

  const restoreState = async (stateStr: string) => {
    const parsed: AppState = JSON.parse(stateStr);
    for (let el of parsed.elements) {
      if (el.type === 'image' && (el as ImageElement).src) {
        const img = new Image();
        img.src = (el as ImageElement).src;
        await new Promise(r => img.onload = r);
        (el as ImageElement).imgElement = img;
      }
    }
    setDb(parsed);
    setSelectedId(null);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) { e.preventDefault(); handleRedo(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRef.current && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        setDb(prev => {
           const newDb = { ...prev, elements: prev.elements.filter(e => e.id !== selectedRef.current) };
           saveState(newDb);
           return newDb;
        });
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Render Loop
  useEffect(() => {
    if (!isReady || !canvasRef.current) return;
    
    let animationId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = stateRef.current;
      const selId = selectedRef.current;
      const zoom = zoomRef.current;

      canvas.width = state.width;
      canvas.height = state.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw artboard background (always white or chosen color)
      ctx.fillStyle = state.artboardBg || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Elements
      state.elements.filter(e => e.visible).forEach(el => {
        ctx.save();
        ctx.globalAlpha = el.opacity / 100;
        if (el.blendMode !== 'normal') ctx.globalCompositeOperation = el.blendMode as GlobalCompositeOperation;
        
        ctx.translate(el.x + el.width/2, el.y + el.height/2);
        ctx.rotate(el.rotation * Math.PI / 180);
        
        if (el.shadow.active) {
          ctx.shadowColor = el.shadow.color;
          ctx.shadowBlur = el.shadow.blur;
          ctx.shadowOffsetX = el.shadow.offsetX;
          ctx.shadowOffsetY = el.shadow.offsetY;
        }

        if (el.type === 'image' && (el as ImageElement).imgElement) {
          ctx.drawImage((el as ImageElement).imgElement!, -el.width/2, -el.height/2, el.width, el.height);
        } else if (el.type === 'shape') {
          const s = el as ShapeElement;
          ctx.fillStyle = s.fill;
          if (s.shapeType === 'rectangle') {
            if (s.borderRadius > 0) {
               ctx.beginPath();
               ctx.roundRect(-el.width/2, -el.height/2, el.width, el.height, s.borderRadius);
               ctx.fill();
               if(s.strokeWidth > 0) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.strokeWidth; ctx.stroke(); }
            } else {
               ctx.fillRect(-el.width/2, -el.height/2, el.width, el.height);
               if(s.strokeWidth > 0) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.strokeWidth; ctx.strokeRect(-el.width/2, -el.height/2, el.width, el.height); }
            }
          } else if (s.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(el.width, el.height)/2, 0, Math.PI*2);
            ctx.fill();
            if(s.strokeWidth > 0) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.strokeWidth; ctx.stroke(); }
          }
        } else if (el.type === 'text') {
           const t = el as TextElement;
           ctx.font = `${t.bold?'bold ':''}${t.italic?'italic ':''}${t.fontSize}px "${t.fontFamily}"`;
           ctx.fillStyle = t.color;
           ctx.textAlign = t.align as CanvasTextAlign;
           ctx.textBaseline = 'middle';
           
           if(t.bgActive) {
             ctx.save();
             ctx.shadowColor='transparent';
             ctx.fillStyle = t.bgColor;
             ctx.fillRect(-el.width/2, -el.height/2, el.width, el.height);
             ctx.restore();
           }
           
           let drawX = 0;
           if(t.align === 'left') drawX = -el.width/2 + (t.bgActive ? t.padding : 0);
           if(t.align === 'right') drawX = el.width/2 - (t.bgActive ? t.padding : 0);
           
           let renderText = t.text;
           if(t.textTransform === 'uppercase') renderText = renderText.toUpperCase();
           if(t.textTransform === 'lowercase') renderText = renderText.toLowerCase();

           // Very basic letter spacing approach (canvas doesn't support it natively well without modern APIs, this is a fallback)
           if (t.letterSpacing !== 0 && ctx.letterSpacing !== undefined) {
               (ctx as any).letterSpacing = `${t.letterSpacing}px`;
           }
           
           // multiline split
           const lines = renderText.split('\n');
           const lh = t.fontSize * t.lineHeight;
           const startY = -(lines.length - 1) * lh / 2;
           lines.forEach((line, i) => {
               ctx.fillText(line, drawX, startY + (i * lh));
           });
        }
        ctx.restore();
      });

      // Draw selection handles
      if (selId) {
        const sel = state.elements.find(e => e.id === selId);
        if (sel && !sel.locked && sel.visible) {
           ctx.save();
           ctx.translate(sel.x + sel.width/2, sel.y + sel.height/2);
           ctx.rotate(sel.rotation * Math.PI / 180);
           ctx.strokeStyle = '#FFB800';
           ctx.lineWidth = 2 / zoom;
           ctx.strokeRect(-sel.width/2, -sel.height/2, sel.width, sel.height);
           
           ctx.fillStyle = '#ffffff';
           const hw = 6 / zoom;
           const positions = [
             [-sel.width/2, -sel.height/2], [0, -sel.height/2], [sel.width/2, -sel.height/2],
             [-sel.width/2, 0],                            [sel.width/2, 0],
             [-sel.width/2, sel.height/2],  [0, sel.height/2],  [sel.width/2, sel.height/2]
           ];
           
           positions.forEach(p => {
             ctx.fillRect(p[0]-hw, p[1]-hw, hw*2, hw*2);
             ctx.strokeRect(p[0]-hw, p[1]-hw, hw*2, hw*2);
           });
           
           // Rotate handle
           ctx.beginPath();
           ctx.moveTo(0, -sel.height/2);
           ctx.lineTo(0, -sel.height/2 - 30/zoom);
           ctx.stroke();
           ctx.beginPath();
           ctx.arc(0, -sel.height/2 - 30/zoom, hw, 0, Math.PI*2);
           ctx.fill();
           ctx.stroke();
           ctx.restore();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isReady]);

  // Base Element Creator
  const createBaseElement = (name: string): Omit<ElementBase, 'type' | 'id'> & { id: string } => ({
    id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    x: stateRef.current.width/2 - 100,
    y: stateRef.current.height/2 - 100,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 100,
    blendMode: 'normal',
    locked: false,
    visible: true,
    shadow: { active: false, color: '#000000', blur: 10, offsetX: 5, offsetY: 5 }
  });

  // Image load → always becomes an element placed on artboard
  const handleBgLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.height / img.width;
        const targetW = stateRef.current.width;
        const targetH = ratio <= 1 ? targetW : targetW * ratio;
        const elW = Math.min(targetW, stateRef.current.width);
        const elH = elW * ratio;
        setDb(prev => {
          const el: ImageElement = {
            ...createBaseElement('Imagem'),
            type: 'image',
            src: evt.target?.result as string,
            imgElement: img,
            x: 0, y: 0,
            width: prev.width,
            height: Math.round(prev.width * ratio)
          };
          const newDb = { ...prev, elements: [...prev.elements, el] };
          saveState(newDb);
          setSelectedId(el.id);
          setHasStarted(true);
          return newDb;
        });

      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.height / img.width;
        setDb(prev => {
          const el: ImageElement = {
            ...createBaseElement('Símbolo'),
            type: 'image',
            src: evt.target?.result as string,
            imgElement: img,
            height: 200 * ratio
          };
          const newDb = { ...prev, elements: [...prev.elements, el] };
          saveState(newDb);
          setSelectedId(el.id);
          return newDb;
        });
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    setDb(prev => {
      const el: TextElement = {
        ...createBaseElement('Texto'),
        type: 'text',
        width: 400,
        height: 100,
        x: prev.width/2 - 200,
        y: prev.height/2 - 50,
        text: 'Duplo clique para editar',
        fontFamily: 'Roboto',
        fontSize: 60,
        color: '#ffffff',
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        textTransform: 'none',
        letterSpacing: 0,
        lineHeight: 1.2,
        align: 'center',
        bgActive: false,
        bgColor: '#00000080',
        padding: 20
      };
      const newDb = { ...prev, elements: [...prev.elements, el] };
      saveState(newDb);
      setSelectedId(el.id);
      return newDb;
    });
  };

  const handleAddShape = (type: 'rectangle' | 'circle' | 'triangle') => {
    setDb(prev => {
      const el: ShapeElement = {
        ...createBaseElement(type === 'rectangle' ? 'Retângulo' : type === 'circle' ? 'Círculo' : 'Triângulo'),
        type: 'shape',
        shapeType: type,
        fill: '#FFB800',
        stroke: 'transparent',
        strokeWidth: 0,
        borderRadius: 0
      };
      const newDb = { ...prev, elements: [...prev.elements, el] };
      saveState(newDb);
      setSelectedId(el.id);
      return newDb;
    });
  };

  const handleNewDesign = (force = false) => {
    if (!force && db.elements.length > 0) {
      setShowNewArtModal(true);
      return;
    }
    // Use the ref to get latest selectedFormat and apply its dimensions immediately
    const fmt = selectedFormat;
    const newState: AppState = {
      width: fmt.w,
      height: fmt.h,
      artboardBg: '#ffffff',
      elements: []
    };
    stateRef.current = newState;
    setDb(newState);
    setSelectedId(null);
    setProjectName(fmt.label !== 'Livre / Personalizado' ? fmt.label : 'Arte Em Branco');
    saveState(newState);
    setShowFormatPicker(false);
    setHasStarted(true);
    setShowNewArtModal(false);
  };

  const handleSetFormat = (fmt: typeof FORMAT_PRESETS[0]) => {
    setSelectedFormat(fmt);
    setShowFormatPicker(false);
    setDb(prev => {
      const newDb = { ...prev, width: fmt.w, height: fmt.h };
      saveState(newDb);
      return newDb;
    });
  };

  const handleFlipH = () => {
    if (!selectedId) return;
    const el = db.elements.find(e => e.id === selectedId);
    if (el) updateElement(selectedId, { x: db.width - el.x - el.width });
  };

  const handleFlipV = () => {
    if (!selectedId) return;
    const el = db.elements.find(e => e.id === selectedId);
    if (el) updateElement(selectedId, { y: db.height - el.y - el.height });
  };

  const handleDuplicateSelected = () => {
    if (!selectedId) return;
    const el = db.elements.find(e => e.id === selectedId);
    if (!el) return;
    setDb(prev => {
       const newEl = { ...el, id: `el_${Date.now()}`, name: el.name + ' (cópia)', x: el.x + 20, y: el.y + 20 };
       const newDb = { ...prev, elements: [...prev.elements, newEl] };
       saveState(newDb);
       setSelectedId(newEl.id);
       return newDb;
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setDb(prev => {
       const newDb = { ...prev, elements: prev.elements.filter(e => e.id !== selectedId) };
       saveState(newDb);
       return newDb;
    });
    setSelectedId(null);
  };

  const handleAddCircle = () => handleAddShape('circle');
  const handleAddStar = () => {
    setDb(prev => {
      const base = createBaseElement('Estrela');
      const el: ShapeElement = { ...base, type: 'shape', shapeType: 'rectangle', fill: '#FFB800', stroke: 'transparent', strokeWidth: 0, borderRadius: 50 };
      const newDb = { ...prev, elements: [...prev.elements, el] };
      saveState(newDb); setSelectedId(el.id);
      return newDb;
    });
  };
  const handleAddLine = () => {
    setDb(prev => {
      const base = createBaseElement('Linha');
      const el: ShapeElement = { ...base, type: 'shape', shapeType: 'rectangle', fill: '#FFB800', stroke: 'transparent', strokeWidth: 0, borderRadius: 0, width: 400, height: 4, y: prev.height/2 - 2, x: prev.width/2 - 200 };
      const newDb = { ...prev, elements: [...prev.elements, el] };
      saveState(newDb); setSelectedId(el.id);
      return newDb;
    });
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = zoomRef.current;
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top) / zoom;
    const elements = stateRef.current.elements;

    // Check Handles First
    if (selectedRef.current) {
       const sel = elements.find(e => e.id === selectedRef.current);
       if (sel && !sel.locked && sel.visible) {
          const cx = sel.x + sel.width/2;
          const cy = sel.y + sel.height/2;
          const rad = -sel.rotation * Math.PI / 180;
          const lmx = Math.cos(rad) * (mx - cx) - Math.sin(rad) * (my - cy);
          const lmy = Math.sin(rad) * (mx - cx) + Math.cos(rad) * (my - cy);
          const hw = 10 / zoom; // Hit box size
          const w2 = sel.width/2;
          const h2 = sel.height/2;
          
          const handles = [
             { id: 'tl', x: -w2, y: -h2 }, { id: 't', x: 0, y: -h2 }, { id: 'tr', x: w2, y: -h2 },
             { id: 'l', x: -w2, y: 0 }, { id: 'r', x: w2, y: 0 },
             { id: 'bl', x: -w2, y: h2 }, { id: 'b', x: 0, y: h2 }, { id: 'br', x: w2, y: h2 }
          ];
          
          const hitH = handles.find(h => Math.abs(lmx - h.x) <= hw && Math.abs(lmy - h.y) <= hw);
          if (hitH) {
             interaction.current = { isDragging: false, isResizing: true, isRotating: false, dragHandle: hitH.id, startX: mx, startY: my, origElem: { ...sel } };
             return;
          }
       }
    }

    let hit: CanvasElement | null = null;
    
    // Reverse array to hit top elements first
    for (let i = elements.length - 1; i >= 0; i--) {
       const el = elements[i];
       if (el.visible && !el.locked) {
          // Simple hit test without strict rotation
          if (mx >= el.x && mx <= el.x + el.width && my >= el.y && my <= el.y + el.height) {
             hit = el; break;
          }
       }
    }

    if (hit) {
       setSelectedId(hit.id);
       setActivePanel('properties');
       interaction.current = {
         isDragging: true,
         isResizing: false,
         isRotating: false,
         dragHandle: null,
         startX: mx,
         startY: my,
         origElem: { ...hit }
       };
    } else {
       setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = zoomRef.current;
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top) / zoom;
    const dx = mx - interaction.current.startX;
    const dy = my - interaction.current.startY;

    if (interaction.current.isResizing && interaction.current.dragHandle) {
       const handle = interaction.current.dragHandle;
       const rad = interaction.current.origElem.rotation * Math.PI / 180;
       const ldx = Math.cos(rad) * dx + Math.sin(rad) * dy;
       const ldy = -Math.sin(rad) * dx + Math.cos(rad) * dy;
       
       let { width, height, x, y } = interaction.current.origElem;
       
       // Handle Width
       if (handle.includes('r')) { width += ldx; }
       if (handle.includes('l')) { width -= ldx; x += Math.cos(rad)*ldx; y += Math.sin(rad)*ldx; }
       
       // Handle Height
       if (handle.includes('b')) { height += ldy; }
       if (handle.includes('t')) { height -= ldy; x -= Math.sin(rad)*ldy; y += Math.cos(rad)*ldy; }
       
       if (width < 10) width = 10;
       if (height < 10) height = 10;
       
       updateElement(selectedRef.current, { width, height, x, y });
       return;
    }

    if (interaction.current.isDragging) {
       updateElement(selectedRef.current, {
          x: interaction.current.origElem.x + dx,
          y: interaction.current.origElem.y + dy
       });
    }
  };

  const handleMouseUp = () => {
    if (interaction.current.isDragging || interaction.current.isResizing) {
       saveState(stateRef.current);
    }
    interaction.current.isDragging = false;
    interaction.current.isResizing = false;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedRef.current) return;
    const el = stateRef.current.elements.find(el => el.id === selectedRef.current);
    if (el && el.type === 'text') {
      const t = el as TextElement;
      setTextEditing({ id: el.id, text: t.text });
    }
  };

  const commitTextEdit = () => {
    if (!textEditing) return;
    updateElement(textEditing.id, { text: textEditing.text });
    setTextEditing(null);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
     setDb(prev => {
        const newEls = prev.elements.map(el => el.id === id ? { ...el, ...updates } as CanvasElement : el);
        const newDb = { ...prev, elements: newEls };
        saveState(newDb);
        return newDb;
     });
  };

  const handleExport = () => {
    setSelectedId(null); // remove selection box
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `Conversio_Pro_${Date.now()}.png`;
      link.href = canvasRef.current?.toDataURL('image/png') || '';
      link.click();
    }, 100);
  };

  const selectedElement = db.elements.find(e => e.id === selectedId);

  return (
    <div className="w-full h-screen flex flex-col font-sans text-text-primary overflow-hidden selection:bg-accent/30 selection:text-black bg-bg-base">
      {/* Top Bar */}
      <header className="h-[58px] bg-surface flex items-center justify-between px-4 shrink-0 z-20 border-b border-border-subtle gap-4">
        {/* LEFT — Logo + return */}
        <div className="flex items-center gap-3 shrink-0">
           {onExit && <button onClick={onExit} title="Voltar ao Dashboard" className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
             <X size={16} />
           </button>}
           <img src="/logo.png" alt="Conversio.ai" className="h-7 object-contain" />
           <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest px-2 py-0.5 border border-border-subtle rounded-full bg-surface-hover">Editor Pro</span>
        </div>

        {/* CENTER — Project Name + Undo/Redo + New */}
        <div className="flex items-center gap-2 flex-1 justify-center">
           <button onClick={() => handleNewDesign()} title="Nova Arte" className="p-2 text-white/40 hover:text-accent hover:bg-accent/10 rounded-xl transition-colors">
             <FilePlus size={16} />
           </button>
           <div className="h-4 w-px bg-border-subtle mx-1"></div>
           <input
             type="text"
             value={projectName}
             onChange={e => setProjectName(e.target.value)}
             className="bg-transparent border-none text-text-primary font-bold outline-none text-sm w-40 text-center focus:bg-surface-hover px-2 py-1 rounded-lg transition-colors"
           />
           <div className="h-4 w-px bg-border-subtle mx-1"></div>
           <button onClick={handleUndo} disabled={historyIndex <= 0} title="Desfazer" className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-20">
             <Undo size={15} />
           </button>
           <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Refazer" className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-20">
             <Redo size={15} />
           </button>
        </div>

        {/* RIGHT — Zoom + Export */}
        <div className="flex items-center gap-2 shrink-0">
           <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-xl border border-border-subtle">
             <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.25))} className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors"><ZoomOut size={14} /></button>
             <span className="text-xs font-bold w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
             <button onClick={() => setZoomLevel(z => Math.min(4, z + 0.25))} className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors"><ZoomIn size={14} /></button>
           </div>
           <button onClick={() => setZoomLevel(Math.min((containerRef.current?.clientWidth||1000)/db.width,(containerRef.current?.clientHeight||800)/db.height)*0.85)} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors" title="Ajustar ao Ecrã"><Maximize size={14}/></button>
           <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2 bg-accent hover:brightness-110 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-glow">
             <Download size={14} /> Exportar
           </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Toolbar — Icon Only Pro */}
        <aside className="w-[52px] bg-surface border-r border-border-subtle flex flex-col items-center py-4 gap-0.5 z-20 overflow-y-auto custom-scrollbar shrink-0">

           {/* Section: Media */}
           <label title="Carregar Fundo (Imagem)" className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 cursor-pointer transition-all">
              <ImageIcon size={16} />
              <input type="file" accept="image/*" className="hidden" onChange={handleBgLoad} />
           </label>

           <label title="Adicionar Símbolo / Logo (PNG/SVG)" className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 cursor-pointer transition-all">
              <MousePointer size={16} />
              <input type="file" accept="image/png,image/svg+xml" className="hidden" onChange={handleLogoLoad} />
           </label>

           <div className="w-5 h-px bg-border-subtle my-1.5"></div>

           {/* Section: Create */}
           <button title="Adicionar Texto" onClick={handleAddText} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all">
              <Type size={16} />
           </button>

           <button title="Retângulo" onClick={() => handleAddShape('rectangle')} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all">
              <Square size={16} />
           </button>

           <button title="Círculo" onClick={handleAddCircle} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all">
              <Circle size={16} />
           </button>

           <button title="Elemento Arredondado (Pill/Star)" onClick={handleAddStar} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all">
              <Star size={16} />
           </button>

           <button title="Linha" onClick={handleAddLine} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all">
              <Minus size={16} />
           </button>

           <div className="w-5 h-px bg-border-subtle my-1.5"></div>

           {/* Section: Edit Actions */}
           <button title="Duplicar elemento selecionado" onClick={handleDuplicateSelected} disabled={!selectedId} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all disabled:opacity-20">
              <Copy size={16} />
           </button>

           <button title="Mover horizontalmente" onClick={handleFlipH} disabled={!selectedId} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all disabled:opacity-20">
              <FlipHorizontal2 size={16} />
           </button>

           <button title="Mover verticalmente" onClick={handleFlipV} disabled={!selectedId} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-accent hover:bg-accent/10 transition-all disabled:opacity-20">
              <FlipVertical2 size={16} />
           </button>

           <button title="Eliminar elemento" onClick={handleDeleteSelected} disabled={!selectedId} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/35 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-20">
              <Trash2 size={16} />
           </button>

           <div className="w-5 h-px bg-border-subtle my-1.5"></div>

           {/* Section: Panels */}
           <button title="Ajustes de Imagem" onClick={() => setActivePanel('adjustments')} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${activePanel === 'adjustments' ? 'text-accent bg-accent/15' : 'text-white/35 hover:text-accent hover:bg-accent/10'}`}>
              <Sliders size={16} />
           </button>

           <button title="Camadas" onClick={() => setActivePanel('layers')} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${activePanel === 'layers' ? 'text-accent bg-accent/15' : 'text-white/35 hover:text-accent hover:bg-accent/10'}`}>
              <Layers size={16} />
           </button>

        </aside>

        {/* Central Canvas Area — Dashboard-style grid */}
        <div 
          className="flex-1 relative overflow-auto custom-scrollbar flex items-center justify-center"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{ 
            backgroundColor: 'var(--color-bg-base, #0d0d0d)',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        >
           {/* Empty State — shown when artboard is fresh/empty */}
           {!hasStarted && (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-center px-12 z-10 pointer-events-none">

               <div className="pointer-events-auto">
                 <div className="w-20 h-20 rounded-3xl bg-surface border border-border-subtle flex items-center justify-center mx-auto mb-5 shadow-xl">
                   <ImageIcon size={34} className="text-accent" />
                 </div>
                 <h2 className="text-xl font-black text-text-primary mb-2">Editor Pro</h2>
                 <p className="text-xs text-text-tertiary leading-relaxed max-w-xs">Carrega uma imagem ou escolhe um formato para começar.</p>
                 <div className="mt-6 flex flex-col items-center gap-3">
                   <div className="relative">
                     <button onClick={() => setShowFormatPicker(v => !v)} className="w-64 px-5 py-3 bg-surface hover:bg-surface-hover border border-border-subtle text-text-secondary hover:text-accent rounded-xl text-xs font-bold transition-all flex items-center justify-between">
                       <span>{selectedFormat.icon} {selectedFormat.label}</span>
                       <span className="text-text-tertiary text-[10px]">{selectedFormat.w}×{selectedFormat.h} ▾</span>
                     </button>
                     {showFormatPicker && (
                       <div className="absolute top-full mt-1 left-0 w-72 bg-surface border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden py-2">
                         {FORMAT_PRESETS.map(fmt => (
                           <button key={fmt.label} onClick={() => { setSelectedFormat(fmt); setShowFormatPicker(false); db.width !== fmt.w && handleSetFormat(fmt); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs hover:bg-surface-hover transition-colors ${selectedFormat.label === fmt.label ? 'text-accent font-bold' : 'text-text-secondary'}`}>
                             <span>{fmt.icon}</span><span className="flex-1">{fmt.label}</span>
                             <span className="text-text-tertiary">{fmt.w}×{fmt.h}</span>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                    <button onClick={() => handleNewDesign()} className="w-64 flex items-center justify-center gap-2 px-7 py-3.5 bg-accent hover:brightness-110 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-glow text-xs">
                      <FilePlus size={15} /> Criar Projeto
                    </button>
                   <label className="cursor-pointer w-64 flex items-center justify-center gap-2 px-7 py-3 bg-surface hover:bg-surface-hover border border-border-subtle text-text-secondary hover:text-accent rounded-xl text-xs font-bold transition-all">
                     <ImageIcon size={14} /> Carregar Imagem
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleBgLoad(e); handleNewDesign(); }} />
                   </label>
                 </div>
               </div>
             </div>
           )}

           {/* Always-visible canvas — never conditionally mounted */}
           <div className="p-12" style={{ display: !hasStarted ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>

             <div
               className="relative shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-white/10 rounded-sm"
               style={{ width: db.width * zoomLevel, height: db.height * zoomLevel }}
             >
               <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
               {/* Inline text editing overlay */}
               {textEditing && (() => {
                 const el = db.elements.find(e => e.id === textEditing.id) as TextElement | undefined;
                 if (!el) return null;
                 return (
                   <textarea
                     autoFocus
                     value={textEditing.text}
                     onChange={e => setTextEditing(t => t ? { ...t, text: e.target.value } : t)}
                     onBlur={commitTextEdit}
                     onKeyDown={e => { if (e.key === 'Escape') { setTextEditing(null); } }}
                     style={{
                       position: 'absolute',
                       left: el.x * zoomLevel,
                       top: el.y * zoomLevel,
                       width: el.width * zoomLevel,
                       minHeight: el.height * zoomLevel,
                       fontSize: el.fontSize * zoomLevel,
                       fontFamily: el.fontFamily,
                       fontWeight: el.bold ? 'bold' : 'normal',
                       fontStyle: el.italic ? 'italic' : 'normal',
                       color: el.color,
                       textAlign: el.align,
                       lineHeight: el.lineHeight,
                       background: 'rgba(255,255,255,0.08)',
                       border: '2px solid #FFB800',
                       borderRadius: 4,
                       padding: '4px 8px',
                       resize: 'none',
                       outline: 'none',
                       boxSizing: 'border-box',
                     }}
                   />
                 );
               })()}
             </div>
           </div>


        </div>

        {/* Right Universal Panel */}
        <aside className="w-[320px] bg-surface shadow-[-4px_0_24px_rgba(0,0,0,0.5)] border-l border-border-subtle flex flex-col z-20 shrink-0">
           {/* Tab Headers */}
           <div className="flex border-b border-border-subtle">
              <button onClick={() => setActivePanel('properties')} className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest ${activePanel === 'properties' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-white/40 hover:text-white/80'}`}>Propriedades</button>
              <button onClick={() => setActivePanel('adjustments')} className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest ${activePanel === 'adjustments' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-white/40 hover:text-white/80'}`}>Ajustes</button>
              <button onClick={() => setActivePanel('layers')} className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest ${activePanel === 'layers' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-white/40 hover:text-white/80'}`}>Camadas</button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {activePanel === 'adjustments' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-white/60 block mb-2">Cor de Fundo do Artboard</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={db.artboardBg} onChange={e => setDb(p => ({ ...p, artboardBg: e.target.value }))} onBlur={() => saveState(stateRef.current)} className="w-10 h-10 rounded-xl border border-border-subtle cursor-pointer bg-transparent" />
                      <span className="text-xs text-text-tertiary font-mono">{db.artboardBg}</span>
                      <button onClick={() => { setDb(p => ({ ...p, artboardBg: '#ffffff' })); saveState(stateRef.current); }} className="ml-auto text-[10px] px-3 py-1.5 bg-surface-hover rounded-lg text-text-tertiary hover:text-white transition-colors">Reset</button>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {['#ffffff', '#000000', '#1a1a2e', '#FF6B6B', '#FFB800', '#0EA5E9', '#8B5CF6', '#10B981'].map(c => (
                        <button key={c} onClick={() => { setDb(p => ({...p, artboardBg: c})); saveState(stateRef.current); }} className="w-7 h-7 rounded-lg border-2 transition-all" style={{ backgroundColor: c, borderColor: db.artboardBg === c ? '#FFB800' : 'transparent' }} />
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border-subtle">
                    <p className="text-xs text-text-tertiary">Os ajustes de filtro são aplicados por elemento. Selecione um elemento para ajustar.</p>
                  </div>
                </div>
             )}
             {activePanel === 'layers' && (
                <div className="space-y-3">
                   {[...db.elements].reverse().map(el => (
                      <div 
                        key={el.id} 
                        onClick={() => { setSelectedId(el.id); setActivePanel('properties'); }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedId === el.id ? 'bg-accent/10 border-accent/30' : 'bg-surface border-border-subtle hover:bg-surface-hover'}`}
                      >
                         <div className="flex items-center gap-3 overflow-hidden">
                            {el.type === 'text' ? <Type size={16} className="text-white/40" /> : el.type === 'image' ? <ImageIcon size={16} className="text-white/40" /> : <Square size={16} className="text-white/40" />}
                            <span className="text-sm font-medium truncate shrink text-white/80">{el.name || el.type}</span>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }} className={`p-1.5 rounded-md hover:bg-white/10 ${!el.visible ? 'text-red-400' : 'text-white/40'}`}>
                               {el.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }} className={`p-1.5 rounded-md hover:bg-white/10 ${el.locked ? 'text-yellow-400' : 'text-white/40'}`}>
                               {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                         </div>
                      </div>
                   ))}
                   {db.elements.length === 0 && (
                      <div className="text-center p-6 text-white/30 text-xs uppercase font-bold">Nenhuma camada</div>
                   )}
                </div>
             )}

             {activePanel === 'properties' && !selectedElement && (
               <div className="flex flex-col items-center justify-center p-6 mt-10 text-center text-white/30 space-y-4">
                 <MousePointer size={32} />
                 <p className="text-xs uppercase font-bold tracking-widest">Nenhum elemento selecionado</p>
               </div>
             )}

             {activePanel === 'properties' && selectedElement && (
                <div className="space-y-6">
                 
                 {/* Position & Size */}
                 <div className="space-y-4 pb-6 border-b border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-black uppercase tracking-widest">Dimensões & Posição</p>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] text-white/60 uppercase">X (px)</label>
                          <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-blue-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-white/60 uppercase">Y (px)</label>
                          <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-blue-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-white/60 uppercase">Largura</label>
                          <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-blue-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-white/60 uppercase">Altura</label>
                          <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-blue-500 outline-none" />
                       </div>
                    </div>
                 </div>

                 {/* Text Properties */}
                 {selectedElement.type === 'text' && (
                    <div className="space-y-4 pb-6 border-b border-white/10">
                       <p className="text-[10px] text-white/40 uppercase font-black uppercase tracking-widest">Tipografia</p>
                       <div className="space-y-3">
                          <select 
                             value={(selectedElement as TextElement).fontFamily} 
                             onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                             className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm font-medium text-white focus:border-blue-500 outline-none"
                          >
                             {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] text-white/60 uppercase">Tamanho</label>
                                <input type="number" value={(selectedElement as TextElement).fontSize} onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-blue-500 outline-none" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] text-white/60 uppercase">Cor</label>
                                <div className="h-9 w-full rounded-lg overflow-hidden border border-white/10">
                                   <input type="color" value={(selectedElement as TextElement).color} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-16 h-16 -m-2 cursor-pointer" />
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex gap-2">
                             <button onClick={() => updateElement(selectedElement.id, { align: 'left' })} className={`flex-1 py-2 rounded-lg border text-xs font-bold ${((selectedElement as TextElement).align === 'left') ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/5'}`}>Esq</button>
                             <button onClick={() => updateElement(selectedElement.id, { align: 'center' })} className={`flex-1 py-2 rounded-lg border text-xs font-bold ${((selectedElement as TextElement).align === 'center') ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/5'}`}>Centro</button>
                             <button onClick={() => updateElement(selectedElement.id, { align: 'right' })} className={`flex-1 py-2 rounded-lg border text-xs font-bold ${((selectedElement as TextElement).align === 'right') ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/5'}`}>Dir</button>
                          </div>
                          
                          <div className="pt-2">
                             <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                                <input type="checkbox" checked={(selectedElement as TextElement).bgActive} onChange={(e) => updateElement(selectedElement.id, { bgActive: e.target.checked })} className="rounded bg-black/40 border-white/10 text-blue-500 focus:ring-blue-500" />
                                Fundo de Texto Sólido
                             </label>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Shape Properties */}
                 {selectedElement.type === 'shape' && (
                    <div className="space-y-4 pb-6 border-b border-white/10">
                       <p className="text-[10px] text-white/40 uppercase font-black uppercase tracking-widest">Aparência da Forma</p>
                       <div className="space-y-1">
                          <label className="text-[10px] text-white/60 uppercase">Preenchimento</label>
                          <div className="h-10 w-full rounded-lg overflow-hidden border border-white/10">
                             <input type="color" value={(selectedElement as ShapeElement).fill} onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })} className="w-full h-16 -m-2 cursor-pointer" />
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Opacity */}
                 <div className="space-y-2 pb-6 border-b border-white/10">
                    <div className="flex justify-between text-[10px] text-white/60 uppercase font-black tracking-widest">
                       <label>Opacidade</label>
                       <span>{selectedElement.opacity}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={selectedElement.opacity} onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })} className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#FFB800] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
                 </div>

                 {/* Actions */}
                 <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const copy = { ...selectedElement, id: `el_${Date.now()}`, x: selectedElement.x + 20, y: selectedElement.y + 20 };
                        setDb(p => { const newDb = {...p, elements: [...p.elements, copy]}; saveState(newDb); return newDb; });
                      }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-xs"
                    >
                      <Copy size={14} /> Duplicar
                    </button>
                    <button 
                      onClick={() => {
                        setDb(p => { const newDb = {...p, elements: p.elements.filter(e => e.id !== selectedElement.id)}; saveState(newDb); return newDb; });
                        setSelectedId(null);
                      }}
                      className="w-12 flex-shrink-0 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>

              </div>
             )}
           </div>
        </aside>
      </main>

      <ConfirmationModal
        isOpen={showNewArtModal}
        title="Criar Nova Arte"
        message="Tem certeza que deseja iniciar uma nova arte? Todas as alterações não guardadas no design atual serão perdidas permanentemente."
        confirmLabel="Criar Nova"
        type="warning"
        onConfirm={() => handleNewDesign(true)}
        onCancel={() => setShowNewArtModal(false)}
      />
    </div>
  );
}
