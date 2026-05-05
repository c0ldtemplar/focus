/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import {
  MapPin,
  Sparkles,
  RefreshCw,
  Info,
  Heart,
  Share,
  LogOut,
  CalendarDays,
  LayoutGrid,
  WifiOff,
} from 'lucide-react';
import { Interest, UserSettings, LocalEvent } from '../types';
import { INITIAL_INTERESTS } from '../constants';
import { curateLocalEvents } from '../services/eventService';
import { InterestPicker } from '../components/InterestPicker';
import { WeeklyAgenda } from '../components/WeeklyAgenda';
import { EventDetailModal } from '../components/EventDetailModal';
import { useAuth } from '../hooks/useAuth';

const MapOverlay = lazy(() =>
  import('../components/MapOverlay').then(m => ({ default: m.MapOverlay }))
);

type Tab = 'feed' | 'agenda';

function affinityColor(score?: number) {
  if (!score) return 'text-zinc-600';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-indigo-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-zinc-500';
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_SETTINGS: UserSettings = {
  radius: 3,
  location: [-33.4542, -70.5976],
  locationName: 'Plaza Ñuñoa, Santiago',
};

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`No se pudo guardar ${key}:`, err);
  }
}

const DashboardPage: React.FC = () => {
  const [interests, setInterests] = useState<Interest[]>(() => loadJSON('focus-interests', INITIAL_INTERESTS));
  const [settings, setSettings]   = useState<UserSettings>(() => loadJSON('focus-settings', DEFAULT_SETTINGS));
  const [events, setEvents]       = useState<LocalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [bookmarks, setBookmarks] = useState<string[]>(() => loadJSON('focus-bookmarks', []));
  const { logout } = useAuth();

  // Persist state
  useEffect(() => { saveJSON('focus-interests', interests); }, [interests]);
  useEffect(() => { saveJSON('focus-settings', settings); }, [settings]);
  useEffect(() => { saveJSON('focus-bookmarks', bookmarks); }, [bookmarks]);

  // Offline detection
  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    const active = interests.filter(i => i.active);
    if (active.length === 0) { setEvents([]); return; }

    setIsLoading(true);
    try {
      const curated = await curateLocalEvents(interests, settings);
      setEvents(curated);
      toast.success(`${curated.length} eventos encontrados`);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar eventos. Intenta de nuevo.');
      // Offline: show saved bookmarked events
      const saved = loadJSON<LocalEvent[]>('focus-bookmarked-events-data', []);
      if (saved.length > 0) {
        setEvents(saved);
        toast('Mostrando eventos guardados sin conexión.', { icon: '📴' });
      } else {
        setEvents([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [interests, settings]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchEvents(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchEvents]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleInterest = useCallback((id: string) => {
    setInterests(prev => prev.map(i => (i.id === id ? { ...i, active: !i.active } : i)));
  }, []);

  const toggleBookmark = useCallback((eventId: string) => {
    setBookmarks(prev => {
      const next = prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId];

      // Persist full event objects for offline access
      try {
        const allSaved = loadJSON<LocalEvent[]>('focus-bookmarked-events-data', []);
        const event = events.find(e => e.id === eventId);
        if (event && !prev.includes(eventId)) {
          localStorage.setItem('focus-bookmarked-events-data', JSON.stringify([...allSaved, event]));
        } else {
          localStorage.setItem('focus-bookmarked-events-data', JSON.stringify(allSaved.filter(e => e.id !== eventId)));
        }
      } catch (err) {
        console.warn('No se pudo actualizar la copia offline de favoritos:', err);
      }

      return next;
    });
  }, [events]);

  const shareEvent = useCallback(async (event: LocalEvent) => {
    const data = { title: event.title, text: event.description, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
        toast.success('Evento compartido!');
      } catch (err) {
        console.warn('El usuario canceló o falló el share nativo:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url}`);
        toast.success('Link copiado al portapapeles!');
      } catch { toast.error('No se pudo compartir'); }
    }
  }, []);

  const priorityEvent = useMemo(() => events.find(e => e.isPriority) || events[0], [events]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded z-50">
        Saltar al contenido
      </a>

      <div id="main-content" className="max-w-7xl mx-auto flex flex-col min-h-[90vh]">

        {/* Offline banner */}
        {isOffline && (
          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-bold px-4 py-2 rounded-full mb-4 self-start">
            <WifiOff size={13} />
            Sin conexión — mostrando eventos guardados
          </div>
        )}

        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              FOCO <span className="text-zinc-500 font-normal">/ Filtro Prioritario</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold tracking-tight uppercase text-zinc-400">{settings.locationName}</span>
            </div>
            <button
              onClick={fetchEvents}
              aria-label="Actualizar eventos"
              className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={logout}
              aria-label="Sign out"
              className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-full self-start mb-6">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'feed'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutGrid size={13} /> Feed
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'agenda'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CalendarDays size={13} /> Agenda
          </button>
        </div>

        {/* ── FEED TAB ── */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min md:h-[calc(100vh-16rem)]">

            {/* Priority Hero Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-1 md:col-span-7 row-span-1 md:row-span-4 bg-indigo-600 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-indigo-600/10 min-h-[400px]"
            >
              <div className="relative z-10">
                {isLoading ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white animate-pulse">Destacado para ti</span>
                    </div>
                    <div className="h-8 bg-indigo-600/20 rounded animate-pulse" />
                    <p className="h-4 bg-indigo-600/20 rounded w-3/4 animate-pulse mt-2" />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        {priorityEvent?.category || 'Destacado para ti'}
                      </span>
                      <span className="bg-indigo-500/30 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] text-indigo-200 flex items-center gap-2 border border-indigo-400/20">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                        Live Scout Active
                      </span>
                      {priorityEvent?.affinityScore !== undefined && (
                        <span className="bg-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-300 border border-emerald-500/20">
                          {priorityEvent.affinityScore}% match
                        </span>
                      )}
                      {priorityEvent?.weather && priorityEvent.isOutdoor && (
                        <span className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-indigo-200">
                          {priorityEvent.weather.emoji} {priorityEvent.weather.label}
                        </span>
                      )}
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-6 leading-[0.95] tracking-tighter">
                      {priorityEvent?.title || 'Buscando el foco...'}
                    </h2>
                    <p className="text-indigo-100 mt-6 max-w-md text-base md:text-lg leading-relaxed font-medium opacity-90">
                      {priorityEvent?.description || 'Personaliza tus intereses para que tu scout local encuentre lo que realmente te importa.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 relative z-10 pt-8">
                      <button
                        onClick={() => priorityEvent && setSelectedEvent(priorityEvent)}
                        className="bg-white text-indigo-600 px-8 py-3.5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-black/10"
                      >
                        Ver Detalle
                      </button>
                      <div className="flex items-center gap-2 text-indigo-100 text-sm font-bold uppercase tracking-wider">
                        <MapPin size={18} />
                        <span>A {priorityEvent?.distance ?? settings.radius}km de ti</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-400/20 rounded-full -mr-32 -mt-32 blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-[80px]" />
            </motion.div>

            {/* Range Control */}
            <div className="col-span-1 md:col-span-5 row-span-1 md:row-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Radio de Proximidad</h3>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-7xl font-black tracking-tighter">{settings.radius}km</span>
                  <span className="text-zinc-500 text-sm font-medium italic pb-3">
                    "{settings.radius <= 3 ? 'Cerca de casa' : 'Toda la ciudad'}"
                  </span>
                </div>
                <input
                  type="range" min="1" max="10" step="0.5"
                  value={settings.radius}
                  onChange={e => setSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) }))}
                  aria-label={`Radio de proximidad: ${settings.radius} km`}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  disabled={isLoading}
                />
              </div>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-4 flex items-center gap-2">
                <Info size={12} /> Bloqueando ruido fuera de este círculo.
              </p>
            </div>

            {/* Interests */}
            <div className="col-span-1 md:col-span-5 row-span-1 md:row-span-3 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 flex flex-col overflow-hidden">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Filtros de Atención</h3>
              <div className="overflow-y-auto pr-2 flex-1">
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border bg-zinc-800 border-zinc-700 mb-2 animate-pulse">
                      <div className="h-3 w-3 bg-indigo-600 rounded-full" />
                      <div className="h-3 w-24 bg-indigo-600/20 rounded" />
                    </div>
                  ))
                ) : (
                  <InterestPicker interests={interests} onToggle={toggleInterest} />
                )}
              </div>
            </div>

            {/* Secondary event cards */}
            <div className="col-span-1 md:col-span-7 row-span-1 md:row-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex items-center gap-5 animate-pulse">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-zinc-700 rounded mb-2" />
                      <div className="h-3 bg-zinc-700 rounded w-3/4" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {events.slice(1, 3).map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex items-center gap-5 hover:border-zinc-700 transition-colors relative text-left w-full group"
                    >
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 leading-none">
                        {event.category.includes('Gastronomía') ? '🍣'
                          : event.category.includes('Música') ? '🎸'
                          : event.category.includes('Tecnología') ? '💻'
                          : event.category.includes('Arte') ? '🎨' : '📍'}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="font-black text-zinc-100 truncate tracking-tight group-hover:text-white">{event.title}</h4>
                        <p className="text-zinc-500 text-xs line-clamp-1 mb-1">{event.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={10} /> {event.distance}km
                          </span>
                          {event.affinityScore !== undefined && (
                            <span className={`text-[10px] font-black ${affinityColor(event.affinityScore)}`}>
                              {event.affinityScore}%
                            </span>
                          )}
                          {event.weather && event.isOutdoor && (
                            <span className="text-[10px] text-zinc-500">{event.weather.emoji}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleBookmark(event.id)}
                          aria-label={bookmarks.includes(event.id) ? 'Quitar bookmark' : 'Guardar'}
                          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                        >
                          <Heart size={16} className={bookmarks.includes(event.id) ? 'fill-red-500 text-red-500' : 'text-zinc-500'} />
                        </button>
                        <button
                          onClick={() => shareEvent(event)}
                          aria-label="Compartir"
                          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                        >
                          <Share size={16} className="text-zinc-500" />
                        </button>
                      </div>
                    </button>
                  ))}
                  {events.length < 2 && (
                    <div className="md:col-span-2 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-[2rem] text-zinc-600 text-sm italic py-8">
                      Selecciona más intereses para llenar el radar
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Map */}
            <div className="col-span-1 md:col-span-5 row-span-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden group">
              <div className="h-full w-full pointer-events-none opacity-50 contrast-125 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                <Suspense fallback={<div className="h-full w-full bg-zinc-800 animate-pulse rounded-[2rem]" />}>
                  <MapOverlay center={settings.location} radius={settings.radius} events={events} />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* ── AGENDA TAB ── */}
        {activeTab === 'agenda' && (
          <WeeklyAgenda
            events={events}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            onEventClick={setSelectedEvent}
            isLoading={isLoading}
          />
        )}

        {/* Footer */}
        <footer className="mt-12 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-black border-t border-zinc-900 pt-8">
          <p>© 2026 FOCO • RED DE PROXIMIDAD REAL</p>
          <div className="flex gap-8">
            <p>SIN ALGORITMOS DE RELLENO</p>
            <p className="text-zinc-400">PRIORIDAD GEOGRÁFICA ACTIVA</p>
          </div>
        </footer>
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        interests={interests}
        locationName={settings.locationName}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        onShare={shareEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};

export default DashboardPage;
