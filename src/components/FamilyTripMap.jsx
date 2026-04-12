import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { Navigation, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const caregiverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);
  return null;
}

export default function FamilyTripMap({ booking }) {
  const [liveBooking, setLiveBooking] = useState(booking);

  useEffect(() => {
    if (booking.status !== 'in_progress') return;

    const refresh = () => {
      base44.entities.Booking.filter({ caregiver_id: booking.caregiver_id }, '-updated_date', 1)
        .then(results => { if (results[0]) setLiveBooking(results[0]); })
        .catch(() => {});
    };

    // Also subscribe to real-time updates
    const unsubscribe = base44.entities.Booking.subscribe((event) => {
      if (event.id === booking.id && event.data) setLiveBooking(event.data);
    });

    const interval = setInterval(refresh, 10000);
    return () => { clearInterval(interval); unsubscribe(); };
  }, [booking.id]);

  const lat = liveBooking.caregiver_lat;
  const lng = liveBooking.caregiver_lng;
  const updatedAt = liveBooking.location_updated_at;

  if (!lat || !lng) {
    return (
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
        <Navigation className="w-5 h-5 text-blue-500 animate-pulse flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-700">Waiting for caregiver location…</p>
          <p className="text-xs text-blue-500">Location will appear once the trip begins.</p>
        </div>
      </div>
    );
  }

  const secondsAgo = updatedAt ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000) : null;
  const freshnessLabel = secondsAgo === null ? '' : secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-green-600 animate-pulse" />
          Live Caregiver Location
        </p>
        {freshnessLabel && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated {freshnessLabel}
          </span>
        )}
      </div>
      <div className="rounded-2xl overflow-hidden border border-border" style={{ height: 220 }}>
        <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={lat} lng={lng} />
          <Marker position={[lat, lng]} icon={caregiverIcon}>
            <Popup>{liveBooking.caregiver_name || 'Caregiver'}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 text-center">Updates every 10 seconds</p>
    </div>
  );
}