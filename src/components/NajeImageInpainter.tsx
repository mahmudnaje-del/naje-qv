import React, { useRef, useEffect, useState } from 'react';
import { Paintbrush, Eraser, RotateCcw, Trash2, Check, X, Sliders, Wand2 } from 'lucide-react';
import NajeSpinner from './NajeSpinner';
import { toast } from '../toastStore';
import { auth } from '../firebase';

interface NajeImageInpainterProps {
  imageUrl: string;
  onApplyMask: (maskBase64Png: string) => void;
  onClose: () => void;
}

export default function NajeImageInpainter({ imageUrl, onApplyMask, onClose }: NajeImageInpainterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [toolMode, setToolMode] = useState<'brush' | 'eraser' | 'smart'>('brush');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [isSegmenting, setIsSegmenting] = useState<boolean>(false);
  const [smartDetectedLabel, setSmartDetectedLabel] = useState<string | null>(null);

  // Initialize canvas size matching the rendered image size
  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const handleLoad = () => {
      canvas.width = img.naturalWidth || img.clientWidth;
      canvas.height = img.naturalHeight || img.clientHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Save initial state
        setStrokeHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      }
      setImgLoaded(true);
    };

    if (img.complete && img.naturalWidth) {
      handleLoad();
    } else {
      img.onload = handleLoad;
    }
  }, [imageUrl]);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, scaleX: 1, scaleY: 1, domX: 0, domY: 0, normX: 0.5, normY: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const domX = e.clientX - rect.left;
    const domY = e.clientY - rect.top;

    return {
      x: domX * scaleX,
      y: domY * scaleY,
      scaleX,
      scaleY,
      domX,
      domY,
      normX: Math.max(0, Math.min(1, domX / (rect.width || 1))),
      normY: Math.max(0, Math.min(1, domY / (rect.height || 1)))
    };
  };

  const handleSmartSegment = async (normX: number, normY: number) => {
    if (isSegmenting) return;
    setIsSegmenting(true);
    setSmartDetectedLabel(null);
    try {
      const _tok = await auth.currentUser?.getIdToken();
      const resp = await fetch('/api/image/segment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(_tok ? { 'Authorization': `Bearer ${_tok}` } : {})
        },
        body: JSON.stringify({
          imageUrl,
          point: { x: normX, y: normY }
        })
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        throw new Error(errJson?.error || 'فشل التحديد التلقائي');
      }

      const data = await resp.json();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Save history
      setStrokeHistory(prev => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'; // Red highlight mask
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 4;

      if (Array.isArray(data.polygon) && data.polygon.length >= 3) {
        ctx.beginPath();
        data.polygon.forEach((pt: [number, number], idx: number) => {
          const px = (pt[0] / 1000) * canvas.width;
          const py = (pt[1] / 1000) * canvas.height;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (Array.isArray(data.box_2d) && data.box_2d.length === 4) {
        const [ymin, xmin, ymax, xmax] = data.box_2d;
        const x = (xmin / 1000) * canvas.width;
        const y = (ymin / 1000) * canvas.height;
        const w = ((xmax - xmin) / 1000) * canvas.width;
        const h = ((ymax - ymin) / 1000) * canvas.height;
        ctx.fillRect(x, y, w, h);
      }

      ctx.restore();
      const label = data.labelAr || data.labelEn || 'العنصر المكتشف';
      setSmartDetectedLabel(label);
      toast.success(`تم التحديد الذكي: ${label}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'تعذر التحديد الذكي، يرجى المحاولة بالفرشاة');
    } finally {
      setIsSegmenting(false);
    }
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y, scaleX, domX, domY, normX, normY } = getCanvasCoordinates(e);

    if (toolMode === 'smart') {
      handleSmartSegment(normX, normY);
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history state before starting new stroke
    setStrokeHistory(prev => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    setIsDrawing(true);
    setCursorPos({ x: domX, y: domY, visible: true });

    const effectiveBrushSize = brushSize * scaleX;
    const isEraser = toolMode === 'eraser';

    ctx.beginPath();
    ctx.arc(x, y, effectiveBrushSize / 2, 0, Math.PI * 2);
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'; // Semi-transparent red highlight
    }
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, scaleX, domX, domY } = getCanvasCoordinates(e);
    setCursorPos({ x: domX, y: domY, visible: true });

    if (!isDrawing || toolMode === 'smart') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const effectiveBrushSize = brushSize * scaleX;
    const isEraser = toolMode === 'eraser';

    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? '#000000' : 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = effectiveBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e && e.currentTarget && e.pointerId) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    }
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const handleUndo = () => {
    if (strokeHistory.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 2];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setStrokeHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSmartDetectedLabel(null);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const targetWidth = img.naturalWidth || canvas.width;
    const targetHeight = img.naturalHeight || canvas.height;

    // Create a 2-color B&W mask canvas matching the EXACT natural dimensions of the source image
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = targetWidth;
    maskCanvas.height = targetHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Fill black background
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, targetWidth, targetHeight);

    // Render source canvas onto target dimensions if scaled
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    const imgData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    const pixels = imgData.data;

    // Create mask image data
    const maskImgData = maskCtx.createImageData(targetWidth, targetHeight);
    const maskPixels = maskImgData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha > 10) {
        // Painted pixel -> White
        maskPixels[i] = 255;
        maskPixels[i + 1] = 255;
        maskPixels[i + 2] = 255;
        maskPixels[i + 3] = 255;
      } else {
        // Unpainted -> Black
        maskPixels[i] = 0;
        maskPixels[i + 1] = 0;
        maskPixels[i + 2] = 0;
        maskPixels[i + 3] = 255;
      }
    }

    maskCtx.putImageData(maskImgData, 0, 0);
    const maskDataUrl = maskCanvas.toDataURL('image/png');
    onApplyMask(maskDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-gray-900/90 text-white px-5 py-3 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            {toolMode === 'smart' ? <Wand2 className="w-5 h-5 text-purple-400" /> : <Paintbrush className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {toolMode === 'smart' ? 'التحديد الذكي بنقرة واحدة (Smart Auto-Select)' : 'تحديد منطقة التعديل (أداة الفرشاة)'}
            </h3>
            <p className="text-[11px] text-gray-400">
              {toolMode === 'smart' 
                ? 'انقر مباشرة على أي كائن أو شخص في الصورة ليتم تحديده بدقة تلقائياً' 
                : 'قم بطلاء المنطقة المراد تعديلها بالفرشاة الحمراء'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Canvas View Area */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full max-w-4xl my-4 flex items-center justify-center overflow-hidden rounded-2xl bg-gray-950/80 border border-gray-800/80 p-2"
      >
        <div className="relative inline-block max-h-full max-w-full select-none touch-none">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Target for inpainting"
            className="max-h-[60vh] sm:max-h-[68vh] max-w-full object-contain rounded-lg shadow-2xl block pointer-events-none"
            crossOrigin="anonymous"
          />
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerEnter={() => setCursorPos(p => ({ ...p, visible: true }))}
            onPointerLeave={() => setCursorPos(p => ({ ...p, visible: false }))}
            style={{ touchAction: 'none' }}
            className={`absolute inset-0 w-full h-full rounded-lg touch-none ${toolMode === 'smart' ? 'cursor-pointer' : 'cursor-crosshair'}`}
          />

          {/* Loading overlay for Smart Segmentation */}
          {isSegmenting && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center gap-2 z-30">
              <NajeSpinner className="w-8 h-8" />
              <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full border border-purple-500/40">
                جاري التعرف على الكائن وتحديده بدقة...
              </span>
            </div>
          )}

          {/* Label badge */}
          {smartDetectedLabel && !isSegmenting && (
            <div className="absolute top-3 left-3 bg-purple-950/90 text-purple-200 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20 flex items-center gap-1.5 animate-in fade-in">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>تم تحديد: {smartDetectedLabel}</span>
            </div>
          )}

          {/* Dynamic Brush / Eraser Ring Indicator (hidden in smart mode) */}
          {cursorPos.visible && toolMode !== 'smart' && (
            <div
              className="pointer-events-none absolute rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 z-20"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                width: `${brushSize}px`,
                height: `${brushSize}px`,
                borderColor: toolMode === 'eraser' ? '#f43f5e' : '#ef4444',
                backgroundColor: toolMode === 'eraser' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(239, 68, 68, 0.3)',
                boxShadow: '0 0 10px rgba(0,0,0,0.6)',
              }}
            />
          )}
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="w-full max-w-4xl bg-gray-900/90 text-white p-4 rounded-2xl border border-gray-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Tool Mode Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setToolMode('smart')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              toolMode === 'smart'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400'
                : 'bg-gray-800 text-purple-300 hover:bg-gray-700'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-300" />
            <span>تحديد ذكي</span>
          </button>
          <button
            type="button"
            onClick={() => setToolMode('brush')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              toolMode === 'brush'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span>الفرشاة</span>
          </button>
          <button
            type="button"
            onClick={() => setToolMode('eraser')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              toolMode === 'eraser'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span>الممحاة</span>
          </button>
        </div>

        {/* Brush Size Slider (shown only in brush / eraser modes) */}
        {toolMode !== 'smart' ? (
          <div className="flex items-center gap-3 bg-gray-950/60 px-4 py-2 rounded-xl border border-gray-800 flex-1 max-w-xs">
            <Sliders className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-300 font-semibold flex-shrink-0">حجم الفرشاة: {brushSize}px</span>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
            />
          </div>
        ) : (
          <div className="text-xs text-purple-300 bg-purple-950/40 border border-purple-800/60 px-3.5 py-2 rounded-xl">
            انقر على أي جزء من الصورة لتحديده فورياً
          </div>
        )}

        {/* History & Clear Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokeHistory.length <= 1}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 rounded-xl transition cursor-pointer"
            title="تراجع"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-2.5 bg-gray-800 hover:bg-rose-950/60 hover:text-rose-400 text-gray-200 rounded-xl transition cursor-pointer"
            title="مسح الكل"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer mr-2"
          >
            <Check className="w-4 h-4" />
            <span>اعتماد التحديد</span>
          </button>
        </div>
      </div>
    </div>
  );
}

