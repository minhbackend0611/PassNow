export type CampusKind = 'campus' | 'branch' | 'learning_center';

export interface Campus {
  id: string;
  name: string;
  address: string;
  region: string;
  kind?: CampusKind;
  lat?: number;
  lng?: number;
}

export interface UniversitySource {
  label: string;
  url: string;
  verifiedAt: string;
}

export interface University {
  id: string;
  name: string;
  aliases?: string[];
  domains?: string[];
  source: UniversitySource;
  campuses: Campus[];
}

const VERIFIED_AT = '2026-07-15';

/**
 * Campus names and addresses are curated from each university's official site.
 * Coordinates are optional because an official address is more trustworthy than
 * silently attaching an uncertain geocoder result. When coordinates have not
 * been reviewed, PassNow stores the verified campus address without coordinates.
 */
export const VIETNAM_UNIVERSITIES: University[] = [
  {
    id: 'hcmut',
    name: 'Trường Đại học Bách khoa - ĐHQG TP.HCM',
    aliases: [
      'Đại học Bách Khoa TP.HCM',
      'Ho Chi Minh City University of Technology',
      'Ho Chi Minh City University of Technology - VNUHCM',
      'HCMUT',
      'Bách khoa TP.HCM',
    ],
    domains: ['hcmut.edu.vn'],
    source: {
      label: 'HCMUT official website',
      url: 'https://cse.hcmut.edu.vn/en/contactus',
      verifiedAt: VERIFIED_AT,
    },
    campuses: [
      {
        id: 'hcmut-ly-thuong-kiet',
        name: 'Cơ sở Lý Thường Kiệt',
        address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
        region: 'TP.HCM',
        lat: 10.772584,
        lng: 106.657891,
      },
      {
        id: 'hcmut-di-an',
        name: 'Cơ sở Dĩ An',
        address: 'Khu đô thị ĐHQG-HCM, Phường Đông Hòa, TP. Dĩ An, Bình Dương',
        region: 'Bình Dương',
        lat: 10.880491,
        lng: 106.805372,
      },
    ],
  },
  {
    id: 'hust',
    name: 'Đại học Bách khoa Hà Nội',
    aliases: ['Hanoi University of Science and Technology', 'HUST', 'Bách khoa Hà Nội'],
    domains: ['hust.edu.vn'],
    source: {
      label: 'HUST official website',
      url: 'https://www.hust.edu.vn/vi/about/tong-quan.html',
      verifiedAt: VERIFIED_AT,
    },
    campuses: [
      {
        id: 'hust-dai-co-viet',
        name: 'Khuôn viên Đại Cồ Việt',
        address: 'Số 1 Đại Cồ Việt, Phường Bạch Mai, Hà Nội',
        region: 'Hà Nội',
        lat: 21.00713,
        lng: 105.84277,
      },
    ],
  },
  {
    id: 'fptu',
    name: 'Trường Đại học FPT',
    aliases: ['FPT University', 'Đại học FPT', 'FPTU'],
    domains: ['fpt.edu.vn', 'fe.edu.vn'],
    source: {
      label: 'FPT University official campus list',
      url: 'https://daihoc.fpt.edu.vn/en/contact/',
      verifiedAt: VERIFIED_AT,
    },
    campuses: [
      {
        id: 'fptu-hoa-lac',
        name: 'Campus Hà Nội',
        address: 'Khu Giáo dục và Đào tạo, Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Xã Hòa Lạc, Hà Nội',
        region: 'Hà Nội',
        lat: 21.013,
        lng: 105.52686,
      },
      {
        id: 'fptu-hcm',
        name: 'Campus TP.HCM',
        address: 'Lô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP.HCM',
        region: 'TP.HCM',
        lat: 10.84107,
        lng: 106.8098,
      },
      {
        id: 'fptu-da-nang',
        name: 'Campus Đà Nẵng',
        address: 'Khu đô thị công nghệ FPT Đà Nẵng, Phường Ngũ Hành Sơn, Đà Nẵng',
        region: 'Đà Nẵng',
        lat: 15.96871,
        lng: 108.26085,
      },
      {
        id: 'fptu-can-tho',
        name: 'Campus Cần Thơ',
        address: '600 Nguyễn Văn Cừ nối dài, Phường An Bình, Cần Thơ',
        region: 'Cần Thơ',
        lat: 10.00756,
        lng: 105.74837,
      },
      {
        id: 'fptu-quy-nhon',
        name: 'Campus Quy Nhơn',
        address: 'Khu đô thị mới An Phú Thịnh, Phường Quy Nhơn Đông, Gia Lai',
        region: 'Gia Lai',
      },
    ],
  },
  {
    id: 'ueh',
    name: 'Đại học Kinh tế Thành phố Hồ Chí Minh (UEH)',
    aliases: [
      'University of Economics Ho Chi Minh City',
      'Ho Chi Minh City University of Economics',
      'UEH',
      'Đại học Kinh tế TP.HCM',
      'ĐH Kinh tế',
    ],
    domains: ['ueh.edu.vn'],
    source: {
      label: 'UEH campus address notice effective July 1, 2025',
      url: 'https://ibr.ueh.edu.vn/english/news/announcement-on-the-update-of-campus-addresses-for-university-of-economics-ho-chi-minh-city-ueh-from-july-1-2025/',
      verifiedAt: VERIFIED_AT,
    },
    campuses: [
      {
        id: 'ueh-a',
        name: 'Cơ sở A',
        address: '59C Nguyễn Đình Chiểu, Phường Xuân Hòa, TP.HCM',
        region: 'TP.HCM',
        lat: 10.782873,
        lng: 106.694371,
      },
      {
        id: 'ueh-b',
        name: 'Cơ sở B',
        address: '279 Nguyễn Tri Phương, Phường Diên Hồng, TP.HCM',
        region: 'TP.HCM',
        lat: 10.761596,
        lng: 106.667232,
      },
      { id: 'ueh-c', name: 'Cơ sở C', address: '91 Đường 3/2, Phường Vườn Lài, TP.HCM', region: 'TP.HCM' },
      { id: 'ueh-d', name: 'Cơ sở D', address: '196 Trần Quang Khải, Phường Tân Định, TP.HCM', region: 'TP.HCM' },
      { id: 'ueh-e', name: 'Cơ sở E', address: '54 Nguyễn Văn Thủ, Phường Tân Định, TP.HCM', region: 'TP.HCM' },
      { id: 'ueh-h', name: 'Cơ sở H', address: '1A Hoàng Diệu, Phường Phú Nhuận, TP.HCM', region: 'TP.HCM' },
      { id: 'ueh-i', name: 'Cơ sở I', address: '17 Phạm Ngọc Thạch, Phường Xuân Hòa, TP.HCM', region: 'TP.HCM' },
      {
        id: 'ueh-n',
        name: 'Cơ sở N - Nguyễn Văn Linh',
        address: 'Đường Nguyễn Văn Linh, Khu chức năng số 15, Xã Bình Hưng, TP.HCM',
        region: 'TP.HCM',
        lat: 10.716167,
        lng: 106.661271,
      },
      { id: 'ueh-v', name: 'Cơ sở V', address: '232/6 Võ Thị Sáu, Phường Xuân Hòa, TP.HCM', region: 'TP.HCM' },
      { id: 'ueh-pham-duc-son', name: 'Cơ sở Phạm Đức Sơn', address: '144 Phạm Đức Sơn, Phường Phú Định, TP.HCM', region: 'TP.HCM' },
      {
        id: 'ueh-mekong-1',
        name: 'UEH Mekong - Cơ sở 1',
        address: '1B Nguyễn Trung Trực, Phường Tân Hạnh, Vĩnh Long',
        region: 'Vĩnh Long',
        kind: 'branch',
      },
      {
        id: 'ueh-mekong-2',
        name: 'UEH Mekong - Cơ sở 2',
        address: 'Phường Phước Hậu, Vĩnh Long',
        region: 'Vĩnh Long',
        kind: 'branch',
      },
      {
        id: 'ueh-nexus-nha-trang',
        name: 'UEH Nexus Nha Trang',
        address: 'Khu trường học, đào tạo và dạy nghề Bắc Hòn Ông, Phường Nam Nha Trang, Khánh Hòa',
        region: 'Khánh Hòa',
        kind: 'learning_center',
      },
    ],
  },
  {
    id: 'uit',
    name: 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM',
    aliases: ['University of Information Technology', 'UIT', 'UIT VNUHCM', 'Đại học Công nghệ Thông tin'],
    domains: ['uit.edu.vn'],
    source: {
      label: 'UIT official website',
      url: 'https://inseclab.uit.edu.vn/contact-us/',
      verifiedAt: VERIFIED_AT,
    },
    campuses: [
      {
        id: 'uit-linh-trung',
        name: 'Cơ sở Linh Trung',
        address: 'Số 1 Đường Hàn Thuyên, Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP.HCM',
        region: 'TP.HCM',
        lat: 10.87002,
        lng: 106.80295,
      },
    ],
  },
  {
    id: 'rmit-vietnam',
    name: 'RMIT University Vietnam',
    aliases: ['RMIT Vietnam', 'RMIT'],
    domains: ['rmit.edu.vn'],
    source: {
      label: 'RMIT Vietnam official campus list',
      url: 'https://www.rmit.edu.vn/contact-us',
      verifiedAt: VERIFIED_AT,
    },
    campuses: [
      {
        id: 'rmit-saigon-south',
        name: 'Saigon South Campus',
        address: '702 Nguyễn Văn Linh, Phường Tân Hưng, TP.HCM',
        region: 'TP.HCM',
        lat: 10.72922,
        lng: 106.69582,
      },
      {
        id: 'rmit-hanoi',
        name: 'Hanoi Campus',
        address: 'Tòa nhà Handi Resco, 521 Kim Mã, Ba Đình, Hà Nội',
        region: 'Hà Nội',
        lat: 21.03159,
        lng: 105.81177,
      },
    ],
  },
  {
    id: 'hcmus',
    name: 'Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM',
    aliases: ['University of Science VNUHCM', 'VNUHCM University of Science', 'HCMUS', 'Đại học Khoa học Tự nhiên'],
    domains: ['hcmus.edu.vn'],
    source: {
      label: 'HCMUS official website',
      url: 'https://hcmus.edu.vn/lich-xe-di-co-so-linh-trung-thu-duc-va-ve-227-nguyen-van-cu-tu-10-8-den-05-9-2020/',
      verifiedAt: VERIFIED_AT,
    },
    campuses: [
      {
        id: 'hcmus-nguyen-van-cu',
        name: 'Cơ sở Nguyễn Văn Cừ',
        address: '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM',
        region: 'TP.HCM',
        lat: 10.762886,
        lng: 106.682496,
      },
      {
        id: 'hcmus-linh-trung',
        name: 'Cơ sở Linh Trung',
        address: 'Khu đô thị ĐHQG-HCM, Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP.HCM',
        region: 'TP.HCM',
        lat: 10.876127,
        lng: 106.799787,
      },
    ],
  },
];

