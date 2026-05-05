import { GoogleGenAI } from '@google/genai';
import { LocalEvent, Interest } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

function isConfigured(): boolean {
  const k = process.env.GEMINI_API_KEY;
  return !!(k && k.trim().length > 0 && k !== 'MY_GEMINI_API_KEY' && k !== 'MI_GEMINI_API_KEY');
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function ruleBasedInsight(event: LocalEvent, interests: Interest[]): string {
  const active = interests.filter(i => i.active);
  const cat = normalize(event.category);
  const matching = active.filter(i => {
    const n = normalize(i.name);
    return n.includes(cat) || cat.includes(n.split(' ')[0]);
  });
  if (matching.length > 0) {
    return `Coincide con tu interés en ${matching.map(i => i.name).join(' y ')}. A ${event.distance}km en ${event.location.neighborhood}.`;
  }
  return `A ${event.distance}km de tu ubicación en ${event.location.neighborhood}. Podría sorprenderte.`;
}

const insightCache = new Map<string, string>();

export async function generateEventInsight(
  event: LocalEvent,
  interests: Interest[],
  locationName: string,
): Promise<string> {
  const cacheKey = `${event.id}-${interests.filter(i => i.active).map(i => i.id).join(',')}`;
  if (insightCache.has(cacheKey)) return insightCache.get(cacheKey)!;

  if (!isConfigured()) return ruleBasedInsight(event, interests);

  const active = interests.filter(i => i.active).map(i => i.name);
  const prompt = `En máximo 25 palabras, explica por qué el evento "${event.title}" (${event.category}) en ${event.location.neighborhood} a ${event.distance}km es relevante para alguien interesado en: ${active.join(', ')}. Ciudad: ${locationName}. Sin comillas ni prefijos.`;

  try {
    const res = await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: prompt });
    const text = res.text?.trim() ?? ruleBasedInsight(event, interests);
    insightCache.set(cacheKey, text);
    return text;
  } catch {
    return ruleBasedInsight(event, interests);
  }
}
