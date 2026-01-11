'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface OAuthAppDetails {
  client_id: string;
  name: string;
  description?: string;
  redirect_uris: string[];
  scopes: string[];
}

function ConsentForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [appDetails, setAppDetails] = useState<OAuthAppDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope');
  const responseType = searchParams.get('response_type');

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.href);
        router.push(`/login?return_to=${returnUrl}`);
        return;
      }

      setUser(session.user);

      // Validate OAuth parameters
      if (!clientId || !redirectUri || !responseType) {
        setError('Missing required OAuth parameters (client_id, redirect_uri, or response_type)');
        setIsLoading(false);
        return;
      }

      if (responseType !== 'code') {
        setError('Invalid response_type. Only "code" is supported.');
        setIsLoading(false);
        return;
      }

      // Fetch OAuth app details
      try {
        const { data, error: fetchError } = await supabase
          .from('oauth_applications')
          .select('*')
          .eq('client_id', clientId)
          .single();

        if (fetchError || !data) {
          setError('Invalid client_id or application not found');
          setIsLoading(false);
          return;
        }

        // Validate redirect URI
        const redirectUris = Array.isArray(data.redirect_uris)
          ? data.redirect_uris
          : [data.redirect_uris];

        if (!redirectUris.includes(redirectUri)) {
          setError('Invalid redirect_uri for this application');
          setIsLoading(false);
          return;
        }

        setAppDetails({
          client_id: data.client_id,
          name: data.name,
          description: data.description,
          redirect_uris: redirectUris,
          scopes: scope ? scope.split(' ') : ['read'],
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching OAuth app:', err);
        setError('Failed to load application details');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [clientId, redirectUri, responseType, scope, supabase, router]);

  const handleAuthorize = async () => {
    if (!appDetails || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate authorization code
      const { data, error: codeError } = await supabase.rpc('create_oauth_authorization_code', {
        p_client_id: clientId,
        p_user_id: user.id,
        p_redirect_uri: redirectUri,
        p_scope: appDetails.scopes.join(' '),
      });

      if (codeError || !data) {
        setError('Failed to generate authorization code');
        setIsLoading(false);
        return;
      }

      // Redirect back to application with code
      const redirectUrl = new URL(redirectUri!);
      redirectUrl.searchParams.set('code', data.code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      window.location.href = redirectUrl.toString();
    } catch (err) {
      console.error('Authorization error:', err);
      setError('An error occurred during authorization');
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri) return;

    // Redirect with error
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', 'User denied authorization');
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    window.location.href = redirectUrl.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-blue-500 animate-pulse mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading authorization request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Authorization Error
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="mt-4"
                >
                  Return to Mentu
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Authorize Application</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {user?.email}
          </p>
        </div>

        {/* Application Details */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{appDetails?.name}</h2>
            {appDetails?.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {appDetails.description}
              </p>
            )}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              This application is requesting access to:
            </p>
            <ul className="space-y-2">
              {appDetails?.scopes.map((scope) => (
                <li key={scope} className="flex items-start space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {getScopeDescription(scope)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              By authorizing, you allow <strong>{appDetails?.name}</strong> to access your Mentu
              data according to the permissions listed above. You can revoke this access at any
              time from your account settings.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDeny}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Deny
          </Button>
          <Button
            onClick={handleAuthorize}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Authorizing...' : 'Authorize'}
          </Button>
        </div>

        {/* Security Notice */}
        <p className="text-xs text-center text-zinc-500 dark:text-zinc-500">
          Secured by Mentu OAuth · {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function getScopeDescription(scope: string): string {
  const descriptions: Record<string, string> = {
    read: 'Read your commitments, memories, and ledger data',
    write: 'Create and modify commitments and memories',
    'ledger:read': 'Read ledger operations and history',
    'ledger:write': 'Append operations to the ledger',
    'commitments:read': 'Read your commitments',
    'commitments:write': 'Create and update commitments',
    'memories:read': 'Read your memories',
    'memories:write': 'Create and capture memories',
    'actor:manage': 'Manage actor mappings',
    'integrations:manage': 'Manage external integrations',
    profile: 'Access your profile information',
    email: 'Access your email address',
  };

  return descriptions[scope] || `Access: ${scope}`;
}

export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Shield className="h-12 w-12 text-blue-500 animate-pulse" />
        </div>
      }
    >
      <ConsentForm />
    </Suspense>
  );
}
