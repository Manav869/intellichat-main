import { useDispatch, useSelector } from 'react-redux';
import { fetchConversationMessages } from '../../../redux/slices/chatSlice';

const ConversationItem = ({ conversation }) => {
  const dispatch = useDispatch();
  const currentConversation = useSelector(state => state.chat.currentConversation);
  const isActive = currentConversation?._id === conversation._id;

  const handleConversationClick = () => {
    if (!isActive) {
      dispatch(fetchConversationMessages(conversation._id))
        .unwrap()
        .catch(error => {
          console.error('Failed to fetch messages:', error);
        });
    }
  };

  return (
    <div
      onClick={handleConversationClick}
      className={`conversation-item cursor-pointer p-3 rounded-lg transition-colors
        ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
    >
      <div className="conversation-title font-medium">
        {conversation.title || 'New Chat'}
      </div>
      <div className={`conversation-meta text-sm ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
        <span className="conversation-date">
          {new Date(conversation.updatedAt || conversation.createdAt).toLocaleDateString()}
        </span>
        {conversation.messageCount > 0 && (
          <span className="message-count ml-2">
            • {conversation.messageCount} messages
          </span>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;