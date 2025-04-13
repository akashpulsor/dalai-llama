import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { URLS } from './urls'; // Adjust the import path as necessary

let stompClient = null;
let connectPromise = null;

export const createSocketClient = (authToken) => {
  const connect = () => {
    if (!connectPromise) {
      connectPromise = new Promise((resolve, reject) => {
  
        console.log('Connecting to WebSocket:');
        const socket = new SockJS('http://localhost:8080/ws/dashboard');
        console.log('Socket created:', socket);
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug logging

        const headers = {};
        if (authToken) {
          headers['Authorization'] = authToken.startsWith('Bearer ') 
            ? authToken 
            : `Bearer ${authToken}`;
        }
        console.log('Headers:', headers);
        const onConnect = () => {
          console.log('WebSocket Connected with auth');
          resolve(stompClient);
        };

        const onError = (error) => {
          console.error('WebSocket Connection Error:', error);
          connectPromise = null;
          stompClient = null;
          reject(error);
        };

        stompClient.connect(headers, onConnect, onError);
      });
    }
    return connectPromise;
  };

  return {
    subscribe: async (topic, callback) => {
      try {
        await connect();
        return stompClient.subscribe(topic, (message) => {
          console.log('Received message:', message);
          if (message.body === '') {
            console.log('Empty message body');
            return;
          }
          if (message.body === 'null') {
            console.log('Received null message body');
            return;
          }
          const data = JSON.parse(message.body);
          callback(data);
        });
      } catch (error) {
        console.error('Subscription error:', error);
        throw error;
      }
    },
    unsubscribe: (topic) => {
      if (stompClient) {
        stompClient.unsubscribe(topic);
      }
    },
    disconnect: () => {
      if (stompClient) {
        stompClient.disconnect();
        stompClient = null;
        connectPromise = null;
      }
    },
  };
};
