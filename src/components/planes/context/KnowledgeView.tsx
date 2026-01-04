'use client';

import { mockKnowledge } from '@/lib/data/mockData';

const typeColors: Record<string, string> = {
  guide: 'bg-blue-100 text-blue-700',
  spec: 'bg-purple-100 text-purple-700',
  template: 'bg-green-100 text-green-700',
  reference: 'bg-zinc-100 text-zinc-700',
};

export function KnowledgeView() {
  const knowledge = mockKnowledge;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Knowledge</h1>
          <p className="text-zinc-500">Documents, specs, and guides</p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
          Add Document
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {knowledge.map((doc) => (
          <div
            key={doc.id}
            className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-lg">
                {doc.type === 'guide' ? '📘' : doc.type === 'spec' ? '📋' : doc.type === 'template' ? '📄' : '📚'}
              </div>
              <div>
                <div className="font-medium text-zinc-900">{doc.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${typeColors[doc.type] || typeColors.reference}`}>
                    {doc.type}
                  </span>
                  <span className="text-xs text-zinc-400">Updated {doc.updated}</span>
                </div>
              </div>
            </div>
            <button className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              View
            </button>
          </div>
        ))}
      </div>

      {knowledge.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-medium text-zinc-900 mb-1">No documents yet</h3>
          <p className="text-zinc-500 text-sm">Add your first document to get started</p>
        </div>
      )}
    </div>
  );
}
