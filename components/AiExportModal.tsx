

import React, { useState } from 'react';
import Icon from './Icon';

export type ExportFormat = '블로그 포스트' | '보고서' | '프레젠테이션';

interface AiExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: ExportFormat) => void;
    isExporting: boolean;
    style?: React.CSSProperties; // Add style prop
}

const AiExportModal: React.FC<AiExportModalProps> = ({ isOpen, onClose, onExport, isExporting, style }) => {
    const [format, setFormat] = useState<ExportFormat>('블로그 포스트');

    if (!isOpen) return null;

    const handleExportClick = () => {
        if (!isExporting) {
            onExport(format);
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
                        <Icon name="export" className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900">AI로 내보내기</h2>
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
                        <label htmlFor="exportFormat" className="block text-sm font-medium text-gray-700 mb-1">
                            출력 형식
                        </label>
                        <select
                            id="exportFormat"
                            value={format}
                            onChange={(e) => setFormat(e.target.value as ExportFormat)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option>블로그 포스트</option>
                            <option>보고서</option>
                            <option>프레젠테이션</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            현재 마크다운(.md) 파일로 내보내기를 지원합니다.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleExportClick}
                        disabled={isExporting}
                        className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[160px]"
                    >
                        {isExporting ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : '생성 및 내보내기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiExportModal;