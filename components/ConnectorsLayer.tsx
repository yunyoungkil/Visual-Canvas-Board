import React from 'react';
import type { Connector, CanvasItem, Point, HandlePosition } from '../types';
import * as C from '../constants';

interface ConnectorsLayerProps {
  connectors: Connector[];
  items: CanvasItem[];
  getHandlePosition: (item: CanvasItem | { x: number; y: number; width: number; height: number }, position: HandlePosition) => Point;
  connectingState: { fromPos: Point; currentPos: Point } | null;
  hoveredConnectorId: string | null;
  selectedConnectorId: string | null;
  editingConnectorState: { id: string } | null;
  scale: number;
  onConnectorMouseEnter: (id: string) => void;
  onConnectorMouseLeave: () => void;
  onConnectorClick: (e: React.MouseEvent, id: string) => void;
  onConnectorDoubleClick: (conn: Connector, midpoint: Point, angle: number) => void;
}

const getControlPoints = (fromPos: Point, fromHandle: HandlePosition, toPos: Point, toHandle: HandlePosition) => {
    const curveFactor = 0.3;
    const dist = Math.hypot(toPos.x - fromPos.x, toPos.y - fromPos.y);
    const controlDist = Math.max(50, dist * curveFactor);

    let cp1 = { ...fromPos };
    let cp2 = { ...toPos };

    switch (fromHandle) {
        case 'top': cp1.y -= controlDist; break;
        case 'bottom': cp1.y += controlDist; break;
        case 'left': cp1.x -= controlDist; break;
        case 'right': cp1.x += controlDist; break;
    }

    switch (toHandle) {
        case 'top': cp2.y -= controlDist; break;
        case 'bottom': cp2.y += controlDist; break;
        case 'left': cp2.x -= controlDist; break;
        case 'right': cp2.x += controlDist; break;
    }
    
    return { cp1, cp2 };
};


