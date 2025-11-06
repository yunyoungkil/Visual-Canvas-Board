import React from "react";
import type { CanvasItem } from "../types";

interface GroupBoxProps {
  groupId: string;
  items: CanvasItem[];
  color: string;
  label: string;
  onUpdateLabel?: (groupId: string, label: string) => void;
}

const GroupBox: React.FC<GroupBoxProps> = ({
  groupId,
  items,
  color,
  label,
  onUpdateLabel,
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
      className="absolute pointer-events-none"
      style={{
        transform: `translate(${groupX}px, ${groupY}px)`,
        width: groupWidth,
        height: groupHeight,
        zIndex: 0, // Groups are at base level, items will be above with their zIndex
      }}
    >
      {/* Group box border */}
      <div
        className="w-full h-full rounded-lg border-2 border-dashed border-gray-400"
        style={{
          backgroundColor: `${color}20`, // 20% opacity
        }}
      />

      {/* Group header - editable, pointer-events enabled */}
      <div
        className="absolute -top-8 left-0 px-3 py-1 text-sm font-semibold text-white rounded-t-md pointer-events-auto cursor-pointer"
        style={{ backgroundColor: color, zIndex: 1000 }}
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
        )}
      </div>
    </div>
  );
};

export default GroupBox;
