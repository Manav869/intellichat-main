import { useEffect, useState } from 'react';
import ConversationList from './Sidebar/ConversationList';
import MessageList from './ChatArea/MessageList';
import MessageInput from './ChatArea/MessageInput';
import { useSelector } from 'react-redux';
import socketService from '../../services/socketService';

const ChatLayout = () => {
  const currentConversation = useSelector(state => state.chat.currentConversation);
  const user = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  useEffect(() => {
    // Only try to connect if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('⏳ Waiting for authentication...');
      return;
    }

    if (connectionAttempted) {
      return; // Already tried to connect
    }

    // Get access token from cookies
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };
    
    const accessToken = getCookie('accessToken');
    
    console.log('🔍 Attempting socket connection...');
    console.log('� Token present:', !!accessToken);
    console.log('� User:', user?.email);
    
    if (accessToken) {
      try {
        console.log('🔌 Connecting to socket...');
        socketService.connect(accessToken);
        setConnectionAttempted(true);
        
        // Monitor connection status
        const checkInterval = setInterval(() => {
          const isConnected = socketService.isConnected();
          console.log('📡 Socket status:', isConnected ? 'Connected' : 'Disconnected');
          setSocketConnected(isConnected);
        }, 2000);

        return () => clearInterval(checkInterval);
      } catch (error) {
        console.error('❌ Socket connection error:', error);
        setConnectionAttempted(true);
      }
    } else {
      console.error('❌ No access token available');
    }
  }, [isAuthenticated, user, connectionAttempted]);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Connection indicator in top right */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm shadow-lg">
        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
        <span className="text-gray-300">
          {socketConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {/* Sidebar */}
      <ConversationList />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <h2 className="text-lg font-medium text-white">
                {currentConversation.title}
              </h2>
            </div>

            {/* Messages */}
            <MessageList />

            {/* Input Area */}
            <MessageInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-xl font-medium mb-2">Welcome to IntelliChat</h3>
              <p>Select a conversation or create a new one to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;