export const heroStats = [
  { label: 'Active Citizens', value: '12.4k' },
  { label: 'Issues Resolved', value: '8.9k' },
  { label: 'Cleaner Streets', value: '214' },
] as const

/** Demo issue thumbnails (deterministic seeds; replace with CDN in production). */
export const communityReports = [
  {
    id: 'demo-1',
    title: 'Street Garbage',
    area: 'Sector 12, Noida',
    lat: 28.5355,
    lng: 77.391,
    time: '2h ago',
    status: 'In progress' as const,
    photoUrl: 'https://picsum.photos/seed/ctc-clean-noida/240/240',
  },
  {
    id: 'demo-2',
    title: 'Broken Light',
    area: 'MG Road, Bengaluru',
    lat: 12.9716,
    lng: 77.5946,
    time: '5h ago',
    status: 'Resolved' as const,
    photoUrl: 'https://picsum.photos/seed/ctc-light-bluru/240/240',
  },
  {
    id: 'demo-3',
    title: 'Full Dustbin',
    area: 'Salt Lake, Kolkata',
    lat: 22.5726,
    lng: 88.3639,
    time: '1d ago',
    status: 'Submitted' as const,
    photoUrl: 'https://picsum.photos/seed/ctc-bin-kolkata/240/240',
  },
] as const

export const inspirationSlides = [
  {
    title: 'Small steps, big streets',
    body: 'One report can route a crew faster than a dozen complaints.',
    gradient: 'from-sky-400 to-blue-600',
  },
  {
    title: 'Accuracy helps resolution',
    body: 'Clear photos and landmarks mean fewer repeat visits.',
    gradient: 'from-lime-400 to-emerald-600',
  },
  {
    title: 'Your neighborhood counts',
    body: 'Citizen eyes fill gaps between scheduled inspections.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Track progress openly',
    body: 'Status updates keep everyone aligned on outcomes.',
    gradient: 'from-indigo-400 to-violet-600',
  },
  {
    title: 'Rewards for responsibility',
    body: 'Earn points you can redeem on everyday essentials.',
    gradient: 'from-teal-400 to-cyan-600',
  },
]

export const tips = [
  'Capture the issue clearly—focus on the problem area',
  'Include landmarks to help locate the issue easily',
  'Natural lighting makes details more visible',
  'One clear photo is better than multiple blurry ones',
] as const

export const badges = [
  { name: 'First Report', icon: 'Sparkles' as const },
  { name: 'Week Streak', icon: 'Flame' as const },
  { name: 'Community Star', icon: 'Star' as const },
  { name: 'Green Champion', icon: 'Leaf' as const },
]

export const challenges = [
  { title: 'Report 3 issues this week', reward: 120, progress: 0.4 },
  { title: 'Share one awareness card', reward: 40, progress: 0 },
]

export const redeemOptions = [
  {
    category: 'Fuel',
    items: [
      { name: 'Petrol — partner pump', points: 500, discount: '₹50 off' },
      { name: 'Diesel — partner pump', points: 800, discount: '₹80 off' },
      { name: 'LPG refill voucher', points: 900, discount: '₹90 off' },
      { name: 'CNG credit', points: 1000, discount: '₹100 off' },
    ],
  },
  {
    category: 'Electricity Bills',
    items: [
      { name: 'Bill credit — tier A', points: 1000, discount: '₹100 off' },
      { name: 'Bill credit — tier B', points: 3000, discount: '₹300 off' },
      { name: 'Bill credit — tier C', points: 5000, discount: '₹500 off' },
    ],
  },
  {
    category: 'Government Services',
    items: [
      { name: 'Aadhaar update fee offset', points: 600, discount: '₹60 off' },
      { name: 'PAN correction support', points: 800, discount: '₹80 off' },
      { name: 'Passport service voucher', points: 1500, discount: '₹150 off' },
      { name: 'License renewal help', points: 500, discount: '₹50 off' },
    ],
  },
] as const

export const educateArticles = [
  {
    title: 'Why photos matter',
    summary: 'Crews route from visuals—blur costs time.',
  },
  {
    title: 'Safe reporting',
    summary: 'Stand back from traffic and avoid personal data in frames.',
  },
  {
    title: 'What municipalities fix first',
    summary: 'Public safety and sanitation often lead triage queues.',
  },
]
