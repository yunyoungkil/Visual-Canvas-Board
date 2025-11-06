
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';
import Icon from './Icon';

interface ChatMessageProps {
    message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';
    
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                    <Icon name="botMessageSquare" className="w-5 h-5" />
                </div>
            )}
            <div 
                className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                    isUser 
                        ? 'bg-blue-500 text-white rounded-br-lg' 
                        : 'bg-white text-gray-800 rounded-bl-lg border border-gray-200'
                }`}
            >
                {isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-4 prose-ul:my-3 prose-ol:my-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessageComponent;
