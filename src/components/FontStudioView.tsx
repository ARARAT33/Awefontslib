import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brush,
  Feather,
  Minus,
  Square,
  Circle,
  Eraser,
  Undo2,
  Trash2,
  ImagePlus,
  Wand2,
  Download,
  Copy,
  Check,
  Package,
  FlipHorizontal2,
  Eye,
} from 'lucide-react';
import JSZip from 'jszip';
import { CompiledStudioFont, StudioFontMeta, StudioGlyphData, StudioStroke } from '../types/font';
import { compileParametricStudioFont } from '../utils/otfCompiler';
import { generateStudioEmbedSnippet, generateStudioScriptEmbed } from '../utils/fontEmbedder';
import { registerStudioFontFace, triggerBinaryDownload } from '../utils/fontLoader';
import { STUDIO_WORLD_CHARSETS } from '../data/worldLanguages';

interface FontStudioViewProps {
  externalChar?: string | null;
  onConsumeExternalChar?: () => void;
}

const CANVAS_SIZE = 400;

const FEATURED_CHARSET_IDS = [
  'armenian-upper',
  'armenian-lower',
  'latin-upper',
  'latin-lower',
  'cyrillic-upper',
  'georgian-mkhedruli',
  'arabic',
  'devanagari',
  'japanese-kana',
];

function createStarterGlyphs(): Record<string, StudioGlyphData> {
  return {
    A: {
      char: 'A',
      unicode: 'A'.codePointAt(0)!,
      advanceWidth: 680,
      strokes: [
        {
          id: 'st-a1',
          tool: 'pen',
          brushWidth: 26,
          points: [
            { x: 95, y: 320 },
            { x: 200, y: 80 },
            { x: 305, y: 320 },
          ],
        },
        {
          id: 'st-a2',
          tool: 'line',
          brushWidth: 22,
          points: [
            { x: 135, y: 230 },
            { x: 265, y: 230 },
          ],
        },
      ],
    },
    Ա: {
      char: 'Ա',
      unicode: 'Ա'.codePointAt(0)!,
      advanceWidth: 740,
      strokes: [
        {
          id: 'st-arm1',
          tool: 'calligraphy',
          brushWidth: 30,
          calligraphyAngle: -30,
          points: [
            { x: 105, y: 95 },
            { x: 105, y: 315 },
            { x: 195, y: 315 },
            { x: 195, y: 155 },
          ],
        },
        {
          id: 'st-arm2',
          tool: 'calligraphy',
          brushWidth: 30,
          calligraphyAngle: -30,
          points: [
            { x: 195, y: 155 },
            { x: 290, y: 155 },
            { x: 290, y: 315 },
          ],
        },
      ],
    },
    Բ: {
      char: 'Բ',
      unicode: 'Բ'.codePointAt(0)!,
      advanceWidth: 720,
      strokes: [
        {
          id: 'st-armb1',
          tool: 'calligraphy',
          brushWidth: 28,
          calligraphyAngle: -30,
          points: [
            { x: 115, y: 85 },
            { x: 115, y: 320 },
            { x: 265, y: 320 },
            { x: 265, y: 215 },
            { x: 175, y: 215 },
          ],
        },
        {
          id: 'st-armb2',
          tool: 'calligraphy',
          brushWidth: 26,
          calligraphyAngle: -30,
          points: [
            { x: 115, y: 85 },
            { x: 235, y: 85 },
          ],
        },
      ],
    },
    O: {
      char: 'O',
      unicode: 'O'.codePointAt(0)!,
      advanceWidth: 720,
      strokes: [
        {
          id: 'st-o1',
          tool: 'pen',
          brushWidth: 28,
          points: [
            { x: 200, y: 90 },
            { x: 285, y: 130 },
            { x: 300, y: 205 },
            { x: 285, y: 285 },
            { x: 200, y: 320 },
            { x: 115, y: 285 },
            { x: 100, y: 205 },
            { x: 115, y: 130 },
            { x: 200, y: 90 },
          ],
        },
      ],
    },
  };
}

