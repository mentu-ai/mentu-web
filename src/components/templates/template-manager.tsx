'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { CommitmentTemplate } from '@/lib/mentu/types';
import { cn } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TemplateManagerProps {
  workspaceId: string;
}

export function TemplateManager({ workspaceId }: TemplateManagerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', workspaceId],
    queryFn: () => fetchTemplates(workspaceId),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleTemplate(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  if (isLoading) {
    return <div className="text-zinc-400">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recurring Templates</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Create Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Recurring Template</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm
              workspaceId={workspaceId}
              onSuccess={() => {
                setIsOpen(false);
                queryClient.invalidateQueries({ queryKey: ['templates'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border',
              template.active
                ? 'bg-zinc-800 border-zinc-700'
                : 'bg-zinc-900 border-zinc-800 opacity-60'
            )}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{template.name}</span>
                {!template.active && (
                  <span className="px-2 py-0.5 text-xs bg-zinc-700 rounded">Paused</span>
                )}
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                {template.recurrence.days.map(d => DAYS[d]).join(', ')} at {template.recurrence.time} ({template.recurrence.timezone})
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {template.body_template.slice(0, 60)}...
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleMutation.mutate({ id: template.id, active: template.active })}
              >
                {template.active ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                onClick={() => {
                  if (confirm('Delete this template? This will not affect existing commitments.')) {
                    deleteMutation.mutate(template.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center text-zinc-400 py-8 border border-dashed border-zinc-700 rounded-lg">
            No templates yet. Create one to automate recurring commitments.
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTemplateForm({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createTemplate({
        id: `tpl_${Math.random().toString(36).slice(2, 10)}`,
        workspace_id: workspaceId,
        name,
        body_template: body,
        recurrence: {
          frequency: 'weekly',
          days,
          time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        defaults: {
          duration_estimate: parseInt(duration) || undefined,
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create template:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Name</label>
        <Input
          placeholder="e.g., Weekly Standup"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">
          Commitment Body
          <span className="ml-1 text-xs">(use {'{date}'} for dynamic date, {'{day}'} for day name)</span>
        </label>
        <textarea
          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
          placeholder="Review standup notes for {date}"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Days of Week</label>
        <div className="flex gap-1">
          {DAYS.map((day, idx) => (
            <button
              key={day}
              type="button"
              className={cn(
                'px-3 py-1.5 rounded text-sm transition-colors',
                days.includes(idx)
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              )}
              onClick={() => toggleDay(idx)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm text-zinc-400 mb-1">Time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-zinc-400 mb-1">Duration (min)</label>
          <Input
            type="number"
            placeholder="60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || days.length === 0}>
        {isSubmitting ? 'Creating...' : 'Create Template'}
      </Button>
    </form>
  );
}

// API functions
async function fetchTemplates(workspaceId: string): Promise<CommitmentTemplate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('commitment_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createTemplate(template: CommitmentTemplate): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('commitment_templates')
    .insert(template as never);

  if (error) throw error;
}

async function toggleTemplate(id: string, currentActive: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('commitment_templates')
    .update({ active: !currentActive, updated_at: new Date().toISOString() } as never)
    .eq('id', id);

  if (error) throw error;
}

async function deleteTemplate(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('commitment_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
