import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(token) {
        if (this.socket?.connected) {
            console.log('⚠️ Socket already connected, reusing existing connection');
            console.log('   Socket ID:', this.socket.id);
            return this.socket;
        }

        if (this.socket && !this.socket.connected) {
            console.log('⚠️ Socket exists but disconnected, cleaning up old socket');
            this.disconnect();
        }

        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        console.log('🔌 Creating NEW socket connection to:', SOCKET_URL);
        console.log('   Timestamp:', new Date().toISOString());
        if (token) {
            console.log('🔑 Using token:', token.substring(0, 20) + '...');
        } else {
            console.log('🍪 Using cookies for authentication');
        }

        this.socket = io(SOCKET_URL, {
            auth: token ? { token } : {}, // Only send token if provided
            withCredentials: true, // This sends cookies!
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts
        });

        this.setupEventHandlers();

        return this.socket;
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('✅ Socket connected successfully!');
            console.log('🆔 Socket ID:', this.socket.id);
            this.reconnectAttempts = 0;
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            console.error('Error details:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Max reconnection attempts reached');
                this.disconnect();
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            
            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect manually
                console.log('🔄 Server disconnected, attempting reconnect...');
                setTimeout(() => this.socket?.connect(), 1000);
            }
        });

        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 Manually disconnecting socket:', this.socket.id);
            this.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            console.log('✅ Socket disconnected and cleaned up');
        } else {
            console.log('⚠️ Disconnect called but no socket exists');
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }

    // Send a chat message
    sendMessage(data) {
        if (!this.socket || !this.isConnected()) {
            throw new Error('Socket not connected');
        }
        
        console.log('📤 Sending message:', data.messageId);
        this.socket.emit('chat:message', data);
    }

    // Stop generation
    stopGeneration(messageId) {
        if (!this.socket || !this.isConnected()) {
            throw new Error('Socket not connected');
        }
        
        console.log('⏹️ Stopping generation:', messageId);
        this.socket.emit('chat:stop', { messageId });
    }

    // Listen for streaming start
    onStart(callback) {
        if (!this.socket) return;
        this.socket.on('chat:start', callback);
        this.listeners.set('chat:start', callback);
    }

    // Listen for streaming chunks
    onMessageChunk(callback) {
        if (!this.socket) return;
        this.socket.on('chat:chunk', callback);
        this.listeners.set('chat:chunk', callback);
    }

    // Listen for completion
    onMessageComplete(callback) {
        if (!this.socket) return;
        this.socket.on('chat:complete', callback);
        this.listeners.set('chat:complete', callback);
    }

    // Listen for errors
    onError(callback) {
        if (!this.socket) return;
        this.socket.on('chat:error', callback);
        this.listeners.set('chat:error', callback);
    }

    // Listen for stopped event
    onStopped(callback) {
        if (!this.socket) return;
        this.socket.on('chat:stopped', callback);
        this.listeners.set('chat:stopped', callback);
    }

    // Typing indicators
    startTyping() {
        if (this.socket && this.isConnected()) {
            this.socket.emit('typing:start');
        }
    }

    stopTyping() {
        if (this.socket && this.isConnected()) {
            this.socket.emit('typing:stop');
        }
    }

    onUserTyping(callback) {
        if (!this.socket) return;
        this.socket.on('user:typing', callback);
        this.listeners.set('user:typing', callback);
    }

    onUserStoppedTyping(callback) {
        if (!this.socket) return;
        this.socket.on('user:stopped-typing', callback);
        this.listeners.set('user:stopped-typing', callback);
    }

    // Listen for conversation title updates
    onConversationTitleUpdated(callback) {
        if (!this.socket) return;
        this.socket.on('conversation:title-updated', callback);
        this.listeners.set('conversation:title-updated', callback);
    }

    // Remove all listeners
    removeAllListeners() {
        if (!this.socket) return;
        
        this.listeners.forEach((callback, event) => {
            this.socket.off(event, callback);
        });
        this.listeners.clear();
    }

    // Remove specific listener
    removeListener(event) {
        if (!this.socket) return;
        
        const callback = this.listeners.get(event);
        if (callback) {
            this.socket.off(event, callback);
            this.listeners.delete(event);
        }
    }
}

export default new SocketService();