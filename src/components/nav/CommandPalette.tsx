'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCommitments } from '@/hooks/useCommitments';
import { useMemories } from '@/hooks/useMemories';
import {
  Search,
  FileText,
  Brain,
  ArrowRight,
  Loader2,
  LayoutList,
  Terminal,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminal } from '@/contexts/TerminalContext';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResultType = 'commitment' | 'memory' | 'action';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  href?: string;
  action?: () => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const params = useParams();
  const router = useRouter();
  const workspaceName = params.workspace as string;
  const plane = params.plane as string || 'execution';
  const { toggle: toggleTerminal } = useTerminal();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get workspace ID from name
  const { data: workspace } = useWorkspace(workspaceName || '');
  const workspaceId = workspace?.id;

  // Get data from hooks (only when dialog is open and workspace exists)
  const { commitments, isLoading: commitmentsLoading } = useCommitments(open && workspaceId ? workspaceId : undefined);
  const { memories, isLoading: memoriesLoading } = useMemories(open && workspaceId ? workspaceId : undefined);

  const isLoading = commitmentsLoading || memoriesLoading;

  // Quick actions (always available)
  const quickActions: SearchResult[] = useMemo(() => {
    if (!workspaceName) return [];
    return [
      {
        id: 'action-kanban',
        type: 'action',
        title: 'Go to Kanban',
        subtitle: 'View commitments board',
        href: `/workspace/${workspaceName}/execution/kanban`,
      },
      {
        id: 'action-commitments',
        type: 'action',
        title: 'View Commitments',
        subtitle: 'List all commitments',
        href: `/workspace/${workspaceName}/execution/commitments`,
      },
      {
        id: 'action-memories',
        type: 'action',
        title: 'View Memories',
        subtitle: 'List all memories',
        href: `/workspace/${workspaceName}/execution/memories`,
      },
      {
        id: 'action-ledger',
        type: 'action',
        title: 'View Ledger',
        subtitle: 'Operation history',
        href: `/workspace/${workspaceName}/execution/ledger`,
      },
      {
        id: 'action-terminal',
        type: 'action',
        title: 'Toggle Terminal',
        subtitle: 'Open/close cloud terminal',
        action: () => {
          toggleTerminal();
          onOpenChange(false);
        },
      },
      {
        id: 'action-settings',
        type: 'action',
        title: 'Workspace Settings',
        subtitle: 'Configure workspace',
        href: `/workspace/${workspaceName}/settings`,
      },
    ];
  }, [workspaceName, toggleTerminal, onOpenChange]);

  // Filter and combine results
  const results = useMemo(() => {
    const all: SearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();

    // Add commitments
    if (commitments) {
      const filtered = lowerQuery
        ? commitments.filter(c => c.body.toLowerCase().includes(lowerQuery))
        : commitments.slice(0, 5); // Show recent 5 when no query

      filtered.slice(0, 10).forEach(c => {
        all.push({
          id: c.id,
          type: 'commitment',
          title: c.body.length > 60 ? c.body.substring(0, 60) + '...' : c.body,
          subtitle: `${c.state} • ${c.id}`,
          href: `/workspace/${workspaceName}/${plane}/commitments/${c.id}`,
        });
      });
    }

    // Add memories
    if (memories) {
      const filtered = lowerQuery
        ? memories.filter(m => m.body.toLowerCase().includes(lowerQuery))
        : memories.slice(0, 3); // Show recent 3 when no query

      filtered.slice(0, 10).forEach(m => {
        all.push({
          id: m.id,
          type: 'memory',
          title: m.body.length > 60 ? m.body.substring(0, 60) + '...' : m.body,
          subtitle: `${m.kind} • ${m.id}`,
          href: `/workspace/${workspaceName}/${plane}/memories/${m.id}`,
        });
      });
    }

    // Add quick actions (filter by query if present)
    const filteredActions = lowerQuery
      ? quickActions.filter(a =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.subtitle?.toLowerCase().includes(lowerQuery)
        )
      : quickActions;

    all.push(...filteredActions);

    return all;
  }, [query, commitments, memories, quickActions, workspaceName, plane]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to ensure dialog is mounted
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          if (selected.action) {
            selected.action();
          } else if (selected.href) {
            router.push(selected.href);
            onOpenChange(false);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onOpenChange(false);
        break;
    }
  }, [results, selectedIndex, router, onOpenChange]);

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.href) {
      router.push(result.href);
      onOpenChange(false);
    }
  };

  const getIcon = (type: ResultType) => {
    switch (type) {
      case 'commitment':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'memory':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'action':
        return <ArrowRight className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getActionIcon = (id: string) => {
    if (id.includes('kanban')) return <LayoutList className="w-4 h-4 text-zinc-400" />;
    if (id.includes('terminal')) return <Terminal className="w-4 h-4 text-green-500" />;
    if (id.includes('settings')) return <Settings className="w-4 h-4 text-zinc-400" />;
    return <ArrowRight className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commitments, memories, or type a command..."
            className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-auto">
          {!workspaceName ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Select a workspace first
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          ) : (
            <div className="py-2">
              {/* Group results by type */}
              {['action', 'commitment', 'memory'].map(type => {
                const typeResults = results.filter(r => r.type === type);
                if (typeResults.length === 0) return null;

                const label = type === 'action' ? 'Quick Actions' : type === 'commitment' ? 'Commitments' : 'Memories';

                return (
                  <div key={type}>
                    <div className="px-4 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      {label}
                    </div>
                    {typeResults.map((result) => {
                      const index = results.indexOf(result);
                      const isSelected = index === selectedIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                            isSelected
                              ? 'bg-zinc-100 dark:bg-zinc-800'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                          )}
                        >
                          {result.type === 'action' ? getActionIcon(result.id) : getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-zinc-500 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-200 dark:bg-zinc-700 rounded">
                              Enter
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">Enter</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">Esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
