import React, { useState, useCallback } from "react";
import { marked } from "marked";
import type {
  CanvasItem,
  Connector,
  Point,
  ImageItem,
  KeywordAnalysisResult,
  ChatMessage,
  TextItem,
  ShapeItem,
  HandlePosition,
  SolidBackground,
  ShapeType,
  BorderStyle,
  CanvasStateAndActions,
} from "../types";
import {
  GoogleGenAI,
  Modality,
  Type,
  FunctionDeclaration,
  GenerateImagesParameters,
} from "@google/genai";
import type { AIStudio } from "../types";

declare const htmlToImage: any;

function htmlToText(html: string | undefined): string {
  if (!html) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
}

function textToHtml(text: string): string {
  // Configure marked to handle common markdown features
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  });

  try {
    // Convert markdown to HTML
    let html = marked.parse(text) as string;

    // Clean up the HTML for better Tiptap compatibility
    html = html
      // Ensure proper spacing between headings and content
      .replace(/<\/h1>\s*<p>/g, "</h1>\n\n<p>")
      .replace(/<\/h2>\s*<p>/g, "</h2>\n\n<p>")
      .replace(/<\/h3>\s*<p>/g, "</h3>\n\n<p>")
      .replace(/<\/h4>\s*<p>/g, "</h4>\n\n<p>")
      .replace(/<\/h5>\s*<p>/g, "</h5>\n\n<p>")
      .replace(/<\/h6>\s*<p>/g, "</h6>\n\n<p>")
      // Ensure proper spacing between paragraphs
      .replace(/<\/p>\s*<p>/g, "</p>\n<p>")
      // Ensure proper spacing between lists and paragraphs
      .replace(/<\/ul>\s*<p>/g, "</ul>\n<p>")
      .replace(/<\/ol>\s*<p>/g, "</ol>\n<p>")
      .replace(/<\/p>\s*<ul>/g, "</p>\n<ul>")
      .replace(/<\/p>\s*<ol>/g, "</p>\n<ol>")
      // Ensure blockquotes have proper paragraph structure
      .replace(/<blockquote>\s*(?!<p>)/g, "<blockquote><p>")
      .replace(/(?<!<\/p>)\s*<\/blockquote>/g, "</p></blockquote>")
      // Preserve line breaks between tags
      .trim();

    // Wrap plain text in paragraphs if needed
    if (!html.startsWith("<")) {
      html = `<p>${html}</p>`;
    }

    return html;
  } catch (error) {
    console.error("Markdown parsing failed:", error);
    // Fallback: Convert plain text to HTML with proper paragraph structure
    const paragraphs = text.split(/\n\n+/);
    return paragraphs
      .map((para) => {
        const lines = para.split("\n").filter((line) => line.trim());
        if (lines.length === 0) return "";
        if (lines.length === 1) return `<p>${lines[0]}</p>`;
        return `<p>${lines.join("<br>")}</p>`;
      })
      .filter((p) => p)
      .join("\n");
  }
}

function safeParseJsonResponse<T>(jsonString: string): T | null {
  try {
    const trimmedString = jsonString.trim();
    const jsonMatch =
      trimmedString.match(/^```json\s*([\s\S]*?)\s*```$/) ||
      trimmedString.match(/^```\s*([\s\S]*?)\s*```$/);
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
  name: "generateImage",
  description:
    '사용자가 이미지 생성을 요청할 때 사용하는 함수입니다. 예를 들어, "고양이 그림 그려줘", "16:9 비율의 로고 이미지 만들어줘", "3장 만들어줘", "각 문단의 이미지 생성해줘" 등. 여러 장을 요청하면 각 이미지마다 이 함수를 여러 번 호출하세요.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: "생성할 이미지에 대한 상세한 텍스트 설명입니다.",
      },
      aspectRatio: {
        type: Type.STRING,
        description:
          '생성할 이미지의 가로 세로 비율입니다. 지원되는 값은 "1:1", "3:4", "4:3", "9:16", "16:9" 입니다. 지정하지 않으면 "1:1"이 기본값입니다.',
        enum: ["1:1", "3:4", "4:3", "9:16", "16:9"],
      },
    },
    required: ["prompt"],
  },
};

