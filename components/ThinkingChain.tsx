
import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';

interface ThinkingChainProps {
  content: string;
}

export const ThinkingChain: React.FC<ThinkingChainProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="mb-4 rounded-lg border border-nexus-700/50 bg-nexus-800/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-400 hover:text-nexus-accent hover:bg-nexus-800/50 transition-colors"
      >
        <BrainCircuit size={14} className={isOpen ? "text-nexus-accent" : "text-gray-500"} />
        <span>思考过程</span>
        {isOpen ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />}
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 bg-nexus-900/50 text-gray-400 text-xs font-mono leading-relaxed border-t border-nexus-700/30 whitespace-pre-wrap animate-in slide-in-from-top-2 duration-200">
          {content}
        </div>
      )}
    </div>
  );
};
