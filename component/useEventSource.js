import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from './authSlice';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * @typedef {Object} EventSourceHook
 * @property {Array} callLogs - Array of call log events
 * @property {Array} charges - Array of charge events
 * @property {Array} campaignRuns - Array of campaign run events
 * @property {string} status - Connection status
 */

/**
 * @param {string} userId
 * @returns {EventSourceHook}
 */
function useEventSource(userId) {
  const [callLogs, setCallLogs] = useState([]);
  const [charges, setCharges] = useState([]);
  const [campaignRuns, setCampaignRuns] = useState([]);
  const [status, setStatus] = useState('idle');
  const user = useSelector(selectUser);
  const REFRESH_INTERVAL = 60000; // 1 minute in milliseconds

  useEffect(() => {
    let abortController = new AbortController();
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let refreshTimer = null;

    const connectToSSE = async () => {
      if (!userId) {
        console.log('Missing userId:', userId);
        return;
      }

      // Abort previous connection if exists
      abortController.abort();
      abortController = new AbortController();

      try {
        setStatus('connecting');

        // Get token first
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('No token found in AsyncStorage');
          setStatus('error');
          return;
        }

        console.log('Attempting connection with token:', token.substring(0, 20) + '...');

        await fetchEventSource(
          `http://localhost:8080/api/events/user/${userId}/subscribe`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token.trim()}`,
              'Accept': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            },
            signal: abortController.signal,
            onopen: async (response) => {
              if (response.ok) {
                console.log('Connection opened successfully');
                setStatus('connected');
                retryCount = 0;

                // Set up refresh timer
                refreshTimer = setTimeout(() => {
                  console.log('Refreshing connection...');
                  connectToSSE();
                }, REFRESH_INTERVAL);
              } else {
                console.error(`Connection failed with status: ${response.status}`);
                if (response.status === 401 && retryCount < MAX_RETRIES) {
                  retryCount++;
                  throw new Error('Authentication failed, retrying...');
                }
                throw new Error(`Failed to connect: ${response.status}`);
              }
            },
            onmessage: (event) => {
              console.log('Received event:', event);
              const data = JSON.parse(event.data);
              switch (event.event) {
                case 'callLog':
                  setCallLogs(prev => [...prev, data]);
                  break;
                case 'charge':
                  setCharges(prev => [...prev, data]);
                  break;
                case 'campaignRun':
                  setCampaignRuns(prev => [...prev, data]);
                  break;
              }
            },
            onerror: (err) => {
              console.error('EventSource error:', err);
              setStatus('error');
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${MAX_RETRIES})...`);
                throw err; // This will trigger a retry
              }
              console.error('Max retries reached');
            }
          }
        );
      } catch (error) {
        console.error('Connection failed:', error);
        setStatus('error');
        if (retryCount < MAX_RETRIES) {
          setTimeout(connectToSSE, 2000); // Retry after 2 seconds
        }
      }
    };

    connectToSSE();

    return () => {
      // Clean up timers and connection
      if (refreshTimer) clearTimeout(refreshTimer);
      abortController.abort();
      setStatus('closed');
    };
  }, [userId]);

  return { callLogs, charges, campaignRuns, status };
}

export default useEventSource;
