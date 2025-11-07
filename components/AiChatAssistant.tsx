import React, { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "../types";
import Icon from "./Icon";
import ChatMessageComponent from "./ChatMessage";

interface AiChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isSending: boolean;
  isGeneratingImage: boolean; // Add this prop
  apiKeyError: string | null;
  onOpenSelectKey: () => void;
  onClearApiKeyError: () => void;
  className?: string; // Add className prop
}

const AiChatAssistant: React.FC<AiChatAssistantProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isSending,
  isGeneratingImage,
  apiKeyError,
  onOpenSelectKey,
  onClearApiKeyError,
  className,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isSending && !isGeneratingImage) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = isSending || isGeneratingImage || !!apiKeyError;

  return (
    <div
      className={`fixed top-0 right-0 h-full z-40 bg-gray-100/60 backdrop-blur-sm border-l border-gray-300 shadow-2xl transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } ${className || ""}`}
      style={{ width: "400px" }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Icon name="botMessageSquare" className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900">AI 어시스턴트</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200/50 transition-colors"
            aria-label="어시스턴트 닫기"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-grow p-4 overflow-y-auto"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* API Key Error Message */}
        {apiKeyError && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mx-4 mb-2 flex flex-col gap-2">
            <p className="text-sm font-semibold">{apiKeyError}</p>
            <button
              onClick={() => {
                onOpenSelectKey();
                onClearApiKeyError();
              }}
              className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
            >
              API 키 선택/확인
            </button>
            <p className="text-xs text-gray-600 mt-2">
              <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-red-900"
              >
                청구 문서 참조
              </a>
            </p>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-300/80 flex-shrink-0">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={"메시지를 입력하세요..."}
              rows={1}
              className="w-full pl-4 pr-12 py-2 text-sm bg-white border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              style={{ maxHeight: "120px" }}
              disabled={isDisabled}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isDisabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {isSending || isGeneratingImage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatAssistant;
