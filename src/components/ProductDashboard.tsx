/**
 * 产品管理 Dashboard 组件
 * Sprint 3: 业务闭环与持久化
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';

// 产品状态类型
type ProductStatus = 'research' | 'sourcing' | 'testing' | 'active' | 'paused' | 'discontinued';

// 产品数据接口
interface Product {
  id: string;
  name: string;
  asin?: string;
  sku?: string;
  status: ProductStatus;
  category: string;
  sourcingPrice?: number;
  sellingPrice?: number;
  profitMargin?: number;
  supplier?: string;
  imageUrl?: string;
  amazonUrl?: string;
  alibaba1688Url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 状态配置
const statusConfig: Record<ProductStatus, { label: string; color: string; icon: React.ReactNode }> = {
  research: { label: '调研中', color: 'bg-blue-500/20 text-blue-400', icon: <Search className="w-3 h-3" /> },
  sourcing: { label: '找货源', color: 'bg-yellow-500/20 text-yellow-400', icon: <Package className="w-3 h-3" /> },
  testing: { label: '测试中', color: 'bg-purple-500/20 text-purple-400', icon: <Clock className="w-3 h-3" /> },
  active: { label: '在售', color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  paused: { label: '暂停', color: 'bg-gray-500/20 text-gray-400', icon: <AlertCircle className="w-3 h-3" /> },
  discontinued: { label: '下架', color: 'bg-red-500/20 text-red-400', icon: <Trash2 className="w-3 h-3" /> },
};

// Mock 产品数据
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'PETLIBRO 自动宠物喂食器',
    asin: 'B0CF3VGQFL',
    sku: 'PET-FEEDER-001',
    status: 'active',
    category: '宠物用品',
    sourcingPrice: 45,
    sellingPrice: 89.99,
    profitMargin: 32.5,
    supplier: '深圳智宠科技',
    imageUrl: 'https://m.media-amazon.com/images/I/71example.jpg',
    amazonUrl: 'https://www.amazon.com/dp/B0CF3VGQFL',
    alibaba1688Url: 'https://detail.1688.com/offer/123456.html',
    createdAt: '2024-12-01',
    updatedAt: '2024-12-10',
  },
  {
    id: '2',
    name: 'TWS 蓝牙耳机 Pro',
    asin: 'B09XS7JWHH',
    sku: 'AUDIO-TWS-002',
    status: 'sourcing',
    category: '电子产品',
    sourcingPrice: 28,
    sellingPrice: 49.99,
    profitMargin: 28.2,
    supplier: '东莞声波电子',
    createdAt: '2024-12-05',
    updatedAt: '2024-12-12',
  },
  {
    id: '3',
    name: 'LED 氛围灯带 RGB',
    status: 'research',
    category: '家居装饰',
    createdAt: '2024-12-10',
    updatedAt: '2024-12-12',
  },
];

interface ProductDashboardProps {
  onClose?: () => void;
}

export const ProductDashboard: React.FC<ProductDashboardProps> = ({ onClose }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 筛选产品
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.asin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计数据
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    research: products.filter(p => p.status === 'research').length,
    avgMargin: products.filter(p => p.profitMargin).reduce((sum, p) => sum + (p.profitMargin || 0), 0) /
      products.filter(p => p.profitMargin).length || 0,
  };

  // 刷新数据
  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: 调用后端 API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  // 删除产品
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个产品吗？')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1f2e] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">产品管理中心</h2>
            <span className="text-sm text-gray-400">({products.length} 个产品)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Stats Bar */}
        <div className="p-4 border-b border-gray-700 grid grid-cols-4 gap-4">
          <div className="bg-[#252b3b] rounded-lg p-3">
            <div className="text-gray-400 text-sm">总产品数</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-[#252b3b] rounded-lg p-3">
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" /> 在售产品
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          </div>
          <div className="bg-[#252b3b] rounded-lg p-3">
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <Search className="w-3 h-3 text-blue-400" /> 调研中
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.research}</div>
          </div>
          <div className="bg-[#252b3b] rounded-lg p-3">
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" /> 平均利润率
            </div>
            <div className="text-2xl font-bold text-cyan-400">{stats.avgMargin.toFixed(1)}%</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-700 flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索产品名称、ASIN、SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#252b3b] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')}
            className="bg-[#252b3b] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">全部状态</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Actions */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-[#252b3b] border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-cyan-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            添加产品
          </button>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3 pl-2">产品</th>
                <th className="pb-3">状态</th>
                <th className="pb-3">采购价</th>
                <th className="pb-3">售价</th>
                <th className="pb-3">利润率</th>
                <th className="pb-3">供应商</th>
                <th className="pb-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-700/50 hover:bg-[#252b3b]/50 transition-colors"
                >
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">{product.name}</div>
                        <div className="text-gray-400 text-sm">
                          {product.asin && <span>ASIN: {product.asin}</span>}
                          {product.sku && <span className="ml-2">SKU: {product.sku}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig[product.status].color}`}>
                      {statusConfig[product.status].icon}
                      {statusConfig[product.status].label}
                    </span>
                  </td>
                  <td className="py-3 text-white">
                    {product.sourcingPrice ? `¥${product.sourcingPrice}` : '-'}
                  </td>
                  <td className="py-3 text-white">
                    {product.sellingPrice ? `$${product.sellingPrice}` : '-'}
                  </td>
                  <td className="py-3">
                    {product.profitMargin ? (
                      <span className={`font-medium ${product.profitMargin >= 30 ? 'text-green-400' : product.profitMargin >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {product.profitMargin.toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 text-gray-400">
                    {product.supplier || '-'}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {product.amazonUrl && (
                        <a
                          href={product.amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors"
                          title="查看 Amazon"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无产品数据</p>
              <p className="text-sm mt-1">点击"添加产品"开始管理您的产品库</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
