/** OpenStreetMap Nominatim — use sparingly (max ~1 req/s per policy). */

interface NominatimAddress {
  suburb?: string
  neighbourhood?: string
  village?: string
  town?: string
  city?: string
  city_district?: string
  municipality?: string
  county?: string
  state_district?: string
  hamlet?: string
  quarter?: string
  road?: string
}

interface NominatimReverse {
  display_name?: string
  address?: NominatimAddress
  error?: string
}

function pickLabel(json: NominatimReverse): string {
  const a = json.address || {}
  const p1 =
    a.suburb ||
    a.neighbourhood ||
    a.quarter ||
    a.hamlet ||
    a.village ||
    a.town ||
    (a.road && (a.city || a.town) ? `${a.road}` : '') ||
    ''
  const p2 =
    a.city ||
    a.city_district ||
    a.town ||
    a.municipality ||
    a.county ||
    a.state_district ||
    ''
  const a1 = p1.trim()
  const a2 = p2.trim()
  if (a1 && a2 && a1.toLowerCase() !== a2.toLowerCase()) return `${a1}, ${a2}`
  if (a2) return a2
  if (a1) return a1
  const dn = json.display_name || ''
  if (dn) {
    const parts = dn.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`
    return parts[0] || dn.slice(0, 72)
  }
  return ''
}

/**
 * Returns a short place name (e.g. "Ghansoli, Navi Mumbai") for coordinates.
 */
export async function reverseGeocodeLabel(lat: number, lng: number): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept-Language': 'en-IN,en;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`Geocode ${res.status}`)
  const json = (await res.json()) as NominatimReverse
  if (json.error) throw new Error(json.error)
  const label = pickLabel(json).trim()
  if (!label) throw new Error('Empty label')
  return label.length > 80 ? `${label.slice(0, 77)}…` : label
}

/** Legacy stored reports may still have "lat, lng" as areaLabel. */
export function looksLikeCoordinatePair(text: string): boolean {
  return /^\s*-?\d+\.?\d*,\s*-?\d+\.?\d*\s*$/.test(text.trim())
}

export function friendlyAreaLabel(text: string, fallback = 'Pinned location'): string {
  const t = text.trim()
  if (!t || looksLikeCoordinatePair(t)) return fallback
  return t
}
