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

        // Immediately stop resizing
        resizingRef.current = false;
        setIsResizing(false);

        // Remove event listeners
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // Keep global flag set for a short period to prevent immediate canvas interactions
        setTimeout(() => {
          globalImageResizing = false;
        }, 150); // Extended delay to ensure all events are processed
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

  // Calculate alignment styles
  const alignmentStyle =
    align === "center"
      ? { display: "flex", justifyContent: "center" }
      : align === "right"
      ? { display: "flex", justifyContent: "flex-end" }
      : {};

  return (
    <NodeViewWrapper
      className="block my-4"
      style={{
        pointerEvents: isResizing ? "none" : "auto",
        ...alignmentStyle,
      }}
      onMouseDown={(e) => {
        // Prevent canvas item drag when interacting with image
        e.stopPropagation();
      }}
    >
      <div
        className={`relative inline-block ${
          selected ? "ring-2 ring-blue-500 rounded" : ""
        }`}
        style={{ maxWidth: "100%", pointerEvents: "auto" }}
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
        />

        {selected && !isResizing && (
          <>
            <div
              className="absolute top-0 left-0 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "w");
              }}
              style={{ transform: "translateX(-50%)" }}
            />

            <div
              className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "e");
              }}
              style={{ transform: "translateX(50%)" }}
            />

            <div
              className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "nw");
              }}
              style={{ transform: "translate(-50%, -50%)" }}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "ne");
              }}
              style={{ transform: "translate(50%, -50%)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart(e, "sw");
              }}
              style={{ transform: "translate(-50%, 50%)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize z-20"
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
