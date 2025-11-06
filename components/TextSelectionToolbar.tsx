import React, { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import Icon from './Icon';
import type { IconName } from './Icon';

interface ImageToolbarProps {
  editor: Editor | null;
}

// NOTE: This component is repurposed to serve as a toolbar for selected images.
// Using a custom implementation instead of BubbleMenu to avoid React portal issues
const ImageToolbar: React.FC<ImageToolbarProps> = ({ editor }) => {
  const [widthInput, setWidthInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setIsVisible(false);
      return;
    }

    const updateToolbar = () => {
      if (!editor || editor.isDestroyed) {
        setIsVisible(false);
        return;
      }

      const isImageActive = editor.isActive('image');
      setIsVisible(isImageActive);

      if (isImageActive) {
        const attrs = editor.getAttributes('image');
        setWidthInput(attrs?.width ? String(attrs.width) : '');

        // Calculate position
        const { view } = editor;
        const { from } = view.state.selection;
        const start = view.coordsAtPos(from);
        
        setPosition({
          top: start.top - 60,
          left: start.left
        });
      }
    };

    editor.on('selectionUpdate', updateToolbar);
    editor.on('transaction', updateToolbar);
    updateToolbar();

    return () => {
      if (editor && !editor.isDestroyed) {
        editor.off('selectionUpdate', updateToolbar);
        editor.off('transaction', updateToolbar);
      }
    };
  }, [editor]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInput(e.target.value);
  };
  
  const applyWidth = () => {
    if (!editor || editor.isDestroyed) return;
    const width = parseInt(widthInput, 10);
    if (!isNaN(width) && width > 0) {
      editor.chain().focus().updateAttributes('image', { width: width }).run();
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, title, children }) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-sm hover:bg-gray-100 ${isActive ? 'is-active' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  if (!editor || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed z-50 flex items-center gap-1 p-1 bg-white rounded-md shadow-lg border border-gray-200 tiptap-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <span className="text-xs text-gray-600 px-2">이미지 너비:</span>
      <div className="flex items-center gap-1">
        <input
            type="number"
            value={widthInput}
            onChange={handleWidthChange}
            onBlur={applyWidth}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyWidth(); } }}
            placeholder="너비(px)"
            className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-500">px</span>
      </div>
    </div>
  );
};

export default ImageToolbar;