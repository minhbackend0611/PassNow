import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
  School,
  Library,
} from 'lucide-react';
import {
  reverseGeocodeLocation,
  searchLocations,
} from '../../services/locationService';
import { getUniversityByName, VIETNAM_UNIVERSITIES } from '../../constants/universities';
import { UniversityBrowserModal } from './UniversityBrowserModal';
import type { LocationProvider, LocationSuggestion } from '../../services/locationService';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  address: string;
  coordinates?: Coordinates;
  onAddressChange: (value: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onCoordinatesClear?: () => void;
  userSchool?: string;
  error?: string;
}

type SearchState = 'idle' | 'loading' | 'success' | 'empty' | 'error';
type SelectionSource = 'saved' | 'search' | 'campus' | 'device';

interface SelectionMeta {
  source: SelectionSource;
  campusId?: string;
  provider?: LocationProvider;
}

interface CommitLocation {
  address: string;
  coordinates?: Coordinates;
  meta: SelectionMeta;
}

const SEARCH_DELAY_MS = 350;
const MIN_SEARCH_LENGTH = 3;

const sourceLabel = (meta: SelectionMeta | null) => {
  if (!meta) return 'Selected location';
  switch (meta.source) {
    case 'campus':
      return 'Verified campus';
    case 'device':
      return 'Device location';
    case 'search':
      return 'Search result';
    default:
      return 'Saved location';
  }
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

export default function LocationPicker({
  address,
  coordinates,
  onAddressChange,
  onCoordinatesChange,
  onCoordinatesClear,
  userSchool,
  error,
}: LocationPickerProps) {
  const [draftQuery, setDraftQuery] = useState(address);
  const [isEditing, setIsEditing] = useState(!address);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUniBrowser, setShowUniBrowser] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectionMeta, setSelectionMeta] = useState<SelectionMeta | null>(
    address ? { source: 'saved' } : null,
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'error'>('info');

  const [isLocating, setIsLocating] = useState(false);

  const [showCampusModal, setShowCampusModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const campusCloseRef = useRef<HTMLButtonElement>(null);
  const universityButtonRef = useRef<HTMLButtonElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef(new Map<string, LocationSuggestion[]>());
  const reverseAbortRef = useRef<AbortController | null>(null);
  const campusDiscoveryAbortRef = useRef<AbortController | null>(null);
  const committedByPickerRef = useRef<string | null>(null);
  const previousAddressRef = useRef(address);

  // The form can hydrate an existing listing after this component mounts.
  useEffect(() => {
    if (address === previousAddressRef.current) return;
    previousAddressRef.current = address;

    if (address === committedByPickerRef.current) {
      committedByPickerRef.current = null;
      return;
    }

    if (address) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftQuery(address);
      setIsEditing(false);
      setSelectionMeta({ source: 'saved' });
      return;
    }

    setDraftQuery('');
    setIsEditing(true);
    setSelectionMeta(null);
  }, [address]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => {
    if (searchTimeoutRef.current !== null) window.clearTimeout(searchTimeoutRef.current);
    searchAbortRef.current?.abort();
    reverseAbortRef.current?.abort();
    campusDiscoveryAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!showCampusModal) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => campusCloseRef.current?.focus());

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowCampusModal(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = document.getElementById('campus-picker-dialog');
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href]',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [showCampusModal]);

  const cancelSearch = () => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
  };

  const scheduleSearch = (rawQuery: string) => {
    cancelSearch();
    const query = rawQuery.trim();
    const cacheKey = query.toLocaleLowerCase('vi');
    setSuggestions([]);
    setActiveSuggestionIndex(-1);

    if (query.length < MIN_SEARCH_LENGTH) {
      setSearchState('idle');
      return;
    }

    const cachedResults = searchCacheRef.current.get(cacheKey);
    if (cachedResults) {
      setSuggestions(cachedResults);
      setSearchState(cachedResults.length ? 'success' : 'empty');
      return;
    }

    setSearchState('loading');
    searchTimeoutRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      searchAbortRef.current = controller;
      try {
        const results = await searchLocations(query, {
          signal: controller.signal,
          bias: coordinates,
        });
        if (controller.signal.aborted) return;
        searchCacheRef.current.set(cacheKey, results);
        setSuggestions(results);
        setSearchState(results.length ? 'success' : 'empty');
      } catch (searchError) {
        if (isAbortError(searchError)) return;
        console.error('Unable to search locations', searchError);
        setSuggestions([]);
        setSearchState('error');
      }
    }, SEARCH_DELAY_MS);
  };

  const invalidateSelectedLocation = () => {
    if (!address) return;
    committedByPickerRef.current = '';
    onAddressChange('');
    onCoordinatesClear?.();
    setSelectionMeta(null);
    setStatusTone('info');
    setStatusMessage('Select another result to confirm the new location.');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDraftQuery(value);
    setIsEditing(true);
    setShowSuggestions(Boolean(value));
    setStatusMessage('');
    invalidateSelectedLocation();
    scheduleSearch(value);
  };

  const commitLocation = ({ address: nextAddress, coordinates: nextCoordinates, meta }: CommitLocation) => {
    cancelSearch();
    committedByPickerRef.current = nextAddress;
    setDraftQuery(nextAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchState('idle');
    setActiveSuggestionIndex(-1);
    setIsEditing(false);
    setSelectionMeta(meta);
    setStatusMessage('');
    onAddressChange(nextAddress);
    if (nextCoordinates) {
      onCoordinatesChange(nextCoordinates.lat, nextCoordinates.lng);
    } else {
      onCoordinatesClear?.();
    }
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    commitLocation({
      address: suggestion.address,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng },
      meta: { source: suggestion.provider === 'local' ? 'campus' : 'search', provider: suggestion.provider },
    });
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (!suggestions.length || !showSuggestions) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    } else if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault();
      handleSelectSuggestion(suggestions[activeSuggestionIndex]);
    }
  };

  const beginEditing = () => {
    setIsEditing(true);
    setStatusMessage('');
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const handleUseMyUniversity = async () => {
    const school = userSchool?.trim();
    if (!school) {
      setStatusTone('error');
      setStatusMessage('No university found in your profile.');
      return;
    }

    setIsLocating(true);
    setStatusMessage('');
    try {
      const matchedUni = getUniversityByName(school);
      if (matchedUni && matchedUni.campuses.length > 0) {
        if (matchedUni.campuses.length === 1) {
          const campus = matchedUni.campuses[0];
          commitLocation({
            address: campus.address,
            coordinates: (campus.lat && campus.lng) ? { lat: campus.lat, lng: campus.lng } : undefined,
            meta: { source: 'campus', campusId: campus.id, provider: 'local' },
          });
          return;
        } else {
          const localSuggestions = matchedUni.campuses.map(campus => ({
            id: `local-${matchedUni.id}-${campus.id}`,
            title: campus.name,
            subtitle: `${matchedUni.name} • ${campus.address}`,
            address: campus.address,
            lat: campus.lat || 0,
            lng: campus.lng || 0,
            provider: 'local' as const
          }));
          setDraftQuery(matchedUni.name);
          setIsEditing(true);
          setSuggestions(localSuggestions);
          setSearchState('success');
          setShowSuggestions(true);
          return;
        }
      }

      const results = await searchLocations(school, { limit: 1 });
      if (results && results.length > 0) {
        const campus = results[0];
        commitLocation({
          address: campus.address,
          coordinates: { lat: campus.lat, lng: campus.lng },
          meta: { source: 'search', provider: campus.provider },
        });
      } else {
        setStatusTone('error');
        setStatusMessage('Could not find location for your university. Please search manually.');
      }
    } catch (err) {
       console.error('Failed to find university location:', err);
       setStatusTone('error');
       setStatusMessage('Failed to find university location.');
    } finally {
       setIsLocating(false);
    }
  };

  const handleBrowseSelect = (uni: typeof VIETNAM_UNIVERSITIES[0]) => {
    setShowUniBrowser(false);
    if (uni.campuses.length === 1) {
      const campus = uni.campuses[0];
      commitLocation({
        address: campus.address,
        coordinates: (campus.lat && campus.lng) ? { lat: campus.lat, lng: campus.lng } : undefined,
        meta: { source: 'campus', campusId: campus.id, provider: 'local' },
      });
    } else {
      const localSuggestions = uni.campuses.map(campus => ({
        id: `local-${uni.id}-${campus.id}`,
        title: campus.name,
        subtitle: `${uni.name} • ${campus.address}`,
        address: campus.address,
        lat: campus.lat || 0,
        lng: campus.lng || 0,
        provider: 'local' as const
      }));
      setDraftQuery(uni.name);
      setIsEditing(true);
      setSuggestions(localSuggestions);
      setSearchState('success');
      setShowSuggestions(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusTone('error');
      setStatusMessage('Location services are not supported by this browser. Search for an address instead.');
      return;
    }

    reverseAbortRef.current?.abort();
    setIsLocating(true);
    setStatusMessage('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const controller = new AbortController();
        reverseAbortRef.current = controller;
        const coordinateLabel = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        try {
          const result = await reverseGeocodeLocation(
            coords.latitude,
            coords.longitude,
            controller.signal,
          );
          commitLocation({
            address: result?.address || `Current location (${coordinateLabel})`,
            coordinates: { lat: coords.latitude, lng: coords.longitude },
            meta: { source: 'device', provider: result?.provider },
          });
        } catch (reverseError) {
          if (isAbortError(reverseError)) return;
          commitLocation({
            address: `Current location (${coordinateLabel})`,
            coordinates: { lat: coords.latitude, lng: coords.longitude },
            meta: { source: 'device' },
          });
        } finally {
          if (!controller.signal.aborted) setIsLocating(false);
        }
      },
      (geolocationError) => {
        setIsLocating(false);
        setStatusTone('error');
        setStatusMessage(
          geolocationError.code === geolocationError.PERMISSION_DENIED
            ? 'Location permission is off. Search for an address instead.'
            : "We couldn't get your current location. Try again or search for an address.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  };

  const activeDescendant = activeSuggestionIndex >= 0
    ? `location-suggestion-${activeSuggestionIndex}`
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <label
              htmlFor="listing-location-search"
              className="block text-label-sm font-semibold text-on-surface"
            >
              Meetup location <span className="text-error">*</span>
            </label>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Choose a public, recognizable place that works for both people.
            </p>
          </div>
        </div>

        {address && !isEditing ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-label-sm font-semibold text-primary">Location selected</span>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                    {sourceLabel(selectionMeta)}
                  </span>
                </div>
                <p className="mt-1 break-words text-body-md font-semibold text-on-surface">{address}</p>
                {selectionMeta?.provider && (
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    Coordinates via{' '}
                    {selectionMeta.provider === 'geoapify' ? (
                      <a className="underline hover:text-primary" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a>
                    ) : (
                      'Photon'
                    )}
                    {' · '}
                    <a className="underline hover:text-primary" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={beginEditing}
                className="min-h-11 shrink-0 rounded-full px-3 text-label-md font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-40" ref={wrapperRef}>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                id="listing-location-search"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="location-suggestions"
                aria-activedescendant={activeDescendant}
                aria-describedby="location-search-status"
                autoComplete="off"
                spellCheck={false}
                className={`w-full rounded-2xl border bg-surface py-3.5 pl-11 pr-12 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                  error ? 'border-error' : 'border-outline-variant hover:border-primary/50'
                }`}
                placeholder="Search for a campus, building, or address"
                value={draftQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (!draftQuery) return;
                  setShowSuggestions(true);
                  if (draftQuery.trim().length >= MIN_SEARCH_LENGTH && searchState === 'idle') {
                    scheduleSearch(draftQuery);
                  }
                }}
              />
              {searchState === 'loading' && (
                <LoaderCircle
                  className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary"
                  aria-hidden="true"
                />
              )}
            </div>

            {showSuggestions && draftQuery && (
              <div
                id="location-suggestions"
                className="mt-2 overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-3">
                  <span className="text-label-sm font-semibold text-on-surface">Suggested places</span>
                  {suggestions[0] && (
                    <span className="text-right text-[11px] text-on-surface-variant">
                      {suggestions[0].provider === 'geoapify' ? (
                        <>
                          <a className="underline hover:text-primary" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a>
                          {' · '}
                        </>
                      ) : (
                        <>Photon · </>
                      )}
                      <a className="underline hover:text-primary" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
                    </span>
                  )}
                </div>

                {draftQuery.trim().length < MIN_SEARCH_LENGTH ? (
                  <div className="px-4 py-5 text-center text-body-sm text-on-surface-variant">
                    Enter at least {MIN_SEARCH_LENGTH} characters to search.
                  </div>
                ) : searchState === 'loading' ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-6 text-body-sm text-on-surface-variant">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Searching places…
                  </div>
                ) : searchState === 'success' ? (
                  <ul role="listbox" className="max-h-72 overflow-y-auto p-2 custom-scrollbar">
                    {suggestions.map((suggestion, index) => {
                      const isActive = index === activeSuggestionIndex;
                      return (
                        <li
                          id={`location-suggestion-${index}`}
                          key={suggestion.id}
                          role="option"
                          aria-selected={isActive}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 outline-none transition-colors ${
                            isActive ? 'bg-primary/10' : 'hover:bg-surface-container'
                          }`}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSelectSuggestion(suggestion);
                          }}
                        >
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isActive 
                              ? 'bg-primary text-on-primary' 
                              : suggestion.provider === 'local'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            {suggestion.provider === 'local' ? (
                              <School className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-body-md font-semibold text-on-surface">{suggestion.title}</p>
                              {suggestion.provider === 'local' && (
                                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                                  Verified Campus
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 break-words text-body-sm leading-5 text-on-surface-variant">
                              {suggestion.subtitle}
                            </p>
                          </div>
                          {isActive && <Check className="mt-2 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                        </li>
                      );
                    })}
                  </ul>
                ) : searchState === 'empty' ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-body-md font-semibold text-on-surface">No matching places found</p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">Try a more specific address, building, ward, or city.</p>
                  </div>
                ) : searchState === 'error' ? (
                  <div className="px-5 py-6 text-center">
                    <AlertCircle className="mx-auto h-6 w-6 text-error" aria-hidden="true" />
                    <p className="mt-2 text-body-md font-semibold text-on-surface">Unable to load places</p>
                    <button
                      type="button"
                      onClick={() => scheduleSearch(draftQuery)}
                      className="mt-2 rounded-full px-4 py-2 text-label-md font-semibold text-primary hover:bg-primary/10"
                    >
                      Try again
                    </button>
                  </div>
                ) : null}

                <div className="border-t border-outline-variant/40 px-4 py-3">
                  <p className="text-label-sm text-on-surface-variant">
                    Tip: include a street number, ward, district, or city for better results.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div id="location-search-status" aria-live="polite" className="mt-2 min-h-5">
          {error && (
            <p className="text-label-sm text-error">
              {draftQuery ? 'Select one of the suggestions to confirm this location.' : error}
            </p>
          )}
          {statusMessage && (
            <p className={`flex items-start gap-1.5 text-label-sm ${statusTone === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
              {statusTone === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          ref={universityButtonRef}
          type="button"
          onClick={handleUseMyUniversity}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tertiary-container/15 text-tertiary">
            <School className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-label-md font-semibold text-on-surface">My university campus</span>
            <span className="block truncate text-label-sm text-on-surface-variant">{userSchool || 'No university in profile'}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-secondary/20 bg-secondary-container/25 px-4 py-3 text-left transition-colors hover:border-secondary/40 hover:bg-secondary-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-container/20 text-secondary">
            {isLocating ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Navigation className="h-4 w-4" aria-hidden="true" />}
          </span>
          <span>
            <span className="block text-label-md font-semibold text-on-surface">Current location</span>
            <span className="block text-label-sm text-on-surface-variant">{isLocating ? 'Locating…' : 'Use device GPS'}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowUniBrowser(true)}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-tertiary/20 bg-tertiary/10 px-4 py-3 text-left transition-colors hover:border-tertiary/40 hover:bg-tertiary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:col-span-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tertiary-container/30 text-tertiary">
            <Library className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-label-md font-semibold text-on-surface">Browse universities</span>
            <span className="block truncate text-label-sm text-on-surface-variant">
              Select from our list of {VIETNAM_UNIVERSITIES.length} verified universities
            </span>
          </span>
        </button>
      </div>

      <UniversityBrowserModal
        isOpen={showUniBrowser}
        onClose={() => setShowUniBrowser(false)}
        onSelect={handleBrowseSelect}
      />
    </div>
  );
}
