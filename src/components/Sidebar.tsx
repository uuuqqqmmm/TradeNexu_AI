
import React, { useState } from 'react';
import { LayoutDashboard, Globe, Users, Scale, Network, Terminal, ShieldCheck, Command, CircleDashed, CheckCircle2, AlertCircle, Activity, PackageSearch, ChevronDown, ChevronRight, Flame, MessageSquare, PlusCircle, Sparkles, ExternalLink, TrendingUp, Clock, Loader, XCircle, BrainCircuit, ShoppingCart, Video, ShoppingBag } from 'lucide-react';
import { AgentType, MCPToolStatus, ProductCatalog, ResearchTask } from '../types';

interface SidebarProps {
  activeAgent: AgentType;
  onSelectAgent: (agent: AgentType) => void;
  agentStatuses: Record<AgentType, MCPToolStatus>;
  catalogData: ProductCatalog;
  researchTasks: ResearchTask[];
  onSelectTask: (task: ResearchTask) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeAgent, onSelectAgent, agentStatuses, catalogData, researchTasks, onSelectTask }) => {
  const [expandedSections, setExpandedSections] = useState({
    agentMatrix: true,
    marketResearch: true,
    researchTasksSub: true,
    productCatalog: true,
    hotProducts: true,
    clientInquiries: false,
    opportunities: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const agents = [
    { id: AgentType.GENERAL_MANAGER, icon: Command, label: 'AI 总管 (指挥官)', desc: '任务调度与统筹' },
    { id: AgentType.MARKET_INTEL, icon: Globe, label: '市场情报官', desc: '趋势与寻源分析' },
    { id: AgentType.LEAD_NURTURING, icon: Users, label: '客户开发官', desc: '外联与CRM管理' },
    { id: AgentType.COMPLIANCE, icon: Scale, label: '贸易合规官', desc: '法律与HS编码' },
    { id: AgentType.SUPPLY_CHAIN, icon: Network, label: '供应链总监', desc: '物流与供应商' },
  ];

  const getStatusIcon = (status: MCPToolStatus) => {
    switch (status) {
      case MCPToolStatus.RUNNING: return <CircleDashed size={14} className="text-nexus-accent animate-spin" />;
      case MCPToolStatus.SUCCESS: return <CheckCircle2 size={14} className="text-nexus-success" />;
      case MCPToolStatus.ERROR: return <AlertCircle size={14} className="text-red-500" />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-700" />;
    }
  };

  const getRecColor = (level?: string) => {
    switch (level) {
      case 'High': return 'text-nexus-success border-nexus-success/30 bg-nexus-success/10';
      case 'Medium': return 'text-nexus-warning border-nexus-warning/30 bg-nexus-warning/10';
      case 'Low': return 'text-gray-400 border-gray-600/30 bg-gray-700/30';
      default: return 'text-gray-400';
    }
  };

  const getTaskStatusIcon = (status: ResearchTask['status']) => {
    switch (status) {
      case 'pending': return <Clock size={14} className="text-gray-500" />;
      case 'crawling': return <Loader size={14} className="text-nexus-accent animate-spin" />;
      case 'completed': return <CheckCircle2 size={14} className="text-nexus-success" />;
      case 'failed': return <XCircle size={14} className="text-red-500" />;
    }
  };

  return (
    <div className="w-72 bg-nexus-900 border-r border-nexus-800 flex flex-col h-screen sticky top-0 shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-nexus-800 shrink-0 sticky top-0 bg-nexus-900 z-10">
        <div className="flex items-center gap-2 text-nexus-accent mb-1">
          <LayoutDashboard size={24} />
          <h1 className="font-bold text-xl tracking-tight">TradeNexus</h1>
        </div>
        <p className="text-xs text-gray-500">外贸人工智能军团 v2.0</p>
      </div>

      <div className="py-4 space-y-6">
        <div>
          <button
            onClick={() => toggleSection('agentMatrix')}
            className="w-full px-6 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>智能体矩阵</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-gray-600" />
              {expandedSections.agentMatrix ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          </button>

          {expandedSections.agentMatrix && (
            <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent.id)}
                  className={`w-full px-6 py-3 flex items-center gap-3 transition-all border-l-2 relative group ${activeAgent === agent.id ? 'bg-nexus-800/50 border-nexus-accent text-white' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-nexus-800/30'
                    }`}
                >
                  <agent.icon size={18} className={`shrink-0 ${activeAgent === agent.id ? 'text-nexus-accent' : ''}`} />
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{agent.label}</div>
                    <div className="text-[10px] text-gray-500 truncate">{agent.desc}</div>
                  </div>
                  <div className="ml-2 shrink-0 flex items-center justify-center w-5 h-5">
                    {getStatusIcon(agentStatuses[agent.id] || MCPToolStatus.IDLE)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>



        {/* 2. 市场调研模块 */}
        {/* 2. 市场调研模块 */}
        <div>
          <button
            onClick={() => toggleSection('marketResearch')}
            className="w-full px-6 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>市场调研模块</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-gray-600" />
              {expandedSections.marketResearch ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          </button>

          {expandedSections.marketResearch && (
            <div className="px-3 space-y-2 animate-in slide-in-from-top-1 duration-200">

              {/* 2.1 调研任务 (二级目录) */}
              <div className="overflow-hidden rounded-lg bg-nexus-800/20 border border-nexus-800/50">
                <button
                  onClick={() => toggleSection('researchTasksSub')}
                  className="w-full px-3 py-2 bg-nexus-800/30 border-b border-nexus-800/50 flex items-center gap-2 hover:bg-nexus-800/50 transition-colors"
                >
                  <Globe size={12} className="text-nexus-accent" />
                  <span className="text-xs font-bold text-gray-300 flex-1 text-left">1. 调研任务</span>
                  {expandedSections.researchTasksSub ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>

                {expandedSections.researchTasksSub && (
                  <div className="p-2 space-y-3 animate-in slide-in-from-top-1 duration-200">
                    {/* 平台列表 */}
                    {[
                      { id: 'Amazon', label: '亚马逊', icon: ShoppingCart, color: 'text-orange-400' },
                      { id: 'TikTok', label: 'TikTok', icon: Video, color: 'text-pink-500' },
                      { id: 'Alibaba', label: '阿里巴巴', icon: Globe, color: 'text-orange-500' },
                      { id: 'AliExpress', label: '速卖通', icon: ShoppingBag, color: 'text-red-500' }
                    ].map(platform => {
                      const platformTasks = researchTasks.filter(t => t.platform === platform.id);
                      return (
                        <div key={platform.id} className="space-y-1">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                              <platform.icon size={10} className={platform.color} />
                              <span>{platform.label}</span>
                            </div>
                            {platformTasks.length > 0 && (
                              <span className="text-[9px] px-1 rounded bg-nexus-800 text-gray-500">{platformTasks.length}</span>
                            )}
                          </div>

                          {/* 任务列表 */}
                          {platformTasks.length > 0 && (
                            <div className="pl-2 space-y-1">
                              {platformTasks.map(task => (
                                <button
                                  key={task.id}
                                  onClick={() => onSelectTask(task)}
                                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-nexus-800/50 text-left group transition-colors"
                                >
                                  <span className="text-[10px] text-gray-300 truncate max-w-[120px] group-hover:text-nexus-accent">{task.productQuery}</span>
                                  {getTaskStatusIcon(task.status)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2.2 AI智能综合分析 (二级目录) */}
              <div className="overflow-hidden rounded-lg bg-nexus-800/20 border border-nexus-800/50">
                <button
                  onClick={() => console.log("AI Analysis Clicked")}
                  className="w-full px-3 py-2 bg-nexus-800/30 hover:bg-nexus-800/50 transition-colors flex items-center gap-2 text-left"
                >
                  <BrainCircuit size={12} className="text-purple-400" />
                  <span className="text-xs font-bold text-gray-300">2. AI 智能综合分析</span>
                  <ChevronRight size={10} className="ml-auto text-gray-600" />
                </button>
              </div>

            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection('productCatalog')}
            className="w-full px-6 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>产品资源库</span>
            </div>
            <div className="flex items-center gap-2">
              <PackageSearch size={14} className="text-gray-600" />
              {expandedSections.productCatalog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          </button>

          {expandedSections.productCatalog && (
            <div className="space-y-1 px-3 animate-in slide-in-from-top-1 duration-200">
              <div className="overflow-hidden rounded-lg bg-nexus-800/20 border border-nexus-800/50">
                <button onClick={() => toggleSection('hotProducts')} className="w-full px-3 py-2 flex items-center gap-2 text-xs text-gray-300 hover:bg-nexus-800/40 transition-colors">
                  <Flame size={14} className="text-orange-500" />
                  <span className="font-medium flex-1 text-left">爆款产品目录</span>
                  {expandedSections.hotProducts ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {expandedSections.hotProducts && (
                  <div className="px-3 pb-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {catalogData.hotProducts.map(item => (
                      <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col p-2 rounded hover:bg-nexus-800/50 cursor-pointer group transition-colors text-decoration-none" onClick={(e) => !item.url && e.preventDefault()}>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-300 font-medium group-hover:text-nexus-accent transition-colors flex items-center gap-1">
                            {item.name}
                            {item.url && <ExternalLink size={10} className="opacity-40 group-hover:opacity-100 transition-opacity" />}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Globe size={10} className="text-gray-500" />
                          <span className="text-[10px] text-gray-500">市场: {item.market}</span>
                        </div>
                      </a>
                    ))}
                    <button className="w-full mt-1 py-1.5 flex items-center justify-center gap-1 border border-dashed border-gray-700 rounded text-[10px] text-gray-500 hover:text-nexus-accent hover:border-nexus-accent/50 transition-colors">
                      <PlusCircle size={10} />
                      自主添加
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg bg-nexus-800/20 border border-nexus-800/50">
                <button onClick={() => toggleSection('clientInquiries')} className="w-full px-3 py-2 flex items-center gap-2 text-xs text-gray-300 hover:bg-nexus-800/40 transition-colors">
                  <MessageSquare size={14} className="text-blue-400" />
                  <span className="font-medium flex-1 text-left">客户咨询目录</span>
                  {expandedSections.clientInquiries ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {expandedSections.clientInquiries && (
                  <div className="px-3 pb-2 space-y-1">
                    {catalogData.clientInquiries.map(item => (
                      <div key={item.id} className="p-2 rounded hover:bg-nexus-800/50 cursor-pointer group">
                        <div className="text-xs text-gray-300 font-medium">{item.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">"{item.requirement}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg bg-nexus-800/20 border border-nexus-800/50">
                <button onClick={() => toggleSection('opportunities')} className="w-full px-3 py-2 flex items-center gap-2 text-xs text-gray-300 hover:bg-nexus-800/40 transition-colors">
                  <Sparkles size={14} className="text-purple-400" />
                  <span className="font-medium flex-1 text-left">待拓展目录</span>
                  {expandedSections.opportunities ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {expandedSections.opportunities && (
                  <div className="px-3 pb-2 space-y-1">
                    {catalogData.opportunities.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-nexus-800/50 cursor-pointer">
                        <span className="text-xs text-gray-300">{item.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getRecColor(item.recommendation)}`}>
                          {item.recommendation}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-nexus-800 bg-nexus-900/50 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase">系统健康度</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div className="space-y-2 text-[10px] font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <Terminal size={10} />
            <span>核心编排器</span>
            <span className="ml-auto text-emerald-500">●</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={10} />
            <span>AgentOps 监控</span>
            <span className="ml-auto text-emerald-500">●</span>
          </div>
        </div>
      </div>
    </div >
  );
};
