import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import MessageActions from './MessageActions';

const Message = ({ message, isHistorical = false, onRegenerate, onEdit, onDelete }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const theme = useSelector(selectCurrentTheme);
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // For historical messages (loaded from database), show immediately
    if (isHistorical) {
      setDisplayedContent(message.content);
      setIsTyping(false);
      return;
    }

    // For streaming messages, show content immediately (already handled by chunks)
    if (isStreaming) {
      setDisplayedContent(message.content);
      setIsTyping(true);
      return;
    }

    // For new messages that just arrived, show immediately without typing effect
    setDisplayedContent(message.content);
    setIsTyping(false);
  }, [message.content, isStreaming, isHistorical]);

  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-fade-in`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
          isUser 
            ? theme.colors.message.user 
            : theme.colors.message.assistant
        }`}
      >
        {isUser ? (
          // User messages: simple text
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">
              {displayedContent}
            </p>
          </div>
        ) : (
          // AI messages: markdown formatted
          <div className="prose prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:shadow-inner">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                // Custom styling for code blocks
                code: ({ node, inline, className, children, ...props }) => {
                  return inline ? (
                    <code className="bg-gray-900 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Custom styling for links
                a: ({ node, children, ...props }) => (
                  <a 
                    className="text-blue-400 hover:text-blue-300 underline transition-colors" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    {...props}
                  >
                    {children}
                  </a>
                ),
                // Custom styling for lists
                ul: ({ node, children, ...props }) => (
                  <ul className="list-disc list-inside space-y-1 my-2" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ node, children, ...props }) => (
                  <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
                    {children}
                  </ol>
                ),
                // Custom styling for headings
                h1: ({ node, children, ...props }) => (
                  <h1 className="text-2xl font-bold mt-4 mb-2 text-white" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ node, children, ...props }) => (
                  <h2 className="text-xl font-bold mt-3 mb-2 text-white" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ node, children, ...props }) => (
                  <h3 className="text-lg font-bold mt-2 mb-1 text-white" {...props}>
                    {children}
                  </h3>
                ),
                // Custom styling for paragraphs
                p: ({ node, children, ...props }) => (
                  <p className="my-2 leading-relaxed text-gray-100" {...props}>
                    {children}
                  </p>
                ),
                // Custom styling for blockquotes
                blockquote: ({ node, children, ...props }) => (
                  <blockquote className="border-l-4 border-indigo-500 pl-4 italic my-2 text-gray-300" {...props}>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {displayedContent}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Animated cursor for streaming */}
        {(isStreaming || isTyping) && (
          <span className="inline-flex items-center ml-1">
            <span className="w-2 h-5 bg-white rounded-sm animate-blink"></span>
          </span>
        )}
        
        {/* Timestamp and Actions Row */}
        {!isStreaming && (
          <div className="flex items-center justify-between gap-2 mt-2">
            {/* Timestamp */}
            {message.createdAt && (
              <div className={`text-xs flex items-center gap-1 ${
                isUser ? 'text-indigo-200' : 'text-gray-400'
              }`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            )}

            {/* Message Actions */}
            <MessageActions
              message={message}
              onRegenerate={onRegenerate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;