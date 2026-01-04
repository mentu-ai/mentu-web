'use client';

import { mockSkills } from '@/lib/data/mockData';

export function SkillsView() {
  const skills = mockSkills;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Skills</h1>
          <p className="text-zinc-500">Reusable knowledge + actor directives</p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
          Create Skill
        </button>
      </div>

      <div className="space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-zinc-900">{skill.name}</div>
              <code className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                {skill.id}
              </code>
            </div>
            <p className="text-sm text-zinc-500 mb-4">{skill.desc}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <div>
                <span className="text-zinc-400">Knowledge: </span>
                <span className="text-zinc-600">{skill.knowledge.join(', ')}</span>
              </div>
              <div>
                <span className="text-zinc-400">Actors: </span>
                <span className="text-zinc-600">
                  {skill.actors.length} {skill.actors.length === 1 ? 'actor' : 'actors'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-lg font-medium text-zinc-900 mb-1">No skills defined</h3>
          <p className="text-zinc-500 text-sm">Create your first skill to enable agent capabilities</p>
        </div>
      )}
    </div>
  );
}
