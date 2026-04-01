const BASE_URL = '/api';

export const chatService = {
  // Create a new conversation
  createConversation: async (title, aiProvider = 'groq') => {
    try {
      const response = await fetch(`${BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title, aiProvider })
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get all conversations
  getConversations: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${BASE_URL}/chat/conversations?page=${page}&limit=${limit}`,
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get a specific conversation with messages
  getConversation: async (conversationId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/chat/conversations/${conversationId}`,
            {
                credentials: 'include'
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch conversation');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching conversation:', error);
        throw error;
    }
  },

  // Send a message
  sendMessage: async (conversationId, content, aiProvider) => {
    try {
      const response = await fetch(
        `${BASE_URL}/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ content, aiProvider })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to send message');
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  // Delete a conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/chat/conversations/${conversationId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      return response.json();
    } catch (error) {
      throw new Error(error.message);
    }
  }
};

export default chatService;