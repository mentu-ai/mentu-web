'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Github, Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function GitHubSettingsPage() {
  const webhookUrl = `https://nwhtjzgcbjuewuhapjua.supabase.co/functions/v1/github-webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: 'Copied',
      description: 'Webhook URL copied to clipboard',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-zinc-100 flex items-center justify-center">
          <Github className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">GitHub Integration</h1>
          <p className="text-sm text-zinc-500">
            Connect GitHub issues and pull requests
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Integration Status</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Not Configured</Badge>
          <span className="text-sm text-zinc-500">
            Set up webhooks to enable GitHub integration
          </span>
        </div>
      </div>

      {/* Webhook Setup */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Webhook Configuration</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Add this URL to your GitHub repository&apos;s webhook settings.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Events to Enable</Label>
            <ul className="text-sm text-zinc-600 space-y-1 list-disc list-inside">
              <li>Issues (opened, closed, edited, deleted)</li>
              <li>Issue comments (created, edited)</li>
              <li>Pull requests (opened, closed, merged)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label>Content Type</Label>
            <p className="text-sm text-zinc-600">
              application/json
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Setup Instructions</h2>

        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="font-mono text-xs bg-zinc-100 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <p className="font-medium">Go to your repository settings</p>
              <p className="text-zinc-500">
                Navigate to Settings &gt; Webhooks &gt; Add webhook
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-xs bg-zinc-100 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <p className="font-medium">Configure the webhook</p>
              <p className="text-zinc-500">
                Paste the webhook URL above and select the events to listen for
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-xs bg-zinc-100 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <p className="font-medium">Add actor mappings</p>
              <p className="text-zinc-500">
                Map GitHub usernames to Mentu actors in the Actor Mappings settings
              </p>
            </div>
          </li>
        </ol>

        <div className="mt-6">
          <a
            href="https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            GitHub Webhooks Documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
