'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMemories } from '@/hooks/useMemories';
import { useRealtimeOperations } from '@/hooks/useRealtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';

interface MemoriesListPageProps {
  workspaceName: string;
  workspaceId: string;
}

export function MemoriesListPage({
  workspaceName,
  workspaceId,
}: MemoriesListPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string | null>(null);

  const { memories, isLoading } = useMemories(workspaceId);
  useRealtimeOperations(workspaceId);

  // Get unique kinds for filtering
  const kinds = useMemo(() => {
    const kindSet = new Set<string>();
    memories.forEach((m) => {
      if (m.kind) kindSet.add(m.kind);
    });
    return Array.from(kindSet).sort();
  }, [memories]);

  const filteredMemories = useMemo(() => {
    let filtered = memories;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.body.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query) ||
          m.actor.toLowerCase().includes(query)
      );
    }

    if (kindFilter) {
      filtered = filtered.filter((m) => m.kind === kindFilter);
    }

    return filtered;
  }, [memories, searchQuery, kindFilter]);

  // Sort by newest first
  const sortedMemories = useMemo(() => {
    return [...filteredMemories].sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  }, [filteredMemories]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Memories</h1>
          <p className="text-sm text-zinc-500">
            {memories.length} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={kindFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setKindFilter(null)}
          >
            All
          </Button>
          {kinds.map((kind) => (
            <Button
              key={kind}
              variant={kindFilter === kind ? 'default' : 'outline'}
              size="sm"
              onClick={() => setKindFilter(kind)}
            >
              {kind}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-zinc-500">Loading...</div>
      ) : sortedMemories.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">
          No memories found
        </div>
      ) : (
        <div className="space-y-2">
          {sortedMemories.map((memory) => (
            <Link
              key={memory.id}
              href={`/workspace/${workspaceName}/execution/memories/${memory.id}`}
              className="block"
            >
              <div className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs text-zinc-500 font-mono">
                        {memory.id}
                      </code>
                      {memory.kind && (
                        <Badge variant="secondary" className="text-xs">
                          {memory.kind}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{memory.body}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm text-zinc-500">{memory.actor}</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-xs text-zinc-400">
                          {relativeTime(memory.ts)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {absoluteTime(memory.ts)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
