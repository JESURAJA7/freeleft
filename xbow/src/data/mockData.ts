import type{Vehicle} from '../types/index'

export const mockLoadProviders = [
  {
    id: 'lp001',
    name: 'Rajesh Kumar',
    email: 'rajesh@steelcorp.com',
    phone: '9876543210',
    whatsappNumber: '9876543210',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-03-15',
    companyName: 'Steel Corp Industries',
    totalLoadsPosted: 45,
    profileCompleted: true,
    address: {
      street: 'Plot No. 15, Industrial Area Phase-1',
      city: 'Gurgaon',
      state: 'Haryana',
      pincode: '122001',
      landmark: 'Near Hero Honda Chowk'
    },
    businessDetails: {
      companyName: 'Steel Corp Industries',
      businessType: 'manufacturer',
      gstNumber: '06AABCS1234C1Z5',
      panNumber: 'AABCS1234C',
      registrationNumber: 'U27109HR2018PTC075234'
    },
    createdAt: '2024-11-15'
  },
  {
    id: 'lp002',
    name: 'Priya Sharma',
    email: 'priya@textiletrade.com',
    phone: '9123456789',
    whatsappNumber: '9123456789',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-02-28',
    companyName: 'Textile Trade Hub',
    totalLoadsPosted: 32,
    profileCompleted: true,
    address: {
      street: '45, Commercial Complex, Ring Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395007',
      landmark: 'Opposite City Mall'
    },
    businessDetails: {
      companyName: 'Textile Trade Hub',
      businessType: 'trader',
      gstNumber: '24AABCT5678D1Z3',
      panNumber: 'AABCT5678D',
      registrationNumber: 'U17110GJ2019PTC108765'
    },
    createdAt: '2024-12-01'
  },
  {
    id: 'lp003',
    name: 'Amit Patel',
    email: 'amit@chemicalworks.com',
    phone: '9234567890',
    whatsappNumber: '9234567890',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'trial',
    trialDays: 12,
    companyName: 'Chemical Works Ltd',
    totalLoadsPosted: 18,
    profileCompleted: true,
    address: {
      street: 'B-12, GIDC Industrial Estate',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '390003',
      landmark: 'Near GIDC Gate No. 2'
    },
    businessDetails: {
      companyName: 'Chemical Works Ltd',
      businessType: 'manufacturer',
      gstNumber: '24AABCC9876E1Z1',
      panNumber: 'AABCC9876E',
      registrationNumber: 'U24110GJ2020PTC115432'
    },
    createdAt: '2024-12-20'
  },
  {
    id: 'lp004',
    name: 'Sunita Agarwal',
    email: 'sunita@foodprocessing.com',
    phone: '9345678901',
    whatsappNumber: '9345678901',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-04-10',
    companyName: 'Agarwal Food Processing',
    totalLoadsPosted: 67,
    profileCompleted: true,
    address: {
      street: '23, Food Park, Sector 18',
      city: 'Faridabad',
      state: 'Haryana',
      pincode: '121007',
      landmark: 'Near Metro Station'
    },
    businessDetails: {
      companyName: 'Agarwal Food Processing',
      businessType: 'manufacturer',
      gstNumber: '06AABCA4567F1Z8',
      panNumber: 'AABCA4567F',
      registrationNumber: 'U15139HR2017PTC069876'
    },
    createdAt: '2024-10-05'
  },
  {
    id: 'lp005',
    name: 'Vikram Singh',
    email: 'vikram@autoparts.com',
    phone: '9456789012',
    whatsappNumber: '9456789012',
    role: 'load_provider',
    isApproved: false,
    subscriptionStatus: 'inactive',
    companyName: 'Auto Parts Distributors',
    totalLoadsPosted: 0,
    profileCompleted: true,
    address: {
      street: '67, Auto Market, Mayapuri',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110064',
      landmark: 'Near Mayapuri Metro Station'
    },
    businessDetails: {
      companyName: 'Auto Parts Distributors',
      businessType: 'trader',
      gstNumber: '07AABCA7890G1Z2',
      panNumber: 'AABCA7890G',
      registrationNumber: 'U50909DL2021PTC375432'
    },
    createdAt: '2024-12-25'
  },
  {
    id: 'lp006',
    name: 'Meera Reddy',
    email: 'meera@pharmaceuticals.com',
    phone: '9567890123',
    whatsappNumber: '9567890123',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-03-20',
    companyName: 'Reddy Pharmaceuticals',
    totalLoadsPosted: 89,
    profileCompleted: true,
    address: {
      street: 'Plot 45, Pharma City, Genome Valley',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500078',
      landmark: 'Near Shameerpet Lake'
    },
    businessDetails: {
      companyName: 'Reddy Pharmaceuticals',
      businessType: 'manufacturer',
      gstNumber: '36AABCR5432H1Z9',
      panNumber: 'AABCR5432H',
      registrationNumber: 'U24230TG2016PTC104567'
    },
    createdAt: '2024-09-12'
  },
  {
    id: 'lp007',
    name: 'Arjun Gupta',
    email: 'arjun@electronicsmart.com',
    phone: '9678901234',
    whatsappNumber: '9678901234',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'expired',
    subscriptionEndDate: '2024-12-15',
    companyName: 'Electronics Mart',
    totalLoadsPosted: 23,
    profileCompleted: true,
    address: {
      street: '12, Electronics Complex, Nehru Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110019',
      landmark: 'Near Nehru Place Metro'
    },
    businessDetails: {
      companyName: 'Electronics Mart',
      businessType: 'trader',
      gstNumber: '07AABCE6789I1Z4',
      panNumber: 'AABCE6789I',
      registrationNumber: 'U51909DL2019PTC345678'
    },
    createdAt: '2024-08-20'
  },
  {
    id: 'lp008',
    name: 'Kavita Joshi',
    email: 'kavita@furnitureworld.com',
    phone: '9789012345',
    whatsappNumber: '9789012345',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-05-08',
    companyName: 'Furniture World',
    totalLoadsPosted: 156,
    profileCompleted: true,
    address: {
      street: '78, Furniture Market, Kirti Nagar',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110015',
      landmark: 'Near Kirti Nagar Metro Station'
    },
    businessDetails: {
      companyName: 'Furniture World',
      businessType: 'manufacturer',
      gstNumber: '07AABCF8901J1Z6',
      panNumber: 'AABCF8901J',
      registrationNumber: 'U36109DL2015PTC278901'
    },
    createdAt: '2024-07-10'
  },
  {
    id: 'lp009',
    name: 'Ravi Krishnan',
    email: 'ravi@spicesexport.com',
    phone: '9890123456',
    whatsappNumber: '9890123456',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'trial',
    trialDays: 5,
    companyName: 'Spices Export House',
    totalLoadsPosted: 8,
    profileCompleted: true,
    address: {
      street: 'Warehouse 23, Spice Market',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682001',
      landmark: 'Near Marine Drive'
    },
    businessDetails: {
      companyName: 'Spices Export House',
      businessType: 'trader',
      gstNumber: '32AABCS2345K1Z7',
      panNumber: 'AABCS2345K',
      registrationNumber: 'U51909KL2022PTC067890'
    },
    createdAt: '2024-12-22'
  },
  {
    id: 'lp010',
    name: 'Deepak Agrawal',
    email: 'deepak@constructionmaterials.com',
    phone: '9901234567',
    whatsappNumber: '9901234567',
    role: 'load_provider',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-06-15',
    companyName: 'Construction Materials Co.',
    totalLoadsPosted: 234,
    profileCompleted: true,
    address: {
      street: 'Plot 89, Construction Hub, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      landmark: 'Near Electronic City Metro'
    },
    businessDetails: {
      companyName: 'Construction Materials Co.',
      businessType: 'manufacturer',
      gstNumber: '09AABCC3456L1Z8',
      panNumber: 'AABCC3456L',
      registrationNumber: 'U26943UP2014PTC063245'
    },
    createdAt: '2024-06-18'
  }
];

