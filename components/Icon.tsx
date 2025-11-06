

import React from 'react';

// Fix: Export the IconName type to be used in other components
export type IconName = 'group' | 'ungroup' | 'link' | 'trash' | 'info' | 'zoomIn' | 'zoomOut' | 'settings' | 'close' | 'undo' | 'redo' | 'hand' | 'text' | 'square' | 'bold' | 'italic' | 'fileX' | 'export' | 'magnet' | 'ellipse' | 'diamond' | 'copy' | 'paste' | 'bringForward' | 'bringFront' | 'sendBackward' | 'sendBack' | 'sparkles' | 'lightbulb' | 'groupSparkles' | 'sparklesRefresh' | 'list' | 'messageSquare' | 'alignLeft' | 'alignCenter' | 'alignRight' | 'botMessageSquare' | 'chevronsUp' | 'chevronsDown' | 'underline' | 'strikethrough' | 'code' | 'alignJustify' | 'superscript' | 'subscript' | 'image';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
}

const ICONS: Record<IconName, React.ReactNode> = {
  group: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="3" width="7" height="7" rx="1"></rect>
      <rect x="3" y="14" width="7" height="7" rx="1"></rect>
      <rect x="14" y="14" width="7" height="7" rx="1"></rect>
    </>
  ),
  ungroup: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" strokeDasharray="2 2"></rect>
      <rect x="14" y="3" width="7" height="7" rx="1" strokeDasharray="2 2"></rect>
      <rect x="3" y="14" width="7" height="7" rx="1" strokeDasharray="2 2"></rect>
      <rect x="14" y="14" width="7" height="7" rx="1" strokeDasharray="2 2"></rect>
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </>
  ),
  settings: (
    <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </>
  ),
  close: (
    <>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </>
  ),
  undo: (
    <>
      <path d="M3 10v6h6"></path>
      <path d="M21 10a9 9 0 0 0-14.46-6.34L3 10"></path>
    </>
  ),
  redo: (
    <>
      <path d="M21 10v6h-6"></path>
      <path d="M3 10a9 9 0 0 1 14.46-6.34L21 10"></path>
    </>
  ),
  hand: (
    <>
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0"></path>
    </>
  ),
  text: (
    <>
      <polyline points="4 7 4 4 20 4 20 7"></polyline>
      <line x1="9" y1="20" x2="15" y2="20"></line>
      <line x1="12" y1="4" x2="12" y2="20"></line>
    </>
  ),
  square: (
    <>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    </>
  ),
  bold: (
    <>
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
    </>
  ),
  italic: (
    <>
      <line x1="19" y1="4" x2="10" y2="4"></line>
      <line x1="14" y1="20" x2="5" y2="20"></line>
      <line x1="15" y1="4" x2="9" y2="20"></line>
    </>
  ),
  fileX: (
    <>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
      <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
    </>
  ),
  export: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </>
  ),
  magnet: (
    <>
      <path d="M15 6v8.4a2.5 2.5 0 1 0 5 0V6a8 8 0 1 0-16 0v8.4a2.5 2.5 0 1 0 5 0V6"></path>
    </>
  ),
  ellipse: (
    <>
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  diamond: (
    <>
      <path d="M12 2L22 12L12 22L2 12Z" />
    </>
  ),
  copy: (
    <>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </>
  ),
  paste: (
    <>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </>
  ),
  bringForward: (
    <>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        <polyline points="12 5 12 11 15 8"></polyline>
    </>
  ),
  bringFront: (
    <>
        <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
        <path d="M4 16.5V6a2 2 0 0 1 2-2h11"></path>
    </>
  ),
  sendBackward: (
    <>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        <polyline points="12 11 12 5 9 8"></polyline>
    </>
  ),
  sendBack: (
    <>
        <rect x="4" y="4" width="12" height="12" rx="2" ry="2"></rect>
        <path d="M8 20V10a2 2 0 0 1 2-2h11"></path>
    </>
  ),
  sparkles: (
      <>
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        <path d="M5 5L6 8L9 9L6 10L5 13L4 10L1 9L4 8L5 5Z" />
        <path d="M19 5L18 8L15 9L18 10L19 13L20 10L23 9L20 8L19 5Z" />
      </>
  ),
  lightbulb: (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1.2-1.2 1.5-2.5 1.5-4C18 5.12 15.31 3 12 3s-6 2.12-6 4.5c0 1.5.3 2.8 1.5 4 .8.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M12 22V18" />
    </>
  ),
  groupSparkles: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M12 8 L11 11 L8 12 L11 13 L12 16 L13 13 L16 12 L13 11 Z" />
    </>
  ),
  sparklesRefresh: (
    <>
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"/>
        <path d="M23 4H18V9"/>
        <path d="M1 6C6 10 7 10 12 15"/>
        <path d="M1 20H6V15"/>
        <path d="M23 20C18 11 17 11 12 6"/>
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </>
  ),
  messageSquare: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </>
  ),
  alignLeft: (
    <>
      <line x1="17" y1="10" x2="3" y2="10"></line>
      <line x1="21" y1="6" x2="3" y2="6"></line>
      <line x1="21" y1="14" x2="3" y2="14"></line>
      <line x1="17" y1="18" x2="3" y2="18"></line>
    </>
  ),
  alignCenter: (
    <>
      <line x1="18" y1="10" x2="6" y2="10"></line>
      <line x1="21" y1="6" x2="3" y2="6"></line>
      <line x1="21" y1="14" x2="3" y2="14"></line>
      <line x1="18" y1="18" x2="6" y2="18"></line>
    </>
  ),
  alignRight: (
    <>
      <line x1="21" y1="10" x2="7" y2="10"></line>
      <line x1="21" y1="6" x2="3" y2="6"></line>
      <line x1="21" y1="14" x2="3" y2="14"></line>
      <line x1="21" y1="18" x2="7" y2="18"></line>
    </>
  ),
  alignJustify: (
    <>
      <line x1="21" y1="10" x2="3" y2="10"></line>
      <line x1="21" y1="6" x2="3" y2="6"></line>
      <line x1="21" y1="14" x2="3" y2="14"></line>
      <line x1="21" y1="18" x2="3" y2="18"></line>
    </>
  ),
  botMessageSquare: (
    <>
      <path d="M12 6V2H8"/>
      <path d="m8 18-4 4V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2z"/>
    </>
  ),
  chevronsUp: (
    <>
      <polyline points="17 11 12 6 7 11"></polyline>
      <polyline points="17 18 12 13 7 18"></polyline>
    </>
  ),
  chevronsDown: (
    <>
      <polyline points="7 13 12 18 17 13"></polyline>
      <polyline points="7 6 12 11 17 6"></polyline>
    </>
  ),
  underline: (
    <>
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
      <line x1="4" y1="21" x2="20" y2="21"></line>
    </>
  ),
  strikethrough: (
    <>
      <line x1="4" y1="12" x2="20" y2="12"></line>
    </>
  ),
  code: (
    <>
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </>
  ),
  superscript: (
      <>
        <path d="m4 5 4-3 4 3"/>
        <path d="m14 15 4 3 4-3"/>
        <path d="M6 14h2"/>
        <path d="M16 14h2"/>
        <path d="M8 5v9"/>
        <path d="M18 12v6"/>
      </>
  ),
  subscript: (
      <>
        <path d="m4 19 4 3 4-3"/>
        <path d="m14 9 4-3 4 3"/>
        <path d="M6 8h2"/>
        <path d="M16 8h2"/>
        <path d="M8 19V10"/>
        <path d="M18 6v9"/>
      </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="9" cy="9" r="2"></circle>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </>
  ),
};

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {ICONS[name]}
    </svg>
  );
};

export default Icon;