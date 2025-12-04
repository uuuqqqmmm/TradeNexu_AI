import React from 'react';
import { ResearchTask } from '../src/types';
import { TrendingUp, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

interface ResearchSidebarProps {
    researchTasks: ResearchTask[];
    onSelectTask: (task: ResearchTask) => void;
}

export const ResearchSidebar: React.FC<ResearchSidebarProps> = ({ researchTasks, onSelectTask }) => {
    // 按平台分组
    const groupedTasks = researchTasks.reduce((acc, task) => {
        if (!acc[task.platform]) {
            acc[task.platform] = [];
        }
        acc[task.platform].push(task);
        return acc;
    }, {} as Record<string, ResearchTask[]>);

    const getStatusIcon = (status: ResearchTask['status']) => {
        switch (status) {
            case 'pending':
                return <Clock size={14} className="text-gray-500" />;
            case 'crawling':
                return <Loader size={14} className="text-nexus-accent animate-spin" />;
            case 'completed':
                return <CheckCircle size={14} className="text-nexus-success" />;
            case 'failed':
                return <XCircle size={14} className="text-red-500" />;
        }
    };

    const getStatusText = (status: ResearchTask['status']) => {
        switch (status) {
            case 'pending': return '待启动';
            case 'crawling': return '抓取中';
            case 'completed': return '已完成';
            case 'failed': return '失败';
        }
    };

    return (
        <div className="w-80 border-r border-nexus-800 bg-nexus-900/70 flex flex-col h-screen overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-nexus-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-nexus-accent" />
                    市场调研情况
                </h2>
                <p className="text-xs text-gray-500 mt-1">按平台分类 · 实时爬虫进度</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.keys(groupedTasks).length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mt-8">
                        <p>暂无调研任务</p>
                        <p className="text-xs mt-2">向AI总管提问产品即可开始</p>
                    </div>
                ) : (
                    Object.entries(groupedTasks).map(([platform, tasks]) => (
                        <div key={platform} className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent"></div>
                                {platform}
                            </div>

                            <div className="space-y-2">
                                {tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => onSelectTask(task)}
                                        className="w-full bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-lg p-3 text-left transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-sm text-white font-medium line-clamp-2 group-hover:text-nexus-accent transition-colors">
                                                {task.productQuery}
                                            </p>
                                            {getStatusIcon(task.status)}
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">
                                                {getStatusText(task.status)}
                                            </span>
                                            <span className="text-gray-600 font-mono">
                                                {task.progress}%
                                            </span>
                                        </div>

                                        {/* 进度条 */}
                                        <div className="mt-2 w-full bg-nexus-900 h-1 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${task.status === 'completed' ? 'bg-nexus-success' :
                                                    task.status === 'crawling' ? 'bg-nexus-accent' :
                                                        task.status === 'failed' ? 'bg-red-500' :
                                                            'bg-gray-600'
                                                    }`}
                                                style={{ width: `${task.progress}%` }}
                                            ></div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 底部统计 */}
            <div className="p-4 border-t border-nexus-800 bg-nexus-900/90">
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-nexus-800 rounded p-2">
                        <div className="text-gray-500">总任务</div>
                        <div className="text-white font-bold text-lg">{researchTasks.length}</div>
                    </div>
                    <div className="bg-nexus-800 rounded p-2">
                        <div className="text-gray-500">进行中</div>
                        <div className="text-nexus-accent font-bold text-lg">
                            {researchTasks.filter(t => t.status === 'crawling').length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