export const mockVehicleOwners = [
  {
    id: 'vo001',
    name: 'Suresh Yadav',
    email: 'suresh@transporters.com',
    phone: '9123456780',
    whatsappNumber: '9123456780',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-03-10',
    totalVehicles: 3,
    preferredOperatingState: 'Maharashtra',
    preferredOperatingDistrict: 'Pune',
    profileCompleted: true,
    address: {
      street: '45, Transport Nagar, Hadapsar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411028',
      landmark: 'Near Hadapsar Bus Depot'
    },
    licenseNumber: 'MH0620220045678',
    licenseExpiry: '2027-08-15',
    ownerType: 'individual',
    bankDetails: {
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      accountHolderName: 'Suresh Yadav'
    },
    createdAt: '2024-10-12'
  },
  {
    id: 'vo002',
    name: 'Ramesh Transport Services',
    email: 'ramesh@rtstransport.com',
    phone: '9234567891',
    whatsappNumber: '9234567891',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-04-05',
    totalVehicles: 8,
    preferredOperatingState: 'Gujarat',
    preferredOperatingDistrict: 'Ahmedabad',
    profileCompleted: true,
    address: {
      street: 'Shop No. 12, Transport Hub, Narol',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382405',
      landmark: 'Near Narol Circle'
    },
    licenseNumber: 'GJ0520210067890',
    licenseExpiry: '2026-12-20',
    ownerType: 'company',
    bankDetails: {
      accountNumber: '2345678901234567',
      ifscCode: 'HDFC0001235',
      bankName: 'HDFC Bank',
      accountHolderName: 'Ramesh Transport Services'
    },
    createdAt: '2024-09-08'
  },
  {
    id: 'vo003',
    name: 'Manjeet Singh',
    email: 'manjeet@punjablogistics.com',
    phone: '9345678902',
    whatsappNumber: '9345678902',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'trial',
    trialDays: 8,
    totalVehicles: 2,
    preferredOperatingState: 'Punjab',
    preferredOperatingDistrict: 'Ludhiana',
    profileCompleted: true,
    address: {
      street: 'House No. 567, Transport Colony',
      city: 'Ludhiana',
      state: 'Punjab',
      pincode: '141001',
      landmark: 'Near Bus Stand'
    },
    licenseNumber: 'PB0320220089012',
    licenseExpiry: '2028-03-10',
    ownerType: 'individual',
    bankDetails: {
      accountNumber: '3456789012345678',
      ifscCode: 'ICIC0001236',
      bankName: 'ICICI Bank',
      accountHolderName: 'Manjeet Singh'
    },
    createdAt: '2024-12-18'
  },
  {
    id: 'vo004',
    name: 'Karnataka Fleet Solutions',
    email: 'info@karnatakafleet.com',
    phone: '9456789013',
    whatsappNumber: '9456789013',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-02-15',
    totalVehicles: 15,
    preferredOperatingState: 'Karnataka',
    preferredOperatingDistrict: 'Bangalore Urban',
    profileCompleted: true,
    address: {
      street: 'No. 234, Logistics Park, Electronic City',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      landmark: 'Near Electronic City Phase 1'
    },
    licenseNumber: 'KA0520190034567',
    licenseExpiry: '2026-09-25',
    ownerType: 'company',
    bankDetails: {
      accountNumber: '4567890123456789',
      ifscCode: 'AXIS0001237',
      bankName: 'Axis Bank',
      accountHolderName: 'Karnataka Fleet Solutions'
    },
    createdAt: '2024-08-15'
  },
  {
    id: 'vo005',
    name: 'Abdul Rahman',
    email: 'abdul@keralatransport.com',
    phone: '9567890124',
    whatsappNumber: '9567890124',
    role: 'vehicle_owner',
    isApproved: false,
    subscriptionStatus: 'inactive',
    totalVehicles: 1,
    preferredOperatingState: 'Kerala',
    preferredOperatingDistrict: 'Ernakulam',
    profileCompleted: true,
    address: {
      street: '89, Transport Junction, Kakkanad',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682030',
      landmark: 'Near Infopark'
    },
    licenseNumber: 'KL0720220056789',
    licenseExpiry: '2027-11-30',
    ownerType: 'individual',
    bankDetails: {
      accountNumber: '5678901234567890',
      ifscCode: 'SBIN0005678',
      bankName: 'State Bank of India',
      accountHolderName: 'Abdul Rahman'
    },
    createdAt: '2024-12-23'
  },
  {
    id: 'vo006',
    name: 'Rajasthan Heavy Movers',
    email: 'contact@rajasthanheavy.com',
    phone: '9678901235',
    whatsappNumber: '9678901235',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-05-20',
    totalVehicles: 12,
    preferredOperatingState: 'Rajasthan',
    preferredOperatingDistrict: 'Jaipur',
    profileCompleted: true,
    address: {
      street: 'Plot 156, Heavy Vehicle Zone, Bhankrota',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302026',
      landmark: 'Near Jaipur-Delhi Highway'
    },
    licenseNumber: 'RJ1420200078901',
    licenseExpiry: '2026-07-18',
    ownerType: 'company',
    bankDetails: {
      accountNumber: '6789012345678901',
      ifscCode: 'PUNB0123456',
      bankName: 'Punjab National Bank',
      accountHolderName: 'Rajasthan Heavy Movers'
    },
    createdAt: '2024-07-25'
  },
  {
    id: 'vo007',
    name: 'Santosh Kumar',
    email: 'santosh@biharlogistics.com',
    phone: '9789012346',
    whatsappNumber: '9789012346',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-03-30',
    totalVehicles: 4,
    preferredOperatingState: 'Bihar',
    preferredOperatingDistrict: 'Patna',
    profileCompleted: true,
    address: {
      street: 'Ward No. 23, Transport Nagar, Bailey Road',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800014',
      landmark: 'Near Danapur Railway Station'
    },
    licenseNumber: 'BR0120210045678',
    licenseExpiry: '2027-05-12',
    ownerType: 'individual',
    bankDetails: {
      accountNumber: '7890123456789012',
      ifscCode: 'BKID0001238',
      bankName: 'Bank of India',
      accountHolderName: 'Santosh Kumar'
    },
    createdAt: '2024-11-03'
  },
  {
    id: 'vo008',
    name: 'Tamil Nadu Cargo',
    email: 'operations@tncargo.com',
    phone: '9890123457',
    whatsappNumber: '9890123457',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-04-25',
    totalVehicles: 20,
    preferredOperatingState: 'Tamil Nadu',
    preferredOperatingDistrict: 'Chennai',
    profileCompleted: true,
    address: {
      street: 'No. 45, Cargo Complex, Ambattur',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600053',
      landmark: 'Near Ambattur Industrial Estate'
    },
    licenseNumber: 'TN0920190067890',
    licenseExpiry: '2026-11-08',
    ownerType: 'company',
    bankDetails: {
      accountNumber: '8901234567890123',
      ifscCode: 'IOBA0001239',
      bankName: 'Indian Overseas Bank',
      accountHolderName: 'Tamil Nadu Cargo'
    },
    createdAt: '2024-06-30'
  },
  {
    id: 'vo009',
    name: 'Ashok Rane',
    email: 'ashok@maharashtratruck.com',
    phone: '9012345678',
    whatsappNumber: '9012345678',
    role: 'vehicle_owner',
    isApproved: false,
    subscriptionStatus: 'inactive',
    totalVehicles: 1,
    preferredOperatingState: 'Maharashtra',
    preferredOperatingDistrict: 'Mumbai',
    profileCompleted: false,
    address: {
      street: '12, Truck Terminal, Bhiwandi',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '421302',
      landmark: 'Near Bhiwandi Junction'
    },
    licenseNumber: 'MH0420220078901',
    licenseExpiry: '2027-09-15',
    ownerType: 'individual',
    createdAt: '2024-12-26'
  },
  {
    id: 'vo010',
    name: 'Odisha Express Logistics',
    email: 'contact@odishaexpress.com',
    phone: '9123456789',
    whatsappNumber: '9123456789',
    role: 'vehicle_owner',
    isApproved: true,
    subscriptionStatus: 'active',
    subscriptionEndDate: '2025-07-12',
    totalVehicles: 6,
    preferredOperatingState: 'Odisha',
    preferredOperatingDistrict: 'Khordha',
    profileCompleted: true,
    address: {
      street: 'Plot 67, Industrial Area, Mancheswar',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751010',
      landmark: 'Near Mancheswar Railway Station'
    },
    licenseNumber: 'OD0520210089012',
    licenseExpiry: '2026-10-22',
    ownerType: 'company',
    bankDetails: {
      accountNumber: '9012345678901234',
      ifscCode: 'UTIB0001240',
      bankName: 'Axis Bank',
      accountHolderName: 'Odisha Express Logistics'
    },
    createdAt: '2024-05-14'
  }
];

