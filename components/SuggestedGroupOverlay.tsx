

import React from 'react';
import Icon from './Icon';
import { SuggestedGroupOverlayState } from '../types'; // Import the new type

interface SuggestedGroupOverlayProps {
    suggestion: SuggestedGroupOverlayState; // Use the new state type
    scale: number;
    onAccept: () => void;
    onReject: () => void;
    style?: React.CSSProperties; // Add style prop
}

const SuggestedGroupOverlay: React.FC<SuggestedGroupOverlayProps> = ({ suggestion, scale, onAccept, onReject, style }) => {
    const padding = 20; // Padding in screen pixels
    const { x, y, width, height } = suggestion.bounds;
    
    // Buttons should scale with overall UI, not inverse to canvas scale.
    // Fixed button size in screen pixels.
    const buttonSize = 32;
    const iconSize = 16;
    
    const buttonStyle: React.CSSProperties = {
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    };

    return (
        <div 
            className="fixed pointer-events-none" // Changed to fixed
            style={{
                left: x - padding,
                top: y - padding,
                width: width + padding * 2,
                height: height + padding * 2,
                ...style // Apply external styles
            }}
        >
            <div className="relative w-full h-full border-2 border-dashed border-blue-500 rounded-lg bg-blue-500/10" />
            
            <div 
                className="absolute flex gap-2 pointer-events-auto"
                style={{
                    bottom: `-${buttonSize + 8}px`, // Adjusted for screen pixels
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            >
                <button 
                    onClick={onAccept}
                    className="flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    style={buttonStyle}
                    aria-label="추천 수락"
                >
                    ✓
                </button>
                <button 
                    onClick={onReject}
                    className="flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    style={{ ...buttonStyle }}
                    aria-label="추천 거절"
                >
                    <Icon name="close" style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
                </button>
            </div>
        </div>
    );
};

export default SuggestedGroupOverlay;