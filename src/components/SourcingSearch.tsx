/**
 * 供应链搜索组件
 * 版本: v3.0
 * 
 * 功能:
 * 1. 关键词搜索 1688 供应商
 * 2. 以图搜图
 * 3. 显示供应商列表和利润试算
 */

import React, { useState } from 'react';
import { X, Search, Image, Loader2, ExternalLink, Star, MapPin, Clock, Calculator, TrendingUp } from 'lucide-react';
import { search1688Products, Alibaba1688Product, calculateProfit } from '../services/alibaba1688Service';

interface SourcingSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialKeyword?: string;
  initialImageUrl?: string;
  amazonPrice?: number;
  onOpenCalculator?: (costPrice: number, sellPrice: number) => void;
}

export const SourcingSearch: React.FC<SourcingSearchProps> = ({
  isOpen,
  onClose,
  initialKeyword = '',
  initialImageUrl,
  amazonPrice,
  onOpenCalculator,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Alibaba1688Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'sales'>('rating');

  // 搜索
  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const products = await search1688Products({
        keyword: keyword.trim(),
        sortBy,
        limit: 10,
      });
      setResults(products);
    } catch (err: any) {
      setError(err.message || '搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 计算快速利润
  const getQuickProfit = (costPrice: number) => {
    if (!amazonPrice) return null;
    const result = calculateProfit({
      sellPrice: amazonPrice,
      costPrice,
      weight: 0.5,
    });
    return result;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-nexus-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-nexus-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Search size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">1688 货源搜索</h2>
              <p className="text-sm text-gray-400">
                搜索供应商，计算利润
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

        {/* Search Bar */}
        <div className="p-4 border-b border-nexus-700">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入中文关键词搜索，如：宠物喂食器、蓝牙耳机..."
                className="w-full pl-10 pr-4 py-2.5 bg-nexus-900 border border-nexus-600 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-nexus-900 border border-nexus-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="rating">按评分</option>
              <option value="price">按价格</option>
              <option value="sales">按销量</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={isLoading || !keyword.trim()}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              搜索
            </button>
            {initialImageUrl && (
              <button
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
                title="以图搜图"
              >
                <Image size={18} />
                以图搜图
              </button>
            )}
          </div>

          {amazonPrice && (
            <div className="mt-2 text-sm text-gray-400">
              参考售价: <span className="text-green-400 font-medium">${amazonPrice}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="text-center py-8 text-red-400">
              {error}
            </div>
          )}

          {!error && results.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p>输入关键词搜索 1688 供应商</p>
              <p className="text-sm mt-2">支持中文关键词，如：智能手表、LED灯带</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <Loader2 size={32} className="mx-auto animate-spin text-orange-500" />
              <p className="text-gray-400 mt-4">正在搜索供应商...</p>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-4">
            {results.map((product) => {
              const profit = getQuickProfit(product.price);
              const isProfitable = profit && profit.netProfit > 0;

              return (
                <div
                  key={product.productId}
                  className="bg-nexus-900 rounded-xl p-4 hover:bg-nexus-850 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* 图片 */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-nexus-700 flex-shrink-0">
                      <img
                        src={product.mainImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image';
                        }}
                      />
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium line-clamp-2 mb-2">
                        {product.title}
                      </h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500" />
                          {product.supplierRating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {product.shopYears}年店
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {product.location}
                        </span>
                        <span>
                          起订: {product.moq}件
                        </span>
                      </div>

                      <div className="mt-2 text-sm">
                        <span className="text-gray-400">供应商: </span>
                        <span className="text-cyan-400">{product.supplierName}</span>
                      </div>
                    </div>

                    {/* 价格和操作 */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-400">
                          ¥{product.price.toFixed(2)}
                        </div>
                        {product.priceRange && (
                          <div className="text-xs text-gray-500">
                            {product.priceRange}
                          </div>
                        )}
                      </div>

                      {/* 快速利润预览 */}
                      {profit && (
                        <div className={`text-sm px-3 py-1 rounded-full ${
                          isProfitable 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={14} />
                            {isProfitable ? '+' : ''}{profit.profitMargin.toFixed(0)}%
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => onOpenCalculator?.(product.price, amazonPrice || 29.99)}
                          className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm flex items-center gap-1"
                        >
                          <Calculator size={14} />
                          计算利润
                        </button>
                        <a
                          href={product.detailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-nexus-700 hover:bg-nexus-600 text-gray-300 rounded-lg text-sm flex items-center gap-1"
                        >
                          <ExternalLink size={14} />
                          查看
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* 匹配度条 */}
                  {product.matchScore && (
                    <div className="mt-3 pt-3 border-t border-nexus-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">AI 匹配度</span>
                        <div className="flex-1 h-1.5 bg-nexus-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${product.matchScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-cyan-400">
                          {(product.matchScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mock 数据标签 */}
                  {product.dataSource === 'mock' && (
                    <div className="mt-2 text-xs text-yellow-500/70">
                      ⚠️ 模拟数据 (真实 API 开发中)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-nexus-700 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {results.length > 0 && `找到 ${results.length} 个供应商`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourcingSearch;
