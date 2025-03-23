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
  //https://dalai-llama-backend-drd2b6e7a6gsa5e4.canadacentral-01.azurewebsites.net/api
  //https://dalai-llama-backend-drd2b6e7a6gsa5e4.canadacentral-01.azurewebsites.net/api
  baseQuery: fetchBaseQuery(
      { //baseUrl: 'http://localhost:8080/api',
        baseUrl: process.env.REACT_APP_API_BASE_URL ||'http://localhost:8080/api',
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
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          try{
            const { data } = await queryFulfilled;
          }
          catch(error) {
            handleError(error, dispatch)
          }
        },
      onSuccess: (response, { dispatch }) => {
        dispatch(setToken(response.loginResponseDto.accessToken)); // Set token in state
      },
    }),
    interest: builder.mutation({
      query: (data) => ({
        url: '/auth/interest',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Ensure this is set correctly
        },
        body: data}),
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          try{
            const { response } = await queryFulfilled;
          }
          catch(error) {
            console.log(error);
            handleError(error, dispatch)
          }
        },
      onSuccess: (response, { dispatch }) => {
        dispatch(showMessage({
          message: 'We have recieved your interest, Team will get back to you',
          type: 'info'
        })); // Set token in state
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
    ///business/get?businessId=${businessId}
    getLeadData: builder.query({
      query: (params) => `/lead/${params.businessId}/leads/paginated?page=${params.page}&test=${params.test}&size=${params.size}&sortBy=${params.sortBy}`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
          handleError(error, dispatch)
        }
    
       },
    }),
    getLlmDataList: builder.query({
      query: (params) => `/meta/llm/${params.businessId}/get`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
          handleError(error, dispatch)
        }
    
       },
    }),
    getPhoneDataList: builder.query({
      query: (params) => `/meta/phone/${params.businessId}/get`,
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
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
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
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
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
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
    }),
    validateUrl: builder.mutation({
      query: (data) => ({
        url: '/browser-agent/validate',
        method: 'POST',
        body: data
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try{
          const { data } = await queryFulfilled;
        }
        catch(error) {
          console.log(error)
          handleError(error, dispatch)
        }
      },
    }),
    getPortals: builder.query({
      query: (params) =>{
        return `/user-portals/user/${params.businessId}`;
      },
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
            const { data } = await queryFulfilled;
            
       },
    }),
    addPortal: builder.mutation({
      query: (data) => ({
        url: '/meta/llm/add',
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
    generateContext: builder.mutation({
      query: (data) => ({
        url: '/meta/llm/add',
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
    })
  }),
});


export const { useLoginMutation, useRegisterMutation, useVerificationCodeMutation,useValidateCodeMutation,useUpdatePasswordMutation,
  useLogoutMutation, useAddCampaignMutation, useGetCompanySizeQuery,
  useGetAgentListQuery, useGetCampaignListQuery, useGetLeadDataQuery, useGetLlmDataListQuery, useGetPhoneDataListQuery, useStartCampaignMutation, useAddPhoneDataMutation,
  useAddLLMDataMutation, useRunCampaignMutation, useGenerateTagsMutation, usePublishMutation, 
  useLoginWordpressMutation, useAddLeadMutation,useAddAgentMutation, useRefreshTokenQuery,
 useOnBoardMutation, useGetOnBoardingDataQuery, useGetBusinessDataQuery,useGenerateNumberMutation, useInterestMutation,  useGetPortalsQuery,useAddPortalMutation, useValidateUrlMutation} = authApi;

