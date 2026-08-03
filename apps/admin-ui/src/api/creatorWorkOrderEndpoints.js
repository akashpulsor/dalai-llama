import { api as apiSlice } from "@dalaillama/shared-store";

export const creatorWorkOrderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCreativeWorkOrders: builder.query({
      query: (params = {}) => ({
        url: "/internal/creator/human-work-orders",
        params,
      }),
      providesTags: ["CreatorHumanWorkOrders"],
    }),
    updateCreativeWorkOrder: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/internal/creator/human-work-orders/${workOrderId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CreatorHumanWorkOrders"],
    }),
    addCreativeWorkOrderMessage: builder.mutation({
      query: ({ workOrderId, ...body }) => ({
        url: `/internal/creator/human-work-orders/${workOrderId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreatorHumanWorkOrders"],
    }),
  }),
});

export const {
  useGetCreativeWorkOrdersQuery,
  useUpdateCreativeWorkOrderMutation,
  useAddCreativeWorkOrderMessageMutation,
} = creatorWorkOrderApi;
