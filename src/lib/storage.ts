const KEYS = {
  splash: 'ctc_splash_done',
  language: 'ctc_language',
  onboarding: 'ctc_onboarding_done',
  pendingPhone: 'ctc_pending_phone',
  verified: 'ctc_verified',
  phone: 'ctc_phone',
  /** Legacy global keys (migrated into per-phone buckets on next login). */
  reports: 'ctc_reports',
  points: 'ctc_points',
} as const

function scopedReportsKey(phone: string): string {
  return `ctc_user_${phone}_reports`
}

function scopedPointsKey(phone: string): string {
  return `ctc_user_${phone}_points`
}

/** Move one-time global reports/points into this phone's namespace. */
function migrateLegacyDataForPhone(phone: string): void {
  const rk = scopedReportsKey(phone)
  const pk = scopedPointsKey(phone)
  const legacyReports = localStorage.getItem(KEYS.reports)
  if (legacyReports && !localStorage.getItem(rk)) {
    localStorage.setItem(rk, legacyReports)
    localStorage.removeItem(KEYS.reports)
  }
  const legacyPoints = localStorage.getItem(KEYS.points)
  if (legacyPoints != null && localStorage.getItem(pk) == null) {
    localStorage.setItem(pk, legacyPoints)
    localStorage.removeItem(KEYS.points)
  }
}

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
  migrateLegacyDataForPhone(phone)
}

export function getPhone(): string {
  return localStorage.getItem(KEYS.phone) ?? ''
}

/**
 * End session and restart setup (splash → language → …). Per-phone reports/points stay in storage.
 */
export function logout(): void {
  localStorage.removeItem(KEYS.verified)
  localStorage.removeItem(KEYS.phone)
  localStorage.removeItem(KEYS.pendingPhone)
  localStorage.removeItem(KEYS.splash)
  localStorage.removeItem(KEYS.onboarding)
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

function activePhone(): string | null {
  if (!getVerified()) return null
  const p = getPhone()
  return p.length === 10 ? p : null
}

export function getStoredReports(): StoredReport[] {
  const phone = activePhone()
  if (!phone) return []
  try {
    const raw = localStorage.getItem(scopedReportsKey(phone))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredReport[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addStoredReport(r: StoredReport): void {
  const phone = activePhone()
  if (!phone) return
  const list = getStoredReports()
  list.unshift(r)
  localStorage.setItem(scopedReportsKey(phone), JSON.stringify(list))
}

export function getPoints(): number {
  const phone = activePhone()
  if (!phone) return 0
  const v = localStorage.getItem(scopedPointsKey(phone))
  const n = v ? Number(v) : 0
  return Number.isFinite(n) ? n : 0
}

export function addPoints(delta: number): void {
  const phone = activePhone()
  if (!phone) return
  const next = Math.max(0, getPoints() + delta)
  localStorage.setItem(scopedPointsKey(phone), String(next))
}
