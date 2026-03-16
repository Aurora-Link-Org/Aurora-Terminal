import React, { useRef, useEffect } from 'react';

interface LogViewerProps {
  logs: string[];
  activeTabId: string | null;
  tabId: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, activeTabId, tabId }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTabId === tabId) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTabId, tabId]);

  return (
    <div className="flex-1 overflow-hidden p-4 relative">
      <div className="absolute inset-2 bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 terminal-output font-mono text-base">
          {logs.map((log, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${log.startsWith('>') || log.includes('> ') ? 'text-emerald-400' : log.startsWith('[System]') || log.includes('[System]') ? 'text-slate-500' : 'text-slate-200'}`}>
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
