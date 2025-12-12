
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Globe, Users, Scale, Network, Terminal, ShieldCheck, Command, CircleDashed, CheckCircle2, AlertCircle, Activity, PackageSearch, ChevronDown, ChevronRight, Flame, MessageSquare, PlusCircle, Sparkles, ExternalLink, TrendingUp, Clock, Loader, XCircle, BrainCircuit, ShoppingCart, Video, ShoppingBag, DollarSign, RefreshCw, Wallet, CreditCard, Settings, Key, Calculator, Search, Truck } from 'lucide-react';
import { AgentType, MCPToolStatus, ProductCatalog, ResearchTask } from '../types';
import { getApifyBillingInfo, ApifyBillingInfo, isApifyConfigured } from '../services/apifyUsageService';
import { getConfigStats } from '../services/apiConfigService';

interface SidebarProps {
  activeAgent: AgentType;
  onSelectAgent: (agent: AgentType) => void;
  agentStatuses: Record<AgentType, MCPToolStatus>;
  catalogData: ProductCatalog;
  researchTasks: ResearchTask[];
  onSelectTask: (task: ResearchTask) => void;
  onOpenAmazonResearch?: () => void;  // Amazon 调研对话框回调
  onOpenTikTokResearch?: () => void;  // TikTok 调研对话框回调
  onOpenApiConfig?: () => void;       // API 配置对话框回调
  onOpenSourcingSearch?: () => void;  // 供应链搜索回调
  onOpenProfitCalculator?: () => void; // 利润计算器回调
  onOpenProductDashboard?: () => void; // 产品管理 Dashboard 回调
}

