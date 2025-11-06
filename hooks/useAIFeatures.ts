import React, { useState, useCallback } from 'react';
import type { CanvasItem, Connector, Point, ImageItem, KeywordAnalysisResult, ChatMessage, TextItem, ShapeItem, HandlePosition, SolidBackground, ShapeType, BorderStyle, CanvasStateAndActions } from '../types';
import { GoogleGenAI, Modality, Type, FunctionDeclaration, GenerateImagesParameters } from "@google/genai";
import type { AIStudio } from '../types';

declare const htmlToImage: any;

function htmlToText(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
}

function textToHtml(text: string): string {
    return `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
}


function safeParseJsonResponse<T>(jsonString: string): T | null {
    try {
        const trimmedString = jsonString.trim();
        const jsonMatch = trimmedString.match(/^```json\s*([\s\S]*?)\s*```$/) || trimmedString.match(/^```\s*([\s\S]*?)\s*```$/);
        if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(trimmedString);
    } catch (e) {
        console.error("JSON 응답 파싱 실패:", e);
        console.error("원본 문자열:", jsonString);
        return null;
    }
}

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

const generateImageFunctionDeclaration: FunctionDeclaration = {
    name: 'generateImage',
    description: '사용자가 이미지 생성을 요청할 때 사용하는 함수입니다. 예를 들어, "고양이 그림 그려줘" 또는 "16:9 비율의 로고 이미지 만들어줘"와 같은 요청이 해당됩니다.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description: '생성할 이미지에 대한 상세한 텍스트 설명입니다.',
            },
            aspectRatio: {
                type: Type.STRING,
                description: '생성할 이미지의 가로 세로 비율입니다. 지원되는 값은 "1:1", "3:4", "4:3", "9:16", "16:9" 입니다. 지정하지 않으면 "1:1"이 기본값입니다.',
                enum: ["1:1", "3:4", "4:3", "9:16", "16:9"],
            }
        },
        required: ['prompt'],
    },
};

export const useAIFeatures = (
    { items, connectors, scale, viewOffset, maxZIndex, setItems, setConnectors, commitState }: CanvasStateAndActions,
    selectedItemIds: string[]
) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isAiHelpModalVisible, setIsAiHelpModalVisible] = useState(false);
    const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
    const [isSocialPostModalOpen, setIsSocialPostModalOpen] = useState(false);
    const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
    const [isAiExportModalOpen, setIsAiExportModalOpen] = useState(false);
    const [isKeywordAnalysisModalOpen, setIsKeywordAnalysisModalOpen] = useState(false);
    const [isExportingWithAi, setIsExportingWithAi] = useState(false);
    const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
    const [isGeneratingSocialPost, setIsGeneratingSocialPost] = useState(false);
    const [isGeneratingKeywordAnalysis, setIsGeneratingKeywordAnalysis] = useState(false);
    const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
    const [isSuggestingGroups, setIsSuggestingGroups] = useState(false);
    const [isGeneratingAIContentFor, setIsGeneratingAIContentFor] = useState<string | null>(null);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(false);
    const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: crypto.randomUUID(), role: 'assistant', content: "안녕하세요! 무엇을 도와드릴까요? 저와 대화하며 캔버스 작업을 자동화할 수 있습니다." }
    ]);
    const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
    const [keywordAnalysisCurrentInput, setKeywordAnalysisCurrentInput] = useState('');
    const [keywordAnalysisLastGeneratedInput, setKeywordAnalysisLastGeneratedInput] = useState<string | null>(null);
    const [keywordAnalysisResults, setKeywordAnalysisResults] = useState<KeywordAnalysisResult | null>(null);
    const [isGeneratingGroupDraft, setIsGeneratingGroupDraft] = useState(false);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);

    const screenToCanvas = useCallback((pos: Point): Point => ({ x: (pos.x - viewOffset.x) / scale, y: (pos.y - viewOffset.y) / scale }), [viewOffset, scale]);

    const getGeminiClient = useCallback(async () => {
        setIsCheckingApiKey(true);
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 입력하세요.");
            }
            return new GoogleGenAI({ apiKey });
        } catch (error) {
            console.error("API Key selection failed:", error);
            setApiKeyError("API 키를 선택하는 데 실패했습니다. .env.local 파일을 확인하세요.");
            throw new Error("API Key not selected or invalid.");
        } finally {
            setIsCheckingApiKey(false);
        }
    }, []);

    const handleApiCall = useCallback(async <T extends (...args: any[]) => Promise<any>>(
        apiCall: T,
        ...args: Parameters<T>
    ): Promise<Awaited<ReturnType<T>>> => {
        try {
            return await apiCall(...args);
        } catch (error: any) {
            if (error.message) {
                if (error.message.includes("Requested entity was not found.")) {
                    setApiKeyError("API 키가 유효하지 않거나 찾을 수 없습니다. 새로운 API 키를 선택해주세요.");
                } else if (error.message.includes("billed users")) {
                    setApiKeyError("Imagen API는 현재 결제가 설정된 사용자만 이용할 수 있습니다. API 키의 결제 설정을 확인해주세요.");
                }
            }
            throw error;
        }
    }, [setApiKeyError]);

    const handleExportPng = useCallback((exportRef: React.RefObject<HTMLDivElement>) => {
        if (!exportRef.current) return;
        setIsExporting(true);
        setTimeout(() => {
             htmlToImage.toPng(exportRef.current, {
                pixelRatio: 2,
                style: { transform: 'scale(1)', transformOrigin: '0 0' }
             })
            .then((dataUrl: string) => {
                const link = document.createElement('a');
                link.download = 'canvas-export.png';
                link.href = dataUrl;
                link.click();
            })
            .catch((err: Error) => console.error('oops, something went wrong!', err))
            .finally(() => setIsExporting(false));
        }, 100);
    }, []);
    
    const handleGenerateTextDraft = useCallback(async (itemId: string, promptHtml: string, setEditingItemId: (id: string | null) => void) => {
        setIsGeneratingAIContentFor(itemId);
        try {
            const aiClient = await getGeminiClient();
            const promptText = htmlToText(promptHtml);
            const prompt = `"${promptText}"라는 주제 또는 키워드를 바탕으로 약 3~4문단 길이의 상세한 초안을 작성해주세요.`;
            const response = await handleApiCall(aiClient.models.generateContent, { model: 'gemini-2.5-flash', contents: prompt });
            const newContent = textToHtml(response.text);

            const newItems = items.map(item => {
                if (item.id === itemId && (item.type === 'text' || item.type === 'shape')) {
                    const tempDiv = document.createElement('div');
                    tempDiv.style.width = `${item.width - 16}px`;
                    tempDiv.style.fontSize = `${item.fontSize}px`;
                    tempDiv.style.lineHeight = '1.4';
                    tempDiv.innerHTML = newContent;
                    document.body.appendChild(tempDiv);
                    const newHeight = tempDiv.scrollHeight + 16;
                    document.body.removeChild(tempDiv);

                    return { ...item, content: newContent, height: Math.max(item.height, newHeight) };
                }
                return item;
            });
            commitState(newItems as CanvasItem[], connectors);
            setItems(newItems as CanvasItem[]);
        } catch (error) {
            console.error("Generate text draft failed:", error);
            alert(`초안 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsGeneratingAIContentFor(null);
        }
    }, [items, connectors, commitState, setItems, getGeminiClient, handleApiCall]);
    
    const handleCommitTextAndGenerateDraft = useCallback((itemId: string, content: string, setEditingItemId: (id: string | null) => void) => {
        const newItems = items.map(item => {
            if (item.id === itemId && (item.type === 'text' || item.type === 'shape')) {
                return { ...item, content };
            }
            return item;
        }) as CanvasItem[];
        
        setItems(newItems);
        handleGenerateTextDraft(itemId, content, setEditingItemId);
        setEditingItemId(null);
    }, [items, handleGenerateTextDraft, setItems]);

    const handleAiTextEdit = useCallback(async (
        itemId: string, 
        action: 'summarize' | 'expand' | 'refine' | 'change_tone' | 'add_keyword' | 'search_info', 
        additionalInput?: string
    ) => {
        const item = items.find(i => i.id === itemId);
        if (!item || (item.type !== 'text' && item.type !== 'shape')) return;
        
        setIsGeneratingAIContentFor(itemId);
        
        try {
            const aiClient = await getGeminiClient();
            const fullText = htmlToText(item.content);

            let prompt = `[작업 지시]\n다음 텍스트에 대해 작업을 수행해주세요:\n\`\`\`\n${fullText}\n\`\`\`\n\n작업: `;
            
            switch(action) {
                case 'summarize': prompt += `요약하기`; break;
                case 'expand': prompt += `내용 확장하기`; break;
                case 'refine': prompt += `문장 다듬기 (문법, 명확성, 흐름 개선)`; break;
                case 'change_tone': prompt += `"${additionalInput}" 문체로 변경하기`; break;
                case 'add_keyword': prompt += `"${additionalInput}" 키워드에 대한 문단을 자연스럽게 추가하기`; break;
                case 'search_info': prompt += `"${additionalInput}"에 대한 최신 정보를 웹에서 검색하여, 그 결과를 텍스트에 자연스럽게 통합하기. 출처는 마크다운 링크 형식으로 포함해주세요.`; break;
            }

            prompt += `\n\n[응답 형식]\n수정된 **전체 텍스트**만을 반환해주세요. 다른 설명이나 인사말은 포함하지 마세요.`;

            const response = await handleApiCall(aiClient.models.generateContent, {
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    ...(action === 'search_info' && { tools: [{ googleSearch: {} }] })
                }
            });
            const newContent = textToHtml(response.text);

            const newItems = items.map(i => {
                if (i.id === itemId) {
                    const tempDiv = document.createElement('div');
                    tempDiv.style.width = `${i.width - 16}px`;
                    tempDiv.style.fontSize = `${(i as TextItem | ShapeItem).fontSize}px`;
                    tempDiv.style.lineHeight = '1.4';
                    tempDiv.innerHTML = newContent;
                    document.body.appendChild(tempDiv);
                    const newHeight = tempDiv.scrollHeight + 16;
                    document.body.removeChild(tempDiv);
                    return { ...i, content: newContent, height: Math.max(i.height, newHeight) };
                }
                return i;
            });
            commitState(newItems as CanvasItem[], connectors);
            setItems(newItems as CanvasItem[]);

        } catch (error) {
            console.error("AI text edit failed:", error);
            alert(`AI 텍스트 편집 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsGeneratingAIContentFor(null);
        }
    }, [items, connectors, commitState, setItems, getGeminiClient, handleApiCall]);

    const handleUpdateTextDraftWithConnections = useCallback(async (itemId: string, mainDraftHtml: string) => {
        const mainItem = items.find(i => i.id === itemId);
        if (!mainItem || (mainItem.type !== 'text' && mainItem.type !== 'shape')) return;

        setIsGeneratingAIContentFor(itemId);
        try {
            const aiClient = await getGeminiClient();
            const connectedItemsInfo: string[] = [];
            connectors.forEach(conn => {
                let connectedItemId: string | null = null;
                if (conn.fromId === itemId) connectedItemId = conn.toId;
                else if (conn.toId === itemId) connectedItemId = conn.fromId;

                if (connectedItemId) {
                    const connectedItem = items.find(i => i.id === connectedItemId);
                    if (connectedItem) {
                        let info = `[항목 ID: ${connectedItem.id}, 유형: ${connectedItem.type}`;
                        if (connectedItem.type === 'text' || connectedItem.type === 'shape') info += `, 내용: "${htmlToText(connectedItem.content)}"`;
                        if (connectedItem.type === 'image') info += `, 설명: 이미지`;
                        if (conn.label) info += `, 관계: "${conn.label}"`;
                        info += ']';
                        connectedItemsInfo.push(info);
                    }
                }
            });
            
            const prompt = `다음은 메인 텍스트 초안입니다:\n\`\`\`\n${htmlToText(mainItem.content)}\n\`\`\`\n\n이 초안은 다음 항목들과 연결되어 있습니다:\n${connectedItemsInfo.join('\n')}\n\n연결된 항목들의 정보를 통합하여 메인 초안을 더 풍부하고 논리적으로 업데이트해주세요. 수정된 전체 초안만을 응답으로 반환하세요.`;
            
            const response = await handleApiCall(aiClient.models.generateContent, { model: 'gemini-2.5-pro', contents: prompt });
            const updatedContent = textToHtml(response.text);
            
            const newItems = items.map(i => i.id === itemId ? { ...i, content: updatedContent } : i);
            commitState(newItems as CanvasItem[], connectors);
            setItems(newItems as CanvasItem[]);
        } catch (error) {
            console.error("Update text draft with connections failed:", error);
        } finally {
            setIsGeneratingAIContentFor(null);
        }
    }, [items, connectors, commitState, setItems, getGeminiClient, handleApiCall]);
    
    const handleSuggestGroups = useCallback(async (selectedItemIds: string[]) => {
        if (selectedItemIds.length < 2) return;
        setIsSuggestingGroups(true);
        try {
            const aiClient = await getGeminiClient();
            const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
            const itemsDescription = selectedItems.map(item => {
                let desc = `ID: ${item.id}, 유형: ${item.type}, 위치: (${Math.round(item.x)}, ${Math.round(item.y)})`;
                if (item.type === 'text' || item.type === 'shape') desc += `, 내용: "${htmlToText(item.content)}"`;
                return desc;
            }).join('\n');
            
            const prompt = `다음은 캔버스 위의 항목 목록입니다:\n${itemsDescription}\n\n의미적으로 관련이 있거나 논리적으로 함께 묶일 수 있는 항목들의 그룹을 제안해주세요. 각 그룹은 해당 그룹에 속하는 항목들의 ID 목록이어야 합니다.`;
            const response = await handleApiCall(aiClient.models.generateContent, {
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { itemIds: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
                }
            });
            const suggestions = safeParseJsonResponse<Array<{ itemIds: string[] }>>(response.text);
            
            if (!suggestions) {
                console.error("Failed to parse group suggestions from AI response.");
                setSuggestedGroups([]);
                return;
            }

            const newSuggestions = suggestions.map((group: { itemIds: string[] }) => {
                const groupItems = items.filter(item => group.itemIds.includes(item.id));
                if (groupItems.length === 0) return null;
                const bounds = groupItems.reduce((acc, item) => ({
                    minX: Math.min(acc.minX, item.x),
                    minY: Math.min(acc.minY, item.y),
                    maxX: Math.max(acc.maxX, item.x + item.width),
                    maxY: Math.max(acc.maxY, item.y + item.height),
                }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

                return {
                    id: crypto.randomUUID(),
                    itemIds: group.itemIds,
                    bounds: { x: bounds.minX, y: bounds.minY, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY },
                };
            }).filter(Boolean);

            setSuggestedGroups(newSuggestions);
        } catch (error) {
            console.error("Suggest groups failed:", error);
        } finally {
            setIsSuggestingGroups(false);
        }
    }, [items, getGeminiClient, handleApiCall]);
    
    const handleAcceptSuggestion = useCallback((suggestion: any, setSelectedItemIds: (ids: string[]) => void) => {
        const groupId = crypto.randomUUID();
        const newItems = items.map(item => suggestion.itemIds.includes(item.id) ? { ...item, groupId } : item);
        commitState(newItems, connectors);
        setItems(newItems);
        setSuggestedGroups(prev => prev.filter(s => s.id !== suggestion.id));
        setSelectedItemIds(suggestion.itemIds);
    }, [items, connectors, commitState, setItems]);
    
    const handleGenerateOutline = useCallback(async (topic: string, outlineType: string) => {
        setIsGeneratingOutline(true);
        try {
            const aiClient = await getGeminiClient();
            const prompt = `"${topic}"에 대한 "${outlineType}" 형식의 상세한 마인드맵 아웃라인을 생성해줘. 최상위 주제 1개, 하위 주제 3~5개, 각 하위 주제당 2~3개의 세부 항목을 포함해줘.`;
            const response = await handleApiCall(aiClient.models.generateContent, {
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            children: {
                                type: Type.ARRAY, items: {
                                    type: Type.OBJECT, properties: {
                                        topic: { type: Type.STRING },
                                        children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { topic: { type: Type.STRING } } } }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            const outline = safeParseJsonResponse<any>(response.text);

            if (!outline || !outline.topic) {
                console.error("Failed to parse outline from AI response or outline is empty.");
                return;
            }
            
            let newItems: CanvasItem[] = [...items];
            let newConnectors: Connector[] = [...connectors];
            const center = screenToCanvas({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            
            const createItem = (text: string, x: number, y: number, isMain = false): TextItem => ({
                id: crypto.randomUUID(), type: 'text', content: `<p>${text}</p>`, x, y,
                width: isMain ? 200 : 180, height: 50, color: '#000000', fontSize: isMain ? 20 : 16,
                background: { type: 'solid', color: isMain ? '#e0e7ff' : '#ffffff' }, textAlign: 'center',
                zIndex: maxZIndex.current++, opacity: 1, borderRadius: 8,
            });

            const rootItem = createItem(outline.topic, center.x - 100, center.y - 25, true);
            newItems.push(rootItem);
            
            const children = Array.isArray(outline.children) ? outline.children : [];
            const angleStep = (2 * Math.PI) / (children.length || 1);
            children.forEach((child: any, i: number) => {
                const angle = i * angleStep - Math.PI / 2;
                const childItem = createItem(child.topic, rootItem.x + 300 * Math.cos(angle), rootItem.y + 200 * Math.sin(angle));
                newItems.push(childItem);
                newConnectors.push({ id: crypto.randomUUID(), fromId: rootItem.id, toId: childItem.id });
                
                const grandChildren = Array.isArray(child.children) ? child.children : [];
                grandChildren.forEach((grandchild: any, j: number) => {
                    const subAngle = angle + (j - ((grandChildren.length - 1) / 2)) * 0.3;
                    const grandchildItem = createItem(grandchild.topic, childItem.x + 250 * Math.cos(subAngle), childItem.y + 150 * Math.sin(subAngle));
                    newItems.push(grandchildItem);
                    newConnectors.push({ id: crypto.randomUUID(), fromId: childItem.id, toId: grandchildItem.id });
                });
            });

            commitState(newItems, newConnectors);
            setItems(newItems);
            setConnectors(newConnectors);
            setIsOutlineModalOpen(false);
        } catch (error) {
            console.error("Generate outline failed:", error);
        } finally {
            setIsGeneratingOutline(false);
        }
    }, [items, connectors, commitState, screenToCanvas, maxZIndex, setItems, setConnectors, getGeminiClient, handleApiCall]);
    
    const handleGenerateSocialPost = useCallback(async (topic: string, postType: string, platform: string) => {
        setIsGeneratingSocialPost(true);
        try {
            const aiClient = await getGeminiClient();
            const prompt = `"${topic}"에 대한 "${platform}" 플랫폼용 "${postType}" 유형의 소셜 미디어 게시물을 작성해줘. 이모지와 해시태그를 적절히 포함해줘.`;
            const response = await handleApiCall(aiClient.models.generateContent, { model: 'gemini-2.5-flash', contents: prompt });
            const postContent = textToHtml(response.text);
            const center = screenToCanvas({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            const newItem: TextItem = {
                id: crypto.randomUUID(), type: 'text', content: postContent,
                x: center.x, y: center.y, width: 300, height: 200, color: '#000000',
                fontSize: 16, background: { type: 'solid', color: '#ffffff' }, textAlign: 'left',
                zIndex: maxZIndex.current++, opacity: 1, borderRadius: 8,
            };
            const newItems = [...items, newItem];
            commitState(newItems, connectors);
            setItems(newItems);
            setIsSocialPostModalOpen(false);
        } catch (error) {
            console.error("Generate social post failed:", error);
        } finally {
            setIsGeneratingSocialPost(false);
        }
    }, [items, connectors, commitState, screenToCanvas, maxZIndex, setItems, getGeminiClient, handleApiCall]);

    const handleGenerateBrainstormIdeas = useCallback(async (focus: string): Promise<string[] | null> => {
        try {
            const aiClient = await getGeminiClient();
            const canvasContent = items.map(item => {
                if (item.type === 'text' || item.type === 'shape') return htmlToText(item.content);
                return `[${item.type}]`;
            }).join('\n');
            const prompt = `다음은 현재 캔버스에 있는 내용입니다:\n\`\`\`\n${canvasContent}\n\`\`\`\n\n이 내용을 바탕으로 새로운 아이디어를 5~7개 제안해주세요. ${focus ? `특히 "${focus}"에 초점을 맞춰` : ''} 각 아이디어를 별도의 JSON 문자열 배열로 반환하세요.`;
            const response = await handleApiCall(aiClient.models.generateContent, {
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            });
            const ideas = safeParseJsonResponse<string[]>(response.text);
            if (Array.isArray(ideas)) {
                return ideas;
            } else {
                console.error("AI response for brainstorm ideas was not an array:", ideas);
                return null;
            }
        } catch (error) {
            console.error("Generate brainstorm ideas failed:", error);
            return null;
        }
    }, [items, getGeminiClient, handleApiCall]);
    
    const handleAddIdeaToCanvas = useCallback((ideaText: string) => {
        const center = screenToCanvas({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const newItem: TextItem = {
            id: crypto.randomUUID(), type: 'text', content: `<p>${ideaText}</p>`,
            x: center.x + Math.random() * 50 - 25, y: center.y + Math.random() * 50 - 25,
            width: 200, height: 80, color: '#000000',
            fontSize: 16, background: { type: 'solid', color: '#f0f9ff' }, textAlign: 'center',
            zIndex: maxZIndex.current++, opacity: 1, borderRadius: 8,
        };
        const newItems = [...items, newItem];
        commitState(newItems, connectors);
        setItems(newItems);
    }, [items, connectors, commitState, screenToCanvas, maxZIndex, setItems]);

    const handleExportWithAi = useCallback(async (format: string) => {
        setIsExportingWithAi(true);
        try {
            const aiClient = await getGeminiClient();
            const canvasContent = items.map(item => {
                let desc = `ID: ${item.id}, 유형: ${item.type}, 위치: (${Math.round(item.x)}, ${Math.round(item.y)})`;
                if (item.type === 'text' || item.type === 'shape') desc += `, 내용: "${htmlToText(item.content)}"`;
                return desc;
            }).join('\n');
            const prompt = `다음 캔버스 내용을 기반으로 "${format}" 형식의 문서를 작성해줘. 각 항목의 내용과 관계를 고려하여 논리적으로 구성하고, 풍부한 마크다운을 사용하여 가독성을 높여줘.\n\n캔버스 내용:\n\`\`\`\n${canvasContent}\n\`\`\`\n\n`;
            const response = await handleApiCall(aiClient.models.generateContent, { model: 'gemini-2.5-pro', contents: prompt });
            const docContent = response.text;
            
            const blob = new Blob([docContent], { type: 'text/markdown' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `exported-${format.toLowerCase().replace(/\s/g, '-')}.md`;
            link.click();
            URL.revokeObjectURL(link.href);

            setIsAiExportModalOpen(false);
        } catch (error) {
            console.error("AI export failed:", error);
        } finally {
            setIsExportingWithAi(false);
        }
    }, [items, getGeminiClient, handleApiCall]);

    const executeImageGeneration = useCallback(async (prompt: string, aspectRatio?: AspectRatio) => {
        setIsGeneratingImage(true);
        setChatMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `"${prompt}" 이미지를 생성 중입니다...` }]);
        
        try {
            const aiClient = await getGeminiClient();
            
            const validAspectRatios: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];
            const finalAspectRatio = aspectRatio && validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

            const imageGenerationResponse = await handleApiCall(aiClient.models.generateImages, {
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: finalAspectRatio,
                },
            });
    
            const base64ImageBytes: string | undefined = imageGenerationResponse?.generatedImages?.[0]?.image?.imageBytes;
            
            if (!base64ImageBytes) {
                throw new Error("생성된 이미지를 API 응답에서 찾을 수 없습니다.");
            }

            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            
            const center = screenToCanvas({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

            const baseSize = 512;
            let width = baseSize;
            let height = baseSize;

            if (finalAspectRatio === '3:4') {
                width = baseSize * 0.75;
                height = baseSize;
            } else if (finalAspectRatio === '4:3') {
                width = baseSize;
                height = baseSize * 0.75;
            } else if (finalAspectRatio === '9:16') {
                width = baseSize * (9 / 16);
                height = baseSize;
            } else if (finalAspectRatio === '16:9') {
                width = baseSize;
                height = baseSize * (9 / 16);
            }

            const newImage: ImageItem = {
                id: crypto.randomUUID(),
                type: 'image',
                src: imageUrl,
                x: center.x - width / 2,
                y: center.y - height / 2,
                width: width,
                height: height,
                zIndex: maxZIndex.current++,
                opacity: 1,
                borderRadius: 4,
            };
            const newItems = [...items, newImage];
            commitState(newItems, connectors);
            setItems(newItems);
    
            const successMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: `"${prompt}" 이미지를 캔버스에 추가했습니다!` };
            setChatMessages(prev => [...prev, successMessage]);
            
        } catch (imgError: any) {
            console.error("Image generation failed:", imgError);
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: `이미지 생성에 실패했습니다: ${imgError.message || String(imgError)}` };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGeneratingImage(false);
        }
    }, [getGeminiClient, handleApiCall, screenToCanvas, maxZIndex, items, connectors, commitState, setItems, setChatMessages, setIsGeneratingImage]);

    const handleSendChatMessage = useCallback(async (message: string) => {
        setIsSendingChatMessage(true);
        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message };
        setChatMessages(prev => [...prev, userMessage]);

        try {
            const aiClient = await getGeminiClient();

            let context = '';
            if (selectedItemIds.length > 0) {
                const selectedItemsDescription = items.filter(item => selectedItemIds.includes(item.id)).map(item => {
                    let desc = `ID: ${item.id}, 유형: ${item.type}`;
                    if (item.type === 'text' || item.type === 'shape') desc += `, 내용: "${htmlToText(item.content)}"`;
                    return desc;
                }).join('\n');
                context += `현재 캔버스에서 다음 항목들이 선택되었습니다:\n${selectedItemsDescription}\n\n`;
            } else {
                const allItemsDescription = items.map(item => {
                    let desc = `ID: ${item.id}, 유형: ${item.type}`;
                    if (item.type === 'text' || item.type === 'shape') desc += `, 내용: "${htmlToText(item.content)}"`;
                    return desc;
                }).join('\n');
                if (allItemsDescription) {
                    context += `현재 캔버스에는 다음 항목들이 있습니다:\n${allItemsDescription}\n\n`;
                }
            }

            const fullPrompt = `${context}사용자의 요청: ${message}`;
            
            const historyForChat = chatMessages.slice(-5).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            }));
            
            const response = await handleApiCall(aiClient.models.generateContent, {
                model: 'gemini-2.5-pro',
                contents: [...historyForChat, { role: 'user', parts: [{ text: fullPrompt }] }],
                config: {
                    tools: [{functionDeclarations: [generateImageFunctionDeclaration]}],
                },
            });
            
            if (response.functionCalls && response.functionCalls.length > 0) {
                for (const fc of response.functionCalls) {
                    if (fc.name === 'generateImage') {
                        const { prompt, aspectRatio } = fc.args;
                        if (typeof prompt === 'string' && prompt) {
                            await executeImageGeneration(prompt, aspectRatio as AspectRatio | undefined);
                        }
                    }
                }
            } else {
                const aiResponseText = response.text;
                const aiMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseText };
                setChatMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            console.error("Chat message failed:", error);
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: `죄송합니다, 메시지를 처리하는 데 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}` };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSendingChatMessage(false);
        }
    }, [getGeminiClient, handleApiCall, chatMessages, selectedItemIds, items, executeImageGeneration, setChatMessages, setIsSendingChatMessage]);

    const handleGenerateKeywordAnalysis = useCallback(async (mainKeyword: string) => {
        setIsGeneratingKeywordAnalysis(true);
        setKeywordAnalysisLastGeneratedInput(mainKeyword);
        setKeywordAnalysisResults(null);
        try {
            const aiClient = await getGeminiClient();
            const prompt = `"${mainKeyword}"에 대한 심층 키워드 분석을 수행하여 관련 하위 키워드와 각 키워드에 대한 콘텐츠 아이디어를 제공해주세요. 각 하위 키워드에는 인기/관련성에 대한 질적 설명 (예: "매우 인기 있음", "틈새 시장")을 포함하세요. JSON 형식으로 응답해주세요.`;
            const response = await handleApiCall(aiClient.models.generateContent, {
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            mainKeyword: { type: Type.STRING },
                            subKeywords: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        keyword: { type: Type.STRING },
                                        relevance: { type: Type.STRING },
                                        contentIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    },
                                    required: ["keyword", "relevance", "contentIdeas"]
                                },
                            },
                        },
                        required: ["mainKeyword", "subKeywords"]
                    }
                }
            });
            const results = safeParseJsonResponse<KeywordAnalysisResult>(response.text);
            if (results) {
                setKeywordAnalysisResults(results);
                return results;
            } else {
                throw new Error("Failed to parse keyword analysis results.");
            }
        } catch (error) {
            console.error("Keyword analysis failed:", error);
            setKeywordAnalysisResults(null);
            alert(`키워드 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        } finally {
            setIsGeneratingKeywordAnalysis(false);
        }
    }, [getGeminiClient, handleApiCall]);

    const handleGenerateGroupDraft = useCallback(async (selectedItemIds: string[], setSelectedItemIds: (ids: string[]) => void, setEditingItemId: (id: string | null) => void) => {
        if (selectedItemIds.length === 0) return;

        setIsGeneratingGroupDraft(true);
        setIsGeneratingAIContentFor(selectedItemIds[0]);
        try {
            const aiClient = await getGeminiClient();
            const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
            const itemsDescription = selectedItems.map(item => {
                let desc = `ID: ${item.id}, 유형: ${item.type}`;
                if (item.type === 'text' || item.type === 'shape') desc += `, 내용: "${htmlToText(item.content)}"`;
                return desc;
            }).join('\n');
            
            const prompt = `다음은 그룹화된 캔버스 항목들입니다:\n${itemsDescription}\n\n이 그룹의 핵심 아이디어를 30단어 이내로 요약하는 간결한 초안 텍스트를 생성해주세요.`;
            const response = await handleApiCall(aiClient.models.generateContent, { model: 'gemini-2.5-flash', contents: prompt });
            const draftText = textToHtml(response.text);

            const firstItem = selectedItems[0];
            const newDraftItem: TextItem = {
                id: crypto.randomUUID(), type: 'text', content: draftText,
                x: firstItem.x, y: firstItem.y - 80,
                width: 250, height: 60, color: '#000000', fontSize: 16,
                background: { type: 'solid', color: '#fffbe0' }, textAlign: 'center',
                zIndex: maxZIndex.current++, opacity: 1, borderRadius: 8,
            };

            const newItems = [...items, newDraftItem];
            commitState(newItems, connectors);
            setItems(newItems);
            setSelectedItemIds([newDraftItem.id]);
            setEditingItemId(newDraftItem.id);
        } catch (error) {
            console.error("Generate group draft failed:", error);
            alert(`그룹 초안 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsGeneratingGroupDraft(false);
            setIsGeneratingAIContentFor(null);
        }
    }, [items, connectors, commitState, maxZIndex, setItems, getGeminiClient, handleApiCall]);
    
    return {
        isExporting,
        isGeneratingImage,
        generationError,
        isAiHelpModalVisible,
        isOutlineModalOpen,
        isSocialPostModalOpen,
        isBrainstormModalOpen,
        isAiExportModalOpen,
        isKeywordAnalysisModalOpen,
        isExportingWithAi,
        isGeneratingOutline,
        isGeneratingSocialPost,
        isGeneratingKeywordAnalysis,
        suggestedGroups,
        isSuggestingGroups,
        isGeneratingAIContentFor,
        isCheckingApiKey,
        isChatAssistantOpen,
        chatMessages,
        isSendingChatMessage,
        keywordAnalysisCurrentInput,
        keywordAnalysisLastGeneratedInput,
        keywordAnalysisResults,
        isGeneratingGroupDraft,
        apiKeyError,
        
        setIsAiHelpModalVisible,
        setIsOutlineModalOpen,
        setIsSocialPostModalOpen,
        setIsBrainstormModalOpen,
        setIsAiExportModalOpen,
        setIsKeywordAnalysisModalOpen,
        setIsChatAssistantOpen,
        setSuggestedGroups,
        setKeywordAnalysisCurrentInput,
        setApiKeyError,

        handleExportPng,
        handleGenerateTextDraft,
        handleCommitTextAndGenerateDraft,
        handleAiTextEdit,
        handleUpdateTextDraftWithConnections,
        handleSuggestGroups,
        handleAcceptSuggestion,
        handleGenerateOutline,
        handleGenerateSocialPost,
        handleGenerateBrainstormIdeas,
        handleGenerateKeywordAnalysis,
        handleAddIdeaToCanvas,
        handleExportWithAi,
        handleSendChatMessage,
        handleGenerateGroupDraft,
    };
};