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
  LogOut
} from 'lucide-react';
import { Interest, UserSettings, LocalEvent } from '../types';
import { INITIAL_INTERESTS } from '../constants';
import { curateLocalEvents } from '../services/eventService';
import { InterestPicker } from '../components/InterestPicker';
import { useAuth } from '../contexts/AuthContext';

const MapOverlay = lazy(() => import('../components/MapOverlay').then(module => ({ default: module.MapOverlay })));

const DashboardPage: React.FC = () => {
  // Load interests from localStorage or use initial interests
  const loadInterests = (): Interest[] => {
    try {
      const saved = localStorage.getItem('focus-interests');
      return saved ? JSON.parse(saved) : INITIAL_INTERESTS;
    } catch {
      console.error('Failed to load interests from localStorage');
      return INITIAL_INTERESTS;
    }
  };

  // Load settings from localStorage or use default settings
  const loadSettings = (): UserSettings => {
    try {
      const saved = localStorage.getItem('focus-settings');
      return saved ? JSON.parse(saved) : {
        radius: 3,
        location: [-33.4542, -70.5976], // Plaza Ñuñoa
        locationName: 'Plaza Ñuñoa, Santiago'
      };
    } catch {
      console.error('Failed to load settings from localStorage');
      return {
        radius: 3,
        location: [-33.4542, -70.5976], // Plaza Ñuñoa
        locationName: 'Plaza Ñuñoa, Santiago'
      };
    }
  };

  const [interests, setInterests] = useState<Interest[]>(loadInterests);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('focus-bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      console.error('Failed to load bookmarks from localStorage');
      return [];
    }
  });

  const { logout } = useAuth();

  // Save interests to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('focus-interests', JSON.stringify(interests));
    } catch {
      console.error('Failed to save interests to localStorage');
    }
  }, [interests]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('focus-settings', JSON.stringify(settings));
    } catch {
      console.error('Failed to save settings to localStorage');
    }
  }, [settings]);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('focus-bookmarks', JSON.stringify(bookmarks));
    } catch {
      console.error('Failed to save bookmarks to localStorage');
    }
  }, [bookmarks]);

  const fetchEvents = useCallback(async () => {
    const activeInterests = interests.filter(i => i.active).map(i => i.name);
    if (activeInterests.length === 0) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    try {
      const curated = await curateLocalEvents(interests, settings);
      setEvents(curated);
      toast.success(`Found ${curated.length} local events!`);
    } catch (error: unknown) {
      console.error(error);
      toast.error('Failed to fetch events. Please try again.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [interests, settings]);

  // Fetch events on mount and when interests/settings change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [fetchEvents]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleInterest = useCallback((id: string) => {
    setInterests(prev => prev.map(i =>
      i.id === id ? { ...i, active: !i.active } : i
    ));
  }, []);

  const toggleBookmark = useCallback((eventId: string) => {
    setBookmarks(prev => prev.includes(eventId)
      ? prev.filter(id => id !== eventId)
      : [...prev, eventId]
    );
  }, []);

  const shareEvent = useCallback(async (event: LocalEvent) => {
    const shareData = {
      title: event.title,
      text: event.description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Event shared!');
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to share event');
      }
    }
  }, []);

  const priorityEvent = useMemo(() => events.find(e => e.isPriority) || events[0], [events]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded z-50"
      >
        Skip to main content
      </a>
      <div id="main-content" className="max-w-7xl mx-auto flex flex-col h-full min-h-[90vh]">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              FOCO <span className="text-zinc-500 font-normal">/ Filtro Prioritario</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-3" aria-label={`Current location: ${settings.locationName}`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-xs font-bold tracking-tight uppercase text-zinc-400">{settings.locationName}</span>
            </div>
            <button
              onClick={() => fetchEvents()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fetchEvents();
                }
              }}
              tabIndex={0}
              aria-label="Refresh events"
              className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
            <button
              onClick={logout}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  logout();
                }
              }}
              tabIndex={0}
              aria-label="Sign out"
              className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Major Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min md:h-[calc(100vh-12rem)]">

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
                    <span className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white animate-pulse">
                      Destacado para ti
                    </span>
                    <span className="bg-indigo-500/30 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] text-indigo-200 flex items-center gap-2 border border-indigo-400/20 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                      Live Scout Active
                    </span>
                  </div>
                  <div className="h-8 bg-indigo-600/20 rounded animate-pulse" />
                  <p className="h-4 bg-indigo-600/20 rounded w-3/4 animate-pulse mt-2" />
                  <div className="flex flex-wrap items-center gap-6 pt-8">
                    <div className="h-8 bg-indigo-600/20 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-indigo-600/20 rounded w-1/3 animate-pulse ml-2 mt-2" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      {priorityEvent?.category || 'Destacado para ti'}
                    </span>
                    <span className="bg-indigo-500/30 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] text-indigo-200 flex items-center gap-2 border border-indigo-400/20">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                      Live Scout Active
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-6 leading-[0.95] tracking-tighter">
                    {priorityEvent?.title || 'Buscando el foco...'}
                  </h2>
                  <p className="text-indigo-100 mt-6 max-w-md text-base md:text-lg leading-relaxed font-medium opacity-90">
                    {priorityEvent?.description || 'Personaliza tus intereses para que tu scout local encuentre lo que realmente te importa.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-6 relative z-10 pt-8">
                    <button className="bg-white text-indigo-600 px-8 py-3.5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-black/10">
                      Ir al Evento
                    </button>
                    <div className="flex items-center gap-2 text-indigo-100 text-sm font-bold uppercase tracking-wider">
                      <MapPin size={18} />
                      <span>A {priorityEvent?.distance || settings.radius}km de ti</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Abstract background shapes */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-400/20 rounded-full -mr-32 -mt-32 blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-[80px]" />
          </motion.div>

          {/* Range Control Card */}
          <div className="col-span-1 md:col-span-5 row-span-1 md:row-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors">
            <div>
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Radio de Proximidad</h3>
              <div className="flex justify-between items-end mb-4">
                {isLoading ? (
                  <>
                    <span className="h-8 w-10 bg-indigo-600/20 rounded animate-pulse" />
                    <span className="text-zinc-500 text-sm font-medium italic pb-3 animate-pulse">
                      "Cargando..."
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-7xl font-black tracking-tighter">{settings.radius}km</span>
                    <span className="text-zinc-500 text-sm font-medium italic pb-3">"{settings.radius <= 3 ? 'Cerca de casa' : 'Toda la ciudad'}"</span>
                  </>
                )}
              </div>
              <div className="relative mt-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={settings.radius}
                  onChange={(e) => setSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) }))}
                  aria-label={`Proximity radius: ${settings.radius} kilometers`}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  disabled={isLoading}
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-4 flex items-center gap-2">
              <Info size={12} />
              Bloqueando ruido fuera de este círculo.
            </p>
          </div>

          {/* Interests Cloud Card */}
          <div className="col-span-1 md:col-span-5 row-span-1 md:row-span-3 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 flex flex-col h-full overflow-hidden">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Filtros de Atención</h3>
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
              {isLoading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600 shadow-sm"
                      style={{ opacity: 0.7 }}
                    >
                      <div className="h-3 w-3 bg-indigo-600 rounded-full animate-pulse" />
                      <span className="h-3 w-24 bg-indigo-600/20 rounded animate-pulse" />
                    </div>
                  ))}
                </>
              ) : (
                <InterestPicker interests={interests} onToggle={toggleInterest} />
              )}
            </div>
          </div>

          {/* Secondary Events / Feed Items (Spanning the bottom) */}
          <div className="col-span-1 md:col-span-7 row-span-1 md:row-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex items-center gap-5 animate-pulse">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl animate-pulse shrink-0" />
                    <div className="overflow-hidden flex-1">
                      <div className="h-4 bg-zinc-700 rounded animate-pulse mb-2" />
                      <div className="h-3 bg-zinc-700 rounded animate-pulse w-3/4 mb-2" />
                      <div className="h-3 bg-indigo-600/20 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {events.slice(1, 3).map((event) => (
                  <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex items-center gap-5 hover:border-zinc-700 transition-colors relative">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 leading-none">
                      {event.category.includes('Gastronomía') ? '🍣' : event.category.includes('Música') ? '🎸' : '📍'}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-black text-zinc-100 truncate tracking-tight">{event.title}</h4>
                      <p className="text-zinc-500 text-xs line-clamp-1 mb-1">{event.description}</p>
                      <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-1">
                        <MapPin size={10} /> {event.distance}km
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleBookmark(event.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleBookmark(event.id);
                          }
                        }}
                        tabIndex={0}
                        aria-label={bookmarks.includes(event.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        <Heart
                          size={16}
                          className={bookmarks.includes(event.id) ? 'fill-red-500 text-red-500' : 'text-zinc-500'}
                        />
                      </button>
                      <button
                        onClick={() => shareEvent(event)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            shareEvent(event);
                          }
                        }}
                        tabIndex={0}
                        aria-label="Share event"
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        <Share size={16} className="text-zinc-500" />
                      </button>
                    </div>
                  </div>
                ))}
                {events.length < 2 && (
                  <div className="md:col-span-2 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-[2rem] text-zinc-600 text-sm italic py-8">
                    Selecciona más intereses para llenar el radar
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map / Visualization (replacing the empty space) */}
          <div className="col-span-1 md:col-span-5 row-span-1 md:row-span-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden group">
            <div className="h-full w-full pointer-events-none opacity-50 contrast-125 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
              <Suspense fallback={<div className="h-full w-full bg-zinc-800 animate-pulse rounded-[2rem]" />}>
                <MapOverlay center={settings.location} radius={settings.radius} events={events} />
              </Suspense>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-12 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-black border-t border-zinc-900 pt-8">
          <p>© 2026 FOCO • RED DE PROXIMIDAD REAL</p>
          <div className="flex gap-8">
            <p>SIN ALGORITMOS DE RELLENO</p>
            <p className="text-zinc-400">PRIORIDAD GEOGRÁFICA ACTIVA</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
