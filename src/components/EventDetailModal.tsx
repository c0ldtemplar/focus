import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Heart, Share, Navigation, Sparkles, CloudRain } from 'lucide-react';
import { LocalEvent, Interest } from '../types';
import { generateEventInsight } from '../services/geminiInsight';

interface Props {
  event: LocalEvent | null;
  interests: Interest[];
  locationName: string;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onShare: (event: LocalEvent) => void;
  onClose: () => void;
}

function affinityLabel(score?: number): { label: string; color: string; bg: string } {
  if (!score) return { label: '—', color: 'text-zinc-500', bg: 'bg-zinc-800' };
  if (score >= 80) return { label: `${score}% match`, color: 'text-emerald-400', bg: 'bg-emerald-950/40' };
  if (score >= 60) return { label: `${score}% match`, color: 'text-indigo-400', bg: 'bg-indigo-950/40' };
  if (score >= 40) return { label: `${score}% match`, color: 'text-amber-400', bg: 'bg-amber-950/40' };
  return { label: `${score}% match`, color: 'text-zinc-400', bg: 'bg-zinc-800' };
}

function mapsUrl(event: LocalEvent): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${event.location.lat},${event.location.lng}`;
}

export const EventDetailModal: React.FC<Props> = ({
  event,
  interests,
  locationName,
  bookmarks,
  onToggleBookmark,
  onShare,
  onClose,
}) => {
  const activeInterestKey = interests.filter(i => i.active).map(i => i.id).join(',');
  const insightKey = event ? `${event.id}-${activeInterestKey}` : '';
  const [generatedInsight, setGeneratedInsight] = useState<{ key: string; text: string } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap & close on Escape
  useEffect(() => {
    if (!event) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [event, onClose]);

  // Generate insight when event changes
  useEffect(() => {
    if (!event || event.whyRecommended) return;

    let active = true;
    generateEventInsight(event, interests, locationName)
      .then(text => {
        if (active) setGeneratedInsight({ key: insightKey, text });
      })
      .catch(() => {
        if (active) {
          setGeneratedInsight({
            key: insightKey,
            text: `A ${event.distance}km de tu ubicación en ${event.location.neighborhood}. Podría sorprenderte.`,
          });
        }
      });
    return () => { active = false; };
  }, [event, interests, locationName, insightKey]);

  const affinity = affinityLabel(event?.affinityScore);
  const isBookmarked = event ? bookmarks.includes(event.id) : false;
  const insight = event?.whyRecommended ?? (generatedInsight?.key === insightKey ? generatedInsight.text : null);
  const insightLoading = !!event && !event.whyRecommended && !insight;

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {/* Header strip */}
            <div className="bg-indigo-600 px-6 pt-6 pb-5 relative">
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Cerrar detalle"
                className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                {event.category}
              </span>
              <h2 id="modal-title" className="text-2xl font-black tracking-tighter leading-tight mt-1 text-white">
                {event.title}
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-zinc-300 text-sm leading-relaxed">{event.description}</p>

              {/* Meta row */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-xs bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full text-zinc-300">
                  <Calendar size={12} className="text-zinc-500" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1.5 text-xs bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full text-zinc-300">
                  <MapPin size={12} className="text-zinc-500" />
                  {event.location.neighborhood} · {event.distance}km
                </span>
                {event.affinityScore !== undefined && (
                  <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-black ${affinity.color} ${affinity.bg}`}>
                    {affinity.label}
                  </span>
                )}
              </div>

              {/* Weather (outdoor only) */}
              {event.isOutdoor && event.weather && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  event.weather.precipChance > 50
                    ? 'border-blue-800/50 bg-blue-950/20'
                    : 'border-zinc-800 bg-zinc-800/40'
                }`}>
                  <span className="text-2xl">{event.weather.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">{event.weather.label}</p>
                    <p className="text-[11px] text-zinc-500">
                      {event.weather.precipChance}% prob. precipitación
                      {event.weather.precipChance > 50 && ' — llevá paraguas'}
                    </p>
                  </div>
                  <CloudRain size={14} className="ml-auto text-zinc-600" />
                </div>
              )}

              {/* Gemini insight */}
              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    ¿Por qué este evento?
                  </span>
                </div>
                {insightLoading ? (
                  <div className="h-4 bg-zinc-700 rounded animate-pulse w-4/5" />
                ) : (
                  <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
                )}
              </div>

              {/* Affinity bar */}
              {event.affinityScore !== undefined && (
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-600 mb-1 font-bold uppercase tracking-wider">
                    <span>Afinidad</span><span>{event.affinityScore}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${event.affinityScore}%` }}
                      transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        event.affinityScore >= 80 ? 'bg-emerald-500' :
                        event.affinityScore >= 60 ? 'bg-indigo-500' :
                        event.affinityScore >= 40 ? 'bg-amber-500' : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="px-6 pb-6 flex gap-2">
              <a
                href={mapsUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 rounded-full transition-colors"
              >
                <Navigation size={15} />
                Cómo llegar
              </a>
              <button
                onClick={() => onToggleBookmark(event.id)}
                aria-label={isBookmarked ? 'Quitar de guardados' : 'Guardar evento'}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full transition-colors"
              >
                <Heart size={18} className={isBookmarked ? 'fill-red-500 text-red-500' : 'text-zinc-400'} />
              </button>
              <button
                onClick={() => onShare(event)}
                aria-label="Compartir evento"
                className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full transition-colors"
              >
                <Share size={18} className="text-zinc-400" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
