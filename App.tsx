import React, { useMemo, useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type {
  CanvasItem,
  Connector,
  Point,
  TextItem,
  ShapeItem,
  TiptapToolbarState,
  ConnectorLabelEditorState,
  SuggestedGroupOverlayState,
} from "./types";
import Header from "./components/Header";
import LeftToolbar from "./components/LeftToolbar";
import ContextualActionBar from "./components/ContextualActionBar";
import ZoomControls from "./components/ZoomControls";
import DetailsPanel from "./components/DetailsPanel";
import CanvasItemComponent from "./components/CanvasItemComponent";
import ConnectorLabelEditor from "./components/ConnectorLabelEditor";
import ContextMenu from "./components/ContextMenu";
import AiHelpModal from "./components/AiHelpModal";
import OutlineModal from "./components/OutlineModal";
import SocialPostModal from "./components/SocialPostModal";
import BrainstormModal from "./components/BrainstormModal";
import AiExportModal from "./components/AiExportModal";
import SuggestedGroupOverlay from "./components/SuggestedGroupOverlay";
import KeywordAnalysisModal from "./components/KeywordAnalysisModal";
import ConnectorsLayer from "./components/ConnectorsLayer";
import AiChatAssistant from "./components/AiChatAssistant";
import EditorToolbar from "./components/EditorToolbar";
import ImageToolbar from "./components/TextSelectionToolbar"; // Repurposed for image editing
import GroupBox from "./components/GroupBox";
import * as C from "./constants";

import { useCanvasState } from "./hooks/useCanvasState";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useAIFeatures } from "./hooks/useAIFeatures";

