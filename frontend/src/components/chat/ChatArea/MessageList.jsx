import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Message from './Message';
import { clearError } from '../../../redux/slices/chatSlice';
import { selectCurrentTheme } from '../../../redux/slices/themeSlice';

const MessageList = () => {
    const dispatch = useDispatch();
    const messages = useSelector(state => state.chat.messages);
    const streamingMessage = useSelector(state => state.chat.streamingMessage);
    const loading = useSelector(state => state.chat.loading);
    const error = useSelector(state => state.chat.error);
    const currentConversation = useSelector(state => state.chat.currentConversation);
    const isStreaming = useSelector(state => state.chat.isStreaming);
    const theme = useSelector(selectCurrentTheme);
    const messageEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const scrollToBottom = (behavior = 'smooth') => {
        messageEndRef.current?.scrollIntoView({ behavior });
    };

    // Scroll to bottom when messages change or streaming updates
    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    // Scroll immediately when a new conversation is selected
    useEffect(() => {
        if (currentConversation) {
            setTimeout(() => scrollToBottom('auto'), 100);
        }
    }, [currentConversation?._id]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    if (loading) {
        return (
            <div className={`flex-1 flex items-center justify-center ${theme.colors.gradient.primary}`}>
                <div className="text-center">
                    <div className={`inline-block animate-spin rounded-full h-12 w-12 border-4 ${theme.colors.border.primary} border-t-indigo-600 mb-4`}></div>
                    <p className={`${theme.colors.text.secondary} animate-pulse`}>Loading messages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex-1 flex items-center justify-center ${theme.colors.gradient.primary} p-4`}>
                <div className="bg-red-900/30 border border-red-700 text-red-200 px-6 py-4 rounded-xl shadow-xl max-w-md backdrop-blur-sm animate-fade-in" role="alert">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="font-semibold mb-1">Error</h3>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentConversation) {
        return (
            <div className={`flex-1 flex items-center justify-center ${theme.colors.gradient.primary} ${theme.colors.text.secondary}`}>
                <div className="text-center animate-fade-in px-4">
                    <div className={`mb-6 inline-block p-4 ${theme.colors.bg.tertiary} rounded-full backdrop-blur-sm`}>
                        <svg className="w-16 h-16 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className={`text-2xl font-semibold mb-3 ${theme.colors.text.primary}`}>Welcome to IntelliChat</h3>
                    <p className="text-lg mb-2">Start a new conversation or</p>
                    <p className="text-lg">select an existing one from the sidebar</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto ${theme.colors.gradient.primary} custom-scrollbar`}
        >
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {messages.length === 0 && !streamingMessage ? (
                    <div className="text-center py-12 animate-fade-in">
                        <div className={`inline-block p-4 ${theme.colors.bg.tertiary} rounded-full backdrop-blur-sm mb-4`}>
                            <svg className={`w-12 h-12 ${theme.colors.text.tertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <p className={`${theme.colors.text.secondary} text-lg`}>No messages yet</p>
                        <p className={`${theme.colors.text.tertiary} text-sm mt-2`}>Start the conversation by sending a message below</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <div 
                                key={message._id} 
                                className="message-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <Message message={message} isHistorical={true} />
                            </div>
                        ))}
                        {streamingMessage && (
                            <div className="message-fade-in">
                                <Message message={streamingMessage} isHistorical={false} />
                            </div>
                        )}
                        
                        {/* Typing indicator when AI is thinking */}
                        {isStreaming && !streamingMessage?.content && (
                            <div className="flex justify-start animate-fade-in">
                                <div className={`${theme.colors.bg.tertiary} rounded-2xl px-5 py-3 shadow-lg`}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className={`w-2 h-2 ${theme.colors.text.tertiary} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                                            <span className={`w-2 h-2 ${theme.colors.text.tertiary} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                                            <span className={`w-2 h-2 ${theme.colors.text.tertiary} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        <span className={`${theme.colors.text.tertiary} text-sm ml-2`}>AI is thinking</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messageEndRef} className="h-4" />
            </div>
        </div>
    );
};

export default MessageList;