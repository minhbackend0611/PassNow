import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  AlertCircle,
  Check,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  School,
  X,
} from 'lucide-react';
import { getUniversityByName } from '../../constants/universities';
import type { Campus, University } from '../../constants/universities';
import {
  reverseGeocodeLocation,
  searchLocations,
} from '../../services/locationService';
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
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectionMeta, setSelectionMeta] = useState<SelectionMeta | null>(
    address ? { source: 'saved' } : null,
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'error'>('info');

  const [isLocating, setIsLocating] = useState(false);

  const [showCampusModal, setShowCampusModal] = useState(false);
  const [matchedUniversity, setMatchedUniversity] = useState<University | null>(null);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [campusQuery, setCampusQuery] = useState('');
  const [discoveredCampuses, setDiscoveredCampuses] = useState<LocationSuggestion[]>([]);
  const [isDiscoveringCampuses, setIsDiscoveringCampuses] = useState(false);
  const [campusDiscoveryError, setCampusDiscoveryError] = useState(false);

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

  const filteredCampuses = useMemo(() => {
    const campuses = matchedUniversity?.campuses || [];
    const query = campusQuery.trim().toLocaleLowerCase('vi');
    if (!query) return campuses;
    return campuses.filter((campus) =>
      `${campus.name} ${campus.address} ${campus.region}`.toLocaleLowerCase('vi').includes(query),
    );
  }, [campusQuery, matchedUniversity]);

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
      meta: { source: 'search', provider: suggestion.provider },
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

  const closeCampusModal = () => {
    setShowCampusModal(false);
  };

  const discoverUniversityLocations = async (school: string) => {
    campusDiscoveryAbortRef.current?.abort();
    const controller = new AbortController();
    campusDiscoveryAbortRef.current = controller;
    setIsDiscoveringCampuses(true);
    setCampusDiscoveryError(false);
    setDiscoveredCampuses([]);
    try {
      const results = await searchLocations(school, {
        signal: controller.signal,
        limit: 8,
        bias: coordinates,
      });
      if (!controller.signal.aborted) setDiscoveredCampuses(results);
    } catch (discoveryError) {
      if (!isAbortError(discoveryError)) {
        console.error('Unable to discover university locations', discoveryError);
        setCampusDiscoveryError(true);
      }
    } finally {
      if (!controller.signal.aborted) setIsDiscoveringCampuses(false);
    }
  };

  const handleUseMyUniversity = () => {
    const school = userSchool?.trim();
    setCampusQuery('');
    setSelectedCampusId(null);
    setDiscoveredCampuses([]);
    setCampusDiscoveryError(false);

    if (!school) {
      setMatchedUniversity(null);
      setShowCampusModal(true);
      return;
    }

    const university = getUniversityByName(school) || null;
    setMatchedUniversity(university);
    if (university?.campuses.length === 1) {
      setSelectedCampusId(university.campuses[0].id);
    } else if (selectionMeta?.source === 'campus' && selectionMeta.campusId) {
      setSelectedCampusId(selectionMeta.campusId);
    }
    setShowCampusModal(true);
    if (!university) void discoverUniversityLocations(school);
  };

  const startAddressSearch = (query: string) => {
    closeCampusModal();
    setIsEditing(true);
    setDraftQuery(query);
    setShowSuggestions(Boolean(query));
    setStatusTone('info');
    setStatusMessage('Select a search result and verify its address before posting.');
    scheduleSearch(query);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const startSchoolAddressSearch = () => {
    startAddressSearch(userSchool?.trim() || '');
  };

  const startSelectedCampusAddressSearch = () => {
    const campus = matchedUniversity?.campuses.find((item) => item.id === selectedCampusId);
    startAddressSearch(campus?.address || matchedUniversity?.name || '');
  };

  const commitCampus = () => {
    const campus = matchedUniversity?.campuses.find((item) => item.id === selectedCampusId);
    if (!campus) return;

    const campusAddress = `${campus.name}, ${campus.address}`;
    const campusCoordinates = campus.lat !== undefined && campus.lng !== undefined
      ? { lat: campus.lat, lng: campus.lng }
      : undefined;
    commitLocation({
      address: campusAddress,
      coordinates: campusCoordinates,
      meta: { source: 'campus', campusId: campus.id },
    });
    closeCampusModal();
    if (!campusCoordinates) {
      setStatusTone('info');
      setStatusMessage('Official address selected; distance estimates are unavailable for this campus.');
    }
  };

  const commitDiscoveredCampus = () => {
    const campus = discoveredCampuses.find((item) => item.id === selectedCampusId);
    if (!campus) return;
    commitLocation({
      address: campus.address,
      coordinates: { lat: campus.lat, lng: campus.lng },
      meta: { source: 'search', provider: campus.provider },
    });
    closeCampusModal();
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

  const selectedCampus = matchedUniversity?.campuses.find((campus) => campus.id === selectedCampusId);
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
                className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-2xl"
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
                            isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-body-md font-semibold text-on-surface">{suggestion.title}</p>
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
      </div>

      {showCampusModal && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close campus picker"
            className="absolute inset-0 h-full w-full bg-black/45 backdrop-blur-sm"
            onClick={closeCampusModal}
          />
          <div
            id="campus-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campus-picker-title"
            aria-describedby="campus-picker-description"
            className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-outline-variant/40 bg-surface-container-lowest shadow-2xl sm:max-w-2xl sm:rounded-[28px]"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-outline-variant sm:hidden" aria-hidden="true" />
            <header className="flex items-start gap-3 border-b border-outline-variant/40 px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <School className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="campus-picker-title" className="text-headline-md font-bold text-on-surface">
                  {matchedUniversity ? 'Choose a meetup campus' : 'Your university campus'}
                </h2>
                <p id="campus-picker-description" className="mt-1 break-words text-body-sm text-on-surface-variant">
                  {matchedUniversity?.name || userSchool || 'No university is set in your profile.'}
                </p>
              </div>
              <button
                ref={campusCloseRef}
                type="button"
                onClick={closeCampusModal}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            {matchedUniversity ? (
              <>
                <div className="border-b border-outline-variant/40 px-5 py-3 sm:px-6">
                  <div className="flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-label-sm text-on-surface-variant">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex-1">
                      Addresses verified against the university's official website · {matchedUniversity.source.verifiedAt}
                    </span>
                    <a
                      href={matchedUniversity.source.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open source: ${matchedUniversity.source.label}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                  {matchedUniversity.campuses.length > 6 && (
                    <div className="relative mt-3">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
                      <input
                        type="search"
                        value={campusQuery}
                        onChange={(event) => setCampusQuery(event.target.value)}
                        placeholder="Filter by campus name or city"
                        className="w-full rounded-xl border border-outline-variant bg-surface py-2.5 pl-9 pr-3 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-surface p-3 custom-scrollbar sm:p-4">
                  <div role="radiogroup" aria-label="Campus list" className="space-y-2">
                    {filteredCampuses.map((campus: Campus) => {
                      const selected = campus.id === selectedCampusId;
                      return (
                        <button
                          key={campus.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            setSelectedCampusId(campus.id);
                          }}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-outline-variant/50 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container'
                          }`}
                        >
                          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-surface'
                          }`}>
                            {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-body-md font-bold text-on-surface">{campus.name}</span>
                              <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">{campus.region}</span>
                            </span>
                            <span className="mt-1 block break-words text-body-sm leading-5 text-on-surface-variant">{campus.address}</span>
                            {campus.lat === undefined && (
                              <span className="mt-1.5 block text-label-sm text-secondary">Official address only · distance unavailable</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!filteredCampuses.length && (
                    <div className="px-4 py-8 text-center text-body-sm text-on-surface-variant">
                      No campuses match this filter.
                    </div>
                  )}
                </div>

                <footer className="border-t border-outline-variant/40 bg-surface-container-lowest px-5 py-4 sm:px-6">
                  {selectedCampus && (
                    <p className="mb-3 text-body-sm text-on-surface-variant">
                      Selected: <strong className="text-on-surface">{selectedCampus.name}</strong>
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={startSelectedCampusAddressSearch}
                      className="min-h-12 rounded-full px-5 text-label-md font-semibold text-primary hover:bg-primary/10"
                    >
                      {selectedCampus ? 'Search this address' : 'Search another address'}
                    </button>
                    <button
                      type="button"
                      onClick={commitCampus}
                      disabled={!selectedCampusId}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-label-md font-bold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Use this campus
                    </button>
                  </div>
                </footer>
              </>
            ) : userSchool ? (
              <>
                <div className="border-b border-outline-variant/40 bg-secondary-container/10 px-5 py-3 sm:px-6">
                  <div className="flex items-start gap-2 text-label-sm text-on-surface-variant">
                    <Search className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                    <span>Campus candidates from location search. Please verify the address before posting.</span>
                  </div>
                </div>
                <div className="min-h-[220px] flex-1 overflow-y-auto bg-surface p-3 custom-scrollbar sm:p-4">
                  {isDiscoveringCampuses ? (
                    <div className="flex h-48 flex-col items-center justify-center text-on-surface-variant">
                      <LoaderCircle className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
                      <p className="mt-3 text-body-sm">Finding locations for your university…</p>
                    </div>
                  ) : campusDiscoveryError ? (
                    <div className="flex h-48 flex-col items-center justify-center text-center">
                      <AlertCircle className="h-7 w-7 text-error" aria-hidden="true" />
                      <p className="mt-3 text-body-sm text-on-surface-variant">Unable to load university locations.</p>
                      <button type="button" onClick={() => void discoverUniversityLocations(userSchool.trim())} className="mt-2 rounded-full px-4 py-2 font-semibold text-primary hover:bg-primary/10">Try again</button>
                    </div>
                  ) : discoveredCampuses.length ? (
                    <div role="radiogroup" aria-label="University location candidates" className="space-y-2">
                      {discoveredCampuses.map((campus) => {
                        const selected = campus.id === selectedCampusId;
                        return (
                          <button key={campus.id} type="button" role="radio" aria-checked={selected} onClick={() => setSelectedCampusId(campus.id)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? 'border-primary bg-primary/5' : 'border-outline-variant/50 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container'}`}>
                            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-surface'}`}>
                              {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-body-md font-bold text-on-surface">{campus.title}</span>
                              <span className="mt-1 block break-words text-body-sm leading-5 text-on-surface-variant">{campus.address}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-48 flex-col items-center justify-center text-center">
                      <AlertCircle className="h-7 w-7 text-secondary" aria-hidden="true" />
                      <p className="mt-3 text-body-sm text-on-surface-variant">No matching locations found. Search by campus or address instead.</p>
                    </div>
                  )}
                </div>
                <footer className="border-t border-outline-variant/40 bg-surface-container-lowest px-5 py-4 sm:px-6">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button type="button" onClick={startSchoolAddressSearch} className="min-h-12 rounded-full px-5 text-label-md font-semibold text-primary hover:bg-primary/10">Search another address</button>
                    <button type="button" onClick={commitDiscoveredCampus} disabled={!selectedCampusId} className="flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-label-md font-bold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">Use this location</button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container/20 text-secondary">
                  <AlertCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-headline-md font-bold text-on-surface">
                  No university in your profile
                </h3>
                <p className="mt-2 max-w-md text-body-sm leading-6 text-on-surface-variant">
                  Add your university in your profile, or continue by searching for an address.
                </p>
                <div className="mt-6 w-full max-w-sm">
                  <button
                    type="button"
                    onClick={startSchoolAddressSearch}
                    className="min-h-12 w-full rounded-full bg-primary px-5 text-label-md font-bold text-on-primary hover:bg-primary/90"
                  >
                    Search an address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
