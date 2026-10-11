// @ts-nocheck
import React from "react";
import BrandLogo from "./BrandLogo.jsx";
import { isSignedIn } from "./brandApi.js";

const SITE = "https://dalaillama.in";

/** The landing site's header (dalaillama.in), so creator and brand pages read as one site. */
export default function PublicHeader({ right }) {
  return (
    <div className="site-shell" style={{ paddingBottom: 24 }}>
      <header className="topbar creator-panel-muted">
        <a className="wordmark" href={SITE} aria-label="Dalaillama home">
          <BrandLogo />
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href={SITE}>Home</a>
          <a href="/creators">Creators</a>
          <a href={`${SITE}/#pricing`}>Pricing</a>
          <a href={`${SITE}/blog`}>Guides</a>
          {right}
          <a href={isSignedIn() ? "/brands/home" : "/brands/sign-in"} style={{ color: "#c4b5fd" }}>
            {isSignedIn() ? "Your brand" : "For brands"}
          </a>
        </nav>
      </header>
    </div>
  );
}

/** The landing site's footer. */
export function PublicFooter() {
  return (
    <div className="site-shell" style={{ paddingTop: 0 }}>
      <footer className="site-footer" aria-label="Dalaillama footer">
        <span>Dalaillama</span>
        <a href="/creators">Creators</a>
        <a href={`${SITE}/#pricing`}>Pricing</a>
        <a href={`${SITE}/blog`}>Blog</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </footer>
    </div>
  );
}
