'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CalendarConnection } from '@/lib/mentu/types';
import { cn } from '@/lib/utils';
import { Calendar, RefreshCw, Trash2, Cloud, CloudOff } from 'lucide-react';

interface CalendarSettingsPageProps {
  workspaceId: string;
  workspaceName: string;
}

export function CalendarSettingsPage({ workspaceId }: CalendarSettingsPageProps) {
  const queryClient = useQueryClient();
  const [showConnectPanel, setShowConnectPanel] = useState(false);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['calendar-connections', workspaceId],
    queryFn: () => fetchConnections(workspaceId),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: boolean }) =>
      toggleConnection(id, field, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-connections'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-connections'] }),
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
  });

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-500" />
            Calendar Integration
          </h1>
          <p className="text-zinc-400 mt-1">
            Connect your calendar to sync commitments automatically
          </p>
        </div>
        <Button onClick={() => setShowConnectPanel(!showConnectPanel)}>
          {showConnectPanel ? 'Cancel' : 'Connect Calendar'}
        </Button>
      </div>

      {showConnectPanel && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Connect a Calendar</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-blue-500 transition-colors"
              onClick={() => initiateOAuth('google')}
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">Google Calendar</div>
                <div className="text-sm text-zinc-400">Connect with Google</div>
              </div>
            </button>

            <button
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-blue-500 transition-colors"
              onClick={() => initiateOAuth('microsoft')}
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 21 21" className="w-6 h-6">
                  <rect fill="#F25022" x="1" y="1" width="9" height="9"/>
                  <rect fill="#00A4EF" x="1" y="11" width="9" height="9"/>
                  <rect fill="#7FBA00" x="11" y="1" width="9" height="9"/>
                  <rect fill="#FFB900" x="11" y="11" width="9" height="9"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">Outlook Calendar</div>
                <div className="text-sm text-zinc-400">Connect with Microsoft</div>
              </div>
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            OAuth flow will open in a new window. Grant permissions to allow Mentu to read/write calendar events.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Connected Calendars</h2>

        {isLoading ? (
          <div className="text-zinc-400">Loading connections...</div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-700 rounded-lg text-zinc-400">
            No calendars connected yet. Connect a calendar to start syncing commitments.
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    conn.provider === 'google' ? 'bg-white' : 'bg-blue-600'
                  )}>
                    {conn.provider === 'google' ? (
                      <Calendar className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Calendar className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {conn.calendar_name || conn.calendar_id}
                    </div>
                    <div className="text-sm text-zinc-400 capitalize">
                      {conn.provider} Calendar
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conn.projection_enabled}
                        onChange={(e) => toggleMutation.mutate({
                          id: conn.id,
                          field: 'projection_enabled',
                          value: e.target.checked,
                        })}
                        className="rounded border-zinc-600"
                      />
                      <Cloud className="w-4 h-4 text-blue-400" />
                      Push to calendar
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conn.trigger_enabled}
                        onChange={(e) => toggleMutation.mutate({
                          id: conn.id,
                          field: 'trigger_enabled',
                          value: e.target.checked,
                        })}
                        className="rounded border-zinc-600"
                      />
                      <CloudOff className="w-4 h-4 text-green-400" />
                      Create from calendar
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncMutation.mutate(conn.id)}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={cn('w-4 h-4', syncMutation.isPending && 'animate-spin')} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => {
                        if (confirm('Disconnect this calendar?')) {
                          deleteMutation.mutate(conn.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyword filtering section */}
      {connections.some(c => c.trigger_enabled) && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Trigger Settings</h2>
          <p className="text-sm text-zinc-400">
            When &quot;Create from calendar&quot; is enabled, calendar events containing your keyword
            will automatically create commitments.
          </p>
          <div className="max-w-md">
            <label className="block text-sm text-zinc-400 mb-1">Keyword Filter</label>
            <Input
              placeholder="e.g., [mentu] or #commitment"
              defaultValue={connections.find(c => c.trigger_enabled)?.keyword_filter || ''}
            />
            <p className="text-xs text-zinc-500 mt-1">
              Only events containing this keyword will create commitments
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// OAuth initiation (placeholder - actual implementation depends on backend)
function initiateOAuth(provider: 'google' | 'microsoft') {
  // In production, this would redirect to the OAuth flow
  const baseUrl = window.location.origin;
  const callbackUrl = `${baseUrl}/api/calendar/oauth/${provider}/callback`;

  // For now, show an alert
  alert(`OAuth flow for ${provider} would redirect to:\n\n${callbackUrl}\n\nThis requires backend OAuth routes to be configured.`);
}

// API functions
async function fetchConnections(workspaceId: string): Promise<CalendarConnection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function toggleConnection(id: string, field: string, value: boolean): Promise<void> {
  const supabase = createClient();
  const updateData: Record<string, string | boolean> = {
    [field]: value,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase
    .from('calendar_connections')
    .update(updateData as never)
    .eq('id', id);

  if (error) throw error;
}

async function deleteConnection(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('calendar_connections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function triggerSync(connectionId: string): Promise<void> {
  // Placeholder - actual sync implementation in mentu-proxy
}
