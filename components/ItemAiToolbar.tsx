
import React from 'react';
import Icon from './Icon';
import { CanvasItem, TextItem, ShapeItem } from '../types';

interface ItemAiToolbarProps {
  top: number;
  left: number;
  scale: number;
  item: CanvasItem;
  isGeneratingAIContentForThisItem: boolean;
  canGenerateDraft: boolean;
  canUpdateDraft: boolean;
  onGenerateTextDraft: (item: CanvasItem, itemRect: DOMRect) => void;
  onUpdateTextDraftWithConnections: (item: CanvasItem, itemRect: DOMRect) => void;
  style?: React.CSSProperties;
}

const ItemAiToolbar: React.FC<ItemAiToolbarProps> = ({
  top,
  left,
  scale,
  item,
  isGeneratingAIContentForThisItem,
  canGenerateDraft,
  canUpdateDraft,
  onGenerateTextDraft,
  onUpdateTextDraftWithConnections,
  style,
}) => {
  const itemContentRef = React.useRef<HTMLDivElement>(null);

  const handleGenerateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemContentRef.current) {
        onGenerateTextDraft(item, itemContentRef.current.getBoundingClientRect());
    }
  };

  const handleUpdateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemContentRef.current) {
        onUpdateTextDraftWithConnections(item, itemContentRef.current.getBoundingClientRect());
    }
  };

  return (
    <div
      ref={itemContentRef}
      className="fixed flex items-center gap-1 p-0.5 bg-white rounded-md shadow-lg border border-gray-200 pointer-events-auto"
      style={{
        top: `${top - (40 / scale)}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
        ...style,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {canGenerateDraft && (
        <button
          className="p-1.5 rounded-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
          onClick={handleGenerateClick}
          disabled={isGeneratingAIContentForThisItem}
          title="AI로 초안 생성"
        >
          {isGeneratingAIContentForThisItem ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <Icon name="sparkles" className="w-4 h-4 text-blue-500" />
          )}
        </button>
      )}
      {canUpdateDraft && (
        <button
          className="p-1.5 rounded-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
          onClick={handleUpdateClick}
          disabled={isGeneratingAIContentForThisItem}
          title="AI로 초안 업데이트"
        >
          {isGeneratingAIContentForThisItem ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <Icon name="sparklesRefresh" className="w-4 h-4 text-purple-600" />
          )}
        </button>
      )}
    </div>
  );
};

export default ItemAiToolbar;