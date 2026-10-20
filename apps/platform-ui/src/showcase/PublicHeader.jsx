// @ts-nocheck
import React from "react";
import BrandLogo from "./BrandLogo.jsx";
import { isSignedIn } from "./brandApi.js";

const SITE = "https://dalaillama.in";

/** The brand site's header: the landing site's header, same logo and links in the same order, so
 * moving between the two sites feels like one site. A signed-in brand's "Sign in" opens their console. */
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
          <a href={`${SITE}/#how`}>For brands</a>
          <a href={`${SITE}/#creators`}>For creators</a>
          <a href={`${SITE}/#films`}>Films</a>
          <a href={`${SITE}/#pricing`}>Pricing</a>
          <a href={`${SITE}/blog`}>Guides</a>
          {right}
          <a href={signedIn ? "/brands/home" : "/brands/sign-in"}>{signedIn ? "Your brand console" : "Sign in"}</a>
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
        <a href="/creators?then=request">Request a video</a>
        <a href={`${SITE}/blog`}>Blog</a>
        <a href="/creators">Creators</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </footer>
    </div>
  );
}
