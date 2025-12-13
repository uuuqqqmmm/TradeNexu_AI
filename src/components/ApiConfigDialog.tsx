/**
 * API 配置管理对话框
 */

import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Trash2, Edit2, Check, ExternalLink, AlertCircle, CheckCircle2, Eye, EyeOff, Settings, RefreshCw, Copy, CheckCheck } from 'lucide-react';
import { 
  getAllApiConfigs, 
  updateApiConfig, 
  deleteApiConfig, 
  addCustomApiConfig,
  getConfigStats,
  ApiConfig 
} from '../services/apiConfigService';

interface ApiConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// 配置项组件
const ConfigItem: React.FC<{
  config: ApiConfig;
  editingId: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  showValue: Record<string, boolean>;
  copiedId: string | null;
  handleEdit: (config: ApiConfig) => void;
  handleSave: (id: string) => void;
  handleDelete: (id: string) => void;
  handleShowValue: (id: string, show: boolean) => void;
  handleCopy: (id: string, value: string) => void;
  setEditingId: (id: string | null) => void;
  getCategoryLabel: (category: string) => string;
  getCategoryColor: (category: string) => string;
}> = ({
  config,
  editingId,
  editValue,
  setEditValue,
  showValue,
  copiedId,
  handleEdit,
  handleSave,
  handleDelete,
  handleShowValue,
  handleCopy,
  setEditingId,
  getCategoryLabel,
  getCategoryColor,
}) => (
  <div
    className={`p-4 rounded-lg border transition-all ${
      config.status === 'configured'
        ? 'bg-nexus-800/50 border-nexus-700'
        : 'bg-nexus-800/30 border-nexus-800 border-dashed'
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white">{config.name}</span>
          {config.required && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              必需
            </span>
          )}
          {config.status === 'configured' ? (
            <CheckCircle2 size={14} className="text-green-500" />
          ) : (
            <AlertCircle size={14} className="text-yellow-500" />
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">{config.description}</p>
        
        {/* 环境变量名和值 */}
        <div className="flex items-center gap-2 text-xs">
          <code className="px-2 py-1 rounded bg-nexus-900 text-gray-400 font-mono text-[10px]">
            {config.keyName}
          </code>
          <span className="text-gray-600">=</span>
          
          {editingId === config.id ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-nexus-900 border border-nexus-600 text-white text-xs font-mono focus:outline-none focus:border-nexus-accent"
                placeholder="输入 API Key..."
                autoFocus
              />
              <button
                onClick={() => handleSave(config.id)}
                className="p-1 hover:bg-green-500/20 rounded text-green-500"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 hover:bg-red-500/20 rounded text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className={`px-2 py-1 rounded font-mono min-w-[80px] text-[10px] ${
                config.status === 'configured' 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-nexus-900 text-gray-500'
              }`}>
                {showValue[config.id] && config.actualValue 
                  ? config.actualValue 
                  : (config.actualValue ? '••••••••' : '未配置')}
              </code>
              {config.actualValue && (
                <>
                  <button
                    onMouseDown={() => handleShowValue(config.id, true)}
                    onMouseUp={() => handleShowValue(config.id, false)}
                    onMouseLeave={() => handleShowValue(config.id, false)}
                    className="p-1.5 hover:bg-nexus-700 rounded text-gray-500 hover:text-gray-300 transition-colors select-none"
                    title="按住显示"
                  >
                    {showValue[config.id] ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => handleCopy(config.id, config.actualValue || '')}
                    className={`p-1.5 hover:bg-nexus-700 rounded transition-colors select-none ${
                      copiedId === config.id ? 'text-green-500' : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title={copiedId === config.id ? '已复制!' : '复制'}
                  >
                    {copiedId === config.id ? <CheckCheck size={14} /> : <Copy size={14} />}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        {config.docsUrl && (
          <a
            href={config.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-nexus-700 rounded-lg text-gray-500 hover:text-nexus-accent transition-colors"
            title="查看文档"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          onClick={() => handleEdit(config)}
          className="p-2 hover:bg-nexus-700 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
          title="编辑"
        >
          <Edit2 size={14} />
        </button>
        {config.status === 'configured' && !config.required && (
          <button
            onClick={() => handleDelete(config.id)}
            className="p-2 hover:bg-nexus-700 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>

    {/* 提供商信息 */}
    <div className="mt-2 pt-2 border-t border-nexus-800/50 flex items-center gap-4 text-[10px] text-gray-600">
      <span>提供商: {config.provider}</span>
    </div>
  </div>
);

export const ApiConfigDialog: React.FC<ApiConfigDialogProps> = ({ isOpen, onClose }) => {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    keyName: '',
    value: '',
    description: '',
    provider: ''
  });
  const [stats, setStats] = useState({ total: 0, configured: 0, required: 0, requiredConfigured: 0 });

  // 加载配置
  const loadConfigs = () => {
    setConfigs(getAllApiConfigs());
    setStats(getConfigStats());
  };

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  // 监听配置变更事件
  useEffect(() => {
    const handleConfigChange = () => loadConfigs();
    window.addEventListener('api-config-changed', handleConfigChange);
    return () => window.removeEventListener('api-config-changed', handleConfigChange);
  }, []);

  if (!isOpen) return null;

  const handleEdit = (config: ApiConfig) => {
    setEditingId(config.id);
    setEditValue(config.actualValue || '');
  };

  const handleSave = (id: string) => {
    if (editValue.trim()) {
      updateApiConfig(id, editValue.trim());
      loadConfigs();
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此配置吗？将恢复为环境变量默认值。')) {
      deleteApiConfig(id);
      loadConfigs();
    }
  };

  const handleAddNew = () => {
    if (newConfig.name && newConfig.keyName && newConfig.value) {
      addCustomApiConfig(newConfig);
      setNewConfig({ name: '', keyName: '', value: '', description: '', provider: '' });
      setIsAddingNew(false);
      loadConfigs();
    }
  };

  // 按住显示，松开隐藏
  const handleShowValue = (id: string, show: boolean) => {
    setShowValue(prev => ({ ...prev, [id]: show }));
  };

  // 复制 API Key
  const handleCopy = async (id: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ai': return 'AI 服务';
      case 'data': return '数据服务';
      default: return '其他';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'data': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-nexus-900 border border-nexus-700 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 border-b border-nexus-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-nexus-accent/20">
              <Key size={20} className="text-nexus-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">API 接口配置</h2>
              <p className="text-xs text-gray-500">管理系统中所有 API 密钥和接口配置</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-nexus-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 统计信息 */}
        <div className="px-5 py-3 border-b border-nexus-800 bg-nexus-800/30">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">总计:</span>
              <span className="text-white font-medium">{stats.total} 个接口</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-gray-500">已配置:</span>
              <span className="text-green-400 font-medium">{stats.configured}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={12} className="text-yellow-500" />
              <span className="text-gray-500">必需:</span>
              <span className={`font-medium ${stats.requiredConfigured === stats.required ? 'text-green-400' : 'text-yellow-400'}`}>
                {stats.requiredConfigured}/{stats.required}
              </span>
            </div>
            <button
              onClick={loadConfigs}
              className="ml-auto flex items-center gap-1 text-gray-500 hover:text-nexus-accent transition-colors"
            >
              <RefreshCw size={12} />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {/* 配置列表 - 按分类分组 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* AI 服务 */}
          <div>
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              AI 服务
            </h4>
            <div className="space-y-3">
              {configs.filter(c => c.category === 'ai').map(config => (
                <ConfigItem 
                  key={config.id}
                  config={config}
                  editingId={editingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  showValue={showValue}
                  copiedId={copiedId}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleDelete={handleDelete}
                  handleShowValue={handleShowValue}
                  handleCopy={handleCopy}
                  setEditingId={setEditingId}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                />
              ))}
            </div>
          </div>

          {/* 数据服务 */}
          <div>
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              数据服务
            </h4>
            <div className="space-y-3">
              {configs.filter(c => c.category === 'data').map(config => (
                <ConfigItem 
                  key={config.id}
                  config={config}
                  editingId={editingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  showValue={showValue}
                  copiedId={copiedId}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleDelete={handleDelete}
                  handleShowValue={handleShowValue}
                  handleCopy={handleCopy}
                  setEditingId={setEditingId}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                />
              ))}
            </div>
          </div>

          {/* 其他配置 */}
          {configs.filter(c => c.category === 'other').length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                其他配置
              </h4>
              <div className="space-y-3">
                {configs.filter(c => c.category === 'other').map(config => (
                  <ConfigItem 
                    key={config.id}
                    config={config}
                    editingId={editingId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    showValue={showValue}
                    copiedId={copiedId}
                    handleEdit={handleEdit}
                    handleSave={handleSave}
                    handleDelete={handleDelete}
                    handleShowValue={handleShowValue}
                    handleCopy={handleCopy}
                    setEditingId={setEditingId}
                    getCategoryLabel={getCategoryLabel}
                    getCategoryColor={getCategoryColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 添加新配置 */}
          {isAddingNew ? (
            <div className="p-4 rounded-lg border border-dashed border-nexus-accent/50 bg-nexus-accent/5">
              <h4 className="text-sm font-medium text-white mb-3">添加自定义 API 配置</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 rounded bg-nexus-900 border border-nexus-700 text-white text-xs focus:outline-none focus:border-nexus-accent"
                  placeholder="API 名称"
                />
                <input
                  type="text"
                  value={newConfig.keyName}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, keyName: e.target.value }))}
                  className="px-3 py-2 rounded bg-nexus-900 border border-nexus-700 text-white text-xs font-mono focus:outline-none focus:border-nexus-accent"
                  placeholder="环境变量名 (如 VITE_XXX_KEY)"
                />
                <input
                  type="text"
                  value={newConfig.value}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, value: e.target.value }))}
                  className="col-span-2 px-3 py-2 rounded bg-nexus-900 border border-nexus-700 text-white text-xs font-mono focus:outline-none focus:border-nexus-accent"
                  placeholder="API Key 值"
                />
                <input
                  type="text"
                  value={newConfig.description}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 rounded bg-nexus-900 border border-nexus-700 text-white text-xs focus:outline-none focus:border-nexus-accent"
                  placeholder="描述（可选）"
                />
                <input
                  type="text"
                  value={newConfig.provider}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, provider: e.target.value }))}
                  className="px-3 py-2 rounded bg-nexus-900 border border-nexus-700 text-white text-xs focus:outline-none focus:border-nexus-accent"
                  placeholder="提供商（可选）"
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddNew}
                  disabled={!newConfig.name || !newConfig.keyName || !newConfig.value}
                  className="px-3 py-1.5 text-xs bg-nexus-accent text-white rounded hover:bg-nexus-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full p-4 rounded-lg border border-dashed border-nexus-700 hover:border-nexus-accent/50 text-gray-500 hover:text-nexus-accent flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm">添加自定义 API 配置</span>
            </button>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-nexus-800 bg-nexus-800/30">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p>配置的 API Key 将保存在浏览器本地存储中，不会上传到服务器。</p>
              <p className="mt-1">建议在 <code className="text-gray-400">.env</code> 文件中配置敏感密钥以获得更好的安全性。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