export const mockVehicles = [
  {
    id: 'v001',
    ownerId: 'vo001',
    ownerName: 'Suresh Yadav',
    vehicleType: '10-wheel',
    vehicleSize: 14,
    vehicleWeight: 12,
    dimensions: { length: 14, breadth: 6 },
    vehicleNumber: 'MH12AB1234',
    passingLimit: 15,
    availability: 'today',
    isOpen: true,
    tarpaulin: 'two',
    trailerType: 'none',
    preferredOperatingArea: {
      state: 'Maharashtra',
      district: 'Pune',
      place: 'Hadapsar'
    },
    photos: [
      { type: 'front', url: 'https://images.pexels.com/photos/1112597/pexels-photo-1112597.jpeg' },
      { type: 'side', url: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg' },
      { type: 'back', url: 'https://images.pexels.com/photos/1112599/pexels-photo-1112599.jpeg' },
      { type: 'license', url: 'https://images.pexels.com/photos/1112600/pexels-photo-1112600.jpeg' },
      { type: 'rc_book', url: 'https://images.pexels.com/photos/1112601/pexels-photo-1112601.jpeg' }
    ],
    status: 'available',
    isApproved: true,
    createdAt: '2024-10-15'
  },
  {
    id: 'v002',
    ownerId: 'vo002',
    ownerName: 'Ramesh Transport Services',
    vehicleType: '18-wheel',
    vehicleSize: 20,
    vehicleWeight: 25,
    dimensions: { length: 20, breadth: 8 },
    vehicleNumber: 'GJ01CD5678',
    passingLimit: 30,
    availability: 'immediate',
    isOpen: false,
    tarpaulin: 'one',
    trailerType: 'lowbed',
    preferredOperatingArea: {
      state: 'Gujarat',
      district: 'Ahmedabad',
      place: 'Narol'
    },
    photos: [
      { type: 'front', url: 'https://images.pexels.com/photos/1112602/pexels-photo-1112602.jpeg' },
      { type: 'side', url: 'https://images.pexels.com/photos/1112603/pexels-photo-1112603.jpeg' },
      { type: 'back', url: 'https://images.pexels.com/photos/1112604/pexels-photo-1112604.jpeg' },
      { type: 'license', url: 'https://images.pexels.com/photos/1112605/pexels-photo-1112605.jpeg' },
      { type: 'rc_book', url: 'https://images.pexels.com/photos/1112606/pexels-photo-1112606.jpeg' }
    ],
    status: 'assigned',
    isApproved: true,
    createdAt: '2024-09-10'
  },
  {
    id: 'v003',
    ownerId: 'vo003',
    ownerName: 'Manjeet Singh',
    vehicleType: '14-wheel',
    vehicleSize: 17,
    vehicleWeight: 18,
    dimensions: { length: 17, breadth: 7 },
    vehicleNumber: 'PB03EF9012',
    passingLimit: 20,
    availability: 'tomorrow',
    isOpen: true,
    tarpaulin: 'two',
    trailerType: 'semi-lowbed',
    preferredOperatingArea: {
      state: 'Punjab',
      district: 'Ludhiana',
      place: 'Transport Nagar'
    },
    photos: [
      { type: 'front', url: 'https://images.pexels.com/photos/1112607/pexels-photo-1112607.jpeg' },
      { type: 'side', url: 'https://images.pexels.com/photos/1112608/pexels-photo-1112608.jpeg' },
      { type: 'back', url: 'https://images.pexels.com/photos/1112609/pexels-photo-1112609.jpeg' },
      { type: 'license', url: 'https://images.pexels.com/photos/1112610/pexels-photo-1112610.jpeg' },
      { type: 'rc_book', url: 'https://images.pexels.com/photos/1112611/pexels-photo-1112611.jpeg' }
    ],
    status: 'available',
    isApproved: true,
    createdAt: '2024-12-20'
  },
  {
    id: 'v004',
    ownerId: 'vo004',
    ownerName: 'Karnataka Fleet Solutions',
    vehicleType: '20-wheel',
    vehicleSize: 24,
    vehicleWeight: 35,
    dimensions: { length: 24, breadth: 8 },
    vehicleNumber: 'KA05GH3456',
    passingLimit: 40,
    availability: 'immediate',
    isOpen: false,
    tarpaulin: 'none',
    trailerType: 'crane-50t',
    preferredOperatingArea: {
      state: 'Karnataka',
      district: 'Bangalore Urban',
      place: 'Electronic City'
    },
    photos: [
      { type: 'front', url: 'https://images.pexels.com/photos/1112612/pexels-photo-1112612.jpeg' },
      { type: 'side', url: 'https://images.pexels.com/photos/1112613/pexels-photo-1112613.jpeg' },
      { type: 'back', url: 'https://images.pexels.com/photos/1112614/pexels-photo-1112614.jpeg' },
      { type: 'license', url: 'https://images.pexels.com/photos/1112615/pexels-photo-1112615.jpeg' },
      { type: 'rc_book', url: 'https://images.pexels.com/photos/1112616/pexels-photo-1112616.jpeg' }
    ],
    status: 'available',
    isApproved: true,
    createdAt: '2024-08-18'
  }
];

export const mockLoads = [
  {
    id: 'l001',
    loadProviderId: 'lp001',
    loadProviderName: 'Steel Corp Industries',
    loadingLocation: {
      pincode: '122001',
      state: 'Haryana',
      district: 'Gurgaon',
      place: 'Industrial Area Phase-1',
      coordinates: { latitude: 28.4595, longitude: 77.0266 }
    },
    unloadingLocation: {
      pincode: '400001',
      state: 'Maharashtra',
      district: 'Mumbai',
      place: 'Fort',
      coordinates: { latitude: 18.9320, longitude: 72.8347 }
    },
    vehicleRequirement: {
      vehicleType: '14-wheel',
      size: 17,
      trailerType: 'lowbed',
      type: 'multi'
    },
    materials: [
      {
        id: 'm001',
        name: 'Steel Beams',
        dimensions: { length: 20, width: 2, height: 1.5 },
        packType: 'multi',
        totalCount: 50,
        singleWeight: 85,
        totalWeight: 4250,
        photos: [
          { type: 'material_front', url: 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg' },
          { type: 'material_side', url: 'https://images.pexels.com/photos/162554/keys-workshop-mechanic-tools-162554.jpeg' },
          { type: 'material_top', url: 'https://images.pexels.com/photos/162555/keys-workshop-mechanic-tools-162555.jpeg' },
          { type: 'packing_style', url: 'https://images.pexels.com/photos/162556/keys-workshop-mechanic-tools-162556.jpeg' }
        ]
      }
    ],
    loadingDate: '2025-01-15',
    loadingTime: '09:00',
    paymentTerms: 'cod',
    withXBowSupport: true,
    status: 'posted',
    commissionApplicable: true,
    commissionAmount: 3500,
    createdAt: '2024-12-28'
  },
  {
    id: 'l002',
    loadProviderId: 'lp002',
    loadProviderName: 'Textile Trade Hub',
    loadingLocation: {
      pincode: '395007',
      state: 'Gujarat',
      district: 'Surat',
      place: 'Ring Road',
      coordinates: { latitude: 21.1702, longitude: 72.8311 }
    },
    unloadingLocation: {
      pincode: '110019',
      state: 'Delhi',
      district: 'New Delhi',
      place: 'Nehru Place',
      coordinates: { latitude: 28.5494, longitude: 77.2500 }
    },
    vehicleRequirement: {
      vehicleType: '10-wheel',
      size: 14,
      trailerType: 'none',
      type: 'single'
    },
    materials: [
      {
        id: 'm002',
        name: 'Cotton Fabric Rolls',
        dimensions: { length: 12, width: 1.5, height: 1.5 },
        packType: 'multi',
        totalCount: 200,
        singleWeight: 25,
        totalWeight: 5000,
        photos: [
          { type: 'material_front', url: 'https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg' },
          { type: 'material_side', url: 'https://images.pexels.com/photos/298864/pexels-photo-298864.jpeg' },
          { type: 'material_top', url: 'https://images.pexels.com/photos/298865/pexels-photo-298865.jpeg' },
          { type: 'packing_style', url: 'https://images.pexels.com/photos/298866/pexels-photo-298866.jpeg' }
        ]
      }
    ],
    loadingDate: '2025-01-12',
    loadingTime: '14:30',
    paymentTerms: 'advance',
    withXBowSupport: false,
    status: 'assigned',
    assignedVehicleId: 'v001',
    commissionApplicable: false,
    createdAt: '2024-12-26'
  }
];

export const mockPODs = [
  {
    id: 'pod001',
    loadId: 'l001',
    vehicleId: 'v001',
    uploadedBy: 'vo001',
    type: 'photo',
    url: 'https://images.pexels.com/photos/906494/pexels-photo-906494.jpeg',
    status: 'pending',
    uploadedAt: '2024-12-28T10:30:00Z'
  },
  {
    id: 'pod002',
    loadId: 'l002',
    vehicleId: 'v002',
    uploadedBy: 'vo002',
    type: 'pdf',
    url: 'https://images.pexels.com/photos/906495/pexels-photo-906495.jpeg',
    status: 'approved',
    comments: 'POD verified and approved',
    uploadedAt: '2024-12-27T16:45:00Z'
  }
];

export const mockBiddingVehicles: Vehicle[] = [
  {
    id: 'v1',
    ownerId: 'u1',
    ownerName: 'Rajesh Kumar',
    vehicleType: '10-wheel',
    vehicleSize: 20,
    vehicleWeight: 15,
    dimensions: { length: 20, breadth: 8 },
    vehicleNumber: 'KA05AB1234',
    passingLimit: 25,
    availability: 'immediate',
    isOpen: true,
    tarpaulin: 'two',
    trailerType: 'none',
    preferredOperatingArea: {
      state: 'Karnataka',
      district: 'Bangalore',
      place: 'Whitefield'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/colorful-indian-truck-in-mumbai-india_tizfig.webp',
        publicId: 'front_1'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 15000,
    rating: 4.8,
    totalTrips: 145,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
    publicId: 'v1_public'
  },
  {
    id: 'v2',
    ownerId: 'u2',
    ownerName: 'Amit Singh',
    vehicleType: '14-wheel',
    vehicleSize: 22,
    vehicleWeight: 18,
    dimensions: { length: 22, breadth: 8.5 },
    vehicleNumber: 'MH12CD5678',
    passingLimit: 30,
    availability: 'today',
    isOpen: false,
    tarpaulin: 'one',
    trailerType: 'lowbed',
    preferredOperatingArea: {
      state: 'Maharashtra',
      district: 'Mumbai',
      place: 'Andheri'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/america-vs-india-5_vqlwfh.webp',
        publicId: 'front_2'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 18500,
    rating: 4.6,
    totalTrips: 98,
    publicId: 'v2_public',
    createdAt: '2024-01-10T10:15:00Z',
    updatedAt: '2024-01-10T10:15:00Z'
  },
  {
    id: 'v3',
    ownerId: 'u3',
    ownerName: 'Suresh Patel',
    vehicleType: '8-wheel',
    vehicleSize: 17,
    vehicleWeight: 12,
    dimensions: { length: 17, breadth: 7.5 },
    vehicleNumber: 'GJ01EF9012',
    passingLimit: 20,
    availability: 'tomorrow',
    isOpen: true,
    tarpaulin: 'two',
    trailerType: 'semi-lowbed',
    preferredOperatingArea: {
      state: 'Gujarat',
      district: 'Ahmedabad',
      place: 'Satellite'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/Indian-truck_pcdp4h.webp',
        publicId: 'front_3'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 22000,
    rating: 4.9,
    totalTrips: 203,
    createdAt: '2024-01-08T14:20:00Z',
    updatedAt: '2024-01-08T14:20:00Z'
  },
  {
    id: 'v4',
    ownerId: 'u4',
    ownerName: 'Mohammad Ali',
    vehicleType: '12-wheel',
    vehicleSize: 24,
    vehicleWeight: 20,
    dimensions: { length: 24, breadth: 9 },
    vehicleNumber: 'TN07GH3456',
    passingLimit: 35,
    availability: 'immediate',
    isOpen: false,
    tarpaulin: 'none',
    trailerType: 'crane-25t',
    preferredOperatingArea: {
      state: 'Tamil Nadu',
      district: 'Chennai',
      place: 'Guindy'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602453/truck-333251_1280_zje5ck.webp',
        publicId: 'front_4'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 12800,
    rating: 4.4,
    totalTrips: 76,
    createdAt: '2024-01-12T16:45:00Z',
    updatedAt: '2024-01-12T16:45:00Z'
  },
  {
    id: 'v5',
    ownerId: 'u5',
    ownerName: 'Deepak Sharma',
    vehicleType: '16-wheel',
    vehicleSize: 20,
    vehicleWeight: 22,
    dimensions: { length: 20, breadth: 8.5 },
    vehicleNumber: 'RJ14IJ7890',
    passingLimit: 40,
    availability: 'today',
    isOpen: true,
    tarpaulin: 'one',
    trailerType: 'hydraulic-axle-8',
    preferredOperatingArea: {
      state: 'Rajasthan',
      district: 'Jaipur',
      place: 'Malviya Nagar'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/america-vs-india-5_vqlwfh.webp',
        publicId: 'front_5'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 28500,
    rating: 4.7,
    totalTrips: 112,
    createdAt: '2024-01-06T09:30:00Z',
    updatedAt: '2024-01-06T09:30:00Z'
  },
  {
    id: 'v6',
    ownerId: 'u6',
    ownerName: 'Vinod Yadav',
    vehicleType: '6-wheel',
    vehicleSize: 14,
    vehicleWeight: 8,
    dimensions: { length: 14, breadth: 6.5 },
    vehicleNumber: 'UP32KL1122',
    passingLimit: 15,
    availability: 'tomorrow',
    isOpen: true,
    tarpaulin: 'two',
    trailerType: 'none',
    preferredOperatingArea: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      place: 'Gomti Nagar'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/america-vs-india-5_vqlwfh.webp',
        publicId: 'front_6'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 9500,
    rating: 4.2,
    totalTrips: 89,
    createdAt: '2024-01-14T11:15:00Z',
    updatedAt: '2024-01-14T11:15:00Z'
  },
  {
    id: 'v7',
    ownerId: 'u7',
    ownerName: 'Prakash Reddy',
    vehicleType: '18-wheel',
    vehicleSize: 22,
    vehicleWeight: 25,
    dimensions: { length: 22, breadth: 9 },
    vehicleNumber: 'AP28MN3344',
    passingLimit: 45,
    availability: 'immediate',
    isOpen: false,
    tarpaulin: 'one',
    trailerType: 'crane-50t',
    preferredOperatingArea: {
      state: 'Andhra Pradesh',
      district: 'Hyderabad',
      place: 'Hitec City'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/america-vs-india-5_vqlwfh.webp',
        publicId: 'front_7'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 35200,
    rating: 4.8,
    totalTrips: 167,
    createdAt: '2024-01-09T13:00:00Z',
    updatedAt: '2024-01-09T13:00:00Z'
  },
  {
    id: 'v8',
    ownerId: 'u8',
    ownerName: 'Ravi Gupta',
    vehicleType: '4-wheel',
    vehicleSize: 10,
    vehicleWeight: 5,
    dimensions: { length: 10, breadth: 5.5 },
    vehicleNumber: 'DL08OP5566',
    passingLimit: 8,
    availability: 'today',
    isOpen: true,
    tarpaulin: 'none',
    trailerType: 'none',
    preferredOperatingArea: {
      state: 'Delhi',
      district: 'New Delhi',
      place: 'Connaught Place'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/america-vs-india-5_vqlwfh.webp',
        publicId: 'front_8'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 6800,
    rating: 4.3,
    totalTrips: 234,
    createdAt: '2024-01-11T15:45:00Z',
    updatedAt: '2024-01-11T15:45:00Z'
  },
  {
    id: 'v9',
    ownerId: 'u9',
    ownerName: 'Santosh Kumar',
    vehicleType: '20-wheel',
    vehicleSize: 24,
    vehicleWeight: 28,
    dimensions: { length: 24, breadth: 9.5 },
    vehicleNumber: 'WB19QR7788',
    passingLimit: 50,
    availability: 'tomorrow',
    isOpen: false,
    tarpaulin: 'two',
    trailerType: 'crane-100t',
    preferredOperatingArea: {
      state: 'West Bengal',
      district: 'Kolkata',
      place: 'Salt Lake'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/america-vs-india-5_vqlwfh.webp',
        publicId: 'front_9'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 42000,
    rating: 4.9,
    totalTrips: 134,
    createdAt: '2024-01-07T12:30:00Z',
    updatedAt: '2024-01-07T12:30:00Z'
  },
  {
    id: 'v10',
    ownerId: 'u10',
    ownerName: 'Manoj Singh',
    vehicleType: '3-wheel',
    vehicleSize: 6,
    vehicleWeight: 2,
    dimensions: { length: 6, breadth: 4 },
    vehicleNumber: 'BR01ST9900',
    passingLimit: 3,
    availability: 'immediate',
    isOpen: true,
    tarpaulin: 'none',
    trailerType: 'none',
    preferredOperatingArea: {
      state: 'Bihar',
      district: 'Patna',
      place: 'Boring Road'
    },
    photos: [
      {
        type: 'front',
        url: 'https://res.cloudinary.com/dczicfhcv/image/upload/v1755602440/america-vs-india-5_vqlwfh.webp',
        publicId: 'front_10'
      }
    ],
    status: 'available',
    isApproved: true,
    bidPrice: 3200,
    rating: 4.1,
    totalTrips: 312,
    createdAt: '2024-01-13T17:20:00Z',
    updatedAt: '2024-01-13T17:20:00Z'
  }
];