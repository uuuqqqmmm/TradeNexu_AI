import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

export type GeminiModel =
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash-lite'
    | 'gemini-3-pro';

interface ModelOption {
    id: GeminiModel;
    name: string;
    description: string;
    badge?: string;
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: 'gemini-3-pro',
        name: 'Gemini 3 Pro',
        description: '最智能的模型，全球领先',
        badge: '⚡'
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: '强大的推理模型'
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: '最均衡的模型',
        badge: '⭐'
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        description: '速度最快、最具成本效益'
    },
];

interface ModelSelectorProps {
    selectedModel: GeminiModel;
    onModelChange: (model: GeminiModel) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentModel = MODEL_OPTIONS.find(m => m.id === selectedModel) || MODEL_OPTIONS[2];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-nexus-800 rounded-full border border-nexus-700 hover:border-nexus-600 transition-colors text-sm text-gray-300"
            >
                <Sparkles size={14} className="text-nexus-accent" />
                <span className="font-medium">{currentModel.name}</span>
                {currentModel.badge && <span className="text-xs">{currentModel.badge}</span>}
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-nexus-800 border border-nexus-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-nexus-700 bg-nexus-900/50">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">选择模型</span>
                    </div>
                    <div className="py-1">
                        {MODEL_OPTIONS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-nexus-700/50 transition-colors ${selectedModel === model.id ? 'bg-nexus-700/30' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-medium text-sm ${selectedModel === model.id ? 'text-nexus-accent' : 'text-gray-200'
                                        }`}>
                                        {model.name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {model.badge && <span className="text-sm">{model.badge}</span>}
                                        {selectedModel === model.id && (
                                            <div className="w-2 h-2 rounded-full bg-nexus-accent"></div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">{model.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
