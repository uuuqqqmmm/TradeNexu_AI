import React, { useState, useCallback } from 'react';
import { X, Search, TrendingUp, DollarSign, Eye, ShoppingBag, ExternalLink, Zap, Database } from 'lucide-react';
import { searchTikTokProducts, getTikTokTrendingProducts, TikTokProductData, TIKTOK_REGIONS } from '../services/tiktokService';

interface TikTokResearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onProductsFound?: (products: TikTokProductData[]) => void;
}

export const TikTokResearchDialog: React.FC<TikTokResearchDialogProps> = ({
    isOpen,
    onClose,
    onProductsFound
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('US');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<TikTokProductData[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<TikTokProductData[]>([]);
    const [activeTab, setActiveTab] = useState<'search' | 'trending'>('search');
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const results = await searchTikTokProducts(searchQuery, selectedRegion, 6);
            setSearchResults(results);
            onProductsFound?.(results);
        } catch (err) {
            setError('搜索失败，请稍后重试');
            console.error('TikTok 搜索错误:', err);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedRegion, onProductsFound]);

    const handleLoadTrending = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const results = await getTikTokTrendingProducts(selectedRegion);
            setTrendingProducts(results);
        } catch (err) {
            setError('获取热门产品失败');
            console.error('TikTok 热门产品错误:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedRegion]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    if (!isOpen) return null;

    const renderProductCard = (product: TikTokProductData) => {
        const isRealData = product.dataSource === 'real';

        return (
            <div
                key={product.productId}
                onClick={() => window.open(product.link, '_blank')}
                className="bg-nexus-800 border border-nexus-700 rounded-lg overflow-hidden hover:border-pink-500 transition-all duration-300 cursor-pointer group"
            >
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={product.mainImage}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* 数据来源标签 */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${isRealData ? 'bg-green-500' : 'bg-orange-500'}`}>
                        {isRealData ? <Zap size={10} /> : <Database size={10} />}
                        {isRealData ? '真实' : '模拟'}
                    </div>

                    {/* 视频观看量 */}
                    {product.videoViews && (
                        <div className="absolute top-2 right-2 bg-pink-500/90 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                            <Eye size={10} />
                            {product.videoViews}
                        </div>
                    )}

                    {/* 销量 */}
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                        <ShoppingBag size={10} />
                        {product.salesCount}
                    </div>
                </div>

                <div className="p-3">
                    <h4 className="text-white text-sm font-medium line-clamp-2 mb-2 group-hover:text-pink-400 transition-colors">
                        {product.title}
                    </h4>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-pink-400 font-bold">${product.price?.toFixed(2)}</span>
                            {product.originalPrice && product.originalPrice > (product.price || 0) && (
                                <span className="text-gray-500 text-xs line-through">${product.originalPrice.toFixed(2)}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                            <TrendingUp size={12} />
                            {product.rating}
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>{product.shopName}</span>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-nexus-900 border border-nexus-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* 头部 */}
                <div className="flex items-center justify-between p-4 border-b border-nexus-700 bg-gradient-to-r from-pink-600/20 to-purple-600/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">TikTok Shop 调研</h2>
                            <p className="text-gray-400 text-xs">搜索 TikTok 热销产品和病毒趋势</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-nexus-800 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 标签页 */}
                <div className="flex border-b border-nexus-700">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'search'
                                ? 'text-pink-400 border-b-2 border-pink-400'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Search size={14} className="inline mr-2" />
                        产品搜索
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('trending');
                            if (trendingProducts.length === 0) {
                                handleLoadTrending();
                            }
                        }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'trending'
                                ? 'text-pink-400 border-b-2 border-pink-400'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <TrendingUp size={14} className="inline mr-2" />
                        热门趋势
                    </button>
                </div>

                {/* 搜索区 */}
                {activeTab === 'search' && (
                    <div className="p-4 border-b border-nexus-700">
                        <div className="flex gap-3">
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="bg-nexus-800 border border-nexus-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                            >
                                {TIKTOK_REGIONS.map(region => (
                                    <option key={region.code} value={region.code}>{region.name}</option>
                                ))}
                            </select>
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="搜索产品关键词，如 pet feeder, sunset lamp..."
                                    className="w-full bg-nexus-800 border border-nexus-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !searchQuery.trim()}
                                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? '搜索中...' : '搜索'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 内容区 */}
                <div className="p-4 overflow-y-auto max-h-[55vh]">
                    {error && (
                        <div className="text-red-400 text-sm text-center py-4">{error}</div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-400 text-sm">正在获取 TikTok 数据...</p>
                        </div>
                    )}

                    {!isLoading && activeTab === 'search' && searchResults.length > 0 && (
                        <>
                            <div className="text-gray-400 text-sm mb-4">
                                找到 <span className="text-pink-400 font-bold">{searchResults.length}</span> 个产品
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {searchResults.map(renderProductCard)}
                            </div>
                        </>
                    )}

                    {!isLoading && activeTab === 'trending' && trendingProducts.length > 0 && (
                        <>
                            <div className="text-gray-400 text-sm mb-4">
                                🔥 TikTok 热门产品 ({selectedRegion})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {trendingProducts.map(renderProductCard)}
                            </div>
                        </>
                    )}

                    {!isLoading && activeTab === 'search' && searchResults.length === 0 && !error && (
                        <div className="text-center py-12 text-gray-500">
                            <Search size={48} className="mx-auto mb-4 opacity-30" />
                            <p>输入关键词搜索 TikTok 热销产品</p>
                        </div>
                    )}
                </div>

                {/* 底部状态 */}
                <div className="p-3 border-t border-nexus-700 bg-nexus-800/50 text-center text-xs text-gray-500">
                    数据来源：TikTok Shop（模拟数据模式）
                </div>
            </div>
        </div>
    );
};
