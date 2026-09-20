// @ts-nocheck
/**
 * Bridges the redux auth slice to PostHog identity in creator-ui only.
 *
 * Deliberately not in shared-hooks: dashboard/agents/etc. do not enable
 * PostHog and should not carry a PostHog import as a transitive dep. Keeping
 * this here means PostHog stays a leaf integration owned by creator-ui.
 *
 * Behaviour:
 *  - user appears / changes distinct_id -> identify with tenant grouping
 *  - user goes away (logout, expired token) -> reset, so the next anonymous
 *    session does not get attributed to the previous person
 *  - no PostHog key configured -> both calls are cheap no-ops (see posthog.js)
 */
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { identifyPostHog, resetPostHog } from "../posthog.js";

export default function usePostHogIdentity() {
  const user = useSelector((state) => state?.auth?.user || null);

  useEffect(() => {
    if (user) {
      identifyPostHog(user);
    } else {
      resetPostHog();
    }
  }, [user?.id, user?.tenantId]);
}
