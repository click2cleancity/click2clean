import { reverseGeocodeLabel } from './reverseGeocode'

export interface GeoResult {
  lat: number
  lng: number
  label: string
}

export function requestLocation(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        let label = 'Pinned location'
        try {
          label = await reverseGeocodeLabel(lat, lng)
        } catch {
          /* keep fallback — never show raw coordinates in UI */
        }
        resolve({ lat, lng, label })
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable location in browser settings to auto-detect.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Location unavailable. Try again or move to an open area.'
              : err.code === err.TIMEOUT
                ? 'Location request timed out. Please retry.'
                : 'Could not read your location.'
        reject(new Error(msg))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  })
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
