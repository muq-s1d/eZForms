import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.session?.user) {
      const user = data.session.user;
      
      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        // Auto-generate username from Google profile or email
        const email = user.email || '';
        const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
        let baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Ensure minimum 5 chars
        if (baseUsername.length < 5) {
          baseUsername = baseUsername + 'user';
        }
        
        let finalUsername = baseUsername;
        let isUnique = false;
        let attempts = 0;
        
        // Find a unique username
        while (!isUnique && attempts < 10) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', finalUsername)
            .maybeSingle();
            
          if (existing) {
            finalUsername = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
            attempts++;
          } else {
            isUnique = true;
          }
        }

        // Insert new profile
        await supabase.from('profiles').insert({
          id: user.id,
          username: finalUsername,
          email: email
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth callback error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with Google`);
}
