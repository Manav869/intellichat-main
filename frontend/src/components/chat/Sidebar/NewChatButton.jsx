import { useDispatch } from 'react-redux';
import { createConversation, fetchConversations } from '../../../redux/slices/chatSlice';

const NewChatButton = () => {
  const dispatch = useDispatch();

  const handleNewChat = async () => {
    try {
      // Create a new conversation with a timestamp-based title
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      await dispatch(createConversation({
        title: `Chat ${timestamp}`,
        aiProvider: "groq"
      })).unwrap();
      
      // Refresh the conversation list
      dispatch(fetchConversations());
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create new chat');
    }
  };

  return (
    <button
      onClick={handleNewChat}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200
        border border-gray-700 hover:bg-gray-700 text-white"
    >
      {/* Plus icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
          clipRule="evenodd" 
        />
      </svg>
      <span className="text-sm">New Chat</span>
    </button>
  );
};

export default NewChatButton;