import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { useDispatch } from 'react-redux';
import { setUser, setToken, clearAuth,setTools,  } from './authSlice'; // Import your action creators from authSlice

export const authApi = createApi({
  reducerPath: 'authApi',
  //https://api.dalai-llama.com
  baseQuery: fetchBaseQuery(
      { baseUrl: 'http://localhost:3000' }),
  tagTypes: ['Login'],
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
      invalidatesTags: ['Login'],
    }),
    register: builder.mutation({
      query: ({ name, email, password }) => ({
        url: '/register',
        method: 'POST',
        body: { name, email, password },
      }),
      onSuccess: (response, { dispatch }) => {
        //dispatch(setUser(response.data.user)); // Set user data in state
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
      query: ({topicName, llmId, userId}) => ({
        url: '/generateStructure',
        method: 'POST',
        body: {"topic":topicName,"llmId":llmId, "userId": userId},
      }),
    }),
    generateArticle: builder.mutation({
      query: ({ userId,enableTitleGenerationCheck,title,body,llmId}) => ({
        url: '/generateArticle',
        method: 'POST',
        body: { "userId":userId,"titleGenerationCheck":enableTitleGenerationCheck,"title":title,"body": body,"llmId":llmId },
      }),
    }),
    saveArticle: builder.mutation({
      query: ({userId,articleTitle, articleBody}) => ({
        url: '/saveArticle',
        method: 'POST',
        body: {userId,articleTitle, articleBody},
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
      query: ({username,password,userId,articleTitle, articleBody,selectedTags}) => ({
        url: '/publish',
        method: 'POST',
        body: {username,password,userId,articleTitle, articleBody,selectedTags},
      }),
    }),
    loginWordpress: builder.mutation({
      query: ({ email, password, saveCredentials}) => ({
        url: '/loginwordpress',
        method: 'POST',
        body: { "email": email, "password": password, "saveCredentials":saveCredentials },
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
  useGetUserQuery, useUpdateUserMutation, useGetToolsQuery, useGetLlmQuery, useGenerateStructureMutation,
  useGenerateArticleMutation, useSaveArticleMutation, useGenerateTagsMutation, usePublishMutation, 
  useLoginWordpressMutation, useGetPriceMutation,useAddCreditMutation } = authApi;
