// @ts-nocheck
import React, { useMemo, useState } from "react";
import { AlertTriangle, Bot, Check, ChevronDown, Loader2 } from "lucide-react";

export default function AiProviderSelect({
  providers = [],
  value,
  selectedProvider,
  onChange,
  isLoading = false,
  isError = false,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const hasProviders = Array.isArray(providers) && providers.length > 0;
  const orderedProviders = useMemo(
    () => [...(providers || [])].sort((a, b) => Number(a.sortOrder ?? 100) - Number(b.sortOrder ?? 100)),
    [providers]
  );
  const activeProvider = selectedProvider
    || orderedProviders.find((provider) => provider.code === value)
    || orderedProviders.find((provider) => provider.defaultProvider)
    || orderedProviders[0];
  const disabled = isLoading || !hasProviders;
  const activeLabel = activeProvider?.displayName || activeProvider?.label || activeProvider?.code || "AI Provider";
  const modelLabel = activeProvider?.defaultModel || "Backend model";
  const hasWarning = activeProvider?.credentialConfigured === false || isError;

  const handleSelect = (providerCode) => {
    onChange?.(providerCode);
    setOpen(false);
  };

  return (
    <div className={`relative ${compact ? "min-w-[12.75rem]" : "min-w-[15.5rem]"}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className={`creator-control flex w-full items-center justify-between gap-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? "px-3 py-2" : "px-3.5 py-2.5"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
            hasWarning ? "border-amber-300/20 bg-amber-400/10 text-amber-200" : "border-purple-300/20 bg-purple-500/12 text-purple-200"
          }`}>
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : hasWarning ? <AlertTriangle size={15} /> : <Bot size={15} />}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase leading-none text-slate-500">AI</span>
            <span className="mt-1 flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-extrabold text-white">{activeLabel}</span>
              {activeProvider?.defaultProvider && (
                <span className="rounded bg-emerald-400/12 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-200">
                  Default
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">{modelLabel}</span>
          </span>
        </span>
        <ChevronDown size={15} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180 text-purple-200" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] p-1.5 shadow-2xl shadow-black/50" role="listbox">
          {orderedProviders.map((provider) => {
            const selected = provider.code === activeProvider?.code;
            const warning = provider.credentialConfigured === false;
            return (
              <button
                key={provider.code}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(provider.code)}
                className={`flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition ${
                  selected ? "bg-purple-500/16 text-white" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
                role="option"
                aria-selected={selected}
              >
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                  warning ? "bg-amber-400/10 text-amber-200" : "bg-purple-500/14 text-purple-200"
                }`}>
                  {warning ? <AlertTriangle size={14} /> : <Bot size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-extrabold">{provider.displayName || provider.label || provider.code}</span>
                    {provider.providerType && (
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-400">
                        {provider.providerType}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                    {provider.defaultModel || "Backend model"}
                    {warning ? " - credential missing" : ""}
                  </span>
                </span>
                {selected && <Check size={15} className="mt-1 shrink-0 text-emerald-300" />}
              </button>
            );
          })}
          {isError && (
            <div className="mx-2 mb-1 mt-1 rounded-md border border-amber-300/15 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
              Using local provider list until catalog reloads.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
