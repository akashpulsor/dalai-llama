// @ts-check
import React, { useState, useMemo,useRef,useEffect } from "react";
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
 * @property {string} monthlyFee
 * @property {string} setupFee
 * @property {string} provider
 * @property {string} currency
 * @property {string} inboundPrice
 * @property {string} outboundPrice
 */

/**
 * @typedef {Object} NumberPickerProps
 * @property {string} tenantId
 * @property {(did: AvailableDid, tenantId: string) => void} onSelect
 */

/**
 * @param {string | number | undefined | null} value
 * @returns {string}
 */
const formatMoney = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
};


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
  const [page, setPage] = useState(0);

  /** @type {[AvailableDid[], React.Dispatch<React.SetStateAction<AvailableDid[]>>]} */
  const [allResults, setAllResults] = useState(/** @type {AvailableDid[]} */ ([]));

  const [flashError, setFlashError] = useState(false);

  /** @type {React.MutableRefObject<HTMLDivElement | null>} */
  const containerRef = useRef(null);

  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [activeInfo, setActiveInfo] = useState(
    /** @type {string | null} */ (null)
  );

//  const shouldSearch = search.trim().length > 0;
const shouldSearch = true;

  const {
    data,
    isFetching,
    isError,
  } = /** @type {{ 
        data?: { content: AvailableDid[], totalPages: number }, 
        isFetching: boolean, 
        isError: boolean 
      }} */ (
    useSearchAvailableDidsQuery(
      {
        country,
        prefix: search,
        limit: 10,
        page,
        size: 20,
        sortField: "monthlyFee",
        sortOrder: "asc",
      },
      { skip: false }
    )
  );

    /* ---------------- Reset When Search Changes ---------------- */

  useEffect(() => {
    setPage(0);
    setAllResults([]);
  }, [search, country]);
  /** @type {AvailableDid[]} */
  //const results = useMemo(() => data ?? [], [data]);

  /* ---------------- Append New Page ---------------- */

  useEffect(() => {
    if (data?.content) {
      setAllResults(prev =>
        page === 0 ? data.content : [...prev, ...data.content]
      );
    }
  }, [data, page]);

  /* ---------------- Flash Error ---------------- */

    useEffect(() => {
    if (isError) {
      setFlashError(true);
      const t = setTimeout(() => setFlashError(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isError]);

 /* ---------------- Infinite Scroll ---------------- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!data) return;
      if (page + 1 >= data.totalPages) return;

      const bottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

      if (bottom && !isFetching) {
        setPage(p => p + 1);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [data, isFetching, page]);

  // AFTER:
  const results = useMemo(() => {
    if (!search) return allResults;

    const q = search.toLowerCase();
    return allResults.filter(d =>
      d.number.includes(q) ||
      d.city?.toLowerCase().includes(q)
    );
  }, [allResults, search]);


  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
            <Globe size={16} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Select Phone Number
          </h2>
        </div>
        <p className="text-slate-400 text-xs">
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

            {/* Flash Error */}
      {flashError && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
          Failed to load numbers. Try again.
        </div>
      )}

            {/* Results */}
      <div
        ref={containerRef}
        className="space-y-2 max-h-[300px] overflow-y-auto"
      >
      {results.map((did) => {

        return (
          <div
            key={did.number}
            className="relative bg-white border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition"
          >
            {/* Top Section */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-slate-900">
                  {did.number}
                </div>
                <div className="text-xs text-slate-500">
                  {did.country.toUpperCase()} · {did.city || did.type}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Info Button */}
                <button
                  type="button"
                  onClick={() => setActiveInfo(activeInfo === did.number ? null : did.number)}
                  className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition"
                >
                  ℹ
                </button>
                
                {/* Select Button */}
                <button
                  type="button"
                  onClick={() => onSelect(did, tenantId)}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

            </div>


            {/* Bubble Pop */}
            {activeInfo === did.number && (
              <div className="absolute top-12 right-3 w-64 bg-white border border-slate-200 shadow-lg rounded-xl p-4 text-xs text-slate-600 z-20 animate-fadeIn">

                <div className="font-semibold text-slate-800 mb-2">
                  Pricing Details
                </div>

                <div className="space-y-1">
                  <div>Setup Fee: {did.currency} {formatMoney(did.setupFee)}</div>
                  <div>Monthly Fee: {did.currency} {formatMoney(did.monthlyFee)}</div>
                  <div>Inbound: {did.currency} {formatMoney(did.inboundPrice)}/min</div>
                  <div>Outbound: {did.currency} {formatMoney(did.outboundPrice)}/min</div>

                  <div className="pt-2 border-t mt-2">
                    Provider: <span className="font-semibold text-purple-600">
                      {did.provider}
                    </span>
                  </div>
                </div>

                {/* Bubble Tail */}
                <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45"></div>
              </div>
            )}
          </div>
        );
      })}


        {isFetching && (
          <p className="text-sm text-slate-500 italic text-center py-4">
            Loading more numbers…
          </p>
        )}

        {!isFetching && results.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">
            No numbers found
          </p>
        )}
      </div>
    </div>
  );
};

export default NumberPicker;
