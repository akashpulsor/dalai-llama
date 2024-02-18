import React, { useState } from 'react';
import { View, Text, TextInput, Modal, Button, Image, StyleSheet } from 'react-native';

const WordPressLoginPopup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogin = () => {
    // Perform actions with username and password, such as logging in to WordPress
    console.log('Username:', username);
    console.log('Password:', password);
    // Close the modal
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button title="Login" onPress={() => setModalVisible(true)} />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Image source={require('../assets/wordpress-logo.png')} style={styles.logo} />
            <Text style={styles.modalText}>Enter your WordPress credentials:</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />
            <Button title="Login" onPress={handleLogin} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WordPressLoginPopup;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    marginBottom: 10,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
});