const ConnectorsLayer: React.FC<ConnectorsLayerProps> = React.memo(({
  connectors,
  items,
  getHandlePosition,
  connectingState,
  hoveredConnectorId,
  selectedConnectorId,
  editingConnectorState,
  scale,
  onConnectorMouseEnter,
  onConnectorMouseLeave,
  onConnectorClick,
  onConnectorDoubleClick,
}) => {
  const itemMap = React.useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  
  // Create group bounds map
  const groupBoundsMap = React.useMemo(() => {
    const map = new Map<string, { x: number; y: number; width: number; height: number }>();
    const groupIds = [...new Set(items.map(item => item.groupId).filter(Boolean))];
    
    groupIds.forEach((groupId) => {
      const groupItems = items.filter(item => item.groupId === groupId);
      if (groupItems.length === 0) return;
      
      const minX = Math.min(...groupItems.map(item => item.x));
      const minY = Math.min(...groupItems.map(item => item.y));
      const maxX = Math.max(...groupItems.map(item => item.x + item.width));
      const maxY = Math.max(...groupItems.map(item => item.y + item.height));
      
      const padding = 20;
      map.set(`group-${groupId}`, {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      });
    });
    
    return map;
  }, [items]);
  
  const allHandles: HandlePosition[] = ['top', 'bottom', 'left', 'right'];

  return (
    <svg
      className="absolute"
      viewBox={`-${C.CANVAS_WORLD_SIZE / 2} -${C.CANVAS_WORLD_SIZE / 2} ${C.CANVAS_WORLD_SIZE} ${C.CANVAS_WORLD_SIZE}`}
      style={{
        overflow: 'visible',
        pointerEvents: 'none',
        width: C.CANVAS_WORLD_SIZE,
        height: C.CANVAS_WORLD_SIZE,
        top: -C.CANVAS_WORLD_SIZE / 2,
        left: -C.CANVAS_WORLD_SIZE / 2,
      }}
    >
      {connectors.map(conn => {
          const fromItem = itemMap.get(conn.fromId) || groupBoundsMap.get(conn.fromId);
          const toItem = itemMap.get(conn.toId) || groupBoundsMap.get(conn.toId);
          if (!fromItem || !toItem) return null;

          let bestPath = { fromHandle: allHandles[0], toHandle: allHandles[0], dist: Infinity };

          for (const fromHandle of allHandles) {
              for (const toHandle of allHandles) {
                  const fromPos = getHandlePosition(fromItem, fromHandle);
                  const toPos = getHandlePosition(toItem, toHandle);
                  const dist = Math.hypot(fromPos.x - toPos.x, fromPos.y - toPos.y);
                  if (dist < bestPath.dist) {
                      bestPath = { fromHandle, toHandle, dist };
                  }
              }
          }
          
          const fromPos = getHandlePosition(fromItem, bestPath.fromHandle);
          const toPos = getHandlePosition(toItem, bestPath.toHandle);
          const { cp1, cp2 } = getControlPoints(fromPos, bestPath.fromHandle, toPos, bestPath.toHandle);

          const pathData = `M ${fromPos.x} ${fromPos.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toPos.x} ${toPos.y}`;

          const isHovered = hoveredConnectorId === conn.id;
          const isEditing = editingConnectorState?.id === conn.id;
          const isSelected = selectedConnectorId === conn.id;
          
          const t = 0.5; // Midpoint of bezier curve
          const midpoint = {
              x: (1-t)**3*fromPos.x + 3*(1-t)**2*t*cp1.x + 3*(1-t)*t**2*cp2.x + t**3*toPos.x,
              y: (1-t)**3*fromPos.y + 3*(1-t)**2*t*cp1.y + 3*(1-t)*t**2*cp2.y + t**3*toPos.y
          };
          
          const derivative = {
              x: 3*(1-t)**2*(cp1.x-fromPos.x) + 6*(1-t)*t*(cp2.x-cp1.x) + 3*t**2*(toPos.x-cp2.x),
              y: 3*(1-t)**2*(cp1.y-fromPos.y) + 6*(1-t)*t*(cp2.y-cp1.y) + 3*t**2*(toPos.y-cp2.y)
          };

          const angle = Math.atan2(derivative.y, derivative.x) * 180 / Math.PI;
          
          let effectiveAngle = angle;
          if (effectiveAngle < -90 || effectiveAngle > 90) {
            effectiveAngle += 180;
          }

          const strokeWidth = conn.strokeWidth || 3;
          const labelFontSize = conn.labelFontSize || 14;
          
          const getStrokeDashArray = () => {
            const style = conn.style || 'solid';
            if (style === 'dashed') return `8 8`;
            if (style === 'dotted') return `2 6`;
            return 'none';
          };
          
          const color = isSelected ? '#3b82f6' : (conn.color || '#4b5563');

          return (
            <g key={conn.id} data-id={conn.id} className="connector-group pointer-events-auto cursor-pointer" onMouseEnter={() => onConnectorMouseEnter(conn.id)} onMouseLeave={onConnectorMouseLeave} onClick={(e) => onConnectorClick(e, conn.id)} onDoubleClick={() => onConnectorDoubleClick(conn, midpoint, angle)}>
                <path d={pathData} stroke="transparent" strokeWidth="20" fill="none"/>
                <path 
                    d={pathData}
                    strokeWidth={strokeWidth}
                    stroke={color}
                    fill="none"
                    strokeDasharray={getStrokeDashArray()}
                    markerEnd={`url(#arrow-${conn.id})`}
                />
                <defs>
                  <marker id={`arrow-${conn.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                  </marker>
                </defs>

                {conn.label && !isEditing && (
                    <text x={midpoint.x} y={midpoint.y} dy={-5} transform={`rotate(${effectiveAngle},${midpoint.x},${midpoint.y})`} textAnchor="middle" fill={conn.labelColor || '#000000'} style={{ fontSize: `${labelFontSize}px`, paintOrder: 'stroke', stroke: isHovered || isSelected ? '#e5e7eb' : 'white', strokeWidth: `4px`, strokeLinejoin: 'round' }}>
                        {conn.label}
                    </text>
                )}
                {!conn.label && isHovered && !isEditing && (
                    <text x={midpoint.x} y={midpoint.y} dy={-5} transform={`rotate(${effectiveAngle},${midpoint.x},${midpoint.y})`} textAnchor="middle" fill="#6b7280" className="opacity-80" style={{ fontSize: `12px`, fontStyle: 'italic' }}>
                        더블클릭하여 라벨 추가
                    </text>
                )}
            </g>
          )
      })}
      {connectingState && <line x1={connectingState.fromPos.x} y1={connectingState.fromPos.y} x2={connectingState.currentPos.x} y2={connectingState.currentPos.y} strokeWidth="3" stroke="#3b82f6" className="opacity-70" strokeDasharray={`5 5`}/>}
    </svg>
  );
});

export default ConnectorsLayer;