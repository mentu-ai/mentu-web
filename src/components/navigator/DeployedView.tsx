'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, Terminal, Kanban, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CloudTerminal } from '@/components/terminal/CloudTerminal';
import type { NavigatorWorkspace } from '@/hooks/useWorkspaceNavigator';

interface DeployedViewProps {
  workspace: NavigatorWorkspace | null;
  onBack: () => void;
}

type ActionId = 'terminal' | 'kanban' | 'spawn' | 'work';

interface QuickAction {
  id: ActionId;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBgClass: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'terminal',
    label: 'Terminal',
    description: 'Open Claude Code',
    icon: <Terminal className="w-6 h-6 text-white" />,
    iconBgClass: 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900',
  },
  {
    id: 'kanban',
    label: 'Kanban',
    description: 'View work board',
    icon: <Kanban className="w-6 h-6 text-blue-600" />,
    iconBgClass: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'spawn',
    label: 'Spawn Agent',
    description: 'Create new agent',
    icon: <Bot className="w-6 h-6 text-emerald-600" />,
    iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'work',
    label: 'New Work',
    description: 'Create commitment',
    icon: <Sparkles className="w-6 h-6 text-amber-600" />,
    iconBgClass: 'bg-amber-100 dark:bg-amber-900/30',
  },
];

export function DeployedView({ workspace, onBack }: DeployedViewProps) {
  const router = useRouter();
  const [terminalOpen, setTerminalOpen] = useState(false);

  const handleAction = (actionId: ActionId) => {
    switch (actionId) {
      case 'terminal':
        setTerminalOpen(true);
        break;
      case 'kanban':
        if (workspace) {
          router.push(`/workspace/${workspace.id}/kanban`);
        }
        break;
      case 'spawn':
        // TODO: Open spawn agent dialog
        console.log('Opening agent spawn dialog...');
        break;
      case 'work':
        // TODO: Open new commitment form
        console.log('Creating new commitment...');
        break;
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        {/* Header with back button */}
        <header className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-40">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-1 min-h-[44px] -ml-2"
              aria-label="Back to workspaces"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-md" />
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                mentu
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
          {/* Success badge */}
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 mb-4',
            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
            'rounded-full text-sm font-medium'
          )}>
            <Check className="w-4 h-4" />
            <span>Connected</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {workspace?.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Ready for work • {workspace?.activeAgents} agent{workspace?.activeAgents !== 1 ? 's' : ''} active
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div
            className="grid grid-cols-2 gap-3"
            role="group"
            aria-label="Quick actions"
          >
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className={cn(
                  'bg-white dark:bg-zinc-900 rounded-2xl',
                  'border border-zinc-200 dark:border-zinc-700',
                  'p-6 min-h-[120px]',
                  'flex flex-col items-center justify-center gap-3',
                  'cursor-pointer transition-all duration-150',
                  'hover:border-zinc-300 dark:hover:border-zinc-600',
                  'hover:shadow-sm active:scale-[0.98]',
                  'focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-offset-2'
                )}
                aria-label={`${action.label}: ${action.description}`}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    action.iconBgClass
                  )}
                >
                  {action.icon}
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {action.label}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Dialog */}
      <Dialog open={terminalOpen} onOpenChange={setTerminalOpen}>
        <DialogContent className="max-w-4xl h-[600px] p-0 overflow-hidden">
          <CloudTerminal className="h-full rounded-lg overflow-hidden" />
        </DialogContent>
      </Dialog>
    </>
  );
}
