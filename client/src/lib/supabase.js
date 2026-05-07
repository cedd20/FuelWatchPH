import { createClient } from '@supabase/supabase-js'
import {
  clearStoredSessionValue,
  getStoredRememberMePreference,
  getStoredSessionValue,
  setStoredRememberMePreference,
  storeSessionValue,
} from "@/shared/utils/authSession";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http')

const supabaseStorage = {
  getItem(key) {
    return getStoredSessionValue(key);
  },
  setItem(key, value) {
    // This lets the login screen choose between temporary sessionStorage
    // and persistent localStorage without storing any raw credentials.
    storeSessionValue(key, value, getStoredRememberMePreference());
  },
  removeItem(key) {
    clearStoredSessionValue(key);
  },
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: supabaseStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export { setStoredRememberMePreference };
