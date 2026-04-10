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
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
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
