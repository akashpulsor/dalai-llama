// Loads YouTube's IFrame Player API once and resolves with window.YT. The player itself is
// YouTube's, unmodified (developer policies); we only listen to its state changes.
let loading = null;

export function loadYouTubeIframeApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") previous();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("YouTube player could not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
