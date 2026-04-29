import { GoogleGenAI } from "@google/genai";
import { LocalEvent, Interest, UserSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function curateLocalEvents(
  interests: string[],
  settings: UserSettings
): Promise<LocalEvent[]> {
  const prompt = `
    You are a "Hyper-Local Scout" service. Your mission is to find events and places that matches a user's strict criteria, ignoring generic paid advertisement noise.
    
    User Current Location: ${settings.locationName} (${settings.location[0]}, ${settings.location[1]})
    Proximity Radius: ${settings.radius}km
    User Interests: ${interests.join(", ")}
    
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    
    const text = response.text;
    if (!text) return [];

    // Basic cleaning of potential markdown
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini curation failed:", error);
    return [];
  }
}
