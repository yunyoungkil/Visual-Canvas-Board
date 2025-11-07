import React, { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import Icon from "./Icon";

interface ImageToolbarProps {
  editor: Editor | null;
  top: number;
  left: number;
  onImageSelectionChange?: (isSelected: boolean) => void;
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({
  editor,
  top,
  left,
  onImageSelectionChange,
}) => {
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [currentAlign, setCurrentAlign] = useState<"left" | "center" | "right">(
    "left"
  );

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const { selection, doc } = editor.state;

      // Check if node selection (like image) is active
      const { node } = selection as any;
      if (node && node.type.name === "image") {
        setIsImageSelected(true);
        setCurrentAlign(node.attrs.align || "left");
        onImageSelectionChange?.(true);
        return;
      }

      // Check current position for image node
      try {
        const resolvedPos = doc.resolve(selection.from);
        const nodeAtPos = resolvedPos.parent.maybeChild(resolvedPos.index());

        if (nodeAtPos && nodeAtPos.type.name === "image") {
          setIsImageSelected(true);
          setCurrentAlign(nodeAtPos.attrs.align || "left");
          onImageSelectionChange?.(true);
          return;
        }
      } catch (e) {
        // Ignore errors
      }

      // Check if image is active
      const isActive = editor.isActive("image");
      setIsImageSelected(isActive);
      onImageSelectionChange?.(isActive);

      if (!isActive) {
        setCurrentAlign("left");
      }
    };

    editor.on("selectionUpdate", updateSelection);
    editor.on("update", updateSelection);
    editor.on("focus", updateSelection);
    updateSelection();

    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("update", updateSelection);
      editor.off("focus", updateSelection);
    };
  }, [editor]);

  if (!editor || !isImageSelected) {
    return null;
  }

  const setAlignment = (align: "left" | "center" | "right") => {
    if (!editor) return;

    // Update state immediately for UI feedback
    setCurrentAlign(align);

    // Update the image node's align attribute
    const { selection } = editor.state;
    const { node } = selection as any;

    // Try direct node selection first
    if (node && node.type.name === "image") {
      editor.chain().updateAttributes("image", { align }).run();
      return;
    }

    // Try finding image at current position
    try {
      const { doc } = editor.state;
      const resolvedPos = doc.resolve(selection.from);
      const nodeAtPos = resolvedPos.parent.maybeChild(resolvedPos.index());

      if (nodeAtPos && nodeAtPos.type.name === "image") {
        // Calculate the absolute position of the image node
        const pos =
          selection.from - resolvedPos.parentOffset + resolvedPos.index();
        editor
          .chain()
          .setNodeSelection(pos)
          .updateAttributes("image", { align })
          .run();
        return;
      }
    } catch (e) {
      console.error("Error setting alignment:", e);
    }

    // Fallback: try to find and update any selected image
    editor.chain().updateAttributes("image", { align }).run();
  };

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-md shadow-lg px-2 py-1 flex items-center gap-1 z-[100000]"
      style={{
        top: `${top - 35}px`,
        left: `${left}px`,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => setAlignment("left")}
        className={`p-1.5 rounded-sm hover:bg-gray-100 ${
          currentAlign === "left" ? "bg-gray-200" : ""
        }`}
        title="왼쪽 정렬"
      >
        <Icon name="alignLeft" className="w-4 h-4 text-gray-700" />
      </button>
      <button
        onClick={() => setAlignment("center")}
        className={`p-1.5 rounded-sm hover:bg-gray-100 ${
          currentAlign === "center" ? "bg-gray-200" : ""
        }`}
        title="중앙 정렬"
      >
        <Icon name="alignCenter" className="w-4 h-4 text-gray-700" />
      </button>
      <button
        onClick={() => setAlignment("right")}
        className={`p-1.5 rounded-sm hover:bg-gray-100 ${
          currentAlign === "right" ? "bg-gray-200" : ""
        }`}
        title="오른쪽 정렬"
      >
        <Icon name="alignRight" className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
};

export default ImageToolbar;
