/**
 * One rendering of a project's money, shared by the client's lock modal, the creator's Wallet &
 * Billing page and the ops admin page -- so the lines a client was charged on are the same lines
 * the creator and ops read back. Every figure comes from billing-service; nothing is computed here.
 */

export const money = (amount, currency) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 2 })
    .format(Number(amount) || 0);

function Line({ label, amount, currency, sub, strong, tone = "text-slate-200" }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${sub ? "pl-3 text-[11px] text-slate-500" : "text-sm"}`}>
      <span className={strong ? "font-bold text-slate-200" : "font-semibold"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-extrabold text-white" : `font-semibold ${sub ? "" : tone}`}`}>
        {money(amount, currency)}
      </span>
    </div>
  );
}

/** Video production (with what it is made of) + music production = the quoted price. */
export function ProductionChargeLines({ production }) {
  if (!production) return null;
  const c = production.currency;
  return (
    <div className="space-y-1.5">
      <Line label="Video production" amount={production.videoProduction} currency={c} />
      <Line sub label="Scripting & screenplay writing" amount={production.scriptingAndScreenplay} currency={c} />
      <Line sub label="Shot planning" amount={production.shotPlanning} currency={c} />
      <Line sub label="Frame generation" amount={production.frameGeneration} currency={c} />
      <Line sub label="Video generation" amount={production.videoGeneration} currency={c} />
      <Line label="Music production" amount={production.musicProduction} currency={c} />
      <div className="border-t border-white/10 pt-1.5">
        <Line strong label="Production price" amount={production.total} currency={c} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

const profitTone = (n) => (Number(n) < 0 ? "text-rose-300" : "text-emerald-300");

/** A project's statement. `platform` is only present on the ops route, so the same card shows
 * the creator their view and ops the full picture. */
export function ProjectEconomicsCard({ economics, title }) {
  const c = economics.currency;
  const { customer, creator, platform, production } = economics;
  return (
    <div className="creator-panel space-y-3 p-4">
      <p className="truncate text-sm font-bold text-white">{title}</p>
      <div className={`grid gap-3 ${platform ? "lg:grid-cols-4 sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <Section title="Production charges (shown to client)">
          {production
            ? <ProductionChargeLines production={production} />
            : <p className="text-[11px] font-medium text-slate-500">No quoted brief behind this project.</p>}
        </Section>
        <Section title="Paid by client">
          <Line label="Upfront on the brief" amount={customer.paidUpfront} currency={c} />
          <Line label="On the review page" amount={customer.paidOnReview} currency={c} />
          <Line strong label="Total paid" amount={customer.totalPaid} currency={c} />
        </Section>
        <Section title="Creator">
          <Line label="Received in wallet" amount={creator.received} currency={c} />
          <Line label="AI production charged" amount={creator.productionCharged} currency={c} />
          <Line label="Profit" amount={creator.profit} currency={c} tone={profitTone(creator.profit)} />
        </Section>
        {platform && (
          <Section title="Platform">
            <Line label="Actual provider charges" amount={platform.providerCost} currency={c} />
            <Line label="Charged to creator" amount={platform.charged} currency={c} />
            <Line label="Usage margin" amount={platform.usageMargin} currency={c} />
            <Line label="Extra review fees" amount={platform.reviewPaymentShare} currency={c} />
            <Line label="Profit" amount={platform.profit} currency={c} tone={profitTone(platform.profit)} />
          </Section>
        )}
      </div>
    </div>
  );
}
