import { useEffect, useState } from 'react';
import ConversationList from './Sidebar/ConversationList';
import MessageList from './ChatArea/MessageList';
import MessageInput from './ChatArea/MessageInput';
import AISettingsPanel from './Settings/AISettingsPanel';
import ProviderStatus from './Settings/ProviderStatus';
import TokenUsageDisplay from './ChatArea/TokenUsageDisplay';
import AIModelSelector from './Settings/AIModelSelector';
import { useSelector, useDispatch } from 'react-redux';
import socketService from '../../services/socketService';
import { updateConversationTitle } from '../../redux/slices/chatSlice';
import { selectCurrentTheme } from '../../redux/slices/themeSlice';

const ChatLayoutEnhanced = () => {
  const currentConversation = useSelector(state => state.chat.currentConversation);
  const messages = useSelector(state => state.chat.messages);
  const user = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const [socketConnected, setSocketConnected] = useState(false);
  const dispatch = useDispatch();
  const theme = useSelector(selectCurrentTheme);

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    model: 'llama-3.1-8b-instant'
  });

  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [showSettings, setShowSettings] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

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

  const handleAISettingsChange = (newSettings) => {
    setAiSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleModelUpdate = (provider, model) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    setAiSettings(prev => ({ ...prev, model }));
  };

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

      {/* Left Sidebar - Conversations */}
      <ConversationList />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {currentConversation ? (
          <>
            {/* Chat Header with AI Controls */}
            <div className={`${theme.colors.header} p-4 shadow-xl`}>
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex-1">
                  <h2 className={`text-xl font-semibold ${theme.colors.text.primary} mb-1 flex items-center gap-2`}>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    {currentConversation.title}
                  </h2>
                  <p className={`text-sm ${theme.colors.text.secondary}`}>
                    {selectedProvider} • {selectedModel}
                  </p>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-3">
                  {/* AI Settings Button */}
                  <AISettingsPanel
                    settings={aiSettings}
                    onSettingsChange={handleAISettingsChange}
                    isOpen={showSettings}
                    onToggle={() => setShowSettings(!showSettings)}
                  />

                  {/* Toggle Right Panel Button */}
                  <button
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    className={`p-2 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-all`}
                    title={showRightPanel ? 'Hide sidebar' : 'Show sidebar'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showRightPanel ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area with Right Panel */}
            <div className="flex-1 flex overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                <MessageList />
                <MessageInput aiSettings={{ ...aiSettings, provider: selectedProvider }} />
              </div>

              {/* Right Sidebar - AI Controls & Stats */}
              {showRightPanel && (
                <div className={`w-80 ${theme.colors.bg.secondary} border-l ${theme.colors.border.primary} p-4 overflow-y-auto space-y-4 animate-slide-in-right`}>
                  {/* AI Model Selector */}
                  <div>
                    <h3 className={`text-sm font-bold ${theme.colors.text.primary} mb-3 flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      AI Model
                    </h3>
                    <AIModelSelector
                      selectedProvider={selectedProvider}
                      selectedModel={selectedModel}
                      onUpdate={handleModelUpdate}
                    />
                  </div>

                  {/* Provider Status */}
                  <div>
                    <h3 className={`text-sm font-bold ${theme.colors.text.primary} mb-3 flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Provider Health
                    </h3>
                    <ProviderStatus selectedProvider={selectedProvider} />
                  </div>

                  {/* Token Usage Display */}
                  <div>
                    <h3 className={`text-sm font-bold ${theme.colors.text.primary} mb-3 flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Usage Statistics
                    </h3>
                    <TokenUsageDisplay messages={messages} />
                  </div>

                  {/* Quick Tips */}
                  <div className={`p-4 rounded-xl ${theme.colors.bg.tertiary} border ${theme.colors.border.primary}`}>
                    <h4 className={`text-sm font-bold ${theme.colors.text.primary} mb-2 flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Quick Tips
                    </h4>
                    <ul className={`text-xs ${theme.colors.text.tertiary} space-y-2`}>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>Use higher temperature (0.8-1.0) for creative tasks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>Use lower temperature (0.2-0.4) for factual responses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>Increase max tokens for longer responses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>Hover over messages to see actions</span>
                      </li>
                    </ul>
                  </div>

                  {/* Current Settings Summary */}
                  <div className={`p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border ${theme.colors.border.primary}`}>
                    <h4 className={`text-sm font-bold ${theme.colors.text.primary} mb-3`}>
                      Active Settings
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs ${theme.colors.text.tertiary}`}>Temperature</span>
                        <span className={`text-xs font-mono ${theme.colors.text.primary} bg-indigo-500/20 px-2 py-1 rounded`}>
                          {aiSettings.temperature.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs ${theme.colors.text.tertiary}`}>Max Tokens</span>
                        <span className={`text-xs font-mono ${theme.colors.text.primary} bg-indigo-500/20 px-2 py-1 rounded`}>
                          {aiSettings.maxTokens}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs ${theme.colors.text.tertiary}`}>Model</span>
                        <span className={`text-xs font-mono ${theme.colors.text.primary} bg-indigo-500/20 px-2 py-1 rounded truncate max-w-[150px]`}>
                          {selectedModel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

export default ChatLayoutEnhanced;
