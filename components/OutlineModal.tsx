

import React, { useState } from 'react';
import Icon from './Icon';

interface OutlineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (topic: string, outlineType: string) => void;
    isGenerating: boolean;
    style?: React.CSSProperties; // Add style prop
}

const OutlineModal: React.FC<OutlineModalProps> = ({ isOpen, onClose, onGenerate, isGenerating, style }) => {
    const [topic, setTopic] = useState('');
    const [outlineType, setOutlineType] = useState('블로그 포스팅');

    if (!isOpen) return null;

    const handleGenerateClick = () => {
        if (topic.trim() && !isGenerating) {
            onGenerate(topic, outlineType);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
            style={style}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Icon name="list" className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900">AI 아웃라인 생성</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200/50 transition-colors"
                        aria-label="닫기"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                            주제 또는 키워드
                        </label>
                        <input
                            type="text"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateClick(); }}
                            placeholder="예: 인공지능의 미래"
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="outlineType" className="block text-sm font-medium text-gray-700 mb-1">
                            아웃라인 유형
                        </label>
                        <select
                            id="outlineType"
                            value={outlineType}
                            onChange={(e) => setOutlineType(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option>블로그 포스팅</option>
                            <option>스크립트</option>
                            <option>제품 설명</option>
                            <option>일반 아이디어</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleGenerateClick}
                        disabled={!topic.trim() || isGenerating}
                        className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
                    >
                        {isGenerating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : '생성'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OutlineModal;