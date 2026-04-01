import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from '../../services/api/chatService';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async () => {
    const response = await chatService.getConversations();
    return response.data;
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async ({ title, aiProvider }) => {
    const response = await chatService.createConversation(title, aiProvider);
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, content, aiProvider }, { rejectWithValue }) => {
    try {
      const response = await chatService.sendMessage(conversationId, content, aiProvider);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchConversationMessages = createAsyncThunk(
  'chat/fetchConversationMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await chatService.getConversation(conversationId);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch messages');
      }
      return {
        conversation: response.data.conversation,
        messages: response.data.messages
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    streamingMessage: null, // For real-time streaming
    isStreaming: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Real-time streaming reducers
    startStreaming: (state, action) => {
      state.isStreaming = true;
      state.streamingMessage = {
        _id: action.payload.messageId,
        role: 'assistant',
        content: '',
        conversationId: state.currentConversation?._id,
        isStreaming: true
      };
    },
    appendStreamChunk: (state, action) => {
      if (state.streamingMessage) {
        state.streamingMessage.content += action.payload.content;
      }
    },
    completeStreaming: (state, action) => {
      if (state.streamingMessage) {
        // Add the completed streaming message to messages
        state.messages.push({
          ...state.streamingMessage,
          _id: action.payload.messageId,
          content: action.payload.fullContent,
          isStreaming: false,
          createdAt: action.payload.timestamp
        });
        state.streamingMessage = null;
        state.isStreaming = false;
      }
    },
    cancelStreaming: (state) => {
      state.streamingMessage = null;
      state.isStreaming = false;
    },
    addUserMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateConversationTitle: (state, action) => {
      const { conversationId, title } = action.payload;
      // Update in conversations list
      const convIndex = state.conversations.findIndex(conv => conv._id === conversationId);
      if (convIndex !== -1) {
        state.conversations[convIndex].title = title;
      }
      // Update current conversation if it matches
      if (state.currentConversation?._id === conversationId) {
        state.currentConversation.title = title;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.conversations;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create Conversation
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
        state.messages = []; // Clear messages for new conversation
        state.error = null;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.messageLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messageLoading = false;
        const { userMessage, aiMessage, conversation } = action.payload;
        state.messages.push(userMessage, aiMessage);

        // Update conversation if needed
        if (conversation) {
          const index = state.conversations.findIndex(conv => conv._id === conversation._id);
          if (index !== -1) {
            state.conversations[index] = conversation;
          }
          if (state.currentConversation?._id === conversation._id) {
            state.currentConversation = conversation;
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.messageLoading = false;
        state.error = action.payload || 'Failed to send message';
      })
      // Add cases for fetching conversation messages
      .addCase(fetchConversationMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.currentConversation = action.payload.conversation;
        state.error = null;
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load messages';
        state.messages = [];
      });
  }
});

export const { clearError, startStreaming, appendStreamChunk, completeStreaming, cancelStreaming, addUserMessage, updateConversationTitle } = chatSlice.actions;
export default chatSlice.reducer;