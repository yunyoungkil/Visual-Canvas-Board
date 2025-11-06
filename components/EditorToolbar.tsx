import React, { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
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
  const imageMenuRef = React.useRef<HTMLDivElement>(null);
  const editorPositionRef = React.useRef<number | null>(null);

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
        (editor.chain().focus() as any)
          .setImage({ src: imageUrl, width })
          .run();
      };
      img.onerror = () => {
        // Fallback: insert without width
        (editor.chain().focus() as any).setImage({ src: imageUrl }).run();
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
        top: `${top - 40}px`,
        left: `${left}px`,
        transform: "translateX(-50%)",
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

                              // Use queueMicrotask to avoid timing issues
                              queueMicrotask(() => {
                                // Insert image at saved cursor position
                                if (editorPositionRef.current !== null) {
                                  editor
                                    .chain()
                                    .focus()
                                    .insertContentAt(
                                      editorPositionRef.current,
                                      {
                                        type: "image",
                                        attrs: { src: dataUrl, width },
                                      }
                                    )
                                    .run();
                                } else {
                                  (editor.chain().focus() as any)
                                    .setImage({ src: dataUrl, width })
                                    .run();
                                }
                              });
                            };
                            img.onerror = () => {
                              // Fallback: insert without width
                              queueMicrotask(() => {
                                if (editorPositionRef.current !== null) {
                                  editor
                                    .chain()
                                    .focus()
                                    .insertContentAt(
                                      editorPositionRef.current,
                                      {
                                        type: "image",
                                        attrs: { src: dataUrl },
                                      }
                                    )
                                    .run();
                                } else {
                                  (editor.chain().focus() as any)
                                    .setImage({ src: dataUrl })
                                    .run();
                                }
                              });
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
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="헤더 1"
          >
            <span className="font-bold text-xs w-4 h-4 flex items-center justify-center">
              H1
            </span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="헤더 2"
          >
            <span className="font-bold text-xs w-4 h-4 flex items-center justify-center">
              H2
            </span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="글머리 기호 목록"
          >
            <Icon name="list" className="w-4 h-4 text-gray-700" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="번호 매기기 목록"
          >
            <span className="font-bold text-xs w-4 h-4 flex items-center justify-center">
              1.
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
    </div>
  );
};

export default EditorToolbar;
