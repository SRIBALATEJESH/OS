import { createClient } from './client';

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (e) {
    return null;
  }
}

export function getUserScopedKey(baseKey: string): string {
  if (typeof window === 'undefined') return `${baseKey}_guest`;
  try {
    const token = localStorage.getItem('sb-ckqvsrxogsnriihrilml-auth-token');
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed?.user?.id) return `${baseKey}_${parsed.user.id}`;
    }
  } catch (e) {}
  return `${baseKey}_guest`;
}
