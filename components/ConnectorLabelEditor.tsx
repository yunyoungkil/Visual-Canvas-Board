import React, { useState, useEffect, useRef } from "react";
import type { Point } from "../types";

interface ConnectorLabelEditorProps {
  id: string;
  initialValue: string;
  initialColor: string;
  initialFontSize: number;
  position: Point; // Now in screen coordinates
  angle: number;
  onEndEdit: (
    id: string,
    updates: { text: string; color: string; fontSize: number }
  ) => void;
  onCancel: () => void;
  style?: React.CSSProperties; // Add style prop
}

const ConnectorLabelEditor: React.FC<ConnectorLabelEditorProps> = ({
  id,
  initialValue,
  initialColor,
  initialFontSize,
  position,
  angle,
  onEndEdit,
  onCancel,
  style,
}) => {
  const [text, setText] = useState(initialValue);
  const [color, setColor] = useState(initialColor);
  const [fontSize, setFontSize] = useState(initialFontSize);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        handleSave();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    onEndEdit(id, { text, color, fontSize });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed p-3 space-y-2 bg-white border-2 border-blue-500 rounded-lg shadow-xl z-50" // Changed to fixed with higher z-index
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, calc(-100% - 20px))`, // Position above the connector, always horizontal
        minWidth: "200px",
        ...style,
      }}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="라벨..."
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 14)}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
          min="8"
          max="72"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 p-1 bg-white border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ConnectorLabelEditor;
