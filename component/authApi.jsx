import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setUser, setToken, clearAuth,setTools, setBusinessData, setOnboardingData, setTwilioData } from './authSlice'; // Import your action creators from authSlice

import { showMessage } from './flashMessageSlice';

const handleError = (error, dispatch) => {
  dispatch(showMessage({
    message: error.error?.data?.message || 'Operation failed',
    type: 'error'
  }));
};

export const authApi = createApi({
  reducerPath: 'authApi',
  //https://api.dalai-llama.com
  baseQuery: fetchBaseQuery(
      { baseUrl: 'http://localhost:8080/api',
        prepareHeaders: (headers, { getState }) => {
          // Get the token from state
          const token = getState().auth.token;
          if (token) {
            // If token exists, set it in the headers
            headers.set('Authorization', `Bearer ${token}`);
          }else {
            console.log("No token found in state"); // Debug log 5
          }
          headers.set('Content-Type', 'application/json');
          return headers;
        }
       }),
  
  tagTypes: ['Login'],
  endpoints: builder => ({
    login: builder.mutation({
      query: (data) => ({
        url: '/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure this is set correctly
        },
        body: data,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser({
            user: data.userInfoResponse,
          }));
          dispatch(setToken({
            token: data.accessToken
          }));
        } catch (error) {
          console.error('Login failed', error);
        }
      },
      invalidatesTags: ['Login'],
    }),
    refreshToken: builder.query({
      query: () => '/auth/refreshToken',
      method: 'POST', // Adjust this according to your API
    }),
    register: builder.mutation({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure this is set correctly
        },
        body: data}),
      onSuccess: (response, { dispatch }) => {
        dispatch(setToken(response.loginResponseDto.accessToken)); // Set token in state
      },
    }),
    verificationCode: builder.mutation({
      query: (data) => ({
        url: '/auth/verification-code',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json', // Ensure this is set correctly
        }  
      })
    }),
    validateCode: builder.mutation({
      query: ({email, verificationCode}) => ({
        url: '/auth/verify-code',
        method: 'POST',
        body: {  "email": email,"verificationCode":verificationCode}
          
      })
    }),
    updatePassword: builder.mutation({
      query: ({email}) => ({
        url: '/auth/update-password',
        method: 'POST',
        body: {  "email": email,"oldPassword": oldPassword, "newPassword": newPassword}
      })
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      onQueryStarted: (mutation, { dispatch }) => {
        dispatch(clearAuth()); // Clear user data and token from state
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
    addAgent: builder.mutation({
      query: (data) => ({
        url: '/agent/add',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
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
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
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
        try{
            const { data } = await queryFulfilled;
        } catch(error) {
          handleError(error, dispatch)
        }
       
       },
    }),
    getCampaignList: builder.query({
      query: (businessId) => `/campaign/list?businessId=${businessId}`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try{
            const { data } = await queryFulfilled;
        } catch(error) {
          handleError(error, dispatch)
        }
       
       },
    })
  }),
});


export const { useLoginMutation, useRegisterMutation, useVerificationCodeMutation,useValidateCodeMutation,useUpdatePasswordMutation,
  useLogoutMutation, useAddCampaignMutation, useGetCompanySizeQuery,
  useGetAgentListQuery, useGetCampaignListQuery, useGetToolsQuery, useGetLlmQuery, useGenerateStructureMutation,
  useGenerateArticleMutation, useSaveArticleMutation, useGenerateTagsMutation, usePublishMutation, 
  useLoginWordpressMutation, useAddLeadMutation,useAddAgentMutation, useRefreshTokenQuery,
 useOnBoardMutation, useGetOnBoardingDataQuery, useGetBusinessDataQuery,useGenerateNumberMutation} = authApi;

