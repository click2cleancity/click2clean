// Dummy Sanitary Inspector (SI) directory.
// TODO: replace with real per-ward staff data from Supabase once available.
// An SI covers an area/ward, so assignment is derived deterministically from
// the report's sector/ward — the same location always maps to the same SI, and
// it stays consistent between the submission screen and the map detail sheet.

export interface Inspector {
  name: string
  designation: string
  ward: string
  phone: string
}

const INSPECTORS: Inspector[] = [
  { name: 'Suresh Patil',     designation: 'Sanitary Inspector', ward: 'Ward A · Vashi',    phone: '+919820011201' },
  { name: 'Anita Deshmukh',   designation: 'Sanitary Inspector', ward: 'Ward B · Nerul',    phone: '+919820011202' },
  { name: 'Ramesh Jadhav',    designation: 'Sanitary Inspector', ward: 'Ward C · Kalyan',   phone: '+919820011203' },
  { name: 'Priya Sharma',     designation: 'Sanitary Inspector', ward: 'Ward D · Dombivli', phone: '+919820011204' },
  { name: 'Mahesh Gaikwad',   designation: 'Sanitary Inspector', ward: 'Ward E · Airoli',   phone: '+919820011205' },
  { name: 'Sunita More',      designation: 'Sanitary Inspector', ward: 'Ward F · Belapur',  phone: '+919820011206' },
]

/** Stable hash so the same area key always resolves to the same inspector. */
function hashKey(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Resolve the Sanitary Inspector responsible for a report's area.
 * Pass the report's sector (preferred), else address, else id.
 */
export function getInspector(areaKey?: string | null): Inspector {
  const key = (areaKey && areaKey.trim()) || 'default'
  return INSPECTORS[hashKey(key) % INSPECTORS.length]
}
