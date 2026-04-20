import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate if the URL is a real Supabase URL (not the placeholder from .env template)
export const isValidUrl = supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your_supabase_url')

if (!isValidUrl) {
  console.warn('Supabase credentials are not configured. Running in limited mode.')
}

export const supabase = createClient(
  isValidUrl ? supabaseUrl : 'https://abcdefghijklm.supabase.co',
  (isValidUrl && supabaseAnonKey) ? supabaseAnonKey : 'eyPlaceholderKey'
)
