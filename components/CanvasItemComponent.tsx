import React, { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import { ResizableImage } from "../extensions/ResizableImage.tsx";

import type {
  CanvasItem,
  HandlePosition,
  Point,
  TextItem,
  GradientBackground,
  ShapeItem,
  Connector,
} from "../types";

interface CanvasItemComponentProps {
  item: CanvasItem;
  isSelected: boolean;
  isSingleSelection: boolean;
  isEditing: boolean;
  isHoveredForConnection: boolean;
  isGeneratingAIContentForThisItem: boolean;
  scale: number;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  onDoubleClick: (item: CanvasItem, itemRect: DOMRect) => void;
  onResizeMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onConnectionStart: (
    e: React.MouseEvent,
    fromId: string,
    fromHandle: HandlePosition,
    fromPos: Point
  ) => void;
  onContentUpdate: (
    id: string,
    content: string,
    shouldCommit?: boolean,
    finalHeight?: number
  ) => void;
  onUpdateItem: (
    itemId: string,
    updates: Partial<CanvasItem>,
    shouldCommit?: boolean
  ) => void;
  onShowItemAiToolbar: (item: CanvasItem, itemRect: DOMRect) => void;
  onHideItemAiToolbar: () => void;
  onStartEditing: (editor: Editor, itemRect: DOMRect) => void;
  onStopEditing: () => void;
  getHandlePosition: (item: CanvasItem, position: HandlePosition) => Point;
  connectors: Connector[];
}

const getGradientCss = (background: GradientBackground): string => {
  const sortedStops = [...(background.stops || [])].sort(
    (a, b) => a.position - b.position
  );
  const colorStopsString = sortedStops
    .map((stop) => `${stop.color} ${stop.position * 100}%`)
    .join(", ");

  if (background.gradientType === "linear") {
    return `linear-gradient(${background.angle}deg, ${colorStopsString})`;
  } else {
    return `radial-gradient(circle, ${colorStopsString})`;
  }
};

const CanvasItemComponent: React.FC<CanvasItemComponentProps> = React.memo(
  ({
    item,
    isSelected,
    isSingleSelection,
    isEditing,
    isHoveredForConnection,
    isGeneratingAIContentForThisItem,
    scale,
    onMouseDown,
    onMouseUp,
    onDoubleClick,
    onResizeMouseDown,
    onConnectionStart,
    onContentUpdate,
    onUpdateItem,
    onShowItemAiToolbar,
    onHideItemAiToolbar,
    onStartEditing,
    onStopEditing,
    getHandlePosition,
    connectors,
  }) => {
    const itemContentRef = useRef<HTMLDivElement>(null);
    const isTextualItem = item.type === "text" || item.type === "shape";

    const editor = useEditor(
      {
        extensions: [
          StarterKit,
          Underline,
          TextAlign.configure({ types: ["heading", "paragraph"] }),
          Placeholder.configure({ placeholder: "텍스트 입력..." }),
          // The TextStyle extension is already included in StarterKit. Including it again causes a conflict.
          Color,
          Link.configure({
            openOnClick: false,
            autolink: true,
          }),
          Superscript,
          Subscript,
          ResizableImage,
          BubbleMenuExtension,
        ],
        content: isTextualItem
          ? (item as TextItem | ShapeItem).content || ""
          : "",
        editable: isEditing,
        editorProps: {
          attributes: {
            class: "max-w-none focus:outline-none",
          },
        },
        onUpdate: ({ editor }) => {
          if (!isTextualItem) return;
          const newAlign = ["left", "center", "right", "justify"].find(
            (align) => editor.isActive({ textAlign: align })
          ) as "left" | "center" | "right" | "justify" | undefined;

          if (
            newAlign &&
            (item as TextItem | ShapeItem).textAlign !== newAlign
          ) {
            onUpdateItem(item.id, { textAlign: newAlign }, false);
          }
        },
        onBlur: ({ editor, event }) => {
          const relatedTarget = event.relatedTarget as HTMLElement;
          if (relatedTarget && relatedTarget.closest(".tiptap-toolbar")) {
            return;
          }
          onContentUpdate(item.id, editor.getHTML(), true);
        },
      },
      [item.id]
    );

    useEffect(() => {
      if (!editor || !isTextualItem) return;

      const itemContent = (item as TextItem | ShapeItem).content || "";
      const editorContent = editor.getHTML();

      if (itemContent !== editorContent) {
        editor.commands.setContent(itemContent, false);
      }

      editor.setOptions({
        editorProps: {
          attributes: {
            // Add w-full to ensure the editor takes full width inside its flex container (for shapes)
            class: `max-w-none focus:outline-none w-full`,
            style: `color: ${item.color}; font-size: ${item.fontSize}px;`,
          },
        },
      });
    }, [editor, item, isTextualItem]);

    // Sync item.textAlign (from DetailsPanel) to editor
    useEffect(() => {
      if (editor && isTextualItem) {
        const itemAlignment = (item as TextItem | ShapeItem).textAlign;
        if (!editor.isActive({ textAlign: itemAlignment })) {
          editor.chain().focus().setTextAlign(itemAlignment).run();
        }
      }
    }, [
      editor,
      isTextualItem ? (item as TextItem | ShapeItem).textAlign : null,
    ]);

    useEffect(() => {
      if (!editor) return;
      if (isEditing && !editor.isEditable) {
        editor.setEditable(true);
        // Use queueMicrotask to avoid flushSync warning
        queueMicrotask(() => {
          editor.commands.focus("end");
        });
        if (itemContentRef.current) {
          onStartEditing(
            editor,
            itemContentRef.current.getBoundingClientRect()
          );
        }
      } else if (!isEditing && editor.isEditable) {
        editor.setEditable(false);
        onStopEditing();
      }
    }, [isEditing, editor, onStartEditing, onStopEditing]);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      // Always prevent zoom in text editor areas
      if (isTextualItem) {
        e.stopPropagation();
        return;
      }

      // For other items, only stop propagation if scrollable
      const element = itemContentRef.current?.querySelector(".ProseMirror");
      if (element) {
        const isScrollable = element.scrollHeight > element.clientHeight;
        if (isScrollable) {
          e.stopPropagation();
        }
      }
    };

    const hasConnections = connectors.some(
      (conn) => conn.fromId === item.id || conn.toId === item.id
    );

    useEffect(() => {
      if (!isTextualItem) return;

      const htmlContent = (item as TextItem | ShapeItem).content || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const currentTextValue = tempDiv.textContent || tempDiv.innerText || "";

      const canShowGenerateDraftButton =
        isSelected &&
        currentTextValue.trim().length > 0 &&
        currentTextValue.trim().length < 200 &&
        !htmlContent.includes("<br>");
      const canShowUpdateDraftButton =
        isSelected &&
        !isEditing &&
        currentTextValue.trim().length >= 200 &&
        hasConnections;

      if (
        itemContentRef.current &&
        isSingleSelection &&
        (canShowGenerateDraftButton || canShowUpdateDraftButton)
      ) {
        onShowItemAiToolbar(
          item,
          itemContentRef.current.getBoundingClientRect()
        );
      } else {
        onHideItemAiToolbar();
      }
    }, [
      item,
      isSelected,
      isSingleSelection,
      isEditing,
      hasConnections,
      onShowItemAiToolbar,
      onHideItemAiToolbar,
      isTextualItem,
    ]);

    const getShapePath = (shape: ShapeItem) => {
      const { width, height, border } = shape;
      const b = border.width / 2;
      switch (shape.shape) {
        case "ellipse":
          return `M ${b},${height / 2} C ${b},${b} ${width - b},${b} ${
            width - b
          },${height / 2} C ${width - b},${height - b} ${b},${
            height - b
          } ${b},${height / 2} Z`;
        case "diamond":
          return `M ${width / 2},${b} L ${width - b},${height / 2} L ${
            width / 2
          },${height - b} L ${b},${height / 2} Z`;
        case "rectangle":
        default:
          return `M ${b},${b} L ${width - b},${b} L ${width - b},${
            height - b
          } L ${b},${height - b} Z`;
      }
    };

    const showConnectionHandles =
      (isSelected && isSingleSelection) || isHoveredForConnection;

    const itemBackgroundStyle: Record<string, string> = {};
    if (item.type === "text" || item.type === "shape") {
      // 배경 스타일만 설정 (투명도는 별도 처리)
      if (item.background.type === "solid") {
        itemBackgroundStyle.backgroundColor = item.background.color;
      } else {
        itemBackgroundStyle.backgroundImage = getGradientCss(
          item.background as GradientBackground
        );
      }
    }

    const handleEditorContainerMouseDown = (e: React.MouseEvent) => {
      if (isEditing) {
        e.stopPropagation();
      }
    };

    return (
      <div
        data-id={item.id}
        className="absolute cursor-grab canvas-item"
        style={{
          transform: `translate(${item.x}px, ${item.y}px)`,
          width: item.width,
          height: item.height,
          zIndex: item.zIndex,
        }}
        onMouseDown={(e) => onMouseDown(e, item.id)}
        onMouseUp={(e) => {
          e.stopPropagation();
          onMouseUp(e, item.id);
        }}
        onDoubleClick={() =>
          itemContentRef.current &&
          onDoubleClick(item, itemContentRef.current.getBoundingClientRect())
        }
      >
        {isGeneratingAIContentForThisItem && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        <div
          className={`w-full h-full transition-shadow duration-100 ${
            isSelected ? "ring-2 ring-blue-500" : "shadow-md hover:shadow-lg"
          } ${isEditing ? "ring-2 ring-blue-500 shadow-lg" : ""} ${
            item.type === "image" ? "bg-white" : ""
          }`}
          style={{
            borderRadius: `${item.borderRadius ?? 0}px`,
            overflow: "hidden",
            position: "relative",
          }}
          onWheel={handleWheel}
          ref={itemContentRef}
        >
          {/* 배경 레이어 (투명도 적용) - 텍스트/도형만 */}
          {(item.type === "text" || item.type === "shape") && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                ...itemBackgroundStyle,
                opacity: item.opacity ?? 1,
              }}
            />
          )}

          {item.type === "image" && (
            <img
              src={item.src}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              style={{ opacity: item.opacity ?? 1 }}
              draggable={false}
            />
          )}

          {item.type === "shape" && (
            <>
              <div className="w-full h-full relative pointer-events-none">
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${item.width} ${item.height}`}
                  style={{
                    overflow: "visible",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <path
                    d={getShapePath(item)}
                    fill="transparent"
                    stroke={item.border.color}
                    strokeWidth={item.border.width}
                    strokeDasharray={
                      item.border.style === "dashed"
                        ? "8, 8"
                        : item.border.style === "dotted"
                        ? "2, 6"
                        : "none"
                    }
                  />
                </svg>
                {/* Removed justifyContent. Text alignment is now fully controlled by Tiptap. `flex` and `items-center` are for vertical centering. */}
                <div
                  onMouseDown={handleEditorContainerMouseDown}
                  className="absolute inset-0 flex items-center p-2 break-words overflow-y-auto"
                  style={{ pointerEvents: "auto" }}
                >
                  {editor && <EditorContent editor={editor} />}
                </div>
              </div>
            </>
          )}

          {item.type === "text" && (
            <div
              onMouseDown={handleEditorContainerMouseDown}
              className="w-full h-full p-2 break-words overflow-y-auto"
            >
              {editor && <EditorContent editor={editor} />}
            </div>
          )}
        </div>

        {isSelected && isSingleSelection && !isEditing && (
          <div
            className="absolute bg-white border-2 border-blue-500 rounded-sm cursor-se-resize z-20"
            style={{
              width: `${16 / scale}px`,
              height: `${16 / scale}px`,
              right: `${-8 / scale}px`,
              bottom: `${-8 / scale}px`,
            }}
            onMouseDown={(e) => onResizeMouseDown(e, item.id)}
          />
        )}

        {showConnectionHandles && !isEditing && (
          <>
            {(["top", "bottom", "left", "right"] as const).map((pos) => {
              const handlePos = getHandlePosition(item, pos);
              const handleSize = 12 / scale;
              const clickableAreaSize = 24 / scale;

              return (
                <div
                  key={`${pos}-clickable`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair z-30 group"
                  style={{
                    left: handlePos.x - item.x,
                    top: handlePos.y - item.y,
                    width: `${clickableAreaSize}px`,
                    height: `${clickableAreaSize}px`,
                  }}
                  onMouseDown={(e) =>
                    onConnectionStart(e, item.id, pos, handlePos)
                  }
                >
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 border-2 border-white rounded-full transition-transform group-hover:scale-125"
                    style={{
                      width: `${handleSize}px`,
                      height: `${handleSize}px`,
                    }}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  }
);

export default CanvasItemComponent;
