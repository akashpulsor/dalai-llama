// Popup: reads the active tab's URL (activeTab permission, granted by clicking the toolbar
// button) and asks the service worker to call the API. It never sees the pairing token.
import { APP_URL } from "./config.js";
import { videoIdFrom } from "./youtube.js";

const INDUSTRIES = [
  ["FASHION", "Fashion"], ["BEAUTY", "Beauty"], ["FOOD_BEVERAGE", "Food & beverage"], ["TECH", "Tech"], ["FINANCE", "Finance"],
  ["REAL_ESTATE", "Real estate"], ["EDUCATION", "Education"], ["HEALTH", "Health"], ["TRAVEL", "Travel"],
  ["AUTOMOTIVE", "Automotive"], ["ECOMMERCE", "E-commerce"], ["ENTERTAINMENT", "Entertainment"], ["OTHER", "Other"],
];
const FORMATS = [["PRODUCT_AD", "Product ad"], ["UGC", "UGC"], ["EXPLAINER", "Explainer"], ["BRAND_FILM", "Brand film"], ["SOCIAL_SHORT", "Social short"]];
const STATUS = { QUEUED: "Waiting", UPLOADING: "Uploading", PUBLISHED: "On YouTube", SCHEDULED: "Scheduled", FAILED: "Failed", CANCELLED: "Cancelled" };

const $ = (id) => document.getElementById(id);
let pollTimer = null;

const send = (message) => new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
const api = (method, path, body) => send({ type: "API", method, path, body });

function say(text, error = false) {
  $("message").textContent = text || "";
  $("message").className = error ? "error" : "";
}

function fill(select, options) {
  select.replaceChildren(...options.map(([value, text]) => Object.assign(document.createElement("option"), { value, textContent: text })));
}

async function start() {
  const status = await send({ type: "STATUS" });
  if (!status?.paired) return showUnpaired();
  const me = await api("GET", "/me");
  if (!me.ok) return me.status === 401 ? showUnpaired() : say(me.error, true);
  $("paired").hidden = false;
  $("who").textContent = me.data.creatorName + (me.data.channelTitle ? ` · ${me.data.channelTitle}` : "");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const videoId = tab?.url ? videoIdFrom(tab.url) : null;
  if (videoId) {
    $("video-none").hidden = true;
    $("import-form").hidden = false;
    $("video-id").textContent = videoId;
    fill($("industry"), INDUSTRIES);
    fill($("format"), FORMATS);
    $("import-form").onsubmit = (e) => importVideo(e, videoId);
  }

  if (!me.data.canPublish) {
    $("publish-off").hidden = false;
  } else {
    const films = await api("GET", "/films");
    if (films.ok && films.data.length > 0) {
      $("publish-form").hidden = false;
      fill($("film"), films.data.map((f) => [f.projectId, f.name + (f.clientConsented ? "" : " (private only)")]));
      const syncFilm = () => {
        const film = films.data.find((f) => f.projectId === $("film").value);
        $("title").value = (film?.name || "").slice(0, 100);
        for (const option of $("privacy").options) option.disabled = option.value !== "PRIVATE" && !film?.clientConsented;
        if (!film?.clientConsented) $("privacy").value = "PRIVATE";
        syncConfirm();
      };
      const syncConfirm = () => { $("confirm-row").hidden = $("privacy").value !== "PUBLIC"; };
      $("film").onchange = syncFilm;
      $("privacy").onchange = syncConfirm;
      syncFilm();
      $("publish-form").onsubmit = (e) => publish(e, films.data);
    } else if (films.ok) {
      $("publish-off").textContent = "No finished films yet.";
      $("publish-off").hidden = false;
    }
    refreshJobs();
  }
  $("unpair").onclick = async () => { await send({ type: "UNPAIR" }); window.close(); };
}

function showUnpaired() {
  $("unpaired").hidden = false;
  $("open-app").onclick = () => chrome.tabs.create({ url: `${APP_URL}/marketing` });
}

async function importVideo(event, videoId) {
  event.preventDefault();
  say("Adding…");
  const r = await api("POST", "/portfolio/import", {
    video: videoId, industry: $("industry").value, format: $("format").value, rightsConfirmed: $("rights").checked,
  });
  say(r.ok ? "Added to your profile." : r.error, !r.ok);
}

async function publish(event) {
  event.preventDefault();
  const privacy = $("privacy").value;
  if (privacy === "PUBLIC" && !$("confirm").checked) return say("Confirm that the video will be public.", true);
  say("Queuing…");
  const r = await api("POST", "/publish", {
    projectId: $("film").value, title: $("title").value.replace(/[<>]/g, ""), description: "", tags: [], privacy,
    confirmPublic: privacy === "PUBLIC" && $("confirm").checked, idempotencyKey: crypto.randomUUID(),
  });
  say(r.ok ? "Queued. It uploads in the background." : r.error, !r.ok);
  if (r.ok) refreshJobs();
}

async function refreshJobs() {
  const r = await api("GET", "/publish-jobs");
  if (!r.ok) return;
  $("jobs").replaceChildren(...r.data.slice(0, 5).map((j) => {
    const li = document.createElement("li");
    const percent = j.status === "UPLOADING" ? ` ${j.progressPercent}%` : "";
    li.textContent = `${j.title} — ${STATUS[j.status]}${percent}`;
    if (j.youtubeUrl) {
      const a = Object.assign(document.createElement("a"), { href: j.youtubeUrl, target: "_blank", rel: "noreferrer", textContent: " open" });
      li.append(a);
    }
    if (j.lastError) li.append(Object.assign(document.createElement("div"), { className: "error", textContent: j.lastError }));
    return li;
  }));
  clearTimeout(pollTimer);
  if (r.data.some((j) => j.status === "QUEUED" || j.status === "UPLOADING")) pollTimer = setTimeout(refreshJobs, 4000);
}

start();
