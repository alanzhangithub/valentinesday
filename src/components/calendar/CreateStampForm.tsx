'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAMP_COLORS } from '@/types/calendar';
import StampPill from './StampPill';

// ── keyword → emoji mapping ──────────────────────────────────────────
const EMOJI_MAP: Record<string, string[]> = {
  movie:        ['🎬', '🍿', '🎥'],
  movies:       ['🎬', '🍿', '🎥'],
  film:         ['🎬', '🍿', '🎥'],
  cinema:       ['🎬', '🍿', '🎥'],
  gym:          ['💪', '🏋️', '🏃'],
  workout:      ['💪', '🏋️', '🏃'],
  exercise:     ['💪', '🏋️', '🏃'],
  lift:         ['💪', '🏋️', '🏃'],
  run:          ['🏃', '👟', '💪'],
  running:      ['🏃', '👟', '💪'],
  dinner:       ['🍽️', '🍕', '🍔'],
  restaurant:   ['🍽️', '🍕', '🍔'],
  food:         ['🍽️', '🍕', '🍔'],
  eat:          ['🍽️', '🍕', '🍜'],
  lunch:        ['🍽️', '🥗', '🍱'],
  breakfast:    ['🍳', '🥞', '🥐'],
  brunch:       ['🍳', '🥂', '🥞'],
  coffee:       ['☕', '🫖', '🧋'],
  cafe:         ['☕', '🫖', '🧋'],
  tea:          ['🫖', '☕', '🍵'],
  boba:         ['🧋', '☕', '🫖'],
  shopping:     ['🛍️', '🛒', '💳'],
  shop:         ['🛍️', '🛒', '💳'],
  mall:         ['🛍️', '🛒', '🏬'],
  hiking:       ['🥾', '🌲', '🏔️'],
  hike:         ['🥾', '🌲', '🏔️'],
  walk:         ['🚶', '🌲', '🐕'],
  nature:       ['🌲', '🌿', '🏔️'],
  beach:        ['🏖️', '🏊', '🌊'],
  pool:         ['🏊', '🏖️', '🌊'],
  swim:         ['🏊', '🏖️', '🌊'],
  swimming:     ['🏊', '🏖️', '🌊'],
  game:         ['🎮', '🕹️', '🎲'],
  games:        ['🎮', '🕹️', '🎲'],
  gaming:       ['🎮', '🕹️', '🎲'],
  music:        ['🎵', '🎶', '🎤'],
  concert:      ['🎤', '🎵', '🎶'],
  sing:         ['🎤', '🎵', '🎶'],
  karaoke:      ['🎤', '🎵', '🎶'],
  reading:      ['📚', '📖', '🤓'],
  read:         ['📚', '📖', '🤓'],
  book:         ['📚', '📖', '🤓'],
  cooking:      ['👨‍🍳', '🍳', '🧁'],
  cook:         ['👨‍🍳', '🍳', '🧁'],
  baking:       ['🧁', '🍰', '🍪'],
  bake:         ['🧁', '🍰', '🍪'],
  date:         ['💕', '❤️', '🌹'],
  romantic:     ['💕', '❤️', '🌹'],
  love:         ['💕', '❤️', '🌹'],
  anniversary:  ['💕', '🥂', '🌹'],
  valentine:    ['💕', '❤️', '🌹'],
  travel:       ['✈️', '🧳', '🗺️'],
  trip:         ['✈️', '🧳', '🗺️'],
  vacation:     ['✈️', '🧳', '🏝️'],
  flight:       ['✈️', '🛫', '🧳'],
  airport:      ['✈️', '🛫', '🧳'],
  pickleball:   ['🏓', '🎾', '💪'],
  tennis:       ['🎾', '🏓', '💪'],
  sport:        ['⚽', '🏀', '🏓'],
  sports:       ['⚽', '🏀', '🏓'],
  basketball:   ['🏀', '⚽', '🏓'],
  soccer:       ['⚽', '🏀', '🏓'],
  drinks:       ['🍷', '🍸', '🍺'],
  drink:        ['🍷', '🍸', '🍺'],
  bar:          ['🍸', '🍷', '🍺'],
  wine:         ['🍷', '🥂', '🍸'],
  beer:         ['🍺', '🍻', '🍷'],
  cocktail:     ['🍸', '🍹', '🍷'],
  sleep:        ['😴', '🛏️', '💤'],
  nap:          ['😴', '🛏️', '💤'],
  rest:         ['😴', '🛏️', '💤'],
  study:        ['📝', '💻', '📊'],
  work:         ['💻', '📝', '📊'],
  meeting:      ['💻', '📋', '🤝'],
  party:        ['🎉', '🥳', '🎊'],
  celebration:  ['🎉', '🥳', '🎊'],
  birthday:     ['🎂', '🎉', '🥳'],
  cleaning:     ['🧹', '🧽', '🪣'],
  clean:        ['🧹', '🧽', '🪣'],
  chores:       ['🧹', '🧽', '🪣'],
  laundry:      ['🧺', '👕', '🧹'],
  doctor:       ['🏥', '💊', '🩺'],
  health:       ['🏥', '💊', '🩺'],
  dentist:      ['🦷', '🏥', '🩺'],
  hospital:     ['🏥', '🩺', '💊'],
  pet:          ['🐕', '🐱', '🐾'],
  dog:          ['🐕', '🐾', '🦮'],
  cat:          ['🐱', '🐾', '😺'],
  church:       ['⛪', '🙏', '✝️'],
  pray:         ['🙏', '⛪', '✝️'],
  prayer:       ['🙏', '⛪', '✝️'],
  park:         ['🌳', '🏞️', '🧺'],
  picnic:       ['🧺', '🌳', '🏞️'],
  house:        ['🏠', '🏡', '🔑'],
  home:         ['🏠', '🏡', '🛋️'],
  move:         ['📦', '🏠', '🚚'],
  moving:       ['📦', '🏠', '🚚'],
  photo:        ['📸', '🤳', '📷'],
  photos:       ['📸', '🤳', '📷'],
  selfie:       ['🤳', '📸', '📷'],
  art:          ['🎨', '🖌️', '🖼️'],
  paint:        ['🎨', '🖌️', '🖼️'],
  draw:         ['✏️', '🎨', '🖌️'],
  craft:        ['🎨', '✂️', '🧶'],
  yoga:         ['🧘', '💪', '🙏'],
  meditation:   ['🧘', '🙏', '💆'],
  spa:          ['💆', '🧖', '🛁'],
  massage:      ['💆', '🧖', '🛁'],
  museum:       ['🏛️', '🖼️', '🎨'],
  zoo:          ['🦁', '🐘', '🦒'],
  garden:       ['🌻', '🌿', '🪴'],
  plant:        ['🪴', '🌱', '🌿'],
  bike:         ['🚴', '🚲', '🏃'],
  cycling:      ['🚴', '🚲', '🏃'],
  ski:          ['⛷️', '🏔️', '🎿'],
  skiing:       ['⛷️', '🏔️', '🎿'],
  snow:         ['❄️', '⛷️', '☃️'],
  rain:         ['🌧️', '☔', '🌂'],
  sunny:        ['☀️', '🌤️', '😎'],
  mto:          ['🏖️', '✈️', '😎'],
  bto:          ['🏖️', '✈️', '😎'],
  meedo:        ['🧸', '💕', '🌟'],
  beedo:        ['🎀', '💕', '🌟'],
  car:          ['🚗', '🚙', '🛣️'],
  drive:        ['🚗', '🚙', '🛣️'],
  road:         ['🛣️', '🚗', '🗺️'],
  night:        ['🌙', '✨', '🌃'],
  morning:      ['🌅', '☀️', '🌄'],
  sunset:       ['🌅', '🌇', '✨'],
  star:         ['⭐', '✨', '🌟'],
  ice:          ['🍦', '🧊', '❄️'],
  icecream:     ['🍦', '🍨', '🧁'],
  dessert:      ['🍰', '🧁', '🍦'],
  pizza:        ['🍕', '🧀', '🍽️'],
  sushi:        ['🍣', '🍱', '🥢'],
  ramen:        ['🍜', '🍲', '🥢'],
  nail:         ['💅', '✨', '🎨'],
  nails:        ['💅', '✨', '🎨'],
  hair:         ['💇', '✂️', '✨'],
  haircut:      ['💇', '✂️', '✨'],
};

