// @ts-check
import React, { useState, useMemo } from "react";
import { ArrowRight, Search, Globe } from "lucide-react";
import { useSearchAvailableDidsQuery } from "@dalaillama/shared-store";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} AvailableDid
 * @property {string} number
 * @property {string} country
 * @property {string} city
 * @property {string} type
 * @property {number} monthlyFee
 * @property {number} setupFee
 */

/**
 * @typedef {Object} NumberPickerProps
 * @property {string} tenantId
 * @property {(did: AvailableDid) => void} onSelect
 */

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

/**
 * NumberPicker – Search and select an available DID
 *
 * @param {NumberPickerProps} props
 * @returns {React.JSX.Element}
 */
const NumberPicker = ({ tenantId, onSelect }) => {
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [search, setSearch] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [country] = useState("IN"); // later: make selectable

  const shouldSearch = search.trim().length > 0;

  const {
    data,
    isFetching,
    isError,
  } = /** @type {{ data?: AvailableDid[], isFetching: boolean, isError: boolean }} */ (
    useSearchAvailableDidsQuery(
      {
        tenantId,
        country,
        prefix: search,
        limit: 10,
      },
      {
        skip: !shouldSearch,
      }
    )
  );

  /** @type {AvailableDid[]} */
  const results = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
            <Globe size={16} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Select Phone Number
          </h2>
        </div>
        <p className="text-slate-500 text-sm">
          Search and choose a DID for this tenant.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type="text"
          value={search}
          /** @param {React.ChangeEvent<HTMLInputElement>} e */
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by prefix or city…"
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-purple-500/20"
        />
      </div>

      {/* Loading */}
      {isFetching && (
        <p className="text-sm text-slate-500 italic">
          Searching available numbers…
        </p>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-red-500">
          Failed to load numbers. Try again.
        </p>
      )}

      {/* Results */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {results.map((did) => (
          <button
            key={did.number}
            type="button"
            onClick={() => onSelect(did)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition">
              <div>
                <div className="font-mono font-bold text-slate-900">
                  {did.number}
                </div>
                <div className="text-xs text-slate-500">
                  {did.country} · {did.city || did.type}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">
                    Setup
                  </div>
                  <div className="font-bold text-slate-900">
                    ${did.setupFee.toFixed(2)}
                  </div>
                </div>
                <ArrowRight size={16} className="text-purple-600" />
              </div>
            </div>
          </button>
        ))}

        {!isFetching && shouldSearch && results.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">
            No numbers found
          </p>
        )}
      </div>
    </div>
  );
};

export default NumberPicker;
