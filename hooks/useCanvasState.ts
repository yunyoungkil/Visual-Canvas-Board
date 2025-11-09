import { useState, useCallback, useRef, useEffect } from "react";
import type { CanvasItem, Connector, Point, ImageItem } from "../types";
import * as C from "../constants";
import { indexedDBStorage } from "../utils/indexedDBStorage";

export const useCanvasState = () => {
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [scale, setScale] = useState(0.3);
  const [viewOffset, setViewOffset] = useState<Point>({ x: 0, y: 0 });
  const [groupMetadata, setGroupMetadata] = useState<
    Map<string, { color: string; label: string }>
  >(new Map());

  const history = useRef<{ items: CanvasItem[]; connectors: Connector[] }[]>(
    []
  );
  const historyIndex = useRef(-1);
  const [historyVersion, setHistoryVersion] = useState(0);

  const maxZIndex = useRef(1);
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<number | null>(null);

  const commitState = useCallback(
    (newItems: CanvasItem[], newConnectors: Connector[], isUndoable = true) => {
      if (!isUndoable && historyIndex.current >= 0) {
        history.current[historyIndex.current] = {
          items: JSON.parse(JSON.stringify(newItems)),
          connectors: JSON.parse(JSON.stringify(newConnectors)),
        };
      } else {
        const newHistory = history.current.slice(0, historyIndex.current + 1);
        newHistory.push({
          items: JSON.parse(JSON.stringify(newItems)),
          connectors: JSON.parse(JSON.stringify(newConnectors)),
        });
        history.current = newHistory;
        historyIndex.current = newHistory.length - 1;
      }
      setHistoryVersion((v) => v + 1);
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const state = history.current[historyIndex.current];
      setItems(state.items);
      setConnectors(state.connectors);
      setHistoryVersion((v) => v + 1);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      const state = history.current[historyIndex.current];
      setItems(state.items);
      setConnectors(state.connectors);
      setHistoryVersion((v) => v + 1);
    }
  }, []);

  useEffect(() => {
    const loadState = async () => {
      try {
        // IndexedDB에서 로드 시도
        const savedState = await indexedDBStorage.load(C.LOCAL_STORAGE_KEY);

        if (savedState) {
          console.log("[useCanvasState] IndexedDB에서 상태 로드");
          let maxZ = 0;
          const itemsToLoad = savedState.items || [];
          const itemsWithDefaults = itemsToLoad.map(
            (item: CanvasItem, index: number) => {
              const zIndex = item.zIndex ?? index + 1;
              if (zIndex > maxZ) maxZ = zIndex;
              const hydratedItem: any = { ...item, zIndex };
              if (hydratedItem.opacity === undefined) hydratedItem.opacity = 1;
              if (hydratedItem.borderRadius === undefined)
                hydratedItem.borderRadius =
                  hydratedItem.type === "shape" || hydratedItem.type === "image"
                    ? 4
                    : 0;
              if (
                (hydratedItem.type === "text" ||
                  hydratedItem.type === "shape") &&
                !hydratedItem.background
              ) {
                hydratedItem.background = { type: "solid", color: "#ffffff" };
              }
              return hydratedItem as CanvasItem;
            }
          );
          maxZIndex.current = maxZ + 1;
          const connectorsToLoad = savedState.connectors || [];

          // Load group metadata
          if (savedState.groupMetadata) {
            console.log(
              "[useCanvasState] Loading groupMetadata:",
              savedState.groupMetadata
            );
            const metadataMap = new Map<
              string,
              { color: string; label: string }
            >();
            Object.entries(savedState.groupMetadata).forEach(([key, value]) => {
              metadataMap.set(key, value as { color: string; label: string });
            });
            setGroupMetadata(metadataMap);
            console.log(
              "[useCanvasState] Loaded groupMetadata Map:",
              metadataMap
            );
          }

          setItems(itemsWithDefaults);
          setConnectors(connectorsToLoad);
          setScale(savedState.scale || 0.3);
          setViewOffset(
            savedState.viewOffset || {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            }
          );
          commitState(itemsWithDefaults, connectorsToLoad);

          // 저장 용량 정보 표시
          const storageInfo = await indexedDBStorage.getStorageInfo();
          const usageMB = (storageInfo.usage / 1024 / 1024).toFixed(2);
          const quotaMB = (storageInfo.quota / 1024 / 1024).toFixed(2);
          console.log(`[IndexedDB] 사용량: ${usageMB}MB / ${quotaMB}MB`);
        } else {
          console.log("[useCanvasState] 저장된 상태 없음, 초기화");
          setViewOffset({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          });
          commitState([], []);
        }
      } catch (error) {
        console.error("[useCanvasState] 상태 로드 실패:", error);
        setViewOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        commitState([], []);
      }
    };

    loadState();
  }, [commitState]);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        // Convert Map to plain object for JSON serialization
        const groupMetadataObj: Record<
          string,
          { color: string; label: string }
        > = {};
        groupMetadata.forEach((value, key) => {
          groupMetadataObj[key] = value;
        });

        const stateToSave = {
          items, // 모든 이미지 포함
          connectors,
          viewOffset,
          scale,
          groupMetadata: groupMetadataObj,
        };

        // IndexedDB에 저장 (용량 제한 없음)
        await indexedDBStorage.save(C.LOCAL_STORAGE_KEY, stateToSave);

        const storageInfo = await indexedDBStorage.getStorageInfo();
        const usageMB = (storageInfo.usage / 1024 / 1024).toFixed(2);
        console.log(`[IndexedDB] 저장 완료 (${usageMB}MB 사용 중)`);
      } catch (error) {
        console.error("[useCanvasState] IndexedDB 저장 실패:", error);
      }
    }, 500);
  }, [items, connectors, viewOffset, scale, groupMetadata]);

  const handleItemUpdate = useCallback(
    (
      itemId: string,
      updates: Partial<CanvasItem>,
      shouldCommitUpdate = true
    ) => {
      setItems((prevItems) => {
        const newItems = prevItems.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ) as CanvasItem[];
        if (shouldCommitUpdate) {
          commitState(newItems, connectors);
        }
        return newItems;
      });
    },
    [connectors, commitState]
  );

  const handleConnectorUpdate = useCallback(
    (connectorId: string, updates: Partial<Connector>) => {
      setConnectors((prevConnectors) => {
        const newConnectors = prevConnectors.map((c) =>
          c.id === connectorId ? { ...c, ...updates } : c
        );
        commitState(items, newConnectors);
        return newConnectors;
      });
    },
    [items, commitState]
  );

  const handleClearCanvas = useCallback(() => {
    if (
      window.confirm(
        "정말로 캔버스 전체를 지우시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      setItems([]);
      setConnectors([]);
      setViewOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setScale(0.3);
      commitState([], []);
    }
  }, [commitState]);

  const updateZIndex = useCallback(
    (itemId: string, direction: "front" | "back" | "forward" | "backward") => {
      setItems((currentItems) => {
        const sortedItems = [...currentItems].sort(
          (a, b) => a.zIndex - b.zIndex
        );
        const itemIndex = sortedItems.findIndex((i) => i.id === itemId);
        if (itemIndex === -1) return currentItems;

        const [item] = sortedItems.splice(itemIndex, 1);

        switch (direction) {
          case "front":
            sortedItems.push(item);
            break;
          case "back":
            sortedItems.unshift(item);
            break;
          case "forward":
            if (itemIndex < sortedItems.length)
              sortedItems.splice(itemIndex + 1, 0, item);
            else sortedItems.push(item);
            break;
          case "backward":
            if (itemIndex > 0) sortedItems.splice(itemIndex - 1, 0, item);
            else sortedItems.unshift(item);
            break;
        }

        const newItems = sortedItems.map((it, idx) => ({
          ...it,
          zIndex: idx + 1,
        }));
        maxZIndex.current = newItems.length + 1;
        commitState(newItems, connectors);
        return newItems;
      });
    },
    [connectors, commitState]
  );

  return {
    items,
    setItems,
    connectors,
    setConnectors,
    scale,
    setScale,
    viewOffset,
    setViewOffset,
    groupMetadata,
    setGroupMetadata,
    history: { current: historyIndex.current, length: history.current.length },
    maxZIndex,
    isInitialLoad,
    commitState,
    handleUndo,
    handleRedo,
    handleItemUpdate,
    handleConnectorUpdate,
    handleClearCanvas,
    updateZIndex,
  };
};
