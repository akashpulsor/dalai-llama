// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../showcase/PublicHeader.jsx";

// Legal text for Google OAuth verification (YouTube API Services). Review before relying on it.
const CONTACT = "admin@dalaillama.in";
const UPDATED = "11 October 2026";

const ext = (href, label) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline">{label}</a>;

function Shell({ title, children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f6f8fc_100%)]">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24">
        <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-xs text-slate-500">Last updated {UPDATED}</p>
          <div className="mt-6 space-y-6 text-sm leading-6 text-slate-700 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
          <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <Link to="/privacy" className="underline">Privacy Policy</Link> · <Link to="/terms" className="underline">Terms of Service</Link>
          </p>
        </article>
      </main>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Shell title="Privacy Policy">
      <p>
        Dalai Llama ("we", "us") runs dalaillama.in, a platform where creators make films for brands, show their work on public
        profiles and reach brands by email. This policy explains what we collect, why, and the choices you have.
      </p>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><b>Creator accounts:</b> name, email, sign-in details, the projects and films you make, and your public profile.</li>
          <li><b>Brands:</b> the business email you sign in with, the creators you like, follow or contact, and messages you send them.</li>
          <li><b>Audiences:</b> business contacts a creator uploads or adds from our brand directory (company name, work email, phone,
            website). Our brand directory is built from public company information and the Hunter.io service.</li>
          <li><b>Visitors:</b> a random visitor identifier so likes are counted once, and basic server logs.</li>
        </ul>
      </section>
      <section>
        <h2>YouTube API Services</h2>
        <p>
          Dalai Llama uses YouTube API Services. When you connect your YouTube channel, you agree to be bound by the{" "}
          {ext("https://www.youtube.com/t/terms", "YouTube Terms of Service")}, and Google's handling of your data is covered by the{" "}
          {ext("https://policies.google.com/privacy", "Google Privacy Policy")}.
        </p>
        <p>With your permission we access:</p>
        <ul>
          <li>your channel's name and ID, to show which channel is connected;</li>
          <li>the ability to upload videos to your channel and set their title, description, thumbnail, visibility and schedule, but only
            for films you choose to publish from Dalai Llama;</li>
          <li>your channel's videos and their analytics (views, watch time, likes), shown only to you on your Marketing page.</li>
        </ul>
        <p>
          We never publish a video publicly without your explicit confirmation. We store your Google refresh token encrypted, use it only
          to perform the actions above, and never share it or show it to browser extensions or other users. YouTube analytics we fetch
          are kept for at most one hour, then fetched again.
        </p>
        <p>
          You can disconnect your channel at any time from the Marketing page; we then delete your token and revoke our access with
          Google. You can also remove our access in your{" "}
          {ext("https://myaccount.google.com/permissions", "Google security settings")}. Our use of information received from Google APIs
          follows the {ext("https://developers.google.com/terms/api-services-user-data-policy", "Google API Services User Data Policy")},
          including its Limited Use requirements.
        </p>
      </section>
      <section>
        <h2>How we use information</h2>
        <ul>
          <li>to run the service: make and deliver films, show public profiles, publish videos you ask us to, and send the emails you send;</li>
          <li>to keep it safe: limit how many emails go out, stop emailing anyone who unsubscribes, and prevent abuse;</li>
          <li>to bill for what you use.</li>
        </ul>
        <p>We do not sell personal information and we do not use Google user data for advertising.</p>
      </section>
      <section>
        <h2>Sharing</h2>
        <p>
          We share information only with services that help us run Dalai Llama (cloud hosting, storage, email delivery, payment and the
          AI models used to make films), and when the law requires it. Each creator's audiences are private to that creator.
        </p>
      </section>
      <section>
        <h2>Emails from creators</h2>
        <p>
          Every outreach email has an unsubscribe link. Unsubscribing stops all email sent through Dalai Llama to that address, from any
          creator.
        </p>
      </section>
      <section>
        <h2>Keeping and deleting data</h2>
        <p>
          We keep account data while your account is active. Write to {CONTACT} to get a copy of your data or to have it deleted; we reply
          within 30 days.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about this policy: {CONTACT}.</p>
      </section>
    </Shell>
  );
}

export function TermsPage() {
  return (
    <Shell title="Terms of Service">
      <p>These terms apply to your use of dalaillama.in. By using the service you accept them.</p>
      <section>
        <h2>Accounts</h2>
        <p>Keep your sign-in details safe. You are responsible for what happens under your account.</p>
      </section>
      <section>
        <h2>Your content</h2>
        <p>
          You own the briefs, uploads and films you make. You give us permission to store, process and display them as needed to run the
          service, including on your public profile if you choose to show them. You must have the rights to everything you upload.
        </p>
      </section>
      <section>
        <h2>YouTube</h2>
        <p>
          If you connect a YouTube channel, you also agree to the {ext("https://www.youtube.com/t/terms", "YouTube Terms of Service")}. You
          choose what we publish and when; nothing is made public without your confirmation. You can disconnect at any time.
        </p>
      </section>
      <section>
        <h2>Emailing brands</h2>
        <p>
          Send outreach only to business contacts, using our templates. Do not upload contacts you have no right to use. We limit how many
          emails go out and honour every unsubscribe; we may suspend accounts that send spam.
        </p>
      </section>
      <section>
        <h2>Payments</h2>
        <p>Paid features are charged as shown when you buy them. Wallet credits are not refundable unless the law requires it.</p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>Do not use Dalai Llama for anything illegal, misleading, hateful or infringing, and do not try to break or overload the service.</p>
      </section>
      <section>
        <h2>The service</h2>
        <p>
          We work to keep Dalai Llama running but provide it as it is, without guarantees. To the extent the law allows, we are not liable
          for indirect losses. We may change these terms; we will post the new date above.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>{CONTACT}</p>
      </section>
    </Shell>
  );
}
