
import React from 'react';
import { ProductInsight } from '../types';
import { TrendingUp, DollarSign, Share2, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: ProductInsight;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-nexus-800 border border-nexus-700 rounded-lg overflow-hidden hover:border-nexus-accent transition-colors duration-300">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white uppercase">
          {product.source}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-white text-lg leading-tight">{product.name}</h4>
          <div className="flex items-center text-nexus-success bg-nexus-success/10 px-2 py-0.5 rounded text-xs font-bold">
            <TrendingUp size={14} className="mr-1" />
            {product.trendScore}
          </div>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        {/* New Compliance Badge */}
        {product.complianceNote && (
           <div className="mb-4 flex items-center gap-1.5 bg-nexus-900/60 p-2 rounded border border-nexus-700/50">
             <ShieldCheck size={14} className="text-nexus-accent" />
             <span className="text-xs text-gray-300 font-mono">{product.complianceNote}</span>
           </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {product.tags.map(tag => (
            <span key={tag} className="text-xs bg-nexus-700 text-blue-300 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-nexus-700">
          <div className="flex items-center text-sm text-gray-300">
            <DollarSign size={16} className="text-nexus-warning mr-1" />
            预估毛利: <span className="text-white font-medium ml-1">{product.profitMargin}</span>
          </div>
          <button className="text-nexus-accent hover:text-blue-400 transition-colors">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
