import { useSelector } from 'react-redux';
import { selectFeatures } from  '@dalaillama/shared-store/slices/tenantSlice.js';

/**
 * Conditionally render children based on feature flag.
 * Features loaded from /api/v1/public/tenant-config/{slug} at bootstrap.
 *
 * @param {{ feature: string, children: React.ReactNode, fallback?: React.ReactNode }} props
 *
 * @example
 * <FeatureGate feature="bot_management">
 *   <BotList />
 * </FeatureGate>
 *
 * @example
 * <FeatureGate feature="campaigns" fallback={<UpgradeBanner />}>
 *   <CampaignDashboard />
 * </FeatureGate>
 */
export default function FeatureGate({ feature, children, fallback = null }) {
  const features = useSelector(selectFeatures);

  if (!features || !feature) return children;

  const value = features[feature];

  // Boolean feature: true/false
  if (value === true) return children;
  if (value === false || value === undefined || value === null) return fallback;

  // Numeric feature (e.g., max_agents > 0 means feature is available)
  if (typeof value === 'number') return value > 0 ? children : fallback;

  // String feature (truthy)
  if (typeof value === 'string') return value ? children : fallback;

  return children;
}

/**
 * Hook version for conditional logic (not JSX gating).
 * @param {string} feature
 * @returns {boolean}
 */
export function useFeature(feature) {
  const features = useSelector(selectFeatures);
  const value = features?.[feature];
  if (value === true) return true;
  if (typeof value === 'number') return value > 0;
  return !!value;
}
