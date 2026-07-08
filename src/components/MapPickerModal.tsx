import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue in React
// @ts-expect-error - Leaflet internals
delete (L.Icon.Default.prototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const LocationMarker = ({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

export default function MapPickerModal({ isOpen, onClose, onSelect, initialLat, initialLng }: MapPickerModalProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialLat && initialLng) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition(new L.LatLng(initialLat, initialLng));
    }
  }, [isOpen, initialLat, initialLng]);

  useEffect(() => {
    if (position) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      fetch(`https://photon.komoot.io/reverse?lon=${position.lng}&lat=${position.lat}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const addressString = [props.name, props.street, props.city, props.state, props.country].filter(Boolean).join(', ');
            setAddress(addressString || 'Unknown location');
          } else {
            setAddress('Unknown location');
          }
        })
        .catch(() => setAddress('Failed to fetch address'))
        .finally(() => setIsLoading(false));
    }
  }, [position]);

  const handleConfirm = () => {
    if (position && address) {
      onSelect(position.lat, position.lng, address);
      onClose();
    }
  };

  // Center on HCM by default if no initial location
  const center = useMemo(() => {
    if (initialLat && initialLng) return new L.LatLng(initialLat, initialLng);
    return new L.LatLng(10.8231, 106.6297); // Ho Chi Minh City
  }, [initialLat, initialLng]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-surface-container-lowest rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden border border-outline-variant/30">
        
        <div className="p-stack-md md:p-stack-lg border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest">
          <div>
            <h2 className="text-title-lg font-title-lg text-on-surface">Pick Location</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Click on the map to place a pin</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 w-full relative h-[50vh] min-h-[250px] min-h-0 z-0">
          <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        <div className="p-stack-md md:p-stack-lg border-t border-outline-variant/50 bg-surface-container-lowest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-stack-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-sm font-label-sm text-on-surface-variant mb-1">Selected Address:</p>
            <p className="text-body-md font-body-md text-on-surface truncate">
              {isLoading ? (
                <span className="animate-pulse">Loading address...</span>
              ) : position ? (
                address
              ) : (
                'No location selected'
              )}
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-full border border-outline-variant text-on-surface font-label-lg hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!position || isLoading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
