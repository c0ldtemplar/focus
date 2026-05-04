/**
 * Focus AI Studio - Event Aggregator Service
 * 
 * Integra múltiples fuentes de eventos públicos:
 * - SeatGeek API (eventos reales: conciertos, deportes, teatro)
 * - Gemini AI (fallback inteligente)
 */

import { LocalEvent, Interest, UserSettings } from "../types";
import { curateLocalEvents as fetchGeminiEvents } from "./geminiFallback";

// ============== API Configuration ==============

interface EventSourceConfig {
  enabled: boolean;
  priority: number;
}

const SOURCES: Record<string, EventSourceConfig> = {
  seatgeek: {
    enabled: !!process.env.SEATGEEK_CLIENT_ID,
    priority: 1,
  },
  gemini: {
    enabled: !!process.env.GEMINI_API_KEY,
    priority: 5,
  },
};

// SeatGeek API configuration
const SEATGEEK_BASE_URL = "https://api.seatgeek.com/2";
const SEATGEEK_CLIENT_ID = process.env.SEATGEEK_CLIENT_ID || "";

// ============== Cache ==============

interface CacheEntry {
  data: LocalEvent[];
  timestamp: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000;
const cache: Map<string, CacheEntry> = new Map();

function generateCacheKey(interests: Interest[], settings: UserSettings): string {
  const activeInterests = interests
    .filter((i) => i.active)
    .map((i) => i.name)
    .sort()
    .join(",");
  return `${settings.locationName}-${settings.radius}-${activeInterests}`;
}

// ============== SeatGeek API ==============

interface SeatGeekEvent {
  id: number;
  title: string;
  datetime_utc: string;
  venue: {
    name: string;
    location: {
      lat: number;
      lon: number;
      address: string;
      city: string;
    };
  };
  performers: { name: string }[];
  type: string;
  score?: number;
}

interface SeatGeekResponse {
  events: SeatGeekEvent[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

async function fetchSeatGeekEvents(
  interests: string[],
  settings: UserSettings
): Promise<LocalEvent[]> {
  if (!SOURCES.seatgeek.enabled) {
    return [];
  }

  // Mapear intereses a tipos de SeatGeek
  const eventTypeMap: Record<string, string[]> = {
    "Gastronomía": ["food", "festival"],
    "Música": ["concert", "music", "festival"],
    "Arte": ["art", "theater", "performance"],
    "Deportes": ["sports"],
    "Tecnología": ["conference", "tech"],
    "Cine": ["film"],
    "Teatro": ["theater", "performance"],
    "Literatura": ["reading", "talk"],
    "Baile": ["dance", "performance"],
    "Fotografía": ["art", "exhibition"],
    "Naturaleza": ["outdoor", "festival"],
  };

  const typesSet = new Set<string>();
  interests.forEach((interest) => {
    if (eventTypeMap[interest]) {
      eventTypeMap[interest].forEach((t) => typesSet.add(t));
    }
  });
  const types = Array.from(typesSet);

  // Bounding box desde ubicación y radio (aproximación)
  const [lat, lon] = settings.location;
  const radiusDeg = settings.radius / 111; // 1° ≈ 111 km

  const params = new URLSearchParams({
    client_id: SEATGEEK_CLIENT_ID,
    per_page: "25",
    'datetime_local.gte': new Date().toISOString().split("T")[0],
    lat: lat.toString(),
    lon: lon.toString(),
    radius: `${radiusDeg.toFixed(4)}`,
  });

  if (types.length > 0) {
    params.set("taxonomies.id", types.join(","));
  }

  try {
    const response = await fetch(`${SEATGEEK_BASE_URL}/events?${params}`);

    if (!response.ok) {
      throw new Error(`SeatGeek API error: ${response.status}`);
    }

    const data: SeatGeekResponse = await response.json();

    return data.events.map((event) => {
      const distance = haversineDistance(
        settings.location[0],
        settings.location[1],
        event.venue.location.lat,
        event.venue.location.lon
      );

      return {
        id: `seatgeek-${event.id}`,
        title: event.title,
        description: event.performers.map((p) => p.name).join(", "),
        category: mapSeatGeekTypeToCategory(event.type, event.performers),
        date: formatDate(event.datetime_utc),
        location: {
          lat: event.venue.location.lat,
          lng: event.venue.location.lon,
          address: event.venue.location.address,
          neighborhood: event.venue.location.city,
        },
        distance: Math.round(distance * 10) / 10,
        source: "seatgeek" as const,
        isPriority: event.score ? event.score > 50 : false,
        imageUrl: `https://images.seatgeek.com/images/${event.id}/gp500.jpg`,
      };
    });
  } catch (error) {
    console.error("Error fetching SeatGeek events:", error);
    return [];
  }
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function mapSeatGeekTypeToCategory(
  type: string,
  performers: { name: string }[]
): string {
  const lowerType = type.toLowerCase();
  const performerNames = performers.map((p) => p.name).join(" ").toLowerCase();

  if (lowerType.includes("music") || performerNames.match(/band|artist|singer/)) {
    return "Música";
  }
  if (lowerType.includes("theater") || lowerType.includes("performance")) {
    return "Teatro";
  }
  if (lowerType.includes("art") || lowerType.includes("exhibition")) {
    return "Arte";
  }
  if (lowerType.includes("food") || lowerType.includes("festival")) {
    return "Gastronomía";
  }
  if (lowerType.includes("sports")) {
    return "Deportes";
  }
  if (lowerType.includes("film") || lowerType.includes("movie")) {
    return "Cine";
  }
  if (performerNames.includes("chef") || performerNames.includes("food")) {
    return "Gastronomía";
  }
  return "Eventos";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============== Main Aggregator ==============

/**
 * Fetch events from all configured sources
 * Combines SeatGeek + Gemini AI
 * Cache: 5 minutes
 */
export async function curateLocalEvents(
  interests: Interest[],
  settings: UserSettings
): Promise<LocalEvent[]> {
  const activeInterests = interests.filter((i) => i.active);
  if (activeInterests.length === 0) return [];

  const cacheKey = generateCacheKey(activeInterests, settings);

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  // Fetch from all sources in parallel
  const promises: Promise<LocalEvent[]>[] = [];

  // SeatGeek (si está configurado)
  if (SOURCES.seatgeek.enabled) {
    promises.push(fetchSeatGeekEvents(activeInterests.map((i) => i.name), settings));
  }

  // Gemini AI (si está configurado) - Always include as fallback
  if (SOURCES.gemini.enabled) {
    promises.push(fetchGeminiEvents(activeInterests, settings));
  }

  // Wait for all sources
  const results = await Promise.allSettled(promises);
  const allEvents: LocalEvent[] = [];

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      allEvents.push(...result.value);
    } else {
      console.warn("Source failed:", result.reason);
    }
  });

  // Sort by distance and priority
  allEvents.sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return a.distance - b.distance;
  });

  // Remove duplicates (same event from different sources)
  const uniqueEvents = allEvents.filter(
    (event, index, self) =>
      index === self.findIndex((e) => e.id === event.id)
  );

  // Limit to 6 events
  const limited = uniqueEvents.slice(0, 6);

  // Cache result
  cache.set(cacheKey, {
    data: limited,
    timestamp: Date.now(),
  });

  return limited;
}
