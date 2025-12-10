
import React from 'react';
import { ProductInsight } from '../types';
import { TrendingUp, DollarSign, ExternalLink, ShieldCheck, Database, Zap } from 'lucide-react';

interface ProductCardProps {
  product: ProductInsight;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // 优先使用产品详情页链接，其次是搜索链接
  const productLink = product.productUrl || 
    (product.asin ? `https://www.amazon.com/dp/${product.asin}` : null) ||
    product.amazonSearchUrl ||
    (product.searchKeyword
      ? `https://www.amazon.com/s?k=${encodeURIComponent(product.searchKeyword)}`
      : `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`);

  // 判断数据来源
  const isRealData = product.dataSource === 'real';
  const dataSourceLabel = isRealData ? '真实' : '模拟';
  const dataSourceColor = isRealData ? 'bg-green-500' : 'bg-orange-500';

  // 点击卡片跳转到产品详情页
  const handleCardClick = () => {
    window.open(productLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-nexus-800 border border-nexus-700 rounded-lg overflow-hidden hover:border-nexus-accent hover:shadow-lg hover:shadow-nexus-accent/20 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
    >
      {/* 产品图片作为背景 */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />

        {/* 渐变遮罩层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-nexus-900/90 via-transparent to-transparent" />

        {/* 数据来源标签 - 左上角 */}
        <div className={`absolute top-3 left-3 ${dataSourceColor} px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-lg`}>
          {isRealData ? <Zap size={12} /> : <Database size={12} />}
          {dataSourceLabel}
        </div>

        {/* 数据源标签 - 右上角 */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-white uppercase">
          {product.source}
        </div>

        {/* 外链提示 */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-nexus-accent/90 backdrop-blur-sm p-2 rounded-full text-white">
            <ExternalLink size={16} />
          </div>
        </div>

        {/* 趋势分数 - 浮动在图片底部 */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 bg-nexus-success/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-bold text-white shadow-lg">
            <TrendingUp size={14} />
            <span>{product.trendScore}</span>
          </div>
        </div>
      </div>

      {/* 产品信息 */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-white text-base leading-tight line-clamp-2 group-hover:text-nexus-accent transition-colors">
            {product.name}
          </h4>
        </div>

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>

        {/* 合规提示 */}
        {product.complianceNote && (
          <div className="mb-3 flex items-center gap-1.5 bg-nexus-900/60 p-2 rounded border border-nexus-700/50">
            <ShieldCheck size={14} className="text-nexus-accent shrink-0" />
            <span className="text-xs text-gray-300 font-mono truncate">{product.complianceNote}</span>
          </div>
        )}

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs bg-nexus-700/80 text-blue-300 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* 价格和销量信息 */}
        {(product.price || product.salesVolume) && (
          <div className="flex items-center justify-between mb-3 text-sm">
            {product.price && (
              <div className="flex items-center text-nexus-warning font-bold">
                <DollarSign size={14} className="mr-0.5" />
                <span>{product.price.replace('$', '')}</span>
              </div>
            )}
            {product.salesVolume && (
              <div className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                {product.salesVolume}
              </div>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-3 border-t border-nexus-700">
          <div className="flex items-center text-sm text-gray-300">
            <DollarSign size={14} className="text-nexus-warning mr-1" />
            <span>预估毛利:</span>
            <span className="text-white font-medium ml-1">{product.profitMargin || 'N/A'}</span>
          </div>
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            {product.asin && <span className="text-gray-600">ASIN: {product.asin}</span>}
            <ExternalLink size={10} />
          </div>
        </div>
      </div>
    </div>
  );
};
