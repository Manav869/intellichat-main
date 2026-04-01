import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import socketService from '../services/socketService';
import { useSocket } from '../hooks/useSocket';
import './ChatInterface.css';

export default function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentMessageId, setCurrentMessageId] = useState(null);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const streamingContentRef = useRef('');

    // Get token from localStorage or cookies
    const token = localStorage.getItem('accessToken') || 
                  document.cookie.split('accessToken=')[1]?.split(';')[0];

    const { isConnected } = useSocket(token);

    useEffect(() => {
        if (!isConnected) return;

        // Listen for streaming start
        socketService.onStart(({ messageId, timestamp }) => {
            console.log('🎬 Stream started:', messageId);
            setIsStreaming(true);
            setCurrentMessageId(messageId);
            streamingContentRef.current = '';
            setError(null);
            
            // Add empty assistant message
            setMessages(prev => [...prev, {
                id: messageId,
                role: 'assistant',
                content: '',
                streaming: true,
                timestamp
            }]);
        });

        // Listen for streaming chunks
        socketService.onMessageChunk(({ messageId, content, chunkIndex }) => {
            streamingContentRef.current += content;
            
            // Update message in real-time
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, content: streamingContentRef.current }
                    : msg
            ));

            // Auto-scroll to bottom
            scrollToBottom();
        });

        // Listen for completion
        socketService.onMessageComplete(({ messageId, fullContent, chunkCount, duration }) => {
            console.log(`✅ Stream completed: ${chunkCount} chunks in ${duration}ms`);
            setIsStreaming(false);
            setCurrentMessageId(null);
            
            // Finalize message
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, content: fullContent, streaming: false }
                    : msg
            ));

            scrollToBottom();
        });

        // Listen for errors
        socketService.onError(({ messageId, error: errorMessage }) => {
            console.error('❌ Stream error:', errorMessage);
            setIsStreaming(false);
            setCurrentMessageId(null);
            setError(errorMessage);
            
            if (messageId) {
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                        ? { ...msg, content: `Error: ${errorMessage}`, streaming: false, error: true }
                        : msg
                ));
            }
        });

        // Listen for stopped
        socketService.onStopped(({ messageId }) => {
            console.log('⏹️ Stream stopped:', messageId);
            setIsStreaming(false);
            setCurrentMessageId(null);
            
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, content: msg.content + '\n\n[Generation stopped by user]', streaming: false }
                    : msg
            ));
        });

        return () => {
            socketService.removeAllListeners();
        };
    }, [isConnected]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = () => {
        if (!input.trim() || isStreaming || !isConnected) return;

        const messageId = uuidv4();
        const userMessage = {
            id: uuidv4(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        // Add user message to UI
        setMessages(prev => [...prev, userMessage]);

        // Prepare conversation history
        const conversationHistory = messages
            .filter(m => !m.error)
            .map(m => ({ role: m.role, content: m.content }));

        // Send via socket
        try {
            socketService.sendMessage({
                messageId,
                messages: [
                    ...conversationHistory,
                    { role: 'user', content: input.trim() }
                ],
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
                maxTokens: 2000
            });

            setInput('');
            setError(null);
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message. Please check your connection.');
        }
    };

    const stopGeneration = () => {
        if (currentMessageId) {
            socketService.stopGeneration(currentMessageId);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>IntelliChat</h2>
                <div className="connection-status">
                    <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </div>

            <div className="messages-container">
                {messages.map(msg => (
                    <div key={msg.id} className={`message ${msg.role} ${msg.error ? 'error' : ''}`}>
                        <div className="message-header">
                            <strong>{msg.role === 'user' ? 'You' : 'AI'}</strong>
                            {msg.timestamp && (
                                <span className="timestamp">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <div className="message-content">
                            {msg.content}
                            {msg.streaming && <span className="cursor-blink">▊</span>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}

            <div className="input-container">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
                    disabled={isStreaming || !isConnected}
                    rows={3}
                />
                
                <div className="button-group">
                    {isStreaming ? (
                        <button onClick={stopGeneration} className="stop-btn">
                            ⏹️ Stop
                        </button>
                    ) : (
                        <button 
                            onClick={sendMessage} 
                            disabled={!input.trim() || !isConnected}
                            className="send-btn"
                        >
                            📤 Send
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}