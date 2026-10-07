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
import { useI18n } from '../../i18n';

type DeckItem = { type: 'add'; id: '__add__' } | { type: 'card'; id: string; card: SceneBoardCard };

const GROUP_KEYS = ['adui.group.base', 'adui.group.timed', 'adui.group.identity', 'adui.group.story', 'adui.group.world'];

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
  const { t } = useI18n();
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
    <div className="space-y-2.5 text-start">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white sm:text-base">{t('adui.boardTitle')}</h2>
          <p className="text-[10px] leading-snug text-white/45 sm:text-[11px]">
            {t('adui.boardHint')}
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

      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0c0e14] px-1 py-3 sm:rounded-3xl sm:px-2 sm:py-4">
        <CircularCardCarousel<DeckItem>
          items={items}
          getKey={(c) => c.id}
          isSelected={(c) => c.type === 'card' && Boolean(c.card.preview || c.card.avatarId || c.card.locationId || c.card.name)}
          onSelect={() => {}}
          centerIndex={centerIndex}
          onCenterIndexChange={setCenterIndex}
          onUserSwipe={() => setHint(false)}
          showHand={false}
          handLabel={t('adui.swipeBoard')}
          frameClassName="h-[340px] sm:h-[385px]"
          renderCard={(item, isCenter) => {
            if (item.type === 'add') {
              return (
                <div
                  className="w-[78vw] max-w-[17.5rem] overflow-hidden rounded-2xl border-2 border-[var(--naje-accent)]/65 bg-gradient-to-b from-[#261810] via-[#161210] to-[#0c0a09] p-3 shadow-[0_20px_50px_-20px_rgba(212,165,116,0.45)] sm:max-w-[18.5rem]"
                >
                  <div className="mb-2.5 flex items-center justify-center gap-2 rounded-xl bg-black/45 border border-white/10 py-1.5 px-3">
                    <span className="h-1 w-6 rounded-full bg-[var(--naje-accent)]" />
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--naje-accent-2)]">
                      <Plus className="h-3.5 w-3.5" /> {t('adui.addSwipe')}
                    </span>
                    <span className="h-1 w-6 rounded-full bg-[var(--naje-accent)]" />
                  </div>
                  {isCenter ? (
                    <div data-no-drag className="max-h-[250px] sm:max-h-[285px] space-y-3 overflow-y-auto overscroll-contain touch-pan-y pe-1 scrollbar-thin">
                      {SCENE_ADD_GROUPS.map((group, gi) => (
                        <div key={group.title}>
                          <p className="mb-1.5 text-[10.5px] font-extrabold tracking-wide text-amber-200/90">{t(GROUP_KEYS[gi] || group.title)}</p>
                          <div className="grid grid-cols-2 gap-1.5">
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
                                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/55 px-2.5 py-2 text-start hover:border-[var(--naje-accent)] hover:bg-black/80 transition-all active:scale-[0.97]"
                                >
                                  <span className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]" style={{ background: opt.accent, color: opt.accent }} />
                                  <span className="min-w-0 text-[11px] font-bold text-slate-100 leading-snug break-words">
                                    {t(`adui.kind.${id}`)}
                                  </span>
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
                      <span className="text-[11px] font-bold">{t('adui.addItem')}</span>
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
                ? t('adui.uploadProduct')
                : card.kind === 'character' || card.kind === 'character_extra'
                ? t('adui.uploadCharacter')
                : card.kind === 'location' || card.kind === 'location_extra'
                ? t('adui.uploadLocation')
                : t('adui.uploadRef');

            return (
              <div
                className="w-[64vw] max-w-[14.5rem] overflow-hidden rounded-2xl border bg-[#12141c] p-2.5 sm:max-w-[15.5rem]"
                style={{ borderColor: isCenter ? accent : 'rgba(255,255,255,0.1)' }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black" style={{ color: accent }}>
                    {t(`adui.kind.${card.kind}`)}
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
                      placeholder={card.kind === 'onscreen_text' ? t('adui.literalText') : primary ? (card.kind === 'product' ? t('adui.productName') : t('adui.nameOnly')) : t('adui.nameNote')}
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
                        {t('adui.useLibraryTalent')}
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
                        {t('adui.useLibraryPlace')}
                      </button>
                    )}
                    {timed && (
                      <div data-no-drag className="rounded-xl border border-white/10 bg-black/30 p-2 touch-pan-y">
                        <label className="mb-1 block text-[10px] font-black text-[var(--naje-accent-2)]">
                          {t('adui.transitionAt', { sec: card.appearAtSec ?? 0, duration })}
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
                              {t(`adui.tr.${tr.id}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!isCenter && (
                  <p className="truncate text-[11px] font-bold text-white">
                    {card.name || t(`adui.kind.${card.kind}`)}
                    {timed && card.appearAtSec ? ` · ${t('adui.secMark', { sec: card.appearAtSec })}` : ''}
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
