'use client';

import Link from 'next/link';
import { Users, Github, Webhook, ChevronRight } from 'lucide-react';

interface SettingsPageProps {
  workspaceName: string;
  workspaceId: string;
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
}: SettingsPageProps) {
  void _workspaceId; // Reserved for future use
  const basePath = `/workspace/${workspaceName}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500">
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
            <div className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <link.icon className="h-5 w-5 text-zinc-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold">{link.name}</h2>
                  <p className="text-sm text-zinc-500">
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
  );
}
