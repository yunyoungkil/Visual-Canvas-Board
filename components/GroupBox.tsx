import React from "react";
import type { CanvasItem, Point, HandlePosition } from "../types";

interface GroupBoxProps {
  groupId: string;
  items: CanvasItem[];
  color: string;
  label: string;
  scale: number;
  isSelected?: boolean;
  onUpdateLabel?: (groupId: string, label: string) => void;
  onConnectionStart?: (
    e: React.MouseEvent,
    id: string,
    fromHandle: HandlePosition,
    fromPos: Point
  ) => void;
  getHandlePosition?: (
    item: { x: number; y: number; width: number; height: number },
    position: HandlePosition
  ) => Point;
  onGroupSelect?: (groupId: string, isCtrlPressed: boolean) => void;
}

const GroupBox: React.FC<GroupBoxProps> = ({
  groupId,
  items,
  color,
  label,
  scale,
  isSelected = false,
  onUpdateLabel,
  onConnectionStart,
  getHandlePosition,
  onGroupSelect,
}) => {
  const groupItems = items.filter((item) => item.groupId === groupId);

  if (groupItems.length === 0) return null;

  // Calculate group bounds dynamically
  const minX = Math.min(...groupItems.map((item) => item.x));
  const minY = Math.min(...groupItems.map((item) => item.y));
  const maxX = Math.max(...groupItems.map((item) => item.x + item.width));
  const maxY = Math.max(...groupItems.map((item) => item.y + item.height));

  const padding = 20;
  const groupX = minX - padding;
  const groupY = minY - padding;
  const groupWidth = maxX - minX + padding * 2;
  const groupHeight = maxY - minY + padding * 2;

  const [isEditingLabel, setIsEditingLabel] = React.useState(false);
  const [labelValue, setLabelValue] = React.useState(label);

  React.useEffect(() => {
    setLabelValue(label);
  }, [label]);

  const handleLabelSubmit = () => {
    if (onUpdateLabel && labelValue.trim()) {
      onUpdateLabel(groupId, labelValue.trim());
    }
    setIsEditingLabel(false);
  };

  return (
    <div
      className="absolute"
      style={{
        transform: `translate(${groupX}px, ${groupY}px)`,
        width: groupWidth,
        height: groupHeight,
        zIndex: 0, // Groups are at base level, items will be above with their zIndex
        pointerEvents: "none", // Allow clicks to pass through to children
      }}
    >
      {/* Group box border - clickable for selection */}
      <div
        className={`group-box-border w-full h-full rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? "border-solid border-blue-500 bg-blue-100 bg-opacity-30 shadow-lg"
            : "border-dashed border-gray-400 hover:border-gray-500 hover:bg-opacity-30"
        }`}
        style={{
          backgroundColor: isSelected ? `${color}30` : `${color}20`, // Higher opacity when selected
          pointerEvents: "auto", // Enable clicks on the border
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onGroupSelect) {
            onGroupSelect(groupId, e.ctrlKey || e.metaKey);
          }
        }}
      />

      {/* Connection handles */}
      {onConnectionStart && getHandlePosition && (
        <>
          {(["top", "bottom", "left", "right"] as const).map((pos) => {
            const groupBounds = {
              x: groupX,
              y: groupY,
              width: groupWidth,
              height: groupHeight,
            };
            const handlePos = getHandlePosition(groupBounds, pos);
            const handleSize = 12 / scale;
            const clickableAreaSize = 24 / scale;

            return (
              <div
                key={`${pos}-clickable`}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair pointer-events-auto group z-50"
                style={{
                  left: handlePos.x - groupX,
                  top: handlePos.y - groupY,
                  width: `${clickableAreaSize}px`,
                  height: `${clickableAreaSize}px`,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectionStart(e, `group-${groupId}`, pos, handlePos);
                }}
              >
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 border-2 border-white rounded-full transition-transform group-hover:scale-125"
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

      {/* Group header - editable, pointer-events enabled */}
      <div
        className="absolute -top-8 left-0 pointer-events-auto"
        style={{ zIndex: 1000 }}
      >
        <div
          className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold text-white rounded-t-md cursor-pointer transition-all ${
            isSelected ? "shadow-lg ring-2 ring-blue-400" : ""
          }`}
          style={{
            backgroundColor: color,
            transform: isSelected ? "scale(1.05)" : "scale(1)",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {isEditingLabel ? (
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLabelSubmit();
                } else if (e.key === "Escape") {
                  setLabelValue(label);
                  setIsEditingLabel(false);
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="px-2 py-1 text-sm font-semibold text-gray-900 bg-white rounded border-2 border-blue-500 outline-none"
              style={{ minWidth: "150px" }}
              autoFocus
            />
          ) : (
            <>
              {isSelected && <span className="text-xs">✓</span>}
              <span
                className="cursor-pointer hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditingLabel(true);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {labelValue || `그룹 : ${groupId.substring(0, 8)}`}
              </span>
              <span
                className="text-xs opacity-75 whitespace-nowrap"
                title="클릭: 그룹 선택 | Ctrl+클릭: 토글 | 라벨 클릭: 편집"
              >
                ⓘ
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupBox;
