'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setErrorMessage('Google sign-in failed. Please try again.');
    }

    // Check if user is already authenticated
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
      }
    });
  }, [searchParams, router]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage('Google sign-in failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F9FAFB] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#10B981]/20 selection:text-[#10B981]">
      {/* Background Ambient Glows */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#121824]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 space-y-8 text-center">
        {/* Brand Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-[#10B981]/20 to-emerald-500/10 border border-[#10B981]/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="text-2xl font-bold text-[#10B981]">⚡</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#F9FAFB] to-[#9CA3AF] bg-clip-text text-transparent">
            StudyFlow
          </h1>
          <p className="text-xs text-[#9CA3AF] max-w-xs mx-auto leading-relaxed">
            Your smart AI-powered learning workspace.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Single Auth Option: Continue with Google */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`
              w-full py-3.5 px-6 rounded-2xl font-semibold text-xs transition-all duration-200
              flex items-center justify-center gap-3 border shadow-lg cursor-pointer
              ${isLoading
                ? 'bg-white/5 border-white/10 text-[#9CA3AF] cursor-not-allowed opacity-75'
                : 'bg-white text-[#0B0F17] border-white hover:bg-gray-100 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98]'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0B0F17] border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Security Footer Note */}
        <div className="pt-2 text-[11px] text-[#9CA3AF]">
          Protected by Supabase Auth OAuth 2.0
        </div>
      </div>
    </div>
  );
}
