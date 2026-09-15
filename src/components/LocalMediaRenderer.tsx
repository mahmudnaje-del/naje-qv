import React, { useState, useEffect } from 'react';
import { AlertCircle, Volume2 } from 'lucide-react';
import { getDoc as getLocalDoc } from '../lib/idb';
import ImageZoomModal from './ImageZoomModal';

export function detectBase64MimeType(b64: string, fallbackMime: string = 'image/png'): string {
  if (b64.startsWith('iVBORw0')) return 'image/png';
  if (b64.startsWith('/9j/')) return 'image/jpeg';
  if (b64.startsWith('R0lGO')) return 'image/gif';
  if (b64.startsWith('UklGR')) return 'image/webp';
  if (b64.startsWith('Qk0')) return 'image/bmp';
  if (b64.startsWith('PHN2Zw')) return 'image/svg+xml';
  return fallbackMime;
}

export default function LocalMediaRenderer({ 
  msg, 
  chatType, 
  onImageClick, 
  selectedCoord 
}: { 
  msg: any, 
  chatType: string, 
  onImageClick?: (x: number, y: number) => void, 
  selectedCoord?: {x: number, y: number} | null 
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);
    setIsLoaded(false);
    
    const prepareSrc = (raw: string) => {
      if (raw.startsWith('data:') || raw.startsWith('http')) return raw;
      const isVideo = chatType === 'video' || msg.mediaType === 'video';
      const isAudio = chatType === 'voice' || msg.mediaType === 'audio';
      const mime = isAudio ? 'audio/wav' : isVideo ? 'video/mp4' : detectBase64MimeType(raw, 'image/png');
      return `data:${mime};base64,${raw}`;
    };

    if (msg.mediaUrl) {
      if (msg.mediaUrl.startsWith('local:')) {
        const localId = msg.mediaUrl.split('local:')[1];
        getLocalDoc(localId).then(b64 => {
          if (active) {
            if (b64) {
              setSrc(prepareSrc(b64));
            } else {
              setHasError(true);
            }
          }
        }).catch(() => {
          if (active) setHasError(true);
        });
      } else {
        setSrc(prepareSrc(msg.mediaUrl));
      }
    }
    return () => { active = false; };
  }, [msg.mediaUrl, chatType, msg.mediaType]);

  const rawAspect = msg?.aspectRatio || (msg?.imageDetails?.aspectRatio) || (msg?.videoDetails?.aspectRatio) || '1:1';
  const aspectClass = rawAspect === '9:16' 
    ? 'aspect-[9/16]' 
    : rawAspect === '16:9' 
    ? 'aspect-video' 
    : rawAspect === '4:5' 
    ? 'aspect-[4/5]' 
    : rawAspect === '3:4'
    ? 'aspect-[3/4]'
    : rawAspect === '4:3'
    ? 'aspect-[4/3]'
    : 'aspect-square';

  if (hasError) {
    return (
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>عذراً، يتعذر تحميل الوسائط (قد تكون بيانات التخزين المؤقت غير متوفرة).</span>
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`w-full ${aspectClass} rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-center animate-pulse`}>
        <span className="text-gray-400 text-xs font-mono">جاري تحميل الوسائط...</span>
      </div>
    );
  }

  if (chatType === 'voice' || msg.mediaType === 'audio') {
    return (
      <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 rounded-2xl border border-emerald-500/30 shadow-lg flex flex-col gap-3 min-w-[280px] sm:min-w-[360px]">
        <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>تسجيل استوديو الصوتيات (Naje Voice)</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Audio MP3</span>
        </div>
        <audio src={src} controls className="w-full h-10 rounded-lg accent-emerald-500" />
      </div>
    );
  }

  return (chatType === 'video' || msg.mediaType === 'video') ? (
    <div className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl bg-black/40 border border-gray-800/40`}>
      <video 
        src={src} 
        controls 
        className="w-full h-full object-cover rounded-xl" 
        onError={() => setHasError(true)} 
      />
    </div>
  ) : (
    <div className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl border border-gray-800/40 bg-slate-950/40 select-none`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center z-0">
          <span className="text-xs text-slate-500 font-mono">معالجة العرض...</span>
        </div>
      )}
      <img 
        src={src} 
        alt="Generated Design" 
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} hover:brightness-105 ${onImageClick ? 'cursor-crosshair' : 'cursor-zoom-in hover:shadow-xl'}`} 
        onError={() => setHasError(true)}
        onClick={(e) => {
          if (onImageClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            onImageClick(x, y);
          } else {
            setIsZoomOpen(true);
          }
        }} 
      />
      {selectedCoord && (
        <div className="absolute w-6 h-6 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_10px_rgba(99,102,241,0.8)] pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10" 
             style={{ left: `${selectedCoord.x * 100}%`, top: `${selectedCoord.y * 100}%` }}>
             <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      )}
      <ImageZoomModal src={src} isOpen={isZoomOpen} onClose={() => setIsZoomOpen(false)} />
    </div>
  );
}
