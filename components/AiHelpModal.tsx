
import React from 'react';
import Icon from './Icon';

interface AiHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    style?: React.CSSProperties; // Add style prop
}

const AiHelpModal: React.FC<AiHelpModalProps> = ({ isOpen, onClose, style }) => {
    if (!isOpen) return null;

    const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            <div className="space-y-2 text-sm text-gray-600">{children}</div>
        </div>
    );
    
    const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <code className="bg-gray-200/80 text-gray-800 font-mono text-xs px-1.5 py-0.5 rounded-md">{children}</code>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
            style={style}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <Icon name="sparkles" className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900">AI 생성 가이드</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200/50 transition-colors"
                        aria-label="도움말 닫기"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                <div className="prose prose-sm max-w-none">
                    <Section title="1. 이미지 생성 (선택 없음)">
                        <p>텍스트 설명으로 새 이미지를 만듭니다. AI가 프롬프트를 기반으로 이미지를 생성하여 캔버스에 추가합니다.</p>
                        <p><strong>예시 프롬프트:</strong> <Code>작은 밴조를 연주하는 레서판다의 사실적인 사진.</Code></p>
                    </Section>

                    <Section title="2. 이미지 수정 (단일 이미지 선택)">
                        <p>캔버스에 있는 기존 이미지를 수정합니다. 이미지를 하나 선택한 후, 원하는 변경 사항을 설명하는 텍스트 프롬프트를 제공하세요. 원본을 변경하지 않고 수정된 새 이미지가 캔버스에 추가됩니다.</p>
                        <p><strong>예시 프롬프트:</strong> <Code>인물에게 선글라스를 씌워주세요.</Code> 또는 <Code>배경을 눈 덮인 숲으로 변경해주세요.</Code></p>
                    </Section>

                    <Section title="3. 장면 만들기 (여러 항목 선택)">
                        <p>선택한 여러 항목(이미지, 텍스트 상자, 도형)을 하나의 통일된 새 이미지로 결합합니다. AI가 내용과 캔버스 위의 위치를 분석합니다.</p>
                        <p><strong>예시:</strong> <Code>성</Code> 이미지와 <Code>용</Code> 이미지를 선택한 후, 다음 프롬프트를 사용하세요:</p>
                        <p><strong>프롬프트:</strong> <Code>폭풍우 치는 하늘에서의 장대한 전투.</Code></p>
                    </Section>

                     <Section title="✨ 고급: 관계 인식 장면 만들기">
                        <p>더 정확한 장면을 위해, AI는 연결선으로 정의한 관계를 이해할 수 있습니다. 항목들 사이의 연결선에 라벨을 붙여 AI에게 구체적인 지시를 내리세요.</p>
                        <p><strong>예시 설정:</strong></p>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>캔버스에 <Code>우주비행사</Code> 이미지를 놓습니다.</li>
                            <li>캔버스에 <Code>달</Code> 이미지를 놓습니다.</li>
                            <li>우주비행사에서 달로 연결선을 만듭니다.</li>
                            <li>연결선을 더블클릭하고 텍스트 라벨을 추가합니다: <Code>위에 깃발을 꽂고 있는</Code>.</li>
                        </ol>
                        <p>이제 두 이미지(와 연결선)를 모두 선택하고 프롬프트를 제공하세요:</p>
                        <p><strong>프롬프트:</strong> <Code>빈티지 공상 과학 포스터 스타일로.</Code></p>
                        <p>AI는 당신이 정의한 관계를 존중하여, 우주비행사가 달에 깃발을 꽂는 장면을 구체적으로 묘사하는 이미지를 생성할 것입니다.</p>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default AiHelpModal;