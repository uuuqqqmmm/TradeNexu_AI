
import React, { useEffect, useRef } from 'react';
import { MCPLog, MCPToolStatus } from '../types';
import { Terminal, CheckCircle2, CircleDashed, AlertCircle, ArrowRight, ArrowLeft, Database } from 'lucide-react';

interface MCPLiveLogProps {
  logs: MCPLog[];
}

export const MCPLiveLog: React.FC<MCPLiveLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (status: MCPToolStatus) => {
    switch (status) {
      case MCPToolStatus.RUNNING: return <CircleDashed size={14} className="animate-spin text-nexus-accent" />;
      case MCPToolStatus.SUCCESS: return <CheckCircle2 size={14} className="text-nexus-success" />;
      case MCPToolStatus.ERROR: return <AlertCircle size={14} className="text-red-500" />;
      default: return <ArrowRight size={14} className="text-gray-500" />;
    }
  };

  const formatJSON = (jsonString: string) => {
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  const isJSON = (str: string) => {
    try { JSON.parse(str); return true; } catch (e) { return false; }
  };

  const renderContent = (log: MCPLog) => {
    if (log.protocolData) {
      const { from, to, action, content } = log.protocolData;
      const isRequest = action === 'REQUEST';
      const hasJSON = isJSON(content);
      
      return (
        <div className={`flex flex-col w-full p-2 rounded border my-1 transition-all ${
          isRequest ? 'bg-blue-900/10 border-blue-800/30' : 'bg-emerald-900/10 border-emerald-800/30'
        }`}>
          <div className="flex items-center gap-2 mb-1 text-[10px] font-bold tracking-wider">
            {isRequest ? (
               <>
                 <span className="text-blue-400">[{from}]</span>
                 <ArrowRight size={10} className="text-blue-500/50" />
                 <span className="text-gray-400">[{to}]</span>
               </>
            ) : (
               <>
                 <span className="text-emerald-400">[{from}]</span>
                 <ArrowLeft size={10} className="text-emerald-500/50" />
                 <span className="text-gray-400">[{to}]</span>
               </>
            )}
            <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] ${isRequest ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{action}</span>
          </div>
          <div className={`text-[10px] font-mono pl-1 border-l-2 ${isRequest ? 'border-blue-700 text-blue-100' : 'border-emerald-700 text-emerald-100'}`}>
            {hasJSON ? <pre className="overflow-x-auto p-1 bg-black/20 rounded text-[9px] leading-relaxed">{formatJSON(content)}</pre> : <span>{content}</span>}
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-2 max-w-full">
        <div className="mt-0.5">{getIcon(log.status)}</div>
        <div className="flex-1 min-w-0">
          <span className={`font-bold mr-2 text-nexus-accent`}>[{log.toolName}]</span>
          <span className="text-gray-300 break-words">{log.message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-nexus-900 rounded-lg border border-nexus-700 overflow-hidden flex flex-col h-full shadow-inner">
      <div className="px-3 py-2 bg-nexus-800 border-b border-nexus-700 flex items-center justify-between shrink-0">
        <span className="text-xs font-mono text-gray-400 flex items-center gap-2"><Terminal size={12} />MCP://PROTOCOL_STREAM</span>
        <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50"></div><div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div><div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50"></div></div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-gray-600 italic text-center mt-8 flex flex-col items-center gap-3"><Database size={20} className="opacity-20"/><span className="opacity-50">Awaiting A2A Handshake...</span></div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-gray-600 min-w-[45px] text-[9px] mt-1 tabular-nums">{log.timestamp}</span>
            <div className="flex-1 min-w-0">{renderContent(log)}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
