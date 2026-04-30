import { useState, useMemo, useCallback } from 'react';

/**
 * @typedef {'today'|'yesterday'|'this_week'|'this_month'|'last_30_days'|'custom'} RangePreset
 */

/**
 * Shared date range hook for analytics queries.
 * All analytics components use the same range → switch preset, all charts update.
 *
 * @param {RangePreset} [defaultPreset='this_month']
 * @returns {{ fromTs: string, toTs: string, preset: RangePreset,
 *             setPreset: (p: RangePreset) => void,
 *             setCustomRange: (from: Date, to: Date) => void,
 *             label: string }}
 */
export default function useAnalyticsRange(defaultPreset = 'this_month') {
  const [preset, setPresetState] = useState(defaultPreset);
  const [customFrom, setCustomFrom] = useState(/** @type {Date|null} */ (null));
  const [customTo, setCustomTo] = useState(/** @type {Date|null} */ (null));

  const { fromTs, toTs, label } = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return {
        fromTs: customFrom.toISOString(),
        toTs: customTo.toISOString(),
        label: `${customFrom.toLocaleDateString()} – ${customTo.toLocaleDateString()}`,
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    /** @type {Date} */
    let from;
    /** @type {Date} */
    let to = new Date(today.getTime() + 86400000 - 1); // end of today

    switch (preset) {
      case 'today':
        from = today;
        return { fromTs: from.toISOString(), toTs: to.toISOString(), label: 'Today' };

      case 'yesterday': {
        from = new Date(today.getTime() - 86400000);
        to = new Date(today.getTime() - 1);
        return { fromTs: from.toISOString(), toTs: to.toISOString(), label: 'Yesterday' };
      }

      case 'this_week': {
        const dayOfWeek = today.getDay();
        const monday = new Date(today.getTime() - ((dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 86400000));
        from = monday;
        return { fromTs: from.toISOString(), toTs: to.toISOString(), label: 'This Week' };
      }

      case 'this_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        return { fromTs: from.toISOString(), toTs: to.toISOString(), label: 'This Month' };

      case 'last_30_days':
        from = new Date(today.getTime() - 30 * 86400000);
        return { fromTs: from.toISOString(), toTs: to.toISOString(), label: 'Last 30 Days' };

      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        return { fromTs: from.toISOString(), toTs: to.toISOString(), label: 'This Month' };
    }
  }, [preset, customFrom, customTo]);

  const setPreset = useCallback((/** @type {RangePreset} */ p) => {
    setPresetState(p);
    if (p !== 'custom') {
      setCustomFrom(null);
      setCustomTo(null);
    }
  }, []);

  const setCustomRange = useCallback((/** @type {Date} */ from, /** @type {Date} */ to) => {
    setPresetState('custom');
    setCustomFrom(from);
    setCustomTo(to);
  }, []);

  return { fromTs, toTs, preset, setPreset, setCustomRange, label };
}

/** @type {RangePreset[]} */
export const RANGE_PRESETS = ['today', 'yesterday', 'this_week', 'this_month', 'last_30_days', 'custom'];

/** @type {Record<RangePreset, string>} */
export const PRESET_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  this_month: 'This Month',
  last_30_days: 'Last 30 Days',
  custom: 'Custom Range',
};