export const FontStudioView: React.FC<FontStudioViewProps> = ({
  externalChar,
  onConsumeExternalChar,
}) => {
  const [glyphMap, setGlyphMap] = useState<Record<string, StudioGlyphData>>(() =>
    createStarterGlyphs()
  );
  const [activeSetId, setActiveSetId] = useState('armenian-upper');
  const [activeChar, setActiveChar] = useState('Ա');
  const [customCharInput, setCustomCharInput] = useState('');

  // Drawing Tool State
  const [tool, setTool] = useState<StudioStroke['tool']>('calligraphy');
  const [brushWidth, setBrushWidth] = useState(28);
  const [calligraphyAngle, setCalligraphyAngle] = useState(-30);
  const [mirrorX, setMirrorX] = useState(false);
  const [showGhostGuide, setShowGhostGuide] = useState(true);
  const [gridTemplate, setGridTemplate] = useState<'none' | 'armenian-grid' | 'calligraphy-lines'>('armenian-grid');

  // Image Underlay & Auto-Trace State
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgImageName, setBgImageName] = useState<string>('');
  const [bgOpacity, setBgOpacity] = useState(0.45);
  const [bgScale, setBgScale] = useState(1);
  const [traceThreshold, setTraceThreshold] = useState(140);
  const [invertTrace, setInvertTrace] = useState(false);

  // Font Metadata & Compile State
  const [meta, setMeta] = useState<StudioFontMeta>({
    familyName: 'YerevanStudio',
    styleName: 'Regular',
    designer: 'Pangloss Studio',
    license: 'OFL-1.1',
    description: 'Custom typeface authored locally in Pangloss Font Studio.',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
  });

  const [compiled, setCompiled] = useState<CompiledStudioFont | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isPackagingFamily, setIsPackagingFamily] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [liveTestText, setLiveTestText] = useState('ԱԲ ԱԲԳ A O');
  const [embedFormat, setEmbedFormat] = useState<'html' | 'script'>('html');
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Parametric OTF Synthesis Axes
  const [paramBoldness, setParamBoldness] = useState(0);
  const [paramSlantDeg, setParamSlantDeg] = useState(0);
  const [paramWidthScale, setParamWidthScale] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<{
    active: boolean;
    stroke: StudioStroke | null;
    mirrorStroke: StudioStroke | null;
  }>({ active: false, stroke: null, mirrorStroke: null });

  useEffect(() => {
    if (externalChar && externalChar.length > 0) {
      setActiveChar(externalChar);
      onConsumeExternalChar?.();
    }
  }, [externalChar, onConsumeExternalChar]);

  const currentGlyph: StudioGlyphData = useMemo(() => {
    const existing = glyphMap[activeChar];
    if (existing) return existing;
    return {
      char: activeChar,
      unicode: activeChar.codePointAt(0) || 65,
      strokes: [],
      advanceWidth: 680,
    };
  }, [glyphMap, activeChar]);

  const activeSet = useMemo(
    () => STUDIO_WORLD_CHARSETS.find((c) => c.id === activeSetId) || STUDIO_WORLD_CHARSETS[0],
    [activeSetId]
  );

  // Redraw canvas whenever strokes, bgImage, guides, or activeChar changes
  const renderCanvas = useCallback(
    (tempStroke?: StudioStroke | null, tempMirror?: StudioStroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 1. Uploaded Special Format Image Underlay
      if (bgImage) {
        ctx.save();
        ctx.globalAlpha = bgOpacity;
        const aspect = bgImage.width / Math.max(1, bgImage.height);
        let drawW = CANVAS_SIZE * bgScale;
        let drawH = drawW / aspect;
        if (drawH > CANVAS_SIZE * bgScale) {
          drawH = CANVAS_SIZE * bgScale;
          drawW = drawH * aspect;
        }
        const dx = (CANVAS_SIZE - drawW) / 2;
        const dy = (CANVAS_SIZE - drawH) / 2;
        ctx.drawImage(bgImage, dx, dy, drawW, drawH);
        ctx.restore();
      }

      // 2. Special Built-in Proportions / Calligraphy Grid Template
      ctx.save();
      if (gridTemplate === 'armenian-grid') {
        ctx.strokeStyle = 'rgba(180, 62, 34, 0.14)';
        ctx.lineWidth = 1;
        for (let g = 40; g < CANVAS_SIZE; g += 40) {
          ctx.beginPath();
          ctx.moveTo(g, 0);
          ctx.lineTo(g, CANVAS_SIZE);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, g);
          ctx.lineTo(CANVAS_SIZE, g);
          ctx.stroke();
        }
      } else if (gridTemplate === 'calligraphy-lines') {
        ctx.strokeStyle = 'rgba(20, 20, 19, 0.12)';
        ctx.lineWidth = 1;
        for (let y = 40; y < CANVAS_SIZE; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_SIZE, y);
          ctx.stroke();
        }
        // Slanted nib angle guides
        ctx.strokeStyle = 'rgba(180, 62, 34, 0.12)';
        for (let x = -200; x < CANVAS_SIZE + 200; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, CANVAS_SIZE);
          ctx.lineTo(x + 120, 0);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 3. Ghost Character Underlay Guide
      if (showGhostGuide) {
        ctx.save();
        ctx.fillStyle = 'rgba(20, 20, 19, 0.08)';
        ctx.font = '240px "Noto Sans Armenian", "Plus Jakarta Sans", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(activeChar, CANVAS_SIZE / 2, 315);
        ctx.restore();
      }

      // 4. Traced Bitmap Mask Preview (if auto-traced from image)
      if (currentGlyph.tracedMask && currentGlyph.gridSize) {
        const gs = currentGlyph.gridSize;
        const cell = CANVAS_SIZE / gs;
        ctx.save();
        ctx.fillStyle = 'rgba(20, 20, 19, 0.85)';
        for (let y = 0; y < gs; y++) {
          for (let x = 0; x < gs; x++) {
            if (currentGlyph.tracedMask[y * gs + x] > 0) {
              ctx.fillRect(x * cell, y * cell, Math.ceil(cell), Math.ceil(cell));
            }
          }
        }
        ctx.restore();
      }

      // 5. Render Vector Strokes
      const allStrokes = [...currentGlyph.strokes];
      if (tempStroke) allStrokes.push(tempStroke);
      if (tempMirror) allStrokes.push(tempMirror);

      for (const stroke of allStrokes) {
        ctx.save();
        const isEraser = stroke.tool === 'eraser';
        ctx.fillStyle = isEraser ? '#FFFFFF' : '#141413';
        ctx.strokeStyle = isEraser ? '#FFFFFF' : '#141413';

        if (stroke.tool === 'rect' && stroke.points.length >= 2) {
          const p0 = stroke.points[0];
          const p1 = stroke.points[stroke.points.length - 1];
          ctx.fillRect(
            Math.min(p0.x, p1.x),
            Math.min(p0.y, p1.y),
            Math.abs(p1.x - p0.x),
            Math.abs(p1.y - p0.y)
          );
        } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
          const p0 = stroke.points[0];
          const p1 = stroke.points[stroke.points.length - 1];
          ctx.beginPath();
          ctx.ellipse(
            (p0.x + p1.x) / 2,
            (p0.y + p1.y) / 2,
            Math.max(2, Math.abs(p1.x - p0.x) / 2),
            Math.max(2, Math.abs(p1.y - p0.y) / 2),
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (stroke.tool === 'calligraphy') {
          const pts = stroke.points;
          const rad = ((stroke.calligraphyAngle ?? -30) * Math.PI) / 180;
          const halfLen = stroke.brushWidth * 0.55;
          const dx = Math.cos(rad) * halfLen;
          const dy = Math.sin(rad) * halfLen;
          const nibThickness = Math.max(4, stroke.brushWidth * 0.25);

          const stampNib = (cx: number, cy: number) => {
            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineWidth = nibThickness;
            ctx.moveTo(cx - dx, cy - dy);
            ctx.lineTo(cx + dx, cy + dy);
            ctx.stroke();
          };

          if (pts.length === 1) {
            stampNib(pts[0].x, pts[0].y);
          } else {
            for (let i = 0; i < pts.length - 1; i++) {
              const a = pts[i];
              const b = pts[i + 1];
              const dist = Math.hypot(b.x - a.x, b.y - a.y);
              const steps = Math.max(1, Math.ceil(dist / 2));
              for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                stampNib(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
              }
            }
          }
        } else {
          const pts = stroke.points;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = stroke.brushWidth;
          if (pts.length === 1) {
            ctx.beginPath();
            ctx.arc(pts[0].x, pts[0].y, stroke.brushWidth / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (pts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 6. Typographic Metric Guide Lines (Ascender, Cap, X-Height, Baseline, Descender)
      const guides: { y: number; label: string; color: string }[] = [
        { y: 80, label: 'Asc / Cap', color: 'rgba(20, 20, 19, 0.25)' },
        { y: 165, label: 'x-height', color: 'rgba(20, 20, 19, 0.18)' },
        { y: 320, label: 'Baseline', color: 'rgba(180, 62, 34, 0.55)' },
        { y: 375, label: 'Descender', color: 'rgba(20, 20, 19, 0.2)' },
      ];
      ctx.save();
      ctx.font = '10px "JetBrains Mono", monospace';
      for (const g of guides) {
        ctx.strokeStyle = g.color;
        ctx.lineWidth = g.label === 'Baseline' ? 1.5 : 1;
        ctx.setLineDash(g.label === 'Baseline' ? [] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, g.y);
        ctx.lineTo(CANVAS_SIZE, g.y);
        ctx.stroke();
        ctx.fillStyle = g.label === 'Baseline' ? '#B43E22' : '#8A857D';
        ctx.fillText(g.label, 8, g.y - 4);
      }
      ctx.restore();
    },
    [activeChar, bgImage, bgOpacity, bgScale, currentGlyph, gridTemplate, showGhostGuide]
  );

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    const baseStroke: StudioStroke = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      points: [pt],
      brushWidth,
      tool,
      calligraphyAngle,
    };
    const mirrorStroke: StudioStroke | null = mirrorX
      ? {
          id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          points: [{ x: CANVAS_SIZE - pt.x, y: pt.y }],
          brushWidth,
          tool,
          calligraphyAngle: -calligraphyAngle,
        }
      : null;

    drawingRef.current = { active: true, stroke: baseStroke, mirrorStroke };
    renderCanvas(baseStroke, mirrorStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active || !drawingRef.current.stroke) return;
    const pt = getCanvasPoint(e);
    const s = drawingRef.current.stroke;
    const ms = drawingRef.current.mirrorStroke;

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      s.points = [s.points[0], pt];
      if (ms) ms.points = [ms.points[0], { x: CANVAS_SIZE - pt.x, y: pt.y }];
    } else {
      s.points.push(pt);
      if (ms) ms.points.push({ x: CANVAS_SIZE - pt.x, y: pt.y });
    }
    renderCanvas(s, ms);
  };

  const commitDrawing = () => {
    if (!drawingRef.current.active || !drawingRef.current.stroke) return;
    const newStrokes = [drawingRef.current.stroke];
    if (drawingRef.current.mirrorStroke) {
      newStrokes.push(drawingRef.current.mirrorStroke);
    }
    drawingRef.current = { active: false, stroke: null, mirrorStroke: null };

    setGlyphMap((prev) => {
      const existing = prev[activeChar] || {
        char: activeChar,
        unicode: activeChar.codePointAt(0) || 65,
        strokes: [],
        advanceWidth: 680,
      };
      return {
        ...prev,
        [activeChar]: {
          ...existing,
          strokes: [...existing.strokes, ...newStrokes],
        },
      };
    });
  };

  const handleUndo = () => {
    setGlyphMap((prev) => {
      const existing = prev[activeChar];
      if (!existing || existing.strokes.length === 0) return prev;
      return {
        ...prev,
        [activeChar]: {
          ...existing,
          strokes: existing.strokes.slice(0, -1),
        },
      };
    });
  };

  const handleClearGlyph = () => {
    setGlyphMap((prev) => ({
      ...prev,
      [activeChar]: {
        char: activeChar,
        unicode: activeChar.codePointAt(0) || 65,
        strokes: [],
        tracedMask: undefined,
        advanceWidth: currentGlyph.advanceWidth,
      },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setBgImage(img);
        setBgImageName(file.name);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAutoTraceImage = () => {
    if (!bgImage) return;
    const gs = 96;
    const offscreen = document.createElement('canvas');
    offscreen.width = gs;
    offscreen.height = gs;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, gs, gs);

    const aspect = bgImage.width / Math.max(1, bgImage.height);
    let drawW = gs * bgScale;
    let drawH = drawW / aspect;
    if (drawH > gs * bgScale) {
      drawH = gs * bgScale;
      drawW = drawH * aspect;
    }
    const dx = (gs - drawW) / 2;
    const dy = (gs - drawH) / 2;
    ctx.drawImage(bgImage, dx, dy, drawW, drawH);

    const imgData = ctx.getImageData(0, 0, gs, gs).data;
    const mask: number[] = new Array(gs * gs).fill(0);
    for (let i = 0; i < gs * gs; i++) {
      const r = imgData[i * 4];
      const g = imgData[i * 4 + 1];
      const b = imgData[i * 4 + 2];
      const a = imgData[i * 4 + 3];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const isDark = a > 30 && (invertTrace ? luma > traceThreshold : luma < traceThreshold);
      mask[i] = isDark ? 1 : 0;
    }

    setGlyphMap((prev) => ({
      ...prev,
      [activeChar]: {
        char: activeChar,
        unicode: activeChar.codePointAt(0) || 65,
        strokes: prev[activeChar]?.strokes || [],
        tracedMask: mask,
        gridSize: gs,
        advanceWidth: prev[activeChar]?.advanceWidth || 720,
      },
    }));
  };

  const handleCompileFont = async () => {
    setIsCompiling(true);
    setCompileError(null);
    try {
      const result = compileParametricStudioFont(
        meta,
        glyphMap,
        {
          boldness: paramBoldness,
          slantDeg: paramSlantDeg,
          widthScale: paramWidthScale,
        },
        CANVAS_SIZE
      );
      await registerStudioFontFace(result.familyName, result.buffer);
      setCompiled(result);
    } catch (err) {
      setCompileError(
        err instanceof Error ? err.message : 'Failed to compile OpenType font.'
      );
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCompileFamilyZip = async () => {
    setIsPackagingFamily(true);
    setCompileError(null);
    try {
      const zip = new JSZip();
      const baseSlug =
        (meta.familyName || 'PanglossCustom').toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
        'pangloss-custom';
      const variants = [
        {
          styleName: 'Regular',
          weight: 400,
          style: 'normal',
          params: { boldness: 0, slantDeg: 0, widthScale: 1 },
        },
        {
          styleName: 'Bold',
          weight: 700,
          style: 'normal',
          params: { boldness: 2, slantDeg: 0, widthScale: 1.04 },
        },
        {
          styleName: 'Italic',
          weight: 400,
          style: 'italic',
          params: { boldness: 0, slantDeg: 11, widthScale: 1 },
        },
        {
          styleName: 'Condensed',
          weight: 400,
          style: 'normal',
          params: { boldness: 0, slantDeg: 0, widthScale: 0.78 },
        },
      ];

      const cssRules: string[] = [];
      for (const v of variants) {
        const res = compileParametricStudioFont(
          { ...meta, styleName: v.styleName },
          glyphMap,
          v.params,
          CANVAS_SIZE
        );
        const fileName = `${baseSlug}-${v.styleName.toLowerCase()}.otf`;
        zip.file(`fonts/${fileName}`, res.buffer);
        cssRules.push(
          `@font-face {\n  font-family: '${meta.familyName || 'PanglossCustom'}';\n  src: url('./fonts/${fileName}') format('opentype');\n  font-weight: ${v.weight};\n  font-style: ${v.style};\n  font-display: swap;\n}`
        );
      }

      zip.file('family.css', cssRules.join('\n\n') + '\n');
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerBinaryDownload(blob, `${baseSlug}-4-style-family.zip`, 'application/zip');
    } catch (err) {
      setCompileError(
        err instanceof Error ? err.message : 'Failed to package multi-style .otf family.'
      );
    } finally {
      setIsPackagingFamily(false);
    }
  };

  const handleAddCustomChar = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCharInput.trim();
    if (!trimmed) return;
    const firstChar = Array.from(trimmed)[0];
    if (firstChar) {
      setActiveChar(firstChar);
      setCustomCharInput('');
    }
  };

  const drawnGlyphChars = useMemo(
    () =>
      Object.values(glyphMap)
        .filter((g) => g.strokes.length > 0 || (g.tracedMask && g.tracedMask.some((v) => v > 0)))
        .map((g) => g.char),
    [glyphMap]
  );

  const embedCode = useMemo(() => {
    if (!compiled) return '';
    return embedFormat === 'html'
      ? generateStudioEmbedSnippet(meta, compiled.base64, liveTestText)
      : generateStudioScriptEmbed(meta, compiled.base64);
  }, [compiled, embedFormat, meta, liveTestText]);

  const handleCopyEmbed = async () => {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="space-y-8">
      <section className="border-b border-stone-200 pb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium tracking-wide text-[#6E6A63]">
            Browser-Local OpenType Authoring · Zero Backend · Instant .OTF &amp; Embed
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#141413] mt-2 [text-wrap:balance]">
            Font Studio — Draw, Trace Images &amp; Compile Parametric Fonts
          </h1>
          <p className="text-sm sm:text-base text-[#57534E] max-w-3xl mt-2 leading-relaxed">
            Draw glyphs from scratch or trace any uploaded image across {STUDIO_WORLD_CHARSETS.length} world script sets. Compile locally to <code className="font-mono text-xs bg-stone-200/70 px-1.5 py-0.5 rounded">.otf</code>, synthesize parametric Bold / Italic / Condensed variants, and export self-contained embed code.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCompileFont}
          disabled={isCompiling || drawnGlyphChars.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#B43E22] text-white rounded-lg hover:bg-[#993219] disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Package className="w-4 h-4" />
          {isCompiling ? 'Compiling OpenType...' : `Compile & Register Font (${drawnGlyphChars.length} Glyphs)`}
        </button>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Character Picker & Metrics */}
        <div className="xl:col-span-4 space-y-5">
          <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#141413]">
                1. Choose Script &amp; Glyph
              </h2>
              <span className="text-xs font-mono text-[#6E6A63] tabular-nums">
                {activeChar} · U+{(activeChar.codePointAt(0) || 65).toString(16).toUpperCase().padStart(4, '0')}
              </span>
            </div>

            <div className="space-y-2">
              <select
                aria-label="Choose world script or language character set"
                value={activeSetId}
                onChange={(e) => {
                  const next = STUDIO_WORLD_CHARSETS.find((c) => c.id === e.target.value);
                  setActiveSetId(e.target.value);
                  if (next && next.chars.length > 0) {
                    setActiveChar(next.chars[0]);
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-stone-300 rounded-md text-[#141413] font-medium"
              >
                {STUDIO_WORLD_CHARSETS.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.label} — {set.region} ({set.chars.length} chars)
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1">
                {STUDIO_WORLD_CHARSETS.filter((s) => FEATURED_CHARSET_IDS.includes(s.id)).map((set) => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => setActiveSetId(set.id)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md cursor-pointer whitespace-nowrap ${
                      activeSetId === set.id
                        ? 'bg-[#141413] text-white'
                        : 'bg-stone-100 text-[#57534E] hover:text-[#141413]'
                    }`}
                  >
                    {set.label.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div
              dir={activeSet.direction}
              className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-48 overflow-y-auto pr-1"
            >
              {activeSet.chars.map((ch, idx) => {
                const isSelected = activeChar === ch;
                const hasInk =
                  glyphMap[ch] &&
                  (glyphMap[ch].strokes.length > 0 ||
                    (glyphMap[ch].tracedMask && glyphMap[ch].tracedMask!.some((v) => v > 0)));
                return (
                  <button
                    key={`${activeSet.id}-${idx}-${ch}`}
                    type="button"
                    onClick={() => setActiveChar(ch)}
                    className={`relative h-9 border rounded-md text-sm font-medium flex items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#B43E22] text-white border-[#B43E22]'
                        : hasInk
                          ? 'bg-stone-100 text-[#141413] border-stone-400 font-semibold'
                          : 'bg-[#FAF9F6] text-[#57534E] border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddCustomChar} className="flex gap-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                maxLength={4}
                aria-label="Enter any custom Unicode character"
                placeholder="Any Unicode char (e.g. ض, λ, あ)..."
                value={customCharInput}
                onChange={(e) => setCustomCharInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md cursor-pointer whitespace-nowrap"
              >
                Select Char
              </button>
            </form>
          </div>

          {/* Image Underlay & Auto-Trace Card */}
          <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
            <h2 className="text-sm font-semibold text-[#141413]">
              2. Draw Over Special Image / Auto-Trace
            </h2>
            <p className="text-xs text-[#6E6A63] leading-relaxed">
              Upload any lettering photo, scan, PNG, or SVG to draw over it—or auto-vectorize dark ink into OpenType contours.
            </p>

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#FAF9F6] border border-stone-300 rounded-lg hover:border-[#B43E22] cursor-pointer">
                <ImagePlus className="w-3.5 h-3.5 text-[#B43E22]" />
                <span>{bgImageName ? 'Change Image' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                />
              </label>

              {bgImage && (
                <>
                  <button
                    type="button"
                    onClick={handleAutoTraceImage}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#141413] text-white rounded-lg hover:bg-[#B43E22] cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Auto-Trace to Glyph
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgImage(null);
                      setBgImageName('');
                    }}
                    className="px-2.5 py-2 text-xs text-[#6E6A63] hover:text-[#B43E22] cursor-pointer"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>

            {bgImage && (
              <div className="space-y-2.5 pt-2 border-t border-stone-100 text-xs">
                <div className="text-[#57534E] truncate">Active image: {bgImageName}</div>
                <label className="block">
                  <span className="flex justify-between text-[#57534E] tabular-nums">
                    <span>Underlay Opacity</span>
                    <span>{Math.round(bgOpacity * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(Number(e.target.value))}
                    className="w-full accent-[#B43E22]"
                  />
                </label>

                <label className="block">
                  <span className="flex justify-between text-[#57534E] tabular-nums">
                    <span>Image Scale</span>
                    <span>{Math.round(bgScale * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    min={0.4}
                    max={1.8}
                    step={0.05}
                    value={bgScale}
                    onChange={(e) => setBgScale(Number(e.target.value))}
                    className="w-full accent-[#B43E22]"
                  />
                </label>

                <label className="block">
                  <span className="flex justify-between text-[#57534E] tabular-nums">
                    <span>Auto-Trace Threshold</span>
                    <span>{traceThreshold}</span>
                  </span>
                  <input
                    type="range"
                    min={40}
                    max={220}
                    value={traceThreshold}
                    onChange={(e) => setTraceThreshold(Number(e.target.value))}
                    className="w-full accent-[#B43E22]"
                  />
                </label>

                <label className="inline-flex items-center gap-1.5 text-[#57534E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invertTrace}
                    onChange={(e) => setInvertTrace(e.target.checked)}
                    className="accent-[#B43E22]"
                  />
                  <span>Trace Light Ink on Dark Background</span>
                </label>
              </div>
            )}

            <div className="pt-2 border-t border-stone-100">
              <label className="text-xs font-medium text-[#57534E] block mb-1">
                Special Format Grid / Guide Sheet
              </label>
              <select
                value={gridTemplate}
                onChange={(e) =>
                  setGridTemplate(e.target.value as 'none' | 'armenian-grid' | 'calligraphy-lines')
                }
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
              >
                <option value="armenian-grid">Proportion Matrix (40px Square Grid)</option>
                <option value="calligraphy-lines">Calligraphy Nib Ruled &amp; Slant Sheet</option>
                <option value="none">Blank Paper</option>
              </select>
            </div>
          </div>

          {/* Family Metadata */}
          <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
            <h2 className="text-sm font-semibold text-[#141413]">3. Typeface Metadata</h2>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <label className="block col-span-2">
                <span className="text-[#57534E]">Font Family Name</span>
                <input
                  type="text"
                  value={meta.familyName}
                  onChange={(e) => setMeta({ ...meta, familyName: e.target.value })}
                  className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
                />
              </label>
              <label className="block">
                <span className="text-[#57534E]">Style</span>
                <input
                  type="text"
                  value={meta.styleName}
                  onChange={(e) => setMeta({ ...meta, styleName: e.target.value })}
                  className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
                />
              </label>
              <label className="block">
                <span className="text-[#57534E]">Designer</span>
                <input
                  type="text"
                  value={meta.designer}
                  onChange={(e) => setMeta({ ...meta, designer: e.target.value })}
                  className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
                />
              </label>
            </div>

            {/* Parametric OTF Variant Synthesis Axes */}
            <div className="pt-3 border-t border-stone-100 space-y-2.5 text-xs">
              <div className="font-semibold text-[#141413]">
                4. Parametric .OTF Variant Synthesizer
              </div>
              <label className="block">
                <span className="flex justify-between text-[#57534E] tabular-nums">
                  <span>Weight Boldness</span>
                  <span>{paramBoldness > 0 ? `+${paramBoldness}` : paramBoldness}</span>
                </span>
                <input
                  type="range"
                  aria-label="Parametric boldness"
                  min={-1}
                  max={2}
                  step={1}
                  value={paramBoldness}
                  onChange={(e) => setParamBoldness(Number(e.target.value))}
                  className="w-full accent-[#B43E22]"
                />
              </label>
              <label className="block">
                <span className="flex justify-between text-[#57534E] tabular-nums">
                  <span>Oblique / Italic Slant</span>
                  <span>{paramSlantDeg}°</span>
                </span>
                <input
                  type="range"
                  aria-label="Parametric slant degrees"
                  min={-16}
                  max={16}
                  step={1}
                  value={paramSlantDeg}
                  onChange={(e) => setParamSlantDeg(Number(e.target.value))}
                  className="w-full accent-[#B43E22]"
                />
              </label>
              <label className="block">
                <span className="flex justify-between text-[#57534E] tabular-nums">
                  <span>Optical Width Stretch</span>
                  <span>{Math.round(paramWidthScale * 100)}%</span>
                </span>
                <input
                  type="range"
                  aria-label="Parametric optical width"
                  min={0.75}
                  max={1.3}
                  step={0.05}
                  value={paramWidthScale}
                  onChange={(e) => setParamWidthScale(Number(e.target.value))}
                  className="w-full accent-[#B43E22]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Center/Right: Drawing Canvas + Live Compiler & Embed Output */}
        <div className="xl:col-span-8 space-y-6">
          <div className="p-4 sm:p-5 bg-white border border-stone-200 rounded-xl space-y-4">
            {/* Drawing Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    { id: 'pen', label: 'Brush', icon: Brush },
                    { id: 'calligraphy', label: 'Nib', icon: Feather },
                    { id: 'line', label: 'Line', icon: Minus },
                    { id: 'rect', label: 'Rect', icon: Square },
                    { id: 'circle', label: 'Circle', icon: Circle },
                    { id: 'eraser', label: 'Eraser', icon: Eraser },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = tool === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTool(item.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#141413] text-white'
                          : 'bg-[#FAF9F6] text-[#57534E] hover:text-[#141413]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMirrorX((m) => !m)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer whitespace-nowrap ${
                    mirrorX
                      ? 'bg-[#B43E22] text-white border-[#B43E22]'
                      : 'border-stone-200 text-[#57534E] hover:text-[#141413]'
                  }`}
                >
                  <FlipHorizontal2 className="w-3.5 h-3.5" />
                  Mirror
                </button>

                <button
                  type="button"
                  onClick={() => setShowGhostGuide((g) => !g)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer whitespace-nowrap ${
                    showGhostGuide
                      ? 'bg-stone-100 text-[#141413] border-stone-300'
                      : 'border-stone-200 text-[#6E6A63]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Guide
                </button>

                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-stone-200 rounded-md text-[#141413] hover:bg-stone-100 cursor-pointer whitespace-nowrap"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo
                </button>

                <button
                  type="button"
                  onClick={handleClearGlyph}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-stone-200 rounded-md text-[#B43E22] hover:bg-red-50 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            {/* Brush / Nib / Advance Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <label className="block">
                <span className="flex justify-between text-[#57534E] tabular-nums">
                  <span>Stroke Weight</span>
                  <span>{brushWidth}px</span>
                </span>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={brushWidth}
                  onChange={(e) => setBrushWidth(Number(e.target.value))}
                  className="w-full mt-1 accent-[#B43E22]"
                />
              </label>

              <label className="block">
                <span className="flex justify-between text-[#57534E] tabular-nums">
                  <span>Nib Angle</span>
                  <span>{calligraphyAngle}°</span>
                </span>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={calligraphyAngle}
                  onChange={(e) => setCalligraphyAngle(Number(e.target.value))}
                  className="w-full mt-1 accent-[#B43E22]"
                />
              </label>

              <label className="block">
                <span className="flex justify-between text-[#57534E] tabular-nums">
                  <span>Advance Width</span>
                  <span>{currentGlyph.advanceWidth} units</span>
                </span>
                <input
                  type="range"
                  min={320}
                  max={1000}
                  step={10}
                  value={currentGlyph.advanceWidth}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setGlyphMap((prev) => ({
                      ...prev,
                      [activeChar]: {
                        ...currentGlyph,
                        advanceWidth: w,
                      },
                    }));
                  }}
                  className="w-full mt-1 accent-[#B43E22]"
                />
              </label>
            </div>

            {/* Canvas Container */}
            <div className="flex justify-center bg-[#FAF9F6] border border-stone-200 rounded-xl p-4 studio-grid-bg">
              <canvas
                ref={canvasRef}
                data-testid="studio-glyph-canvas"
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={commitDrawing}
                onPointerCancel={commitDrawing}
                className="w-full max-w-[400px] aspect-square bg-white border border-stone-300 rounded-lg shadow-xs touch-none cursor-crosshair"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6A63]">
              <span>
                Active glyphs ready to compile:{' '}
                <strong className="text-[#141413] font-mono">
                  {drawnGlyphChars.length > 0 ? drawnGlyphChars.join(' ') : 'None yet'}
                </strong>
              </span>
              <button
                type="button"
                onClick={handleCompileFont}
                disabled={isCompiling || drawnGlyphChars.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#B43E22] disabled:opacity-40 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                Compile &amp; Preview Live
              </button>
            </div>
          </div>

          {compileError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
              {compileError}
            </div>
          )}

          {/* Compiled Output: Live Test + Download .OTF + Self-Contained Embed */}
          {compiled && (
            <div
              data-testid="studio-compiled-panel"
              className="p-5 bg-white border border-stone-200 rounded-xl space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-base font-semibold text-[#141413]">
                    Compiled OpenType Binary Ready — {compiled.familyName}
                  </h2>
                  <p className="text-xs text-[#6E6A63] mt-0.5 tabular-nums">
                    {compiled.glyphCount} custom glyphs · {(compiled.buffer.byteLength / 1024).toFixed(1)} KB .otf · Registered in browser FontFace API
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCompileFamilyZip}
                    disabled={isPackagingFamily || drawnGlyphChars.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 text-[#141413] rounded-lg hover:border-[#141413] cursor-pointer whitespace-nowrap disabled:opacity-40"
                  >
                    <Package className="w-3.5 h-3.5" />
                    {isPackagingFamily ? 'Compiling 4 Styles...' : '4-Style Family .ZIP'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      triggerBinaryDownload(
                        compiled.buffer,
                        `${compiled.familyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.otf`,
                        'font/otf'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#B43E22] text-white rounded-lg hover:bg-[#993219] cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .OTF Font
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#57534E] block">
                  Live Test Render (type characters you drew: {drawnGlyphChars.join(' ')})
                </label>
                <input
                  type="text"
                  aria-label="Live test custom compiled font"
                  value={liveTestText}
                  onChange={(e) => setLiveTestText(e.target.value)}
                  style={{ fontFamily: `"${compiled.familyName}", sans-serif` }}
                  className="w-full px-4 py-4 text-4xl bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413] focus:outline-none focus:border-[#B43E22]"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setEmbedFormat('html')}
                      className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                        embedFormat === 'html'
                          ? 'bg-white text-[#141413] shadow-xs'
                          : 'text-[#57534E]'
                      }`}
                    >
                      Font Studio HTML + CSS Embed
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmbedFormat('script')}
                      className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                        embedFormat === 'script'
                          ? 'bg-white text-[#141413] shadow-xs'
                          : 'text-[#57534E]'
                      }`}
                    >
                      &lt;script&gt; Auto-Loader Embed
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyEmbed}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md hover:border-[#141413] cursor-pointer"
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEmbed ? 'Copied Embed Snippet' : 'Copy Embed Code'}
                  </button>
                </div>

                <pre className="p-3.5 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto max-h-48 leading-relaxed">
                  {embedCode}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
