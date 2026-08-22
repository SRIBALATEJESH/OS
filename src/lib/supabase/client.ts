import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ckqvsrxogsnriihrilml.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_Qz_6UphiiN8_BlfLK5pekA_en-NWt2m';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
