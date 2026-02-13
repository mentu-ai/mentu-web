"use client";

import { useEffect, useRef } from "react";
import { useSpawnLogs, SpawnLog } from "@/hooks/useSpawnLogs";
import { cn } from "@/lib/utils";
import { Terminal, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ExecutionOutputProps {
  commandId: string;
  status: "running" | "completed" | "failed" | "idle";
  className?: string;
}

export function ExecutionOutput({
  commandId,
  status,
  className,
}: ExecutionOutputProps) {
  const { logs, isConnected, error } = useSpawnLogs({
    commandId,
    enabled: !!commandId,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Terminal className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-zinc-300">
            Execution Output
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {isConnected ? (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm min-h-[300px] max-h-[500px]"
      >
        {error ? (
          <div className="text-red-400">Error: {error.message}</div>
        ) : logs.length === 0 ? (
          <div className="text-zinc-500">
            {status === "running"
              ? "Waiting for output..."
              : "No output available"}
          </div>
        ) : (
          logs.map((log) => <LogLine key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}

function LogLine({ log }: { log: SpawnLog }) {
  const isError = log.stream === "stderr";

  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-all",
        isError ? "text-red-400" : "text-zinc-300"
      )}
    >
      {log.message}
    </div>
  );
}
