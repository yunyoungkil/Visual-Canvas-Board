

import React from 'react';
import Icon from './Icon';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (newScale: number) => void;
  className?: string; // Add className prop
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut, onZoomChange, className }) => {
    const Button: React.FC<{
        onClick: () => void;
        disabled: boolean;
        children: React.ReactNode;
        tooltip: string;
    }> = ({ onClick, disabled, children, tooltip }) => (
        <div className="relative group">
            <button
                onClick={onClick}
                disabled={disabled}
                className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                {children}
            </button>
             <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {tooltip}
            </div>
        </div>
    );

    return (
        <div className={`flex items-center gap-1 p-1.5 bg-gray-200/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-300 ${className || ''}`}>
            <Button onClick={onZoomOut} disabled={scale <= 0.2} tooltip="축소">
                <Icon name="zoomOut" className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-1">
                 <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.01"
                  value={scale}
                  onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-700 w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
            </div>
            <Button onClick={onZoomIn} disabled={scale >= 2.0} tooltip="확대">
                <Icon name="zoomIn" className="w-5 h-5" />
            </Button>
        </div>
    );
};

export default ZoomControls;