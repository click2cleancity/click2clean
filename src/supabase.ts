import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Category = 
  | 'garbage' 
  | 'pothole' 
  | 'streetlight' 
  | 'drain' 
  | 'water' 
  | 'other'

export type Status = 'pending' | 'resolved'

export type Report = {
  id: string
  citizen_id: string
  category: Category
  description?: string
  photo_url?: string
  resolution_photo_url?: string
  lat?: number
  lng?: number
  address?: string
  sector?: string
  ward_id?: string
  status: Status
  support_count: number
  created_at: string
  resolved_at?: string
}

export type User = {
  id: string
  phone: string
  name?: string
  language: string
  points: number
  created_at: string
}

export type StaffMember = {
  id: string
  ward_id: string
  role: string
  name: string
  phone?: string
  employee_id?: string
}

export type Ward = {
  id: string
  name: string
  sector: string
  city: string
}