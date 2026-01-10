'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Github, Mail } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return_to');

  const supabase = createClient();

  // Check for error from callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      addDebug(`Error from callback: ${errorParam}`);
    }
  }, [searchParams]);

  // Check current session on mount
  useEffect(() => {
    const checkSession = async () => {
      addDebug('Checking current session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        addDebug(`Session check error: ${error.message}`);
      } else if (session) {
        addDebug(`Active session found for: ${session.user.email}`);
        addDebug(`Session expires: ${new Date(session.expires_at! * 1000).toISOString()}`);
      } else {
        addDebug('No active session');
      }
    };
    checkSession();
  }, [supabase.auth]);

  const addDebug = (msg: string) => {
    console.log(`[LOGIN] ${msg}`);
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    let redirectTo = `${window.location.origin}/auth/callback`;
    if (returnTo) {
      redirectTo += `?return_to=${encodeURIComponent(returnTo)}`;
    }
    addDebug(`Starting GitHub OAuth, redirectTo: ${redirectTo}`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    });

    if (error) {
      addDebug(`OAuth error: ${error.message}`);
      setError(error.message);
      setIsLoading(false);
    } else {
      addDebug(`OAuth initiated, redirecting to: ${data.url}`);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        window.location.href = '/';
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setError('Check your email for the confirmation link.');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Mentu</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The Commitment Ledger
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6">
          <Button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Debug Panel */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs font-mono">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400">Debug Log</span>
            <button
              onClick={() => setDebugInfo([])}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-auto">
            {debugInfo.length === 0 ? (
              <p className="text-zinc-600">No logs yet...</p>
            ) : (
              debugInfo.map((log, i) => (
                <p key={i} className="text-green-400">{log}</p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
