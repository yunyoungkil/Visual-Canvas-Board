import React, { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import MonacoEditor from "@monaco-editor/react";
import Icon from "./Icon";
import type { IconName } from "./Icon";

interface EditorToolbarProps {
  editor: Editor | null;
  top: number;
  left: number;
  style?: React.CSSProperties;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  top,
  left,
  style,
}) => {
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);
  const [tableGridRows, setTableGridRows] = useState(0);
  const [tableGridCols, setTableGridCols] = useState(0);
  const [isBgColorMenuOpen, setIsBgColorMenuOpen] = useState(false);
  const [isHrMenuOpen, setIsHrMenuOpen] = useState(false);
  const [isHtmlEditMode, setIsHtmlEditMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [bgColor, setBgColor] = useState("#ffff00");
  const [bgOpacity, setBgOpacity] = useState(50);
  const [hrSpacing, setHrSpacing] = useState(50);
  const [, forceUpdate] = useState({});
  const imageMenuRef = React.useRef<HTMLDivElement>(null);
  const headingMenuRef = React.useRef<HTMLDivElement>(null);
  const listMenuRef = React.useRef<HTMLDivElement>(null);
  const fontMenuRef = React.useRef<HTMLDivElement>(null);
  const tableMenuRef = React.useRef<HTMLDivElement>(null);
  const bgColorMenuRef = React.useRef<HTMLDivElement>(null);
  const hrMenuRef = React.useRef<HTMLDivElement>(null);
  const editorPositionRef = React.useRef<number | null>(null);

  // Force re-render when editor selection changes
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      forceUpdate({});
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  if (!editor || editor.isDestroyed) {
    return null;
  }

  const openLinkEditor = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setIsEditingImage(false);
    setIsEditingLink(true);
  }, [editor]);

  const closeLinkEditor = useCallback(() => {
    setIsEditingLink(false);
    setLinkUrl("");
  }, []);

  const saveLink = useCallback(() => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    closeLinkEditor();
  }, [editor, linkUrl, closeLinkEditor]);

  const openImageEditor = useCallback(() => {
    setImageUrl("");
    setIsEditingLink(false);
    setIsEditingImage(true);
    setIsImageMenuOpen(false);
  }, []);

  const closeImageEditor = useCallback(() => {
    setIsEditingImage(false);
    setImageUrl("");
  }, []);

  const saveImage = useCallback(() => {
    if (imageUrl) {
      // Load image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        const width = Math.min(img.width, 600);
        // Insert without focus() to prevent selection loss
        (editor.chain() as any)
          .setImage({ src: imageUrl, width, align: "left" })
          .run();
      };
      img.onerror = () => {
        // Fallback: insert without width
        (editor.chain() as any)
          .setImage({ src: imageUrl, align: "left" })
          .run();
      };
      img.src = imageUrl;
    }
    closeImageEditor();
  }, [editor, imageUrl, closeImageEditor]);

  // Close image menu when clicking outside
  useEffect(() => {
    if (!isImageMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        imageMenuRef.current &&
        !imageMenuRef.current.contains(event.target as Node)
      ) {
        setIsImageMenuOpen(false);
      }
    };

    // Add small delay before attaching listener
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isImageMenuOpen]);

  // Close heading menu when clicking outside
  useEffect(() => {
    if (!isHeadingMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        headingMenuRef.current &&
        !headingMenuRef.current.contains(event.target as Node)
      ) {
        setIsHeadingMenuOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHeadingMenuOpen]);

  // Close list menu when clicking outside
  useEffect(() => {
    if (!isListMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        listMenuRef.current &&
        !listMenuRef.current.contains(event.target as Node)
      ) {
        setIsListMenuOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isListMenuOpen]);

  // Close font menu when clicking outside
  useEffect(() => {
    if (!isFontMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        fontMenuRef.current &&
        !fontMenuRef.current.contains(event.target as Node)
      ) {
        setIsFontMenuOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFontMenuOpen]);

  // Close table menu when clicking outside
  useEffect(() => {
    if (!isTableMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tableMenuRef.current &&
        !tableMenuRef.current.contains(event.target as Node)
      ) {
        setIsTableMenuOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTableMenuOpen]);

  // Close background color menu when clicking outside
  useEffect(() => {
    if (!isBgColorMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        bgColorMenuRef.current &&
        !bgColorMenuRef.current.contains(event.target as Node)
      ) {
        setIsBgColorMenuOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBgColorMenuOpen]);

  // Close HR menu when clicking outside
  useEffect(() => {
    if (!isHrMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        hrMenuRef.current &&
        !hrMenuRef.current.contains(event.target as Node)
      ) {
        setIsHrMenuOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHrMenuOpen]);

  // HTML 편집 모드 핸들러
  const openHtmlEditMode = useCallback(() => {
    const currentHtml = editor.getHTML();
    setHtmlContent(currentHtml);
    setIsHtmlEditMode(true);
  }, [editor]);

  const closeHtmlEditMode = useCallback(() => {
    setIsHtmlEditMode(false);
    setHtmlContent("");
  }, []);

  const saveHtmlContent = useCallback(() => {
    try {
      // HTML 콘텐츠 유효성 검사 (기본적인 체크)
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;

      // Tiptap 에디터에 HTML 설정
      editor.commands.setContent(htmlContent);
      closeHtmlEditMode();
    } catch (error) {
      console.error("HTML 파싱 오류:", error);
      alert("유효하지 않은 HTML입니다. 다시 확인해주세요.");
    }
  }, [editor, htmlContent, closeHtmlEditMode]);

  // HTML 편집 모드에서 ESC 키 처리
  useEffect(() => {
    if (!isHtmlEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeHtmlEditMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHtmlEditMode, closeHtmlEditMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, title, children }) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-sm hover:bg-gray-100 ${
        isActive ? "is-active" : ""
      }`}
      title={title}
    >
      {children}
    </button>
  );

  const textStyleAttrs = editor.getAttributes("textStyle");
  const currentColor = textStyleAttrs?.color;

  return (
    <div
      className="fixed flex flex-wrap items-center gap-1 p-1 bg-white rounded-md shadow-lg border border-gray-200 tiptap-toolbar"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: "translateX(-50%)",
        zIndex: 1000,
        ...style,
      }}
      onMouseDown={handleMouseDown}
    >
      {isEditingLink ? (
        <div className="flex items-center gap-1 p-1">
          <Icon name="link" className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                closeLinkEditor();
              }
            }}
            placeholder="URL을 입력하세요..."
            className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={saveLink}
            className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            title="저장"
          >
            ✓
          </button>
        </div>
      ) : isEditingImage ? (
        <div className="flex items-center gap-1 p-1">
          <Icon name="image" className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveImage();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                closeImageEditor();
              }
            }}
            placeholder="URL을 입력하세요..."
            className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={saveImage}
            className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            title="저장"
          >
            ✓
          </button>
        </div>
      ) : (
        <>
          {/* Heading Dropdown */}
          <div className="relative" ref={headingMenuRef}>
            <button
              className="px-2 py-1.5 rounded-sm hover:bg-gray-100 text-xs font-medium text-gray-700 min-w-[60px] text-left"
              title="스타일 선택"
              onClick={() => setIsHeadingMenuOpen(!isHeadingMenuOpen)}
            >
              {editor.isActive("heading", { level: 1 })
                ? "제목1"
                : editor.isActive("heading", { level: 2 })
                ? "제목2"
                : editor.isActive("heading", { level: 3 })
                ? "제목3"
                : editor.isActive("heading", { level: 4 })
                ? "제목4"
                : "본문"}
              <span className="ml-1">▼</span>
            </button>
            {isHeadingMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[140px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    setIsHeadingMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-2xl font-bold hover:bg-gray-100 rounded-t-md ${
                    editor.isActive("heading", { level: 1 }) ? "bg-blue-50" : ""
                  }`}
                >
                  제목1
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    setIsHeadingMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xl font-bold hover:bg-gray-100 ${
                    editor.isActive("heading", { level: 2 }) ? "bg-blue-50" : ""
                  }`}
                >
                  제목2
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    setIsHeadingMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-lg font-bold hover:bg-gray-100 ${
                    editor.isActive("heading", { level: 3 }) ? "bg-blue-50" : ""
                  }`}
                >
                  제목3
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 4 }).run();
                    setIsHeadingMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-base font-semibold hover:bg-gray-100 ${
                    editor.isActive("heading", { level: 4 }) ? "bg-blue-50" : ""
                  }`}
                >
                  제목4
                </button>
                <div className="w-full h-px bg-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    editor.chain().focus().setParagraph().run();
                    setIsHeadingMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-base hover:bg-gray-100 rounded-b-md ${
                    !editor.isActive("heading") ? "bg-blue-50" : ""
                  }`}
                >
                  본문
                </button>
              </div>
            )}
          </div>

          {/* List Dropdown */}
          <div className="relative" ref={listMenuRef}>
            <button
              className="p-1.5 rounded-sm hover:bg-gray-100"
              title="목록"
              onClick={() => setIsListMenuOpen(!isListMenuOpen)}
            >
              <Icon name="list" className="w-4 h-4 text-gray-700" />
            </button>
            {isListMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  onClick={() => {
                    editor.chain().focus().toggleBulletList().run();
                    setIsListMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-t-md ${
                    editor.isActive("bulletList") ? "bg-gray-100" : ""
                  }`}
                >
                  • 글머리 기호
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleOrderedList().run();
                    setIsListMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-b-md ${
                    editor.isActive("orderedList") ? "bg-gray-100" : ""
                  }`}
                >
                  1. 번호 매기기
                </button>
              </div>
            )}
          </div>

          {/* Font Family Dropdown */}
          <div className="relative" ref={fontMenuRef}>
            <button
              className="px-2 py-1.5 rounded-sm hover:bg-gray-100 text-xs font-medium text-gray-700 min-w-[80px] text-left"
              title="폰트 선택"
              onClick={() => setIsFontMenuOpen(!isFontMenuOpen)}
            >
              {editor.isActive("textStyle", { fontFamily: "Noto Sans KR" })
                ? "Noto Sans"
                : editor.isActive("textStyle", { fontFamily: "Roboto" })
                ? "Roboto"
                : editor.isActive("textStyle", { fontFamily: "Nanum Gothic" })
                ? "나눔고딕"
                : editor.isActive("textStyle", { fontFamily: "Nanum Myeongjo" })
                ? "나눔명조"
                : "기본"}
              <span className="ml-1">▼</span>
            </button>
            {isFontMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[140px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  onClick={() => {
                    editor.chain().focus().unsetFontFamily().run();
                    setIsFontMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-t-md"
                >
                  기본
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().setFontFamily("Noto Sans KR").run();
                    setIsFontMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  style={{ fontFamily: "Noto Sans KR" }}
                >
                  Noto Sans KR
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().setFontFamily("Roboto").run();
                    setIsFontMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  style={{ fontFamily: "Roboto" }}
                >
                  Roboto
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().setFontFamily("Nanum Gothic").run();
                    setIsFontMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  style={{ fontFamily: "Nanum Gothic" }}
                >
                  나눔고딕
                </button>
                <button
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setFontFamily("Nanum Myeongjo")
                      .run();
                    setIsFontMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-b-md"
                  style={{ fontFamily: "Nanum Myeongjo" }}
                >
                  나눔명조
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="굵게"
          >
            <Icon name="bold" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="기울임꼴"
          >
            <Icon name="italic" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="밑줄"
          >
            <Icon name="underline" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="취소선"
          >
            <Icon name="strikethrough" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <div className="relative group flex items-center">
            <input
              type="color"
              onInput={(event) =>
                editor
                  .chain()
                  .focus()
                  .setColor((event.target as HTMLInputElement).value)
                  .run()
              }
              value={currentColor || "#000000"}
              className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
              title="글자 색상"
            />
            <span
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full pointer-events-none"
              style={{ backgroundColor: currentColor || "transparent" }}
            ></span>
          </div>

          {/* Background Color with Opacity */}
          <div className="relative" ref={bgColorMenuRef}>
            <button
              className="p-1.5 rounded-sm hover:bg-gray-100 relative"
              title="배경색"
              onClick={() => setIsBgColorMenuOpen(!isBgColorMenuOpen)}
            >
              <Icon name="paintBucket" className="w-4 h-4 text-gray-700" />
              <span
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                style={{
                  backgroundColor: bgColor,
                  opacity: bgOpacity / 100,
                }}
              ></span>
            </button>
            {isBgColorMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 min-w-[200px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="mb-2">
                  <label
                    htmlFor="bg-color-picker"
                    className="text-xs text-gray-600 mb-1 block"
                  >
                    배경색
                  </label>
                  <input
                    id="bg-color-picker"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-8 cursor-pointer"
                    title="배경색 선택"
                  />
                </div>
                <div className="mb-3">
                  <label
                    htmlFor="bg-opacity-slider"
                    className="text-xs text-gray-600 mb-1 block"
                  >
                    투명도: {bgOpacity}%
                  </label>
                  <input
                    id="bg-opacity-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(Number(e.target.value))}
                    className="w-full"
                    title="투명도 조절"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const rgba = `rgba(${parseInt(
                        bgColor.slice(1, 3),
                        16
                      )}, ${parseInt(bgColor.slice(3, 5), 16)}, ${parseInt(
                        bgColor.slice(5, 7),
                        16
                      )}, ${bgOpacity / 100})`;
                      editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color: rgba })
                        .run();
                      setIsBgColorMenuOpen(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    적용
                  </button>
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setIsBgColorMenuOpen(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                  >
                    제거
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <ToolbarButton
            onClick={openLinkEditor}
            isActive={editor.isActive("link")}
            title="링크"
          >
            <Icon name="link" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <div className="relative" ref={imageMenuRef}>
            <button
              className="p-1.5 rounded-sm hover:bg-gray-100"
              title="이미지 삽입"
              onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
            >
              <Icon name="image" className="w-4 h-4 text-gray-700" />
            </button>
            {isImageMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  onClick={() => {
                    openImageEditor();
                    setIsImageMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-t-md"
                >
                  URL로 삽입
                </button>
                <button
                  onClick={(e) => {
                    // Save current cursor position before opening file dialog
                    const { from } = editor.state.selection;
                    editorPositionRef.current = from;

                    // Create a fresh input element dynamically
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";

                    input.onchange = (event) => {
                      const target = event.target as HTMLInputElement;
                      const file = target.files?.[0];

                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (readerEvent) => {
                          const dataUrl = readerEvent.target?.result as string;
                          if (dataUrl) {
                            const img = new Image();
                            img.onload = () => {
                              const width = Math.min(img.width, 600);

                              // Insert image without focus() to prevent selection loss
                              // Insert image at saved cursor position
                              if (editorPositionRef.current !== null) {
                                editor
                                  .chain()
                                  .insertContentAt(editorPositionRef.current, {
                                    type: "image",
                                    attrs: {
                                      src: dataUrl,
                                      width,
                                      align: "left",
                                    },
                                  })
                                  .run();
                              } else {
                                (editor.chain() as any)
                                  .setImage({
                                    src: dataUrl,
                                    width,
                                    align: "left",
                                  })
                                  .run();
                              }
                            };
                            img.onerror = () => {
                              // Fallback: insert without width
                              if (editorPositionRef.current !== null) {
                                editor
                                  .chain()
                                  .insertContentAt(editorPositionRef.current, {
                                    type: "image",
                                    attrs: { src: dataUrl, align: "left" },
                                  })
                                  .run();
                              } else {
                                (editor.chain() as any)
                                  .setImage({ src: dataUrl, align: "left" })
                                  .run();
                              }
                            };
                            img.src = dataUrl;
                          }
                        };
                        reader.readAsDataURL(file);
                      }

                      // Close menu
                      setIsImageMenuOpen(false);

                      // Remove the input element
                      document.body.removeChild(input);
                    };

                    // Append to body and trigger click
                    document.body.appendChild(input);
                    input.click();
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-b-md"
                >
                  파일 업로드
                </button>
              </div>
            )}
          </div>

          {/* Table Insertion */}
          <div className="relative" ref={tableMenuRef}>
            <button
              className="p-1.5 rounded-sm hover:bg-gray-100"
              title="테이블 삽입/편집"
              onClick={() => setIsTableMenuOpen(!isTableMenuOpen)}
            >
              <Icon name="table" className="w-4 h-4 text-gray-700" />
            </button>
            {isTableMenuOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                onMouseDown={(e) => e.preventDefault()}
              >
                {!editor.isActive("table") ? (
                  // Table grid selector (when not in a table)
                  <div className="p-4" style={{ width: "240px" }}>
                    <div
                      className="mb-2"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(10, 20px)",
                        gap: "2px",
                        justifyContent: "center",
                      }}
                    >
                      {Array.from({ length: 100 }).map((_, index) => {
                        const row = Math.floor(index / 10) + 1;
                        const col = (index % 10) + 1;
                        const isHighlighted =
                          row <= tableGridRows && col <= tableGridCols;

                        return (
                          <div
                            key={index}
                            style={{
                              width: "20px",
                              height: "20px",
                              border: isHighlighted
                                ? "1px solid #60a5fa"
                                : "1px solid #d1d5db",
                              backgroundColor: isHighlighted
                                ? "#bfdbfe"
                                : "#ffffff",
                              cursor: "pointer",
                              transition: "all 0.1s",
                            }}
                            className="hover:bg-gray-100"
                            onMouseEnter={() => {
                              setTableGridRows(row);
                              setTableGridCols(col);
                            }}
                            onClick={() => {
                              editor
                                .chain()
                                .focus()
                                .insertTable({
                                  rows: row,
                                  cols: col,
                                  withHeaderRow: true,
                                })
                                .run();
                              setIsTableMenuOpen(false);
                              setTableGridRows(0);
                              setTableGridCols(0);
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="text-xs text-center text-gray-600 font-medium">
                      {tableGridRows > 0 && tableGridCols > 0
                        ? `${tableGridRows} × ${tableGridCols}`
                        : "테이블 크기 선택"}
                    </div>
                  </div>
                ) : (
                  // Table editing toolbar (when cursor is inside a table)
                  <div className="p-2 flex items-center gap-1">
                    {/* 왼쪽에 열 추가 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().addColumnBefore().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="왼쪽에 열 삽입"
                    >
                      <Icon
                        name="tableColumnBefore"
                        className="w-5 h-5 text-gray-700"
                      />
                    </button>

                    {/* 오른쪽에 열 추가 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().addColumnAfter().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="오른쪽에 열 삽입"
                    >
                      <Icon
                        name="tableColumnAfter"
                        className="w-5 h-5 text-gray-700"
                      />
                    </button>

                    {/* 열 삭제 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().deleteColumn().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="열 삭제"
                    >
                      <Icon
                        name="tableColumnDelete"
                        className="w-5 h-5 text-red-600"
                      />
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    {/* 위에 행 추가 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().addRowBefore().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="위에 행 삽입"
                    >
                      <Icon
                        name="tableRowBefore"
                        className="w-5 h-5 text-gray-700"
                      />
                    </button>

                    {/* 아래에 행 추가 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().addRowAfter().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="아래에 행 삽입"
                    >
                      <Icon
                        name="tableRowAfter"
                        className="w-5 h-5 text-gray-700"
                      />
                    </button>

                    {/* 행 삭제 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().deleteRow().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="행 삭제"
                    >
                      <Icon
                        name="tableRowDelete"
                        className="w-5 h-5 text-red-600"
                      />
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    {/* 셀 합치기 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().mergeCells().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="셀 합치기"
                    >
                      <Icon
                        name="tableMergeCells"
                        className="w-5 h-5 text-gray-700"
                      />
                    </button>

                    {/* 셀 나누기 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().splitCell().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="셀 나누기"
                    >
                      <Icon
                        name="tableSplitCell"
                        className="w-5 h-5 text-gray-700"
                      />
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    {/* 헤더 행 토글 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().toggleHeaderRow().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="헤더 행 토글"
                    >
                      <Icon
                        name="tableTheme"
                        className="w-5 h-5 text-gray-700"
                      />
                    </button>

                    {/* 테이블 삭제 */}
                    <button
                      onClick={() => {
                        editor.chain().focus().deleteTable().run();
                        setIsTableMenuOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="테이블 삭제"
                    >
                      <Icon
                        name="tableDelete"
                        className="w-5 h-5 text-red-600"
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Horizontal Rule with Spacing */}
          <div className="relative" ref={hrMenuRef}>
            <button
              className="p-1.5 rounded-sm hover:bg-gray-100"
              title="구분선"
              onClick={() => setIsHrMenuOpen(!isHrMenuOpen)}
            >
              <Icon name="minus" className="w-4 h-4 text-gray-700" />
            </button>
            {isHrMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 min-w-[180px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="mb-3">
                  <label
                    htmlFor="hr-spacing-slider"
                    className="text-xs text-gray-600 mb-1 block"
                  >
                    여백 크기: {hrSpacing}px
                  </label>
                  <input
                    id="hr-spacing-slider"
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={hrSpacing}
                    onChange={(e) => {
                      const newSpacing = Number(e.target.value);
                      setHrSpacing(newSpacing);

                      // 현재 선택된 구분선이 있으면 즉시 여백 업데이트
                      const { selection } = editor.state;

                      // Node selection으로 HR이 선택되어 있는지 확인
                      if (
                        selection instanceof NodeSelection &&
                        selection.node.type.name === "horizontalRule"
                      ) {
                        // 선택된 노드의 정확한 위치
                        const selectedPos = selection.from;

                        // 문서의 모든 HR 요소를 순회하며 해당 위치의 HR 찾기
                        let targetHrIndex = -1;
                        let currentHrIndex = 0;

                        editor.state.doc.descendants((node, nodePos) => {
                          if (node.type.name === "horizontalRule") {
                            if (nodePos === selectedPos) {
                              targetHrIndex = currentHrIndex;
                              return false; // 찾았으니 중단
                            }
                            currentHrIndex++;
                          }
                        });

                        // DOM에서 해당 인덱스의 HR 요소에 스타일 적용
                        if (targetHrIndex >= 0) {
                          const hrs = editor.view.dom.querySelectorAll("hr");
                          if (hrs[targetHrIndex]) {
                            (
                              hrs[targetHrIndex] as HTMLElement
                            ).style.margin = `${newSpacing}px 0`;
                          }
                        }
                      }
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 구분선을 클릭하면 선택되어 여백을 조정할 수 있습니다
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Insert HR with custom margin
                    editor.chain().focus().setHorizontalRule().run();

                    // Apply custom spacing via style (requires DOM manipulation after insert)
                    setTimeout(() => {
                      const hrs = editor.view.dom.querySelectorAll("hr");
                      const lastHr = hrs[hrs.length - 1] as HTMLElement;
                      if (lastHr) {
                        lastHr.style.margin = `${hrSpacing}px 0`;

                        // 삽입 후 자동 선택을 위해 위치 찾기
                        setTimeout(() => {
                          const allHrs = Array.from(
                            editor.view.dom.querySelectorAll("hr")
                          );
                          const hrIndex = allHrs.indexOf(
                            lastHr as HTMLHRElement
                          );

                          // HR의 문서 위치 찾기
                          let targetPos = -1;
                          let currentIndex = 0;

                          editor.state.doc.descendants((node, pos) => {
                            if (node.type.name === "horizontalRule") {
                              if (currentIndex === hrIndex) {
                                targetPos = pos;
                                return false;
                              }
                              currentIndex++;
                            }
                          });

                          // HR을 선택
                          if (targetPos >= 0) {
                            const sel = NodeSelection.create(
                              editor.state.doc,
                              targetPos
                            );
                            editor.view.dispatch(
                              editor.state.tr.setSelection(sel)
                            );
                          }
                        }, 10);
                      }
                    }, 10);

                    setIsHrMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  구분선 삽입
                </button>
              </div>
            )}
          </div>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive("superscript")}
            title="위 첨자"
          >
            <Icon name="superscript" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive("subscript")}
            title="아래 첨자"
          >
            <Icon name="subscript" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <ToolbarButton
            onClick={openHtmlEditMode}
            isActive={false}
            title="HTML 소스 편집"
          >
            <span className="text-xs font-mono font-bold text-gray-700">
              &lt;/&gt;
            </span>
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          {(["left", "center", "right", "justify"] as const).map((align) => (
            <ToolbarButton
              key={align}
              onClick={() => editor.chain().focus().setTextAlign(align).run()}
              isActive={editor.isActive({ textAlign: align })}
              title={`${
                align === "left"
                  ? "왼쪽"
                  : align === "center"
                  ? "중앙"
                  : align === "right"
                  ? "오른쪽"
                  : "양쪽"
              } 정렬`}
            >
              <Icon
                name={
                  `align${
                    align.charAt(0).toUpperCase() + align.slice(1)
                  }` as IconName
                }
                className="w-4 h-4 text-gray-700"
              />
            </ToolbarButton>
          ))}
        </>
      )}

      {/* HTML 편집 모달 */}
      {isHtmlEditMode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
          onClick={closeHtmlEditMode}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-lg shadow-2xl flex flex-col"
            style={{
              width: "95vw",
              height: "95vh",
              maxWidth: "1400px",
              maxHeight: "900px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl font-mono font-bold text-blue-600">
                  &lt;/&gt;
                </span>
                <h2 className="text-lg font-semibold text-gray-800">
                  HTML 소스 편집
                </h2>
                <span className="text-xs text-gray-500 ml-2">
                  (Monaco Editor - VS Code와 동일한 편집 환경)
                </span>
              </div>
              <button
                onClick={closeHtmlEditMode}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="닫기 (ESC)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Monaco Editor 영역 */}
            <div className="flex-1 overflow-hidden border-b border-gray-200">
              <MonacoEditor
                height="100%"
                language="html"
                value={htmlContent}
                onChange={(value) => setHtmlContent(value || "")}
                theme="vs"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: "on",
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  autoIndent: "full",
                  folding: true,
                  foldingStrategy: "indentation",
                  showFoldingControls: "always",
                  bracketPairColorization: {
                    enabled: true,
                  },
                  guides: {
                    indentation: true,
                    bracketPairs: true,
                  },
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                  },
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true,
                  },
                }}
              />
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 flex-shrink-0">
              <div className="flex flex-col gap-1">
                <div className="text-sm text-gray-700 font-medium">
                  💡 편집 도움말
                </div>
                <div className="text-xs text-gray-500">
                  •{" "}
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                    Ctrl+Shift+F
                  </kbd>
                  : 자동 포맷팅 •{" "}
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                    Ctrl+F
                  </kbd>
                  : 찾기 •{" "}
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                    Ctrl+/
                  </kbd>
                  : 주석 •{" "}
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                    Alt+클릭
                  </kbd>
                  : 다중 커서
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closeHtmlEditMode}
                  className="px-5 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={saveHtmlContent}
                  className="px-5 py-2.5 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors font-medium shadow-sm"
                >
                  저장하고 적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;
