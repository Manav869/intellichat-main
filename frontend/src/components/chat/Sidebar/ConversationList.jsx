import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConversations, createConversation, fetchConversationMessages } from '../../../redux/slices/chatSlice';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';
import { logout, updatePreferences } from '../../../redux/slices/authSlice';
import ConversationItem from './ConversationItem';
import ThemeToggle from '../Settings/ThemeToggle';
import AIModelSelector from '../Settings/AIModelSelector';

const ConversationList = () => {
  const dispatch = useDispatch();
  const conversations = useSelector(state => state.chat.conversations);
  const loading = useSelector(state => state.chat.loading);
  const theme = useSelector(selectCurrentTheme);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setShowUserMenu(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      // Use user's preferred AI provider, or default to groq
      const preferredProvider = user?.preferences?.aiProvider || 'groq';
      await dispatch(createConversation({
        title: `New Chat - ${timestamp}`,
        aiProvider: preferredProvider
      })).unwrap();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleModelUpdate = async (aiProvider, aiModel) => {
    try {
      await dispatch(updatePreferences({ aiProvider, aiModel })).unwrap();
      console.log('Model preferences updated:', { aiProvider, aiModel });
    } catch (error) {
      console.error('Failed to update model preferences:', error);
    }
  };

  return (
    <>
      <div className={`flex flex-col h-full transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${theme.colors.sidebar} relative z-10`}>
        
        <div className={`flex items-center justify-between p-3 ${theme.colors.border.primary} border-b`}>
          {!isCollapsed && (
            <h2 className={`font-semibold ${theme.colors.text.primary} text-lg`}>
              Chats
            </h2>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-all transform hover:scale-110 ${isCollapsed ? 'w-full flex justify-center' : ''}`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="p-3">
          {isCollapsed ? (
            <>
              <button
                onClick={handleNewChat}
                className={`w-full p-3 rounded-lg bg-gradient-to-r ${theme.colors.gradient.button} text-white hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center group mb-2`}
                title="New Chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-full p-3 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary} hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center group`}
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleNewChat}
                className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r ${theme.colors.gradient.button} text-white font-medium hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 mb-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Chat</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-full py-3 px-4 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.text.primary} hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme.colors.text.secondary}`}></div>
            </div>
          ) : conversations.length === 0 ? (
            !isCollapsed && (
              <div className={`${theme.colors.text.tertiary} text-sm text-center p-4`}>
                No conversations yet. Click New Chat to start!
              </div>
            )
          ) : (
            <div className="space-y-1">
              {conversations.map(conversation => (
                isCollapsed ? (
                  <button
                    key={conversation._id}
                    onClick={() => {
                      dispatch(fetchConversationMessages(conversation._id));
                    }}
                    className={`w-full p-3 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.primary} hover:${theme.colors.bg.active} transition-all flex items-center justify-center group`}
                    title={conversation.title}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                ) : (
                  <ConversationItem 
                    key={conversation._id} 
                    conversation={conversation} 
                  />
                )
              ))}
            </div>
          )}
        </div>

        <div className={`p-3 ${theme.colors.border.primary} border-t relative`}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full p-3 rounded-lg ${theme.colors.bg.tertiary} hover:${theme.colors.bg.active} transition-all flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} shadow-lg hover:shadow-xl transform hover:scale-105`}
            title={user?.email}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-left truncate">
                <p className={`font-semibold ${theme.colors.text.primary} text-sm truncate`}>{user?.name}</p>
                <p className={`text-xs ${theme.colors.text.tertiary} truncate`}>{user?.email}</p>
              </div>
            )}
          </button>
        </div>
      </div>

      {showUserMenu && (
        <div 
          className="fixed inset-0 z-50" 
          onClick={() => setShowUserMenu(false)}
        >
          <div 
            className={`absolute ${isCollapsed ? 'left-20' : 'left-72'} bottom-20 ${theme.colors.bg.secondary} ${theme.colors.border.primary} border rounded-xl shadow-2xl p-4 max-w-xs w-80 animate-scale-in`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            <div className={`flex items-center gap-3 mb-4 pb-4 border-b ${theme.colors.border.primary}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${theme.colors.text.primary} truncate`}>{user?.name}</h3>
                <p className={`text-sm ${theme.colors.text.tertiary} truncate`}>{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${theme.colors.text.secondary} mb-2`}>
                  Theme
                </label>
                <ThemeToggle />
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full px-3 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all text-left flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" 
          onClick={() => setShowSettings(false)}
        >
          <div 
            className={`${theme.colors.bg.secondary} ${theme.colors.border.primary} border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${theme.colors.text.primary}`}>Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-lg ${theme.colors.bg.tertiary} ${theme.colors.text.primary} hover:scale-110 transition-transform`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${theme.colors.text.secondary} mb-3`}>
                  Theme
                </label>
                <ThemeToggle />
              </div>
              
              <div className={`pt-4 border-t ${theme.colors.border.primary}`}>
                <AIModelSelector
                  selectedProvider={user?.preferences?.aiProvider || 'groq'}
                  selectedModel={user?.preferences?.aiModel || 'llama-3.3-70b-versatile'}
                  onUpdate={handleModelUpdate}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConversationList;
