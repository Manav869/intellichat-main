import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addUserMessage, startStreaming, appendStreamChunk, completeStreaming, cancelStreaming } from '../../../redux/slices/chatSlice';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';
import socketService from '../../../services/socketService';
import { v4 as uuidv4 } from 'uuid';

const MessageInput = ({ aiSettings = {} }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const dispatch = useDispatch();
  const currentConversation = useSelector(state => state.chat.currentConversation);
  const isStreaming = useSelector(state => state.chat.isStreaming);
  const messages = useSelector(state => state.chat.messages);
  const theme = useSelector(selectCurrentTheme);

  // Default AI settings
  const defaultSettings = {
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0
  };

  const currentSettings = { ...defaultSettings, ...aiSettings };

  useEffect(() => {
    // Setup socket listeners for streaming
    socketService.onStart((data) => {
      console.log('🎬 Streaming started:', data);
      dispatch(startStreaming({ messageId: data.messageId }));
    });

    socketService.onMessageChunk((data) => {
      console.log('📦 Received chunk:', data.content);
      dispatch(appendStreamChunk({ content: data.content }));
    });

    socketService.onMessageComplete((data) => {
      console.log('✅ Streaming complete:', data);
      dispatch(completeStreaming({
        messageId: data.messageId,
        fullContent: data.fullContent,
        timestamp: data.timestamp
      }));
    });

    socketService.onError((data) => {
      console.error('❌ Streaming error:', data);
      dispatch(cancelStreaming());
      alert(`Error: ${data.error}`);
    });

    socketService.onStopped((data) => {
      console.log('⏹️ Streaming stopped:', data);
      dispatch(cancelStreaming());
    });

    return () => {
      // Cleanup listeners
      socketService.removeListener('chat:start');
      socketService.removeListener('chat:chunk');
      socketService.removeListener('chat:complete');
      socketService.removeListener('chat:error');
      socketService.removeListener('chat:stopped');
    };
  }, [dispatch]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() || !currentConversation || isStreaming) {
      return;
    }

    if (!socketService.isConnected()) {
      console.error('❌ Socket not connected');
      alert('Cannot send message: Not connected to server.\n\nPlease wait a moment and try again, or refresh the page.');
      return;
    }

    try {
      const messageId = uuidv4();
      const userMessageId = uuidv4();

      console.log('📤 Sending message via socket...');

      // Add user message immediately
      const userMessage = {
        _id: userMessageId,
        role: 'user',
        content: content.trim(),
        conversationId: currentConversation._id,
        createdAt: new Date().toISOString()
      };
      
      dispatch(addUserMessage(userMessage));

      // Get message history for context
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add current user message
      messageHistory.push({
        role: 'user',
        content: content.trim()
      });

      // Send via socket for streaming with AI settings
      socketService.sendMessage({
        messages: messageHistory,
        provider: currentConversation.aiProvider || 'groq',
        model: currentSettings.model,
        temperature: currentSettings.temperature,
        maxTokens: currentSettings.maxTokens,
        topP: currentSettings.topP,
        frequencyPenalty: currentSettings.frequencyPenalty,
        presencePenalty: currentSettings.presencePenalty,
        messageId: messageId,
        conversationId: currentConversation._id,
        userMessageContent: content.trim()
      });

      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleStop = () => {
    if (isStreaming) {
      socketService.stopGeneration();
      dispatch(cancelStreaming());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`${theme.colors.border.primary} border-t ${theme.colors.bg.secondary} p-4 backdrop-blur-sm`}
    >
      <div className="flex gap-3 max-w-4xl mx-auto">
        {/* Textarea Container with focus ring */}
        <div className={`flex-1 relative transition-all duration-300 ${
          isFocused ? `ring-2 ${theme.colors.border.focus} rounded-xl` : ''
        }`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={currentConversation ? "Type your message... (Shift+Enter for new line)" : "Select a conversation to start chatting"}
            className={`w-full min-h-[52px] max-h-[200px] p-4 ${theme.colors.input} rounded-xl resize-none focus:outline-none transition-all duration-200`}
            disabled={!currentConversation || isStreaming}
            rows={1}
          />
          
          {/* Character count indicator (optional) */}
          {content.length > 0 && (
            <div className={`absolute bottom-2 right-2 text-xs ${theme.colors.text.tertiary}`}>
              {content.length}
            </div>
          )}
        </div>

        {/* Send/Stop Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 min-w-[100px] shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 group"
          >
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="6" width="8" height="8" rx="1" />
            </svg>
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!currentConversation || !content.trim()}
            className={`px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-w-[100px] transition-all duration-200 shadow-lg group
              ${(!currentConversation || !content.trim())
                ? `${theme.colors.bg.tertiary} ${theme.colors.text.tertiary} cursor-not-allowed`
                : `${theme.colors.gradient.button} text-white hover:shadow-xl transform hover:scale-105`
              }`}
          >
            <span>Send</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${
                (!currentConversation || !content.trim()) ? '' : 'group-hover:translate-x-1'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Typing indicator hint */}
      {isFocused && !isStreaming && (
        <div className={`text-xs ${theme.colors.text.tertiary} mt-2 text-center animate-fade-in`}>
          Press <kbd className={`px-2 py-1 ${theme.colors.bg.tertiary} rounded ${theme.colors.text.secondary}`}>Enter</kbd> to send, <kbd className={`px-2 py-1 ${theme.colors.bg.tertiary} rounded ${theme.colors.text.secondary}`}>Shift+Enter</kbd> for new line
        </div>
      )}
    </form>
  );
};

export default MessageInput;