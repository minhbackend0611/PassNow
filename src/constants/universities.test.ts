import { describe, expect, it } from 'vitest';
import {
  findUniversitiesByName,
  getUniversityByName,
  normalizeUniversityName,
  VIETNAM_UNIVERSITIES,
} from './universities';

describe('university campus registry', () => {
  it('keeps university and campus IDs globally unique', () => {
    const universityIds = VIETNAM_UNIVERSITIES.map((university) => university.id);
    const campusIds = VIETNAM_UNIVERSITIES.flatMap((university) =>
      university.campuses.map((campus) => campus.id),
    );

    expect(new Set(universityIds).size).toBe(universityIds.length);
    expect(new Set(campusIds).size).toBe(campusIds.length);
    expect(VIETNAM_UNIVERSITIES.every((university) => university.campuses.length > 0)).toBe(true);
  });

  it('requires source metadata and valid coordinate pairs for curated campuses', () => {
    for (const university of VIETNAM_UNIVERSITIES) {
      expect(university.source.url).toMatch(/^https:\/\//);
      expect(university.source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      for (const campus of university.campuses) {
        expect(campus.address.trim()).not.toBe('');
        expect(campus.region.trim()).not.toBe('');
        expect(campus.lat === undefined).toBe(campus.lng === undefined);
        if (campus.lat !== undefined && campus.lng !== undefined) {
          expect(campus.lat).toBeGreaterThanOrEqual(8);
          expect(campus.lat).toBeLessThanOrEqual(24);
          expect(campus.lng).toBeGreaterThanOrEqual(102);
          expect(campus.lng).toBeLessThanOrEqual(110);
        }
      }
    }
  });

  it('normalizes Vietnamese diacritics, punctuation, casing, and generic school words', () => {
    expect(normalizeUniversityName('  TRƯỜNG Đại-học BÁCH KHOA  ')).toBe('bach khoa');
    expect(normalizeUniversityName('Ho Chi Minh City University of Technology')).toBe(
      'ho chi minh city technology',
    );
  });

  it('matches precise aliases but refuses to guess an ambiguous Bách Khoa', () => {
    expect(getUniversityByName('HCMUT')?.id).toBe('hcmut');
    expect(getUniversityByName('Bách khoa Hà Nội')?.id).toBe('hust');

    const ambiguousMatches = findUniversitiesByName('Bách Khoa').map((university) => university.id);
    expect(ambiguousMatches).toEqual(expect.arrayContaining(['hcmut', 'hust']));
    expect(getUniversityByName('Bách Khoa')).toBeUndefined();
  });
});
