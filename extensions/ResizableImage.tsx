import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useRef, useEffect, useCallback } from "react";

// Global flag to prevent canvas interactions during image resize
let globalImageResizing = false;

// Export function to check if image is being resized
export const isImageResizing = () => globalImageResizing;

interface ResizableImageComponentProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  selected: boolean;
  editor: any;
  getPos: () => number;
}

const ResizableImageComponent: React.FC<ResizableImageComponentProps> = ({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const resizingRef = useRef(false);

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      // Only allow selection in editing mode
      if (!editor.isEditable) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (resizingRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const pos = getPos();
      const img = imgRef.current;

      // Use queueMicrotask to avoid flushSync warning during render
      queueMicrotask(() => {
        editor.chain().focus().setNodeSelection(pos).run();

        // Update toolbar position to image top center
        // 툴바가 이미지 위쪽에 배치되도록 하고, 화면 상단을 넘지 않도록 제한
        if (img) {
          const rect = img.getBoundingClientRect();
          const toolbarHeight = 70; // 툴바 높이 + 여유 공간
          const minTopPosition = 10; // 화면 상단에서 최소 10px 여유
          const toolbarTop = Math.max(minTopPosition, rect.top - toolbarHeight);

          const customEvent = new CustomEvent("imageSelected", {
            detail: {
              top: toolbarTop,
              left: rect.left + rect.width / 2,
              width: rect.width,
              height: rect.height,
            },
          });
          window.dispatchEvent(customEvent);
        }
      });
    },
    [editor, getPos]
  );

  // 이미지 복사 기능
  const handleCopyImage = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const src = node.attrs.src;
      if (!src) return;

      try {
        // base64 이미지를 Blob으로 변환
        const response = await fetch(src);
        const blob = await response.blob();

        // 클립보드에 복사
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);

        console.log("✓ 이미지가 클립보드에 복사되었습니다");
      } catch (err) {
        console.error("이미지 복사 실패:", err);
      }
    },
    [node.attrs.src]
  );

  // 이미지 다운로드 기능
  const handleDownloadImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const src = node.attrs.src;
      const alt = node.attrs.alt || "image";
      if (!src) return;

      const link = document.createElement("a");
      link.href = src;
      link.download = `${alt.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("✓ 이미지 다운로드 시작");
    },
    [node.attrs.src, node.attrs.alt]
  );

  // 우클릭 메뉴 핸들러
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 기본 컨텍스트 메뉴 대신 복사/다운로드 옵션 표시
      const menu = document.createElement("div");
      menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 150px;
      `;

      const copyOption = document.createElement("div");
      copyOption.textContent = "📋 이미지 복사";
      copyOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        &:hover { background: #f0f0f0; }
      `;
      copyOption.onmouseover = () => (copyOption.style.background = "#f0f0f0");
      copyOption.onmouseout = () => (copyOption.style.background = "white");
      copyOption.onclick = (evt) => {
        handleCopyImage(evt as any);
        document.body.removeChild(menu);
      };

      const downloadOption = document.createElement("div");
      downloadOption.textContent = "💾 이미지 저장";
      downloadOption.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-top: 1px solid #eee;
      `;
      downloadOption.onmouseover = () =>
        (downloadOption.style.background = "#f0f0f0");
      downloadOption.onmouseout = () =>
        (downloadOption.style.background = "white");
      downloadOption.onclick = (evt) => {
        handleDownloadImage(evt as any);
        document.body.removeChild(menu);
      };

      menu.appendChild(copyOption);
      menu.appendChild(downloadOption);
      document.body.appendChild(menu);

      const closeMenu = () => {
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
        document.removeEventListener("click", closeMenu);
      };

      setTimeout(() => {
        document.addEventListener("click", closeMenu);
      }, 0);
    },
    [handleCopyImage, handleDownloadImage]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.preventDefault();
      e.stopPropagation();

      const img = imgRef.current;
      if (!img) return;

      // Get the actual rendered width of the image
      const rect = img.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = rect.width; // Use actual rendered width

      // Detect canvas scale by comparing natural size to rendered size
      // Find the canvas transform scale by traversing up the DOM tree
      let canvasScale = 1;
      let element = img.parentElement;
      while (element) {
        const transform = window.getComputedStyle(element).transform;
        if (transform && transform !== "none") {
          const matrix = new DOMMatrix(transform);
          canvasScale *= matrix.a; // matrix.a is scaleX
        }
        element = element.parentElement;
        // Stop at canvas-container level to avoid unnecessary traversal
        if (element?.classList.contains("canvas-container")) break;
      }

      resizingRef.current = true;
      setIsResizing(true);
      globalImageResizing = true; // Set global flag

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;

        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        const deltaX = moveEvent.clientX - startX;
        // Compensate for canvas scale - divide by scale to get CSS pixel delta
        const scaledDeltaX = deltaX / canvasScale;
        let newWidth = startWidth / canvasScale; // Convert screen width to CSS width

        // Calculate new width based on corner/edge
        if (corner === "e" || corner === "se" || corner === "ne") {
          // Right side - add delta
          newWidth = newWidth + scaledDeltaX;
        } else if (corner === "w" || corner === "sw" || corner === "nw") {
          // Left side - subtract delta
          newWidth = newWidth - scaledDeltaX;
        }

        // Clamp width between min and max
        newWidth = Math.max(50, Math.min(newWidth, 1200));

        // Update immediately for smooth resizing
        updateAttributes({ width: Math.round(newWidth) });
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();

        // Remove event listeners first
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // Immediately dispatch event to reset canvas state
        window.dispatchEvent(new CustomEvent("imageResizeComplete"));

        // Then update local state
        resizingRef.current = false;
        setIsResizing(false);

        // Clear global flag with minimal delay
        setTimeout(() => {
          globalImageResizing = false;
        }, 50);
      };

      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
        capture: true,
      });
      document.addEventListener("mouseup", handleMouseUp, {
        passive: false,
        capture: true,
      });
    },
    [updateAttributes]
  );

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    return () => {
      resizingRef.current = false;
      setIsResizing(false);
    };
  }, []);

  const width = node.attrs.width || "auto";
  const src = node.attrs.src;
  const alt = node.attrs.alt || "";
  const align = node.attrs.align || "left";

  // Calculate alignment styles for block-level container
  const containerStyle: React.CSSProperties = {
    pointerEvents: isResizing ? "none" : "auto",
    display: "flex",
    width: "100%",
  };

  // Apply flex justify for proper image alignment
  if (align === "center") {
    containerStyle.justifyContent = "center";
  } else if (align === "right") {
    containerStyle.justifyContent = "flex-end";
  } else {
    containerStyle.justifyContent = "flex-start";
  }

  return (
    <NodeViewWrapper
      className="my-4"
      style={containerStyle}
      onMouseDown={(e) => {
        // Prevent canvas item drag when interacting with image
        e.stopPropagation();
      }}
    >
      <div
        className={`relative inline-block ${
          selected ? "ring-2 ring-blue-500 rounded" : ""
        }`}
        style={{
          maxWidth: "100%",
          pointerEvents: "auto",
        }}
        onClick={handleImageClick}
        onMouseDown={(e) => {
          // Prevent canvas item drag
          e.stopPropagation();
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: "auto",
            display: "block",
            cursor: isResizing ? "ew-resize" : "pointer",
            userSelect: "none",
            pointerEvents: isResizing ? "none" : "auto",
          }}
          draggable={false}
          onError={(e) => console.error("Image load error:", e)}
          onMouseDown={(e) => {
            // Prevent any parent drag handlers
            e.stopPropagation();
          }}
          onContextMenu={handleContextMenu}
        />

        {/* Only show resize handles when editor is editable (editing mode) */}
        {selected && !isResizing && editor.isEditable && (
          <>
            <div
              className="absolute top-0 left-0 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10 resize-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "w");
              }}
              style={{ transform: "translateX(-50%)" }}
            />

            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10 resize-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "e");
              }}
              style={{ transform: "translateX(50%)" }}
            />

            <div
              className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-20 resize-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "nw");
              }}
              style={{ transform: "translate(-50%, -50%)" }}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-20 resize-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "ne");
              }}
              style={{ transform: "translate(50%, -50%)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-20 resize-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "sw");
              }}
              style={{ transform: "translate(-50%, 50%)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-20 resize-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "se");
              }}
              style={{ transform: "translate(50%, 50%)" }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Node.create({
  name: "image",

  group: "block",

  draggable: false,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width");
          return width ? parseInt(width) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      align: {
        default: "left",
        parseHTML: (element) => {
          return element.getAttribute("data-align") || "left";
        },
        renderHTML: (attributes) => {
          return {
            "data-align": attributes.align,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (options: {
          src: string;
          alt?: string;
          title?: string;
          width?: number;
          align?: "left" | "center" | "right";
        }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
