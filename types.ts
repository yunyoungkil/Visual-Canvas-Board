import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import type { Editor } from "@tiptap/react";

export interface Point {
  x: number;
  y: number;
}

interface CanvasItemBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  groupId?: string | null;
  zIndex: number;
  opacity?: number;
  borderRadius?: number;
}

export interface ImageItem extends CanvasItemBase {
  type: "image";
  src: string;
}

export type SolidBackground = {
  type: "solid";
  color: string;
};

export type ColorStop = {
  id: string;
  color: string;
  position: number; // A value between 0 and 1
};

export type GradientBackground = {
  type: "gradient";
  gradientType: "linear" | "radial";
  stops: ColorStop[];
  angle: number;
};

export type Background = SolidBackground | GradientBackground;

export interface TextItem extends CanvasItemBase {
  type: "text";
  content: string; // Changed from 'text' to 'content' to store HTML
  color: string;
  fontSize: number;
  fontFamily?: string;
  background: Background;
  textAlign: "left" | "center" | "right" | "justify";
}

export type BorderStyleType = "solid" | "dashed" | "dotted";

export interface BorderStyle {
  width: number;
  style: BorderStyleType;
  color: string;
}

export type ShapeType = "rectangle" | "ellipse" | "diamond";

export interface ShapeItem extends CanvasItemBase {
  type: "shape";
  shape: ShapeType;
  background: Background;
  border: BorderStyle;
  content: string; // Changed from 'text' to 'content' to store HTML
  color: string;
  fontSize: number;
  fontFamily?: string;
  textAlign: "left" | "center" | "right" | "justify";
}

export type CanvasItem = ImageItem | TextItem | ShapeItem;

export type HandlePosition = "top" | "bottom" | "left" | "right";

export type ConnectorStyleType = "solid" | "dashed" | "dotted";

export interface Connector {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  labelColor?: string;
  labelFontSize?: number;
  style?: ConnectorStyleType;
  strokeWidth?: number;
  color?: string;
}

export interface SnapLine {
  direction: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
}

export interface KeywordAnalysisResult {
  mainKeyword: string;
  subKeywords: {
    keyword: string;
    relevance: string; // Qualitative description of popularity/relevance
    contentIdeas: string[];
  }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ItemAiToolbarState {
  isVisible: boolean;
  itemId: string;
  top: number; // screen coords
  left: number; // screen coords
  canGenerateDraft: boolean;
  canUpdateDraft: boolean;
}

export interface TiptapToolbarState {
  isVisible: boolean;
  editor: Editor;
  top: number; // screen coords
  left: number; // screen coords
}

export interface ConnectorLabelEditorState {
  id: string;
  initialValue: string;
  initialColor: string;
  initialFontSize: number;
  position: Point; // screen coords
  angle: number;
}

export interface SuggestedGroup {
  id: string;
  itemIds: string[];
  bounds: { x: number; y: number; width: number; height: number }; // canvas coords
}

export interface SuggestedGroupOverlayState {
  id: string;
  itemIds: string[];
  bounds: { x: number; y: number; width: number; height: number }; // screen coords
  scale: number;
}

// Fix: Define and export CanvasStateAndActions to be used across hooks.
export interface CanvasStateAndActions {
  items: CanvasItem[];
  setItems: Dispatch<SetStateAction<CanvasItem[]>>;
  connectors: Connector[];
  setConnectors: Dispatch<SetStateAction<Connector[]>>;
  scale: number;
  setScale: Dispatch<SetStateAction<number>>;
  viewOffset: Point;
  setViewOffset: Dispatch<SetStateAction<Point>>;
  history: { current: number; length: number };
  maxZIndex: MutableRefObject<number>;
  isInitialLoad: MutableRefObject<boolean>;
  commitState: (
    newItems: CanvasItem[],
    newConnectors: Connector[],
    isUndoable?: boolean
  ) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleItemUpdate: (
    itemId: string,
    updates: Partial<CanvasItem>,
    shouldCommitUpdate?: boolean
  ) => void;
  handleConnectorUpdate: (
    connectorId: string,
    updates: Partial<Connector>
  ) => void;
  handleClearCanvas: () => void;
  updateZIndex: (
    itemId: string,
    direction: "front" | "back" | "forward" | "backward"
  ) => void;
}

// Declare the AIStudio interface to be used as a type for window.aistudio
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Extend Window interface to include aistudio
declare global {
  interface Window {
    chrome?: {
      storage?: {
        local: {
          get: (
            keys: string[] | string,
            callback: (result: any) => void
          ) => void;
          set: (items: object, callback?: () => void) => void;
        };
      };
    };
    aistudio?: AIStudio;
  }
}