export const useAIFeatures = (
  {
    items,
    connectors,
    scale,
    viewOffset,
    maxZIndex,
    setItems,
    setConnectors,
    commitState,
    groupMetadata,
  }: CanvasStateAndActions & {
    groupMetadata?: Map<string, { color: string; label: string }>;
  },
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
  const [isKeywordAnalysisModalOpen, setIsKeywordAnalysisModalOpen] =
    useState(false);
  const [isExportingWithAi, setIsExportingWithAi] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingSocialPost, setIsGeneratingSocialPost] = useState(false);
  const [isGeneratingKeywordAnalysis, setIsGeneratingKeywordAnalysis] =
    useState(false);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [isSuggestingGroups, setIsSuggestingGroups] = useState(false);
  const [isGeneratingAIContentFor, setIsGeneratingAIContentFor] = useState<
    string | null
  >(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(false);
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "안녕하세요! 무엇을 도와드릴까요? 저와 대화하며 캔버스 작업을 자동화할 수 있습니다.",
    },
  ]);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [keywordAnalysisCurrentInput, setKeywordAnalysisCurrentInput] =
    useState("");
  const [
    keywordAnalysisLastGeneratedInput,
    setKeywordAnalysisLastGeneratedInput,
  ] = useState<string | null>(null);
  const [keywordAnalysisResults, setKeywordAnalysisResults] =
    useState<KeywordAnalysisResult | null>(null);
  const [isGeneratingGroupDraft, setIsGeneratingGroupDraft] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const screenToCanvas = useCallback(
    (pos: Point): Point => ({
      x: (pos.x - viewOffset.x) / scale,
      y: (pos.y - viewOffset.y) / scale,
    }),
    [viewOffset, scale]
  );

  const getGeminiClient = useCallback(async () => {
    setIsCheckingApiKey(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 입력하세요."
        );
      }
      return new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error("API Key selection failed:", error);
      setApiKeyError(
        "API 키를 선택하는 데 실패했습니다. .env.local 파일을 확인하세요."
      );
      throw new Error("API Key not selected or invalid.");
    } finally {
      setIsCheckingApiKey(false);
    }
  }, []);

  const handleApiCall = useCallback(
    async <T extends (...args: any[]) => Promise<any>>(
      apiCall: T,
      ...args: Parameters<T>
    ): Promise<Awaited<ReturnType<T>>> => {
      try {
        return await apiCall(...args);
      } catch (error: any) {
        if (error.message) {
          if (error.message.includes("Requested entity was not found.")) {
            setApiKeyError(
              "API 키가 유효하지 않거나 찾을 수 없습니다. 새로운 API 키를 선택해주세요."
            );
          } else if (error.message.includes("billed users")) {
            setApiKeyError(
              "Imagen API는 현재 결제가 설정된 사용자만 이용할 수 있습니다. API 키의 결제 설정을 확인해주세요."
            );
          }
        }
        throw error;
      }
    },
    [setApiKeyError]
  );

  const handleExportPng = useCallback(
    (exportRef: React.RefObject<HTMLDivElement>) => {
      if (!exportRef.current) return;
      setIsExporting(true);
      setTimeout(() => {
        htmlToImage
          .toPng(exportRef.current, {
            pixelRatio: 2,
            style: { transform: "scale(1)", transformOrigin: "0 0" },
          })
          .then((dataUrl: string) => {
            const link = document.createElement("a");
            link.download = "canvas-export.png";
            link.href = dataUrl;
            link.click();
          })
          .catch((err: Error) =>
            console.error("oops, something went wrong!", err)
          )
          .finally(() => setIsExporting(false));
      }, 100);
    },
    []
  );

  const handleGenerateTextDraft = useCallback(
    async (
      itemId: string,
      promptHtml: string,
      setEditingItemId: (id: string | null) => void
    ) => {
      setIsGeneratingAIContentFor(itemId);
      try {
        const aiClient = await getGeminiClient();
        const promptText = htmlToText(promptHtml);
        const prompt = `"${promptText}"라는 주제 또는 키워드를 바탕으로 약 3~4문단 길이의 상세한 초안을 작성해주세요. 

응답 형식 규칙 (반드시 준수):
1. 제목: 맨 위에 # 제목 형식으로 작성
2. 소제목: ## 또는 ### 사용하여 섹션 구분
3. 각 문단 사이에는 반드시 빈 줄 삽입
4. 강조할 내용은 **굵게** 표시
5. 리스트가 필요하면 - 또는 1. 형식 사용
6. 최소 3개 이상의 문단으로 구성

예시:
# 제목

첫 번째 문단입니다. 여기에 상세한 내용을 자연스럽게 작성합니다.

## 소제목

두 번째 문단입니다. 논리적인 흐름을 유지하며 작성합니다.

- 항목 1
- 항목 2`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        const newContent = textToHtml(response.text);

        const newItems = items.map((item) => {
          if (
            item.id === itemId &&
            (item.type === "text" || item.type === "shape")
          ) {
            const tempDiv = document.createElement("div");
            tempDiv.style.width = `${item.width - 16}px`;
            tempDiv.style.fontSize = `${item.fontSize}px`;
            tempDiv.style.lineHeight = "1.4";
            tempDiv.innerHTML = newContent;
            document.body.appendChild(tempDiv);
            const newHeight = tempDiv.scrollHeight + 16;
            document.body.removeChild(tempDiv);

            return {
              ...item,
              content: newContent,
              height: Math.max(item.height, newHeight),
            };
          }
          return item;
        });
        commitState(newItems as CanvasItem[], connectors);
        setItems(newItems as CanvasItem[]);
      } catch (error) {
        console.error("Generate text draft failed:", error);
        alert(
          `초안 생성 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsGeneratingAIContentFor(null);
      }
    },
    [items, connectors, commitState, setItems, getGeminiClient, handleApiCall]
  );

  const handleCommitTextAndGenerateDraft = useCallback(
    (
      itemId: string,
      content: string,
      setEditingItemId: (id: string | null) => void
    ) => {
      const newItems = items.map((item) => {
        if (
          item.id === itemId &&
          (item.type === "text" || item.type === "shape")
        ) {
          return { ...item, content };
        }
        return item;
      }) as CanvasItem[];

      setItems(newItems);
      handleGenerateTextDraft(itemId, content, setEditingItemId);
      setEditingItemId(null);
    },
    [items, handleGenerateTextDraft, setItems]
  );

  const handleAiTextEdit = useCallback(
    async (
      itemId: string,
      action:
        | "summarize"
        | "expand"
        | "refine"
        | "change_tone"
        | "add_keyword"
        | "search_info",
      additionalInput?: string
    ) => {
      const item = items.find((i) => i.id === itemId);
      if (!item || (item.type !== "text" && item.type !== "shape")) return;

      setIsGeneratingAIContentFor(itemId);

      try {
        const aiClient = await getGeminiClient();
        const fullText = htmlToText(item.content);

        let prompt = `[작업 지시]\n다음 텍스트에 대해 작업을 수행해주세요:\n\`\`\`\n${fullText}\n\`\`\`\n\n작업: `;

        switch (action) {
          case "summarize":
            prompt += `요약하기`;
            break;
          case "expand":
            prompt += `내용 확장하기`;
            break;
          case "refine":
            prompt += `문장 다듬기 (문법, 명확성, 흐름 개선)`;
            break;
          case "change_tone":
            prompt += `"${additionalInput}" 문체로 변경하기`;
            break;
          case "add_keyword":
            prompt += `"${additionalInput}" 키워드에 대한 문단을 자연스럽게 추가하기`;
            break;
          case "search_info":
            prompt += `"${additionalInput}"에 대한 최신 정보를 웹에서 검색하여, 그 결과를 텍스트에 자연스럽게 통합하기. 출처는 마크다운 링크 형식으로 포함해주세요.`;
            break;
        }

        prompt += `\n\n[응답 형식]\n수정된 **전체 텍스트**만을 마크다운 형식으로 반환해주세요. 
- 제목: #, ##, ###
- 강조: **굵게**
- 리스트: - 또는 1.
- 각 문단 사이에 빈 줄 삽입
- 자연스럽고 논리적인 문장으로 작성
다른 설명이나 인사말은 포함하지 마세요.`;

        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            ...(action === "search_info" && { tools: [{ googleSearch: {} }] }),
          },
        });
        const newContent = textToHtml(response.text);

        const newItems = items.map((i) => {
          if (i.id === itemId) {
            const tempDiv = document.createElement("div");
            tempDiv.style.width = `${i.width - 16}px`;
            tempDiv.style.fontSize = `${
              (i as TextItem | ShapeItem).fontSize
            }px`;
            tempDiv.style.lineHeight = "1.4";
            tempDiv.innerHTML = newContent;
            document.body.appendChild(tempDiv);
            const newHeight = tempDiv.scrollHeight + 16;
            document.body.removeChild(tempDiv);
            return {
              ...i,
              content: newContent,
              height: Math.max(i.height, newHeight),
            };
          }
          return i;
        });
        commitState(newItems as CanvasItem[], connectors);
        setItems(newItems as CanvasItem[]);
      } catch (error) {
        console.error("AI text edit failed:", error);
        alert(
          `AI 텍스트 편집 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsGeneratingAIContentFor(null);
      }
    },
    [items, connectors, commitState, setItems, getGeminiClient, handleApiCall]
  );

  const handleUpdateTextDraftWithConnections = useCallback(
    async (itemId: string, mainDraftHtml: string) => {
      const mainItem = items.find((i) => i.id === itemId);
      if (!mainItem || (mainItem.type !== "text" && mainItem.type !== "shape"))
        return;

      setIsGeneratingAIContentFor(itemId);
      try {
        const aiClient = await getGeminiClient();
        const connectedItemsInfo: string[] = [];
        const imageParts: any[] = [];

        // 스마트 탐색 설정
        const MAX_TEXT_DEPTH = 2; // 텍스트는 2단계까지
        const MAX_IMAGE_DEPTH = 5; // 이미지는 깊게 탐색
        const MAX_TOTAL_ITEMS = 20; // 안전 장치
        const visited = new Set<string>([itemId]); // 초안 자신 제외

        // 디버깅: 초안과 연결된 모든 커넥터 출력
        const relatedConnectors = connectors.filter(
          (c) => c.fromId === itemId || c.toId === itemId
        );
        console.log(
          `\n🔍 초안 ${itemId.substring(0, 8)}의 직접 연결: ${
            relatedConnectors.length
          }개`
        );
        relatedConnectors.forEach((c) => {
          const targetId = c.fromId === itemId ? c.toId : c.fromId;
          const targetItem = items.find((i) => i.id === targetId);
          console.log(
            `  → ${targetId.substring(0, 8)}: ${targetItem?.type}${
              targetItem?.groupId
                ? ` (그룹: ${targetItem.groupId.substring(0, 8)})`
                : ""
            }`
          );
        });

        // 디버깅: 모든 그룹 정보 출력
        const allGroups = new Map<string, number>();
        items.forEach((item) => {
          if (item.groupId) {
            allGroups.set(item.groupId, (allGroups.get(item.groupId) || 0) + 1);
          }
        });
        if (allGroups.size > 0) {
          console.log(`\n📦 전체 그룹 현황: ${allGroups.size}개 그룹`);
          allGroups.forEach((count, groupId) => {
            const groupItems = items.filter((i) => i.groupId === groupId);
            const imageCount = groupItems.filter(
              (i) => i.type === "image"
            ).length;
            console.log(
              `  - ${groupId}: ${count}개 항목 (이미지 ${imageCount}개)`
            );
          });
        }
        console.log("");

        // 메인 초안의 이미지 먼저 추출 (연결 탐색 전)
        console.log(`📝 메인 초안 ${itemId.substring(0, 8)} 분석 중...`);
        console.log(`  HTML 길이: ${mainItem.content.length} 문자`);
        console.log(
          `  HTML 샘플 (처음 500자):\n${mainItem.content.substring(0, 500)}`
        );

        // HTML에서 img 태그 찾기
        const imgTags = mainItem.content.match(/<img[^>]*>/g);
        if (imgTags) {
          console.log(`  <img> 태그 발견: ${imgTags.length}개`);
          imgTags.forEach((tag, idx) => {
            console.log(`  [${idx + 1}] ${tag.substring(0, 100)}...`);
          });
        } else {
          console.log(`  <img> 태그 없음`);
        }
        const mainImgRegex =
          /<img[^>]+src="(data:image\/([^;]+);base64,([^"]+))"/g;
        let mainMatch;
        let mainEmbeddedImageCount = 0;
        let mainFilteredCount = 0;

        while ((mainMatch = mainImgRegex.exec(mainItem.content)) !== null) {
          const format = mainMatch[2];
          const data = mainMatch[3];
          const supported = ["jpeg", "jpg", "png", "webp", "gif"];

          if (supported.includes(format.toLowerCase())) {
            imageParts.push({
              inlineData: { mimeType: `image/${format}`, data },
            });
            mainEmbeddedImageCount++;
          } else {
            console.log(`  - 미지원 형식 필터링: ${format}`);
            mainFilteredCount++;
          }
        }

        if (mainEmbeddedImageCount > 0) {
          console.log(`✓ 메인 초안 내 이미지 ${mainEmbeddedImageCount}개 추출`);
        } else if (mainFilteredCount > 0) {
          console.log(
            `  (이미지 ${mainFilteredCount}개 있으나 모두 미지원 형식)`
          );
        } else {
          console.log(
            `  (이미지 ${
              imgTags ? imgTags.length : 0
            }개 있으나 base64 형식이 아니거나 정규식 불일치)`
          );
        }
        console.log("");

        // 재귀 탐색 함수
        const exploreConnections = (currentId: string, depth: number) => {
          if (visited.size >= MAX_TOTAL_ITEMS) return;

          connectors.forEach((conn) => {
            let nextId: string | null = null;
            let isGroupConnection = false;

            if (conn.fromId === currentId) {
              nextId = conn.toId;
            } else if (conn.toId === currentId) {
              nextId = conn.fromId;
            }

            if (!nextId) return;

            // nextId가 실제 항목인지 확인
            let item = items.find((i) => i.id === nextId);

            // 항목이 없으면 그룹 ID일 수 있음
            if (!item) {
              console.log(`  🔍 ${nextId} 항목 없음 - 그룹 ID 확인 중...`);

              // "group-" 접두사 제거
              const groupIdToCheck = nextId.startsWith("group-")
                ? nextId.substring(6)
                : nextId;

              // 그룹에 속한 항목들 찾기
              const groupItems = items.filter(
                (i) => i.groupId === groupIdToCheck
              );
              console.log(
                `  🔍 그룹 ${groupIdToCheck}에 속한 항목: ${groupItems.length}개`
              );

              if (groupItems.length > 0) {
                isGroupConnection = true;
                console.log(
                  `[${depth}단계 그룹] ${currentId.substring(
                    0,
                    8
                  )} → ${groupIdToCheck.substring(0, 8)} (그룹, ${
                    groupItems.length
                  }개 항목)`
                );

                // 그룹의 모든 이미지 수집
                const groupImages = groupItems.filter(
                  (i) => i.type === "image"
                ) as ImageItem[];
                console.log(`  🔍 그룹 내 이미지: ${groupImages.length}개`);

                if (groupImages.length > 0) {
                  console.log(
                    `  └─ 그룹 이미지 ${groupImages.length}개 수집 중...`
                  );

                  let addedCount = 0;
                  groupImages.forEach((gImg, idx) => {
                    if (!gImg.src) {
                      console.log(
                        `     [${idx + 1}] ${gImg.id.substring(
                          0,
                          8
                        )} - src 없음`
                      );
                      return;
                    }
                    if (visited.has(gImg.id)) {
                      console.log(
                        `     [${idx + 1}] ${gImg.id.substring(
                          0,
                          8
                        )} - 이미 방문`
                      );
                      return;
                    }

                    visited.add(gImg.id);

                    const match = gImg.src.match(
                      /^data:image\/([^;]+);base64,(.+)$/
                    );
                    if (match) {
                      const format = match[1];
                      const data = match[2];
                      const supported = ["jpeg", "jpg", "png", "webp", "gif"];

                      if (supported.includes(format.toLowerCase())) {
                        imageParts.push({
                          inlineData: { mimeType: `image/${format}`, data },
                        });
                        addedCount++;
                        console.log(
                          `     [${idx + 1}] ${gImg.id.substring(
                            0,
                            8
                          )} - ${format} 추가 ✓`
                        );
                      } else {
                        console.log(
                          `     [${idx + 1}] ${gImg.id.substring(
                            0,
                            8
                          )} - 미지원 형식: ${format}`
                        );
                      }
                    } else {
                      console.log(
                        `     [${idx + 1}] ${gImg.id.substring(
                          0,
                          8
                        )} - base64 형식 아님`
                      );
                    }
                  });
                  console.log(`  └─ 최종 ${addedCount}개 이미지 추가됨`);
                }
              } else {
                console.log(`  ⚠️ ${nextId}는 항목도 그룹도 아님`);
              }
              return; // 그룹 처리 완료, 다음 커넥터로
            }

            if (visited.has(nextId)) return;

            visited.add(nextId);
            console.log(
              `[${depth}단계] ${currentId.substring(0, 8)} → ${nextId.substring(
                0,
                8
              )} (${item.type}${
                item.groupId ? `, 그룹ID: ${item.groupId.substring(0, 8)}` : ""
              })`
            );

            // 디버깅: 현재 항목이 그룹에 속해 있으면 그룹 정보 출력
            if (item.groupId) {
              const sameGroupItems = items.filter(
                (i) => i.groupId === item.groupId
              );
              const sameGroupImages = sameGroupItems.filter(
                (i) => i.type === "image"
              );
              console.log(
                `  ℹ️ 이 항목은 그룹에 속함 - 같은 그룹 항목: ${sameGroupItems.length}개 (이미지 ${sameGroupImages.length}개)`
              );
            }

            // 디버깅: 이 항목의 추가 연결 확인
            const itemConnections = connectors.filter(
              (c) =>
                (c.fromId === nextId || c.toId === nextId) &&
                c.fromId !== currentId &&
                c.toId !== currentId
            );
            if (itemConnections.length > 0) {
              console.log(
                `  └─ ${nextId.substring(0, 8)}의 추가 연결: ${
                  itemConnections.length
                }개`
              );
              itemConnections.forEach((ic) => {
                const furtherId = ic.fromId === nextId ? ic.toId : ic.fromId;
                const furtherItem = items.find((i) => i.id === furtherId);
                console.log(
                  `     → ${furtherId.substring(0, 8)}: ${
                    furtherItem
                      ? `${furtherItem.type}${
                          furtherItem.groupId
                            ? ` (그룹: ${furtherItem.groupId.substring(0, 8)})`
                            : ""
                        }${visited.has(furtherId) ? " [이미 방문]" : ""}`
                      : "항목 없음"
                  }`
                );
              });
            }

            // 정보 수집 여부 결정 (깊이 제한)
            const shouldCollectInfo =
              ((item.type === "text" || item.type === "shape") &&
                depth <= MAX_TEXT_DEPTH) ||
              (item.type === "image" && depth <= MAX_IMAGE_DEPTH);

            if (shouldCollectInfo) {
              // 정보 수집
              const depthLabel = depth > 1 ? `${depth}단계 참조 - ` : "";
              let info = `[${depthLabel}ID: ${item.id}, 유형: ${item.type}`;

              // 텍스트 내용
              if (item.type === "text" || item.type === "shape") {
                info += `, 내용: "${htmlToText(item.content)}"`;

                // 텍스트 내 이미지 추출 (Tiptap ResizableImage)
                const imgRegex =
                  /<img[^>]+src="(data:image\/([^;]+);base64,([^"]+))"/g;
                let match;
                let embeddedImageCount = 0;

                while ((match = imgRegex.exec(item.content)) !== null) {
                  const fullSrc = match[1];
                  const format = match[2];
                  const data = match[3];
                  const supported = ["jpeg", "jpg", "png", "webp", "gif"];

                  if (supported.includes(format.toLowerCase())) {
                    imageParts.push({
                      inlineData: { mimeType: `image/${format}`, data },
                    });
                    embeddedImageCount++;
                  }
                }

                if (embeddedImageCount > 0) {
                  console.log(
                    `  ℹ️ 텍스트 내 삽입된 이미지 ${embeddedImageCount}개 추출`
                  );
                  info += `, 삽입 이미지: ${embeddedImageCount}개`;
                }
              }

              // 이미지 수집
              if (item.type === "image") {
                const imageItem = item as ImageItem;
                if (imageItem.src) {
                  const base64Match = imageItem.src.match(
                    /^data:image\/([^;]+);base64,(.+)$/
                  );
                  if (base64Match) {
                    const format = base64Match[1];
                    const data = base64Match[2];

                    const supported = ["jpeg", "jpg", "png", "webp", "gif"];
                    if (supported.includes(format.toLowerCase())) {
                      imageParts.push({
                        inlineData: { mimeType: `image/${format}`, data },
                      });
                      info += `, 이미지 추가`;
                    } else {
                      info += `, 미지원 형식: ${format}`;
                    }
                  }
                }
              }

              if (conn.label) info += `, 관계: "${conn.label}"`;
              info += "]";
              connectedItemsInfo.push(info);
            }

            // 그룹 이미지는 항상 수집 (깊이 무관, 정보 수집 여부와 무관)
            if (item.groupId) {
              const groupImages = items.filter(
                (i) => i.groupId === item.groupId && i.type === "image"
              ) as ImageItem[];

              if (groupImages.length > 0) {
                console.log(
                  `[${depth}단계 그룹] ${item.groupId.substring(0, 8)} - ${
                    groupImages.length
                  }개 이미지`
                );

                groupImages.forEach((gImg) => {
                  if (!gImg.src || visited.has(gImg.id)) return;
                  visited.add(gImg.id);

                  const match = gImg.src.match(
                    /^data:image\/([^;]+);base64,(.+)$/
                  );
                  if (match) {
                    const format = match[1];
                    const data = match[2];
                    const supported = ["jpeg", "jpg", "png", "webp", "gif"];

                    if (supported.includes(format.toLowerCase())) {
                      imageParts.push({
                        inlineData: { mimeType: `image/${format}`, data },
                      });
                    }
                  }
                });
              }
            }

            // 재귀 탐색 계속
            exploreConnections(nextId, depth + 1);
          });
        };

        // 탐색 시작
        exploreConnections(itemId, 1);

        console.log(`✓ 총 ${visited.size - 1}개 항목 수집`);
        console.log(`✓ 이미지 ${imageParts.length}개 수집`);

        const promptText = `다음은 메인 텍스트 초안입니다:\n\`\`\`\n${htmlToText(
          mainItem.content
        )}\n\`\`\`\n\n이 초안은 다음 항목들과 연결되어 있습니다:\n${connectedItemsInfo.join(
          "\n"
        )}\n\n**중요**: 각 연결선의 "관계" 라벨에 명시된 작업을 반드시 수행해주세요.
- "이미지 프롬프트 N개 생성"이라면 → N개의 구체적인 이미지 생성 프롬프트를 리스트로 추가
- "요약"이라면 → 연결된 내용을 요약하여 통합
- "확장"이라면 → 연결된 내용을 바탕으로 상세히 확장
- 이미지가 첨부되어 있다면 → 이미지 내용을 분석하여 관련 정보 추가
- 기타 요청사항이 있다면 그대로 수행

${
  imageParts.length > 0
    ? `\n첨부된 이미지 ${imageParts.length}개를 분석하여 관련 내용을 풍부하게 만들어주세요.\n`
    : ""
}
연결된 항목들의 정보와 관계 라벨의 지시사항을 모두 반영하여 메인 초안을 업데이트해주세요.

응답 형식:
- 마크다운 형식 사용 (제목: #, ##, 강조: **굵게**, 리스트: -, 1.)
- 각 문단 사이에 빈 줄 삽입
- 자연스럽고 논리적인 문장으로 작성
- 이미지 프롬프트는 명확하고 구체적으로 작성
수정된 전체 초안만을 응답으로 반환하세요.`;

        // 멀티모달 콘텐츠 구성: 텍스트 + 이미지
        const contents =
          imageParts.length > 0
            ? [{ text: promptText }, ...imageParts]
            : promptText;

        const response = await handleApiCall(aiClient.models.generateContent, {
          model:
            imageParts.length > 0 ? "gemini-2.5-flash" : "gemini-2.5-flash", // Flash 모델도 멀티모달 지원
          contents: contents,
        });

        console.log(
          `📄 Gemini 응답 원본 (처음 500자):\n${response.text.substring(
            0,
            500
          )}`
        );
        let updatedContent = textToHtml(response.text);
        console.log(
          `📝 변환된 HTML (처음 500자):\n${updatedContent.substring(0, 500)}`
        );

        // Gemini가 삽입한 이미지 파일명을 실제 base64 이미지로 교체
        const imageRefRegex =
          /<img[^>]+src=["']([^"']+\.(jpeg|jpg|png|webp|gif))["'][^>]*>/gi;
        const imageMatches = Array.from(updatedContent.matchAll(imageRefRegex));

        if (imageMatches.length > 0) {
          console.log(
            `🎨 ${imageMatches.length}개의 이미지 참조 발견 - 실제 이미지 생성 중...`
          );

          for (const match of imageMatches) {
            const fullImgTag = match[0];
            const filename = match[1];

            // alt 텍스트를 프롬프트로 사용
            const altMatch = fullImgTag.match(/alt=["']([^"']+)["']/i);
            const prompt = altMatch
              ? altMatch[1]
              : filename.replace(/\.(jpeg|jpg|png|webp|gif)$/i, "");

            try {
              console.log(`  🖼️ "${prompt}" 이미지 생성 중...`);

              const imageGenerationResponse = await handleApiCall(
                aiClient.models.generateImages,
                {
                  model: "imagen-4.0-generate-001",
                  prompt: prompt,
                  config: {
                    numberOfImages: 1,
                    outputMimeType: "image/jpeg",
                    aspectRatio: "1:1",
                  },
                }
              );

              const base64ImageBytes: string | undefined =
                imageGenerationResponse?.generatedImages?.[0]?.image
                  ?.imageBytes;

              if (base64ImageBytes) {
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                // 원본 img 태그를 base64 이미지로 교체
                updatedContent = updatedContent.replace(
                  fullImgTag,
                  `<img src="${imageUrl}" alt="${prompt}">`
                );
                console.log(`    ✓ "${prompt}" 이미지 생성 완료`);
              } else {
                console.log(
                  `    ✗ "${prompt}" 이미지 생성 실패 - base64 데이터 없음`
                );
              }
            } catch (imgError) {
              console.error(`    ✗ "${prompt}" 이미지 생성 실패:`, imgError);
            }
          }
        }

        const newItems = items.map((i) =>
          i.id === itemId ? { ...i, content: updatedContent } : i
        );
        commitState(newItems as CanvasItem[], connectors);
        setItems(newItems as CanvasItem[]);
      } catch (error) {
        console.error("Update text draft with connections failed:", error);
      } finally {
        setIsGeneratingAIContentFor(null);
      }
    },
    [items, connectors, commitState, setItems, getGeminiClient, handleApiCall]
  );

  const handleSuggestGroups = useCallback(
    async (selectedItemIds: string[]) => {
      if (selectedItemIds.length < 2) return;
      setIsSuggestingGroups(true);
      try {
        const aiClient = await getGeminiClient();
        const selectedItems = items.filter((item) =>
          selectedItemIds.includes(item.id)
        );
        const itemsDescription = selectedItems
          .map((item) => {
            let desc = `ID: ${item.id}, 유형: ${item.type}, 위치: (${Math.round(
              item.x
            )}, ${Math.round(item.y)})`;
            if (item.type === "text" || item.type === "shape")
              desc += `, 내용: "${htmlToText(item.content)}"`;
            return desc;
          })
          .join("\n");

        const prompt = `다음은 캔버스 위의 항목 목록입니다:\n${itemsDescription}\n\n의미적으로 관련이 있거나 논리적으로 함께 묶일 수 있는 항목들의 그룹을 제안해주세요. 각 그룹은 해당 그룹에 속하는 항목들의 ID 목록이어야 합니다.`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
          },
        });
        const suggestions = safeParseJsonResponse<Array<{ itemIds: string[] }>>(
          response.text
        );

        if (!suggestions) {
          console.error("Failed to parse group suggestions from AI response.");
          setSuggestedGroups([]);
          return;
        }

        const newSuggestions = suggestions
          .map((group: { itemIds: string[] }) => {
            const groupItems = items.filter((item) =>
              group.itemIds.includes(item.id)
            );
            if (groupItems.length === 0) return null;
            const bounds = groupItems.reduce(
              (acc, item) => ({
                minX: Math.min(acc.minX, item.x),
                minY: Math.min(acc.minY, item.y),
                maxX: Math.max(acc.maxX, item.x + item.width),
                maxY: Math.max(acc.maxY, item.y + item.height),
              }),
              {
                minX: Infinity,
                minY: Infinity,
                maxX: -Infinity,
                maxY: -Infinity,
              }
            );

            return {
              id: crypto.randomUUID(),
              itemIds: group.itemIds,
              bounds: {
                x: bounds.minX,
                y: bounds.minY,
                width: bounds.maxX - bounds.minX,
                height: bounds.maxY - bounds.minY,
              },
            };
          })
          .filter(Boolean);

        setSuggestedGroups(newSuggestions);
      } catch (error) {
        console.error("Suggest groups failed:", error);
      } finally {
        setIsSuggestingGroups(false);
      }
    },
    [items, getGeminiClient, handleApiCall]
  );

  const handleAcceptSuggestion = useCallback(
    (suggestion: any, setSelectedItemIds: (ids: string[]) => void) => {
      const groupId = crypto.randomUUID();
      const newItems = items.map((item) =>
        suggestion.itemIds.includes(item.id) ? { ...item, groupId } : item
      );
      commitState(newItems, connectors);
      setItems(newItems);
      setSuggestedGroups((prev) => prev.filter((s) => s.id !== suggestion.id));
      setSelectedItemIds(suggestion.itemIds);
    },
    [items, connectors, commitState, setItems]
  );

  const handleGenerateOutline = useCallback(
    async (topic: string, outlineType: string) => {
      setIsGeneratingOutline(true);
      try {
        const aiClient = await getGeminiClient();
        const prompt = `"${topic}"에 대한 "${outlineType}" 형식의 상세한 마인드맵 아웃라인을 생성해줘. 최상위 주제 1개, 하위 주제 3~5개, 각 하위 주제당 2~3개의 세부 항목을 포함해줘.`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      topic: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: { topic: { type: Type.STRING } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
        const outline = safeParseJsonResponse<any>(response.text);

        if (!outline || !outline.topic) {
          console.error(
            "Failed to parse outline from AI response or outline is empty."
          );
          return;
        }

        let newItems: CanvasItem[] = [...items];
        let newConnectors: Connector[] = [...connectors];
        const center = screenToCanvas({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });

        const createItem = (
          text: string,
          x: number,
          y: number,
          isMain = false
        ): TextItem => ({
          id: crypto.randomUUID(),
          type: "text",
          content: `<p>${text}</p>`,
          x,
          y,
          width: isMain ? 200 : 180,
          height: 50,
          color: "#000000",
          fontSize: isMain ? 20 : 16,
          background: { type: "solid", color: isMain ? "#e0e7ff" : "#ffffff" },
          textAlign: "center",
          zIndex: maxZIndex.current++,
          opacity: 1,
          borderRadius: 8,
        });

        const rootItem = createItem(
          outline.topic,
          center.x - 100,
          center.y - 25,
          true
        );
        newItems.push(rootItem);

        const children = Array.isArray(outline.children)
          ? outline.children
          : [];
        const angleStep = (2 * Math.PI) / (children.length || 1);
        children.forEach((child: any, i: number) => {
          const angle = i * angleStep - Math.PI / 2;
          const childItem = createItem(
            child.topic,
            rootItem.x + 300 * Math.cos(angle),
            rootItem.y + 200 * Math.sin(angle)
          );
          newItems.push(childItem);
          newConnectors.push({
            id: crypto.randomUUID(),
            fromId: rootItem.id,
            toId: childItem.id,
          });

          const grandChildren = Array.isArray(child.children)
            ? child.children
            : [];
          grandChildren.forEach((grandchild: any, j: number) => {
            const subAngle = angle + (j - (grandChildren.length - 1) / 2) * 0.3;
            const grandchildItem = createItem(
              grandchild.topic,
              childItem.x + 250 * Math.cos(subAngle),
              childItem.y + 150 * Math.sin(subAngle)
            );
            newItems.push(grandchildItem);
            newConnectors.push({
              id: crypto.randomUUID(),
              fromId: childItem.id,
              toId: grandchildItem.id,
            });
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
    },
    [
      items,
      connectors,
      commitState,
      screenToCanvas,
      maxZIndex,
      setItems,
      setConnectors,
      getGeminiClient,
      handleApiCall,
    ]
  );

  const handleGenerateSocialPost = useCallback(
    async (topic: string, postType: string, platform: string) => {
      setIsGeneratingSocialPost(true);
      try {
        const aiClient = await getGeminiClient();
        const prompt = `"${topic}"에 대한 "${platform}" 플랫폼용 "${postType}" 유형의 소셜 미디어 게시물을 작성해줘. 
        
작성 규칙:
- 이모지와 해시태그를 적절히 포함
- 마크다운 형식으로 강조나 리스트 사용
- 문단 사이에 빈 줄 삽입
- 자연스럽고 매력적인 문장으로 작성`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        const postContent = textToHtml(response.text);
        const center = screenToCanvas({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        const newItem: TextItem = {
          id: crypto.randomUUID(),
          type: "text",
          content: postContent,
          x: center.x,
          y: center.y,
          width: 300,
          height: 200,
          color: "#000000",
          fontSize: 16,
          background: { type: "solid", color: "#ffffff" },
          textAlign: "left",
          zIndex: maxZIndex.current++,
          opacity: 1,
          borderRadius: 8,
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
    },
    [
      items,
      connectors,
      commitState,
      screenToCanvas,
      maxZIndex,
      setItems,
      getGeminiClient,
      handleApiCall,
    ]
  );

  const handleGenerateBrainstormIdeas = useCallback(
    async (focus: string): Promise<string[] | null> => {
      try {
        const aiClient = await getGeminiClient();
        const canvasContent = items
          .map((item) => {
            if (item.type === "text" || item.type === "shape")
              return htmlToText(item.content);
            return `[${item.type}]`;
          })
          .join("\n");
        const prompt = `다음은 현재 캔버스에 있는 내용입니다:\n\`\`\`\n${canvasContent}\n\`\`\`\n\n이 내용을 바탕으로 새로운 아이디어를 5~7개 제안해주세요. ${
          focus ? `특히 "${focus}"에 초점을 맞춰` : ""
        } 각 아이디어를 별도의 JSON 문자열 배열로 반환하세요.`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        });
        const ideas = safeParseJsonResponse<string[]>(response.text);
        if (Array.isArray(ideas)) {
          return ideas;
        } else {
          console.error(
            "AI response for brainstorm ideas was not an array:",
            ideas
          );
          return null;
        }
      } catch (error) {
        console.error("Generate brainstorm ideas failed:", error);
        return null;
      }
    },
    [items, getGeminiClient, handleApiCall]
  );

  const handleAddIdeaToCanvas = useCallback(
    (ideaText: string) => {
      const center = screenToCanvas({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const newItem: TextItem = {
        id: crypto.randomUUID(),
        type: "text",
        content: `<p>${ideaText}</p>`,
        x: center.x + Math.random() * 50 - 25,
        y: center.y + Math.random() * 50 - 25,
        width: 200,
        height: 80,
        color: "#000000",
        fontSize: 16,
        background: { type: "solid", color: "#f0f9ff" },
        textAlign: "center",
        zIndex: maxZIndex.current++,
        opacity: 1,
        borderRadius: 8,
      };
      const newItems = [...items, newItem];
      commitState(newItems, connectors);
      setItems(newItems);
    },
    [items, connectors, commitState, screenToCanvas, maxZIndex, setItems]
  );

  const handleExportWithAi = useCallback(
    async (format: string) => {
      setIsExportingWithAi(true);
      try {
        const aiClient = await getGeminiClient();
        const canvasContent = items
          .map((item) => {
            let desc = `ID: ${item.id}, 유형: ${item.type}, 위치: (${Math.round(
              item.x
            )}, ${Math.round(item.y)})`;
            if (item.type === "text" || item.type === "shape")
              desc += `, 내용: "${htmlToText(item.content)}"`;
            return desc;
          })
          .join("\n");
        const prompt = `다음 캔버스 내용을 기반으로 "${format}" 형식의 문서를 작성해줘. 각 항목의 내용과 관계를 고려하여 논리적으로 구성하고, 풍부한 마크다운을 사용하여 가독성을 높여줘.\n\n캔버스 내용:\n\`\`\`\n${canvasContent}\n\`\`\`\n\n`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        const docContent = response.text;

        const blob = new Blob([docContent], { type: "text/markdown" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `exported-${format
          .toLowerCase()
          .replace(/\s/g, "-")}.md`;
        link.click();
        URL.revokeObjectURL(link.href);

        setIsAiExportModalOpen(false);
      } catch (error) {
        console.error("AI export failed:", error);
      } finally {
        setIsExportingWithAi(false);
      }
    },
    [items, getGeminiClient, handleApiCall]
  );

  const executeImageGeneration = useCallback(
    async (
      prompt: string,
      aspectRatio?: AspectRatio,
      skipMessage: boolean = false,
      offsetIndex: number = 0
    ) => {
      setIsGeneratingImage(true);

      if (!skipMessage) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `"${prompt}" 이미지를 생성 중입니다...`,
          },
        ]);
      }

      try {
        const aiClient = await getGeminiClient();

        const validAspectRatios: AspectRatio[] = [
          "1:1",
          "3:4",
          "4:3",
          "9:16",
          "16:9",
        ];
        const finalAspectRatio =
          aspectRatio && validAspectRatios.includes(aspectRatio)
            ? aspectRatio
            : "1:1";

        const imageGenerationResponse = await handleApiCall(
          aiClient.models.generateImages,
          {
            model: "imagen-4.0-generate-001",
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
              aspectRatio: finalAspectRatio,
            },
          }
        );

        const base64ImageBytes: string | undefined =
          imageGenerationResponse?.generatedImages?.[0]?.image?.imageBytes;

        if (!base64ImageBytes) {
          throw new Error("생성된 이미지를 API 응답에서 찾을 수 없습니다.");
        }

        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;

        const center = screenToCanvas({
          x: window.innerWidth / 2 + offsetIndex * 200,
          y: window.innerHeight / 2 + offsetIndex * 100,
        });

        const baseSize = 512;
        let width = baseSize;
        let height = baseSize;

        if (finalAspectRatio === "3:4") {
          width = baseSize * 0.75;
          height = baseSize;
        } else if (finalAspectRatio === "4:3") {
          width = baseSize;
          height = baseSize * 0.75;
        } else if (finalAspectRatio === "9:16") {
          width = baseSize * (9 / 16);
          height = baseSize;
        } else if (finalAspectRatio === "16:9") {
          width = baseSize;
          height = baseSize * (9 / 16);
        }

        const newImage: ImageItem = {
          id: crypto.randomUUID(),
          type: "image",
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

        if (!skipMessage) {
          const successMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `"${prompt}" 이미지를 캔버스에 추가했습니다!`,
          };
          setChatMessages((prev) => [...prev, successMessage]);
        }
      } catch (imgError: any) {
        console.error("Image generation failed:", imgError);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `이미지 생성에 실패했습니다: ${
            imgError.message || String(imgError)
          }`,
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsGeneratingImage(false);
      }
    },
    [
      getGeminiClient,
      handleApiCall,
      screenToCanvas,
      maxZIndex,
      items,
      connectors,
      commitState,
      setItems,
      setChatMessages,
      setIsGeneratingImage,
    ]
  );

  const handleSendChatMessage = useCallback(
    async (message: string) => {
      setIsSendingChatMessage(true);
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      };
      setChatMessages((prev) => [...prev, userMessage]);

      try {
        const aiClient = await getGeminiClient();

        // Extract keywords from user question for smart context selection
        const extractKeywords = (question: string): string[] => {
          const normalized = question.toLowerCase();
          const keywords: string[] = [];

          // Common keywords to look for
          const patterns = [
            /이미지/g,
            /사진/g,
            /그림/g,
            /텍스트/g,
            /글/g,
            /내용/g,
            /연결/g,
            /관계/g,
            /화살표/g,
            /그룹/g,
            /묶음/g,
            /도형/g,
            /박스/g,
            /원/g,
            /사각형/g,
          ];

          patterns.forEach((pattern) => {
            const matches = normalized.match(pattern);
            if (matches) {
              keywords.push(...matches);
            }
          });

          // Extract quoted strings as keywords
          const quoted = question.match(/"([^"]+)"|'([^']+)'/g);
          if (quoted) {
            keywords.push(
              ...quoted.map((q) => q.replace(/['"]/g, "").toLowerCase())
            );
          }

          return [...new Set(keywords)]; // Remove duplicates
        };

        // Calculate relevance score for smart item selection
        const calculateRelevance = (
          item: CanvasItem,
          keywords: string[],
          selectedIds: string[]
        ): number => {
          let score = 0;

          // Priority 1: Selected items (highest priority)
          if (selectedIds.includes(item.id)) {
            score += 1000;
          }

          // Priority 2: Keyword matching in content
          if (item.type === "text" || item.type === "shape") {
            const content = htmlToText(item.content).toLowerCase();
            keywords.forEach((keyword) => {
              if (content.includes(keyword)) {
                score += 50;
              }
            });
          }

          // Priority 3: Items with many connections (likely important)
          const connectionCount = connectors.filter(
            (c) => c.fromId === item.id || c.toId === item.id
          ).length;
          score += connectionCount * 20;

          // Priority 4: Items in groups (moderate importance)
          if (item.groupId) {
            score += 10;
          }

          // Priority 5: Type-based relevance
          if (
            keywords.some((kw) => kw.includes("이미지") || kw.includes("사진"))
          ) {
            if (item.type === "image") score += 30;
          }
          if (
            keywords.some((kw) => kw.includes("텍스트") || kw.includes("글"))
          ) {
            if (item.type === "text" || item.type === "shape") score += 30;
          }

          return score;
        };

        // Prepare parts for multimodal input (text + images)
        const userParts: any[] = [];
        let context = "";

        // Extract keywords for smart selection
        const keywords = extractKeywords(message);

        if (selectedItemIds.length > 0) {
          const selectedItems = items.filter((item) =>
            selectedItemIds.includes(item.id)
          );

          // Add text description of selected items (with content length limit)
          const MAX_CONTENT_LENGTH = 500; // Limit per item content
          const textDescription = selectedItems
            .map((item, index) => {
              let desc = `[항목 ${index + 1}] ID: ${item.id}, 유형: ${
                item.type
              }`;
              if (item.type === "text" || item.type === "shape") {
                const fullContent = htmlToText(item.content);
                const truncatedContent =
                  fullContent.length > MAX_CONTENT_LENGTH
                    ? fullContent.substring(0, MAX_CONTENT_LENGTH) +
                      "... (내용 생략)"
                    : fullContent;
                desc += `, 내용: "${truncatedContent}"`;
              } else if (item.type === "image")
                desc += ` (이미지가 아래에 첨부되었습니다)`;

              // Add group information
              if (item.groupId && groupMetadata) {
                const groupInfo = groupMetadata.get(item.groupId);
                const groupLabel =
                  groupInfo?.label || `그룹-${item.groupId.substring(0, 8)}`;
                desc += `, 그룹: "${groupLabel}"`;
              }

              return desc;
            })
            .join("\n");
          context += `현재 캔버스에서 다음 항목들이 선택되었습니다:\n${textDescription}\n\n`;

          // Add connections related to selected items
          const relatedConnections = connectors.filter(
            (conn) =>
              selectedItemIds.includes(conn.fromId) ||
              selectedItemIds.includes(conn.toId) ||
              conn.fromId.startsWith("group-") ||
              conn.toId.startsWith("group-")
          );

          if (relatedConnections.length > 0) {
            const connectionDescriptions = relatedConnections
              .map((conn) => {
                const fromItem = items.find((i) => i.id === conn.fromId);
                const toItem = items.find((i) => i.id === conn.toId);

                let fromDesc = conn.fromId;
                let toDesc = conn.toId;

                if (conn.fromId.startsWith("group-") && groupMetadata) {
                  const groupId = conn.fromId.replace("group-", "");
                  const groupInfo = groupMetadata.get(groupId);
                  fromDesc = `그룹 "${
                    groupInfo?.label || groupId.substring(0, 8)
                  }"`;
                } else if (fromItem) {
                  if (fromItem.type === "text" || fromItem.type === "shape") {
                    const content = htmlToText(fromItem.content).substring(
                      0,
                      30
                    );
                    fromDesc = `"${content}${
                      content.length >= 30 ? "..." : ""
                    }"`;
                  } else {
                    fromDesc = `${fromItem.type} 항목`;
                  }
                }

                if (conn.toId.startsWith("group-") && groupMetadata) {
                  const groupId = conn.toId.replace("group-", "");
                  const groupInfo = groupMetadata.get(groupId);
                  toDesc = `그룹 "${
                    groupInfo?.label || groupId.substring(0, 8)
                  }"`;
                } else if (toItem) {
                  if (toItem.type === "text" || toItem.type === "shape") {
                    const content = htmlToText(toItem.content).substring(0, 30);
                    toDesc = `"${content}${content.length >= 30 ? "..." : ""}"`;
                  } else {
                    toDesc = `${toItem.type} 항목`;
                  }
                }

                let connDesc = `${fromDesc} → ${toDesc}`;
                if (conn.label) {
                  connDesc += ` [연결선 라벨: "${conn.label}"]`;
                }

                return connDesc;
              })
              .join("\n");

            context += `관련된 연결선:\n${connectionDescriptions}\n\n`;
          }

          // Add images as inline data (limit to first 5 images to avoid token limits)
          const MAX_IMAGES_TO_SEND = 5;
          let imageCount = 0;

          for (const item of selectedItems) {
            if (
              item.type === "image" &&
              item.src &&
              imageCount < MAX_IMAGES_TO_SEND
            ) {
              // Extract base64 data from data URL
              const base64Match = item.src.match(
                /^data:image\/[^;]+;base64,(.+)$/
              );
              if (base64Match) {
                userParts.push({
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Match[1],
                  },
                });
                imageCount++;
              }
            }
          }

          // If there are more images, add a note
          const totalImages = selectedItems.filter(
            (item) => item.type === "image"
          ).length;
          if (totalImages > MAX_IMAGES_TO_SEND) {
            context += `\n참고: 선택된 이미지 중 처음 ${MAX_IMAGES_TO_SEND}장만 분석에 포함되었습니다. (전체 ${totalImages}장)\n\n`;
          }
        } else {
          // Smart context selection: prioritize relevant items based on keywords
          const MAX_ITEMS_DETAIL = 20;
          const MAX_CONTENT_LENGTH_SUMMARY = 100;

          // Score and sort all items by relevance
          const scoredItems = items
            .map((item) => ({
              item,
              score: calculateRelevance(item, keywords, selectedItemIds),
            }))
            .sort((a, b) => b.score - a.score);

          // Select top items for detailed description
          const relevantItems = scoredItems
            .slice(0, MAX_ITEMS_DETAIL)
            .map((s) => s.item);

          const allItemsDescription = relevantItems
            .map((item, index) => {
              let desc = `ID: ${item.id}, 유형: ${item.type}`;
              if (item.type === "text" || item.type === "shape") {
                const fullContent = htmlToText(item.content);
                const truncatedContent =
                  fullContent.length > MAX_CONTENT_LENGTH_SUMMARY
                    ? fullContent.substring(0, MAX_CONTENT_LENGTH_SUMMARY) +
                      "..."
                    : fullContent;
                desc += `, 내용: "${truncatedContent}"`;
              }

              if (item.groupId && groupMetadata) {
                const groupInfo = groupMetadata.get(item.groupId);
                const groupLabel =
                  groupInfo?.label || `그룹-${item.groupId.substring(0, 8)}`;
                desc += `, 그룹: "${groupLabel}"`;
              }

              return desc;
            })
            .join("\n");

          if (allItemsDescription) {
            if (keywords.length > 0) {
              context += `현재 캔버스에서 관련성 높은 항목들 (키워드: ${keywords.join(
                ", "
              )}):\n${allItemsDescription}\n`;
            } else {
              context += `현재 캔버스에는 다음 항목들이 있습니다:\n${allItemsDescription}\n`;
            }

            if (items.length > MAX_ITEMS_DETAIL) {
              const remainingItems = items.length - MAX_ITEMS_DETAIL;
              const remainingByType = {
                text: items
                  .slice(MAX_ITEMS_DETAIL)
                  .filter((i) => i.type === "text" || i.type === "shape")
                  .length,
                image: items
                  .slice(MAX_ITEMS_DETAIL)
                  .filter((i) => i.type === "image").length,
              };
              context += `\n... 외 ${remainingItems}개 항목 (텍스트: ${remainingByType.text}, 이미지: ${remainingByType.image})\n\n`;
            } else {
              context += `\n`;
            }
          }

          // Show all connections (limit to prevent overwhelming)
          if (connectors.length > 0) {
            const MAX_CONNECTIONS_DETAIL = 30;
            const connectionsToShow = connectors.slice(
              0,
              MAX_CONNECTIONS_DETAIL
            );

            const allConnectionDescriptions = connectionsToShow
              .map((conn) => {
                const fromItem = items.find((i) => i.id === conn.fromId);
                const toItem = items.find((i) => i.id === conn.toId);

                let fromDesc = conn.fromId;
                let toDesc = conn.toId;

                if (conn.fromId.startsWith("group-") && groupMetadata) {
                  const groupId = conn.fromId.replace("group-", "");
                  const groupInfo = groupMetadata.get(groupId);
                  fromDesc = `그룹 "${
                    groupInfo?.label || groupId.substring(0, 8)
                  }"`;
                } else if (fromItem) {
                  if (fromItem.type === "text" || fromItem.type === "shape") {
                    const content = htmlToText(fromItem.content).substring(
                      0,
                      30
                    );
                    fromDesc = `"${content}${
                      content.length >= 30 ? "..." : ""
                    }"`;
                  } else {
                    fromDesc = `${fromItem.type} 항목`;
                  }
                }

                if (conn.toId.startsWith("group-") && groupMetadata) {
                  const groupId = conn.toId.replace("group-", "");
                  const groupInfo = groupMetadata.get(groupId);
                  toDesc = `그룹 "${
                    groupInfo?.label || groupId.substring(0, 8)
                  }"`;
                } else if (toItem) {
                  if (toItem.type === "text" || toItem.type === "shape") {
                    const content = htmlToText(toItem.content).substring(0, 30);
                    toDesc = `"${content}${content.length >= 30 ? "..." : ""}"`;
                  } else {
                    toDesc = `${toItem.type} 항목`;
                  }
                }

                let connDesc = `${fromDesc} → ${toDesc}`;
                if (conn.label) {
                  connDesc += ` [연결선 라벨: "${conn.label}"]`;
                }

                return connDesc;
              })
              .join("\n");

            context += `캔버스의 연결선:\n${allConnectionDescriptions}\n`;

            if (connectors.length > MAX_CONNECTIONS_DETAIL) {
              context += `... 외 ${
                connectors.length - MAX_CONNECTIONS_DETAIL
              }개 연결선\n`;
            }
            context += `\n`;
          }

          // Show groups
          if (groupMetadata && groupMetadata.size > 0) {
            const groupDescriptions = Array.from(groupMetadata.entries())
              .map(([groupId, info]) => {
                const groupItems = items.filter(
                  (item) => item.groupId === groupId
                );
                return `그룹 "${info.label}" (${groupItems.length}개 항목)`;
              })
              .join("\n");

            context += `그룹 정보:\n${groupDescriptions}\n\n`;
          }

          // Add images from relevant items (prioritize by relevance score)
          const MAX_IMAGES_TO_SEND = 5;
          const imageItems = scoredItems
            .filter((s) => s.item.type === "image")
            .slice(0, MAX_IMAGES_TO_SEND)
            .map((s) => s.item) as ImageItem[];

          let imagesSent = 0;

          for (const item of imageItems) {
            const base64Match = item.src?.match(
              /^data:image\/[^;]+;base64,(.+)$/
            );
            if (base64Match) {
              userParts.push({
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Match[1],
                },
              });
              imagesSent++;
            }
          }

          // Inform AI about image limitations
          const totalImageCount = items.filter(
            (item) => item.type === "image"
          ).length;
          if (totalImageCount > 0) {
            if (totalImageCount <= MAX_IMAGES_TO_SEND) {
              context += `\n[이미지 ${totalImageCount}장이 첨부되었습니다]\n\n`;
            } else {
              context += `\n[참고: 캔버스에 총 ${totalImageCount}장의 이미지가 있으나, 관련성이 높은 ${imagesSent}장만 첨부되었습니다.]\n\n`;
            }
          }
        }

        const fullPrompt = `${context}사용자의 요청: ${message}

[응답 형식 지침]
- 답변은 Markdown 형식으로 작성해주세요.
- 긴 문장은 적절히 줄바꿈(두 번의 Enter)을 사용하여 단락으로 나누어주세요.
- 리스트가 필요하면 - 또는 1. 을 사용해주세요.
- 중요한 부분은 **굵게** 표시해주세요.
- 코드는 \`백틱\`으로 감싸주세요.

[제약사항 인지]
- 캔버스가 큰 경우, 모든 정보가 전달되지 않았을 수 있습니다.
- 항목이 많으면 처음 20개만 상세 정보가 제공되고 나머지는 통계로 제공됩니다.
- 이미지가 많으면 최대 5장까지만 첨부됩니다.
- 연결선이 많으면 최대 30개까지만 상세 정보가 제공됩니다.
- 텍스트 내용이 길면 요약되어 제공됩니다.
- 제공된 정보 범위 내에서 최선의 답변을 해주세요. 정보가 부족하면 그 사실을 명시하고 일반적인 조언을 제공하세요.`;
        userParts.unshift({ text: fullPrompt });

        const historyForChat = chatMessages.slice(-5).map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));

        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: [...historyForChat, { role: "user", parts: userParts }],
          config: {
            tools: [
              { functionDeclarations: [generateImageFunctionDeclaration] },
            ],
          },
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
          const imageCalls = response.functionCalls.filter(
            (fc) => fc.name === "generateImage"
          );

          if (imageCalls.length > 0) {
            // Add a single "generating images" message
            const generatingMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `${imageCalls.length}장의 이미지를 생성 중입니다...`,
            };
            setChatMessages((prev) => [...prev, generatingMessage]);

            // Generate all images sequentially with offset positions
            for (let i = 0; i < imageCalls.length; i++) {
              const fc = imageCalls[i];
              const { prompt, aspectRatio } = fc.args;
              if (typeof prompt === "string" && prompt) {
                await executeImageGeneration(
                  prompt,
                  aspectRatio as AspectRatio | undefined,
                  true, // skipMessage flag
                  i * 150 // offset for each image
                );
              }
            }

            // Add a single success message
            const successMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `${imageCalls.length}장의 이미지를 캔버스에 추가했습니다!`,
            };
            setChatMessages((prev) => [...prev, successMessage]);
          }
        } else {
          const aiResponseText = response.text;
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: aiResponseText,
          };
          setChatMessages((prev) => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error("Chat message failed:", error);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `죄송합니다, 메시지를 처리하는 데 문제가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsSendingChatMessage(false);
      }
    },
    [
      getGeminiClient,
      handleApiCall,
      chatMessages,
      selectedItemIds,
      items,
      executeImageGeneration,
      setChatMessages,
      setIsSendingChatMessage,
    ]
  );

  const handleGenerateKeywordAnalysis = useCallback(
    async (mainKeyword: string) => {
      setIsGeneratingKeywordAnalysis(true);
      setKeywordAnalysisLastGeneratedInput(mainKeyword);
      setKeywordAnalysisResults(null);
      try {
        const aiClient = await getGeminiClient();
        const prompt = `"${mainKeyword}"에 대한 심층 키워드 분석을 수행하여 관련 하위 키워드와 각 키워드에 대한 콘텐츠 아이디어를 제공해주세요. 각 하위 키워드에는 인기/관련성에 대한 질적 설명 (예: "매우 인기 있음", "틈새 시장")을 포함하세요. JSON 형식으로 응답해주세요.`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
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
                      contentIdeas: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ["keyword", "relevance", "contentIdeas"],
                  },
                },
              },
              required: ["mainKeyword", "subKeywords"],
            },
          },
        });
        const results = safeParseJsonResponse<KeywordAnalysisResult>(
          response.text
        );
        if (results) {
          setKeywordAnalysisResults(results);
          return results;
        } else {
          throw new Error("Failed to parse keyword analysis results.");
        }
      } catch (error) {
        console.error("Keyword analysis failed:", error);
        setKeywordAnalysisResults(null);
        alert(
          `키워드 분석 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return null;
      } finally {
        setIsGeneratingKeywordAnalysis(false);
      }
    },
    [getGeminiClient, handleApiCall]
  );

  const handleGenerateGroupDraft = useCallback(
    async (
      selectedItemIds: string[],
      setSelectedItemIds: (ids: string[]) => void,
      setEditingItemId: (id: string | null) => void
    ) => {
      if (selectedItemIds.length === 0) return;

      setIsGeneratingGroupDraft(true);
      setIsGeneratingAIContentFor(selectedItemIds[0]);
      try {
        const aiClient = await getGeminiClient();
        const selectedItems = items.filter((item) =>
          selectedItemIds.includes(item.id)
        );
        const itemsDescription = selectedItems
          .map((item) => {
            let desc = `ID: ${item.id}, 유형: ${item.type}`;
            if (item.type === "text" || item.type === "shape")
              desc += `, 내용: "${htmlToText(item.content)}"`;
            return desc;
          })
          .join("\n");

        const prompt = `다음은 그룹화된 캔버스 항목들입니다:\n${itemsDescription}\n\n이 그룹의 핵심 아이디어를 30단어 이내로 요약하는 간결한 초안 텍스트를 마크다운 형식으로 생성해주세요. 필요 시 강조(**굵게**)를 사용하세요.`;
        const response = await handleApiCall(aiClient.models.generateContent, {
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        const draftText = textToHtml(response.text);

        const firstItem = selectedItems[0];
        const newDraftItem: TextItem = {
          id: crypto.randomUUID(),
          type: "text",
          content: draftText,
          x: firstItem.x,
          y: firstItem.y - 80,
          width: 250,
          height: 60,
          color: "#000000",
          fontSize: 16,
          background: { type: "solid", color: "#fffbe0" },
          textAlign: "center",
          zIndex: maxZIndex.current++,
          opacity: 1,
          borderRadius: 8,
        };

        const newItems = [...items, newDraftItem];
        commitState(newItems, connectors);
        setItems(newItems);
        setSelectedItemIds([newDraftItem.id]);
        setEditingItemId(newDraftItem.id);
      } catch (error) {
        console.error("Generate group draft failed:", error);
        alert(
          `그룹 초안 생성 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsGeneratingGroupDraft(false);
        setIsGeneratingAIContentFor(null);
      }
    },
    [
      items,
      connectors,
      commitState,
      maxZIndex,
      setItems,
      getGeminiClient,
      handleApiCall,
    ]
  );

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
