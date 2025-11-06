

import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface FileMenuProps {
    onClearCanvas: () => void;
    onExportPng: () => void;
    className?: string; // Add className prop
}

const FileMenu: React.FC<FileMenuProps> = ({ onClearCanvas, onExportPng, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const MenuItem: React.FC<{
        onClick: () => void;
        children: React.ReactNode;
        icon: React.ReactNode;
    }> = ({ onClick, children, icon }) => (
        <button
            onClick={() => {
                onClick();
                setIsOpen(false);
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
            <span className="mr-3 text-gray-500">{icon}</span>
            {children}
        </button>
    );

    return (
        <div ref={menuRef} className={`fixed top-5 left-5 z-20 ${className || ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
            >
                파일
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-56 p-2 bg-white rounded-lg shadow-xl border border-gray-200">
                    <MenuItem onClick={onClearCanvas} icon={<Icon name="fileX" className="w-5 h-5"/>}>
                        캔버스 지우기
                    </MenuItem>
                    <MenuItem onClick={onExportPng} icon={<Icon name="export" className="w-5 h-5"/>}>
                        PNG로 내보내기
                    </MenuItem>
                </div>
            )}
        </div>
    );
};

export default FileMenu;