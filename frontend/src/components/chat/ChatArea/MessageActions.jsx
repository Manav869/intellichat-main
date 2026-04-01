import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';

const MessageActions = ({ message, onRegenerate, onCopy, onEdit, onDelete }) => {
  const theme = useSelector(selectCurrentTheme);
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (onCopy) onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) onRegenerate(message);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(message);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Delete this message?')) {
      onDelete(message);
    }
  };

  // Don't show actions while streaming
  if (isStreaming) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Action Buttons */}
      <div
        className={`flex items-center gap-1 transition-all duration-200 ${
          showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.tertiary} hover:${theme.colors.text.primary} transition-all hover:scale-110 group relative`}
          title="Copy message"
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Regenerate Button (AI messages only) */}
        {!isUser && (
          <button
            onClick={handleRegenerate}
            className={`p-1.5 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.tertiary} hover:${theme.colors.text.primary} transition-all hover:scale-110 group relative`}
            title="Regenerate response"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* Edit Button (User messages only) */}
        {isUser && (
          <button
            onClick={handleEdit}
            className={`p-1.5 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.tertiary} hover:${theme.colors.text.primary} transition-all hover:scale-110 group relative`}
            title="Edit message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className={`p-1.5 rounded-lg ${theme.colors.bg.tertiary} text-red-400 hover:text-red-300 transition-all hover:scale-110 group relative`}
          title="Delete message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Token Count (if available) */}
        {message.tokenCount && (
          <div className={`ml-2 px-2 py-1 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.tertiary} text-xs font-mono`}>
            {message.tokenCount} tokens
          </div>
        )}

        {/* Response Time (if available) */}
        {message.responseTime && (
          <div className={`px-2 py-1 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.tertiary} text-xs`}>
            {message.responseTime}ms
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageActions;
