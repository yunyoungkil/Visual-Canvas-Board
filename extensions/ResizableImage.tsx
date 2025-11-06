import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useRef, useEffect, useCallback } from "react";

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
      if (resizingRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const pos = getPos();
      // Use queueMicrotask to avoid flushSync warning during render
      queueMicrotask(() => {
        editor.chain().focus().setNodeSelection(pos).run();
      });
    },
    [editor, getPos]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.preventDefault();
      e.stopPropagation();

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = rect.width;

      resizingRef.current = true;
      setIsResizing(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        if (!img) return;

        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        let newWidth = startWidth;

        if (corner.includes("e")) {
          newWidth = startWidth + deltaX;
        } else if (corner.includes("w")) {
          newWidth = startWidth - deltaX;
        }

        if (corner.length === 2) {
          const avgDelta = (Math.abs(deltaX) + Math.abs(deltaY)) / 2;
          if (corner.includes("e")) {
            newWidth = startWidth + avgDelta * (deltaX > 0 ? 1 : -1);
          } else {
            newWidth = startWidth + avgDelta * (deltaX > 0 ? -1 : 1);
          }
        }

        newWidth = Math.max(50, Math.min(newWidth, 1200));
        updateAttributes({ width: Math.round(newWidth) });
      };

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // Reset state after a short delay to prevent click event
        setTimeout(() => {
          resizingRef.current = false;
          setIsResizing(false);
        }, 50);
      };

      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp, { passive: false });
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

  // Debug log
  console.log("ResizableImage render:", {
    src: src?.substring(0, 50),
    width,
    attrs: node.attrs,
  });

  return (
    <NodeViewWrapper
      className="block my-4"
      style={{ pointerEvents: isResizing ? "none" : "auto" }}
    >
      <div
        className={`relative inline-block ${
          selected ? "ring-2 ring-blue-500 rounded" : ""
        }`}
        style={{ maxWidth: "100%", pointerEvents: "auto" }}
        onClick={handleImageClick}
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
          }}
          draggable={false}
          onError={(e) => console.error("Image load error:", e)}
        />

        {selected && !isResizing && (
          <>
            <div
              className="absolute top-0 left-0 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10"
              onMouseDown={(e) => handleResizeStart(e, "w")}
              style={{ transform: "translateX(-50%)" }}
            />

            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10"
              onMouseDown={(e) => handleResizeStart(e, "e")}
              style={{ transform: "translateX(50%)" }}
            />

            <div
              className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-20"
              onMouseDown={(e) => handleResizeStart(e, "nw")}
              style={{ transform: "translate(-50%, -50%)" }}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-20"
              onMouseDown={(e) => handleResizeStart(e, "ne")}
              style={{ transform: "translate(50%, -50%)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-20"
              onMouseDown={(e) => handleResizeStart(e, "sw")}
              style={{ transform: "translate(-50%, 50%)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-20"
              onMouseDown={(e) => handleResizeStart(e, "se")}
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
