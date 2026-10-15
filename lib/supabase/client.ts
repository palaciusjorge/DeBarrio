import { createClient } from '@supabase/supabase-js'

const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseProjectUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  )
}

export const supabase = createClient(
  new URL(supabaseProjectUrl).origin,
  supabasePublishableKey
)