const NORMALIZATION_STOP_WORDS = new Set([
  'truong',
  'dai',
  'hoc',
  'university',
  'of',
  'the',
]);

export const normalizeUniversityName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token && !NORMALIZATION_STOP_WORDS.has(token))
    .join(' ');

const universityLabels = (university: University) => [university.name, ...(university.aliases || [])];

export const findUniversitiesByName = (rawName: string): University[] => {
  const name = normalizeUniversityName(rawName);
  if (!name) return [];

  const scored = VIETNAM_UNIVERSITIES.map((university) => {
    const labels = universityLabels(university).map(normalizeUniversityName).filter(Boolean);
    const score = labels.reduce((best, label) => {
      if (label === name) return Math.max(best, 100);
      if (name.length >= 4 && (label.includes(name) || name.includes(label))) return Math.max(best, 70);
      return best;
    }, 0);
    return { university, score };
  }).filter(({ score }) => score > 0);

  if (!scored.length) return [];
  const bestScore = Math.max(...scored.map(({ score }) => score));
  return scored.filter(({ score }) => score === bestScore).map(({ university }) => university);
};

/** Returns a university only when the normalized match is unambiguous. */
export const getUniversityByName = (name: string): University | undefined => {
  const matches = findUniversitiesByName(name);
  return matches.length === 1 ? matches[0] : undefined;
};
