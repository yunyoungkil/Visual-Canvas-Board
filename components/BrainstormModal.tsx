

import React, { useState } from 'react';
import Icon from './Icon';

interface BrainstormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (focus: string) => Promise<string[] | null>;
    onAddIdeaToCanvas: (ideaText: string) => void;
    style?: React.CSSProperties; // Add style prop
}

const BrainstormModal: React.FC<BrainstormModalProps> = ({ isOpen, onClose, onGenerate, onAddIdeaToCanvas, style }) => {
    const [focus, setFocus] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerateClick = async () => {
        setIsGenerating(true);
        setError(null);
        setIdeas([]);
        const result = await onGenerate(focus);
        if (result) {
            setIdeas(result);
        } else {
            setError('아이디어 생성에 실패했습니다. 다시 시도해주세요.');
        }
        setIsGenerating(false);
    };

    const handleAddClick = (idea: string) => {
        onAddIdeaToCanvas(idea);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
            style={style}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Icon name="lightbulb" className="w-6 h-6 text-yellow-500" />
                        <h2 className="text-xl font-bold text-gray-900">AI 아이디어 브레인스토밍</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200/50 transition-colors"
                        aria-label="닫기"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="brainstorm-focus" className="block text-sm font-medium text-gray-700 mb-1">
                                아이디어 포커스 (선택 사항)
                            </label>
                            <input
                                type="text"
                                id="brainstorm-focus"
                                value={focus}
                                onChange={(e) => setFocus(e.target.value)}
                                placeholder="예: 다음 블로그 포스트 주제, 마케팅 캠페인 슬로건"
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-600">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                <p className="mt-4">캔버스를 분석하고 아이디어를 생성 중입니다...</p>
                            </div>
                        )}
                        {ideas.length > 0 && !isGenerating && (
                            <div className="space-y-3">
                                <h3 className="text-md font-semibold text-gray-800">AI 제안 아이디어</h3>
                                <ul className="space-y-2">
                                    {ideas.map((idea, index) => (
                                        <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-sm text-gray-800 flex-grow mr-4">{idea}</p>
                                            <button 
                                                onClick={() => handleAddClick(idea)}
                                                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 font-semibold rounded-full hover:bg-blue-200 transition-colors flex-shrink-0"
                                            >
                                                캔버스에 추가
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end flex-shrink-0">
                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                        className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[150px]"
                    >
                        {isGenerating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : '아이디어 제안받기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BrainstormModal;