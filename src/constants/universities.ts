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

const VERIFIED_AT = '2026-08-04';

export const VIETNAM_UNIVERSITIES: University[] = [
  {
    id: 'hcmut',
    name: 'Trường Đại học Bách khoa - ĐHQG TP.HCM',
    aliases: ['Đại học Bách Khoa TP.HCM', 'Ho Chi Minh City University of Technology', 'HCMUT', 'Bách khoa TP.HCM', 'VNUHCM-HCMUT', 'Bach khoa TPHCM', 'ĐH Bách Khoa', 'University of Technology'],
    domains: ['hcmut.edu.vn'],
    source: { label: 'HCMUT official website', url: 'https://cse.hcmut.edu.vn/en/contactus', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'hcmut-ly-thuong-kiet', name: 'Cơ sở Lý Thường Kiệt', address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM', region: 'TP.HCM', lat: 10.772584, lng: 106.657891 },
      { id: 'hcmut-di-an', name: 'Cơ sở Dĩ An', address: 'Khu đô thị ĐHQG-HCM, Phường Đông Hòa, TP. Dĩ An, Bình Dương', region: 'Bình Dương', lat: 10.880491, lng: 106.805372 }
    ]
  },
  {
    id: 'hust',
    name: 'Đại học Bách khoa Hà Nội',
    aliases: ['Hanoi University of Science and Technology', 'HUST', 'Bách khoa Hà Nội', 'Đại học Bách Khoa Hà Nội', 'Hanoi University of Technology'],
    domains: ['hust.edu.vn'],
    source: { label: 'HUST official website', url: 'https://www.hust.edu.vn/vi/about/tong-quan.html', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'hust-dai-co-viet', name: 'Khuôn viên Đại Cồ Việt', address: 'Số 1 Đại Cồ Việt, Phường Bạch Mai, Quận Hai Bà Trưng, Hà Nội', region: 'Hà Nội', lat: 21.00713, lng: 105.84277 }
    ]
  },
  {
    id: 'fptu',
    name: 'Trường Đại học FPT',
    aliases: ['FPT University', 'Đại học FPT', 'FPTU', 'Truong Dai hoc FPT'],
    domains: ['fpt.edu.vn', 'fe.edu.vn'],
    source: { label: 'FPT University official campus list', url: 'https://daihoc.fpt.edu.vn/en/contact/', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'fptu-hanoi', name: 'Campus Hà Nội', address: 'Khu Giáo dục và Đào tạo – Khu Công nghệ cao Hòa Lạc – Km29 Đại lộ Thăng Long, H. Thạch Thất, Hà Nội', region: 'Hà Nội', lat: 21.012586, lng: 105.526978 },
      { id: 'fptu-hcm', name: 'Campus TP.HCM', address: 'Lô E2a-7, Đường D1, Khu Công nghệ cao, P.Long Thạnh Mỹ, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.841127, lng: 106.809883 },
      { id: 'fptu-danang', name: 'Campus Đà Nẵng', address: 'Khu đô thị FPT City, Phường Hòa Hải, Quận Ngũ Hành Sơn, Đà Nẵng', region: 'Đà Nẵng', lat: 15.968697, lng: 108.258671 },
      { id: 'fptu-cantho', name: 'Campus Cần Thơ', address: 'Số 600 Đường Nguyễn Văn Cừ, Phường An Bình, Quận Ninh Kiều, TP. Cần Thơ', region: 'Cần Thơ', lat: 10.012513, lng: 105.733076 },
      { id: 'fptu-quynhon', name: 'Campus Quy Nhơn', address: 'Khu đô thị mới An Phú Thịnh, Phường Nhơn Bình & Phường Đống Đa, TP. Quy Nhơn, Bình Định', region: 'Bình Định', lat: 13.791557, lng: 109.245842 }
    ]
  },
  {
    id: 'ueh',
    name: 'Đại học Kinh tế Thành phố Hồ Chí Minh',
    aliases: ['University of Economics Ho Chi Minh City', 'UEH', 'Kinh tế TP.HCM', 'ĐH Kinh tế TP.HCM', 'Dai hoc Kinh te TPHCM'],
    domains: ['ueh.edu.vn'],
    source: { label: 'UEH official website', url: 'https://www.ueh.edu.vn/', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'ueh-a', name: 'Cơ sở A', address: '59C Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP.HCM', region: 'TP.HCM', lat: 10.782877, lng: 106.691341 },
      { id: 'ueh-b', name: 'Cơ sở B', address: '279 Nguyễn Tri Phương, Phường 5, Quận 10, TP.HCM', region: 'TP.HCM', lat: 10.761899, lng: 106.666993 },
      { id: 'ueh-c', name: 'Cơ sở C', address: '91 Đường 3/2, Phường 11, Quận 10, TP.HCM', region: 'TP.HCM', lat: 10.7712, lng: 106.6789 },
      { id: 'ueh-v', name: 'Cơ sở V', address: '232/6 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP.HCM', region: 'TP.HCM', lat: 10.785, lng: 106.690 },
      { id: 'ueh-n', name: 'Cơ sở N (Nam Sài Gòn)', address: 'Khu chức năng 15, Đô thị mới Nam thành phố, xã Phong Phú, huyện Bình Chánh, TP.HCM', region: 'TP.HCM', lat: 10.7135, lng: 106.6584 }
    ]
  },
  {
    id: 'rmit',
    name: 'RMIT University Vietnam',
    aliases: ['Đại học RMIT', 'RMIT Vietnam', 'Đại học RMIT Việt Nam'],
    domains: ['rmit.edu.vn'],
    source: { label: 'RMIT official website', url: 'https://www.rmit.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'rmit-sgs', name: 'Saigon South Campus', address: '702 Đại lộ Nguyễn Văn Linh, Quận 7, TP.HCM', region: 'TP.HCM', lat: 10.730248, lng: 106.694639 },
      { id: 'rmit-hanoi', name: 'Hanoi Campus', address: 'Handi Resco Building, 521 Kim Mã, Quận Ba Đình, Hà Nội', region: 'Hà Nội', lat: 21.028682, lng: 105.811804 },
      { id: 'rmit-danang', name: 'Danang Campus', address: 'FHome Building, 16 Lý Thường Kiệt, Quận Hải Châu, Đà Nẵng', region: 'Đà Nẵng', lat: 16.0792, lng: 108.2198 }
    ]
  },
  {
    id: 'uit',
    name: 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM',
    aliases: ['University of Information Technology', 'UIT', 'Đại học CNTT', 'VNUHCM-UIT'],
    domains: ['uit.edu.vn'],
    source: { label: 'UIT official website', url: 'https://www.uit.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'uit-linh-trung', name: 'Cơ sở Linh Trung', address: 'Khu phố 6, Phường Linh Trung, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.870008, lng: 106.803054 }
    ]
  },
  {
    id: 'hcmus',
    name: 'Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM',
    aliases: ['Ho Chi Minh City University of Science', 'HCMUS', 'VNUHCM-HCMUS', 'Đại học KHTN', 'KHTN', 'ĐH Khoa học Tự nhiên'],
    domains: ['hcmus.edu.vn'],
    source: { label: 'HCMUS official website', url: 'https://www.hcmus.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'hcmus-nvc', name: 'Cơ sở Nguyễn Văn Cừ', address: '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM', region: 'TP.HCM', lat: 10.762622, lng: 106.681720 },
      { id: 'hcmus-lt', name: 'Cơ sở Linh Trung', address: 'Khu phố 6, Phường Linh Trung, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.875704, lng: 106.799049 }
    ]
  },
  {
    id: 'tdtu',
    name: 'Đại học Tôn Đức Thắng',
    aliases: ['Ton Duc Thang University', 'TDTU', 'Đại học TĐT', 'Ton Duc Thang'],
    domains: ['tdtu.edu.vn'],
    source: { label: 'TDTU official website', url: 'https://tdtu.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'tdtu-tan-phong', name: 'Cơ sở Tân Phong', address: '19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP.HCM', region: 'TP.HCM', lat: 10.732644, lng: 106.699742 }
    ]
  },
  {
    id: 'hutech',
    name: 'Đại học Công nghệ TP.HCM (HUTECH)',
    aliases: ['Ho Chi Minh City University of Technology', 'HUTECH', 'Ho Chi Minh City University of Technology (HUTECH)', 'Đại học Hutech'],
    domains: ['hutech.edu.vn'],
    source: { label: 'Hutech official website', url: 'https://hutech.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'hutech-hq', name: 'Trụ sở chính', address: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM', region: 'TP.HCM', lat: 10.80164, lng: 106.71447 },
      { id: 'hutech-e3', name: 'Khu Công nghệ cao (E3)', address: 'Đường E3, Phường Long Thạnh Mỹ, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.85215, lng: 106.80415 }
    ]
  },
  {
    id: 'neu',
    name: 'Đại học Kinh tế Quốc dân',
    aliases: ['National Economics University', 'NEU', 'Đại học KTQD', 'Kinh tế Quốc dân'],
    domains: ['neu.edu.vn'],
    source: { label: 'NEU official website', url: 'https://neu.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'neu-hq', name: 'Trụ sở chính', address: '207 Giải Phóng, Đồng Tâm, Quận Hai Bà Trưng, Hà Nội', region: 'Hà Nội', lat: 21.000185, lng: 105.842345 }
    ]
  },
  {
    id: 'ftu',
    name: 'Đại học Ngoại thương',
    aliases: ['Foreign Trade University', 'FTU', 'Đại học Ngoại thương Hà Nội', 'Đại học Ngoại thương TP.HCM'],
    domains: ['ftu.edu.vn'],
    source: { label: 'FTU official website', url: 'https://ftu.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'ftu-hn', name: 'Trụ sở chính Hà Nội', address: '91 Chùa Láng, Láng Thượng, Quận Đống Đa, Hà Nội', region: 'Hà Nội', lat: 21.023249, lng: 105.804683 },
      { id: 'ftu-hcm', name: 'Cơ sở 2 TP.HCM', address: '15 Đường D5, Phường 25, Quận Bình Thạnh, TP.HCM', region: 'TP.HCM', lat: 10.803882, lng: 106.716301 }
    ]
  },
  {
    id: 'ussh-hcm',
    name: 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM',
    aliases: ['University of Social Sciences and Humanities', 'USSH', 'VNUHCM-USSH', 'KHXH&NV', 'Đại học Nhân văn TP.HCM', 'ĐHKHXHNV'],
    domains: ['hcmussh.edu.vn'],
    source: { label: 'USSH official website', url: 'https://hcmussh.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'ussh-q1', name: 'Cơ sở Đinh Tiên Hoàng', address: '10-12 Đinh Tiên Hoàng, Phường Bến Nghé, Quận 1, TP.HCM', region: 'TP.HCM', lat: 10.786596, lng: 106.701832 },
      { id: 'ussh-td', name: 'Cơ sở Linh Trung', address: 'Khu phố 6, Phường Linh Trung, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.871587, lng: 106.802905 }
    ]
  },
  {
    id: 'vlu',
    name: 'Đại học Văn Lang',
    aliases: ['Van Lang University', 'VLU', 'ĐH Văn Lang'],
    domains: ['vlu.edu.vn'],
    source: { label: 'VLU official website', url: 'https://vlu.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'vlu-cs3', name: 'Cơ sở chính (CS3)', address: '69/68 Đặng Thùy Trâm, Phường 13, Quận Bình Thạnh, TP.HCM', region: 'TP.HCM', lat: 10.824838, lng: 106.700305 },
      { id: 'vlu-cs1', name: 'Cơ sở 1', address: '45 Nguyễn Khắc Nhu, Phường Cô Giang, Quận 1, TP.HCM', region: 'TP.HCM', lat: 10.761044, lng: 106.692348 }
    ]
  },
  {
    id: 'ump',
    name: 'Đại học Y Dược TP.HCM',
    aliases: ['University of Medicine and Pharmacy at Ho Chi Minh City', 'UMP', 'Đại học Y Dược', 'Y Dược TP.HCM'],
    domains: ['ump.edu.vn'],
    source: { label: 'UMP official website', url: 'https://ump.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'ump-hq', name: 'Cơ sở chính', address: '217 Hồng Bàng, Phường 11, Quận 5, TP.HCM', region: 'TP.HCM', lat: 10.755495, lng: 106.664406 }
    ]
  },
  {
    id: 'hcmiu',
    name: 'Trường Đại học Quốc Tế - ĐHQG TP.HCM',
    aliases: ['International University', 'IU', 'VNUHCM-IU', 'Đại học Quốc tế TP.HCM'],
    domains: ['hcmiu.edu.vn'],
    source: { label: 'IU official website', url: 'https://hcmiu.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'hcmiu-hq', name: 'Cơ sở chính', address: 'Khu phố 6, Phường Linh Trung, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.880491, lng: 106.797276 }
    ]
  },
  {
    id: 'hcmute',
    name: 'Đại học Sư phạm Kỹ thuật TP.HCM',
    aliases: ['Ho Chi Minh City University of Technology and Education', 'HCMUTE', 'SPKT', 'ĐH Sư phạm Kỹ thuật'],
    domains: ['hcmute.edu.vn'],
    source: { label: 'HCMUTE official website', url: 'https://hcmute.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'hcmute-hq', name: 'Cơ sở chính', address: '1 Võ Văn Ngân, Phường Linh Chiểu, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.850409, lng: 106.771891 }
    ]
  },
  {
    id: 'uel',
    name: 'Trường Đại học Kinh tế - Luật - ĐHQG TP.HCM',
    aliases: ['University of Economics and Law', 'UEL', 'VNUHCM-UEL', 'Kinh tế Luật'],
    domains: ['uel.edu.vn'],
    source: { label: 'UEL official website', url: 'https://uel.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'uel-hq', name: 'Cơ sở chính', address: 'Khu phố 3, Phường Linh Xuân, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.871032, lng: 106.778174 }
    ]
  },
  {
    id: 'nlu',
    name: 'Đại học Nông Lâm TP.HCM',
    aliases: ['Nong Lam University', 'NLU', 'Đại học Nông Lâm'],
    domains: ['hcmuaf.edu.vn'],
    source: { label: 'NLU official website', url: 'https://hcmuaf.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'nlu-hq', name: 'Cơ sở chính', address: 'Phường Linh Trung, Tp. Thủ Đức, TP.HCM', region: 'TP.HCM', lat: 10.869715, lng: 106.796336 }
    ]
  },
  {
    id: 'sgu',
    name: 'Đại học Sài Gòn',
    aliases: ['Saigon University', 'SGU', 'ĐH Sài Gòn'],
    domains: ['sgu.edu.vn'],
    source: { label: 'SGU official website', url: 'https://sgu.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'sgu-hq', name: 'Cơ sở chính', address: '273 An Dương Vương, Phường 3, Quận 5, TP.HCM', region: 'TP.HCM', lat: 10.759495, lng: 106.680674 }
    ]
  },
  {
    id: 'hcmou',
    name: 'Đại học Mở TP.HCM',
    aliases: ['Ho Chi Minh City Open University', 'HCMOU', 'OU', 'Đại học Mở'],
    domains: ['ou.edu.vn'],
    source: { label: 'OU official website', url: 'https://ou.edu.vn', verifiedAt: VERIFIED_AT },
    campuses: [
      { id: 'ou-hq', name: 'Cơ sở 97 Võ Văn Tần', address: '97 Võ Văn Tần, Phường 6, Quận 3, TP.HCM', region: 'TP.HCM', lat: 10.776669, lng: 106.690558 },
      { id: 'ou-nkh', name: 'Cơ sở Nguyễn Kiệm', address: '371 Nguyễn Kiệm, Phường 3, Quận Gò Vấp, TP.HCM', region: 'TP.HCM', lat: 10.814324, lng: 106.678129 }
    ]
  }
];

/**
 * Helper to normalize string for searching: lowercase, remove diacritics
 */
export const normalizeString = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

export const findUniversitiesByName = (rawName: string): University[] => {
  const query = normalizeString(rawName);
  if (!query) return [];

  return VIETNAM_UNIVERSITIES.filter(uni => {
    if (normalizeString(uni.name).includes(query)) return true;
    if (uni.aliases && uni.aliases.some(alias => normalizeString(alias).includes(query))) return true;
    if (uni.campuses.some(campus => normalizeString(campus.name).includes(query))) return true;
    return false;
  });
};

export const getUniversityByName = (name: string): University | undefined => {
  const normalizedQuery = normalizeString(name);
  return VIETNAM_UNIVERSITIES.find(uni => {
    if (normalizeString(uni.name) === normalizedQuery) return true;
    if (uni.aliases && uni.aliases.some(alias => normalizeString(alias) === normalizedQuery)) return true;
    return false;
  });
};
