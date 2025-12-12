import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, ShoppingCart, TrendingUp, Star, ExternalLink, AlertCircle } from 'lucide-react';
import { AmazonProductData, AmazonResearchQuery, AMAZON_DOMAINS } from '../types';
import { queryAmazonData, getDataSourceMode } from '../services/rainforestService';

interface AmazonResearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onProductsFound?: (products: AmazonProductData[]) => void;
    onProductClick?: (product: AmazonProductData) => void;
}

export const AmazonResearchDialog: React.FC<AmazonResearchDialogProps> = ({
    isOpen,
    onClose,
    onProductsFound,
    onProductClick
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('amazon.com');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<AmazonProductData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // 对话框打开时聚焦输入框
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // 加载搜索历史
    useEffect(() => {
        const history = localStorage.getItem('amazon_search_history');
        if (history) {
            setSearchHistory(JSON.parse(history).slice(0, 5));
        }
    }, []);

    // 保存搜索历史
    const saveToHistory = (query: string) => {
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('amazon_search_history', JSON.stringify(newHistory));
    };

    // 判断查询类型
    const detectQueryType = (query: string): 'asin' | 'keyword' | 'url' => {
        if (query.match(/^B[0-9A-Z]{9}$/i)) return 'asin';
        if (query.startsWith('http')) return 'url';
        return 'keyword';
    };

    // 执行搜索
    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim() || isSearching) return;

        setIsSearching(true);
        setError(null);
        setSearchResults([]);

        try {
            const queryParams: AmazonResearchQuery = {
                type: detectQueryType(searchQuery.trim()),
                value: searchQuery.trim(),
                domain: selectedDomain
            };

            const results = await queryAmazonData(queryParams);
            setSearchResults(results);
            saveToHistory(searchQuery.trim());

            if (onProductsFound) {
                onProductsFound(results);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '搜索失败，请重试');
        } finally {
            setIsSearching(false);
        }
    };

    // 快速搜索历史记录
    const handleHistoryClick = (query: string) => {
        setSearchQuery(query);
        setTimeout(() => handleSearch(), 50);
    };

    // 格式化价格
    const formatPrice = (price: number | null, currency: string) => {
        if (price === null) return '价格未知';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
    };

    // 获取数据源标签样式
    const getDataSourceBadge = (source: 'real' | 'mock') => {
        if (source === 'real') {
            return (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">
                    真实
                </span>
            );
        }
        return (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                模拟
            </span>
        );
    };

    if (!isOpen) return null;

    const dataSourceMode = getDataSourceMode();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 对话框主体 */}
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-nexus-900 border border-nexus-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-800 bg-gradient-to-r from-orange-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                            <ShoppingCart size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Amazon 产品调研</h2>
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                                输入 ASIN、关键词或产品链接
                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${dataSourceMode === 'real'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {dataSourceMode === 'real' ? 'API 已连接' : '模拟数据模式'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-nexus-800 transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* 搜索表单 */}
                <form onSubmit={handleSearch} className="p-6 border-b border-nexus-800">
                    <div className="flex gap-3">
                        <select
                            value={selectedDomain}
                            onChange={(e) => setSelectedDomain(e.target.value)}
                            className="px-3 py-2 bg-nexus-800 border border-nexus-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none"
                        >
                            {AMAZON_DOMAINS.map((domain) => (
                                <option key={domain.value} value={domain.value}>
                                    {domain.label}
                                </option>
                            ))}
                        </select>

                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="例如: B08F6Z8666 或 智能耳机"
                                className="w-full pl-10 pr-4 py-2 bg-nexus-800 border border-nexus-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none"
                                disabled={isSearching}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    搜索中
                                </>
                            ) : (
                                '搜索'
                            )}
                        </button>
                    </div>

                    {/* 搜索历史 */}
                    {searchHistory.length > 0 && !searchResults.length && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">最近搜索:</span>
                            {searchHistory.map((query, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleHistoryClick(query)}
                                    className="px-2 py-1 text-xs bg-nexus-800 border border-nexus-700 rounded hover:border-orange-500/50 text-gray-400 hover:text-orange-400 transition-colors"
                                >
                                    {query}
                                </button>
                            ))}
                        </div>
                    )}
                </form>

                {/* 搜索结果 */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!error && searchResults.length === 0 && !isSearching && (
                        <div className="text-center py-8 text-gray-500">
                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                            <p>输入产品 ASIN 或关键词开始搜索</p>
                            <p className="text-xs mt-2">支持美国、德国、英国、日本、加拿大站点</p>
                        </div>
                    )}

                    {isSearching && (
                        <div className="text-center py-8">
                            <Loader2 size={32} className="mx-auto mb-4 animate-spin text-orange-500" />
                            <p className="text-gray-400">正在获取产品数据...</p>
                            <p className="text-xs text-gray-600 mt-2">
                                {dataSourceMode === 'mock' ? '使用模拟数据' : '连接 Amazon API'}
                            </p>
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-400">
                                    找到 {searchResults.length} 个产品
                                </h3>
                            </div>

                            {searchResults.map((product) => (
                                <div
                                    key={product.asin}
                                    onClick={() => onProductClick?.(product)}
                                    className="flex gap-4 p-4 bg-nexus-800/50 border border-nexus-700 rounded-xl hover:border-orange-500/30 transition-colors group cursor-pointer"
                                >
                                    {/* 产品图片 */}
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-nexus-700 shrink-0">
                                        <img
                                            src={product.mainImage}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=No+Image';
                                            }}
                                        />
                                    </div>

                                    {/* 产品信息 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
                                                {product.title}
                                            </h4>
                                            {getDataSourceBadge(product.dataSource)}
                                        </div>

                                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                            <span className="font-mono text-gray-500">ASIN: {product.asin}</span>
                                            <span className="text-lg font-bold text-orange-400">
                                                {formatPrice(product.price, product.currency)}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {/* 销量标签 */}
                                            {product.recentSalesLabel && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                                                    <TrendingUp size={12} />
                                                    {product.recentSalesLabel}
                                                </span>
                                            )}

                                            {/* BSR 排名 */}
                                            {product.bsr && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                                                    <Star size={12} />
                                                    BSR #{product.bsr}
                                                </span>
                                            )}

                                            {/* 查看链接 */}
                                            <a
                                                href={product.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-nexus-700 text-gray-300 text-xs hover:text-orange-400 transition-colors"
                                            >
                                                <ExternalLink size={12} />
                                                查看详情
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 底部提示 */}
                <div className="px-6 py-3 border-t border-nexus-800 bg-nexus-900/50 text-center">
                    <p className="text-xs text-gray-500">
                        数据来源：{dataSourceMode === 'real' ? 'Apify Amazon Scraper (真实数据)' : '模拟数据 (配置 API Key 获取真实数据)'}
                    </p>
                </div>
            </div>
        </div>
    );
};
