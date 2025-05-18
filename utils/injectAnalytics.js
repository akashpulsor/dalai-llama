// Utility to inject Google Analytics and Microsoft Clarity scripts only once
export function injectAnalyticsScripts({ gaId, clarityId }) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    // Google Analytics 4
    if (gaId && !document.getElementById('ga4-script')) {
        const gaScript = document.createElement('script');
        gaScript.id = 'ga4-script';
        gaScript.async = true;
        gaScript.defer = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(gaScript);
        const gaInit = document.createElement('script');
        gaInit.defer = true;
        gaInit.innerHTML = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId}');`;
        document.head.appendChild(gaInit);
    }
    // Microsoft Clarity
    if (clarityId && !document.getElementById('clarity-script')) {
        const clarityScript = document.createElement('script');
        clarityScript.id = 'clarity-script';
        clarityScript.type = 'text/javascript';
        clarityScript.async = true;
        clarityScript.defer = true;
        clarityScript.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/${clarityId}";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityId}");`;
        document.head.appendChild(clarityScript);
    }
}