import { useEffect, useState } from 'react';
import ConversationList from './Sidebar/ConversationList';
import MessageList from './ChatArea/MessageList';
import MessageInput from './ChatArea/MessageInput';
import { useSelector, useDispatch } from 'react-redux';
import socketService from '../../services/socketService';
import { updateConversationTitle } from '../../redux/slices/chatSlice';
import { selectCurrentTheme } from '../../redux/slices/themeSlice';

const ChatLayout = () => {
  const currentConversation = useSelector(state => state.chat.currentConversation);
  const user = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const [socketConnected, setSocketConnected] = useState(false);
  const dispatch = useDispatch();
  const theme = useSelector(selectCurrentTheme);

  useEffect(() => {
    let retryInterval = null;
    let statusInterval = null;
    
    console.log('🔍 ChatLayout Effect Running');
    console.log('👤 User:', user);
    console.log('🔐 IsAuthenticated:', isAuthenticated);
    
    // Function to attempt socket connection
    const attemptConnection = () => {
      if (socketService.isConnected()) {
        console.log('✅ Socket already connected');
        setSocketConnected(true);
        return true;
      }

      console.log('🔌 Attempting socket connection with httpOnly cookies...');
      console.log('👤 User:', user?.email);
      
      try {
        // Connect without token - cookies will be sent automatically via withCredentials
        socketService.connect();
        console.log('📡 Connection initiated (cookies will be sent automatically)');
        return true;
      } catch (error) {
        console.error('❌ Connection error:', error);
        return false;
      }
    };

    // Only try to connect if authenticated AND user exists
    if (isAuthenticated && user) {
      console.log('✅ User is authenticated, attempting connection');
      attemptConnection();
      
      // Setup listener for conversation title updates
      socketService.onConversationTitleUpdated((data) => {
        console.log('📝 Conversation title updated:', data);
        dispatch(updateConversationTitle({
          conversationId: data.conversationId,
          title: data.title
        }));
      });
      
      // Retry connection every 5 seconds if not connected
      retryInterval = setInterval(() => {
        if (!socketService.isConnected()) {
          console.log('🔄 Retrying connection...');
          attemptConnection();
        } else {
          console.log('✅ Connection successful, stopping retries');
          clearInterval(retryInterval);
        }
      }, 5000);
    } else {
      console.warn('⚠️ User not authenticated or user object missing');
      console.log('  - isAuthenticated:', isAuthenticated);
      console.log('  - user:', user);
    }

    // Monitor connection status
    statusInterval = setInterval(() => {
      setSocketConnected(socketService.isConnected());
    }, 2000);

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (statusInterval) clearInterval(statusInterval);
      socketService.removeListener('conversation:title-updated');
    };
  }, [isAuthenticated, user, dispatch]);

  return (
    <div className={`flex h-screen overflow-hidden ${theme.colors.gradient.primary}`}>
      {/* Connection indicator - simple dot and text */}
      <div className="absolute top-4 right-6 z-40 flex items-center gap-2 transition-all duration-300">
        <div className={`w-2 h-2 rounded-full ${
          socketConnected ? 'bg-green-500' : 'bg-yellow-500'
        } ${socketConnected ? 'animate-pulse' : 'animate-pulse'}`}></div>
        <span className={`text-sm font-medium ${socketConnected ? theme.colors.text.primary : theme.colors.text.secondary}`}>
          {socketConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {/* Warning if not authenticated */}
      {(!isAuthenticated || !user) && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 backdrop-blur-sm border border-yellow-400/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Session expired. Please <a href="/login" className="underline font-bold hover:text-yellow-200 transition-colors">log in again</a>.</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <ConversationList />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {currentConversation ? (
          <>
            {/* Chat Header with glassmorphism effect */}
            <div className={`${theme.colors.header} p-4 shadow-xl`}>
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div>
                  <h2 className={`text-xl font-semibold ${theme.colors.text.primary} mb-1 flex items-center gap-2`}>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    {currentConversation.title}
                  </h2>
                  <p className={`text-sm ${theme.colors.text.secondary}`}>
                    {/* Display conversation's provider and model (what's actually being used) */}
                    {currentConversation.aiProvider || 'groq'} • {currentConversation.aiModel || (currentConversation.aiProvider === 'gemini' ? 'gemini-1.5-flash' : 'llama-3.3-70b-versatile')}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <MessageList />

            {/* Input Area */}
            <MessageInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in px-4">
              <div className={`mb-8 inline-block p-6 ${theme.colors.bg.secondary} rounded-3xl backdrop-blur-sm ${theme.colors.border.primary} border shadow-2xl`}>
                <svg className={`w-20 h-20 ${theme.colors.text.secondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className={`text-3xl font-bold mb-4 ${theme.colors.text.primary}`}>
                Welcome to IntelliChat
              </h3>
              <p className={`${theme.colors.text.secondary} text-lg mb-2`}>Your AI-powered conversation assistant</p>
              <p className={`${theme.colors.text.tertiary}`}>Select a conversation from the sidebar or create a new one to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
