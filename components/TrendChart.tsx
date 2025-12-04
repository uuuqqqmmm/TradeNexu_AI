
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendDataPoint } from '../types';

interface TrendChartProps {
  data: TrendDataPoint[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-nexus-800 rounded-lg p-4 border border-nexus-700 shadow-lg">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        搜索热度指数 (近7天)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(str) => str.split('-').slice(1).join('/')}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            itemStyle={{ color: '#60a5fa' }}
            labelFormatter={(label) => `日期: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="volume" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVolume)" 
            name="热度"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
