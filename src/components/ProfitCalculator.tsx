/**
 * 利润计算器组件
 * 版本: v3.0
 * 
 * 功能:
 * 1. 输入采购价、售价、重量等参数
 * 2. 实时计算利润和利润率
 * 3. 显示成本明细和建议
 */

import React, { useState, useEffect } from 'react';
import { X, Calculator, TrendingUp, TrendingDown, DollarSign, Package, Truck, PercentIcon, RefreshCw } from 'lucide-react';
import { calculateProfit, ProfitResult } from '../services/alibaba1688Service';

interface ProfitCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    sellPrice?: number;
    costPrice?: number;
    productName?: string;
  };
}

export const ProfitCalculator: React.FC<ProfitCalculatorProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  // 输入参数
  const [sellPrice, setSellPrice] = useState(initialData?.sellPrice || 29.99);
  const [costPrice, setCostPrice] = useState(initialData?.costPrice || 45);
  const [weight, setWeight] = useState(0.5);
  const [shippingPerKg, setShippingPerKg] = useState(30);
  const [referralFee, setReferralFee] = useState(15);
  const [fbaFee, setFbaFee] = useState(5);
  const [marketingCost, setMarketingCost] = useState(2);
  const [exchangeRate, setExchangeRate] = useState(7.2);

  // 计算结果
  const [result, setResult] = useState<ProfitResult | null>(null);

  // 计算利润
  useEffect(() => {
    const profitResult = calculateProfit({
      sellPrice,
      costPrice,
      weight,
      shippingPerKg,
      referralFee: referralFee / 100,
      fbaFee,
      marketingCost,
      exchangeRate,
    });
    setResult(profitResult);
  }, [sellPrice, costPrice, weight, shippingPerKg, referralFee, fbaFee, marketingCost, exchangeRate]);

  // 更新初始数据
  useEffect(() => {
    if (initialData?.sellPrice) setSellPrice(initialData.sellPrice);
    if (initialData?.costPrice) setCostPrice(initialData.costPrice);
  }, [initialData]);

  if (!isOpen) return null;

  const isProfitable = result && result.netProfit > 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-nexus-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-nexus-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">利润计算器</h2>
              <p className="text-sm text-gray-400">
                {initialData?.productName || '计算产品利润'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-nexus-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧：输入参数 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Package size={16} />
                基础参数
              </h3>

              {/* 售价 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Amazon 售价 (USD)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              </div>

              {/* 采购价 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">1688 采购价 (CNY)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">¥</span>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              </div>

              {/* 重量 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">产品重量 (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  step="0.1"
                />
              </div>

              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2 pt-2">
                <Truck size={16} />
                费用参数
              </h3>

              {/* 头程运费 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">头程运费 (CNY/kg)</label>
                <input
                  type="number"
                  value={shippingPerKg}
                  onChange={(e) => setShippingPerKg(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* 平台佣金 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">平台佣金 (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={referralFee}
                    onChange={(e) => setReferralFee(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    step="0.1"
                  />
                  <PercentIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              {/* FBA 费用 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">FBA 费用 (USD)</label>
                <input
                  type="number"
                  value={fbaFee}
                  onChange={(e) => setFbaFee(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  step="0.1"
                />
              </div>

              {/* 广告费 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">广告费 (USD)</label>
                <input
                  type="number"
                  value={marketingCost}
                  onChange={(e) => setMarketingCost(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  step="0.1"
                />
              </div>

              {/* 汇率 */}
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-2">
                  汇率 (USD → CNY)
                  <button className="text-cyan-400 hover:text-cyan-300">
                    <RefreshCw size={12} />
                  </button>
                </label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  step="0.01"
                />
              </div>
            </div>

            {/* 右侧：计算结果 */}
            <div className="space-y-4">
              {/* 利润卡片 */}
              <div className={`p-4 rounded-xl ${isProfitable ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">净利润</span>
                  {isProfitable ? (
                    <TrendingUp size={20} className="text-green-400" />
                  ) : (
                    <TrendingDown size={20} className="text-red-400" />
                  )}
                </div>
                <div className={`text-3xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                  ¥ {result?.netProfit.toFixed(2) || '0.00'}
                </div>
                <div className={`text-sm mt-1 ${isProfitable ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  利润率: {result?.profitMargin.toFixed(1) || '0'}%
                </div>
              </div>

              {/* 成本明细 */}
              <div className="bg-nexus-900 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">成本明细</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">售价 (CNY)</span>
                    <span className="text-white">¥ {result?.sellPriceCNY.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">采购成本</span>
                    <span className="text-red-400">- ¥ {result?.costPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">头程运费</span>
                    <span className="text-red-400">- ¥ {result?.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">平台佣金</span>
                    <span className="text-red-400">- ¥ {result?.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">FBA 费用</span>
                    <span className="text-red-400">- ¥ {result?.fbaFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">广告费用</span>
                    <span className="text-red-400">- ¥ {result?.marketingCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-nexus-700 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-300">总成本</span>
                      <span className="text-orange-400">¥ {result?.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI */}
              <div className="bg-nexus-900 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">投资回报率 (ROI)</span>
                  <span className={`text-lg font-bold ${(result?.roi || 0) > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                    {result?.roi.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">盈亏平衡数量</span>
                  <span className="text-lg font-bold text-yellow-400">
                    {result?.breakEvenQuantity === Infinity ? '∞' : result?.breakEvenQuantity} 件
                  </span>
                </div>
              </div>

              {/* AI 建议 */}
              <div className={`p-4 rounded-xl ${
                isProfitable 
                  ? 'bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30' 
                  : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30'
              }`}>
                <h4 className="text-sm font-medium text-gray-300 mb-2">💡 AI 建议</h4>
                <p className="text-sm text-gray-400">
                  {result?.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-nexus-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            关闭
          </button>
          <button
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            保存计算结果
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfitCalculator;
