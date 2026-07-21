export type LocationProvider = 'geoapify' | 'photon';

export interface LocationSuggestion {
  id: string;
  title: string;
  subtitle: string;
  address: string;
  lat: number;
  lng: number;
  provider: LocationProvider;
}

export interface ReverseGeocodeResult {
  address: string;
  provider: LocationProvider;
}

interface SearchLocationOptions {
  signal?: AbortSignal;
  limit?: number;
  bias?: { lat: number; lng: number };
}

interface GeoapifyResult {
  place_id?: string;
  name?: string;
  address_line1?: string;
  address_line2?: string;
  formatted?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
}

interface GeoapifyResponse {
  results?: GeoapifyResult[];
}

interface PhotonProperties {
  osm_id?: number;
  osm_type?: string;
  name?: string;
  housenumber?: string;
  street?: string;
  district?: string;
  locality?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countrycode?: string;
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: PhotonProperties;
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode';
const PHOTON_BASE_URL = 'https://photon.komoot.io';
const VIETNAM_BBOX = '102.14,8.56,109.47,23.39';
const DEFAULT_LIMIT = 6;

const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim();

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const uniqueParts = (parts: Array<string | undefined>) => {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    const normalized = part?.trim();
    if (!normalized) return false;

    const key = normalized.toLocaleLowerCase('vi');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchJson = async <T>(url: URL, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Location provider returned ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const mapGeoapifyResult = (result: GeoapifyResult): LocationSuggestion | null => {
  if (
    typeof result.lat !== 'number' ||
    typeof result.lon !== 'number' ||
    !Number.isFinite(result.lat) ||
    !Number.isFinite(result.lon)
  ) {
    return null;
  }

  const title = result.address_line1 || result.name || result.formatted;
  const address = result.formatted || uniqueParts([result.address_line1, result.address_line2]).join(', ');
  if (!title || !address) return null;

  return {
    id: result.place_id || `geoapify-${result.lat}-${result.lon}`,
    title,
    subtitle: result.address_line2 || address,
    address,
    lat: result.lat,
    lng: result.lon,
    provider: 'geoapify',
  };
};

const buildPhotonAddress = (properties: PhotonProperties) => {
  const streetAddress = uniqueParts([
    properties.housenumber,
    properties.street,
  ]).join(' ');

  return uniqueParts([
    properties.name,
    streetAddress || undefined,
    properties.locality,
    properties.district,
    properties.city,
    properties.county,
    properties.state,
    properties.postcode,
    properties.country,
  ]).join(', ');
};

const mapPhotonFeature = (feature: PhotonFeature): LocationSuggestion | null => {
  const coordinates = feature.geometry?.coordinates;
  const properties = feature.properties;
  if (!coordinates || !properties) return null;

  const [lng, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const streetAddress = uniqueParts([properties.housenumber, properties.street]).join(' ');
  const title = properties.name || streetAddress || properties.locality || properties.city;
  const address = buildPhotonAddress(properties);
  if (!title || !address) return null;

  const subtitleParts = uniqueParts([
    streetAddress && streetAddress !== title ? streetAddress : undefined,
    properties.locality,
    properties.district,
    properties.city,
    properties.state,
  ]);

  return {
    id: properties.osm_id
      ? `photon-${properties.osm_type || 'place'}-${properties.osm_id}`
      : `photon-${lat}-${lng}`,
    title,
    subtitle: subtitleParts.join(', ') || address,
    address,
    lat,
    lng,
    provider: 'photon',
  };
};

const dedupeSuggestions = (suggestions: LocationSuggestion[], limit: number) => {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.address.toLocaleLowerCase('vi')}|${suggestion.lat.toFixed(5)}|${suggestion.lng.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
};

const searchWithGeoapify = async (
  query: string,
  { signal, limit = DEFAULT_LIMIT, bias }: SearchLocationOptions,
) => {
  if (!geoapifyApiKey) return null;

  const url = new URL(`${GEOAPIFY_BASE_URL}/autocomplete`);
  url.searchParams.set('text', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('filter', 'countrycode:vn');
  url.searchParams.set('lang', 'vi');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('apiKey', geoapifyApiKey);
  if (bias) url.searchParams.set('bias', `proximity:${bias.lng},${bias.lat}`);

  const data = await fetchJson<GeoapifyResponse>(url, signal);
  const suggestions = (data.results || [])
    .filter((result) => !result.country_code || result.country_code.toLowerCase() === 'vn')
    .map(mapGeoapifyResult)
    .filter((result): result is LocationSuggestion => Boolean(result));

  return dedupeSuggestions(suggestions, limit);
};

const searchWithPhoton = async (
  query: string,
  { signal, limit = DEFAULT_LIMIT, bias }: SearchLocationOptions,
) => {
  const url = new URL(`${PHOTON_BASE_URL}/api/`);
  url.searchParams.set('q', query);
  url.searchParams.set('lang', 'vi');
  url.searchParams.set('limit', String(Math.max(limit * 2, 10)));
  url.searchParams.set('bbox', VIETNAM_BBOX);
  if (bias) {
    url.searchParams.set('lat', String(bias.lat));
    url.searchParams.set('lon', String(bias.lng));
  }

  const data = await fetchJson<PhotonResponse>(url, signal);
  const suggestions = (data.features || [])
    .filter((feature) => {
      const countryCode = feature.properties?.countrycode?.toUpperCase();
      const country = feature.properties?.country?.toLocaleLowerCase('vi');
      return countryCode === 'VN' || country === 'việt nam' || country === 'vietnam';
    })
    .map(mapPhotonFeature)
    .filter((result): result is LocationSuggestion => Boolean(result));

  return dedupeSuggestions(suggestions, limit);
};

/**
 * Searches user-entered locations. Geoapify is preferred when configured;
 * Photon remains a best-effort fallback so local development still works.
 */
export const searchLocations = async (
  rawQuery: string,
  options: SearchLocationOptions = {},
): Promise<LocationSuggestion[]> => {
  const query = rawQuery.trim();
  if (query.length < 3) return [];

  if (geoapifyApiKey) {
    try {
      const results = await searchWithGeoapify(query, options);
      if (results) return results;
    } catch (error) {
      if (isAbortError(error)) throw error;
      // Fall through to the open demo provider when the configured provider is unavailable.
      console.warn('Geoapify location search failed; using Photon fallback.', error);
    }
  }

  return searchWithPhoton(query, options);
};

const reverseWithGeoapify = async (
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> => {
  if (!geoapifyApiKey) return null;

  const url = new URL(`${GEOAPIFY_BASE_URL}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('lang', 'vi');
  url.searchParams.set('apiKey', geoapifyApiKey);

  const data = await fetchJson<GeoapifyResponse>(url, signal);
  const result = data.results?.[0];
  const address = result?.formatted || uniqueParts([result?.address_line1, result?.address_line2]).join(', ');
  return address ? { address, provider: 'geoapify' } : null;
};

const reverseWithPhoton = async (
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> => {
  const url = new URL(`${PHOTON_BASE_URL}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('lang', 'vi');

  const data = await fetchJson<PhotonResponse>(url, signal);
  const result = data.features?.map(mapPhotonFeature).find(Boolean);
  return result ? { address: result.address, provider: 'photon' } : null;
};

export const reverseGeocodeLocation = async (
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> => {
  if (geoapifyApiKey) {
    try {
      const result = await reverseWithGeoapify(lat, lng, signal);
      if (result) return result;
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.warn('Geoapify reverse geocoding failed; using Photon fallback.', error);
    }
  }

  return reverseWithPhoton(lat, lng, signal);
};

export const getLocationProviderLabel = (provider: LocationProvider) =>
  provider === 'geoapify' ? 'Geoapify · OpenStreetMap' : 'Photon · OpenStreetMap';

export const isGeoapifyConfigured = Boolean(geoapifyApiKey);
