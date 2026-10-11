export default function BrandLogo() {
  return (
    <span className="brand-logo">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" role="img">
          <path className="brand-mark-bg" d="M22 3.5c10.22 0 18.5 8.28 18.5 18.5S32.22 40.5 22 40.5 3.5 32.22 3.5 22 11.78 3.5 22 3.5Z" />
          <path className="brand-mark-ear-left" d="M14.2 7.3 19 15.1l-7.4 2.1c-.38-3.78.48-7.12 2.6-9.9Z" />
          <path className="brand-mark-ear-right" d="m29.8 7.3-4.8 7.8 7.4 2.1c.38-3.78-.48-7.12-2.6-9.9Z" />
          <path className="brand-mark-d" d="M15.5 13.4h8.1c5.7 0 9.9 3.85 9.9 8.75 0 4.98-4.2 8.45-9.9 8.45h-8.1V13.4Zm5.05 4.25v8.7h2.8c2.96 0 5-1.7 5-4.25 0-2.62-2.04-4.45-5-4.45h-2.8Z" />
          <path className="brand-mark-gloss" d="M11.4 11.3c3.08-3.3 7.52-4.82 12.04-4.12 4.48.69 8.16 3.42 10.25 7.22-6.22-4.16-14.57-4.1-22.29-3.1Z" />
        </svg>
      </span>
      <span className="brand-copy">
        <strong>Dalaillama</strong>
        <small>Creator Studio</small>
      </span>
    </span>
  );
}
