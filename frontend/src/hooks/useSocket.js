import { useEffect, useRef, useState } from 'react';
import socketService from '../services/socketService';

export const useSocket = (token) => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) return;

        // Connect socket
        socketRef.current = socketService.connect(token);
        setIsConnected(socketService.isConnected());

        // Monitor connection status
        const checkConnection = setInterval(() => {
            setIsConnected(socketService.isConnected());
        }, 1000);

        return () => {
            clearInterval(checkConnection);
            socketService.disconnect();
        };
    }, [token]);

    return { socket: socketRef.current, isConnected };
};