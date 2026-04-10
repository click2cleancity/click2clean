import { gps } from 'exifr'
import type { GeoResult } from './geo'
import { reverseGeocodeLabel } from './reverseGeocode'

/** Try to read GPS coordinates embedded in the photo (JPEG/HEIC with location tags). */
export async function tryGpsFromPhotoFile(file: File): Promise<GeoResult | null> {
  try {
    const out = await gps(file)
    if (
      out &&
      typeof out.latitude === 'number' &&
      typeof out.longitude === 'number' &&
      Number.isFinite(out.latitude) &&
      Number.isFinite(out.longitude)
    ) {
      const lat = out.latitude
      const lng = out.longitude
      let label = 'Pinned location'
      try {
        label = await reverseGeocodeLabel(lat, lng)
      } catch {
        /* fallback */
      }
      return { lat, lng, label }
    }
  } catch {
    // no EXIF or unsupported format
  }
  return null
}
