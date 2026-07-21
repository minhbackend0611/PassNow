import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('locationService with Geoapify unconfigured', () => {
  it('uses Photon, filters to Vietnam, normalizes fields, and deduplicates results', async () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', '');
    const payload = {
      features: [
        {
          geometry: { coordinates: [106.657891, 10.772584] },
          properties: {
            osm_id: 101,
            osm_type: 'N',
            name: 'Đại học Bách khoa TP.HCM',
            housenumber: '268',
            street: 'Lý Thường Kiệt',
            district: 'Quận 10',
            city: 'TP.HCM',
            country: 'Việt Nam',
            countrycode: 'VN',
          },
        },
        {
          geometry: { coordinates: [106.657891, 10.772584] },
          properties: {
            osm_id: 102,
            osm_type: 'N',
            name: 'Đại học Bách khoa TP.HCM',
            housenumber: '268',
            street: 'Lý Thường Kiệt',
            district: 'Quận 10',
            city: 'TP.HCM',
            country: 'Việt Nam',
            countrycode: 'VN',
          },
        },
        {
          geometry: { coordinates: [-73.996, 40.729] },
          properties: {
            osm_id: 999,
            name: 'A result outside Vietnam',
            city: 'New York',
            country: 'United States',
            countrycode: 'US',
          },
        },
      ],
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { isGeoapifyConfigured, searchLocations } = await import('./locationService');
    const results = await searchLocations('  Bách khoa  ', {
      limit: 5,
      bias: { lat: 10.77, lng: 106.66 },
    });

    expect(isGeoapifyConfigured).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestedUrl.origin).toBe('https://photon.komoot.io');
    expect(requestedUrl.pathname).toBe('/api/');
    expect(requestedUrl.searchParams.get('q')).toBe('Bách khoa');
    expect(requestedUrl.searchParams.get('bbox')).toBe('102.14,8.56,109.47,23.39');
    expect(requestedUrl.searchParams.get('lat')).toBe('10.77');
    expect(requestedUrl.searchParams.get('lon')).toBe('106.66');

    expect(results).toEqual([
      {
        id: 'photon-N-101',
        title: 'Đại học Bách khoa TP.HCM',
        subtitle: '268 Lý Thường Kiệt, Quận 10, TP.HCM',
        address: 'Đại học Bách khoa TP.HCM, 268 Lý Thường Kiệt, Quận 10, TP.HCM, Việt Nam',
        lat: 10.772584,
        lng: 106.657891,
        provider: 'photon',
      },
    ]);
  });

  it('passes the provided abort signal to Photon', async () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', '');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ features: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { searchLocations } = await import('./locationService');
    const controller = new AbortController();

    await searchLocations('Thư viện', { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

describe('locationService with Geoapify configured', () => {
  it('prefers Geoapify and applies Vietnam autocomplete filters', async () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', 'test-key-placeholder');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        results: [
          {
            place_id: 'geo-place-1',
            address_line1: 'Thư viện Trung tâm ĐHQG-HCM',
            address_line2: 'Linh Trung, Thủ Đức, TP.HCM, Việt Nam',
            formatted: 'Thư viện Trung tâm ĐHQG-HCM, Linh Trung, Thủ Đức, TP.HCM, Việt Nam',
            country_code: 'vn',
            lat: 10.875,
            lon: 106.801,
          },
        ],
      }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { isGeoapifyConfigured, searchLocations } = await import('./locationService');
    const results = await searchLocations('Thư viện', {
      bias: { lat: 10.87, lng: 106.8 },
    });

    expect(isGeoapifyConfigured).toBe(true);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestedUrl.origin).toBe('https://api.geoapify.com');
    expect(requestedUrl.searchParams.get('filter')).toBe('countrycode:vn');
    expect(requestedUrl.searchParams.get('lang')).toBe('vi');
    expect(requestedUrl.searchParams.get('bias')).toBe('proximity:106.8,10.87');
    expect(requestedUrl.searchParams.get('apiKey')).toBe('test-key-placeholder');
    expect(results[0]).toEqual(expect.objectContaining({
      id: 'geo-place-1',
      provider: 'geoapify',
      lat: 10.875,
      lng: 106.801,
    }));
  });
});
