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
    <div className="h-full w-full rounded-[2rem] overflow-hidden border border-zinc-800 shadow-inner">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
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
          <Popup>Estás aquí (Plaza Ñuñoa)</Popup>
        </Marker>
        {events.map((event) => (
          <Marker key={event.id} position={[event.location.lat, event.location.lng]}>
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-sm m-0">{event.title}</p>
                <p className="text-xs text-zinc-500 m-0">{event.location.neighborhood}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
