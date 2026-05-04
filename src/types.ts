/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocalEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    neighborhood: string;
  };
  distance: number; // in km
  source: 'scout' | 'community' | 'official' | 'seatgeek' | 'gemini';
  imageUrl?: string;
  isPriority: boolean;
}

export interface Interest {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface UserSettings {
  radius: number; // 1 to 10 km
  location: [number, number]; // default to Ñuñoa for this demo
  locationName: string;
}
