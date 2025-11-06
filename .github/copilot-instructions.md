# Visual Canvas Board - AI Coding Agent Guide

## Project Overview

A client-side React + TypeScript infinite canvas application for visual content planning and mind mapping. Features Tiptap-based rich text editing with custom resizable image extensions, and deep Gemini AI integration for content generation, editing, image/video creation, and intelligent canvas operations.

## Architecture

### State Management Pattern

- **Centralized state in `App.tsx`**: All canvas state managed via custom hooks (`useCanvasState`, `useCanvasInteraction`, `useAIFeatures`)
- **No external state library**: Uses React hooks (`useState`, `useRef`, `useCallback`) with custom hook pattern for organization
- **Undo/redo system**: Implemented via `commitState()` in `useCanvasState.ts` - creates immutable snapshots in `history.current` array
- **Persistence**: Auto-saves to `localStorage` after 500ms debounce in `useCanvasState.ts` effect

### Custom Hook Architecture

The codebase follows a **strict custom hook separation pattern** to keep `App.tsx` maintainable:

1. **`useCanvasState.ts`**: Core state management

   - Items, connectors, scale, viewOffset
   - History management: `commitState()`, `handleUndo()`, `handleRedo()`
   - LocalStorage persistence
   - Z-index management

2. **`useCanvasInteraction.ts`**: User interactions

   - Mouse events: drag, resize, pan, zoom
   - Selection, grouping, connection drawing
   - Snap lines, context menus
   - Canvas-to-screen coordinate transforms

3. **`useAIFeatures.ts`**: All Gemini API integration
   - Text generation/editing (summarize, expand, refine, tone change)
   - Image generation (Imagen 4.0), video generation (Veo 3.1)
   - Multimodal scene creation (Gemini 2.5 Flash Image)
   - Function calling for chat assistant
   - API key validation and error handling

**When modifying state or adding features**: Keep logic in the appropriate custom hook. `App.tsx` should primarily orchestrate, not contain business logic.

### Data Flow

1. User interaction → Event handler in custom hook
2. Handler updates state via `setItems`, `setConnectors`, etc.
3. Handler calls `commitState(newItems, newConnectors)` to make change undoable
4. React re-renders affected components
5. Auto-save triggers after 500ms debounce

## Tiptap Integration (Critical)

### Version Compatibility

- **React**: 18.3.1 (NOT React 19 - Tiptap incompatible)
- **Tiptap**: 2.10.3 (upgraded from 2.4.0)
- See `MIGRATION_TO_REACT18_TIPTAP.md` for migration details

### Custom Extensions

- **`extensions/ResizableImage.tsx`**: Custom Tiptap node with 8-way drag handles (corners + edges)
  - Uses `queueMicrotask()` to avoid flushSync warnings during selection
  - Min 50px, max 1200px sizing constraints
  - Click to select (blue border), drag handles to resize

### Editor State Management

- **Active editor tracking**: `activeEditor` state tracks currently focused Tiptap editor
- **Toolbar state**: `tiptapToolbarState` controls floating toolbar position (screen coords)
- **Avoid flushSync**: Always wrap editor focus/selection changes in `queueMicrotask()` to prevent React warnings
- **Wheel scroll isolation**: Text editor containers have `onWheel` handlers that stop propagation to prevent canvas zoom

### Content Format

- **Storage**: HTML strings in `item.content` field (TextItem, ShapeItem)
- **Conversion helpers**:
  - `htmlToText()`: Strip HTML for API calls or plain text operations
  - `textToHtml()`: Convert AI-generated plain text back to Tiptap HTML

## AI Integration

### API Configuration

- **Environment variable**: `process.env.API_KEY` (injected via Vite config from `.env` file with `GEMINI_API_KEY`)
- **SDK**: `@google/genai` JavaScript SDK for Gemini API
- **All API calls**: Run client-side from browser (no backend)

### Model Usage

- **Text generation/editing**: `gemini-2.5-flash` (fast) or `gemini-2.5-pro` (quality)
- **Image generation**: `imagen-4.0-generate-001`
- **Video generation**: `veo-3.1-fast-generate-preview`
- **Multimodal (scene creation)**: `gemini-2.5-flash-image`
- **Function calling**: Chat assistant uses declarative function schemas (see `generateImageFunctionDeclaration` in `useAIFeatures.ts`)

### AI Feature Patterns

1. **Floating AI toolbars**: Positioned at screen coordinates, appear on item hover/selection
   - `ItemAiToolbar`: Generate draft (<200 chars) or update draft with connections
   - `TextSelectionToolbar`: Summarize/expand/refine selected text
