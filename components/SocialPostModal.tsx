

import React, { useState } from 'react';
import Icon from './Icon';

interface SocialPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (topic: string, postType: string, platform: string) => void;
    isGenerating: boolean;
    style?: React.CSSProperties; // Add style prop
}

const SocialPostModal: React.FC<SocialPostModalProps> = ({ isOpen, onClose, onGenerate, isGenerating, style }) => {
    const [topic, setTopic] = useState('');
    const [postType, setPostType] = useState('일반');
    const [platform, setPlatform] = useState('블로그 포스팅');

    if (!isOpen) return null;

    const handleGenerateClick = () => {
        if (topic.trim() && !isGenerating) {
            onGenerate(topic, postType, platform);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
            style={style}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Icon name="messageSquare" className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900">AI 소셜 미디어 게시물 생성</h2>
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
                        <label htmlFor="social-topic" className="block text-sm font-medium text-gray-700 mb-1">
                            주제 또는 키워드
                        </label>
                        <input
                            type="text"
                            id="social-topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateClick(); }}
                            placeholder="예: 우리 회사 신제품 출시"
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-1">
                                게시물 유형
                            </label>
                            <select
                                id="postType"
                                value={postType}
                                onChange={(e) => setPostType(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option>일반</option>
                                <option>홍보</option>
                                <option>질문</option>
                                <option>공지</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                                플랫폼
                            </label>
                            <select
                                id="platform"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option>블로그 포스팅</option>
                                <option>Instagram</option>
                                <option>X (Twitter)</option>
                                <option>Facebook</option>
                                <option>LinkedIn</option>
                            </select>
                        </div>
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

export default SocialPostModal;