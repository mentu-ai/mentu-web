'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useActorMappings, useCreateActorMapping, useDeleteActorMapping } from '@/hooks/useActorMappings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { relativeTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface ActorMappingsPageProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

export function ActorMappingsPage({
  workspaceName,
  workspaceId,
  user,
}: ActorMappingsPageProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [externalSystem, setExternalSystem] = useState('github');
  const [externalId, setExternalId] = useState('');
  const [mentuActor, setMentuActor] = useState('');

  const { data: mappings, isLoading } = useActorMappings(workspaceId);
  const createMapping = useCreateActorMapping();
  const deleteMapping = useDeleteActorMapping();

  const handleAdd = async () => {
    if (!externalId.trim() || !mentuActor.trim()) return;

    try {
      await createMapping.mutateAsync({
        workspace_id: workspaceId,
        external_system: externalSystem,
        external_id: externalId.trim(),
        mentu_actor: mentuActor.trim(),
      });

      toast({
        title: 'Mapping added',
        description: 'Actor mapping has been created.',
      });

      setExternalId('');
      setMentuActor('');
      setAddOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create mapping',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMapping.mutateAsync({ id, workspaceId });

      toast({
        title: 'Mapping deleted',
        description: 'Actor mapping has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete mapping',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header user={user} />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <Link
          href={`/workspace/${workspaceName}/settings`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Actor Mappings</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Map external identities to Mentu actors
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-zinc-500">Loading...</div>
        ) : !mappings || mappings.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            No actor mappings configured
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                    External System
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                    External ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                    Mentu Actor
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {mappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td className="px-4 py-3 text-sm">{mapping.external_system}</td>
                    <td className="px-4 py-3 text-sm font-mono">{mapping.external_id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{mapping.mentu_actor}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {relativeTime(mapping.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Actor Mapping</DialogTitle>
            <DialogDescription>
              Map an external identity to a Mentu actor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system">External System</Label>
              <Select value={externalSystem} onValueChange={setExternalSystem}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="jira">Jira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-id">External ID</Label>
              <Input
                id="external-id"
                placeholder="e.g., rashidazarang"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentu-actor">Mentu Actor</Label>
              <Input
                id="mentu-actor"
                placeholder="e.g., rashid"
                value={mentuActor}
                onChange={(e) => setMentuActor(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={createMapping.isPending || !externalId.trim() || !mentuActor.trim()}
            >
              {createMapping.isPending ? 'Adding...' : 'Add Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
