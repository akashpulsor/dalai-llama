// @ts-check
import { api as apiSlice } from "@dalaillama/shared-store";

export const creativeWorkApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCreativeWorkerMe: builder.query({
      query: () => "/creator/human-work-orders/workers/me",
      providesTags: ["CreatorHumanWorkOrders"],
    }),
    setCreativeWorkerPresence: builder.mutation({
      query: (body = {}) => ({
        url: "/creator/human-work-orders/workers/me/presence",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreatorHumanWorkOrders"],
    }),
    getCreativeWorkers: builder.query({
      query: (params = {}) => ({
        url: "/creator/human-work-orders/workers",
        params,
      }),
      providesTags: ["CreatorHumanWorkOrders"],
    }),
    getCreativeWorkQueue: builder.query({
      query: (params = {}) => ({
        url: "/creator/human-work-orders/queue",
        params,
      }),
      providesTags: ["CreatorHumanWorkOrders"],
    }),
    getCreativeWorkOrder: builder.query({
      query: (workOrderId) => `/creator/human-work-orders/queue/${workOrderId}`,
      providesTags: (_result, _error, workOrderId) => [{ type: "CreatorHumanWorkOrders", id: workOrderId }],
    }),
    updateCreativeWorkOrder: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/creator/human-work-orders/queue/${workOrderId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "CreatorHumanWorkOrders", id: body?.workOrderId || "LIST" },
        "CreatorHumanWorkOrders",
      ],
    }),
    addCreativeWorkOrderMessage: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/creator/human-work-orders/queue/${workOrderId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "CreatorHumanWorkOrders", id: body?.workOrderId || "LIST" },
        "CreatorHumanWorkOrders",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCreativeWorkerMeQuery,
  useSetCreativeWorkerPresenceMutation,
  useGetCreativeWorkersQuery,
  useGetCreativeWorkQueueQuery,
  useGetCreativeWorkOrderQuery,
  useUpdateCreativeWorkOrderMutation,
  useAddCreativeWorkOrderMessageMutation,
} = creativeWorkApi;
