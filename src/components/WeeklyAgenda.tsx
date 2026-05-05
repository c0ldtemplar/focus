import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { MapPin, Heart, ExternalLink } from 'lucide-react';
import { LocalEvent } from '../types';

interface Props {
  events: LocalEvent[];
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onEventClick: (event: LocalEvent) => void;
  isLoading: boolean;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function buildWeek(): { iso: string; dayName: string; dayNum: number; month: string }[] {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 86_400_000);
    days.push({
      iso: d.toISOString().split('T')[0],
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      month: MONTH_NAMES[d.getMonth()],
    });
  }
  return days;
}

function affinityColor(score?: number): string {
  if (!score) return 'text-zinc-600';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-indigo-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-zinc-500';
}

export const WeeklyAgenda: React.FC<Props> = React.memo(({ events, bookmarks, onToggleBookmark, onEventClick, isLoading }) => {
  const week = useMemo(() => buildWeek(), []);

  const byDay = useMemo(() => {
    const map: Record<string, LocalEvent[]> = {};
    for (const day of week) map[day.iso] = [];
    const later: LocalEvent[] = [];
    for (const e of events) {
      if (e.dateISO && map[e.dateISO]) {
        map[e.dateISO].push(e);
      } else if (!e.dateISO) {
        later.push(e);
      }
    }
    return { map, later };
  }, [events, week]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-h-[160px] animate-pulse" />
        ))}
      </div>
    );
  }

  const totalWithDate = week.reduce((sum, d) => sum + byDay.map[d.iso].length, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {week.map((day, i) => {
          const dayEvents = byDay.map[day.iso];
          const isToday = i === 0;
          return (
            <div
              key={day.iso}
              className={`flex flex-col rounded-2xl border p-3 min-h-[160px] transition-colors ${
                isToday
                  ? 'border-indigo-600/50 bg-indigo-950/20'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              {/* Day header */}
              <div className="mb-3 flex items-baseline gap-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>
                  {day.dayName}
                </span>
                <span className={`text-lg font-black tracking-tighter ${isToday ? 'text-white' : 'text-zinc-400'}`}>
                  {day.dayNum}
                </span>
                <span className="text-[9px] text-zinc-600 uppercase">{day.month}</span>
              </div>

              {/* Events */}
              <div className="flex-1 flex flex-col gap-2">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-zinc-700 italic mt-2">Sin eventos</p>
                ) : (
                  dayEvents.map((event, ei) => (
                    <motion.button
                      key={event.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ei * 0.05 }}
                      onClick={() => onEventClick(event)}
                      className="text-left w-full group"
                    >
                      <div className={`rounded-xl p-2 border transition-all hover:border-zinc-600 ${
                        event.isPriority ? 'border-indigo-600/30 bg-indigo-950/30' : 'border-zinc-800 bg-zinc-800/50'
                      }`}>
                        <p className="text-[11px] font-bold text-zinc-200 leading-tight line-clamp-2 group-hover:text-white transition-colors">
                          {event.title}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                            <MapPin size={8} /> {event.distance}km
                          </span>
                          {event.affinityScore !== undefined && (
                            <span className={`text-[9px] font-black ${affinityColor(event.affinityScore)}`}>
                              {event.affinityScore}%
                            </span>
                          )}
                        </div>
                        {event.weather && (
                          <span className="text-[9px] text-zinc-500 mt-0.5 block">
                            {event.weather.emoji} {event.weather.label}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Próximamente */}
      {byDay.later.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Próximamente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {byDay.later.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="text-left flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-300 truncate group-hover:text-white transition-colors">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-600">{event.category}</span>
                    {event.affinityScore !== undefined && (
                      <span className={`text-[10px] font-black ${affinityColor(event.affinityScore)}`}>
                        {event.affinityScore}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark(event.id); }}
                    className="p-1.5 hover:bg-zinc-700 rounded-full transition-colors"
                    aria-label={bookmarks.includes(event.id) ? 'Quitar bookmark' : 'Guardar evento'}
                  >
                    <Heart size={13} className={bookmarks.includes(event.id) ? 'fill-red-500 text-red-500' : 'text-zinc-500'} />
                  </button>
                  <ExternalLink size={13} className="text-zinc-600 mt-1.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {totalWithDate === 0 && byDay.later.length === 0 && (
        <div className="text-center py-16 text-zinc-600 italic text-sm">
          No hay eventos programados esta semana. Prueba ampliar el radio o agregar más intereses.
        </div>
      )}
    </div>
  );
});
