import React, {createContext, useContext, useEffect, useRef} from 'react';

import {AppState} from 'react-native';
import {io, Socket} from 'socket.io-client';

// Define the context type
interface Message {
  id: string;
  text: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: Message[];
  setMessage: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [message, setMessage] = React.useState<Message[]>([]);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000', {
      reconnection: true, // Enable automatic reconnection
      reconnectionAttempts: Infinity, // Number of reconnection attempts
      reconnectionDelay: 1000, // Initial delay between reconnection attempts (ms)
      reconnectionDelayMax: 10000, // Maximum delay between reconnection attempts (ms)
      timeout: 10000, // Connection timeout (ms)
      autoConnect: true, // Automatically connect to the server when the component mounts
      forceNew: false, // Do not force a new connection on each connection attempt
    });

    const socket = socketRef.current;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        socket?.connect();
      } else if (nextAppState === 'background') {
        socket?.disconnect();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', reason => {
      console.warn('Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', error => {
      console.error('Connection error:', error.message);
    });

    socket.on('message', data => {
      if (data && data.id && data.text) {
        setMessage(prevValue => [...prevValue, data]);
      } else {
        console.error('Invalid message data:', data);
      }
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        messages: message,
        setMessage,
      }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
