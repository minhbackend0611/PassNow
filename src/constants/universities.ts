export interface Campus {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface University {
  id: string;
  name: string;
  campuses: Campus[];
}

export const VIETNAM_UNIVERSITIES: University[] = [
  {
    id: 'hcmut',
    name: 'Đại học Bách Khoa TP.HCM',
    campuses: [
      {
        id: 'hcmut-1',
        name: 'Cơ sở Lý Thường Kiệt',
        address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
        lat: 10.77329,
        lng: 106.65969,
      },
      {
        id: 'hcmut-2',
        name: 'Cơ sở Dĩ An',
        address: 'Khu đô thị ĐHQG-HCM, Dĩ An, Bình Dương',
        lat: 10.88056,
        lng: 106.80528,
      },
    ],
  },
  {
    id: 'hust',
    name: 'Đại học Bách Khoa Hà Nội',
    campuses: [
      {
        id: 'hust-1',
        name: 'Trụ sở chính',
        address: '1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
        lat: 21.00713,
        lng: 105.84277,
      },
    ],
  },
  {
    id: 'fptu',
    name: 'Đại học FPT',
    campuses: [
      {
        id: 'fptu-hn',
        name: 'Cơ sở Hà Nội',
        address: 'Khu Giáo dục và Đào tạo, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội',
        lat: 21.01300,
        lng: 105.52686,
      },
      {
        id: 'fptu-hcm',
        name: 'Cơ sở TP.HCM',
        address: 'Đường D1, Khu CNC, Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM',
        lat: 10.84107,
        lng: 106.80980,
      },
      {
        id: 'fptu-dn',
        name: 'Cơ sở Đà Nẵng',
        address: 'Khu Đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng',
        lat: 15.96871,
        lng: 108.26085,
      },
      {
        id: 'fptu-ct',
        name: 'Cơ sở Cần Thơ',
        address: '600 Nguyễn Văn Cừ, An Bình, Ninh Kiều, Cần Thơ',
        lat: 10.00756,
        lng: 105.74837,
      },
    ],
  },
  {
    id: 'ueh',
    name: 'Đại học Kinh tế TP.HCM (UEH)',
    campuses: [
      {
        id: 'ueh-a',
        name: 'Cơ sở A',
        address: '59C Nguyễn Đình Chiểu, Phường 6, Quận 3, TP.HCM',
        lat: 10.78283,
        lng: 106.69176,
      },
      {
        id: 'ueh-b',
        name: 'Cơ sở B',
        address: '279 Nguyễn Tri Phương, Phường 5, Quận 10, TP.HCM',
        lat: 10.76127,
        lng: 106.66759,
      },
      {
        id: 'ueh-n',
        name: 'Cơ sở Nguyễn Văn Linh',
        address: 'Khu chức năng số 15, Đô thị mới Nam thành phố, Phong Phú, Bình Chánh, TP.HCM',
        lat: 10.71350,
        lng: 106.65780,
      }
    ]
  },
  {
    id: 'uit',
    name: 'Đại học Công nghệ Thông tin (UIT)',
    campuses: [
      {
        id: 'uit-1',
        name: 'Trụ sở chính',
        address: 'Khu phố 6, Linh Trung, Thủ Đức, TP.HCM',
        lat: 10.87002,
        lng: 106.80295,
      }
    ]
  },
  {
    id: 'rmit',
    name: 'RMIT University Vietnam',
    campuses: [
      {
        id: 'rmit-sgs',
        name: 'Saigon South Campus',
        address: '702 Nguyễn Văn Linh, Tân Hưng, Quận 7, TP.HCM',
        lat: 10.72922,
        lng: 106.69582,
      },
      {
        id: 'rmit-hn',
        name: 'Hanoi Campus',
        address: 'Tòa nhà Handi Resco, 521 Kim Mã, Ba Đình, Hà Nội',
        lat: 21.03159,
        lng: 105.81177,
      }
    ]
  }
];

export const getUniversityByName = (name: string): University | undefined => {
  return VIETNAM_UNIVERSITIES.find(u => u.name.toLowerCase() === name.toLowerCase());
};
