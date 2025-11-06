import React, { useState, useEffect, useCallback } from 'react';
import type { CanvasItem, Connector, TextItem, ShapeItem, ImageItem, BorderStyleType, ConnectorStyleType, Background, ColorStop, SolidBackground, GradientBackground, ShapeType } from '../types';
import Icon from './Icon';

const PanelSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-200">
            <button className="w-full flex justify-between items-center p-3 hover:bg-gray-50" onClick={() => setIsOpen(!isOpen)}>
                <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
                <Icon name={isOpen ? 'chevronsUp' : 'chevronsDown'} className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform -rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-3 pt-0 space-y-4">{children}</div>}
        </div>
    );
};

const StatefulInputField: React.FC<{
    label: string;
    id: string;
    type: 'text' | 'number';
    value: string | number;
    onChange: (value: string | number) => void;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}> = ({ label, id, type, value, onChange, suffix, disabled = false, ...props }) => {
    const [internalValue, setInternalValue] = useState(value);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (disabled) return;
        if (type === 'number') {
            const numValue = parseFloat(internalValue as string);
            if (!isNaN(numValue)) onChange(numValue);
            else setInternalValue(value);
        } else {
            onChange(internalValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="grid grid-cols-2 items-center text-sm">
            <label htmlFor={id} className="text-gray-600">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={internalValue}
                    onChange={(e) => setInternalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full px-2 py-1 bg-gray-100 border border-gray-200 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-200"
                    disabled={disabled}
                    {...props}
                />
                {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{suffix}</span>}
            </div>
        </div>
    );
};

const ColorPicker: React.FC<{
    label: string;
    id: string;
    color: string;
    onChange: (color: string) => void;
    disabled?: boolean;
}> = ({ label, id, color, onChange, disabled = false }) => {
    return (
        <div className="grid grid-cols-2 items-center text-sm">
            <label htmlFor={id} className="text-gray-600">{label}</label>
            <div className="flex items-center justify-end gap-2">
                <span className="text-gray-500 font-mono">{color}</span>
                <input
                    id={id}
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 p-0.5 bg-white border border-gray-300 rounded-md cursor-pointer disabled:cursor-not-allowed"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};

const AlignmentButtons: React.FC<{
    value: 'left' | 'center' | 'right';
    onChange: (value: 'left' | 'center' | 'right') => void;
    disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => (
    <div className="grid grid-cols-2 items-center text-sm">
        <span className="text-gray-600">정렬</span>
        <div className="flex justify-end bg-gray-100 rounded-md p-0.5">
            {(['left', 'center', 'right'] as const).map(align => (
                <button
                    key={align}
                    onClick={() => onChange(align)}
                    className={`p-1.5 rounded-sm ${value === align ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    disabled={disabled}
                >
                    <Icon name={`align${align.charAt(0).toUpperCase() + align.slice(1)}` as 'alignLeft' | 'alignCenter' | 'alignRight'} className="w-4 h-4 text-gray-700" />
                </button>
            ))}
        </div>
    </div>
);

const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Verdana, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
];

interface DetailsPanelProps {
    entity: CanvasItem | Connector;
    onUpdateItem: (itemId: string, updates: Partial<CanvasItem>) => void;
    onUpdateConnector: (connectorId: string, updates: Partial<Connector>) => void;
    onClose: () => void;
    onSummarizeText: (itemId: string) => void;
    onExpandText: (itemId: string) => void;
    onRefineText: (itemId: string) => void;
    onChangeTextTone: (itemId: string, tone: string) => void;
    onAddKeywordParagraph: (itemId: string, keyword: string) => void;
    onInformationSearch: (itemId: string, query: string) => void;
    isGeneratingAIContentForThisItem: boolean;
    className?: string; // Add className prop
}

const isConnector = (entity: CanvasItem | Connector): entity is Connector => 'fromId' in entity;
const isTextualItem = (item: CanvasItem): item is TextItem | ShapeItem => item.type === 'text' || item.type === 'shape';

const DetailsPanel: React.FC<DetailsPanelProps> = ({
    entity,
    onUpdateItem,
    onUpdateConnector,
    onClose,
    onSummarizeText,
    onExpandText,
    onRefineText,
    onChangeTextTone,
    onAddKeywordParagraph,
    onInformationSearch,
    isGeneratingAIContentForThisItem,
    className // Destructure className
}) => {
    const isItem = !isConnector(entity);
    const hasTextualContent = isItem && isTextualItem(entity);
    const [activeTab, setActiveTab] = useState<'style' | 'ai' | 'api'>('style');
    
    useEffect(() => {
        if (activeTab === 'ai' && !hasTextualContent) {
            setActiveTab('style');
        }
    }, [entity, activeTab, hasTextualContent]);

    const updateItem = useCallback((updates: Partial<CanvasItem>) => {
        if (!isConnector(entity)) {
            onUpdateItem(entity.id, updates);
        }
    }, [entity, onUpdateItem]);

    const updateConnector = useCallback((updates: Partial<Connector>) => {
        if (isConnector(entity)) {
            onUpdateConnector(entity.id, updates);
        }
    }, [entity, onUpdateConnector]);
    
    const [aiActionInput, setAiActionInput] = useState('');
    const [showAiInputFor, setShowAiInputFor] = useState<string | null>(null);

    const handleAiAction = (action: Function, requiresInput: boolean, ...args: any[]) => {
        if (isConnector(entity) || !isTextualItem(entity)) return;
        
        if (requiresInput) {
            if (!aiActionInput.trim()) return;
            action(entity.id, aiActionInput.trim(), ...args);
            setShowAiInputFor(null);
            setAiActionInput('');
        } else {
            action(entity.id, ...args);
        }
    };
    
    const AiActionButton: React.FC<{
        action: Function;
        label: string;
        requiresInput?: boolean;
        actionKey: string;
    }> = ({ action, label, requiresInput = false, actionKey }) => {
        const isInputVisible = showAiInputFor === actionKey;
        return (
            <div>
                <button
                    onClick={() => requiresInput ? setShowAiInputFor(isInputVisible ? null : actionKey) : handleAiAction(action, false)}
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-800"
                >
                    {label}
                </button>
                {isInputVisible && (
                    <div className="mt-2 flex gap-2">
                        <input
                            type="text"
                            value={aiActionInput}
                            onChange={(e) => setAiActionInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAiAction(action, true) }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            placeholder={actionKey === 'change_tone' ? '예: 전문적으로, 유머러스하게' : '키워드 또는 검색어'}
                            autoFocus
                        />
                        <button onClick={() => handleAiAction(action, true)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md">실행</button>
                    </div>
                )}
            </div>
        );
    };

    const textItem = isItem && isTextualItem(entity) ? entity : null;
    const shapeItem = isItem && entity.type === 'shape' ? entity : null;
    const connector = isConnector(entity) ? entity : null;

    const TabButton: React.FC<{ name: 'style' | 'ai' | 'api'; label: string; }> = ({ name, label }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === name ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {label}
        </button>
    );

    const [apiKey, setApiKey] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState('');

    // 크롬 확장 프로그램 스토리지 연동
    useEffect(() => {
        if (window.chrome && window.chrome.storage) {
            window.chrome.storage.local.get(['apiKey'], (result) => {
                if (result.apiKey) setApiKey(result.apiKey);
            });
        }
    }, []);

    const handleSaveApiKey = () => {
        if (window.chrome && window.chrome.storage) {
            window.chrome.storage.local.set({ apiKey }, () => {
                setApiKeyStatus('저장되었습니다!');
                setTimeout(() => setApiKeyStatus(''), 2000);
            });
        } else {
            setApiKeyStatus('크롬 확장 환경에서만 저장됩니다.');
        }
    };

    return (
        <div className={`fixed top-0 right-0 h-screen w-80 bg-white shadow-lg z-30 flex flex-col border-l border-gray-200 ${className || ''}`}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">세부 정보</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                    <Icon name="close" className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="border-b border-gray-200 flex-shrink-0">
                <nav className="flex -mb-px">
                    <TabButton name="style" label="스타일" />
                    {hasTextualContent && <TabButton name="ai" label="AI" />}
                    <TabButton name="api" label="API 관리" />
                </nav>
            </div>

            <div className="flex-grow overflow-y-auto">
                <div style={{ display: activeTab === 'style' ? 'block' : 'none' }}>
                    {isItem && (
                        <>
                            <PanelSection title="변형">
                                <StatefulInputField label="X" id="pos-x" type="number" value={Math.round(entity.x)} onChange={v => updateItem({ x: v as number })} />
                                <StatefulInputField label="Y" id="pos-y" type="number" value={Math.round(entity.y)} onChange={v => updateItem({ y: v as number })} />
                                <StatefulInputField label="너비" id="width" type="number" value={Math.round(entity.width)} min={10} onChange={v => updateItem({ width: v as number })} />
                                <StatefulInputField label="높이" id="height" type="number" value={Math.round(entity.height)} min={10} onChange={v => updateItem({ height: v as number })} />
                            </PanelSection>
                            <PanelSection title="모양">
                               <div className="grid grid-cols-2 items-center text-sm">
                                   <label htmlFor="opacity-slider" className="text-gray-600">투명도</label>
                                   <div className="flex items-center gap-2">
                                       <input id="opacity-slider" type="range" min="0" max="1" step="0.1" value={entity.opacity ?? 1} onChange={e => updateItem({ opacity: parseFloat(e.target.value) })} className="w-full" />
                                       <span>{Math.round((entity.opacity ?? 1) * 100)}%</span>
                                   </div>
                               </div>
                               <StatefulInputField label="모서리 둥글기" id="border-radius" type="number" value={entity.borderRadius ?? 0} min={0} onChange={v => updateItem({ borderRadius: v as number })} suffix="px" />
                            </PanelSection>
                        </>
                    )}
                    {textItem && <PanelSection title="배경"><ColorPicker label="색상" id="bg-color" color={(textItem.background as SolidBackground).color || '#ffffff'} onChange={c => updateItem({ background: { type: 'solid', color: c } })} /></PanelSection>}
                    {shapeItem && (
                        <PanelSection title="테두리">
                           <ColorPicker label="색상" id="border-color" color={shapeItem.border.color} onChange={c => updateItem({ border: { ...shapeItem.border, color: c }})} />
                           <StatefulInputField label="두께" id="border-width" type="number" value={shapeItem.border.width} min={0} onChange={v => updateItem({ border: { ...shapeItem.border, width: v as number }})} suffix="px" />
                           <div className="grid grid-cols-2 items-center text-sm">
                              <label htmlFor="border-style" className="text-gray-600">스타일</label>
                              <select id="border-style" value={shapeItem.border.style} onChange={e => updateItem({ border: { ...shapeItem.border, style: e.target.value as BorderStyleType }})} className="w-full px-2 py-1 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                                  <option value="solid">실선</option>
                                  <option value="dashed">파선</option>
                                  <option value="dotted">점선</option>
                              </select>
                           </div>
                        </PanelSection>
                    )}
                    {connector && (
                        <PanelSection title="연결선 스타일">
                            <StatefulInputField label="라벨" id="conn-label" type="text" value={connector.label || ''} onChange={v => updateConnector({ label: v as string })} />
                            <ColorPicker label="라벨 색상" id="conn-label-color" color={connector.labelColor || '#000000'} onChange={c => updateConnector({ labelColor: c })} />
                            <StatefulInputField label="라벨 크기" id="conn-label-size" type="number" value={connector.labelFontSize || 14} min={8} onChange={v => updateConnector({ labelFontSize: v as number })} suffix="px" />
                            <div className="h-px bg-gray-200 my-2"></div>
                            <ColorPicker label="선 색상" id="conn-color" color={connector.color || '#4b5563'} onChange={c => updateConnector({ color: c })} />
                            <StatefulInputField label="선 두께" id="conn-width" type="number" value={connector.strokeWidth || 3} min={1} onChange={v => updateConnector({ strokeWidth: v as number })} suffix="px" />
                            <div className="grid grid-cols-2 items-center text-sm">
                               <label htmlFor="conn-style" className="text-gray-600">선 스타일</label>
                               <select id="conn-style" value={connector.style || 'solid'} onChange={e => updateConnector({ style: e.target.value as ConnectorStyleType })} className="w-full px-2 py-1 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                                   <option value="solid">실선</option>
                                   <option value="dashed">파선</option>
                                   <option value="dotted">점선</option>
                               </select>
                            </div>
                        </PanelSection>
                    )}
                </div>
                <div style={{ display: activeTab === 'ai' && hasTextualContent ? 'block' : 'none' }}>
                    <PanelSection title="AI 텍스트 편집">
                        {isGeneratingAIContentForThisItem ? (
                            <div className="flex items-center justify-center p-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AiActionButton action={onSummarizeText} label="요약하기" actionKey="summarize" />
                                <AiActionButton action={onExpandText} label="내용 확장하기" actionKey="expand" />
                                <AiActionButton action={onRefineText} label="문장 다듬기" actionKey="refine" />
                                <AiActionButton action={onChangeTextTone} label="다른 문체로 변경..." requiresInput actionKey="change_tone" />
                                <AiActionButton action={onAddKeywordParagraph} label="키워드 문단 추가..." requiresInput actionKey="add_keyword" />
                                <AiActionButton action={onInformationSearch} label="정보 검색 및 통합..." requiresInput actionKey="search_info" />
                            </div>
                        )}
                    </PanelSection>
                </div>
                <div style={{ display: activeTab === 'api' ? 'block' : 'none' }} className="p-4">
                    <h3 className="text-md font-bold mb-2">API Key 관리</h3>
                    <input
                        type="text"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
                        placeholder="Google Gemini API Key 입력"
                    />
                    <button
                        onClick={handleSaveApiKey}
                        className="px-4 py-1 bg-blue-500 text-white rounded"
                    >저장</button>
                    {apiKeyStatus && <div className="mt-2 text-green-600 text-sm">{apiKeyStatus}</div>}
                </div>
            </div>
        </div>
    );
};

export default DetailsPanel;