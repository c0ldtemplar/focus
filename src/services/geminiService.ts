import { GoogleGenAI } from "@google/genai";
import { LocalEvent, Interest, UserSettings } from "../types";

// Cache for storing recent results to avoid duplicate API calls
interface CacheEntry {
  data: LocalEvent[];
  timestamp: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const cache: Map<string, CacheEntry> = new Map();

// Track ongoing requests to prevent duplicates
const ongoingRequests: Map<string, Promise<LocalEvent[]>> = new Map();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Generate a cache key based on interests and settings
 */
const generateCacheKey = (interests: Interest[], settings: UserSettings): string => {
  const activeInterests = interests.filter((i: Interest) => i.active).map((i: Interest) => i.name).sort().join(",");
  return `${settings.locationName}-${settings.radius}-${activeInterests}`;
};

/**
 * Validate that the response from Gemini matches our expected structure
 */
const validateEventData = (data: any): LocalEvent[] => {
  if (!Array.isArray(data)) {
    throw new Error("Expected array of events");
  }

  return data.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`Event at index ${index} is not an object`);
    }

    // Validate required fields
    const requiredFields = [
      "id", "title", "description", "category", "date", 
      "location", "distance", "source", "isPriority"
    ];

    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new Error(`Missing required field '${field}' in event at index ${index}`);
      }
    }

    // Validate location object
    const location = item.location;
    const locationFields = ["lat", "lng", "address", "neighborhood"];
    for (const field of locationFields) {
      if (!(field in location)) {
        throw new Error(`Missing required location field '${field}' in event at index ${index}`);
      }
    }

    // Ensure distance is a number and within reasonable bounds
    if (typeof item.distance !== "number" || item.distance < 0) {
      throw new Error(`Invalid distance in event at index ${index}`);
    }

    // Ensure isPriority is a boolean
    if (typeof item.isPriority !== "boolean") {
      throw new Error(`Invalid isPriority in event at index ${index}`);
    }

    return {
      id: String(item.id),
      title: String(item.title),
      description: String(item.description),
      category: String(item.category),
      date: String(item.date),
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
        address: String(location.address),
        neighborhood: String(location.neighborhood)
      },
      distance: Number(item.distance),
      source: item.source as LocalEvent["source"],
      isPriority: Boolean(item.isPriority),
      // Optional imageUrl
      imageUrl: item.imageUrl ? String(item.imageUrl) : undefined
    };
  });
};

/**
 * Curate local events with improved error handling, caching, and deduplication
 */
export async function curateLocalEvents(
  interests: Interest[],
  settings: UserSettings
): Promise<LocalEvent[]> {
  // Generate cache key
  const cacheKey = generateCacheKey(interests, settings);
  
  // Check if we have a valid cached result
  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_DURATION_MS) {
    return cachedEntry.data;
  }

  // Check if we already have an ongoing request for this key
  const ongoingRequest = ongoingRequests.get(cacheKey);
  if (ongoingRequest) {
    return ongoingRequest;
  }

  // Create a new request promise
  const requestPromise = (async () => {
    // Exponential backoff settings
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const activeInterests = interests.filter(i => i.active).map(i => i.name);
        if (activeInterests.length === 0) {
          return [];
        }

        const prompt = `
          You are a "Hyper-Local Scout" service. Your mission is to find events and places that matches a user's strict criteria, ignoring generic paid advertisement noise.
          
          User Current Location: ${settings.locationName} (${settings.location[0]}, ${settings.location[1]})
          Proximity Radius: ${settings.radius}km
          User Interests: ${activeInterests.join(", ")}
          
          Generate 4-6 highly specific events or "hidden gems" occurring in the next 7 days or permanent spots that are particularly active now.
          Focus on small businesses, community centers, or specific niche events (like a Korean food fair in Patronato, a punk rock gig in a basement, a recycling workshop in a park).
          
          Return a JSON array of objects with this shape:
          {
            "id": "string",
            "title": "string",
            "description": "string",
            "category": "string",
            "date": "string (human readable)",
            "location": {
              "lat": number (close to user but varied),
              "lng": number (close to user but varied),
              "address": "string",
              "neighborhood": "string"
            },
            "distance": number (max ${settings.radius}),
            "source": "scout",
            "isPriority": boolean (true if matches multiple interests)
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
          }
        });
        
        const text = response.text;
        if (!text) {
          throw new Error("Empty response from Gemini API");
        }

        // Basic cleaning of potential markdown
        const jsonStr = text.replace(/```json|```/g, "").trim();
        const parsedData = JSON.parse(jsonStr);
        
        // Validate the response data
        const validatedData = validateEventData(parsedData);
        
        // Cache the successful result
        cache.set(cacheKey, {
          data: validatedData,
          timestamp: Date.now()
        });
        
        return validatedData;
      } catch (error: any) {
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          console.error(`Gemini curation failed after ${maxRetries + 1} attempts:`, error);
          
          // Return a user-friendly error instead of empty array when possible
          // In a real app, we might want to show a toast or notification
          throw new Error(`Failed to fetch events after ${maxRetries + 1} attempts: ${error.message}`);
        }
        
        // Otherwise, wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached, but just in case
    throw new Error("Unexpected error in curateLocalEvents");
  })();

  // Store the ongoing request
  ongoingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Remove the ongoing request when it completes (either successfully or with error)
    ongoingRequests.delete(cacheKey);
  }
}