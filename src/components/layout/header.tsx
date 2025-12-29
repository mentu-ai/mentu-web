'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Plus, Camera, Target } from 'lucide-react';
import { getActor } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  user: SupabaseUser;
  onCaptureMemory?: () => void;
  onCreateCommitment?: () => void;
}

export function Header({ user, onCaptureMemory, onCreateCommitment }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const actor = getActor(user);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        {(onCaptureMemory || onCreateCommitment) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {onCaptureMemory && (
                <DropdownMenuItem onClick={onCaptureMemory}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Memory
                </DropdownMenuItem>
              )}
              {onCreateCommitment && (
                <DropdownMenuItem onClick={onCreateCommitment}>
                  <Target className="h-4 w-4 mr-2" />
                  Create Commitment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{actor}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{actor}</span>
                <span className="text-xs text-zinc-500">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
