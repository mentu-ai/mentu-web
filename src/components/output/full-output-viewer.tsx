'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface TruncatedOutput {
  content: string;
  truncated: boolean;
  full_output_path?: string;
  original_size: number;
}

interface FullOutputViewerProps {
  output: TruncatedOutput;
  onLoadFull?: (content: string) => void;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Component for viewing potentially truncated output
 *
 * Displays truncated content with option to load full output from file.
 * Shows truncation indicator with size information.
 */
export function FullOutputViewer({ output, onLoadFull }: FullOutputViewerProps) {
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFullOutput = async () => {
    if (!output.full_output_path) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch from proxy endpoint that serves output files
      const response = await fetch(
        `/api/output-files?path=${encodeURIComponent(output.full_output_path)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }

      const content = await response.text();
      setFullContent(content);
      onLoadFull?.(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load output');
    } finally {
      setLoading(false);
    }
  };

  const displayContent = fullContent || output.content;

  return (
    <div className="font-mono text-sm rounded-md overflow-hidden border border-gray-700">
      {/* Output content */}
      <pre className="whitespace-pre-wrap bg-gray-900 text-gray-100 p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
        {displayContent}
      </pre>

      {/* Truncation indicator */}
      {output.truncated && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs font-medium">Output truncated at 30KB</span>
            <span className="text-xs opacity-75">
              ({formatBytes(output.original_size)} total)
            </span>
          </div>

          {!fullContent && output.full_output_path && (
            <button
              onClick={loadFullOutput}
              disabled={loading}
              className={cn(
                'text-xs px-3 py-1 rounded font-medium transition-colors',
                loading
                  ? 'bg-gray-200 text-gray-500 cursor-wait'
                  : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
              )}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <svg
                    className="animate-spin h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'View Full Output'
              )}
            </button>
          )}

          {fullContent && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Showing full output
            </span>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center gap-2 text-red-700 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

export default FullOutputViewer;
