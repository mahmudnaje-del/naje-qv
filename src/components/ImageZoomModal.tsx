import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RefreshCw, Sparkles, Download, HelpCircle } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  src: string;
  onClose: () => void;
}

export default function ImageZoomModal({ isOpen, src, onClose }: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPixelated, setIsPixelated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const touchStartDist = useRef(0);
  const touchStartScale = useRef(1);
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(3);
      }
    }
    lastTap.current = now;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDoubleTap();
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      touchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      if (scale <= 1) return;
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      let newScale = touchStartScale.current * factor;
      newScale = Math.max(1, Math.min(newScale, 20));
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.current.x;
      const newY = touch.clientY - dragStart.current.y;
      const maxOffset = (scale - 1) * 200;
      setPosition({
        x: Math.max(Math.min(newX, maxOffset), -maxOffset),
        y: Math.max(Math.min(newY, maxOffset), -maxOffset)
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = 0;
  };

  // Reset zoom on open/close
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale = scale;
    if (e.deltaY < 0) {
      newScale = Math.min(scale * zoomFactor, 20); // up to 20x zoom
    } else {
      newScale = Math.max(scale / zoomFactor, 1);
    }
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // Only allow panning when zoomed in
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // Boundary check based on scale
    const maxOffset = (scale - 1) * 200;
    setPosition({
      x: Math.max(Math.min(newX, maxOffset), -maxOffset),
      y: Math.max(Math.min(newY, maxOffset), -maxOffset)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale(prev => Math.min(prev * 1.3, 20));
  const zoomOut = () => setScale(prev => {
    const next = prev / 1.3;
    if (next <= 1) {
      setPosition({ x: 0, y: 0 });
      return 1;
    }
    return next;
  });
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-black/95 backdrop-blur-md overflow-hidden text-right">
          {/* Header Controls */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Title / Description */}
            <div className="text-right">
              <h4 className="text-sm font-extrabold text-white">فحص التفاصيل بدقة البيكسل</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">استخدم عجلة الفأرة أو السحب للمعاينة المكبرة</p>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPixelated(!isPixelated)}
                className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition border flex items-center gap-1 cursor-pointer ${
                  isPixelated 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-white/10 border-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                }`}
                title="تصفية الحواف / بكسل حاد"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>حواف بكسلية</span>
              </button>
              <button
                onClick={zoomIn}
                className="p-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={zoomOut}
                className="p-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={resetZoom}
                className="p-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="إعادة تعيين"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={containerRef}
            className="flex-1 w-full h-full flex items-center justify-center p-4 relative cursor-grab active:cursor-grabbing overflow-hidden select-none touch-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div
              style={{
                x: position.x,
                y: position.y,
                scale: scale,
              }}
              className="max-w-4xl max-h-[80vh] flex items-center justify-center"
            >
              {src.startsWith('data:video/') || src.endsWith('.mp4') || src.endsWith('.webm') || src.includes('/video') ? (
                <video
                  src={src}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
                />
              ) : (
                <img
                  src={src}
                  alt="Zoomed Detail"
                  className="max-w-full max-h-full object-contain pointer-events-none shadow-2xl select-none"
                  style={{
                    imageRendering: isPixelated ? 'pixelated' : 'auto',
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* Footer stats */}
          <div className="p-4 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-between text-xs text-gray-400 z-10">
            <span className="font-mono">{scale.toFixed(1)}x</span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>مستوى التكبير</span>
            </span>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
