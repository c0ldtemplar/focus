import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { LocalEvent } from '../types';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for leaflet default icons in react
const DefaultIcon = L.icon({
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

export const MapOverlay: React.FC<Props> = React.memo(({ center, radius, events }) => {
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
        keyboard={true}
        aria-label="Interactive map of local events"
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
        <MarkerClusterGroup>
          {events.map((event) => (
            <Marker
              key={event.id}
              position={[event.location.lat, event.location.lng]}
              aria-label={`${event.title} in ${event.location.neighborhood}, ${event.distance}km away`}
            >
              <Popup>
                <div className="font-sans">
                  <p className="font-bold text-sm m-0">{event.title}</p>
                  <p className="text-xs text-zinc-500 m-0">{event.location.neighborhood}</p>
                  <p className="text-xs text-zinc-400 m-0">{event.distance}km away</p>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.location.lat},${event.location.lng}`, '_blank')}
                    className="mt-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                    aria-label={`Get directions to ${event.title}`}
                  >
                    Directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
});
