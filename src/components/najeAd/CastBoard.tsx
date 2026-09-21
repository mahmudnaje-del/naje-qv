import React, { useMemo, useRef, useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
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
  const [hint, setHint] = useState(true);

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
    <div className="space-y-2.5 text-right" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white sm:text-base">لوحة المشهد</h2>
          <p className="text-[10px] leading-snug text-white/45 sm:text-[11px]">
            اسحب البطاقات. الإضافة دائماً موجودة — شخصية أو مكان يظهر عند الثانية التي تختارها.
          </p>
        </div>
        <span
          className="shrink-0 rounded-lg border border-white/10 px-2 py-1 font-mono text-[11px] font-bold text-[var(--naje-accent-2)]"
          dir="ltr"
          style={{ unicodeBidi: 'bidi-override' }}
        >
          {centerIndex + 1} / {items.length}
        </span>
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

      <div className="relative overflow-visible rounded-2xl border border-white/8 bg-[#0c0e14] px-1 py-3 sm:rounded-3xl sm:px-2 sm:py-4">
        <CircularCardCarousel<DeckItem>
          items={items}
          getKey={(c) => c.id}
          isSelected={(c) => c.type === 'card' && Boolean(c.card.preview || c.card.avatarId || c.card.locationId || c.card.name)}
          onSelect={() => {}}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          onUserSwipe={() => setHint(false)}
          showHand={hint}
          handLabel="اسحب لتقليب المشهد"
          frameClassName="h-[318px] sm:h-[370px]"
          renderCard={(item, isCenter) => {
            if (item.type === 'add') {
              return (
                <div
                  className="w-[40vw] max-w-[10.75rem] overflow-hidden rounded-2xl border border-dashed border-[var(--naje-accent)]/55 bg-gradient-to-b from-[#2a1c12] to-[#120e0c] p-2.5 shadow-[0_20px_50px_-24px_rgba(212,165,116,0.55)] sm:max-w-[12.5rem]"
                >
                  <div className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-black/25 py-1.5">
                    <span className="h-1 w-7 rounded-full bg-[var(--naje-accent)]/80" />
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-[var(--naje-accent-2)]">
                      <Plus className="h-3.5 w-3.5" /> أضف · اسحب
                    </span>
                    <span className="h-1 w-7 rounded-full bg-[var(--naje-accent)]/80" />
                  </div>
                  {isCenter ? (
                    <div data-no-drag className="max-h-[230px] space-y-2 overflow-y-auto overscroll-contain touch-pan-y pr-0.5">
                      {SCENE_ADD_GROUPS.map((group) => (
                        <div key={group.title}>
                          <p className="mb-1 text-[9px] font-black tracking-wide text-white/35">{group.title}</p>
                          <div className="grid grid-cols-2 gap-1">
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
                                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-1.5 py-1.5 text-right hover:border-[var(--naje-accent)]/45"
                                >
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: opt.accent }} />
                                  <span className="min-w-0 truncate text-[10px] font-black text-white">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] flex-col items-center justify-center text-[var(--naje-accent-2)]/85">
                      <Plus className="mb-2 h-8 w-8" />
                      <span className="text-[11px] font-bold">إضافة عنصر</span>
                    </div>
                  )}
                </div>
              );
            }

            const card = item.card;
            const meta = optionMeta(card.kind);
            const accent = meta?.accent || 'var(--naje-accent)';
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
                    className="w-[40vw] max-w-[10.75rem] overflow-hidden rounded-2xl border bg-[#12141c] p-2 sm:max-w-[12.5rem]"
                style={{ borderColor: isCenter ? accent : 'rgba(255,255,255,0.1)' }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
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
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    attachFileTo(card.id);
                  }}
                  className="relative mb-2 flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-black/35"
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
                </div>
                {isCenter && (
                  <div className="space-y-1.5">
                    <input
                      value={card.name || ''}
                      onChange={(e) => patch(card.id, { name: e.target.value })}
                      placeholder={card.kind === 'onscreen_text' ? 'النص الظاهر حرفياً' : primary ? (card.kind === 'product' ? 'اسم المنتج أو الخدمة' : 'اسم') : 'اسم أو ملاحظة'}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
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
                      <div data-no-drag className="rounded-xl border border-white/10 bg-black/30 p-2 touch-pan-y">
                        <label className="mb-1 block text-[10px] font-black text-[var(--naje-accent-2)]">
                          انتقال عند الثانية {card.appearAtSec ?? 0} / {duration}
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={Math.max(2, duration - 1)}
                          value={card.appearAtSec ?? Math.round(duration / 2)}
                          onChange={(e) => patch(card.id, { appearAtSec: Number(e.target.value) })}
                          className="w-full accent-[var(--naje-accent)]"
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
                                  ? 'border-[var(--naje-accent)] bg-[var(--naje-accent)]/15 text-[var(--naje-accent-2)]'
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
