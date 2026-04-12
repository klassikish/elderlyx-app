import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { icon } from 'leaflet';
import { format } from 'date-fns';
import L from 'leaflet';

// Custom markers
const activeMarkerIcon = icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const inactiveMarkerIcon = icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function FamilyLocationMap({ trackingData = [] }) {
  const activeTrackers = trackingData.filter((t) => t.tracking_enabled && t.current_lat && t.current_lng);
  const inactiveTrackers = trackingData.filter((t) => !t.tracking_enabled && t.current_lat && t.current_lng);

  // Calculate center and bounds
  const mapCenter = useMemo(() => {
    if (activeTrackers.length === 0 && inactiveTrackers.length === 0) {
      return [40.7128, -74.006]; // NYC default
    }
    const all = [...activeTrackers, ...inactiveTrackers];
    const avgLat = all.reduce((sum, t) => sum + t.current_lat, 0) / all.length;
    const avgLng = all.reduce((sum, t) => sum + t.current_lng, 0) / all.length;
    return [avgLat, avgLng];
  }, [activeTrackers, inactiveTrackers]);

  if (activeTrackers.length === 0 && inactiveTrackers.length === 0) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center border border-border">
        <p className="text-sm text-muted-foreground">No location data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Active Location Markers */}
        {activeTrackers.map((tracker) => (
          <Marker
            key={tracker.id}
            position={[tracker.current_lat, tracker.current_lng]}
            icon={activeMarkerIcon}
          >
            <Popup>
              <div className="text-sm font-bold mb-1">{tracker.tracker_name}</div>
              <p className="text-xs text-muted-foreground">
                📍 {tracker.current_lat.toFixed(4)}, {tracker.current_lng.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                Accuracy: ±{Math.round(tracker.accuracy_meters)}m
              </p>
              <p className="text-xs text-green-600 font-semibold mt-1">🟢 Live</p>
            </Popup>
          </Marker>
        ))}

        {/* Inactive Location Markers */}
        {inactiveTrackers.map((tracker) => (
          <Marker
            key={tracker.id}
            position={[tracker.current_lat, tracker.current_lng]}
            icon={inactiveMarkerIcon}
          >
            <Popup>
              <div className="text-sm font-bold mb-1">{tracker.tracker_name}</div>
              <p className="text-xs text-muted-foreground">
                📍 {tracker.current_lat.toFixed(4)}, {tracker.current_lng.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: {format(new Date(tracker.last_updated_at), 'h:mm a')}
              </p>
              <p className="text-xs text-gray-600 font-semibold mt-1">⊘ Offline</p>
            </Popup>
          </Marker>
        ))}

        {/* Location History Trails */}
        {activeTrackers.map((tracker) => {
          const history = tracker.location_history || [];
          if (history.length < 2) return null;

          const polyline = history.map((h) => [h.lat, h.lng]);
          return (
            <Polyline
              key={`trail-${tracker.id}`}
              positions={polyline}
              color="#3b82f6"
              opacity={0.5}
              weight={2}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}