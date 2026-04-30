import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { LocalEvent } from '../types';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for leaflet default icons in react
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  center: [number, number];
  radius: number;
  events: LocalEvent[];
}

export const MapOverlay: React.FC<Props> = ({ center, radius, events }) => {
  return (
    <div 
      className="h-full w-full rounded-[2rem] overflow-hidden border border-zinc-800 shadow-inner"
      role="region"
      aria-label="Map showing local events"
      tabIndex={0}
    >
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        // Disable default keyboard handling to prevent conflicts
        keyboard={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle 
          center={center} 
          radius={radius * 1000} 
          pathOptions={{ 
            color: '#6366f1', 
            fillColor: '#6366f1', 
            fillOpacity: 0.1,
            weight: 2
          }} 
        />
        <Marker position={center}>
          <Popup>
            <div className="font-sans">
              <p className="font-bold text-sm m-0">You are here</p>
              <p className="text-xs text-zinc-500 m-0">(Plaza Ñuñoa)</p>
            </div>
          </Popup>
        </Marker>
        {events.map((event, index) => (
          <Marker 
            key={event.id} 
            position={[event.location.lat, event.location.lng]}
            // Add event-specific ARIA information
          >
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-sm m-0">{event.title}</p>
                <p className="text-xs text-zinc-500 m-0">{event.location.neighborhood}</p>
                <p className="text-xs text-zinc-400 m-0">{event.distance}km away</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
