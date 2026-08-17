import { supabase } from '../supabase'
import { getInspector } from './inspectors'

// NMMC administrative wards that carry a full staff hierarchy.
const NMMC_WARDS = [
  'Airoli Ward', 'Belapur Ward', 'Digha Ward', 'Ghansoli Ward',
  'Kopar Khairane Ward', 'Nerul Ward', 'Sanpada Ward', 'Turbhe Ward', 'Vashi Ward',
]

export interface Officer {
  name: string
  designation: string
  ward: string
  phone?: string
  level: number
}

export interface Accountability {
  wardName: string
  primary: Officer      // the responsible Sanitary Inspector (level 4)
  chain: Officer[]      // SI and above, ascending by level (escalation path)
}

interface WardRow { id: string; name: string; sector: string | null }

let wardsCache: WardRow[] | null = null
async function loadWards(): Promise<WardRow[]> {
  if (wardsCache) return wardsCache
  const { data } = await supabase
    .from('wards')
    .select('id, name, sector')
    .in('name', NMMC_WARDS)
  wardsCache = data ?? []
  return wardsCache
}

function hashKey(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

/**
 * Resolve who is accountable for a report's location.
 * Matches the report's sector/address to a ward when possible, otherwise
 * assigns one deterministically (stable per location). Falls back to the
 * dummy inspector directory if the staff tables aren't reachable.
 */
export async function getAccountability(
  sector?: string | null,
  address?: string | null,
): Promise<Accountability> {
  try {
    const wards = await loadWards()
    if (wards.length > 0) {
      const hay = `${sector ?? ''} ${address ?? ''}`.toLowerCase()
      let ward =
        wards.find(w => {
          const short = w.name.replace(/ ward$/i, '').toLowerCase()
          return hay.includes(short) || (w.sector && hay.includes(w.sector.toLowerCase()))
        }) ?? wards[hashKey(sector || address || 'default') % wards.length]

      const { data: staff } = await supabase
        .from('staff_hierarchy')
        .select('name, designation, role, level, phone')
        .eq('ward_id', ward.id)
        .eq('is_active', true)
        .order('level', { ascending: false })

      const officers: Officer[] = (staff ?? []).map(s => ({
        name: s.name,
        designation: s.designation || s.role,
        ward: ward.name,
        phone: s.phone ?? undefined,
        level: s.level ?? 0,
      }))

      if (officers.length > 0) {
        const primary = officers.find(o => o.level === 4) ?? officers[officers.length - 1]
        const chain = officers.filter(o => o.level >= 4).sort((a, b) => a.level - b.level)
        return { wardName: ward.name, primary, chain: chain.length ? chain : [primary] }
      }
    }
  } catch {
    /* fall through to dummy */
  }

  // Fallback: dummy inspector directory
  const si = getInspector(sector || address)
  const primary: Officer = { name: si.name, designation: si.designation, ward: si.ward, phone: si.phone, level: 4 }
  return { wardName: si.ward, primary, chain: [primary] }
}
