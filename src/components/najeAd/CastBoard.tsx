import React, { useRef } from 'react';
import { PackagePlus, User, MapPin, X, ImagePlus } from 'lucide-react';
import { NajiAvatar } from '../../data/avatars/avatarRegistry';
import { NajiLocation } from '../../data/locations/locationRegistry';
import { AvatarPhoto } from './AvatarPhoto';
import { LocationPhoto } from './LocationPhoto';

export function CastBoard({
  productName,
  productPreview,
  onProductName,
  onProductFile,
  onClearProduct,
  avatar,
  customCharacterPreview,
  onClearCharacter,
  location,
  customLocationPreview,
  onClearLocation,
}: {
  productName: string;
  productPreview: string | null;
  onProductName: (v: string) => void;
  onProductFile: (dataUrl: string) => void;
  onClearProduct: () => void;
  avatar: NajiAvatar | null;
  customCharacterPreview: string | null;
  onClearCharacter: () => void;
  location: NajiLocation | null;
  customLocationPreview: string | null;
  onClearLocation: () => void;
}) {
  const productRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File, cb: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" dir="rtl">
      <article className="group relative overflow-hidden rounded-3xl border border-[#d4a574]/35 bg-gradient-to-b from-[#2a1c12] to-[#120e0c] p-3 shadow-[0_20px_50px_-24px_rgba(212,165,116,0.55)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#e8b86d]">
            <PackagePlus className="h-3.5 w-3.5" /> أضف المنتج
          </span>
          {productPreview && (
            <button type="button" onClick={onClearProduct} className="rounded-full p-1 text-white/50 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => productRef.current?.click()}
          className="relative mb-2 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#d4a574]/40 bg-black/30"
        >
          {productPreview ? (
            <img src={productPreview} alt="منتج" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#e8b86d]/80">
              <ImagePlus className="h-7 w-7" />
              <span className="text-[11px] font-bold">ارفق صورة المنتج</span>
            </div>
          )}
        </button>
        <input
          ref={productRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readFile(f, onProductFile);
          }}
        />
        <input
          value={productName}
          onChange={(e) => onProductName(e.target.value)}
          placeholder="اسم المنتج أو الخدمة"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
        />
      </article>

      <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#111318] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#7dd3c7]">
            <User className="h-3.5 w-3.5" /> الشخصية
          </span>
          {(avatar || customCharacterPreview) && (
            <button type="button" onClick={onClearCharacter} className="rounded-full p-1 text-white/50 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-2xl bg-black/40">
          {customCharacterPreview ? (
            <img src={customCharacterPreview} alt="شخصية" className="h-full w-full object-cover object-top" />
          ) : avatar ? (
            <AvatarPhoto id={avatar.id} name={avatar.name} gradient={avatar.placeholderGradient} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-[11px] text-white/40">
              ارفق شخصية أو اسحب من مكتبة ناجي
            </div>
          )}
        </div>
        <p className="truncate text-xs font-bold text-white">
          {avatar?.name || (customCharacterPreview ? 'شخصية مرفقة' : 'لم تُختر بعد')}
        </p>
      </article>

      <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#111318] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#93c5fd]">
            <MapPin className="h-3.5 w-3.5" /> المكان
          </span>
          {(location || customLocationPreview) && (
            <button type="button" onClick={onClearLocation} className="rounded-full p-1 text-white/50 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative mb-2 aspect-video overflow-hidden rounded-2xl bg-black/40">
          {customLocationPreview ? (
            <img src={customLocationPreview} alt="مكان" className="h-full w-full object-cover" />
          ) : location ? (
            <LocationPhoto id={location.id} name={location.name} gradient={location.placeholderGradient} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-[11px] text-white/40">
              ارفق مكاناً أو اسحب مواقع ناجي
            </div>
          )}
        </div>
        <p className="truncate text-xs font-bold text-white">
          {location?.name || (customLocationPreview ? 'مكان مرفق' : 'لم يُختر بعد')}
        </p>
      </article>
    </div>
  );
}
