// @ts-nocheck
import { useSelector } from "react-redux";
import { selectTenantId } from "@dalaillama/shared-store";
import { useGetCreatorVideoEntitlementsByTenantQuery } from "../api/creatorEndpoints.js";

/** A tenant with no subscription at all resolves to this on the backend too (see
 * CreatorVideoEntitlementsResponse's javadoc) -- used here only while the query is loading, so a
 * feature doesn't flash "unlocked" for a moment before the real (possibly free-tier) answer
 * arrives. */
const FREE_DEFAULTS = {
  videoCreationEnabled: true,
  videoDownloadEnabled: true,
  editsEnabled: false,
  imageUploadEnabled: false,
  upscalingEnabled: false,
  upscalePreviewEnabled: false,
  characterVoiceUploadEnabled: false,
  briefUrlShareEnabled: false,
};

/** Single source of truth for "is this creator on a paid plan" across the app -- every gated
 * feature point reads from here rather than re-deriving its own notion of subscribed/unsubscribed. */
export default function useCreatorVideoEntitlements() {
  const tenantId = useSelector(selectTenantId);
  const { data, isLoading, isFetching } = useGetCreatorVideoEntitlementsByTenantQuery(tenantId, { skip: !tenantId });

  return {
    subscriptionId: data?.subscriptionId || null,
    planCode: data?.planCode || "CREATOR_VIDEO_FREE",
    planName: data?.planName || "Free",
    status: data?.status || "UNSUBSCRIBED",
    currentPeriodEnd: data?.currentPeriodEnd || null,
    entitlements: data?.entitlements || FREE_DEFAULTS,
    isSubscribed: data?.status === "ACTIVE",
    isLoading,
    isFetching,
  };
}