// common fallback emojis when no keyword matches
const FALLBACK_EMOJIS = [
  '❤️', '⭐', '🎉', '💕', '✨', '🌟',
  '🎵', '📸', '🍽️', '☕', '🏠', '💪',
  '🎮', '📚', '🧸', '🎀', '🌈', '🔥',
  '🌙', '🍕', '🛍️', '🚗', '🏖️', '✈️',
];

function getSuggestedEmojis(query: string): string[] {
  if (!query.trim()) return [];

  const lower = query.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // collect matched emojis with a score for ordering
  const scored = new Map<string, number>();

  for (const word of words) {
    for (const [keyword, emojis] of Object.entries(EMOJI_MAP)) {
      // exact match → highest score
      if (keyword === word) {
        emojis.forEach((e, i) => {
          scored.set(e, (scored.get(e) ?? 0) + 10 - i);
        });
      // prefix / partial match
      } else if (keyword.startsWith(word) && word.length >= 2) {
        emojis.forEach((e, i) => {
          scored.set(e, (scored.get(e) ?? 0) + 5 - i);
        });
      // keyword starts with whole query (for multi-word)
      } else if (keyword.startsWith(lower) && lower.length >= 2) {
        emojis.forEach((e, i) => {
          scored.set(e, (scored.get(e) ?? 0) + 5 - i);
        });
      }
    }
  }

  if (scored.size === 0) return [];

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([emoji]) => emoji)
    .slice(0, 8);
}

