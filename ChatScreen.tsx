import React, {useState} from 'react';
import {View, TextInput, Button, StyleSheet, Alert, Text} from 'react-native';
import {useSocketInstance} from './useSocketInstance';

const ChatScreen = () => {
  const {emitWithAck, isConnected, message} = useSocketInstance();
  const [currentMessage, setCurrentMessage] = useState('');

  const sendMessage = () => {
    if (currentMessage.trim()) {
      emitWithAck('sendMessage', {currentMessage}).catch(error => {
        console.error('Error sending message:', error);
        // Handle the error, e.g., display an error message to the user
        Alert.alert('Error sending message: ' + error.message);
      });
      setCurrentMessage('');
    }
  };

  return (
    <View style={styles.container}>
      {message.map(value => (
        <Text key={value.id}>{value.text}</Text>
      ))}
      <TextInput
        value={currentMessage}
        onChangeText={setCurrentMessage}
        placeholder="Type a message"
        style={styles.input}
      />
      <Button
        title="Send Message"
        onPress={sendMessage}
        disabled={!isConnected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 20},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
  },
});

export default ChatScreen;
