import { createApi } from '@reduxjs/toolkit/query/react';
import { createSocketClient } from '../helper/socketClient';

export const websocketApi = createApi({
  reducerPath: 'websocketApi',
  baseQuery: () => ({}),
  endpoints: (builder) => ({
    subscribeBusinessDashboard: builder.query({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(
        businessId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const token = getState().auth.token; // Retrieve token from state
        const socket = createSocketClient(token); // Pass token to createSocketClient
        try {
          await cacheDataLoaded;
          
          socket.subscribe(`/topic/business/${businessId}/dashboard`, (data) => {
            updateCachedData((draft) => {
              return data;
            });
          });
          
          await cacheEntryRemoved;
          socket.unsubscribe(`/topic/business/${businessId}/dashboard`);
        } catch (err) {
          console.error('WebSocket error:', err);
        }
      },
    }),

    subscribeCampaignCharges: builder.query({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(
        { businessId, campaignId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const token = getState().auth.token; // Retrieve token from state
        const socket = createSocketClient(token); // Pass token to createSocketClient
        try {
          await cacheDataLoaded;
          
          socket.subscribe(
            `/topic/business/${businessId}/campaign/${campaignId}/charges`,
            (data) => {
              updateCachedData((draft) => {
                return data;
              });
            }
          );
          
          await cacheEntryRemoved;
          socket.unsubscribe(`/topic/business/${businessId}/campaign/${campaignId}/charges`);
        } catch (err) {
          console.error('WebSocket error:', err);
        }
      },
    }),

    subscribeCampaignRunCharges: builder.query({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(
        { businessId, campaignId, campaignRunId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const token = getState().auth.token; // Retrieve token from state
        const socket = createSocketClient(token); // Pass token to createSocketClient
        const topic = `/topic/business/${businessId}/campaign/${campaignId}/run/${campaignRunId}/charges`;
        // ... similar implementation
      },
    }),

    subscribeCallCharges: builder.query({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(
        { businessId, campaignId, campaignRunId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const token = getState().auth.token; // Retrieve token from state
        const socket = createSocketClient(token); // Pass token to createSocketClient
        const topic = `/topic/business/${businessId}/campaign/${campaignId}/run/${campaignRunId}/calls/charges`;
        // ... similar implementation
      },
    }),
    subscribeCampaignRun: builder.query({
      queryFn: () => ({ data: { logs: [] } }), // Initialize with empty logs array
      async onCacheEntryAdded(
        { businessId, campaignId, campaignRunId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const token = getState().auth.token; // Retrieve token from state
        const socket = createSocketClient(token); // Pass token to createSocketClient
        const topic = `/topic/business/${businessId}/campaign/${campaignId}/run`;
        
        try {
          await cacheDataLoaded;
          
          socket.subscribe(topic, (newData) => {
            updateCachedData((draft) => {
              if (!draft) draft = { logs: [] };
              // Add new log at the beginning of the array
              draft.logs.unshift(newData);
              return draft;
            });
          });
          
          await cacheEntryRemoved;
          socket.unsubscribe(topic);
        } catch (err) {
          console.error('WebSocket error:', err);
        }
      },
    }),

    // ... implement other subscriptions
  }),
});

export const {
  useSubscribeBusinessDashboardQuery,
  useSubscribeCampaignChargesQuery,
  useSubscribeCampaignRunChargesQuery,
  useSubscribeCallChargesQuery,
  useSubscribeCampaignRunQuery,
  // ... export other hooks
} = websocketApi;
