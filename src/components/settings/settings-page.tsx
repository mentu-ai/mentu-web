'use client';

import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { Users, Github, Webhook, ChevronRight } from 'lucide-react';

interface SettingsPageProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

const settingsLinks = [
  {
    name: 'Actor Mappings',
    description: 'Map external identities to Mentu actors',
    href: '/settings/actors',
    icon: Users,
  },
  {
    name: 'GitHub Integration',
    description: 'Connect GitHub issues and pull requests',
    href: '/settings/github',
    icon: Github,
  },
  {
    name: 'Webhook Logs',
    description: 'Debug webhook activity',
    href: '/settings/webhooks',
    icon: Webhook,
  },
];

export function SettingsPage({
  workspaceName,
  workspaceId: _workspaceId,
  user,
}: SettingsPageProps) {
  void _workspaceId; // Reserved for future use
  const basePath = `/workspace/${workspaceName}`;

  return (
    <div className="flex flex-col h-full">
      <Header user={user} />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage workspace configuration
          </p>
        </div>

        <div className="grid gap-4">
          {settingsLinks.map((link) => (
            <Link
              key={link.name}
              href={`${basePath}${link.href}`}
              className="block"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <link.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold">{link.name}</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
