import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// console.log('Environment variables:', {
//   VITE_SUPABASE_URL: supabaseUrl,
//   VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing'
// })

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? 'Present' : 'Missing'
  })
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
