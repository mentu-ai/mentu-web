'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Terminal, Search, Settings, HelpCircle, LogOut, Info, Keyboard } from 'lucide-react';
import { useTerminal } from '@/contexts/TerminalContext';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function TopNav() {
  const params = useParams();
  const router = useRouter();
  const workspace = params.workspace as string;
  const { isOpen: terminalOpen, toggle: toggleTerminal } = useTerminal();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-11">
        {/* Left: Logo with Apple-style menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex items-center gap-2 px-2 py-1 -ml-2 rounded-md transition-colors',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              menuOpen && 'bg-zinc-100 dark:bg-zinc-800'
            )}
          >
            <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-md" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">mentu</span>
          </button>

          {/* Apple-style dropdown menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                <button
                  onClick={() => handleNavigate('/about')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <Info className="w-4 h-4 text-zinc-400" />
                  About Mentu
                </button>

                <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

                {workspace && (
                  <>
                    <button
                      onClick={() => handleNavigate(`/workspace/${workspace}/settings`)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      Workspace Settings
                    </button>
                    <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
                  </>
                )}

                <button
                  onClick={() => handleNavigate('/docs')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <HelpCircle className="w-4 h-4 text-zinc-400" />
                  Documentation
                </button>

                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <span className="flex items-center gap-3">
                    <Keyboard className="w-4 h-4 text-zinc-400" />
                    Keyboard Shortcuts
                  </span>
                  <span className="text-xs text-zinc-400">⌘K</span>
                </button>

                <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <LogOut className="w-4 h-4 text-zinc-400" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Center: Empty (could add window title later) */}
        <div />

        {/* Right: Utility buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            title="Search (⌘K)"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTerminal}
            className={cn(
              'h-8 w-8 relative text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
              terminalOpen && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
            )}
            title="Toggle Terminal (⌘`)"
          >
            <Terminal className="h-4 w-4" />
            {terminalOpen && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
