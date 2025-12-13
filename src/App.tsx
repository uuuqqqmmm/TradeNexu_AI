
import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TrendChart } from './components/TrendChart';
import { ProductCard } from './components/ProductCard';
import { MCPLiveLog } from './components/MCPLiveLog';
import { ThinkingChain } from './components/ThinkingChain';
import { AmazonResearchDialog } from './components/AmazonResearchDialog';
import { TikTokResearchDialog } from './components/TikTokResearchDialog';
import { ApiConfigDialog } from './components/ApiConfigDialog';
import { ProfitCalculator } from './components/ProfitCalculator';
import { SourcingSearch } from './components/SourcingSearch';
import { ProductDashboard } from './components/ProductDashboard';
import { ProductDetailPage } from './components/ProductDetailPage';
import { MemoryPanel } from './components/MemoryPanel';
import { generateTrendAnalysis } from './services/deepseekService';
import { AgentType, Message, MCPLog, MCPToolStatus, AgentProtocolEvent, ProductCatalog, ResearchTask, AmazonProductData } from './types';
import { TikTokProductData } from './services/tiktokService';
import { Send, Search, Cpu, BrainCircuit, ShieldAlert, Bot, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.GENERAL_MANAGER);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [logs, setLogs] = useState<MCPLog[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentType, MCPToolStatus>>({
    [AgentType.GENERAL_MANAGER]: MCPToolStatus.IDLE,
    [AgentType.MARKET_INTEL]: MCPToolStatus.IDLE,
    [AgentType.LEAD_NURTURING]: MCPToolStatus.IDLE,
    [AgentType.COMPLIANCE]: MCPToolStatus.IDLE,
    [AgentType.SUPPLY_CHAIN]: MCPToolStatus.IDLE,
  });

  // 模拟的产品资源库数据 (Mock Data)
  const [catalogData] = useState<ProductCatalog>({
    hotProducts: [
      { id: 'h1', name: '智能宠物喂食器 Pro', market: '北美 (USA)', url: 'https://www.amazon.com/s?k=smart+pet+feeder' },
      { id: 'h2', name: '全自动猫砂盆 v3', market: '欧洲 (EU)', url: 'https://www.alibaba.com/showroom/automatic-cat-litter-box.html' },
      { id: 'h3', name: '可降解拾便袋', market: '澳洲 (AU)', url: 'https://www.amazon.com.au/s?k=biodegradable+poop+bags' },
    ],
    clientInquiries: [
      { id: 'c1', name: '喂食器 (带摄像头版)', requirement: '客户要求必须支持5G Wifi' },
      { id: 'c2', name: '大型犬专用跑步机', requirement: '承重需达到50kg以上' },
    ],
    opportunities: [
      { id: 'o1', name: '宠物AI陪伴机器人', recommendation: 'High' },
      { id: 'o2', name: 'GPS定位项圈 (太阳能)', recommendation: 'Medium' },
      { id: 'o3', name: '静音宠物烘干箱', recommendation: 'Low' },
    ]
  });

  // 市场调研任务状态
  const [researchTasks, setResearchTasks] = useState<ResearchTask[]>([]);

  // Amazon 调研对话框状态
  const [isAmazonDialogOpen, setIsAmazonDialogOpen] = useState(false);

  // TikTok 调研对话框状态
  const [isTikTokDialogOpen, setIsTikTokDialogOpen] = useState(false);

  // API 配置对话框状态
  const [isApiConfigDialogOpen, setIsApiConfigDialogOpen] = useState(false);

  // 利润计算器状态
  const [isProfitCalculatorOpen, setIsProfitCalculatorOpen] = useState(false);
  const [profitCalculatorData, setProfitCalculatorData] = useState<{ sellPrice?: number; costPrice?: number; productName?: string }>({});

  // 供应链搜索状态
  const [isSourcingSearchOpen, setIsSourcingSearchOpen] = useState(false);
  const [sourcingSearchData, setSourcingSearchData] = useState<{ keyword?: string; amazonPrice?: number }>({});

  // 产品管理 Dashboard 状态
  const [isProductDashboardOpen, setIsProductDashboardOpen] = useState(false);

  // 产品详情页状态
  const [selectedProduct, setSelectedProduct] = useState<AmazonProductData | null>(null);

  // AI 模型选择状态
  const [selectedModel, setSelectedModel] = useState('deepseek-v3.1');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const availableModels = [
    { key: 'deepseek-v3.1', name: 'DeepSeek V3.1 (推荐)', description: '最新免费模型' },
    { key: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '快速响应' },
    { key: 'deepseek-chat', name: 'DeepSeek Chat', description: '原生API' },
  ];

  // 联网搜索模式状态
  const [webSearchMode, setWebSearchMode] = useState<'auto' | 'on' | 'off'>('auto');
  const [isWebSearchDropdownOpen, setIsWebSearchDropdownOpen] = useState(false);
  const webSearchModes = [
    { key: 'auto', name: '自动', description: 'AI 自动判断是否联网', icon: '🤖' },
    { key: 'on', name: '开启', description: '强制联网搜索', icon: '🌐' },
    { key: 'off', name: '关闭', description: '不使用联网搜索', icon: '🔒' },
  ];

  // 记忆面板状态
  const [isMemoryPanelExpanded, setIsMemoryPanelExpanded] = useState(false);

  // 打开利润计算器
  const openProfitCalculator = (costPrice?: number, sellPrice?: number, productName?: string) => {
    setProfitCalculatorData({ costPrice, sellPrice, productName });
    setIsProfitCalculatorOpen(true);
  };

  // 打开供应链搜索
  const openSourcingSearch = (keyword?: string, amazonPrice?: number) => {
    setSourcingSearchData({ keyword, amazonPrice });
    setIsSourcingSearchOpen(true);
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isAnalyzing]);

  // 通用日志添加器
  const addSystemLog = async (toolName: string, message: string, status: MCPToolStatus = MCPToolStatus.RUNNING) => {
    const newLog: MCPLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      toolName,
      message,
      status
    };
    setLogs(prev => [...prev, newLog]);
    // 基础系统日志延迟较短
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  // 协议日志添加器 (用于 Agent 通信)
  const addProtocolLog = async (event: AgentProtocolEvent) => {
    const newLog: MCPLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      toolName: 'PROTOCOL',
      status: MCPToolStatus.SUCCESS,
      message: 'Data exchange',
      protocolData: event
    };
    setLogs(prev => [...prev, newLog]);
    // 增加较长的延迟，让用户看清“对话”过程
    await new Promise(resolve => setTimeout(resolve, 800));
  };

  const resetAgentStatuses = () => {
    setAgentStatuses({
      [AgentType.GENERAL_MANAGER]: MCPToolStatus.IDLE,
      [AgentType.MARKET_INTEL]: MCPToolStatus.IDLE,
      [AgentType.LEAD_NURTURING]: MCPToolStatus.IDLE,
      [AgentType.COMPLIANCE]: MCPToolStatus.IDLE,
      [AgentType.SUPPLY_CHAIN]: MCPToolStatus.IDLE,
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query;
    setQuery(''); // 立即清空输入框
    setIsAnalyzing(true);
    setLogs([]);
    resetAgentStatuses();

    // Set GM to Running initially
    setAgentStatuses(prev => ({ ...prev, [AgentType.GENERAL_MANAGER]: MCPToolStatus.RUNNING }));

    // 添加用户消息
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentQuery,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, userMsg]);

    // 自动创建调研任务（如果查询涉及产品）
    const platformKeywords = {
      'Amazon': ['亚马逊', 'amazon'],
      'TikTok': ['tiktok', '抖音'],
      'Alibaba': ['阿里巴巴', 'alibaba'],
      'AliExpress': ['速卖通', 'aliexpress']
    };

    Object.entries(platformKeywords).forEach(([platform, keywords]) => {
      if (keywords.some(kw => currentQuery.toLowerCase().includes(kw.toLowerCase()))) {
        const newTask: ResearchTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          platform: platform as any,
          productQuery: currentQuery,
          status: 'pending',
          progress: 0,
          createdAt: Date.now()
        };
        setResearchTasks(prev => [newTask, ...prev]);

        // 模拟爬虫进度
        setTimeout(() => {
          setResearchTasks(prev => prev.map(t =>
            t.id === newTask.id ? { ...t, status: 'crawling', progress: 20 } : t
          ));
        }, 1000);

        setTimeout(() => {
          setResearchTasks(prev => prev.map(t =>
            t.id === newTask.id ? { ...t, progress: 60 } : t
          ));
        }, 3000);

        setTimeout(() => {
          setResearchTasks(prev => prev.map(t =>
            t.id === newTask.id ? { ...t, status: 'completed', progress: 100 } : t
          ));
        }, 5000);
      }
    });

    try {
      // 1. 系统初始化日志
      await addSystemLog('系统内核', '接收用户指令...', MCPToolStatus.IDLE);
      await addSystemLog('AI总管', '意图识别与任务规划中...', MCPToolStatus.RUNNING);

      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || 'openrouter';

      // 2. 调用 API (获取完整分析结果，使用选定的模型和联网模式)
      const analysisData = await generateTrendAnalysis(apiKey, currentQuery, chatHistory, selectedModel, webSearchMode);

      // 3. 播放 "Thinking Process" (语义记忆检索模拟)
      await addSystemLog('记忆中枢', '加载领域知识库 (RAG)...', MCPToolStatus.SUCCESS);
      setAgentStatuses(prev => ({ ...prev, [AgentType.GENERAL_MANAGER]: MCPToolStatus.SUCCESS }));

      // 4. 核心：播放 Agent 间的通信协议
      if (analysisData.agentProtocolLogs && analysisData.agentProtocolLogs.length > 0) {
        for (const protocolEvent of analysisData.agentProtocolLogs) {
          // Update Status to RUNNING for participating agents
          setAgentStatuses(prev => ({
            ...prev,
            [protocolEvent.from]: MCPToolStatus.RUNNING,
            [protocolEvent.to]: MCPToolStatus.RUNNING
          }));

          await addProtocolLog(protocolEvent);

          // Update Status to SUCCESS after step completes
          setAgentStatuses(prev => ({
            ...prev,
            [protocolEvent.from]: MCPToolStatus.SUCCESS,
            [protocolEvent.to]: MCPToolStatus.SUCCESS
          }));
        }
      } else {
        // Fallback if model forgets to generate logs
        await addSystemLog('AI总管', '正在整合各部门数据...', MCPToolStatus.RUNNING);
      }

      // 5. 最终确认
      await addSystemLog('AgentOps', '安全合规审查通过，生成最终报告。', MCPToolStatus.SUCCESS);

      // 添加 AI 回复
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: analysisData.summary,
        thinking: analysisData.thinking_process,
        data: analysisData,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, aiMsg]);

    } catch (error: any) {
      console.error('分析失败:', error);
      const errorMessage = error?.message || '未知错误';
      await addSystemLog('SYSTEM', `请求失败: ${errorMessage}`, MCPToolStatus.ERROR);
      setAgentStatuses(prev => ({ ...prev, [AgentType.GENERAL_MANAGER]: MCPToolStatus.ERROR }));

      // 根据错误类型显示不同的提示
      let userMessage = "报告指挥官：军团通信网络出现波动，请稍后重试。";
      if (errorMessage.includes('API Key') || errorMessage.includes('DeepSeek')) {
        userMessage = "⚠️ 系统配置错误：DeepSeek API Key 未配置。请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY";
      } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        userMessage = "⚠️ API 配额超限：请稍后重试或检查您的 DeepSeek API 配额";
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage = "⚠️ API 认证失败：请检查您的 DeepSeek API Key 是否有效";
      }

      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: userMessage,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectTask = (task: ResearchTask) => {
    console.log('Selected research task:', task);
    // TODO: 显示任务详情或加载到聊天中
  };

  // 处理 Amazon 调研结果
  const handleAmazonProductsFound = (products: AmazonProductData[]) => {
    console.log('Amazon 产品数据:', products);
    if (products.length > 0) {
      const newTask: ResearchTask = {
        id: `amazon_${Date.now()}`,
        platform: 'Amazon',
        productQuery: products[0].title.slice(0, 30),
        status: 'completed',
        progress: 100,
        createdAt: Date.now(),
        dataSource: products[0].dataSource
      };
      setResearchTasks(prev => [newTask, ...prev]);
    }
  };

  return (
    <div className="flex min-h-screen bg-nexus-900 text-gray-200 font-sans">
      {/* 中间：Agent 侧边栏 */}
      <Sidebar
        activeAgent={activeAgent}
        onSelectAgent={setActiveAgent}
        agentStatuses={agentStatuses}
        catalogData={catalogData}
        researchTasks={researchTasks}
        onSelectTask={handleSelectTask}
        onOpenAmazonResearch={() => setIsAmazonDialogOpen(true)}
        onOpenTikTokResearch={() => setIsTikTokDialogOpen(true)}
        onOpenApiConfig={() => setIsApiConfigDialogOpen(true)}
        onOpenSourcingSearch={() => openSourcingSearch()}
        onOpenProfitCalculator={() => openProfitCalculator()}
        onOpenProductDashboard={() => setIsProductDashboardOpen(true)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* 顶部导航 */}
        <header className="h-16 bg-nexus-900/90 border-b border-nexus-800 flex items-center px-8 justify-between backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
              <span className="w-2 h-6 bg-nexus-accent rounded-sm"></span>
              指挥中心控制台
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] bg-nexus-800 border border-nexus-700 text-gray-400">
              当前接入: {activeAgent === AgentType.GENERAL_MANAGER ? 'AI 总管' : activeAgent}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-nexus-800 rounded-full border border-nexus-700">
              <BrainCircuit size={14} className="text-nexus-accent" />
              <span>Agentic RAG: 激活</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-nexus-800 rounded-full border border-nexus-700">
              <ShieldAlert size={14} className="text-nexus-success" />
              <span>AgentOps: 安全</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-row">
          {/* 中间聊天区域 */}
          <div className="flex-1 flex flex-col relative">

            {/* 消息列表 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 scroll-smooth space-y-6 pb-32"
            >
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                  <Bot size={64} className="mb-4 text-nexus-accent" />
                  <h3 className="text-xl font-bold mb-2">指挥官，请下达指令</h3>
                  <p className="text-sm">AI 总管已就绪，随时调度全军团资源。</p>
                  <p className="text-xs mt-4 font-mono bg-nexus-800 px-3 py-1 rounded">试试输入: "分析一下最近南美市场的宠物用品趋势"</p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-nexus-accent'}`}>
                      {msg.role === 'user' ? <span className="text-xs font-bold">ME</span> : <Bot size={18} />}
                    </div>

                    <div className={`max-w-[85%] space-y-2`}>
                      {/* AI 消息特有的内容 */}
                      {msg.role === 'assistant' && (
                        <>
                          {/* 思考链展示 */}
                          {msg.thinking && <ThinkingChain content={msg.thinking} />}

                          {/* 文本回复 */}
                          <div className="bg-nexus-800 border border-nexus-700 p-4 rounded-xl rounded-tl-none shadow-md text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
                            {msg.content}
                          </div>

                          {/* 结构化建议 */}
                          {msg.data && msg.data.strategicAdvice && (
                            <div className="bg-nexus-900/50 p-4 rounded-lg border-l-4 border-nexus-warning mt-2">
                              <h5 className="text-nexus-warning font-bold text-xs mb-1 uppercase">战略建议</h5>
                              <p className="text-sm text-gray-300">{msg.data.strategicAdvice}</p>
                            </div>
                          )}

                          {/* 图表与卡片 */}
                          {msg.data && (
                            <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                              {Array.isArray(msg.data.trendData) && msg.data.trendData.length > 0 && (
                                <TrendChart data={msg.data.trendData} />
                              )}
                              {Array.isArray(msg.data.topProducts) && msg.data.topProducts.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {msg.data.topProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* 用户消息 */}
                      {msg.role === 'user' && (
                        <div className="bg-blue-600 text-white p-3 rounded-xl rounded-tr-none shadow-md text-sm">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isAnalyzing && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-nexus-accent flex items-center justify-center shrink-0">
                    <Bot size={18} />
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm bg-nexus-800/50 px-4 py-2 rounded-xl">
                    <Cpu size={14} className="animate-spin" />
                    <span>总管正在协调各部门 (A2A通信中)...</span>
                  </div>
                </div>
              )}
            </div>

            {/* 底部输入框 */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-nexus-900 via-nexus-900 to-transparent z-20">
              {/* 模型选择器 + 联网搜索开关 */}
              <div className="max-w-4xl mx-auto mb-2 flex items-center gap-4">
                {/* 模型选择 */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">模型:</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setIsModelDropdownOpen(!isModelDropdownOpen); setIsWebSearchDropdownOpen(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-nexus-800 border border-nexus-700 rounded-lg text-xs text-gray-300 hover:border-nexus-accent transition-colors"
                    >
                      <BrainCircuit size={12} className="text-nexus-accent" />
                      <span>{availableModels.find(m => m.key === selectedModel)?.name || selectedModel}</span>
                      <ChevronDown size={12} className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-1 w-64 bg-nexus-800 border border-nexus-700 rounded-lg shadow-xl overflow-hidden z-50">
                        {availableModels.map(model => (
                          <button
                            key={model.key}
                            onClick={() => {
                              setSelectedModel(model.key);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-nexus-700 transition-colors ${
                              selectedModel === model.key ? 'bg-nexus-700/50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <BrainCircuit size={14} className={selectedModel === model.key ? 'text-nexus-accent' : 'text-gray-500'} />
                              <div>
                                <div className="text-xs text-white">{model.name}</div>
                                <div className="text-[10px] text-gray-500">{model.description}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 联网搜索开关 */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">联网:</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setIsWebSearchDropdownOpen(!isWebSearchDropdownOpen); setIsModelDropdownOpen(false); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${
                        webSearchMode === 'on' 
                          ? 'bg-green-900/50 border-green-600 text-green-400' 
                          : webSearchMode === 'off' 
                            ? 'bg-red-900/50 border-red-600 text-red-400'
                            : 'bg-nexus-800 border-nexus-700 text-gray-300 hover:border-nexus-accent'
                      }`}
                    >
                      <span>{webSearchModes.find(m => m.key === webSearchMode)?.icon}</span>
                      <span>{webSearchModes.find(m => m.key === webSearchMode)?.name}</span>
                      <ChevronDown size={12} className={`transition-transform ${isWebSearchDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isWebSearchDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-1 w-56 bg-nexus-800 border border-nexus-700 rounded-lg shadow-xl overflow-hidden z-50">
                        {webSearchModes.map(mode => (
                          <button
                            key={mode.key}
                            onClick={() => {
                              setWebSearchMode(mode.key as 'auto' | 'on' | 'off');
                              setIsWebSearchDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-nexus-700 transition-colors ${
                              webSearchMode === mode.key ? 'bg-nexus-700/50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{mode.icon}</span>
                              <div>
                                <div className="text-xs text-white">{mode.name}</div>
                                <div className="text-[10px] text-gray-500">{mode.description}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleAnalyze} className="relative max-w-4xl mx-auto shadow-2xl">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className={`text-gray-500 ${isAnalyzing ? 'animate-pulse' : ''}`} size={20} />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="向 AI 总管下达指令... (例如：调研美国锂电池法规风险)"
                  className="w-full bg-nexus-800 border border-nexus-600 text-white pl-12 pr-14 py-4 rounded-xl shadow-lg focus:ring-2 focus:ring-nexus-accent focus:border-transparent transition-all placeholder-gray-500"
                  disabled={isAnalyzing}
                />
                <button
                  type="submit"
                  disabled={isAnalyzing || !query.trim()}
                  className="absolute inset-y-2 right-2 bg-nexus-accent hover:bg-blue-600 text-white p-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? <Cpu className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </div>

          {/* 右侧面板: MCP 日志 */}
          <div className="w-96 border-l border-nexus-800 bg-nexus-900/50 p-4 flex flex-col backdrop-blur-sm hidden xl:flex">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1">军团通信协议 (Protocol Logs)</h3>
            <div className="flex-1 overflow-hidden">
              <MCPLiveLog logs={logs} />
            </div>

            {/* Titans 长期记忆面板 */}
            <div className="mt-4">
              <MemoryPanel 
                isExpanded={isMemoryPanelExpanded}
                onToggle={() => setIsMemoryPanelExpanded(!isMemoryPanelExpanded)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Amazon 调研对话框 */}
      <AmazonResearchDialog
        isOpen={isAmazonDialogOpen}
        onClose={() => setIsAmazonDialogOpen(false)}
        onProductsFound={handleAmazonProductsFound}
        onProductClick={(product) => {
          setSelectedProduct(product);
          setIsAmazonDialogOpen(false);
        }}
      />

      {/* TikTok 调研对话框 */}
      <TikTokResearchDialog
        isOpen={isTikTokDialogOpen}
        onClose={() => setIsTikTokDialogOpen(false)}
      />

      {/* API 配置对话框 */}
      <ApiConfigDialog
        isOpen={isApiConfigDialogOpen}
        onClose={() => setIsApiConfigDialogOpen(false)}
      />

      {/* 利润计算器 */}
      <ProfitCalculator
        isOpen={isProfitCalculatorOpen}
        onClose={() => setIsProfitCalculatorOpen(false)}
        initialData={profitCalculatorData}
      />

      {/* 供应链搜索 */}
      <SourcingSearch
        isOpen={isSourcingSearchOpen}
        onClose={() => setIsSourcingSearchOpen(false)}
        initialKeyword={sourcingSearchData.keyword}
        amazonPrice={sourcingSearchData.amazonPrice}
        onOpenCalculator={(costPrice, sellPrice) => openProfitCalculator(costPrice, sellPrice)}
      />

      {/* 产品管理 Dashboard */}
      {isProductDashboardOpen && (
        <ProductDashboard onClose={() => setIsProductDashboardOpen(false)} />
      )}

      {/* 产品详情页 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50">
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
          />
        </div>
      )}
    </div>
  );
};
