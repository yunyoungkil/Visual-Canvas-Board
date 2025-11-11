
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileMenu from './FileMenu';
import Icon from './Icon';
import type { CardCategory } from '../types';

interface HeaderProps {
  onClearCanvas: () => void;
  onExportPng: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
  onSaveCanvas?: (category: CardCategory) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onClearCanvas, 
  onExportPng, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  className,
  onSaveCanvas 
}) => {
  const navigate = useNavigate();
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

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
        
        {/* 저장 버튼 드롭다운 */}
        {onSaveCanvas && (
          <div className="relative">
            <button
              onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              title="캔버스 저장"
            >
              <Icon name="export" className="w-4 h-4" />
              저장
            </button>
            
            {isSaveDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] z-50">
                <button
                  onClick={() => {
                    onSaveCanvas("scrap");
                    setIsSaveDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  스크랩으로 저장
                </button>
                <button
                  onClick={() => {
                    onSaveCanvas("idea");
                    setIsSaveDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  아이디어로 저장
                </button>
                <button
                  onClick={() => {
                    onSaveCanvas("planning");
                    setIsSaveDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  기획/작성 중으로 저장
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* 저장된 캔버스 페이지 이동 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
            className="p-2 rounded-lg transition-colors duration-200 flex items-center justify-center bg-white text-gray-700 hover:bg-gray-100"
            title="저장된 캔버스 보기"
          >
            <Icon name="fileEdit" className="w-5 h-5" />
          </button>
          
          {isViewDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px] z-50">
              <button
                onClick={() => {
                  navigate('/saved');
                  setIsViewDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                전체 보기
              </button>
              <button
                onClick={() => {
                  navigate('/scraps');
                  setIsViewDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                스크랩
              </button>
              <button
                onClick={() => {
                  navigate('/kanban/ideas');
                  setIsViewDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                아이디어
              </button>
              <button
                onClick={() => {
                  navigate('/kanban/in-progress');
                  setIsViewDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                기획/작성 중
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-56 pointer-events-auto">{/* Spacer for right side to balance file menu */}</div>
    </header>
  );
};

export default Header;