// @ts-nocheck
import React from "react";
import BrandLogo from "./BrandLogo.jsx";
import { isSignedIn } from "./brandApi.js";

const SITE = "https://dalaillama.in";

/** The brand site's header (landing-site look). The logo goes to the landing site; the rest stays
 * on the brand site: creators, and the brand's own console or sign-in. */
export default function PublicHeader({ right }) {
  const signedIn = isSignedIn();
  return (
    <div className="site-shell" style={{ paddingBottom: 24 }}>
      <header className="topbar creator-panel-muted">
        <a className="wordmark" href={SITE} aria-label="Dalaillama home">
          <BrandLogo />
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="/creators">Browse creators</a>
          {right}
          <a href={signedIn ? "/brands/home" : "/brands/sign-in"} style={{ color: "#c4b5fd" }}>
            {signedIn ? "Your brand console" : "Sign in for brands"}
          </a>
        </nav>
      </header>
    </div>
  );
}

/** The brand site's footer. */
export function PublicFooter() {
  return (
    <div className="site-shell" style={{ paddingTop: 0 }}>
      <footer className="site-footer" aria-label="Dalaillama footer">
        <span>Dalaillama for brands</span>
        <a href="/creators">Browse creators</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href={SITE}>dalaillama.in</a>
      </footer>
    </div>
  );
}
