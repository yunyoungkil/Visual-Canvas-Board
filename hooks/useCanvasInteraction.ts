import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { CanvasItem, Connector, Point, SnapLine, HandlePosition, ShapeType, TextItem, ImageItem, ShapeItem } from '../types';
import * as C from '../constants';

type CanvasStateAndActions = {
    items: CanvasItem[];
    connectors: Connector[];
    scale: number;
    viewOffset: Point;
    maxZIndex: React.MutableRefObject<number>;
    setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
    setConnectors: React.Dispatch<React.SetStateAction<Connector[]>>;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    setViewOffset: React.Dispatch<React.SetStateAction<Point>>;
    commitState: (newItems: CanvasItem[], newConnectors: Connector[], isUndoable?: boolean) => void;
    handleUndo: () => void;
    handleRedo: () => void;
    selectedItemIds: string[];
    setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export const useCanvasInteraction = ({
    items, connectors, scale, viewOffset, maxZIndex,
    setItems, setConnectors, setScale, setViewOffset, commitState, handleUndo, handleRedo,
    selectedItemIds, setSelectedItemIds
}: CanvasStateAndActions) => {
    const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
    const [draggingState, setDraggingState] = useState<{ id: string; dragStartPos: Point; itemStartPositions: Map<string, Point>; } | null>(null);
    const [resizingState, setResizingState] = useState<{ itemId: string; startPos: Point; startWidth: number; startHeight: number; aspectRatio: number; } | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
    const [connectingState, setConnectingState] = useState<{ fromId: string; fromHandle: HandlePosition; fromPos: Point; currentPos: Point; } | null>(null);
    const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
    const [isSpacePanning, setIsSpacePanning] = useState(false);
    const [isPanModeActive, setIsPanModeActive] = useState(false);
    const [isTextModeActive, setIsTextModeActive] = useState(false);
    const [shapeToAdd, setShapeToAdd] = useState<ShapeType | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingConnectorState, setEditingConnectorState] = useState<{ id: string; text: string; pos: Point; angle: number; color: string; fontSize: number; } | null>(null);
    const [panningState, setPanningState] = useState<{ startViewOffset: Point; startMousePos: Point; } | null>(null);
    const [hoveredConnectorId, setHoveredConnectorId] = useState<string | null>(null);
    const [contextMenuState, setContextMenuState] = useState<{ x: number; y: number; itemId: string | null; connectorId: string | null; } | null>(null);
    const [hoveredItemIdForConnection, setHoveredItemIdForConnection] = useState<string | null>(null);
    const [isGridSnapActive, setIsGridSnapActive] = useState(true);
    
    const clickStartPos = useRef<Point | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);
    const clipboardRef = useRef<Omit<CanvasItem, 'id' | 'zIndex'>[]>([]);

    const screenToCanvas = useCallback((pos: Point): Point => ({ x: (pos.x - viewOffset.x) / scale, y: (pos.y - viewOffset.y) / scale }), [viewOffset, scale]);
    const canvasToScreen = useCallback((pos: Point): Point => ({ x: pos.x * scale + viewOffset.x, y: pos.y * scale + viewOffset.y }), [viewOffset, scale]);
    const snapToGrid = useCallback((value: number): number => isGridSnapActive ? Math.round(value / C.GRID_SIZE) * C.GRID_SIZE : value, [isGridSnapActive]);
    
    const getHandlePosition = useCallback((item: CanvasItem, position: HandlePosition): Point => {
        switch (position) {
            case 'top': return { x: item.x + item.width / 2, y: item.y };
            case 'bottom': return { x: item.x + item.width / 2, y: item.y + item.height };
            case 'left': return { x: item.x, y: item.y + item.height / 2 };
            case 'right': return { x: item.x + item.width, y: item.y + item.height / 2 };
        }
    }, []);

    const zoomToPoint = useCallback((newScale: number, point: Point) => {
        const mouseCanvasPosBefore = screenToCanvas(point);
        setViewOffset({ x: point.x - mouseCanvasPosBefore.x * newScale, y: point.y - mouseCanvasPosBefore.y * newScale });
        setScale(newScale);
    }, [screenToCanvas, setScale, setViewOffset]);
    
    const handleZoomIn = useCallback(() => canvasRef.current && zoomToPoint(Math.min(C.MAX_ZOOM, scale + 0.1), { x: canvasRef.current.clientWidth / 2, y: canvasRef.current.clientHeight / 2 }), [scale, zoomToPoint]);
    const handleZoomOut = useCallback(() => canvasRef.current && zoomToPoint(Math.max(C.MIN_ZOOM, scale - 0.1), { x: canvasRef.current.clientWidth / 2, y: canvasRef.current.clientHeight / 2 }), [scale, zoomToPoint]);
    const handleZoomChange = useCallback((newScale: number) => canvasRef.current && zoomToPoint(newScale, { x: canvasRef.current.clientWidth / 2, y: canvasRef.current.clientHeight / 2 }), [zoomToPoint]);
    
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = Math.max(C.MIN_ZOOM, Math.min(C.MAX_ZOOM, scale * (1 - e.deltaY * 0.002)));
        zoomToPoint(newScale, { x: e.clientX, y: e.clientY });
    }, [scale, zoomToPoint]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const newImage: ImageItem = {
                            id: crypto.randomUUID(),
                            type: 'image',
                            src: event.target?.result as string,
                            x: snapToGrid(canvasPos.x - img.width / 2),
                            y: snapToGrid(canvasPos.y - img.height / 2),
                            width: img.width,
                            height: img.height,
                            zIndex: maxZIndex.current++,
                            opacity: 1,
                            borderRadius: 4,
                        };
                        const newItems = [...items, newImage];
                        commitState(newItems, connectors);
                        setItems(newItems);
                    };
                    img.src = event.target?.result as string;
                };
                reader.readAsDataURL(file);
            }
        }
    }, [items, connectors, commitState, screenToCanvas, snapToGrid, maxZIndex, setItems]);
    
    const handleResizeMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        window.getSelection()?.empty();
        const item = items.find(i => i.id === itemId);
        if (!item) return;
        setResizingState({
            itemId,
            startPos: { x: e.clientX, y: e.clientY },
            startWidth: item.width,
            startHeight: item.height,
            aspectRatio: item.type === 'image' ? item.width / item.height : 0,
        });
    }, [items]);
    
    const handleItemMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, id: string) => {
        e.stopPropagation();
        clickStartPos.current = { x: e.clientX, y: e.clientY };
        window.getSelection()?.empty();

        if (editingItemId && editingItemId !== id) {
            setEditingItemId(null);
        }
        
        const clickedItem = items.find(item => item.id === id);
        if (!clickedItem) return;

        let newSelectionIds: string[];
        
        const interactionUnitIds = clickedItem.groupId 
          ? items.filter(i => i.groupId === clickedItem.groupId).map(i => i.id)
          : [id];
        
        const isUnitSelected = interactionUnitIds.every(uid => selectedItemIds.includes(uid));
        
        if (e.shiftKey) {
            if (isUnitSelected) {
                newSelectionIds = selectedItemIds.filter(sid => !interactionUnitIds.includes(sid));
            } else {
                newSelectionIds = [...new Set([...selectedItemIds, ...interactionUnitIds])];
            }
        } else {
            if (!isUnitSelected) {
                newSelectionIds = interactionUnitIds;
            } else {
                newSelectionIds = selectedItemIds;
            }
        }
        
        setSelectedItemIds(newSelectionIds);
        setSelectedConnectorId(null);
        
        const dragSet = new Set<string>();
        
        const primaryDragUnit = clickedItem.groupId 
            ? items.filter(i => i.groupId === clickedItem.groupId).map(i => i.id)
            : [id];

        const shouldDragSelection = primaryDragUnit.every(uid => newSelectionIds.includes(uid));
        const itemsToConsiderForDrag = shouldDragSelection ? newSelectionIds : primaryDragUnit;

        itemsToConsiderForDrag.forEach(dragId => {
            const item = items.find(i => i.id === dragId);
            if (item?.groupId) {
                items.filter(i => i.groupId === item.groupId).forEach(groupItem => dragSet.add(groupItem.id));
            } else if (item) {
                dragSet.add(item.id);
            }
        });

        const idsToDrag = Array.from(dragSet);
        
        const startPositions = new Map<string, Point>();
        items.forEach(item => {
            if (idsToDrag.includes(item.id)) {
                startPositions.set(item.id, { x: item.x, y: item.y });
            }
        });

        setDraggingState({
            id,
            dragStartPos: screenToCanvas({ x: e.clientX, y: e.clientY }),
            itemStartPositions: startPositions,
        });
    }, [items, selectedItemIds, editingItemId, screenToCanvas, setEditingItemId, setSelectedItemIds]);


    const handleItemDoubleClick = useCallback((item: CanvasItem) => {
        if (item.type === 'text' || item.type === 'shape') {
            setEditingItemId(item.id);
        }
    }, []);
    
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('.canvas-item') || (e.target as HTMLElement).closest('.tiptap-toolbar')) return;
        clickStartPos.current = { x: e.clientX, y: e.clientY };
        window.getSelection()?.empty();

        if (isPanModeActive || isSpacePanning) {
            setPanningState({ startViewOffset: viewOffset, startMousePos: { x: e.clientX, y: e.clientY } });
            return;
        }

        const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });

        if (isTextModeActive) {
            const defaultWidth = 150;
            const defaultHeight = 40;
            const newItem: TextItem = {
                id: crypto.randomUUID(), type: 'text', content: '<p>텍스트 입력</p>',
                x: snapToGrid(canvasPos.x - defaultWidth / 2),
                y: snapToGrid(canvasPos.y - defaultHeight / 2),
                width: defaultWidth, height: defaultHeight, color: '#000000', fontSize: 16,
                background: { type: 'solid', color: '#ffffff' }, textAlign: 'left',
                zIndex: maxZIndex.current++, opacity: 1, borderRadius: 4,
            };
            const newItems = [...items, newItem];
            commitState(newItems, connectors);
            setItems(newItems);
            setSelectedItemIds([newItem.id]);
            setEditingItemId(newItem.id);
            setIsTextModeActive(false);
            return;
        }
        
        if (shapeToAdd) {
            const defaultWidth = 150;
            const defaultHeight = 100;
            const newShape: ShapeItem = {
                id: crypto.randomUUID(), type: 'shape', shape: shapeToAdd,
                x: snapToGrid(canvasPos.x - defaultWidth / 2),
                y: snapToGrid(canvasPos.y - defaultHeight / 2),
                width: defaultWidth, height: defaultHeight,
                content: '', color: '#000000', fontSize: 16, textAlign: 'center',
                background: { type: 'solid', color: '#ffffff' },
                border: { width: 2, style: 'solid', color: '#000000' },
                zIndex: maxZIndex.current++, opacity: 1, borderRadius: 4,
            };
            const newItems = [...items, newShape];
            commitState(newItems, connectors);
            setItems(newItems);
            setSelectedItemIds([newShape.id]);
            setShapeToAdd(null);
            return;
        }

        setSelectionBox({ start: canvasPos, end: canvasPos });
        setSelectedItemIds([]);
        setSelectedConnectorId(null);
    }, [isPanModeActive, isSpacePanning, viewOffset, isTextModeActive, shapeToAdd, items, connectors, commitState, snapToGrid, screenToCanvas, maxZIndex, setItems, setSelectedItemIds]);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        const currentCanvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });

        if (panningState) {
            const dx = e.clientX - panningState.startMousePos.x;
            const dy = e.clientY - panningState.startMousePos.y;
            setViewOffset({ x: panningState.startViewOffset.x + dx, y: panningState.startViewOffset.y + dy });
        } else if (draggingState) {
            const dx = currentCanvasPos.x - draggingState.dragStartPos.x;
            const dy = currentCanvasPos.y - draggingState.dragStartPos.y;
            let newLines: SnapLine[] = [];
            
            const movingItems = items.filter(i => draggingState.itemStartPositions.has(i.id));
            const staticItems = items.filter(i => !draggingState.itemStartPositions.has(i.id));

            const updatedItems = items.map(item => {
                const startPos = draggingState.itemStartPositions.get(item.id);
                if (startPos) {
                    let newX = startPos.x + dx;
                    let newY = startPos.y + dy;
                    if (isGridSnapActive) {
                        newX = snapToGrid(newX);
                        newY = snapToGrid(newY);
                    }
                    return { ...item, x: newX, y: newY };
                }
                return item;
            });
            setItems(updatedItems);
            setSnapLines(newLines);

        } else if (resizingState) {
            const item = items.find(i => i.id === resizingState.itemId);
            if (!item) return;

            const dx = (e.clientX - resizingState.startPos.x) / scale;
            const dy = (e.clientY - resizingState.startPos.y) / scale;

            let newWidth = Math.max(20, resizingState.startWidth + dx);
            let newHeight = Math.max(20, resizingState.startHeight + dy);

            if (resizingState.aspectRatio) {
                newHeight = newWidth / resizingState.aspectRatio;
            }

            setItems(prev => prev.map(i => i.id === resizingState.itemId ? { ...i, width: newWidth, height: newHeight } : i));

        } else if (selectionBox) {
            setSelectionBox({ ...selectionBox, end: currentCanvasPos });
        } else if (connectingState) {
            const { fromId, fromHandle } = connectingState;
            const fromItem = items.find(i => i.id === fromId);
            if (!fromItem) return;

            let closestHandle: { itemId: string; handle: HandlePosition; pos: Point; dist: number } | null = null;
            
            items.forEach(item => {
                if (item.id === fromId) return;
                (['top', 'bottom', 'left', 'right'] as HandlePosition[]).forEach(handle => {
                    const handlePos = getHandlePosition(item, handle);
                    const dist = Math.hypot(currentCanvasPos.x - handlePos.x, currentCanvasPos.y - handlePos.y);
                    if (dist < C.HANDLE_SNAP_RADIUS && (!closestHandle || dist < closestHandle.dist)) {
                        closestHandle = { itemId: item.id, handle, pos: handlePos, dist };
                    }
                });
            });

            if (closestHandle) {
                setHoveredItemIdForConnection(closestHandle.itemId);
                setConnectingState({ ...connectingState, currentPos: closestHandle.pos });
            } else {
                setHoveredItemIdForConnection(null);
                setConnectingState({ ...connectingState, currentPos: currentCanvasPos });
            }
        }
    }, [draggingState, resizingState, selectionBox, panningState, connectingState, items, scale, screenToCanvas, snapToGrid, isGridSnapActive, setViewOffset, setItems, getHandlePosition]);
    
    const handleConnectorLabelEdit = useCallback((conn: Connector, midpoint: Point, angle: number) => {
        setEditingConnectorState({ id: conn.id, text: conn.label || '', pos: canvasToScreen(midpoint), angle, color: conn.labelColor || '#000000', fontSize: conn.labelFontSize || 14 });
    }, [canvasToScreen]);
    
    const handleMouseUp = useCallback((e: React.MouseEvent | MouseEvent, itemId?: string) => {
        setSnapLines([]);
        
        if (draggingState) {
            commitState(items, connectors);
            setDraggingState(null);
        }
        if (resizingState) {
            commitState(items, connectors);
            setResizingState(null);
        }
        if (panningState) {
            setPanningState(null);
        }
        if (selectionBox) {
            const { start, end } = selectionBox;
            const x1 = Math.min(start.x, end.x), x2 = Math.max(start.x, end.x);
            const y1 = Math.min(start.y, end.y), y2 = Math.max(start.y, end.y);
            const selected = items.filter(item => item.x < x2 && item.x + item.width > x1 && item.y < y2 && item.y + item.height > y1);
            setSelectedItemIds(selected.map(item => item.id));
            setSelectionBox(null);
        }
        if (connectingState) {
            const { fromId, fromHandle, currentPos } = connectingState;
            let closestHandle: { itemId: string; handle: HandlePosition; dist: number } | null = null;
            
            items.forEach(item => {
                if (item.id === fromId) return;
                (['top', 'bottom', 'left', 'right'] as HandlePosition[]).forEach(handle => {
                    const handlePos = getHandlePosition(item, handle);
                    const dist = Math.hypot(currentPos.x - handlePos.x, currentPos.y - handlePos.y);
                    if (dist < C.HANDLE_SNAP_RADIUS && (!closestHandle || dist < closestHandle.dist)) {
                        closestHandle = { itemId: item.id, handle, dist };
                    }
                });
            });

            if (closestHandle) {
                const newConnector: Connector = {
                    id: crypto.randomUUID(),
                    fromId: fromId,
                    toId: closestHandle.itemId,
                };
                const newConnectors = [...connectors, newConnector];
                commitState(items, newConnectors);
                setConnectors(newConnectors);
            }
            setConnectingState(null);
            setHoveredItemIdForConnection(null);
        }
        
        const endPos = { x: e.clientX, y: e.clientY };
        const isSimpleClick = clickStartPos.current && Math.hypot(endPos.x - clickStartPos.current.x, endPos.y - clickStartPos.current.y) < 5;
        
        if (isSimpleClick && !itemId && !(e.target as HTMLElement).closest('.canvas-item')) {
            setSelectedItemIds([]);
            setSelectedConnectorId(null);
            setEditingItemId(null);
            window.getSelection()?.empty();
        }

        clickStartPos.current = null;
    }, [draggingState, resizingState, selectionBox, connectingState, items, connectors, commitState, getHandlePosition, panningState, setSelectedItemIds]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
        const handleGlobalMouseUp = (e: MouseEvent) => handleMouseUp(e);
        if (draggingState || selectionBox || resizingState || panningState || connectingState) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [draggingState, selectionBox, resizingState, panningState, connectingState, handleMouseMove, handleMouseUp]);
    
    const handleContentUpdate = useCallback((id: string, content: string, shouldCommit = true, finalHeight?: number) => {
        const newItems = items.map(item => {
            if (item.id === id && (item.type === 'text' || item.type === 'shape')) {
                const updatedItem = { ...item, content };
                if (finalHeight) {
                    updatedItem.height = finalHeight;
                }
                return updatedItem;
            }
            return item;
        });
        if (shouldCommit) commitState(newItems as CanvasItem[], connectors);
        setItems(newItems as CanvasItem[]);
        setEditingItemId(null);
    }, [items, connectors, commitState, setItems]);
    
    const handleConnectorLabelUpdate = useCallback((id: string, updates: { text: string; color: string; fontSize: number }) => {
        const newConnectors = connectors.map(c => c.id === id ? { ...c, label: updates.text, labelColor: updates.color, labelFontSize: updates.fontSize } : c);
        commitState(items, newConnectors);
        setConnectors(newConnectors);
        setEditingConnectorState(null);
    }, [items, connectors, commitState, setConnectors]);

    const handleGroup = useCallback(() => {
        if (selectedItemIds.length < 2) return;
        const groupId = crypto.randomUUID();
        const newItems = items.map(item => selectedItemIds.includes(item.id) ? { ...item, groupId } : item);
        commitState(newItems, connectors);
        setItems(newItems);
    }, [selectedItemIds, items, connectors, commitState, setItems]);

    const handleUngroup = useCallback(() => {
        const newItems = items.map(item => selectedItemIds.includes(item.id) ? { ...item, groupId: null } : item);
        commitState(newItems, connectors);
        setItems(newItems);
    }, [selectedItemIds, items, connectors, commitState, setItems]);
    
    const handleDelete = useCallback(() => {
        const idsToDelete = new Set(selectedItemIds);
        
        if (editingItemId && idsToDelete.has(editingItemId)) {
            setEditingItemId(null);
        }

        const newItems = items.filter(item => !idsToDelete.has(item.id));
        const newConnectors = connectors.filter(conn => !idsToDelete.has(conn.fromId) && !idsToDelete.has(conn.toId) && conn.id !== selectedConnectorId);
        commitState(newItems, newConnectors);
        setItems(newItems);
        setConnectors(newConnectors);
        setSelectedItemIds([]);
        setSelectedConnectorId(null);
        if (contextMenuState) setContextMenuState(null);
    }, [selectedItemIds, selectedConnectorId, items, connectors, commitState, contextMenuState, setItems, setConnectors, setSelectedItemIds, editingItemId]);
    
    const handleCopy = useCallback(() => {
        const itemsToCopy = items.filter(item => selectedItemIds.includes(item.id));
        clipboardRef.current = itemsToCopy.map(({ id, zIndex, ...rest }) => rest);
        if (contextMenuState) setContextMenuState(null);
    }, [items, selectedItemIds, contextMenuState]);

    const handlePaste = useCallback(() => {
        if (clipboardRef.current.length === 0) return;
        const pastePos = contextMenuState ? screenToCanvas({ x: contextMenuState.x, y: contextMenuState.y }) : {x: 0, y: 0};
        const newItems: CanvasItem[] = clipboardRef.current.map((itemToPaste, index) => {
            return {
                ...itemToPaste,
                id: crypto.randomUUID(),
                x: pastePos.x + index * C.DUPLICATION_OFFSET,
                y: pastePos.y + index * C.DUPLICATION_OFFSET,
                zIndex: maxZIndex.current++,
            } as CanvasItem;
        });
        const allNewItems = [...items, ...newItems];
        commitState(allNewItems, connectors);
        setItems(allNewItems);
        setSelectedItemIds(newItems.map(item => item.id));
        if (contextMenuState) setContextMenuState(null);
    }, [items, connectors, commitState, screenToCanvas, contextMenuState, maxZIndex, setItems, setSelectedItemIds]);

    const handleDuplicate = useCallback(() => {
        const itemsToDuplicate = items.filter(item => selectedItemIds.includes(item.id));
        const newItems: CanvasItem[] = itemsToDuplicate.map(item => ({
            ...item,
            id: crypto.randomUUID(),
            x: item.x + C.DUPLICATION_OFFSET,
            y: item.y + C.DUPLICATION_OFFSET,
            zIndex: maxZIndex.current++,
        }));
        const allNewItems = [...items, ...newItems];
        commitState(allNewItems, connectors);
        setItems(allNewItems);
        setSelectedItemIds(newItems.map(item => item.id));
        if (contextMenuState) setContextMenuState(null);
    }, [selectedItemIds, items, connectors, maxZIndex, commitState, contextMenuState, setItems, setSelectedItemIds]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingItemId || (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).closest('.ProseMirror')) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCtrl = isMac ? e.metaKey : e.ctrlKey;

            if (e.key === ' ' && !isSpacePanning) { e.preventDefault(); setIsSpacePanning(true); }
            if (e.key === 'Backspace' || e.key === 'Delete') handleDelete();
            if (isCtrl && e.key === 'z') handleUndo();
            if (isCtrl && e.key === 'y') handleRedo();
            if (isCtrl && e.key === 'c') handleCopy();
            if (isCtrl && e.key === 'v') handlePaste();
            if (isCtrl && e.key === 'd') { e.preventDefault(); handleDuplicate(); }
            if (isCtrl && e.key === 'g') { e.preventDefault(); handleGroup(); }
            if (isCtrl && e.shiftKey && e.key === 'G') { e.preventDefault(); handleUngroup(); }
            if (e.key.toLowerCase() === 'h') setIsPanModeActive(p => !p);
            if (e.key.toLowerCase() === 't') setIsTextModeActive(p => !p);
            if (e.key.toLowerCase() === 's') setShapeToAdd('rectangle');
            if (e.key.toLowerCase() === 'b') setIsGridSnapActive(s => !s);
            if (e.key === 'Escape') {
                setConnectingState(null);
                setSelectionBox(null);
                setContextMenuState(null);
                setEditingConnectorState(null);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsSpacePanning(false); };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleUndo, handleRedo, handleCopy, handlePaste, handleDuplicate, handleDelete, handleGroup, handleUngroup, editingItemId, isSpacePanning, setIsPanModeActive, setIsTextModeActive, setShapeToAdd, setIsGridSnapActive, setConnectingState, setSelectionBox, setContextMenuState, setEditingConnectorState]);

    useEffect(() => {
        document.body.style.userSelect = (draggingState || resizingState || connectingState || selectionBox || panningState) ? 'none' : 'auto';
    }, [draggingState, resizingState, connectingState, selectionBox, panningState]);

    return {
        canvasRef, exportRef,
        selectedConnectorId, setSelectedConnectorId,
        snapLines, selectionBox, isSpacePanning, isPanModeActive, isTextModeActive, shapeToAdd, editingItemId,
        setEditingItemId,
        editingConnectorState, panningState, hoveredConnectorId, contextMenuState, hoveredItemIdForConnection,
        setShapeToAdd, setIsPanModeActive, setIsTextModeActive, setContextMenuState,
        handleWheel, handleDragOver, handleDrop, handleItemMouseDown, handleMouseUp, handleItemDoubleClick,
        handleResizeMouseDown, onConnectionStart: (e: React.MouseEvent, fromId: string, fromHandle: HandlePosition, fromPos: Point) => { e.preventDefault(); e.stopPropagation(); window.getSelection()?.empty(); setConnectingState({ fromId, fromHandle, fromPos, currentPos: fromPos }); },
        handleContentUpdate, handleCanvasMouseDown, handleConnectorLabelEdit,
        handleGroup, handleUngroup, handleDelete, handleCopy, handlePaste, handleDuplicate, handleConnectorLabelUpdate,
        interactionStateAndSetters: {
            setHoveredConnectorId, setEditingConnectorState, isGridSnapActive, setIsGridSnapActive,
            connectingState
        },
        interactionHandlers: {
            getHandlePosition, handleZoomIn, handleZoomOut, handleZoomChange,
            canvasToScreen, screenToCanvas
        }
    };
};