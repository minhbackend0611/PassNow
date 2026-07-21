# PassNow location data sources

Last reviewed: 2026-07-15

## Decision

PassNow treats university campuses and free-form addresses as two different data problems:

- **University campus:** use the checked-in registry in `src/constants/universities.ts`. A campus name/address must come from the university's official website and include a source URL plus verification date.
- **Address autocomplete and GPS:** use a geocoding provider through `src/services/locationService.ts`. Geoapify is preferred when `VITE_GEOAPIFY_API_KEY` is configured; Photon is a best-effort development fallback.

PassNow intentionally does not expose an interactive map picker. It added another failure-prone client dependency without improving the authority of campus data. Sellers choose a verified campus, confirm an autocomplete result, or use device GPS instead.

A geocoder result must never be interpreted as the complete list of campuses for a university. OpenStreetMap may represent one university as a polygon, several buildings, or separate points, so matching search results are candidates rather than authoritative organization data.

## Source assessment

| Source | Suitable use | Important limitation |
| --- | --- | --- |
| Official university websites | Campus/branch names and current postal addresses | No shared schema; requires curation and periodic review |
| Geoapify Address Autocomplete and Reverse Geocoding | Free-form address suggestions and GPS lookup | Requires an API key and attribution; free plan has usage/commercial limits |
| Photon demo server | Local-development fallback for autocomplete/reverse | No availability guarantee; extensive use may be throttled or banned |
| Public Nominatim | Occasional manual lookup only | Public policy forbids client-side autocomplete and limits use to 1 request/second |
| Public Overpass | Offline/admin discovery of possible OSM records | Public instances are not an application backend; OSM records do not guarantee campus completeness |
| Google Places | Consider only if PassNow migrates its map and persistence model to Google's terms | Billing required; Places content has map/display and caching restrictions |
| Hipo university list | Profile school-name suggestions | Contains universities/domains, not campuses or verified coordinates |

Primary references:

- Geoapify autocomplete: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
- Geoapify pricing: https://www.geoapify.com/pricing/
- Photon demo-server policy: https://github.com/komoot/photon#demo-server
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Overpass public-instance guidance: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
- OSM university tagging: https://wiki.openstreetmap.org/wiki/Tag%3Aamenity%3Duniversity
- Google Places policies: https://developers.google.com/maps/documentation/places/web-service/policies
- Hipo university list: https://github.com/Hipo/university-domains-list

## Campus registry rules

Each university must have:

- one stable, unique university ID;
- aliases/domains that resolve to exactly one university;
- one official source URL and `verifiedAt` date;
- stable, unique campus IDs;
- the current official postal address and region;
- coordinates only when they have been reviewed. If coordinates are missing, PassNow commits the verified campus address without coordinates and does not guess from a geocoder result.

The UI must not auto-select the first campus when several exist. A campus is committed only after the seller explicitly selects it and presses the confirmation button.

Current official registry references include:

- HCMUT campuses: https://cse.hcmut.edu.vn/en/contactus
- UEH address update effective 2025-07-01: https://ibr.ueh.edu.vn/english/news/announcement-on-the-update-of-campus-addresses-for-university-of-economics-ho-chi-minh-city-ueh-from-july-1-2025/
- FPT University campuses: https://daihoc.fpt.edu.vn/en/contact/
- RMIT Vietnam locations: https://www.rmit.edu.vn/contact-us
- HUST: https://www.hust.edu.vn/vi/about/tong-quan.html

Review the registry quarterly and whenever a user reports an incorrect campus. Do not overwrite the address snapshot already stored on an existing listing when the registry changes.

## Geocoder configuration

For Geoapify autocomplete:

- require at least 3 characters;
- debounce requests by about 350 ms;
- use `filter=countrycode:vn`, `lang=vi`, and `limit=6`;
- prefer a real user/campus position for `bias=proximity` when available;
- abort the previous request whenever the query changes;
- display `address_line1` and `address_line2`, not only a place name;
- show the required Geoapify/OpenStreetMap attribution.

Create a browser API key in Geoapify, restrict it to PassNow's allowed origins/referrers/CORS, and put the value only in the local `.env`. Never commit the key. `.env.example` contains only the variable name and placeholder.

## Data integrity and privacy

The typed query is a draft; the listing address remains empty until the user confirms a suggestion, campus, or GPS result. Coordinates are stored only when they come from a confirmed autocomplete/GPS result or a reviewed campus registry entry. Editing a confirmed address immediately clears the old coordinates so a new label cannot be submitted with a stale point.

For a production marketplace, consider splitting the public area label (for example, “HCMUT - Cơ sở Lý Thường Kiệt, Quận 10”) from a private exact meeting point shared only with transaction participants. The current legacy listing model still stores a single `specificAddress` snapshot plus coordinates.
