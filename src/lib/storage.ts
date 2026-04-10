const KEYS = {
  splash: 'ctc_splash_done',
  language: 'ctc_language',
  onboarding: 'ctc_onboarding_done',
  pendingPhone: 'ctc_pending_phone',
  verified: 'ctc_verified',
  phone: 'ctc_phone',
  reports: 'ctc_reports',
  points: 'ctc_points',
} as const

export function getSplashDone(): boolean {
  return localStorage.getItem(KEYS.splash) === '1'
}

export function setSplashDone(): void {
  localStorage.setItem(KEYS.splash, '1')
}

export function getLanguage(): string | null {
  const v = localStorage.getItem(KEYS.language)
  return v && v.length > 0 ? v : null
}

export function setLanguage(code: string): void {
  localStorage.setItem(KEYS.language, code)
}

export function getOnboardingDone(): boolean {
  return localStorage.getItem(KEYS.onboarding) === '1'
}

export function setOnboardingDone(): void {
  localStorage.setItem(KEYS.onboarding, '1')
}

export function getPendingPhone(): string {
  return localStorage.getItem(KEYS.pendingPhone) ?? ''
}

export function setPendingPhone(phone10: string): void {
  localStorage.setItem(KEYS.pendingPhone, phone10)
}

export function clearPendingPhone(): void {
  localStorage.removeItem(KEYS.pendingPhone)
}

export function getVerified(): boolean {
  return localStorage.getItem(KEYS.verified) === '1'
}

export function setVerified(phone: string): void {
  localStorage.setItem(KEYS.verified, '1')
  localStorage.setItem(KEYS.phone, phone)
  clearPendingPhone()
}

export function getPhone(): string {
  return localStorage.getItem(KEYS.phone) ?? ''
}

export interface StoredReport {
  id: string
  title: string
  status: 'Submitted' | 'In progress' | 'Resolved'
  lat: number
  lng: number
  areaLabel: string
  createdAt: string
  photoDataUrl?: string
  locationSource?: 'exif' | 'browser'
}

export function getStoredReports(): StoredReport[] {
  try {
    const raw = localStorage.getItem(KEYS.reports)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredReport[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addStoredReport(r: StoredReport): void {
  const list = getStoredReports()
  list.unshift(r)
  localStorage.setItem(KEYS.reports, JSON.stringify(list))
}

export function getPoints(): number {
  const v = localStorage.getItem(KEYS.points)
  const n = v ? Number(v) : 0
  return Number.isFinite(n) ? n : 0
}

export function addPoints(delta: number): void {
  const next = Math.max(0, getPoints() + delta)
  localStorage.setItem(KEYS.points, String(next))
}
