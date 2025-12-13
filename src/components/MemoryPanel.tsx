/**
 * 3.5.14: 前端记忆面板
 * 显示 Titans 长期记忆系统状态
 */

import React, { useState, useEffect } from 'react';
import { Brain, Database, Network, MessageSquare, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';

// 后端 API 地址 - 直接调用后端避免代理问题
const API_BASE = 'http://localhost:3000';

interface MemoryStats {
  factualMemory: { quotes: number };
  semanticMemory: { knowledgeChunks: number };
  associativeMemory: { relations: number };
  conversationMemory: { summaries: number };
  totalMemories: number;
}

interface MemoryPanelProps {
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ isExpanded = false, onToggle }) => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemoryStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/memory/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setIsConnected(true);
      } else {
        setIsConnected(false);
        setError('数据库未连接');
      }
    } catch (err) {
      setIsConnected(false);
      setError('无法连接到记忆服务');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoryStats();
    // 每 30 秒刷新一次
    const interval = setInterval(fetchMemoryStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const memoryTypes = [
    { 
      key: 'factual', 
      name: '事实记忆', 
      icon: Database, 
      count: stats?.factualMemory?.quotes || 0,
      description: '报价/价格数据',
      color: 'text-blue-400'
    },
    { 
      key: 'semantic', 
      name: '语义记忆', 
      icon: Brain, 
      count: stats?.semanticMemory?.knowledgeChunks || 0,
      description: '法规/知识库',
      color: 'text-purple-400'
    },
    { 
      key: 'associative', 
      name: '关联记忆', 
      icon: Network, 
      count: stats?.associativeMemory?.relations || 0,
      description: '实体关系图谱',
      color: 'text-green-400'
    },
    { 
      key: 'conversation', 
      name: '对话记忆', 
      icon: MessageSquare, 
      count: stats?.conversationMemory?.summaries || 0,
      description: '对话摘要',
      color: 'text-orange-400'
    },
  ];

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
      {/* 头部 */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-200">长期记忆</span>
          {isConnected ? (
            <CheckCircle className="w-3 h-3 text-green-400" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {stats?.totalMemories || 0} 条
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchMemoryStats();
            }}
            className="p-1 hover:bg-slate-600/50 rounded transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-700/50">
          {error ? (
            <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-400">
              {error}
              <div className="mt-1 text-slate-500">
                请确保 PostgreSQL 数据库已启动
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {memoryTypes.map(({ key, name, icon: Icon, count, description, color }) => (
                <div 
                  key={key}
                  className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <div>
                      <div className="text-xs font-medium text-slate-200">{name}</div>
                      <div className="text-xs text-slate-500">{description}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-mono ${color}`}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 连接状态 */}
          <div className="mt-3 pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">数据库状态</span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
