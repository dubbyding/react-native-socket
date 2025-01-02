import {useCallback, useEffect, useState} from 'react';
import {useSocket} from './SocketContext';

interface EventQueueItem {
  eventName: string;
  eventData: any;
  retryCount: number;
}

export const useSocketInstance = () => {
  const {socket, isConnected, messages: message, setMessage} = useSocket();
  const [eventQueue, setEventQueue] = useState<EventQueueItem[]>([]);

  const MAX_RETRIES = 3;
  const ACK_TIMEOUT = 5000; // Timeout in ms

  const addToQueue = (eventName: string, eventData: any, retryCount = 0) => {
    setEventQueue(prev => [...prev, {eventName, eventData, retryCount}]);
  };

  const emitWithAck = useCallback(
    async (
      eventName: string,
      eventData: any,
      retryCount = 0,
    ): Promise<void> => {
      if (!socket || !isConnected) {
        console.warn(`Socket disconnected. Queuing event: ${eventName}`);
        addToQueue(eventName, eventData, retryCount);
        return;
      }

      try {
        const response = await socket
          .timeout(ACK_TIMEOUT)
          .emitWithAck(eventName, eventData);
        if (response.status === 'ok') {
          console.log(`Event ${eventName} delivered successfully.`);
        } else {
          console.error(`Server error for event ${eventName}:`, response.error);
          throw new Error(response.error);
        }
      } catch (error) {
        console.warn(`Ack failed for event ${eventName}:`, error);
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Retrying event ${eventName} (${retryCount + 1}/${MAX_RETRIES})`,
          );
          addToQueue(eventName, eventData, retryCount + 1);
        } else {
          console.error(
            `Event ${eventName} failed after ${MAX_RETRIES} retries.`,
          );
          // Notify the caller about the failure
          throw new Error(
            `Event ${eventName} failed after ${MAX_RETRIES} retries.`,
          );
        }
      }
    },
    [isConnected, socket],
  );

  const processQueue = useCallback(() => {
    if (socket && isConnected) {
      eventQueue.forEach(({eventName, eventData, retryCount}) => {
        emitWithAck(eventName, eventData, retryCount);
      });
      setEventQueue([]); // Clear the queue after processing
    }
  }, [emitWithAck, eventQueue, isConnected, socket]);

  useEffect(() => {
    if (isConnected) {
      processQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return {emitWithAck, isConnected, message, setMessage};
};
