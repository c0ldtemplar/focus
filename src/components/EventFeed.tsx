import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Sparkles, SlidersHorizontal } from 'lucide-react';
import { LocalEvent } from '../types';

interface Props {
  events: LocalEvent[];
  isLoading: boolean;
}

export const EventFeed: React.FC<Props> = ({ events, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
        <Sparkles size={40} className="mx-auto text-zinc-300 mb-4" />
        <h3 className="text-zinc-900 font-medium text-lg">No hay nada relevante ahora</h3>
        <p className="text-zinc-500 max-w-xs mx-auto mt-2">
          Intenta ampliar el radio o seleccionar más intereses para romper el silencio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pb-10">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`group bg-zinc-900 p-6 rounded-[2rem] border transition-all duration-300 hover:border-zinc-700 relative overflow-hidden ${
            event.isPriority ? 'border-indigo-600/50 bg-gradient-to-br from-zinc-900 to-indigo-950/20' : 'border-zinc-800'
          }`}
        >
          {event.isPriority && (
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-bl-xl font-bold">
              Prioridad
            </div>
          )}

          <div className="flex justify-between items-start gap-4 text-left">
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-2 block">
                {event.category}
              </span>
              <h3 className="text-xl font-bold text-zinc-100 mb-2 leading-tight">
                {event.title}
              </h3>
              <p className="text-zinc-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                {event.description}
              </p>
              
              <div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-500">
                <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">
                  <Calendar size={14} className="text-zinc-500" />
                  {event.date}
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">
                  <MapPin size={14} className="text-zinc-500" />
                  {event.location.neighborhood} ({event.distance}km)
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
