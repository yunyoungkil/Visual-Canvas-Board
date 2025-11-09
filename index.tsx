import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Suppress known Tiptap flushSync warnings in development
if (process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("flushSync was called from inside a lifecycle method")
    ) {
      // Suppress this specific warning from Tiptap's internal ReactRenderer
      return;
    }
    originalError.apply(console, args);
  };
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
