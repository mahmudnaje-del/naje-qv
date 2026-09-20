import React, { useMemo, useRef, useState } from 'react';
import { Plus, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AVATAR_REGISTRY, NajiAvatar } from '../../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY, NajiLocation } from '../../data/locations/locationRegistry';
import {
  PRIMARY_SCENE_KINDS,
  SCENE_ADD_GROUPS,
  SCENE_ADD_OPTIONS,
  SCENE_TRANSITIONS,
  SceneBoardCard,
  SceneCardKind,
  isTimedKind,
  newSceneCardId,
} from '../../lib/omniAd';
import { CircularCardCarousel } from './CircularCardCarousel';
import { AvatarPhoto } from './AvatarPhoto';
import { LocationPhoto } from './LocationPhoto';

type DeckItem = { type: 'add'; id: '__add__' } | { type: 'card'; id: string; card: SceneBoardCard };

function readFile(file: File, cb: (url: string) => void) {
  const reader = new FileReader();
  reader.onload = () => cb(String(reader.result || ''));
  reader.readAsDataURL(file);
}

function optionMeta(kind: SceneCardKind) {
  return SCENE_ADD_OPTIONS.find((o) => o.id === kind);
}

export function CastBoard({
  cards,
  onChange,
  duration,
  libraryAvatar,
  libraryLocation,
}: {
  cards: SceneBoardCard[];
  onChange: (cards: SceneBoardCard[]) => void;
  duration: number;
  libraryAvatar: NajiAvatar | null;
  libraryLocation: NajiLocation | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [centerIndex, setCenterIndex] = useState(1);

  const items: DeckItem[] = useMemo(
    () => [{ type: 'add', id: '__add__' }, ...cards.map((card) => ({ type: 'card' as const, id: card.id, card }))],
    [cards]
  );

  const addCard = (kind: SceneCardKind) => {
    const hasPrimaryChar = cards.some((c) => c.kind === 'character');
    const hasPrimaryLoc = cards.some((c) => c.kind === 'location');
    const hasPrimaryProduct = cards.some((c) => c.kind === 'product');
    let resolved: SceneCardKind = kind;
    if (kind === 'character' && hasPrimaryChar) resolved = 'character_extra';
    if (kind === 'location' && hasPrimaryLoc) resolved = 'location_extra';
    if (kind === 'product' && hasPrimaryProduct) resolved = 'second_product';
    const timed = isTimedKind(resolved);
    const next: SceneBoardCard = {
      id: newSceneCardId(),
      kind: resolved,
      appearAtSec: timed ? Math.min(duration - 2, Math.max(4, Math.round(duration / 2))) : 0,
      transition: timed ? (resolved === 'location_extra' || resolved === 'time_of_day' ? 'morph' : 'walk_in') : 'seamless',
    };
    if (resolved === 'character' && libraryAvatar) {
      next.avatarId = libraryAvatar.id;
      next.name = libraryAvatar.name;
    }
    if (resolved === 'location' && libraryLocation) {
      next.locationId = libraryLocation.id;
      next.name = libraryLocation.name;
    }
    onChange([...cards, next]);
    setCenterIndex(cards.length + 1);
  };

  const patch = (id: string, partial: Partial<SceneBoardCard>) => {
    onChange(cards.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  };

  const remove = (id: string) => {
    const idx = cards.findIndex((c) => c.id === id);
    onChange(cards.filter((c) => c.id !== id));
    setCenterIndex(Math.max(0, idx));
  };

  const attachFileTo = (id: string) => {
    fileRef.current?.setAttribute('data-target', id);
    fileRef.current?.click();
  };

  return (
    <div className="space-y-3 text-right" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-white">لوحة المشهد</h2>
          <p className="text-[11px] text-white/45">
            اسحب كالبطاقات الأخرى. بطاقة الإضافة دائماً موجودة — شخصية ثانية أو مكان ينتقل عند الثانية التي تختارها.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-white/60">
          <button type="button" onClick={() => setCenterIndex((i) => (i - 1 + items.length) % items.length)} className="rounded-lg border border-white/10 p-1.5">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="font-mono text-[#e8b86d]">
            {centerIndex + 1}/{items.length}
          </span>
          <button type="button" onClick={() => setCenterIndex((i) => (i + 1) % items.length)} className="rounded-lg border border-white/10 p-1.5">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const target = fileRef.current?.getAttribute('data-target') || '';
          e.target.value = '';
          if (!f) return;
          readFile(f, (url) => {
            if (cards.some((c) => c.id === target)) patch(target, { preview: url });
          });
        }}
      />

      <div className="relative overflow-visible rounded-3xl border border-white/8 bg-[#0c0e14] p-3">
        <CircularCardCarousel<DeckItem>
          items={items}
          getKey={(c) => c.id}
          isSelected={(c) => c.type === 'card' && Boolean(c.card.preview || c.card.avatarId || c.card.locationId || c.card.name)}
          onSelect={() => {}}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          frameClassName="h-[540px] sm:h-[560px]"
          renderCard={(item, isCenter) => {
            if (item.type === 'add') {
              return (
                <div
                  className={`${isCenter ? 'w-[82vw] max-w-[17.5rem]' : 'w-40'} overflow-hidden rounded-2xl border border-dashed border-[#d4a574]/55 bg-gradient-to-b from-[#2a1c12] to-[#120e0c] p-3 shadow-[0_20px_50px_-24px_rgba(212,165,116,0.55)]`}
                >
                  <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-black text-[#e8b86d]">
                    <Plus className="h-3.5 w-3.5" /> أضف بطاقة
                  </div>
                  {isCenter ? (
                    <div className="max-h-[460px] space-y-2.5 overflow-y-auto pr-0.5">
                      {SCENE_ADD_GROUPS.map((group) => (
                        <div key={group.title}>
                          <p className="mb-1 text-[9px] font-black tracking-wide text-white/35">{group.title}</p>
                          <div className="space-y-1">
                            {group.ids.map((id) => {
                              const opt = optionMeta(id);
                              if (!opt) return null;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addCard(id);
                                  }}
                                  className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-black/35 px-2.5 py-2 text-right hover:border-[#d4a574]/45"
                                >
                                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: opt.accent }} />
                                  <span className="min-w-0">
                                    <span className="block text-[11px] font-black text-white">{opt.label}</span>
                                    <span className="block text-[9px] leading-snug text-white/40">{opt.desc}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] flex-col items-center justify-center text-[#e8b86d]/85">
                      <Plus className="mb-2 h-8 w-8" />
                      <span className="text-[11px] font-bold">إضافة عنصر</span>
                    </div>
                  )}
                </div>
              );
            }

            const card = item.card;
            const meta = optionMeta(card.kind);
            const accent = meta?.accent || '#d4a574';
            const timed = isTimedKind(card.kind);
            const primary = PRIMARY_SCENE_KINDS.includes(card.kind);
            const emptyLabel =
              card.kind === 'product'
                ? 'ارفق صورة المنتج'
                : card.kind === 'character' || card.kind === 'character_extra'
                ? 'ارفق شخصية أو استخدم مكتبة ناجي'
                : card.kind === 'location' || card.kind === 'location_extra'
                ? 'ارفق مكاناً أو استخدم مواقع ناجي'
                : 'ارفق صورة المرجع';

            return (
              <div
                className={`${isCenter ? 'w-[82vw] max-w-[17.5rem]' : 'w-40'} overflow-hidden rounded-2xl border bg-[#12141c] p-2.5`}
                style={{ borderColor: isCenter ? accent : 'rgba(255,255,255,0.1)' }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black" style={{ color: accent }}>
                    {meta?.label || card.kind}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(card.id);
                    }}
                    className="rounded-full p-1 text-white/40 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    attachFileTo(card.id);
                  }}
                  className="relative mb-2 flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-black/35"
                  style={{ borderColor: `${accent}55` }}
                >
                  {card.preview ? (
                    <img src={card.preview} alt="" className="h-full w-full object-cover" />
                  ) : card.avatarId && AVATAR_REGISTRY[card.avatarId] ? (
                    <AvatarPhoto
                      id={card.avatarId}
                      name={card.name || AVATAR_REGISTRY[card.avatarId].name}
                      gradient={AVATAR_REGISTRY[card.avatarId].placeholderGradient}
                      className="h-full w-full"
                    />
                  ) : card.locationId && LOCATION_REGISTRY[card.locationId] ? (
                    <LocationPhoto
                      id={card.locationId}
                      name={card.name || LOCATION_REGISTRY[card.locationId].name}
                      gradient={LOCATION_REGISTRY[card.locationId].placeholderGradient}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 px-3 text-white/45">
                      <Upload className="h-6 w-6" />
                      <span className="text-center text-[10px] font-bold">{emptyLabel}</span>
                    </div>
                  )}
                </button>
                {isCenter && (
                  <div className="space-y-1.5">
                    <input
                      value={card.name || ''}
                      onChange={(e) => patch(card.id, { name: e.target.value })}
                      placeholder={card.kind === 'onscreen_text' ? 'النص الظاهر حرفياً' : primary ? (card.kind === 'product' ? 'اسم المنتج أو الخدمة' : 'اسم') : 'اسم أو ملاحظة'}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
                    />
                    {(card.kind === 'character' || card.kind === 'character_extra') && libraryAvatar && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          patch(card.id, { avatarId: libraryAvatar.id, name: libraryAvatar.name, preview: null });
                        }}
                        className="w-full rounded-xl border border-[#7dd3c7]/30 py-1.5 text-[10px] font-bold text-[#7dd3c7]"
                      >
                        استخدم الشخصية المختارة من المكتبة
                      </button>
                    )}
                    {(card.kind === 'location' || card.kind === 'location_extra') && libraryLocation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          patch(card.id, { locationId: libraryLocation.id, name: libraryLocation.name, preview: null });
                        }}
                        className="w-full rounded-xl border border-[#93c5fd]/30 py-1.5 text-[10px] font-bold text-[#93c5fd]"
                      >
                        استخدم المكان المختار من المكتبة
                      </button>
                    )}
                    {timed && (
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                        <label className="mb-1 block text-[10px] font-black text-[#e8b86d]">
                          انتقال عند الثانية {card.appearAtSec ?? 0} / {duration}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={Math.max(2, duration - 1)}
                          value={card.appearAtSec ?? Math.round(duration / 2)}
                          onChange={(e) => patch(card.id, { appearAtSec: Number(e.target.value) })}
                          className="w-full accent-[#d4a574]"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {SCENE_TRANSITIONS.map((tr) => (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                patch(card.id, { transition: tr.id });
                              }}
                              className={`rounded-lg border px-2 py-1 text-[9px] font-bold ${
                                card.transition === tr.id
                                  ? 'border-[#d4a574] bg-[#d4a574]/15 text-[#e8b86d]'
                                  : 'border-white/10 text-white/50'
                              }`}
                            >
                              {tr.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!isCenter && (
                  <p className="truncate text-[11px] font-bold text-white">
                    {card.name || meta?.label}
                    {timed && card.appearAtSec ? ` · ث${card.appearAtSec}` : ''}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
