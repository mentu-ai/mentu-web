'use client';

import { useState } from 'react';
import {
  AgentMode,
  MODES,
  getModeConfig,
  validateModeSwitch,
} from '@/lib/agent/modes';
import { cn } from '@/lib/utils/cn';

interface ModeSwitcherProps {
  currentMode: AgentMode | null;
  onModeChange: (mode: AgentMode) => void;
  hasCommitment: boolean;
}

const ICONS: Record<string, string> = {
  compass: '🧭',
  hammer: '🔨',
  'shield-check': '🛡️',
};

export function ModeSwitcher({
  currentMode,
  onModeChange,
  hasCommitment,
}: ModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const modes = Object.values(MODES);
  const current = currentMode ? getModeConfig(currentMode) : null;

  const handleSelect = (mode: AgentMode) => {
    const validation = validateModeSwitch(mode, hasCommitment);

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onModeChange(mode);
    setIsOpen(false);
  };

  const getColorClasses = (color: string, active: boolean) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      blue: {
        bg: active ? 'bg-blue-100' : 'bg-gray-100',
        text: active ? 'text-blue-700' : 'text-gray-700',
        hover: 'hover:bg-blue-50',
      },
      green: {
        bg: active ? 'bg-green-100' : 'bg-gray-100',
        text: active ? 'text-green-700' : 'text-gray-700',
        hover: 'hover:bg-green-50',
      },
      purple: {
        bg: active ? 'bg-purple-100' : 'bg-gray-100',
        text: active ? 'text-purple-700' : 'text-gray-700',
        hover: 'hover:bg-purple-50',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          current
            ? getColorClasses(current.color, true).bg
            : 'bg-gray-100',
          current
            ? getColorClasses(current.color, true).text
            : 'text-gray-700'
        )}
      >
        <span>{current ? ICONS[current.icon] || '○' : '○'}</span>
        <span>{current?.label || 'No Mode'}</span>
        <span className="text-xs opacity-50">▼</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            {modes.map((config) => {
              const validation = validateModeSwitch(config.mode, hasCommitment);
              const isDisabled = !validation.valid;
              const isActive = currentMode === config.mode;
              const colors = getColorClasses(config.color, isActive);

              return (
                <button
                  key={config.mode}
                  onClick={() => handleSelect(config.mode)}
                  disabled={isDisabled}
                  className={cn(
                    'w-full flex flex-col items-start px-4 py-3 text-left transition-colors',
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : colors.hover,
                    isActive && colors.bg
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={cn(
                        'text-lg',
                        isActive ? colors.text : 'text-gray-500'
                      )}
                    >
                      {ICONS[config.icon] || '○'}
                    </span>
                    <span
                      className={cn(
                        'font-medium',
                        isActive ? colors.text : 'text-gray-900'
                      )}
                    >
                      {config.label}
                    </span>
                    {isActive && (
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {config.description}
                  </span>
                  {isDisabled && (
                    <span className="text-xs text-orange-500 mt-1">
                      {validation.error}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ModeSwitcher;
