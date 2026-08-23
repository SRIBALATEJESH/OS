import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
    }

    const cookieStore = await cookies();

    // Use server-side Supabase client (inherits auth session from cookies)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    // Generate a 1-hour signed URL for the file
    const { data, error } = await supabase.storage
      .from('studyflow')
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      console.warn('[storage/signed-url] Signed URL error:', error?.message);
      // Fallback: return public URL
      const { data: publicData } = supabase.storage.from('studyflow').getPublicUrl(filePath);
      return NextResponse.json({ url: publicData?.publicUrl || '', fallback: true });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[storage/signed-url] Exception:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
