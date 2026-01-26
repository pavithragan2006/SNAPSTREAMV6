
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
}

export const Console: React.FC<ConsoleProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500 font-bold';
      case 'warning': return 'text-orange-400';
      case 'success': return 'text-rose-400';
      case 'database': return 'text-fuchsia-400 font-black italic';
      default: return 'text-rose-200/60';
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('Node')) return '■';
    if (source.includes('Flask')) return '▲';
    if (source.includes('Lambda')) return 'λ';
    if (source.includes('SQLite')) return '◆';
    return '•';
  };

  return (
    <div className="bg-[#0f0101] rounded-2xl border border-rose-900/30 shadow-2xl flex flex-col h-[450px] overflow-hidden">
      <div className="bg-rose-950/20 px-5 py-3 border-b border-rose-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-900"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-900"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-900"></div>
          </div>
          <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest ml-2">Secure-Trace-Buffer</span>
        </div>
        <div className="flex gap-4">
           <span className="text-[10px] text-rose-500 font-black flex items-center gap-1">
             <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
             NODE_01_ACTIVE
           </span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-grow p-5 font-mono text-[11px] overflow-y-auto space-y-1.5 scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="text-rose-900 italic flex items-center gap-2">
            Awaiting process initialization...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-rose-900/10 p-1 rounded transition-colors group">
              <span className="text-rose-950 shrink-0 font-black">{log.timestamp}</span>
              <span className="text-rose-700 shrink-0 w-32 truncate flex items-center gap-1.5" title={log.source}>
                <span className="text-rose-500 opacity-40">{getSourceIcon(log.source)}</span> {log.source}
              </span>
              <span className={`break-all leading-relaxed ${getLevelColor(log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
      
      <div className="bg-rose-950/10 px-5 py-2 text-[10px] text-rose-900 flex justify-between border-t border-rose-900/20">
        <div className="flex gap-6 font-black uppercase tracking-tighter">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Ingest</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-600"></span> SQL.Sync</span>
        </div>
        <span className="font-black text-rose-800 tracking-widest">TLS_1.3_AUTH</span>
      </div>
    </div>
  );
};