2. **Details panel AI tab**: Full suite of text editing operations for selected item
3. **Modal workflows**: Outline, social post, keyword analysis, brainstorm, export
4. **Chat assistant**: Conversational interface with function calling for canvas operations

### Error Handling

- **API key errors**: `apiKeyError` state shows user-friendly message
- **Generation errors**: `generationError` state displays error details
- **Loading states**: Prefix `isGenerating*` or `is*ing` for UI feedback (e.g., `isGeneratingOutline`, `isExportingWithAi`)

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (Vite on port 3000)
npm run build            # Production build
npm run preview          # Preview production build
```

### Environment Setup

Create `.env` file in project root:

```
GEMINI_API_KEY=your_api_key_here
```

## Code Conventions

### Naming

- **Components**: PascalCase (e.g., `CanvasItemComponent`, `ItemAiToolbar`)
- **Types**: PascalCase with `Type` suffix for enums (e.g., `BorderStyleType`, `ShapeType`)
- **State variables**: camelCase with descriptive prefixes (e.g., `isGenerating*`, `selected*`, `editing*`)
- **Handlers**: `handle*` prefix (e.g., `handleItemMouseDown`, `handleGenerateTextDraft`)

### Type System (`types.ts`)

- **CanvasItem union**: `ImageItem | TextItem | ShapeItem`
- **Background union**: `SolidBackground | GradientBackground`
- **Always use discriminated unions**: Check `item.type`, `background.type` before accessing type-specific fields

### Constants (`constants.ts`)

- **Never hardcode**: Grid size, canvas size, snap threshold, etc. live in `constants.ts`
- **Import as**: `import * as C from './constants'` and use `C.GRID_SIZE`, `C.CANVAS_WORLD_SIZE`, etc.

### Coordinate Systems

- **Canvas coords**: Item positions (`item.x`, `item.y`) - world space
- **Screen coords**: Display positions - use `canvasToScreen()` helper from `useCanvasInteraction`
- **Transform**: Applied to export ref div via `transform: translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${scale})`

## Common Tasks

### Adding a New Canvas Item Type

1. Define type in `types.ts` (extend `CanvasItemBase`, add to `CanvasItem` union)
2. Add rendering logic in `CanvasItemComponent.tsx` (type switch)
3. Update `useCanvasInteraction.ts` if special interaction needed
4. Handle in `commitState` and localStorage hydration

### Adding a New AI Feature

1. Add function to `useAIFeatures.ts` with loading state
2. Call Gemini API with appropriate model
3. Use `safeParseJsonResponse<T>()` for structured outputs
4. Update canvas state via `handleItemUpdate` or create new items
5. Call `commitState()` to make undoable
6. Wire up UI button/modal in relevant component

### Modifying Undo/Redo Behavior

- **Undoable actions**: Call `commitState(newItems, newConnectors, true)` (default)
- **Non-undoable updates**: Call `commitState(newItems, newConnectors, false)` to replace current history entry (e.g., continuous dragging)
- **Skip history**: Directly `setItems()`/`setConnectors()` for temporary UI states (e.g., hover effects)

## Known Limitations & Future Work

See `RECOMMENDATIONS.md` for technical debt:

- Consider state management library (Zustand/Redux) if complexity grows
- Video item type not yet implemented (currently use image placeholder with thumbnail)
- Details panel AI operations could be further modularized

## Key Files Reference

- **`App.tsx`**: Main orchestration, wires hooks together
- **`types.ts`**: All TypeScript interfaces and unions
- **`constants.ts`**: Configuration constants
- **`hooks/useCanvasState.ts`**: State, history, persistence
- **`hooks/useCanvasInteraction.ts`**: Mouse interactions, drag/drop
- **`hooks/useAIFeatures.ts`**: Gemini API integration (813 lines)
- **`extensions/ResizableImage.tsx`**: Custom Tiptap image node
- **`vite.config.ts`**: Build config, API key injection

## Testing Workflow

No automated tests currently. Manual testing checklist:

1. Canvas operations: drag, resize, pan, zoom, group, connect
2. Text editing: Tiptap formatting, image resizing
3. AI features: test with valid API key, verify loading states
4. Undo/redo: ensure all operations are undoable
5. Persistence: refresh browser, verify state restored
6. Export: PNG and AI-powered markdown export

## Debugging Tips

- **React flushSync warnings**: Wrap state changes in `queueMicrotask()` when triggered by Tiptap events
- **Coordinate issues**: Check if function expects canvas or screen coords - use `canvasToScreen()` converter
- **Missing API key**: Error surfaces in `apiKeyError` state, check `.env` file exists
- **Items not saving**: Check browser console for localStorage quota errors
- **Tiptap not working**: Verify React 18.3.1 (not 19), check Tiptap version 2.10.3
