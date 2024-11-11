import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setUser, setToken, clearAuth,setTools,  } from './authSlice'; // Import your action creators from authSlice


export const authApi = createApi({
  reducerPath: 'authApi',
  //https://api.dalai-llama.com
  baseQuery: fetchBaseQuery(
      { baseUrl: 'http://localhost:8080/api' }),
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
        url: '/auth/login',
        method: 'POST',
        body: { "email": email, "password": password },
      }),
      prepareHeaders: (headers, { getState }) => {
        // Don't include token for login request
        return headers;
      },
      invalidatesTags: ['Login'],
    }),


    refreshToken: builder.query({
      query: () => '/auth/refreshToken',
      method: 'POST', // Adjust this according to your API
    }),
    register: builder.mutation({
      query: ({email,
        name,
        phone,
        password,countryCallingCode, countryCode, companySize }) => ({
        url: '/auth/register',
        method: 'POST',
        body: { "name":name, "businessName":businessName, "email": email,"password":password,"mobile": phone,
          "countryCallingCode": countryCallingCode, "countryCode": countryCode, "companySize":companySize},
      }),
      onSuccess: (response, { dispatch }) => {
        dispatch(setToken(response.loginResponseDto.accessToken)); // Set token in state
      },
    }),
    verificationCode: builder.mutation({
      query: ({email}) => ({
        url: '/auth/verification-code',
        method: 'POST',
        body: {  "email": email}
          
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
    getCompanySize: builder.query({
      query: () => '/auth/company-size',
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
        body: {"userId":userId,"title":articleTitle, "body":articleBody},
      }),
    }),
    generateTags: builder.mutation({
      query: ({userId,enableTitleGenerationCheck,title,body,llmId}) => ({
        url: '/generateTags',
        method: 'POST',
        body: {"userId":userId,"titleGenerationCheck":enableTitleGenerationCheck,"title":title,"body":body,"llmId":llmId},
      }),
    }),
    publish: builder.mutation({
      query: ({username,password,userId,articleTitle, articleBody,selectedTags}) => ({
        url: '/publish',
        method: 'POST',
        body: {"username":username,"password":password,"userId":userId,"title":articleTitle, "body":articleBody,"tags":selectedTags},
      }),
    }),
    loginWordpress: builder.mutation({
      query: ({userId,username, password, saveCredentials}) => ({
        url: '/loginwordpress',
        method: 'POST',
        body: { "userId":userId,"userName": username, "password": password, "saveCredentials":saveCredentials },
      }),
    }),
    getPrice: builder.mutation({
      query: (llmId,toolId) => (
        {
          url: '/getPrice',
          method: 'POST',
          body: {"llmId":llmId, "toolId":toolId},
        }
      ),
    }),
    addCredit: builder.mutation({
      query: (userId,money,currencyId) => (
        {
          url: '/payment',
          method: 'POST',
          body: {"userId":userId, "money":money,"currencyId":currencyId},
        }
      ),
    }),
    search: builder.mutation({
      query: ({searchQuery, llmId, userId}) => ({
        url: '/search',
        method: 'POST',
        body: {"query":searchQuery,"llmId":llmId, "userId": userId},
      }),
    })
  }),
});

export const { useLoginMutation, useRegisterMutation, useVerificationCodeMutation,useUpdatePasswordMutation,
  useLogoutMutation, useGetHistoryQuery, useGetCompanySizeQuery,
  useGetUserQuery, useUpdateUserMutation, useGetToolsQuery, useGetLlmQuery, useGenerateStructureMutation,
  useGenerateArticleMutation, useSaveArticleMutation, useGenerateTagsMutation, usePublishMutation, 
  useLoginWordpressMutation, useGetPriceMutation,useAddCreditMutation, useRefreshTokenQuery, useSearchMutation } = authApi;

