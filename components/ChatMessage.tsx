import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { ChatMessage } from "../types";
import Icon from "./Icon";

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
          <Icon name="botMessageSquare" className="w-5 h-5" />
        </div>
      )}
      <div
        className={`max-w-sm md:max-w-lg p-4 rounded-2xl ${
          isUser
            ? "bg-blue-500 text-white rounded-br-lg"
            : "bg-white text-gray-800 rounded-bl-lg border border-gray-200 shadow-sm"
        }`}
        style={{
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
        }}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <div className="text-sm markdown-content break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                p: ({ children }) => (
                  <p
                    className="mb-3 last:mb-0 leading-relaxed break-words"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      textAlign: "justify",
                      lineHeight: "1.6",
                    }}
                  >
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                code: ({ inline, children, ...props }: any) =>
                  inline ? (
                    <code
                      className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2"
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                pre: ({ children }) => <pre className="my-2">{children}</pre>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-gray-900">
                    {children}
                  </strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-4 border-gray-300" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full text-xs border-collapse border border-gray-300">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 p-2 font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 p-2">{children}</td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageComponent;