interface CreateStampFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; emoji: string; color: string }) => Promise<void>;
}

export default function CreateStampForm({ isOpen, onClose, onSubmit }: CreateStampFormProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState<string>(STAMP_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tracks whether the current emoji value came from auto-fill vs manual input
  const isAutoFilledRef = useRef(true);

  const suggestions = useMemo(() => getSuggestedEmojis(name), [name]);
  const showFallback = suggestions.length === 0 && name.trim().length > 0;

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    // auto-fill emoji if the field is empty or was previously auto-filled
    const newSuggestions = getSuggestedEmojis(newName);
    if (newSuggestions.length > 0 && isAutoFilledRef.current) {
      setEmoji(newSuggestions[0]);
    } else if (newSuggestions.length === 0 && isAutoFilledRef.current) {
      setEmoji('');
    }
  }, []);

  const handleEmojiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmoji(e.target.value);
    // user typed/pasted manually → stop auto-filling
    isAutoFilledRef.current = false;
  }, []);

  const handleEmojiPick = useCallback((picked: string) => {
    setEmoji(picked);
    // user explicitly chose a suggestion → still count as "auto" so future
    // name changes keep updating if they clear it
    isAutoFilledRef.current = true;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emoji.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), emoji: emoji.trim(), color });
      setName('');
      setEmoji('');
      setColor(STAMP_COLORS[0].hex);
      isAutoFilledRef.current = true;
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to create stamp');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewStamp = {
    id: 'preview',
    name: name || 'stamp',
    emoji: emoji || '?',
    color,
    created_by: 'meedo' as const,
    created_at: '',
    updated_at: '',
    is_default: false,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm z-50"
          >
            <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">new stamp</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Preview */}
                <div className="flex items-center justify-center py-2">
                  <StampPill stamp={previewStamp} />
                </div>

                {/* Name — first */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. gym, movie night"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    maxLength={30}
                    required
                    autoFocus
                  />
                </div>

                {/* Emoji — second, with suggestions */}
                <div>
                  <label htmlFor="emoji" className="block text-sm font-medium text-gray-700 mb-1">
                    emoji
                  </label>
                  <input
                    type="text"
                    id="emoji"
                    value={emoji}
                    onChange={handleEmojiChange}
                    placeholder="auto-fills or paste one"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-xl text-center"
                    maxLength={4}
                    required
                  />

                  {/* Emoji suggestions row */}
                  {suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] text-gray-400 mb-1">suggestions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => handleEmojiPick(e)}
                            className={`w-9 h-9 flex items-center justify-center text-lg rounded-lg border transition-all ${
                              emoji === e
                                ? 'border-gray-900 bg-gray-100 scale-110 ring-1 ring-gray-900'
                                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback emoji grid when no keyword matches */}
                  {showFallback && (
                    <div className="mt-2">
                      <p className="text-[11px] text-gray-400 mb-1">popular</p>
                      <div className="flex flex-wrap gap-1.5">
                        {FALLBACK_EMOJIS.slice(0, 8).map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => handleEmojiPick(e)}
                            className={`w-9 h-9 flex items-center justify-center text-lg rounded-lg border transition-all ${
                              emoji === e
                                ? 'border-gray-900 bg-gray-100 scale-110 ring-1 ring-gray-900'
                                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">color</label>
                  <div className="flex flex-wrap gap-2">
                    {STAMP_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color === c.hex ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        aria-label={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !emoji.trim()}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'creating...' : 'create'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
