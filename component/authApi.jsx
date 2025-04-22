import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setUser, setToken, clearAuth, setTools, setBusinessData, setOnboardingData, setTwilioData } from './authSlice';
import { showMessage } from './flashMessageSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";


// Debug utility with simplified decode
const debugToken = async () => {
  const token = await AsyncStorage.getItem('token');
  console.log('Current token:', token);
  if (token) {
    try {
      const decoded = jwtDecode(token); // Use jwtDecode instead of jwt_decode
      console.log('Decoded token:', decoded);
      console.log('Token expiry:', new Date(decoded.exp * 1000));
      console.log('Is expired:', decoded.exp * 1000 < Date.now());
    } catch (e) {
      console.error('Token decode error:', e);
    }
  }
};

// Utility function to refresh the token
const refreshAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch('http://localhost:8080/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem('token', data.accessToken); // Update token in AsyncStorage
      return data.accessToken;
    } else {
      console.log('Token refresh failed.');
      await AsyncStorage.removeItem('token'); // Clear token if refresh fails
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

const handleError = (error, dispatch) => {
  dispatch(showMessage({
    message: error.error?.data?.message || 'Operation failed',
    type: 'error'
  }));
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token); // Use jwtDecode instead of jwt_decode
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/api',
    //baseUrl: process.env.REACT_APP_API_BASE_URL ||'https://dalai-llama-backend-drd2b6e7a6gsa5e4.canadacentral-01.azurewebsites.net/api',
    prepareHeaders: async (headers) => {
      try {
        const token = await AsyncStorage.getItem('token');
        await debugToken(); // Debug token status

        if (token) {
          // Try parsing token to ensure it's valid
          try {
            JSON.parse(JSON.stringify(token));
            headers.set('Authorization', `Bearer ${token}`);
            console.log('Set Authorization header:', `Bearer ${token}`);
          } catch (e) {
            console.error('Invalid token format:', e);
          }
        }
        
        headers.set('Content-Type', 'application/json');
        return headers;
      } catch (error) {
        console.error('Error in prepareHeaders:', error);
        return headers;
      }
    },
  }),
  tagTypes: ['Login'],
  endpoints: builder => ({
    login: builder.mutation({
      query: (data) => ({
        url: '/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log('Login response data:', data); // Debug login response

          // First set the user data
          if (data.userInfoResponse) {
            console.log('Setting user:', data.userInfoResponse);
            dispatch(setUser({
              user: data.userInfoResponse
            }));
          } else {
            console.warn('No user info in response');
          }

          // Then handle token
          if (data.accessToken) {
            console.log('Setting token:', data.accessToken);
            await AsyncStorage.setItem('token', data.accessToken);
            dispatch(setToken({
              token: data.accessToken
            }));
          } else {
            console.warn('No access token in response');
          }

        } catch (error) {
          console.error('Login mutation error:', error);
          handleError(error, dispatch);
        }
      },
      invalidatesTags: ['Login'],
    }),
    refreshToken: builder.query({
      query: () => '/auth/refreshToken',
      method: 'POST',
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setToken({
            token: data.accessToken
          }));
        } catch (error) {
          console.log("Token refresh failed, token might be expired:", error);
          // Optionally, dispatch an action to handle token expiration, like redirecting to login
          dispatch(clearAuth());
        }
      },
    }),
    register: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }
      },
      onSuccess: async (response, { dispatch }) => {
        dispatch(setToken(response.loginResponseDto.accessToken)); // Set token in state
        await AsyncStorage.setItem('token', response.loginResponseDto.accessToken);
      },
    }),
    interest: builder.mutation({
      // Use a custom baseQuery to avoid Authorization header
      baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:8080/api',
        prepareHeaders: (headers) => {
          headers.set('Content-Type', 'application/json');
          // Do NOT set Authorization header here
          return headers;
        },
      }),
      query: (data) => ({
        url: '/auth/interest',
        method: 'POST',
        body: data,
      }),
      
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { response } = await queryFulfilled;
        }
        catch (error) {
          console.log(error);
          handleError(error, dispatch)
        }
      },
      onSuccess: (response, { dispatch }) => {
        dispatch(showMessage({
          message: 'We have recieved your interest, Team will get back to you',
          type: 'info'
        }));
      },
    }),
    verificationCode: builder.mutation({
      query: (data) => ({
        url: '/auth/verification-code',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }),
    validateCode: builder.mutation({
      query: ({ email, verificationCode }) => ({
        url: '/auth/verify-code',
        method: 'POST',
        body: { "email": email, "verificationCode": verificationCode }

      })
    }),
    updatePassword: builder.mutation({
      query: ({ email }) => ({
        url: '/auth/update-password',
        method: 'POST',
        body: { "email": email, "oldPassword": oldPassword, "newPassword": newPassword }
      })
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      onQueryStarted: async (mutation, { dispatch }) => {
        dispatch(clearAuth()); // Clear user data and token from state
        await AsyncStorage.removeItem('token'); // Remove token from AsyncStorage on logout
      },
    }),
    onBoard: builder.mutation({
      query: (data) => ({
        url: '/business/onboard',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(setOnboardingData(data));
      },
    }),
    generateNumber: builder.mutation({
      query: (data) => ({
        url: '/business/getnerate-number',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(setTwilioData(data));
      },
    }),
    addCampaign: builder.mutation({
      query: (data) => ({
        url: '/campaign/add',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          dispatch(showMessage({
            message: error.error?.data?.message || 'Operation failed',
            type: 'error'
          }));
        }
      },
    }),
    runCampaign: builder.mutation({
      query: (data) => ({
        url: `/campaign/run?businessId=${data.businessId}&campaignRunId=${data.campaignRunId}`,
        method: 'POST',
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          dispatch(showMessage({
            message: error.error?.data?.message || 'Operation failed',
            type: 'error'
          }));
        }
      },
    }),
    startCampaign: builder.mutation({
      query: (data) => ({
        url: '/campaign/start',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          dispatch(showMessage({
            message: error.error?.data?.message || 'Operation failed',
            type: 'error'
          }));
        }
      },
    }),
    addAgent: builder.mutation({
      query: (data) => ({
        url: '/agent/add',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }
      },
    }),
    addLead: builder.mutation({
      query: (data) => ({
        url: '/lead/add',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }
      },
    }),
    getBusinessData: builder.query({
      query: (businessId) => `/business/get?businessId=${businessId}`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(setBusinessData(data));
      },
    }),
    getLeadData: builder.query({
      query: (params) => `/lead/${params.businessId}/leads/paginated?page=${params.page}&test=${params.test}&size=${params.size}&sortBy=${params.sortBy}`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }

      },
    }),
    getLlmDataList: builder.query({
      query: (params) => `/meta/llm/${params.businessId}/get`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          console.log(error);
          handleError(error, dispatch)
        }

      },
    }),
    getPhoneDataList: builder.query({
      query: (params) => `/meta/phone/${params.businessId}/get`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }

      },
    }),
    addPhoneData: builder.mutation({
      query: (data) => ({
        url: '/meta/phone/add',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }
      },
    }),
    addLLMData: builder.mutation({
      query: (data) => ({
        url: '/meta/llm/add',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }
      },
    }),
    getOnBoardingData: builder.query({
      query: (businessId) => `/business/onboard?businessId=${businessId}`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(setOnboardingData(data));
      },
    }),
    getCompanySize: builder.query({
      query: () => '/auth/company-size',
    }),
    getAgentList: builder.query({
      query: (businessId) => `/agent/list?businessId=${businessId}`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          handleError(error, dispatch)
        }

      },
    }),
    getCampaignList: builder.query({
      query: (businessId) => `/campaign/list?businessId=${businessId}`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          handleError(error, dispatch)
        }

      },
    }),
    getCampaignRunLogs: builder.query({
      query: (data) => {
        const size = data.size || 10; // Default size to 10 if undefined
        return `/campaign/${data.businessId}/${data.campaignId}/runs?page=${data.page}&size=${size}&sort=createdAt,desc`;
      },
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          handleError(error, dispatch);
        }
      },
    }),
    getCallLogs: builder.query({
      query: (data) => {
        const size = data.size || 10; // Default size to 10 if undefined/{campaignRunId}/call-logs
        return `/campaign/${data.campaignRunId}/call-logs?page=${data.page}&size=${size}&sort=startTime,desc`;
      },
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          console.log(error);
          handleError(error, dispatch);
        }
      },
    }),
    getCallLogByCallId: builder.query({
      query: (data) => {
        return `/campaign/${data}/usage-data`;
      },
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          console.log(error);
          handleError(error, dispatch);
        }
      },
    }),
    validateUrl: builder.mutation({
      query: (data) => ({
        url: '/browser-agent/validate',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          console.log(error)
          handleError(error, dispatch)
        }
      },
    }),
    getPortals: builder.query({
      query: (params) => {
        return `/portals/${params.businessId}`;
      },
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        const { data } = await queryFulfilled;

      },
    }),
    addPortal: builder.mutation({
      query: (data) => ({
        url: '/portals/configure',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }
      },
    }),
    generateContext: builder.mutation({
      query: (data) => ({
        url: '/browser-agent/urlContext',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        }
        catch (error) {
          handleError(error, dispatch)
        }
      },
    }),
    initlializeBrowserAutomation: builder.mutation({
      query: (data) => ({
        url: '/browser-agent/init',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          handleError(error, dispatch);
        }
      },
    }),
    getDashboardData: builder.query({
      query: (queryParm) => {
        let url = `/meta/dashboard?${queryParm}`;
        console.log(url);
        return url;
      },
    }),
    registerBot: builder.mutation({
      query: (data) => ({
        url: '/bot/register',
        method: 'POST',
        body: { businessId: data.businessId }, // Include businessId in the request body
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          console.log('Bot registered successfully:', data);
        } catch (error) {
          handleError(error, dispatch);
        }
      },
    }),
    checkEventStatus: builder.query({
      query: (userId) => `/events/status/${userId}`,
    }),
    getRecordingBytes: builder.query({
      query: (callId) => ({
        url: `/campaign/${callId}/recording`, // Replace with your backend endpoint
        method: 'GET',
        responseHandler: (response) => response.blob(), // Handle response as a blob
      }),
    }),
  }),
});


export const { useLoginMutation, useRegisterMutation, useVerificationCodeMutation, useValidateCodeMutation, useUpdatePasswordMutation,
  useLogoutMutation, useAddCampaignMutation, useGetCompanySizeQuery,
  useGetAgentListQuery, useGetCampaignListQuery, useGetLeadDataQuery, useGetLlmDataListQuery, useGetPhoneDataListQuery, useStartCampaignMutation, useAddPhoneDataMutation,
  useAddLLMDataMutation, useRunCampaignMutation, useAddLeadMutation, useAddAgentMutation, useRefreshTokenQuery,
  useOnBoardMutation, useGetOnBoardingDataQuery, useGetBusinessDataQuery, useGenerateNumberMutation, useInterestMutation, useGetPortalsQuery, useAddPortalMutation, useValidateUrlMutation, useGenerateContextMutation, useInitlializeBrowserAutomationMutation, useGetDashboardDataQuery,
  useLazyGetDashboardDataQuery, useRegisterBotMutation, useGetCampaignRunLogsQuery, useGetCallLogsQuery,
  useGetCallLogByCallIdQuery, useLazyGetCallLogByCallIdQuery, useCheckEventStatusQuery,useLazyGetRecordingBytesQuery
} = authApi;

