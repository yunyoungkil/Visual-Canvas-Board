import React from "react";
import { Routes, Route } from "react-router-dom";
import CanvasEditor from "./CanvasEditor.tsx";
import SavedCanvasesPage from "./components/SavedCanvasesPage";

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CanvasEditor />} />
      <Route path="/saved" element={<SavedCanvasesPage />} />
      <Route path="/kanban/in-progress" element={<SavedCanvasesPage />} />
      <Route path="/kanban/ideas" element={<SavedCanvasesPage />} />
      <Route path="/scraps" element={<SavedCanvasesPage />} />
    </Routes>
  );
};

export default AppRouter;
