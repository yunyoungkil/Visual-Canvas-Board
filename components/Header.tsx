
import React from 'react';
import FileMenu from './FileMenu';
import Icon from './Icon';

interface HeaderProps {
  onClearCanvas: () => void;
  onExportPng: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string; // Add className prop
}

const Header: React.FC<HeaderProps> = ({ onClearCanvas, onExportPng, onUndo, onRedo, canUndo, canRedo, className }) => {
  const Button: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }> = ({ onClick, disabled = false, children, tooltip }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
      >
        {children}
      </button>
      <div className="absolute top-full mt-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {tooltip}
      </div>
    </div>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 p-2 flex items-center justify-between pointer-events-none ${className || ''}`}>
      <div className="pointer-events-auto">
        <FileMenu onClearCanvas={onClearCanvas} onExportPng={onExportPng} />
      </div>
      <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 pointer-events-auto">
        <Button onClick={onUndo} disabled={!canUndo} tooltip="실행 취소 (Ctrl+Z)">
          <Icon name="undo" />
        </Button>
        <Button onClick={onRedo} disabled={!canRedo} tooltip="다시 실행 (Ctrl+Y)">
          <Icon name="redo" />
        </Button>
      </div>
      <div className="w-56 pointer-events-auto">{/* Spacer for right side to balance file menu */}</div>
    </header>
  );
};

export default Header;