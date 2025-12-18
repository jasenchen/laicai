import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || ''

function validateSupabaseConfig() {
  const missing: string[] = []
  if (!SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!SUPABASE_BUCKET) missing.push('SUPABASE_BUCKET')
  if (missing.length) {
    throw new Error(`Supabase 配置缺失: ${missing.join(', ')}`)
  }
}

validateSupabaseConfig()

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

