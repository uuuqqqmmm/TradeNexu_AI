import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, ShoppingCart, TrendingUp, Package, 
  DollarSign, Shield, Truck, AlertTriangle, ExternalLink,
  Copy, Check, Loader2, RefreshCw, Calculator, Search
} from 'lucide-react';
import { AmazonProductData, SourcingInfo, ComplianceCheck, ProfitCalculation } from '../types';

interface ProductDetailPageProps {
  product: AmazonProductData;
  onBack: () => void;
  onFindSourcing?: (asin: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ 
  product, 
  onBack,
  onFindSourcing 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sourcing' | 'profit' | 'compliance'>('overview');
  const [copied, setCopied] = useState(false);
  const [isLoadingSourcing, setIsLoadingSourcing] = useState(false);
  const [sourcingResults, setSourcingResults] = useState<SourcingInfo[]>([]);
  const [profitCalc, setProfitCalc] = useState<ProfitCalculation | null>(null);
  const [complianceCheck, setComplianceCheck] = useState<ComplianceCheck | null>(null);

  // 利润计算器状态
  const [sellPrice, setSellPrice] = useState(product.price || 0);
  const [costPrice, setCostPrice] = useState(0);
  const [shippingCost, setShippingCost] = useState(15);
  const [exchangeRate, setExchangeRate] = useState(7.2);

  // 复制 ASIN
  const copyAsin = () => {
    navigator.clipboard.writeText(product.asin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 计算利润
  const calculateProfit = () => {
    const sellPriceUSD = sellPrice;
    const sellPriceCNY = sellPriceUSD * exchangeRate;
    const platformFee = sellPriceCNY * 0.15; // 15% 平台佣金
    const fbaFee = sellPriceCNY * 0.20; // 20% FBA 费用估算
    const marketingCost = sellPriceCNY * 0.10; // 10% 广告费
    const totalCost = costPrice + shippingCost + platformFee + fbaFee + marketingCost;
    const netProfit = sellPriceCNY - totalCost;
    const profitMargin = sellPriceCNY > 0 ? (netProfit / sellPriceCNY) * 100 : 0;

    setProfitCalc({
      sellPrice: sellPriceUSD,
      costPrice,
      shippingCost,
      platformFee,
      fbaFee,
      marketingCost,
      netProfit,
      profitMargin,
      exchangeRate
    });
  };

  // 模拟货源搜索
  const searchSourcing = async () => {
    setIsLoadingSourcing(true);
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟货源数据
    const mockSourcing: SourcingInfo[] = [
      {
        id: '1',
        supplierUrl: 'https://detail.1688.com/offer/123456.html',
        supplierName: '深圳优品科技有限公司',
        costPrice: 35,
        currency: 'CNY',
        moq: 100,
        supplierRating: 4.8,
        shopYears: 5,
        matchScore: 0.92,
        imageUrl: product.mainImage
      },
      {
        id: '2',
        supplierUrl: 'https://detail.1688.com/offer/789012.html',
        supplierName: '广州创新电子厂',
        costPrice: 32,
        currency: 'CNY',
        moq: 200,
        supplierRating: 4.6,
        shopYears: 3,
        matchScore: 0.85,
        imageUrl: product.mainImage
      },
      {
        id: '3',
        supplierUrl: 'https://detail.1688.com/offer/345678.html',
        supplierName: '义乌小商品批发',
        costPrice: 28,
        currency: 'CNY',
        moq: 500,
        supplierRating: 4.4,
        shopYears: 7,
        matchScore: 0.78,
        imageUrl: product.mainImage
      }
    ];
    
    setSourcingResults(mockSourcing);
    if (mockSourcing.length > 0) {
      setCostPrice(mockSourcing[0].costPrice);
    }
    setIsLoadingSourcing(false);
  };

  // 模拟合规检查
  const checkCompliance = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setComplianceCheck({
      market: 'US',
      hsCode: '8471.30.0100',
      taxRate: 0,
      certificationsRequired: ['FCC', 'UL'],
      riskLevel: 'low',
      notes: '该产品属于电子类，出口美国需要 FCC 认证。当前关税为 0%，无额外反倾销税。'
    });
  };

  useEffect(() => {
    checkCompliance();
  }, []);

  const tabs = [
    { id: 'overview', label: '产品概览', icon: Package },
    { id: 'sourcing', label: '1688货源', icon: Search },
    { id: 'profit', label: '利润计算', icon: Calculator },
    { id: 'compliance', label: '合规检查', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-nexus-900 text-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-nexus-900/95 backdrop-blur-sm border-b border-nexus-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回列表</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-nexus-800 px-3 py-1.5 rounded-lg">
              <span className="text-gray-400 text-sm">ASIN:</span>
              <code className="text-nexus-accent font-mono">{product.asin}</code>
              <button
                onClick={copyAsin}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-nexus-accent hover:bg-nexus-accent/80 px-4 py-2 rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
              <span>Amazon 页面</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 产品基本信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 产品图片 */}
          <div className="bg-nexus-800 rounded-xl p-6">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-white">
              <img
                src={product.mainImage}
                alt={product.title}
                className="w-full h-full object-contain"
              />
              {/* 数据来源标签 */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white ${
                product.dataSource === 'real' ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                {product.dataSource === 'real' ? '真实数据' : '模拟数据'}
              </div>
            </div>
          </div>

          {/* 产品信息 */}
          <div className="space-y-6">
            <h1 className="text-2xl font-bold leading-tight">{product.title}</h1>
            
            {/* 价格和销量 */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-nexus-accent">
                ${product.price?.toFixed(2) || 'N/A'}
              </span>
              {product.recentSalesLabel && (
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp size={16} />
                  {product.recentSalesLabel}
                </span>
              )}
            </div>

            {/* 评分 */}
            <div className="flex items-center gap-4">
              {product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={star <= Math.round(product.rating!) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-600'}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{product.rating}</span>
                </div>
              )}
              {product.reviewCount && (
                <span className="text-gray-400">
                  {product.reviewCount.toLocaleString()} 评论
                </span>
              )}
            </div>

            {/* 快捷信息卡片 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-nexus-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <ShoppingCart size={16} />
                  <span className="text-sm">BSR 排名</span>
                </div>
                <span className="text-lg font-semibold">
                  {product.bsr ? `#${product.bsr.toLocaleString()}` : 'N/A'}
                </span>
                {product.bsrCategory && (
                  <p className="text-xs text-gray-500 mt-1">{product.bsrCategory}</p>
                )}
              </div>
              
              <div className="bg-nexus-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Truck size={16} />
                  <span className="text-sm">配送方式</span>
                </div>
                <span className="text-lg font-semibold">FBA</span>
                <p className="text-xs text-gray-500 mt-1">Amazon 物流</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={() => { setActiveTab('sourcing'); searchSourcing(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Search size={20} />
                1688 找货源
              </button>
              <button
                onClick={() => setActiveTab('profit')}
                className="flex-1 flex items-center justify-center gap-2 bg-nexus-700 hover:bg-nexus-600 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Calculator size={20} />
                利润计算
              </button>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex gap-2 mb-6 border-b border-nexus-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'sourcing' && sourcingResults.length === 0) {
                  searchSourcing();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-nexus-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-nexus-800'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        <div className="bg-nexus-800 rounded-xl p-6">
          {/* 产品概览 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package size={20} />
                产品详情
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">基本信息</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">ASIN</dt>
                      <dd className="font-mono">{product.asin}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">品牌</dt>
                      <dd>{product.brand || '未知'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">价格</dt>
                      <dd className="text-nexus-accent font-semibold">${product.price?.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">评分</dt>
                      <dd>{product.rating || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">评论数</dt>
                      <dd>{product.reviewCount?.toLocaleString() || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-2">销售数据</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">BSR</dt>
                      <dd>{product.bsr ? `#${product.bsr.toLocaleString()}` : 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">类目</dt>
                      <dd className="text-right max-w-48 truncate">{product.bsrCategory || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">近期销量</dt>
                      <dd className="text-green-400">{product.recentSalesLabel || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">数据获取时间</dt>
                      <dd className="text-gray-400 text-sm">
                        {new Date(product.fetchedAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* 1688 货源 */}
          {activeTab === 'sourcing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Search size={20} />
                  1688 货源匹配
                </h3>
                <button
                  onClick={searchSourcing}
                  disabled={isLoadingSourcing}
                  className="flex items-center gap-2 bg-nexus-700 hover:bg-nexus-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingSourcing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  刷新
                </button>
              </div>

              {isLoadingSourcing ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-nexus-accent" />
                  <span className="ml-3 text-gray-400">正在搜索 1688 货源...</span>
                </div>
              ) : sourcingResults.length > 0 ? (
                <div className="space-y-4">
                  {sourcingResults.map((supplier, index) => (
                    <div
                      key={supplier.id}
                      className="bg-nexus-700/50 rounded-lg p-4 hover:bg-nexus-700 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <img
                            src={supplier.imageUrl}
                            alt={supplier.supplierName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{supplier.supplierName}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Star size={14} className="text-yellow-400" />
                                  {supplier.supplierRating}
                                </span>
                                <span>{supplier.shopYears}年老店</span>
                                <span>起订量: {supplier.moq}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-orange-400">
                                ¥{supplier.costPrice}
                              </div>
                              <div className="text-xs text-gray-500">采购价</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                匹配度 {Math.round(supplier.matchScore * 100)}%
                              </span>
                              {index === 0 && (
                                <span className="text-xs bg-nexus-accent/20 text-nexus-accent px-2 py-1 rounded">
                                  推荐
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCostPrice(supplier.costPrice)}
                                className="text-sm bg-nexus-600 hover:bg-nexus-500 px-3 py-1 rounded transition-colors"
                              >
                                用于计算
                              </button>
                              <a
                                href={supplier.supplierUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded transition-colors flex items-center gap-1"
                              >
                                <ExternalLink size={14} />
                                查看
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p>点击"刷新"搜索 1688 货源</p>
                </div>
              )}
            </div>
          )}

          {/* 利润计算 */}
          {activeTab === 'profit' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator size={20} />
                利润计算器
              </h3>
              
              <div className="grid grid-cols-2 gap-8">
                {/* 输入区 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">售价 (USD)</label>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-nexus-700 border border-nexus-600 rounded-lg px-4 py-2 text-white focus:border-nexus-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">采购价 (CNY)</label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-nexus-700 border border-nexus-600 rounded-lg px-4 py-2 text-white focus:border-nexus-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">头程运费 (CNY)</label>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-nexus-700 border border-nexus-600 rounded-lg px-4 py-2 text-white focus:border-nexus-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">汇率 (USD/CNY)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 7.2)}
                      className="w-full bg-nexus-700 border border-nexus-600 rounded-lg px-4 py-2 text-white focus:border-nexus-accent focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={calculateProfit}
                    className="w-full bg-nexus-accent hover:bg-nexus-accent/80 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    计算利润
                  </button>
                </div>

                {/* 结果区 */}
                <div className="bg-nexus-700/50 rounded-lg p-6">
                  {profitCalc ? (
                    <div className="space-y-4">
                      <div className="text-center pb-4 border-b border-nexus-600">
                        <div className="text-sm text-gray-400">预估净利润</div>
                        <div className={`text-4xl font-bold ${profitCalc.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ¥{profitCalc.netProfit.toFixed(2)}
                        </div>
                        <div className={`text-lg ${profitCalc.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          利润率 {profitCalc.profitMargin.toFixed(1)}%
                        </div>
                      </div>
                      
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-400">售价 (CNY)</dt>
                          <dd>¥{(profitCalc.sellPrice * profitCalc.exchangeRate).toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-400">采购成本</dt>
                          <dd className="text-red-400">-¥{profitCalc.costPrice.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-400">头程运费</dt>
                          <dd className="text-red-400">-¥{profitCalc.shippingCost.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-400">平台佣金 (15%)</dt>
                          <dd className="text-red-400">-¥{profitCalc.platformFee.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-400">FBA 费用 (20%)</dt>
                          <dd className="text-red-400">-¥{profitCalc.fbaFee.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-400">广告费 (10%)</dt>
                          <dd className="text-red-400">-¥{profitCalc.marketingCost.toFixed(2)}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                      <p>填写参数后点击"计算利润"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 合规检查 */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={20} />
                合规检查
              </h3>

              {complianceCheck ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-nexus-700/50 rounded-lg p-4">
                    <h4 className="text-gray-400 text-sm mb-3">目标市场: {complianceCheck.market}</h4>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">HS 编码</dt>
                        <dd className="font-mono">{complianceCheck.hsCode || '待确认'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">关税税率</dt>
                        <dd>{complianceCheck.taxRate !== undefined ? `${complianceCheck.taxRate}%` : 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-gray-500">风险等级</dt>
                        <dd>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            complianceCheck.riskLevel === 'low' ? 'bg-green-500/20 text-green-400' :
                            complianceCheck.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {complianceCheck.riskLevel === 'low' ? '低风险' :
                             complianceCheck.riskLevel === 'medium' ? '中风险' : '高风险'}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-nexus-700/50 rounded-lg p-4">
                    <h4 className="text-gray-400 text-sm mb-3">所需认证</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {complianceCheck.certificationsRequired.map((cert) => (
                        <span
                          key={cert}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-nexus-800 rounded text-sm text-gray-300">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p>{complianceCheck.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-nexus-accent" />
                  <span className="ml-3 text-gray-400">正在检查合规要求...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
