// @ts-nocheck
import React from "react";
import BrandLogo from "./BrandLogo.jsx";
import { isSignedIn } from "./brandApi.js";

const SITE = "https://dalaillama.in";

/** The brand site's header: the landing site's header, same logo and links, so moving between the
 * two sites feels like one site. A signed-in brand's "For brands" opens their console. */
export default function PublicHeader({ right }) {
  const signedIn = isSignedIn();
  return (
    <div className="site-shell" style={{ paddingBottom: 24 }}>
      <header className="topbar creator-panel-muted">
        <a className="wordmark" href={SITE} aria-label="Dalaillama home">
          <BrandLogo />
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href={SITE}>Home</a>
          <a href={`${SITE}/#order`}>Pipeline</a>
          <a href={`${SITE}/#pricing`}>Pricing</a>
          <a href={`${SITE}/#access`}>Access</a>
          <a href={`${SITE}/blog`}>Guides</a>
          <a href="/creators">Creators</a>
          {right}
          <a href={signedIn ? "/brands/home" : "/brands/sign-in"}>{signedIn ? "Your brand console" : "For brands"}</a>
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
        <span>Dalaillama</span>
        <a href={`${SITE}/#pricing`}>Pricing</a>
        <a href={`${SITE}/#access`}>Get Blueprint</a>
        <a href={`${SITE}/blog`}>Blog</a>
        <a href="/creators">Creators</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </footer>
    </div>
  );
}
