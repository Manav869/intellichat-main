import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';

// Add debug logging
console.log('Configuring store');

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
    theme: themeReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

// Log initial state
console.log('Initial state:', store.getState());

export default store;