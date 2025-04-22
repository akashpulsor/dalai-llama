import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { showMessage } from './flashMessageSlice';

export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_BASE_URL ||'https://dalai-llama-backend-drd2b6e7a6gsa5e4.canadacentral-01.azurewebsites.net/api',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      // Do NOT set Authorization header
      return headers;
    },
  }),
  endpoints: (builder) => ({
    interest: builder.mutation({
      query: (data) => ({
        url: '/auth/interest',
        method: 'POST',
        body: data,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { response } = await queryFulfilled;
        } catch (error) {
          console.log(error);
          dispatch(showMessage({
            message: error.error?.data?.message || 'Operation failed',
            type: 'error'
          }));
        }
      },
      onSuccess: (response, { dispatch }) => {
        dispatch(showMessage({
          message: 'We have recieved your interest, Team will get back to you',
          type: 'info'
        }));
      },
    }),
  }),
});

export const { useInterestMutation } = publicApi;
