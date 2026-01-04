'use client';

import { X, Folder } from 'lucide-react';
import { useParams } from 'next/navigation';

interface ProjectSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectSettingsModal({ open, onClose }: ProjectSettingsModalProps) {
  const params = useParams();
  const workspaceId = params.workspace as string;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Project Settings</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Project */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-3">CURRENT PROJECT</h3>
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl">
              <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-zinc-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-zinc-900">{workspaceId}</div>
                <div className="text-xs text-zinc-500 font-mono">
                  /Users/rashid/Desktop/Workspaces/{workspaceId}
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Synced
              </span>
            </div>
          </div>

          {/* Sync Settings */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-3">SYNC</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">Auto-sync</div>
                  <div className="text-xs text-zinc-500">Sync changes automatically</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-zinc-200 peer-checked:bg-zinc-900 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">Cloud backup</div>
                  <div className="text-xs text-zinc-500">Sync to Mentu Cloud</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-zinc-200 peer-checked:bg-zinc-900 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-3">DANGER ZONE</h3>
            <div className="p-4 border border-red-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-900">Disconnect project</div>
                <div className="text-xs text-zinc-500">Remove from Mentu (keeps local files)</div>
              </div>
              <button className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                Disconnect
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
