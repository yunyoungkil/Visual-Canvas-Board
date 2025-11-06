

import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import type { KeywordAnalysisResult } from '../types';

interface KeywordAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (mainKeyword: string) => Promise<KeywordAnalysisResult | null>;
    onAddKeywordToCanvas: (text: string) => void;
    isGenerating: boolean;
    currentInput: string;
    lastGeneratedInput: string | null;
    results: KeywordAnalysisResult | null;
    onInputUpdate: (value: string) => void;
    style?: React.CSSProperties; // Add style prop
}

const KeywordAnalysisModal: React.FC<KeywordAnalysisModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    onAddKeywordToCanvas,
    isGenerating,
    currentInput,
    lastGeneratedInput,
    results,
    onInputUpdate,
    style
}) => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAnalyzeClick = async () => {
        if (!currentInput.trim() || isGenerating) return;

        setError(null);
        
        try {
            const analysisResult = await onGenerate(currentInput);
            if (!analysisResult) {
                setError('키워드 분석 결과를 가져오지 못했습니다. 다시 시도해주세요.');
            }
        } catch (e: any) {
            console.error('Keyword analysis failed:', e);
            setError(e.message || '키워드 분석 중 오류가 발생했습니다.');
        }
    };

    const handleAddClick = (text: string) => {
        onAddKeywordToCanvas(text);
    };

    const isGenerateButtonDisabled = !currentInput.trim() || isGenerating || (currentInput === lastGeneratedInput && results !== null);
    const needsNewAnalysis = results !== null && currentInput !== lastGeneratedInput;

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
            style={style}
        >
            <div
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Icon name="lightbulb" className="w-6 h-6 text-purple-500" />
                        <h2 className="text-xl font-bold text-gray-900">AI 키워드 분석</h2>
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
                            <label htmlFor="main-keyword" className="block text-sm font-medium text-gray-700 mb-1">
                                메인 키워드
                            </label>
                            <input
                                type="text"
                                id="main-keyword"
                                value={currentInput}
                                onChange={(e) => onInputUpdate(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyzeClick(); }}
                                placeholder="예: 비건 식단, 디지털 마케팅 전략"
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                                autoFocus
                            />
                             {needsNewAnalysis && (
                                <p className="text-sm text-gray-500 mt-2">
                                    현재 표시된 분석 결과는 이전 키워드에 대한 것입니다. 새로운 키워드를 분석하려면 '분석하기' 버튼을 누르세요.
                                </p>
                            )}
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-600">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                <p className="mt-4">키워드를 분석하고 있습니다...</p>
                            </div>
                        )}

                        {results && !isGenerating && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">분석 결과: <span className="text-blue-600">{results.mainKeyword}</span></h3>
                                <div className="space-y-3">
                                    {(results.subKeywords || []).map((sub, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-md font-bold text-gray-800">{sub.keyword}</h4>
                                                <button
                                                    onClick={() => handleAddClick(sub.keyword)}
                                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 font-semibold rounded-full hover:bg-blue-200 transition-colors flex-shrink-0"
                                                >
                                                    캔버스에 추가
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2 italic">{sub.relevance}</p>
                                            <h5 className="text-xs font-semibold text-gray-600 mb-1">콘텐츠 아이디어:</h5>
                                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                {(sub.contentIdeas || []).map((idea, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <span className="flex-grow">{idea}</span>
                                                        <button
                                                            onClick={() => handleAddClick(idea)}
                                                            className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex-shrink-0"
                                                        >
                                                            추가
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end flex-shrink-0">
                    <button
                        onClick={handleAnalyzeClick}
                        disabled={isGenerateButtonDisabled}
                        className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[150px]"
                    >
                        {isGenerating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : '분석하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KeywordAnalysisModal;