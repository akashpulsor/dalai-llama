import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { useDispatch } from 'react-redux';
import { setUser, setToken, clearAuth,setTools,  } from './authSlice'; // Import your action creators from authSlice

export const authApi = createApi({
  reducerPath: 'authApi',
  //https://api.dalai-llama.com
  baseQuery: fetchBaseQuery({ baseUrl: 'https://77773396-a77c-4c42-9ffa-fabc627ea6e1.mock.pstmn.io' }),
  prepareHeaders: async (headers, { getState }) => {
    // Get the token from state
    const token = getState().auth.token;
    if (token) {
      // If token exists, set it in the headers
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
  endpoints: builder => ({
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: '/login',
        method: 'POST',
        body: { "email": email, "password": password },
      }),
      prepareHeaders: (headers, { getState }) => {
        // Don't include token for login request
        return headers;
      },
      onSuccess: (response, { dispatch }) => {
        console.log(response);
        dispatch(setUser(response.data.user)); // Set user data in state
        dispatch(setToken(response.data.token)); // Set token in state
      },
    }),
    register: builder.mutation({
      query: ({ name, email, password }) => ({
        url: '/register',
        method: 'POST',
        body: { name, email, password },
      }),
      onSuccess: (response, { dispatch }) => {
        dispatch(setUser(response.data.user)); // Set user data in state
        dispatch(setToken(response.data.token)); // Set token in state
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      onQueryStarted: (mutation, { dispatch }) => {
        dispatch(clearAuth()); // Clear user data and token from state
      },
    }),
    getHistory: builder.query({
      query: (userId) => `/getHistory/${userId}`,
    }),
    getUser: builder.query({
      query: (userId) => `/getUser/${userId}`,
    }),
    updateUser: builder.mutation({
      query: (userData) => ({
        url: '/updateUser',
        method: 'POST',
        body: userData,
      }),
      onSuccess: (response, { dispatch }) => {
        dispatch(setUser(response.data.user)); // Set user data in state
         // Set token in state
      }
    }),
    getTools: builder.query({
      query: () => '/getTools',
      onSuccess: (response, { dispatch }) => {
        dispatch(setTools(response.data.tools)); // Set user data in state // Set token in state
      },
    }),
    getLlm: builder.query({
      query: () => '/getLlm',
      onSuccess: (response, { dispatch }) => {
        dispatch(setLlm(response.data.llm)); // Set user data in state // Set token in state
      },
    }),
    generateStructure: builder.mutation({
      query: (topicName) => ({
        url: '/generateStructure',
        method: 'POST',
        body: {"topic":topicName},
      }),
    }),
    generateArticle: builder.query({
      query: ({ jsonData, llmId, toolId }) => ({
        url: '/generateArticle',
        method: 'POST',
        body: { jsonData, llmId, toolId },
      }),
    }),
    saveArticle: builder.mutation({
      query: (articleData) => ({
        url: '/saveArticle',
        method: 'POST',
        body: articleData,
      }),
    }),
    generateTags: builder.mutation({
      query: (articleData) => ({
        url: '/generateTags',
        method: 'POST',
        body: articleData,
      }),
    }),
    publish: builder.mutation({
      query: (article) => ({
        url: '/publish',
        method: 'POST',
        body: article,
      }),
    }),
    loginWordpress: builder.mutation({
      query: (parameters) => ({
        url: '/loginwordpress',
        method: 'POST',
        body: parameters,
      }),
    }),
    getPrice: builder.mutation({
      query: (llmId,toolId) => (
        {
          url: '/getPrice',
          method: 'POST',
          body: {llmId, toolId},
        }
      ),
    }),
    addCredit: builder.mutation({
      query: (userId,money,currencyId) => (
        {
          url: '/payment',
          method: 'POST',
          body: {userId, money,currencyId},
        }
      ),
    })
  }),
});

export const { useLoginMutation, useRegisterMutation, 
  useLogoutMutation, useGetHistoryQuery, 
  useGetUserQuery, useUpdateUserMutation, useGetToolsQuery, useGetLlmQuery, useGenerateStructureQuery, 
  useGenerateArticleMutation, useSaveArticleMutation, useGenerateTagsMutation, usePublishMutation, 
  useLoginWordpressMutation, useGetPriceMutation,useAddCreditMutation } = authApi;