export const Sidebar: React.FC<SidebarProps> = ({ activeAgent, onSelectAgent, agentStatuses, catalogData, researchTasks, onSelectTask, onOpenAmazonResearch, onOpenTikTokResearch, onOpenApiConfig, onOpenSourcingSearch, onOpenProfitCalculator, onOpenProductDashboard }) => {
  const [expandedSections, setExpandedSections] = useState({
    agentMatrix: false,
    marketResearch: false,
    researchTasksSub: false,
    apiBilling: false,
    productCatalog: false,
    hotProducts: false,
    clientInquiries: false,
    opportunities: false,
    systemConfig: false,
    supplyChain: false,
  });

  // API 配置统计
  const [apiStats, setApiStats] = useState({ total: 0, configured: 0, required: 0, requiredConfigured: 0 });

  // Apify 资费状态
  const [apifyBilling, setApifyBilling] = useState<ApifyBillingInfo | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  // 加载 Apify 资费信息
  const loadApifyBilling = async () => {
    if (!isApifyConfigured()) return;
    
    setIsLoadingBilling(true);
    try {
      const billing = await getApifyBillingInfo();
      setApifyBilling(billing);
    } catch (error) {
      console.error('加载 Apify 资费失败:', error);
    } finally {
      setIsLoadingBilling(false);
    }
  };

  // 组件挂载时加载资费信息和 API 配置统计
  useEffect(() => {
    loadApifyBilling();
    setApiStats(getConfigStats());
    // 每 5 分钟自动刷新
    const interval = setInterval(loadApifyBilling, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 监听 API 配置变更
  useEffect(() => {
    const handleConfigChange = () => setApiStats(getConfigStats());
    window.addEventListener('api-config-changed', handleConfigChange);
    return () => window.removeEventListener('api-config-changed', handleConfigChange);
  }, []);

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

              {/* Amazon 调研快捷入口 */}
              <button
                onClick={onOpenAmazonResearch}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/10 to-transparent hover:from-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-lg transition-all group"
              >
                <div className="p-1.5 rounded-md bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <ShoppingCart size={16} className="text-orange-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-200 group-hover:text-orange-400 transition-colors">Amazon 调研</div>
                  <div className="text-[10px] text-gray-500">ASIN/关键词/URL 搜索</div>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* TikTok 调研快捷入口 */}
              <button
                onClick={onOpenTikTokResearch}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/30 hover:border-pink-500/50 rounded-lg transition-all group"
              >
                <div className="p-1.5 rounded-md bg-gradient-to-br from-pink-500/20 to-purple-500/20 group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-colors">
                  <Video size={16} className="text-pink-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-200 group-hover:text-pink-400 transition-colors">TikTok 调研</div>
                  <div className="text-[10px] text-gray-500">热销产品与趋势分析</div>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
              </button>

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

              {/* 2.3 API 资费监控 (二级目录) */}
              <div className="overflow-hidden rounded-lg bg-nexus-800/20 border border-nexus-800/50">
                <button
                  onClick={() => toggleSection('apiBilling')}
                  className="w-full px-3 py-2 bg-nexus-800/30 border-b border-nexus-800/50 flex items-center gap-2 hover:bg-nexus-800/50 transition-colors"
                >
                  <Wallet size={12} className="text-green-400" />
                  <span className="text-xs font-bold text-gray-300 flex-1 text-left">3. API 资费监控</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); loadApifyBilling(); }}
                    className="p-1 hover:bg-nexus-700 rounded transition-colors"
                    title="刷新资费"
                  >
                    <RefreshCw size={10} className={`text-gray-500 hover:text-green-400 ${isLoadingBilling ? 'animate-spin' : ''}`} />
                  </button>
                  {expandedSections.apiBilling ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>

                {expandedSections.apiBilling && (
                  <div className="p-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                    {/* Apify 资费卡片 */}
                    {isApifyConfigured() ? (
                      <div className="space-y-2">
                        {/* 账户信息 */}
                        {apifyBilling?.account && (
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <CreditCard size={10} className="text-blue-400" />
                            <span>{apifyBilling.account.username}</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px]">
                              {apifyBilling.account.plan.name}
                            </span>
                          </div>
                        )}

                        {/* 使用进度条 */}
                        {apifyBilling?.usage && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-400">本月额度</span>
                              <span className="text-gray-300">
                                ${apifyBilling.usage.costs.total.toFixed(2)} / ${apifyBilling.usage.limits.monthlyUsageUsd.toFixed(2)}
                              </span>
                            </div>
                            <div className="h-2 bg-nexus-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  apifyBilling.usage.limits.usedPercentage > 80 
                                    ? 'bg-red-500' 
                                    : apifyBilling.usage.limits.usedPercentage > 50 
                                      ? 'bg-yellow-500' 
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, apifyBilling.usage.limits.usedPercentage)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-gray-500">
                                已用 {apifyBilling.usage.limits.usedPercentage.toFixed(1)}%
                              </span>
                              <span className="text-green-400">
                                剩余 ${apifyBilling.usage.limits.remainingUsd.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 使用明细 */}
                        {apifyBilling?.usage && (
                          <div className="pt-2 border-t border-nexus-800/50 space-y-1">
                            <div className="text-[9px] text-gray-500 mb-1">使用明细</div>
                            <div className="grid grid-cols-2 gap-1 text-[9px]">
                              <div className="flex justify-between px-2 py-1 bg-nexus-800/30 rounded">
                                <span className="text-gray-400">计算单元</span>
                                <span className="text-gray-300">{apifyBilling.usage.usage.actorComputeUnits.toFixed(3)} CU</span>
                              </div>
                              <div className="flex justify-between px-2 py-1 bg-nexus-800/30 rounded">
                                <span className="text-gray-400">数据传输</span>
                                <span className="text-gray-300">{apifyBilling.usage.usage.dataTransferGb.toFixed(3)} GB</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 最后更新时间 */}
                        {apifyBilling?.lastUpdated && (
                          <div className="text-[9px] text-gray-600 text-right">
                            更新于 {new Date(apifyBilling.lastUpdated).toLocaleTimeString('zh-CN')}
                          </div>
                        )}

                        {/* 错误提示 */}
                        {apifyBilling?.error && (
                          <div className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded">
                            {apifyBilling.error}
                          </div>
                        )}

                        {/* 加载中 */}
                        {isLoadingBilling && !apifyBilling && (
                          <div className="flex items-center justify-center py-4">
                            <Loader size={16} className="text-green-400 animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <DollarSign size={20} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-[10px] text-gray-500">未配置 Apify Token</p>
                        <p className="text-[9px] text-gray-600 mt-1">在 .env 中设置 VITE_APIFY_TOKEN</p>
                      </div>
                    )}
                  </div>
                )}
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
              {/* 产品管理中心入口 */}
              <button
                onClick={onOpenProductDashboard}
                className="w-full px-3 py-2.5 flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors mb-2"
              >
                <PackageSearch size={14} />
                <span className="font-medium flex-1 text-left">产品管理中心</span>
                <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded">Dashboard</span>
              </button>

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

        {/* 4. 供应链工具 */}
        <div>
          <button
            onClick={() => toggleSection('supplyChain')}
            className="w-full px-6 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>供应链工具</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-gray-600" />
              {expandedSections.supplyChain ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          </button>

          {expandedSections.supplyChain && (
            <div className="px-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
              {/* 1688 货源搜索 */}
              <button
                onClick={onOpenSourcingSearch}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/10 to-transparent hover:from-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 rounded-lg transition-all group"
              >
                <div className="p-1.5 rounded-md bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Search size={16} className="text-orange-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-200 group-hover:text-orange-400 transition-colors">1688 货源搜索</div>
                  <div className="text-[10px] text-gray-500">搜索供应商、以图搜图</div>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* 利润计算器 */}
              <button
                onClick={onOpenProfitCalculator}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-transparent hover:from-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-lg transition-all group"
              >
                <div className="p-1.5 rounded-md bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <Calculator size={16} className="text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-200 group-hover:text-green-400 transition-colors">利润计算器</div>
                  <div className="text-[10px] text-gray-500">成本核算、利润试算</div>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-green-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}
        </div>

        {/* 5. 系统配置 */}
        <div>
          <button
            onClick={() => toggleSection('systemConfig')}
            className="w-full px-6 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>系统配置</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-gray-600" />
              {expandedSections.systemConfig ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          </button>

          {expandedSections.systemConfig && (
            <div className="px-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
              {/* API 接口配置 */}
              <button
                onClick={onOpenApiConfig}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-500/10 to-transparent hover:from-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg transition-all group"
              >
                <div className="p-1.5 rounded-md bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
                  <Key size={16} className="text-indigo-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition-colors">API 接口配置</div>
                  <div className="text-[10px] text-gray-500">
                    已配置 {apiStats.configured}/{apiStats.total} 个接口
                    {apiStats.requiredConfigured < apiStats.required && (
                      <span className="ml-1 text-yellow-500">
                        (缺少 {apiStats.required - apiStats.requiredConfigured} 个必需)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {apiStats.requiredConfigured === apiStats.required ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <AlertCircle size={14} className="text-yellow-500" />
                  )}
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
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
