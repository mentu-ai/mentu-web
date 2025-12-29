'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useWorkspace(workspaceName: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['workspace', workspaceName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('name', workspaceName)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useWorkspaces() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get workspaces the user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id) as { data: { workspace_id: string }[] | null; error: Error | null };

      if (memberError) throw memberError;

      if (!memberships?.length) return [];

      const workspaceIds = memberships.map(m => m.workspace_id);

      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);

      if (error) throw error;
      return workspaces || [];
    },
  });
}