const App: React.FC = () => {
  const canvasStateAndActions = useCanvasState();
  const {
    items,
    connectors,
    scale,
    viewOffset,
    history,
    groupMetadata,
    setGroupMetadata,
    handleUndo,
    handleRedo,
    handleClearCanvas,
    updateZIndex,
    handleItemUpdate,
    handleConnectorUpdate,
  } = canvasStateAndActions;

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [doubleClickPosition, setDoubleClickPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [tiptapToolbarState, setTiptapToolbarState] =
    useState<TiptapToolbarState | null>(null);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [
    connectorLabelEditorFloatingState,
    setConnectorLabelEditorFloatingState,
  ] = useState<ConnectorLabelEditorState | null>(null);
  const [
    suggestedGroupOverlayFloatingStates,
    setSuggestedGroupOverlayFloatingStates,
  ] = useState<SuggestedGroupOverlayState[]>([]);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);

  const {
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
    setIsAiHelpModalVisible,
    setIsOutlineModalOpen,
    setIsSocialPostModalOpen,
    setIsBrainstormModalOpen,
    setIsAiExportModalOpen,
    setIsKeywordAnalysisModalOpen,
    setIsChatAssistantOpen,
    setSuggestedGroups,
    handleExportPng,
    handleGenerateTextDraft: handleGenerateTextDraftInternal,
    handleCommitTextAndGenerateDraft: handleCommitTextAndGenerateDraftInternal,
    handleAiTextEdit,
    handleUpdateTextDraftWithConnections:
      handleUpdateTextDraftWithConnectionsInternal,
    handleSuggestGroups,
    handleAcceptSuggestion,
    handleGenerateOutline,
    handleGenerateSocialPost,
    handleGenerateBrainstormIdeas,
    handleAddIdeaToCanvas,
    handleGenerateKeywordAnalysis,
    handleExportWithAi,
    handleSendChatMessage: handleSendChatMessageInternal,
    setKeywordAnalysisCurrentInput,
    handleGenerateGroupDraft,
    apiKeyError,
    setApiKeyError,
  } = useAIFeatures(
    { ...canvasStateAndActions, groupMetadata },
    selectedItemIds
  );

  const {
    canvasRef,
    exportRef,
    selectedConnectorId,
    setSelectedConnectorId,
    snapLines,
    selectionBox,
    isSpacePanning,
    isPanModeActive,
    isTextModeActive,
    shapeToAdd,
    editingItemId,
    setEditingItemId,
    editingConnectorState,
    panningState,
    hoveredConnectorId,
    contextMenuState,
    hoveredItemIdForConnection,
    setShapeToAdd,
    setIsPanModeActive,
    setIsTextModeActive,
    setContextMenuState,
    handleWheel,
    handleDragOver,
    handleDrop,
    handleItemMouseDown,
    handleMouseUp,
    handleItemDoubleClick: handleItemDoubleClickInternal,
    handleResizeMouseDown,
    onConnectionStart,
    handleContentUpdate,
    handleCanvasMouseDown,
    handleConnectorLabelEdit: handleConnectorLabelEditInternal,
    handleGroup,
    handleUngroup,
    handleDelete,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleConnectorLabelUpdate,
    interactionStateAndSetters,
    interactionHandlers,
  } = useCanvasInteraction({
    ...canvasStateAndActions,
    selectedItemIds,
    setSelectedItemIds,
    activeEditor,
  });

  const { getHandlePosition, canvasToScreen, screenToCanvas } =
    interactionHandlers;

  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemIds.includes(item.id)),
    [items, selectedItemIds]
  );

  const detailsPanelEntity = useMemo(() => {
    if (selectedItems.length === 1) return selectedItems[0];
    if (selectedConnectorId)
      return connectors.find((c) => c.id === selectedConnectorId) || null;
    return null;
  }, [selectedItems, selectedConnectorId, connectors]);
  const connectingState = interactionStateAndSetters.connectingState;

  useEffect(() => {
    if (!detailsPanelEntity) {
      setIsDetailsPanelVisible(false);
    }
  }, [detailsPanelEntity]);

  const handleStopEditing = useCallback(() => {
    // Phase 1: 편집 종료 시 편집했던 아이템을 선택 상태로 복귀
    if (editingItemId) {
      setSelectedItemIds([editingItemId]);
    }
    setActiveEditor(null);
    setTiptapToolbarState(null);
    setDoubleClickPosition(null); // 더블 클릭 위치 초기화
  }, [editingItemId, setSelectedItemIds]);

  // Fix: When an edited item is deleted, clean up editor-related state.
  useEffect(() => {
    const isEditingItemPresent = items.some(
      (item) => item.id === editingItemId
    );
    if (editingItemId && !isEditingItemPresent) {
      handleStopEditing();
      setEditingItemId(null);
    }
  }, [items, editingItemId, handleStopEditing, setEditingItemId]);

  const handleGenerateTextDraft = useCallback(
    (itemId: string, itemRect: DOMRect) => {
      const item = items.find((i) => i.id === itemId);
      if (!item || (item.type !== "text" && item.type !== "shape")) return;
      handleGenerateTextDraftInternal(
        itemId,
        item.content || "",
        setEditingItemId
      );
    },
    [items, handleGenerateTextDraftInternal, setEditingItemId]
  );

  const handleCommitTextAndGenerateDraft = useCallback(
    (itemId: string, itemRect: DOMRect) => {
      const item = items.find((i) => i.id === itemId);
      if (!item || (item.type !== "text" && item.type !== "shape")) return;
      handleCommitTextAndGenerateDraftInternal(
        itemId,
        item.content || "",
        setEditingItemId
      );
    },
    [items, handleCommitTextAndGenerateDraftInternal, setEditingItemId]
  );

  const handleUpdateTextDraftWithConnections = useCallback(
    (itemId: string, itemRect: DOMRect) => {
      const item = items.find((i) => i.id === itemId);
      if (!item || (item.type !== "text" && item.type !== "shape")) return;
      handleUpdateTextDraftWithConnectionsInternal(itemId, item.content || "");
    },
    [items, handleUpdateTextDraftWithConnectionsInternal]
  );

  const handleStartEditing = useCallback(
    (editor: Editor, itemRect: DOMRect) => {
      setActiveEditor(editor);
      // 툴바 높이 (대략 60px) + 여유 공간 (10px) = 70px
      // 툴바가 에디터 위쪽에 배치되도록 하고, 화면 상단을 넘지 않도록 제한
      const toolbarHeight = 70;
      const minTopPosition = 10; // 화면 상단에서 최소 10px 여유
      const toolbarTop = Math.max(minTopPosition, itemRect.top - toolbarHeight);

      setTiptapToolbarState({
        isVisible: true,
        editor: editor,
        top: toolbarTop,
        left: itemRect.left + itemRect.width / 2,
      });
    },
    []
  );

  // Listen for image selection events to update toolbar position
  useEffect(() => {
    const handleImageSelected = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { top, left } = customEvent.detail;

      if (tiptapToolbarState) {
        setTiptapToolbarState({
          ...tiptapToolbarState,
          top,
          left,
        });
      }
    };

    window.addEventListener("imageSelected", handleImageSelected);
    return () =>
      window.removeEventListener("imageSelected", handleImageSelected);
  }, [tiptapToolbarState]);

  const handleItemDoubleClick = useCallback(
    (item: CanvasItem, itemRect: DOMRect, clickEvent?: React.MouseEvent) => {
      if (clickEvent) {
        setDoubleClickPosition({
          x: clickEvent.clientX,
          y: clickEvent.clientY,
        });
      }
      handleItemDoubleClickInternal(item);
    },
    [handleItemDoubleClickInternal]
  );

  const handleConnectorLabelEdit = useCallback(
    (conn: Connector, midpoint: Point, angle: number) => {
      const screenMidpoint = canvasToScreen(midpoint);
      setConnectorLabelEditorFloatingState({
        id: conn.id,
        initialValue: conn.label || "",
        initialColor: conn.labelColor || "#000000",
        initialFontSize: conn.labelFontSize || 14,
        position: screenMidpoint,
        angle: angle,
      });
      handleConnectorLabelEditInternal(conn, midpoint, angle);
    },
    [canvasToScreen, handleConnectorLabelEditInternal]
  );

  const handleConnectorLabelEditorEnd = useCallback(
    (
      id: string,
      updates: { text: string; color: string; fontSize: number }
    ) => {
      handleConnectorLabelUpdate(id, updates);
      setConnectorLabelEditorFloatingState(null);
    },
    [handleConnectorLabelUpdate]
  );

  const handleConnectorLabelEditorCancel = useCallback(() => {
    setConnectorLabelEditorFloatingState(null);
  }, []);

  useEffect(() => {
    setSuggestedGroupOverlayFloatingStates(
      suggestedGroups.map((suggestion) => {
        const screenX = suggestion.bounds.x * scale + viewOffset.x;
        const screenY = suggestion.bounds.y * scale + viewOffset.y;
        const screenWidth = suggestion.bounds.width * scale;
        const screenHeight = suggestion.bounds.height * scale;

        return {
          id: suggestion.id,
          itemIds: suggestion.itemIds,
          bounds: {
            x: screenX,
            y: screenY,
            width: screenWidth,
            height: screenHeight,
          },
          scale: scale,
        };
      })
    );
  }, [suggestedGroups, scale, viewOffset]);

  const handleAcceptSuggestionFloating = useCallback(
    (suggestionId: string) => {
      const suggestion = suggestedGroups.find((s) => s.id === suggestionId);
      if (suggestion) {
        handleAcceptSuggestion(suggestion, (ids) => setSelectedItemIds(ids));
      }
    },
    [suggestedGroups, handleAcceptSuggestion, setSelectedItemIds]
  );

  const handleRejectSuggestionFloating = useCallback(
    (suggestionId: string) => {
      setSuggestedGroups((prev) => prev.filter((s) => s.id !== suggestionId));
    },
    [setSuggestedGroups]
  );

  const handleSendChatMessage = useCallback(
    (message: string) => {
      handleSendChatMessageInternal(message);
    },
    [handleSendChatMessageInternal]
  );

  // Group label update handler
  const handleUpdateGroupLabel = useCallback(
    (groupId: string, label: string) => {
      console.log("[App] Updating group label:", { groupId, label });
      setGroupMetadata((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(groupId) || { color: "#3b82f6", label: "" };
        newMap.set(groupId, { ...existing, label });
        console.log("[App] New groupMetadata Map:", newMap);
        return newMap;
      });
    },
    []
  );

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-gray-100"
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
    >
      <div
        ref={exportRef}
        className={`w-full h-full relative transition-transform duration-200 ease-in-out ${
          isSpacePanning || isPanModeActive || panningState
            ? "cursor-grabbing"
            : isPanModeActive
            ? "cursor-grab"
            : isTextModeActive
            ? "cursor-text"
            : shapeToAdd
            ? "cursor-crosshair"
            : "cursor-default"
        }`}
        style={{
          transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          const target = e.target as HTMLElement;
          const itemElement = target.closest(".canvas-item");
          const connectorElement = target.closest(".connector-group");
          const itemId = itemElement?.getAttribute("data-id") || null;
          const connectorId = connectorElement?.getAttribute("data-id") || null;

          if (itemId && !selectedItemIds.includes(itemId)) {
            setSelectedItemIds([itemId]);
            setSelectedConnectorId(null);
          } else if (connectorId) {
            setSelectedConnectorId(connectorId);
            setSelectedItemIds([]);
          }
          setContextMenuState({
            x: e.clientX,
            y: e.clientY,
            itemId,
            connectorId,
          });
        }}
      >
        <div
          className="absolute"
          style={{
            width: C.CANVAS_WORLD_SIZE,
            height: C.CANVAS_WORLD_SIZE,
            top: -C.CANVAS_WORLD_SIZE / 2,
            left: -C.CANVAS_WORLD_SIZE / 2,
          }}
        >
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="smallGrid"
                width={C.GRID_SIZE}
                height={C.GRID_SIZE}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${C.GRID_SIZE} 0 L 0 0 0 ${C.GRID_SIZE}`}
                  fill="none"
                  stroke="rgba(200,200,200,0.3)"
                  strokeWidth="1"
                />
              </pattern>
              <pattern
                id="grid"
                width={C.GRID_SIZE * 5}
                height={C.GRID_SIZE * 5}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  width={C.GRID_SIZE * 5}
                  height={C.GRID_SIZE * 5}
                  fill="url(#smallGrid)"
                />
                <path
                  d={`M ${C.GRID_SIZE * 5} 0 L 0 0 0 ${C.GRID_SIZE * 5}`}
                  fill="none"
                  stroke="rgba(200,200,200,0.5)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div
          className={`absolute w-full h-full transition-opacity ${
            isExporting ? "opacity-0" : "opacity-100"
          }`}
          style={{ visibility: isExporting ? "hidden" : "visible" }}
        >
          {snapLines.map((line, i) => (
            <div
              key={i}
              className="absolute bg-pink-500"
              style={{
                ...(line.direction === "vertical"
                  ? {
                      left: line.position,
                      top: line.start,
                      width: 1 / scale,
                      height: line.end - line.start,
                    }
                  : {
                      top: line.position,
                      left: line.start,
                      height: 1 / scale,
                      width: line.end - line.start,
                    }),
              }}
            />
          ))}
        </div>

        <ConnectorsLayer
          connectors={connectors}
          items={items}
          getHandlePosition={interactionHandlers.getHandlePosition}
          connectingState={connectingState}
          hoveredConnectorId={hoveredConnectorId}
          selectedConnectorId={selectedConnectorId}
          editingConnectorState={editingConnectorState}
          scale={scale}
          onConnectorMouseEnter={(id) =>
            interactionStateAndSetters.setHoveredConnectorId(id)
          }
          onConnectorMouseLeave={() =>
            interactionStateAndSetters.setHoveredConnectorId(null)
          }
          onConnectorClick={(e, id) => {
            e.stopPropagation();
            setSelectedConnectorId(id);
            setSelectedItemIds([]);
          }}
          onConnectorDoubleClick={handleConnectorLabelEdit}
        />

        {/* Render group boxes for all groups */}
        {Array.from(
          new Set(items.map((item) => item.groupId).filter(Boolean))
        ).map((groupId) => {
          const metadata = groupMetadata.get(groupId!) || {
            color: "#3b82f6",
            label: `그룹`,
          };

          // Check if all items in this group are selected
          const groupItems = items.filter((item) => item.groupId === groupId);
          const groupItemIds = groupItems.map((item) => item.id);
          const isGroupSelected =
            groupItemIds.length > 0 &&
            groupItemIds.every((id) => selectedItemIds.includes(id));

          return (
            <GroupBox
              key={groupId}
              groupId={groupId!}
              items={items}
              color={metadata.color}
              label={metadata.label}
              scale={scale}
              isSelected={isGroupSelected}
              onUpdateLabel={handleUpdateGroupLabel}
              onConnectionStart={onConnectionStart}
              getHandlePosition={getHandlePosition}
              onGroupSelect={(gId, isCtrlPressed) => {
                const groupItems = items.filter((item) => item.groupId === gId);
                const groupItemIds = groupItems.map((item) => item.id);

                if (isCtrlPressed) {
                  // Ctrl+Click: Toggle group selection
                  const allSelected = groupItemIds.every((id) =>
                    selectedItemIds.includes(id)
                  );

                  if (allSelected) {
                    // Deselect all items in group
                    setSelectedItemIds((prev) =>
                      prev.filter((id) => !groupItemIds.includes(id))
                    );
                  } else {
                    // Add all items in group to selection
                    setSelectedItemIds((prev) => [
                      ...new Set([...prev, ...groupItemIds]),
                    ]);
                  }
                } else {
                  // Normal click: Select only this group
                  setSelectedItemIds(groupItemIds);
                }
              }}
            />
          );
        })}

        {items.map((item) => (
          <CanvasItemComponent
            key={item.id}
            item={item}
            isSelected={selectedItemIds.includes(item.id)}
            isSingleSelection={selectedItemIds.length === 1}
            isEditing={editingItemId === item.id}
            isHoveredForConnection={hoveredItemIdForConnection === item.id}
            isGeneratingAIContentForThisItem={
              isGeneratingAIContentFor === item.id
            }
            scale={scale}
            doubleClickPosition={
              editingItemId === item.id ? doubleClickPosition : null
            }
            onMouseDown={(e, itemId) => handleItemMouseDown(e, itemId)}
            onMouseUp={(e) => {
              e.stopPropagation();
              handleMouseUp(e, item.id);
            }}
            onDoubleClick={(item, itemRect, clickEvent) =>
              handleItemDoubleClick(item, itemRect, clickEvent)
            }
            onResizeMouseDown={handleResizeMouseDown}
            onConnectionStart={onConnectionStart}
            onContentUpdate={handleContentUpdate}
            onUpdateItem={handleItemUpdate}
            onStartEditing={handleStartEditing}
            onStopEditing={handleStopEditing}
            getHandlePosition={interactionHandlers.getHandlePosition}
            connectors={connectors}
          />
        ))}

        {selectionBox && (
          <div
            className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
            style={{
              left: Math.min(selectionBox.start.x, selectionBox.end.x),
              top: Math.min(selectionBox.start.y, selectionBox.end.y),
              width: Math.abs(selectionBox.start.x - selectionBox.end.x),
              height: Math.abs(selectionBox.start.y - selectionBox.end.y),
            }}
          />
        )}
      </div>

      {tiptapToolbarState?.isVisible && !isImageSelected && (
        <EditorToolbar
          editor={activeEditor}
          top={tiptapToolbarState.top}
          left={tiptapToolbarState.left}
          style={{ zIndex: 1000 }}
        />
      )}

      {tiptapToolbarState && (
        <ImageToolbar
          editor={activeEditor}
          top={tiptapToolbarState.top}
          left={tiptapToolbarState.left}
          onImageSelectionChange={setIsImageSelected}
        />
      )}

      {connectorLabelEditorFloatingState && (
        <ConnectorLabelEditor
          id={connectorLabelEditorFloatingState.id}
          initialValue={connectorLabelEditorFloatingState.initialValue}
          initialColor={connectorLabelEditorFloatingState.initialColor}
          initialFontSize={connectorLabelEditorFloatingState.initialFontSize}
          position={connectorLabelEditorFloatingState.position}
          angle={connectorLabelEditorFloatingState.angle}
          onEndEdit={handleConnectorLabelEditorEnd}
          onCancel={handleConnectorLabelEditorCancel}
          style={{ zIndex: 900 }}
        />
      )}

      {suggestedGroupOverlayFloatingStates.map((overlay) => (
        <SuggestedGroupOverlay
          key={overlay.id}
          suggestion={overlay}
          scale={overlay.scale}
          onAccept={() => handleAcceptSuggestionFloating(overlay.id)}
          onReject={() => handleRejectSuggestionFloating(overlay.id)}
          style={{ zIndex: 900 }}
        />
      ))}

      <Header
        onClearCanvas={handleClearCanvas}
        onExportPng={() => handleExportPng(exportRef)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.current > 0}
        canRedo={history.current < history.length - 1}
        className="z-50"
      />

      <LeftToolbar
        isPanModeActive={isPanModeActive}
        isTextModeActive={isTextModeActive}
        isShapeModeActive={!!shapeToAdd}
        onTogglePanMode={() => {
          setIsPanModeActive((p) => !p);
          setIsTextModeActive(false);
          setShapeToAdd(null);
        }}
        onToggleTextMode={() => {
          setIsTextModeActive((p) => !p);
          setIsPanModeActive(false);
          setShapeToAdd(null);
        }}
        onSetShapeToAdd={(shape) => {
          setShapeToAdd((prev) => (prev === shape ? null : shape));
          setIsPanModeActive(false);
          setIsTextModeActive(false);
        }}
        onToggleOutlineModal={() => setIsOutlineModalOpen(true)}
        onToggleSocialPostModal={() => setIsSocialPostModalOpen(true)}
        onToggleBrainstormModal={() => setIsBrainstormModalOpen(true)}
        onToggleAiExportModal={() => setIsAiExportModalOpen(true)}
        onToggleKeywordAnalysisModal={() => setIsKeywordAnalysisModalOpen(true)}
        onToggleChatAssistant={() => setIsChatAssistantOpen((o) => !o)}
        onGenerateTextDraft={() => {
          const selectedItem =
            selectedItemIds.length === 1
              ? items.find((i) => i.id === selectedItemIds[0])
              : null;
          if (selectedItem) {
            const itemElement = document.querySelector(
              `[data-item-id="${selectedItem.id}"]`
            );
            if (itemElement) {
              handleGenerateTextDraft(
                selectedItem.id,
                itemElement.getBoundingClientRect()
              );
            }
          }
        }}
        onUpdateTextDraftWithConnections={() => {
          const selectedItem =
            selectedItemIds.length === 1
              ? items.find((i) => i.id === selectedItemIds[0])
              : null;
          if (selectedItem) {
            const itemElement = document.querySelector(
              `[data-item-id="${selectedItem.id}"]`
            );
            if (itemElement) {
              handleUpdateTextDraftWithConnections(
                selectedItem.id,
                itemElement.getBoundingClientRect()
              );
            }
          }
        }}
        canGenerateDraft={(() => {
          const selectedItem =
            selectedItemIds.length === 1
              ? items.find((i) => i.id === selectedItemIds[0])
              : null;
          if (!selectedItem || selectedItem.type === "image") return false;
          const content = selectedItem.content || "";
          const textContent = content.replace(/<[^>]*>/g, "").trim();
          return textContent.length < 200;
        })()}
        canUpdateDraft={(() => {
          const selectedItem =
            selectedItemIds.length === 1
              ? items.find((i) => i.id === selectedItemIds[0])
              : null;

          if (!selectedItem || selectedItem.type === "image") {
            return false;
          }

          // 연결선이 있는지 확인
          const hasConnection = connectors.some((c) => {
            if (c.fromId === selectedItem.id || c.toId === selectedItem.id) {
              const connectedId =
                c.fromId === selectedItem.id ? c.toId : c.fromId;

              // 일반 항목으로 연결되었거나
              const hasDirectConnection = items.some(
                (i) => i.id === connectedId
              );

              // 그룹으로 연결되었는지 확인 (groupId로 연결)
              // connectedId가 "group-xxx" 형태일 수 있으므로 접두사 제거
              const groupIdToCheck = connectedId.startsWith("group-")
                ? connectedId.substring(6)
                : connectedId;

              const hasGroupConnection = items.some(
                (i) => i.groupId === groupIdToCheck || i.groupId === connectedId
              );

              return hasDirectConnection || hasGroupConnection;
            }
            return false;
          });

          return hasConnection;
        })()}
        isGeneratingAIContent={!!isGeneratingAIContentFor}
        className="z-50"
      />

      <div className="fixed bottom-5 right-5 z-50">
        <ZoomControls
          scale={scale}
          onZoomIn={interactionHandlers.handleZoomIn}
          onZoomOut={interactionHandlers.handleZoomOut}
          onZoomChange={interactionHandlers.handleZoomChange}
        />
      </div>

      {(selectedItemIds.length > 0 || selectedConnectorId) && (
        <ContextualActionBar
          selectedItemIds={selectedItemIds}
          selectedItems={selectedItems}
          selectedConnectorId={selectedConnectorId}
          isGridSnapActive={interactionStateAndSetters.isGridSnapActive}
          isSuggestingGroups={isSuggestingGroups}
          isGeneratingGroupDraft={isGeneratingGroupDraft}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
          onDelete={handleDelete}
          onToggleGridSnap={() =>
            interactionStateAndSetters.setIsGridSnapActive((s) => !s)
          }
          onSuggestGroups={() => handleSuggestGroups(selectedItemIds)}
          onGenerateGroupDraft={() =>
            handleGenerateGroupDraft(
              selectedItemIds,
              (ids) => setSelectedItemIds(ids),
              (id) => setEditingItemId(id)
            )
          }
          onBringForward={() =>
            selectedItemIds.forEach((id) => updateZIndex(id, "forward"))
          }
          onBringToFront={() =>
            selectedItemIds.forEach((id) => updateZIndex(id, "front"))
          }
          onSendBackward={() =>
            selectedItemIds.forEach((id) => updateZIndex(id, "backward"))
          }
          onSendToBack={() =>
            selectedItemIds.forEach((id) => updateZIndex(id, "back"))
          }
          isDetailsPanelVisible={isDetailsPanelVisible}
          onToggleDetailsPanel={() => setIsDetailsPanelVisible((v) => !v)}
          className="z-50"
        />
      )}

      {detailsPanelEntity && isDetailsPanelVisible && (
        <DetailsPanel
          entity={detailsPanelEntity}
          onUpdateItem={handleItemUpdate}
          onUpdateConnector={handleConnectorUpdate}
          onClose={() => setIsDetailsPanelVisible(false)}
          onSummarizeText={(id) => handleAiTextEdit(id, "summarize")}
          onExpandText={(id) => handleAiTextEdit(id, "expand")}
          onRefineText={(id) => handleAiTextEdit(id, "refine")}
          onChangeTextTone={(id, tone) =>
            handleAiTextEdit(id, "change_tone", tone)
          }
          onAddKeywordParagraph={(id, keyword) =>
            handleAiTextEdit(id, "add_keyword", keyword)
          }
          onInformationSearch={(id, query) =>
            handleAiTextEdit(id, "search_info", query)
          }
          isGeneratingAIContentForThisItem={
            isGeneratingAIContentFor === (detailsPanelEntity as CanvasItem).id
          }
          className="z-50"
        />
      )}

      {contextMenuState && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          itemId={contextMenuState.itemId}
          connectorId={contextMenuState.connectorId}
          onClose={() => setContextMenuState(null)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onBringToFront={() =>
            contextMenuState.itemId &&
            updateZIndex(contextMenuState.itemId, "front")
          }
          onSendToBack={() =>
            contextMenuState.itemId &&
            updateZIndex(contextMenuState.itemId, "back")
          }
          onBringForward={() =>
            contextMenuState.itemId &&
            updateZIndex(contextMenuState.itemId, "forward")
          }
          onSendBackward={() =>
            contextMenuState.itemId &&
            updateZIndex(contextMenuState.itemId, "backward")
          }
          style={{ zIndex: 1000 }}
        />
      )}

      <AiHelpModal
        isOpen={isAiHelpModalVisible}
        onClose={() => setIsAiHelpModalVisible(false)}
        style={{ zIndex: 1000 }}
      />
      <OutlineModal
        isOpen={isOutlineModalOpen}
        onClose={() => setIsOutlineModalOpen(false)}
        onGenerate={handleGenerateOutline}
        isGenerating={isGeneratingOutline}
        style={{ zIndex: 1000 }}
      />
      <SocialPostModal
        isOpen={isSocialPostModalOpen}
        onClose={() => setIsSocialPostModalOpen(false)}
        onGenerate={handleGenerateSocialPost}
        isGenerating={isGeneratingSocialPost}
        style={{ zIndex: 1000 }}
      />
      <BrainstormModal
        isOpen={isBrainstormModalOpen}
        onClose={() => setIsBrainstormModalOpen(false)}
        onGenerate={handleGenerateBrainstormIdeas}
        onAddIdeaToCanvas={handleAddIdeaToCanvas}
        style={{ zIndex: 1000 }}
      />
      <AiExportModal
        isOpen={isAiExportModalOpen}
        onClose={() => setIsAiExportModalOpen(false)}
        onExport={handleExportWithAi}
        isExporting={isExportingWithAi}
        style={{ zIndex: 1000 }}
      />
      <KeywordAnalysisModal
        isOpen={isKeywordAnalysisModalOpen}
        onClose={() => setIsKeywordAnalysisModalOpen(false)}
        onGenerate={handleGenerateKeywordAnalysis}
        onAddKeywordToCanvas={handleAddIdeaToCanvas}
        isGenerating={isGeneratingKeywordAnalysis}
        currentInput={keywordAnalysisCurrentInput}
        lastGeneratedInput={keywordAnalysisLastGeneratedInput}
        results={keywordAnalysisResults}
        onInputUpdate={(value) => setKeywordAnalysisCurrentInput(value)}
        style={{ zIndex: 1000 }}
      />
      <AiChatAssistant
        isOpen={isChatAssistantOpen}
        onClose={() => setIsChatAssistantOpen(false)}
        messages={chatMessages}
        onSendMessage={(message) => handleSendChatMessage(message)}
        isSending={isSendingChatMessage}
        isGeneratingImage={isGeneratingImage}
        apiKeyError={apiKeyError}
        onOpenSelectKey={() => window.aistudio.openSelectKey()}
        onClearApiKeyError={() => setApiKeyError(null)}
        className="z-50"
      />
    </div>
  );
};

export default App;
