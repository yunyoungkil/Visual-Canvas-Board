
import React, { useEffect, useRef } from 'react';
import Icon from './Icon';

interface ContextMenuProps {
    x: number;
    y: number;
    itemId: string | null;
    connectorId: string | null;
    onClose: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
    style?: React.CSSProperties; // Add style prop
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    itemId,
    connectorId,
    onClose,
    onCopy,
    onPaste,
    onDuplicate,
    onDelete,
    onBringToFront,
    onSendToBack,
    onBringForward,
    onSendBackward,
    style
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const MenuItem: React.FC<{
        onClick: () => void;
        disabled?: boolean;
        children: React.ReactNode;
        icon: React.ReactNode;
    }> = ({ onClick, disabled = false, children, icon }) => (
        <button
            onClick={() => { if(!disabled) { onClick(); onClose(); } }}
            disabled={disabled}
            className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
        >
            <span className="mr-3 text-gray-500">{icon}</span>
            {children}
        </button>
    );

    const canDelete = !!itemId || !!connectorId;
    const isItemContext = !!itemId;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-56 p-2 bg-white rounded-lg shadow-xl border border-gray-200"
            style={{ top: y, left: x, ...style }}
        >
            <div className="space-y-1">
                {isItemContext && (
                    <>
                        <MenuItem onClick={onBringForward} disabled={!isItemContext} icon={<Icon name="bringForward" className="w-5 h-5"/>}>앞으로 가져오기</MenuItem>
                        <MenuItem onClick={onBringToFront} disabled={!isItemContext} icon={<Icon name="bringFront" className="w-5 h-5"/>}>맨 앞으로 가져오기</MenuItem>
                        <MenuItem onClick={onSendBackward} disabled={!isItemContext} icon={<Icon name="sendBackward" className="w-5 h-5"/>}>뒤로 보내기</MenuItem>
                        <MenuItem onClick={onSendToBack} disabled={!isItemContext} icon={<Icon name="sendBack" className="w-5 h-5"/>}>맨 뒤로 보내기</MenuItem>
                        <div className="h-px bg-gray-200 my-1"></div>
                    </>
                )}
                <MenuItem onClick={onCopy} disabled={!isItemContext} icon={<Icon name="copy" className="w-5 h-5"/>}>복사</MenuItem>
                <MenuItem onClick={onPaste} icon={<Icon name="paste" className="w-5 h-5"/>}>붙여넣기</MenuItem>
                <MenuItem onClick={onDuplicate} disabled={!isItemContext} icon={<Icon name="copy" className="w-5 h-5"/>}>복제</MenuItem>
                <div className="h-px bg-gray-200 my-1"></div>
                <MenuItem onClick={onDelete} disabled={!canDelete} icon={<Icon name="trash" className="w-5 h-5 text-red-500"/>}>삭제</MenuItem>
            </div>
        </div>
    );
};

export default ContextMenu;