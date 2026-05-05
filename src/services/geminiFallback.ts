import { GoogleGenAI } from "@google/genai";
import { LocalEvent, Interest, UserSettings } from "../types";

// Cache for Gemini fallback results
interface CacheEntry {
  data: LocalEvent[];
  timestamp: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000;
const cache: Map<string, CacheEntry> = new Map();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const isGeminiConfigured = (): boolean => {
  const apiKey = process.env.GEMINI_API_KEY;
  return !!(apiKey && apiKey.trim().length > 0 && apiKey !== "MY_GEMINI_API_KEY");
};

function generateCacheKey(interests: Interest[], settings: UserSettings): string {
  const activeInterests = interests
    .filter((i) => i.active)
    .map((i) => i.name)
    .sort()
    .join(",");
  return `${settings.locationName}-${settings.radius}-${activeInterests}`;
}

export async function curateLocalEvents(
  interests: Interest[],
  settings: UserSettings
): Promise<LocalEvent[]> {
  if (!isGeminiConfigured()) {
    console.info("Gemini API not configured - returning empty events list");
    return [];
  }

  const activeInterests = interests.filter((i) => i.active);
  if (activeInterests.length === 0) return [];

  const cacheKey = generateCacheKey(activeInterests, settings);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  const todayISO = new Date().toISOString().split('T')[0];

  const prompt = `
    You are a "Hyper-Local Scout". Generate 3-5 realistic local events occurring in the next 7 days near ${settings.locationName}.

    Interests: ${activeInterests.map((i) => i.name).join(", ")}
    Radius: ${settings.radius} km
    Today: ${todayISO}

    Return JSON array:
    [
      {
        "id": "unique-string",
        "title": "string",
        "description": "string",
        "category": "string (match one of the user interests)",
        "date": "string (human readable in Spanish, e.g. 'viernes 9 de mayo, 19:00')",
        "dateISO": "YYYY-MM-DD (ISO date of the event, within next 7 days from today)",
        "isOutdoor": boolean,
        "location": {
          "lat": number,
          "lng": number,
          "address": "string",
          "neighborhood": "string"
        },
        "distance": number (0-${settings.radius}),
        "source": "gemini",
        "isPriority": boolean,
        "whyRecommended": "1 sentence in Spanish explaining why this matches the user's interests"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];

    const jsonStr = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    const events = (Array.isArray(parsed) ? parsed : [parsed]).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => ({
        id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: String(item.title),
        description: String(item.description),
        category: String(item.category),
        date: String(item.date),
        dateISO: item.dateISO ? String(item.dateISO) : undefined,
        isOutdoor: Boolean(item.isOutdoor),
        location: {
          lat: Number(item.location.lat),
          lng: Number(item.location.lng),
          address: String(item.location.address),
          neighborhood: String(item.location.neighborhood),
        },
        distance: Number(item.distance),
        source: "gemini" as const,
        isPriority: Boolean(item.isPriority),
        whyRecommended: item.whyRecommended ? String(item.whyRecommended) : undefined,
      })
    );

    cache.set(cacheKey, { data: events, timestamp: Date.now() });
    return events;
  } catch (error) {
    console.error("Gemini API error:", error);
    return [];
  }
}
