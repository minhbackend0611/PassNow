import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { getUniversityByName } from '../../constants/universities';
import type { Campus } from '../../constants/universities';
import MapPickerModal from '../MapPickerModal';
import { MapPin, School, Navigation, Search } from 'lucide-react';

interface LocationPickerProps {
  address: string;
  onAddressChange: (val: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  userSchool?: string;
  error?: string;
}

export default function LocationPicker({
  address,
  onAddressChange,
  onCoordinatesChange,
  userSchool,
  error
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(address || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Multi-campus state
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [schoolCampuses, setSchoolCampuses] = useState<Campus[]>([]);
  const [campusSchoolName, setCampusSchoolName] = useState('');

  const searchTimeout = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external address changes
  useEffect(() => {
    if (address !== searchQuery && !showSuggestions) {
      setSearchQuery(address || '');
    }
  }, [address]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = window.setTimeout(async () => {
      try {
        // Use Photon API with bbox for Vietnam
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&lat=16.0&lon=106.0&zoom=10&limit=15&bbox=102.14,8.56,109.47,23.39`);
        const data = await res.json();
        
        if (data.features) {
          // Filter to strictly Vietnam (countrycode VN) and limit to 5
          const vnResults = data.features.filter((f: any) => 
            f.properties.countrycode === 'VN' || f.properties.country === 'Vietnam'
          ).slice(0, 5);
          setSuggestions(vnResults);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (feature: any) => {
    const { properties, geometry } = feature;
    // Build a readable address
    const parts = [];
    if (properties.name) parts.push(properties.name);
    if (properties.street) parts.push(properties.street);
    if (properties.city || properties.state) parts.push(properties.city || properties.state);
    
    const displayName = parts.join(', ') || 'Unknown Location';
    const lng = geometry.coordinates[0];
    const lat = geometry.coordinates[1];

    setSearchQuery(displayName);
    onAddressChange(displayName);
    onCoordinatesChange(lat, lng);
    setShowSuggestions(false);
  };

  const handleUseMyUniversity = () => {
    if (!userSchool) {
      alert("You haven't set a school in your profile yet.");
      return;
    }

    const matchedSchool = getUniversityByName(userSchool);
    
    if (matchedSchool) {
      if (matchedSchool.campuses.length > 1) {
        setSchoolCampuses(matchedSchool.campuses);
        setCampusSchoolName(matchedSchool.name);
        setShowCampusModal(true);
      } else if (matchedSchool.campuses.length === 1) {
        const campus = matchedSchool.campuses[0];
        selectCampus(campus);
      }
    } else {
      // Fallback: School not in our curated DB, dynamically query OSM/Photon for campuses
      alert(`Trường của bạn (${userSchool}) chưa có trong hệ thống dữ liệu cố định. Đang tìm kiếm các cơ sở tự động bằng Bản đồ mở (OSM)...`);
      setIsLocating(true);
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(userSchool)}&bbox=102.14,8.56,109.47,23.39&limit=5`)
        .then(res => res.json())
        .then(data => {
          if (data && data.features && data.features.length > 0) {
            const vnResults = data.features.filter((f: any) => 
              f.properties.countrycode === 'VN' || f.properties.country === 'Vietnam'
            );
            
            if (vnResults.length > 1) {
              // Dynamic Multi-Campus
              const dynamicCampuses = vnResults.map((f: any, idx: number) => {
                const props = f.properties;
                return {
                  id: `dynamic-${idx}`,
                  name: props.name || `Cơ sở ${idx + 1}`,
                  address: [props.street, props.city, props.state, props.country].filter(Boolean).join(', '),
                  lat: f.geometry.coordinates[1],
                  lng: f.geometry.coordinates[0],
                };
              });
              setSchoolCampuses(dynamicCampuses);
              setCampusSchoolName(userSchool);
              setShowCampusModal(true);
            } else if (vnResults.length === 1) {
              // Single Result
              const f = vnResults[0];
              const props = f.properties;
              const displayName = [props.name, props.street, props.city, props.state].filter(Boolean).join(', ');
              setSearchQuery(displayName);
              onAddressChange(displayName);
              onCoordinatesChange(f.geometry.coordinates[1], f.geometry.coordinates[0]);
            } else {
              alert("Could not find exact coordinates for your school. Please select manually on the map.");
              setIsMapOpen(true);
            }
          } else {
            alert("Could not find exact coordinates for your school. Please select manually on the map.");
            setIsMapOpen(true);
          }
        })
        .catch(err => {
          console.error(err);
          alert("Could not find coordinates for your school.");
        })
        .finally(() => setIsLocating(false));
    }
  };

  const selectCampus = (campus: Campus) => {
    setSearchQuery(`${campus.name}, ${campus.address}`);
    onAddressChange(`${campus.name}, ${campus.address}`);
    onCoordinatesChange(campus.lat, campus.lng);
    setShowCampusModal(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode with Photon for precision and reliability
        fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`)
          .then(res => res.json())
          .then(data => {
            let displayName = 'My Current Location';
            if (data && data.features && data.features.length > 0) {
              const props = data.features[0].properties;
              displayName = [props.name, props.street, props.city, props.state, props.country].filter(Boolean).join(', ') || displayName;
            }
            setSearchQuery(displayName);
            onAddressChange(displayName);
            onCoordinatesChange(latitude, longitude);
          })
          .catch(() => {
            setSearchQuery('My Current Location');
            onAddressChange('My Current Location');
            onCoordinatesChange(latitude, longitude);
          })
          .finally(() => setIsLocating(false));
      },
      (error) => {
        console.error(error);
        alert('Unable to retrieve your location');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMapSelect = (lat: number, lng: number, addr: string) => {
    setSearchQuery(addr);
    onAddressChange(addr);
    onCoordinatesChange(lat, lng);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input Area */}
      <div className="relative z-40" ref={wrapperRef}>
        <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold group-hover/input:text-primary transition-colors">
          Specific Address / Meeting Point
        </label>
        
        <div className="relative group/input">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within/input:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            className={`w-full pl-11 pr-4 py-3.5 bg-surface rounded-2xl outline-none border transition-all duration-300 text-body-lg text-on-surface hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 ${
              error ? 'border-error' : 'border-outline-variant'
            }`}
            placeholder="Type your address to search..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {error && <p className="text-error text-sm mt-1 animate-pulse">{error}</p>}

        {/* Autocomplete Dropdown */}
        {showSuggestions && (searchQuery.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50">
            {suggestions.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto overscroll-contain p-2 flex flex-col gap-1">
                {suggestions.map((feature, idx) => (
                  <li 
                    key={idx}
                    className="px-4 py-3 hover:bg-surface-container hover:shadow-sm rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-start gap-3 group/item"
                    onClick={() => handleSelectSuggestion(feature)}
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 group-hover/item:bg-primary/10 transition-colors">
                      <MapPin className="w-4 h-4 text-on-surface-variant group-hover/item:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-semibold text-on-surface group-hover/item:text-primary transition-colors truncate">
                        {feature.properties.name || feature.properties.street || 'Location'}
                      </p>
                      <p className="text-body-sm text-on-surface-variant truncate mt-0.5">
                        {[feature.properties.city, feature.properties.state, feature.properties.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              !isSearching && (
                <div className="px-4 py-4 text-center text-on-surface-variant text-body-sm">
                  No matches found
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/50 hover:bg-secondary-container text-on-secondary-container text-label-md transition-colors disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          {isLocating ? 'Locating...' : 'My Location'}
        </button>

        <button
          type="button"
          onClick={handleUseMyUniversity}
          disabled={isLocating}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary-container/50 hover:bg-tertiary-container text-on-tertiary-container text-label-md transition-colors disabled:opacity-50"
        >
          <School className="w-4 h-4" />
          Use My University
        </button>

        <button
          type="button"
          onClick={() => setIsMapOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-label-md transition-colors ml-auto"
        >
          <MapPin className="w-4 h-4" />
          Open Map
        </button>
      </div>

      {/* Multi-Campus Selection Modal */}
      {showCampusModal && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={() => setShowCampusModal(false)} />
          <div className="bg-surface-container-lowest rounded-[32px] shadow-2xl w-full max-w-md relative z-10 flex flex-col max-h-[85vh] border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-outline-variant/50 shrink-0">
              <h3 className="text-title-lg font-bold text-on-surface">Select Campus</h3>
              <p className="text-body-sm text-on-surface-variant mt-2">{campusSchoolName} has multiple campuses.</p>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2 bg-surface min-h-0">
              {schoolCampuses.map(campus => (
                <button
                  key={campus.id}
                  type="button"
                  onClick={() => selectCampus(campus)}
                  className="w-full text-left p-5 bg-surface-container-lowest hover:bg-surface-container hover:shadow-md rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex flex-col gap-1.5 group border border-outline-variant/30 hover:border-primary/30"
                >
                  <span className="text-title-sm font-bold text-on-surface group-hover:text-primary transition-colors">{campus.name}</span>
                  <span className="text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">{campus.address}</span>
                </button>
              ))}
            </div>
            <div className="p-6 md:p-8 border-t border-outline-variant/50 bg-surface-container-lowest shrink-0">
              <button
                type="button"
                onClick={() => setShowCampusModal(false)}
                className="w-full py-3.5 rounded-full border-2 border-outline-variant text-on-surface hover:bg-surface-container hover:text-on-surface transition-all duration-200 font-bold active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full Map Picker Modal */}
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelect={handleMapSelect}
      />
    </div>
  );
}
