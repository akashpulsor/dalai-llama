import { Calendar } from 'lucide-react';
import { RANGE_PRESETS, PRESET_LABELS } from '../../hooks/useAnalyticsRange.js';

/**
 * Date range picker for analytics pages.
 * Syncs with useAnalyticsRange hook.
 *
 * @param {{ preset: string, label: string, setPreset: Function,
 *           setCustomRange: Function }} props - from useAnalyticsRange()
 */
export default function DateRangePicker({ preset, label, setPreset, setCustomRange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="w-4 h-4 text-slate-400" />
      {RANGE_PRESETS.filter((p) => p !== 'custom').map((p) => (
        <button
          key={p}
          onClick={() => setPreset(p)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            preset === p
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {PRESET_LABELS[p]}
        </button>
      ))}
      <button
        onClick={() => {
          const from = prompt('From date (YYYY-MM-DD):');
          const to = prompt('To date (YYYY-MM-DD):');
          if (from && to) setCustomRange(new Date(from), new Date(to));
        }}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
          preset === 'custom'
            ? 'bg-purple-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Custom
      </button>
      {preset === 'custom' && (
        <span className="text-xs text-slate-500 ml-1">{label}</span>
      )}
    </div>
  );
}
