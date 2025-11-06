import React, { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface ImageToolbarProps {
  editor: Editor | null;
}

// NOTE: This component is repurposed but currently disabled
// Image resizing is handled by ResizableImage component's drag handles
const ImageToolbar: React.FC<ImageToolbarProps> = ({ editor }) => {
  // Toolbar is now disabled - resizing is done via drag handles on the image itself
  return null;
};

export default ImageToolbar;
