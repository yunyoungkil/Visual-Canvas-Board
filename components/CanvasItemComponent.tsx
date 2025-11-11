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
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { SelectableHorizontalRule } from "../extensions/SelectableHorizontalRule";
import { ResizableImage } from "../extensions/ResizableImage";

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
  doubleClickPosition?: { x: number; y: number } | null;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  onDoubleClick: (
    item: CanvasItem,
    itemRect: DOMRect,
    clickEvent?: React.MouseEvent
  ) => void;
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
    doubleClickPosition,
    onMouseDown,
    onMouseUp,
    onDoubleClick,
    onResizeMouseDown,
    onConnectionStart,
    onContentUpdate,
    onUpdateItem,
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
          StarterKit.configure({
            horizontalRule: false, // We'll use our own HorizontalRule extension
            heading: {
              levels: [1, 2, 3, 4], // Explicitly enable H1-H4
            },
          }),
          Underline,
          TextAlign.configure({ types: ["heading", "paragraph"] }),
          Placeholder.configure({ placeholder: "텍스트 입력..." }),
          TextStyle, // Required for FontFamily and other text styling
          Color,
          FontFamily.configure({
            types: ["textStyle"],
          }),
          Highlight.configure({
            multicolor: true,
          }),
          Link.configure({
            openOnClick: false,
            autolink: true,
          }),
          Superscript,
          Subscript,
          Table.configure({
            resizable: true,
            HTMLAttributes: {
              class: "border-collapse table-auto w-full",
            },
          }),
          TableRow,
          TableHeader.configure({
            HTMLAttributes: {
              class:
                "border border-gray-300 bg-gray-100 px-3 py-2 font-semibold text-left",
            },
          }),
          TableCell.configure({
            HTMLAttributes: {
              class: "border border-gray-300 px-3 py-2",
            },
          }),
          SelectableHorizontalRule.configure({
            HTMLAttributes: {
              class: "my-4 border-t-2 border-gray-300",
            },
          }),
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

      // Only update content if it actually differs
      // This prevents losing images when resizing the text box
      if (itemContent !== editorContent) {
        editor.commands.setContent(itemContent, false);
      }
    }, [editor, isTextualItem, (item as TextItem | ShapeItem).content]);

    // Separate effect for style updates to avoid content reset
    useEffect(() => {
      if (!editor || !isTextualItem) return;

      const textItem = item as TextItem | ShapeItem;
      editor.setOptions({
        editorProps: {
          attributes: {
            // Add w-full to ensure the editor takes full width inside its flex container (for shapes)
            class: `max-w-none focus:outline-none w-full`,
            style: `color: ${textItem.color}; font-size: ${textItem.fontSize}px;`,
          },
        },
      });
    }, [editor, isTextualItem, item]);

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
        // Add editing-mode class for CSS control
        const editorElement = editor.view.dom;
        editorElement.classList.add("editing-mode");
        // Use queueMicrotask to avoid flushSync warning
        queueMicrotask(() => {
          if (doubleClickPosition && itemContentRef.current) {
            // 더블 클릭 위치로 커서 이동
            const rect = itemContentRef.current.getBoundingClientRect();
            const relativeX = doubleClickPosition.x - rect.left;
            const relativeY = doubleClickPosition.y - rect.top;

            // Tiptap의 posAtCoords를 사용하여 클릭 위치의 문서 위치 계산
            const pos = editor.view.posAtCoords({
              left: doubleClickPosition.x,
              top: doubleClickPosition.y,
            });

            if (pos) {
              editor.chain().focus().setTextSelection(pos.pos).run();
            } else {
              editor.commands.focus("end");
            }
          } else {
            editor.commands.focus("end");
          }
        });
        if (itemContentRef.current) {
          onStartEditing(
            editor,
            itemContentRef.current.getBoundingClientRect()
          );
        }
      } else if (!isEditing && editor.isEditable) {
        editor.setEditable(false);
        // Remove editing-mode class
        const editorElement = editor.view.dom;
        editorElement.classList.remove("editing-mode");
        onStopEditing();
      }
    }, [isEditing, editor, onStartEditing, onStopEditing, doubleClickPosition]);

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
      // Check if the click is on a table element
      const target = e.target as HTMLElement;
      const isTableElement = target.closest("table") !== null;

      if (isEditing) {
        // In editing mode, always stop propagation to allow text editing
        // BUT: don't stop for table elements - let Tiptap handle table interactions
        if (!isTableElement) {
          e.stopPropagation();
        }
      } else if (isTableElement) {
        // Not in editing mode but clicked on table - stop propagation
        // This prevents dragging when clicking on table in non-editing mode
        e.stopPropagation();
      }
      // If not editing and not on table, allow propagation for item dragging
    };

    return (
      <div
        data-id={item.id}
        data-item-id={item.id}
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
        onDoubleClick={(e) =>
          itemContentRef.current &&
          onDoubleClick(item, itemContentRef.current.getBoundingClientRect(), e)
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
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();

                // 우클릭 메뉴 생성
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
                `;
                copyOption.onmouseover = () =>
                  (copyOption.style.background = "#f0f0f0");
                copyOption.onmouseout = () =>
                  (copyOption.style.background = "white");
                copyOption.onclick = async () => {
                  try {
                    const response = await fetch(item.src);
                    const blob = await response.blob();
                    await navigator.clipboard.write([
                      new ClipboardItem({ [blob.type]: blob }),
                    ]);
                    console.log("✓ 이미지가 클립보드에 복사되었습니다");
                  } catch (err) {
                    console.error("이미지 복사 실패:", err);
                  }
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
                downloadOption.onclick = () => {
                  const link = document.createElement("a");
                  link.href = item.src;
                  link.download = `image_${item.id.substring(0, 8)}.jpeg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  document.body.removeChild(menu);
                  console.log("✓ 이미지 다운로드 시작");
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
              }}
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
                  onMouseMove={(e) => isEditing && e.stopPropagation()}
                  onMouseUp={(e) => isEditing && e.stopPropagation()}
                  className="absolute inset-0 flex items-center p-2 break-words overflow-y-auto"
                >
                  {editor && <EditorContent editor={editor} />}
                </div>
              </div>
            </>
          )}

          {item.type === "text" && (
            <div
              onMouseDown={handleEditorContainerMouseDown}
              onMouseMove={(e) => isEditing && e.stopPropagation()}
              onMouseUp={(e) => isEditing && e.stopPropagation()}
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
