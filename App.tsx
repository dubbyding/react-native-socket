/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {SocketProvider} from './SocketContext';
import ChatScreen from './ChatScreen';

function App(): React.JSX.Element {
  return (
    <SocketProvider>
      <ChatScreen />
    </SocketProvider>
  );
}

export default App;
