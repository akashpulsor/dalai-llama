// @ts-nocheck

const ANIMATED_FONT_STYLESHEET = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@500;600;700;800;900&family=Inter:wght@500;600;700;800;900&family=Lora:wght@500;600;700&family=Montserrat:wght@600;700;800;900&family=Oswald:wght@500;600;700&family=Playfair+Display:wght@600;700;800&family=Poppins:wght@500;600;700;800;900&family=Raleway:wght@500;600;700;800;900&family=Roboto+Slab:wght@500;600;700;800&display=swap";

export function buildAnimatedStoryboardHtml({
  title = "Storyboard",
  storyline = "",
  scenes = [],
  durationSeconds = 30,
  screenType = "vertical",
  dialogueLanguage = "English",
  clientReview = {},
  productMode = false,
} = {}) {
  const reviewOverlayPlan = Array.isArray(clientReview?.overlayPlan) ? clientReview.overlayPlan : [];
  const normalizedScenes = (Array.isArray(scenes) ? scenes : []).map((scene, index) => (
    normalizeScene(scene, index, reviewOverlayPlan)
  ));
  const safeTitle = escapeHtml(title);
  const reviewCards = renderReviewCards(clientReview);
  const slides = normalizedScenes.map((scene, index) => renderSlide(scene, index, productMode)).join("\n");
  const rail = normalizedScenes.map((scene, index) => renderRailItem(scene, index)).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} — Animated Storyboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${ANIMATED_FONT_STYLESHEET}" rel="stylesheet" />
  <style>
    :root { color-scheme: dark; --gold:#f7c948; --ink:#070a12; --panel:#111827; --muted:#94a3b8; }
    * { box-sizing: border-box; }
    html, body { width:100%; min-height:100%; margin:0; background:#05070d; }
    body {
      overflow-x:hidden; color:#f8fafc;
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      background:
        radial-gradient(circle at 12% 0%,rgba(247,201,72,.17),transparent 28%),
        radial-gradient(circle at 92% 12%,rgba(34,211,238,.12),transparent 25%),
        linear-gradient(145deg,#060910,#0b1120 55%,#111827);
    }
    button { font:inherit; }
    .shell { width:min(1500px,100%); min-height:100vh; margin:0 auto; padding:22px; display:grid; grid-template-rows:auto 1fr auto; gap:16px; }
    .topbar { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; }
    .brand { display:flex; gap:12px; align-items:center; }
    .mark { width:42px; height:42px; display:grid; place-items:center; border-radius:12px; color:#07101f; background:linear-gradient(145deg,#ffe486,#d49d18); font-weight:950; box-shadow:0 14px 36px rgba(247,201,72,.22); }
    .eyebrow { margin:0; color:var(--gold); font-size:10px; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
    h1 { margin:3px 0 0; max-width:900px; font-size:clamp(20px,3vw,38px); line-height:1.03; letter-spacing:-.035em; }
    .meta { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
    .pill { border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:7px 10px; color:#dbe5f6; background:rgba(255,255,255,.055); font-size:10px; font-weight:850; text-transform:uppercase; }
    .stage { position:relative; min-height:min(75vh,820px); overflow:hidden; border:1px solid rgba(255,255,255,.13); border-radius:20px; background:#02040a; box-shadow:0 30px 90px rgba(0,0,0,.5),inset 0 1px rgba(255,255,255,.1); }
    .progress { position:absolute; z-index:20; top:0; left:0; right:0; height:4px; background:rgba(255,255,255,.12); }
    .progress > span { display:block; width:0; height:100%; background:linear-gradient(90deg,var(--gold),#22d3ee); box-shadow:0 0 22px rgba(247,201,72,.5); }
    .slide { position:absolute; inset:0; display:grid; grid-template-columns:minmax(0,1.55fr) minmax(320px,.75fr); opacity:0; visibility:hidden; transform:scale(1.015); transition:opacity .7s ease,transform 1s ease,visibility .7s; }
    .slide.active { opacity:1; visibility:visible; transform:scale(1); }
    .visual { position:relative; min-height:520px; overflow:hidden; background:linear-gradient(135deg,#141b2c,#06080f); }
    .visual img.frame { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; background:#04060b; transform:scale(1.02); opacity:1; will-change:transform,opacity; }
    .slide.active:not(.dual).motion-push img.frame { animation:push-in var(--scene-ms,6000ms) ease-in-out both; }
    .slide.active:not(.dual).motion-left img.frame { animation:pan-left var(--scene-ms,6000ms) ease-in-out both; }
    .slide.active:not(.dual).motion-right img.frame { animation:pan-right var(--scene-ms,6000ms) ease-in-out both; }
    .visual img.frame-b { opacity:0; }
    .slide.active.dual img.frame-a { animation:frame-a var(--scene-ms,6000ms) ease-in-out both; }
    .slide.active.dual img.frame-b { animation:frame-b var(--scene-ms,6000ms) ease-in-out both; }
    @keyframes push-in { from{transform:scale(1.015)} to{transform:scale(1.11)} }
    @keyframes pan-left { from{transform:scale(1.08) translate3d(2.2%,.2%,0)} to{transform:scale(1.13) translate3d(-2.2%,-.5%,0)} }
    @keyframes pan-right { from{transform:scale(1.08) translate3d(-2.2%,.2%,0)} to{transform:scale(1.13) translate3d(2.2%,-.5%,0)} }
    @keyframes frame-a { 0%,38%{opacity:1;transform:scale(1.02)} 58%,100%{opacity:0;transform:scale(1.10)} }
    @keyframes frame-b { 0%,38%{opacity:0;transform:scale(1.08)} 58%,100%{opacity:1;transform:scale(1.015)} }
    .fallback { height:100%; min-height:520px; display:grid; place-items:center; padding:40px; color:#73829a; text-align:center; font-weight:850; background:repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 14px,transparent 14px 28px); }
    .frame-label { position:absolute; top:18px; left:18px; z-index:2; padding:8px 11px; border:1px solid rgba(255,255,255,.18); border-radius:999px; background:rgba(3,6,12,.72); backdrop-filter:blur(12px); color:#fff5c7; font-size:10px; font-weight:900; text-transform:uppercase; }
    .caption { position:absolute; z-index:3; left:7%; right:7%; bottom:7%; padding:12px 15px; border:1px solid rgba(255,255,255,.15); border-radius:12px; background:rgba(3,6,12,.82); backdrop-filter:blur(13px); text-align:center; font-size:clamp(13px,1.7vw,22px); font-weight:850; line-height:1.25; text-shadow:0 2px 8px #000; }
    .overlay-copy { position:absolute; z-index:4; left:7%; right:7%; display:flex; pointer-events:none; }
    .overlay-copy.top { top:12%; align-items:flex-start; } .overlay-copy.center { top:42%; align-items:center; } .overlay-copy.bottom { bottom:14%; align-items:flex-end; }
    .overlay-copy.left { justify-content:flex-start; text-align:left; } .overlay-copy.middle { justify-content:center; text-align:center; } .overlay-copy.right { justify-content:flex-end; text-align:right; }
    .overlay-copy span { display:block; max-width:min(82%,760px); padding:.18em .34em; color:var(--overlay-color,#fff); font-family:var(--overlay-font,Montserrat),sans-serif; font-size:clamp(22px,4vw,var(--overlay-size,58px)); font-weight:var(--overlay-weight,800); line-height:1.02; letter-spacing:-.035em; text-shadow:0 3px 16px rgba(0,0,0,.75); opacity:0; }
    .slide.active .overlay-copy span { animation:overlay-in var(--overlay-in,650ms) cubic-bezier(.2,.8,.2,1) var(--overlay-delay,250ms) forwards,overlay-out var(--overlay-out,450ms) ease calc(var(--scene-ms,6000ms) - var(--overlay-out,450ms)) forwards; }
    .overlay-copy.slide-up span { transform:translateY(28px); } .overlay-copy.zoom span { transform:scale(.88); } .overlay-copy.wipe span { clip-path:inset(0 100% 0 0); }
    @keyframes overlay-in { to { opacity:1; transform:none; clip-path:inset(0 0 0 0); } } @keyframes overlay-out { to { opacity:0; transform:translateY(-10px); } }
    .detail { padding:clamp(22px,3vw,42px); display:flex; flex-direction:column; justify-content:center; background:linear-gradient(155deg,rgba(22,30,49,.98),rgba(7,10,18,.98)); border-left:1px solid rgba(255,255,255,.09); }
    .shot-no { color:var(--gold); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.15em; }
    h2 { margin:9px 0 0; font-size:clamp(25px,3vw,48px); line-height:1.01; letter-spacing:-.045em; }
    .time { margin-top:12px; color:#9fb0c9; font-size:12px; font-weight:800; }
    .story { margin:22px 0 0; color:#dce5f3; font-size:14px; font-weight:650; line-height:1.65; }
    .specs { display:grid; gap:9px; margin-top:22px; }
    .spec { padding:10px 12px; border:1px solid rgba(255,255,255,.1); border-radius:10px; background:rgba(255,255,255,.045); }
    .spec span { display:block; color:#8392aa; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; }
    .spec p { margin:4px 0 0; color:#ecf2fb; font-size:11px; font-weight:700; line-height:1.4; }
    .controls { position:absolute; z-index:30; left:18px; bottom:18px; display:flex; gap:8px; }
    .control { width:42px; height:42px; border:1px solid rgba(255,255,255,.18); border-radius:50%; background:rgba(3,6,12,.78); color:white; cursor:pointer; backdrop-filter:blur(12px); transition:.2s ease; }
    .control:hover { border-color:var(--gold); color:var(--gold); transform:translateY(-2px); }
    .rail { display:flex; gap:9px; overflow:auto; padding:2px 1px 8px; scrollbar-color:#475569 transparent; }
    .rail button { flex:0 0 150px; display:grid; grid-template-columns:42px 1fr; align-items:center; gap:9px; padding:7px; border:1px solid rgba(255,255,255,.1); border-radius:11px; background:rgba(255,255,255,.045); color:#d9e3f2; text-align:left; cursor:pointer; transition:.2s ease; }
    .rail button.active { border-color:rgba(247,201,72,.65); background:rgba(247,201,72,.1); color:white; }
    .thumb { width:42px; height:42px; border-radius:8px; overflow:hidden; display:grid; place-items:center; background:#070a12; color:#64748b; font-size:10px; font-weight:900; }
    .thumb img { width:100%; height:100%; object-fit:cover; }
    .rail strong { display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:10px; }
    .rail span { display:block; margin-top:3px; color:#7f8ea6; font-size:9px; font-weight:750; }
    .intro { position:fixed; z-index:50; inset:0; display:grid; place-items:center; padding:24px; background:rgba(2,4,10,.93); backdrop-filter:blur(18px); transition:opacity .5s ease,visibility .5s; }
    .intro.hidden { opacity:0; visibility:hidden; }
    .intro-card { width:min(820px,100%); padding:clamp(25px,5vw,58px); border:1px solid rgba(255,255,255,.15); border-radius:24px; background:linear-gradient(145deg,rgba(28,38,61,.98),rgba(8,12,22,.98)); box-shadow:0 35px 100px rgba(0,0,0,.55); }
    .intro-card h2 { font-size:clamp(36px,7vw,74px); text-transform:uppercase; }
    .logline { margin:20px 0 0; color:#cbd6e7; font-size:14px; line-height:1.65; font-weight:650; }
    .reviews { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; margin-top:22px; }
    .review { padding:11px; border:1px solid rgba(255,255,255,.1); border-radius:11px; background:rgba(255,255,255,.045); }
    .review span { color:#f9d96d; font-size:9px; font-weight:900; text-transform:uppercase; }
    .review p { margin:5px 0 0; color:#dce6f5; font-size:10px; line-height:1.45; font-weight:650; }
    .start { margin-top:24px; min-height:45px; border:0; border-radius:999px; padding:0 20px; color:#07101f; background:linear-gradient(145deg,#ffe486,#d49d18); font-weight:950; cursor:pointer; box-shadow:0 15px 36px rgba(247,201,72,.2); }
    @media(max-width:880px) {
      .shell{padding:12px}.topbar{display:block}.meta{justify-content:flex-start;margin-top:10px}
      .stage{min-height:790px}.slide{grid-template-columns:1fr;grid-template-rows:minmax(390px,55vh) auto}.detail{justify-content:flex-start;border-left:0;border-top:1px solid rgba(255,255,255,.09);padding:20px}.visual,.fallback{min-height:390px}.reviews{grid-template-columns:1fr}
    }
    @media(prefers-reduced-motion:reduce) { *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important} }
  </style>
</head>
<body>
  <div class="intro" id="intro">
    <div class="intro-card">
      <p class="eyebrow">DalaiLlama Creator · Client presentation</p>
      <h2>${safeTitle}</h2>
      <p class="logline">${escapeHtml(storyline || "A visual walkthrough of the planned story, performance, and production frames.")}</p>
      ${reviewCards ? `<div class="reviews">${reviewCards}</div>` : ""}
      <button class="start" id="start">Play storyboard →</button>
    </div>
  </div>
  <main class="shell">
    <header class="topbar">
      <div class="brand"><div class="mark">DL</div><div><p class="eyebrow">Animated storyboard</p><h1>${safeTitle}</h1></div></div>
      <div class="meta">
        <span class="pill">${escapeHtml(dialogueLanguage)} dialogue</span>
        <span class="pill">${escapeHtml(screenType)}</span>
        <span class="pill">${normalizedScenes.length} shots · ${escapeHtml(durationSeconds)} sec</span>
        ${productMode ? '<span class="pill">Production frames</span>' : ""}
      </div>
    </header>
    <section class="stage" id="stage">
      <div class="progress"><span id="progress"></span></div>
      ${slides || '<div class="fallback">Storyboard frames are not available yet.</div>'}
      <div class="controls">
        <button class="control" id="previous" aria-label="Previous shot">←</button>
        <button class="control" id="toggle" aria-label="Play or pause">❚❚</button>
        <button class="control" id="next" aria-label="Next shot">→</button>
      </div>
    </section>
    <nav class="rail" id="rail" aria-label="Storyboard shots">${rail}</nav>
  </main>
  <script>
    (() => {
      const slides = Array.from(document.querySelectorAll('.slide'));
      const railButtons = Array.from(document.querySelectorAll('.rail button'));
      const progress = document.getElementById('progress');
      const toggle = document.getElementById('toggle');
      let active = 0;
      let playing = true;
      let timer = 0;
      let startedAt = 0;
      let elapsed = 0;
      const durationFor = index => Number(slides[index]?.dataset.duration || 6000);
      function paintProgress() {
        if (!playing || !slides.length) return;
        const duration = durationFor(active);
        const fraction = Math.min(1, (elapsed + performance.now() - startedAt) / duration);
        progress.style.width = (fraction * 100) + '%';
        if (fraction < 1) requestAnimationFrame(paintProgress);
      }
      function schedule() {
        clearTimeout(timer);
        elapsed = 0;
        startedAt = performance.now();
        progress.style.width = '0%';
        if (playing && slides.length) {
          timer = setTimeout(() => show((active + 1) % slides.length), durationFor(active));
          requestAnimationFrame(paintProgress);
        }
      }
      function show(index) {
        if (!slides.length) return;
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, item) => slide.classList.toggle('active', item === active));
        railButtons.forEach((button, item) => button.classList.toggle('active', item === active));
        railButtons[active]?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
        schedule();
      }
      function setPlaying(next) {
        playing = next;
        toggle.textContent = playing ? '❚❚' : '▶';
        if (playing) schedule(); else { clearTimeout(timer); elapsed += performance.now() - startedAt; }
      }
      document.getElementById('start').addEventListener('click', () => { document.getElementById('intro').classList.add('hidden'); show(0); });
      document.getElementById('previous').addEventListener('click', () => show(active - 1));
      document.getElementById('next').addEventListener('click', () => show(active + 1));
      toggle.addEventListener('click', () => setPlaying(!playing));
      railButtons.forEach((button, index) => button.addEventListener('click', () => show(index)));
      document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') show(active - 1);
        if (event.key === 'ArrowRight') show(active + 1);
        if (event.key === ' ') { event.preventDefault(); setPlaying(!playing); }
        if (event.key === 'Escape') document.getElementById('intro').classList.add('hidden');
      });
      if (slides.length) show(0);
    })();
  </script>
</body>
</html>`;
  return { html, shotCount: normalizedScenes.length };
}

export function animatedStoryboardFileName(title = "storyboard") {
  const safe = String(title || "storyboard")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `${safe || "storyboard"}-animated.html`;
}

function normalizeScene(scene = {}, index = 0, reviewOverlayPlan = []) {
  const storyboard = scene.storyboardTag || scene.storyboard_tag || {};
  const camera = scene.cameraPlanSheetTag || scene.camera_plan_sheet_tag || {};
  const images = normalizeImages(scene);
  const shotNumber = Number(scene.shotNumber || scene.shot_number || storyboard.shotNumber || index + 1);
  const durationSeconds = clampNumber(
    scene.durationSeconds || scene.duration_seconds || timeDifference(scene.startTime, scene.endTime) || 4,
    2.5,
    8
  );
  const overlayPlan = firstObjectValue(
    scene.overlayPlan,
    scene.overlay_plan,
    storyboard.overlayPlan,
    storyboard.overlay_plan,
    reviewOverlayPlan.find((item) => Number(item?.shotNumber) === shotNumber)
  );
  return {
    shotNumber,
    title: firstText(scene.title, scene.shotTitle, storyboard.shotTitle, camera.shotTitle, `Shot ${shotNumber}`),
    timestamp: firstText(scene.timestamp, scene.time, timeLabel(scene.startTime, scene.endTime), `${durationSeconds}s`),
    visual: firstText(scene.visualDirection, scene.visual, scene.description, scene.action, storyboard.narrativeBeatSummary, storyboard.compositionSummary, storyboard.action),
    dialogue: stripEmoji(plainText(scene.dialogue || scene.primaryDialogue || storyboard.primaryDialogue || scene.vo || scene.voiceOver || scene.voiceover)),
    camera: joinText([
      firstText(scene.shotType, scene.shot_type, storyboard.shotType, camera.shotType),
      firstText(scene.cameraAngle, scene.camera_angle, storyboard.cameraAngle, camera.cameraAngle),
      firstText(scene.cameraMovement, scene.camera_movement, storyboard.cameraMovement, camera.cameraMovement),
    ], " · "),
    lighting: firstText(scene.lighting, storyboard.lightingAtmosphericDescription, scene.lightingBuildSheetTag?.cinematicIntent),
    durationMs: Math.round(durationSeconds * 1000),
    overlayPlan,
    ...images,
  };
}

function normalizeImages(scene = {}) {
  const shotPayload = firstObjectValue(scene.shotPayload, scene.shot_payload);
  const storyboardTag = firstObjectValue(scene.storyboardTag, scene.storyboard_tag);
  const allAssets = [
    ...(Array.isArray(scene.imageAssets) ? scene.imageAssets : []),
    ...(Array.isArray(scene.image_assets) ? scene.image_assets : []),
    ...(Array.isArray(scene.shotImages) ? scene.shotImages : []),
    ...(Array.isArray(scene.shot_images) ? scene.shot_images : []),
    ...(Array.isArray(scene.images) ? scene.images : []),
    ...(Array.isArray(scene.assets) ? scene.assets : []),
    ...(Array.isArray(shotPayload.imageAssets) ? shotPayload.imageAssets : []),
    ...(Array.isArray(shotPayload.shotImages) ? shotPayload.shotImages : []),
  ];
  const assetUrl = (terms) => {
    const asset = allAssets.find((item) => terms.some((term) => String(item?.imageKind || item?.image_kind || item?.assetType || item?.asset_type || "").toLowerCase().includes(term)));
    return firstText(asset?.signedUrl, asset?.publicUrl, asset?.assetUrl, asset?.url);
  };
  return {
    storyboardImageUrl: firstText(
      scene.storyboardImageUrl,
      scene.storyboard_image_url,
      scene.shotDesignImageUrl,
      shotPayload.storyboardImageUrl,
      storyboardTag.storyboardImageUrl,
      scene.imageUrl,
      scene.image_url,
      scene.signedUrl,
      assetUrl(["storyboard"])
    ),
    productionImageUrl: firstText(
      scene.productionImageUrl,
      scene.production_image_url,
      scene.generatedProductImageUrl,
      scene.generated_product_image_url,
      scene.imageAnchorUrl,
      scene.image_anchor_url,
      shotPayload.productionImageUrl,
      shotPayload.generatedProductImageUrl,
      storyboardTag.productionImageUrl,
      assetUrl(["production", "product", "anchor"])
    ),
    lightingImageUrl: firstText(
      scene.lightingImageUrl,
      scene.lighting_image_url,
      scene.lightImageUrl,
      scene.light_image_url,
      shotPayload.lightingImageUrl,
      storyboardTag.lightingImageUrl,
      assetUrl(["light"])
    ),
    cameraImageUrl: firstText(
      scene.cameraPlanImageUrl,
      scene.camera_plan_image_url,
      scene.dpImageUrl,
      scene.dp_image_url,
      scene.cameraImageUrl,
      scene.camera_image_url,
      shotPayload.cameraPlanImageUrl,
      storyboardTag.cameraPlanImageUrl,
      assetUrl(["camera", "dp"])
    ),
  };
}

function renderSlide(scene, index, productMode) {
  const storyboardUrl = scene.storyboardImageUrl || scene.cameraImageUrl || scene.lightingImageUrl;
  const productionUrl = scene.productionImageUrl;
  const hasDualFrames = Boolean(storyboardUrl && productionUrl && storyboardUrl !== productionUrl);
  const singleFrameUrl = productMode && productionUrl ? productionUrl : storyboardUrl || productionUrl;
  const motionClass = ["motion-push", "motion-left", "motion-right"][index % 3];
  const frames = hasDualFrames
    ? `<img class="frame frame-a" src="${escapeHtml(storyboardUrl)}" alt="${escapeHtml(scene.title)} storyboard frame" /><img class="frame frame-b" src="${escapeHtml(productionUrl)}" alt="${escapeHtml(scene.title)} product frame" />`
    : singleFrameUrl
      ? `<img class="frame" src="${escapeHtml(singleFrameUrl)}" alt="${escapeHtml(scene.title)}" />`
      : `<div class="fallback">Shot ${escapeHtml(scene.shotNumber)} visual pending</div>`;
  const frameLabel = hasDualFrames
    ? "Storyboard to product frame"
    : productionUrl && singleFrameUrl === productionUrl ? "Production frame" : "Storyboard frame";
  return `<article class="slide ${motionClass}${hasDualFrames ? " dual" : ""}${index === 0 ? " active" : ""}" data-duration="${scene.durationMs}" style="--scene-ms:${scene.durationMs}ms">
    <div class="visual">
      ${frames}
      <span class="frame-label">${frameLabel}</span>
      ${renderOverlay(scene.overlayPlan, scene.durationMs)}
      ${scene.dialogue ? `<div class="caption">${escapeHtml(scene.dialogue)}</div>` : ""}
    </div>
    <div class="detail">
      <span class="shot-no">Shot ${escapeHtml(scene.shotNumber)}</span>
      <h2>${escapeHtml(scene.title)}</h2>
      <div class="time">${escapeHtml(scene.timestamp)}</div>
      <p class="story">${escapeHtml(scene.visual || "Visual direction is being refined.")}</p>
      <div class="specs">
        ${renderSpec("Camera", scene.camera)}
        ${renderSpec("Lighting", scene.lighting)}
        ${renderSpec("Dialogue / VO", scene.dialogue || "No spoken line")}
        ${renderSpec("Text overlay", overlaySummary(scene.overlayPlan))}
      </div>
    </div>
  </article>`;
}

function renderOverlay(plan = {}, sceneDurationMs = 6000) {
  if (!plan || plan.enabled === false || !String(plan.text || "").trim()) return "";
  const position = String(plan.position || "lower safe zone").toLowerCase();
  const vertical = position.includes("top") ? "top" : position.includes("center") || position.includes("middle") ? "center" : "bottom";
  const horizontal = position.includes("left") ? "left" : position.includes("right") ? "right" : "middle";
  const entrance = String(plan.entrance || "slide up").toLowerCase();
  const motionClass = entrance.includes("zoom") ? "zoom" : entrance.includes("wipe") ? "wipe" : "slide-up";
  const fontFamily = String(plan.fontFamily || "Montserrat").replace(/[^A-Za-z0-9 _-]/g, "").trim() || "Montserrat";
  const fontWeight = clampNumber(plan.fontWeight || 800, 400, 950);
  const fontSize = clampNumber(plan.fontSizePx || 58, 24, 96);
  const entranceMs = clampNumber(plan.entranceDurationMs || 650, 200, 1800);
  const exitMs = clampNumber(plan.exitDurationMs || 450, 150, 1200);
  const delayMs = clampNumber(plan.delayMs || 250, 0, Math.max(0, sceneDurationMs - entranceMs));
  const color = /^#[0-9a-f]{3,8}$/i.test(String(plan.color || "")) ? plan.color : "#ffffff";
  return `<div class="overlay-copy ${vertical} ${horizontal} ${motionClass}" style="--overlay-font:'${escapeHtml(fontFamily)}';--overlay-weight:${fontWeight};--overlay-size:${fontSize}px;--overlay-in:${entranceMs}ms;--overlay-out:${exitMs}ms;--overlay-delay:${delayMs}ms;--overlay-color:${color}"><span>${escapeHtml(stripEmoji(plan.text))}</span></div>`;
}

function overlaySummary(plan = {}) {
  if (!plan || plan.enabled === false) return "No overlay; visual-only beat";
  return [
    stripEmoji(plan.text),
    plan.fontFamily,
    plan.entrance,
    plan.speed,
    plan.position,
  ].filter(Boolean).join(" / ");
}

function renderRailItem(scene, index) {
  const image = scene.productionImageUrl || scene.storyboardImageUrl || scene.cameraImageUrl || scene.lightingImageUrl;
  return `<button type="button" data-slide="${index}" class="${index === 0 ? "active" : ""}">
    <span class="thumb">${image ? `<img src="${escapeHtml(image)}" alt="" />` : escapeHtml(scene.shotNumber)}</span>
    <span><strong>${escapeHtml(scene.title)}</strong><span>Shot ${escapeHtml(scene.shotNumber)} · ${escapeHtml(scene.timestamp)}</span></span>
  </button>`;
}

function renderReviewCards(review = {}) {
  return [
    ["Storyboard direction", review.storyboardFeedback],
    ["Production frames", review.productionFramesFeedback],
    ["Dialogue direction", review.dialogueFeedback],
  ]
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `<div class="review"><span>${escapeHtml(label)}</span><p>${escapeHtml(trimText(value, 420))}</p></div>`)
    .join("");
}

function renderSpec(label, value) {
  return value ? `<div class="spec"><span>${escapeHtml(label)}</span><p>${escapeHtml(trimText(value, 300))}</p></div>` : "";
}

function plainText(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(plainText).filter(Boolean).join(" ");
  if (!value || typeof value !== "object") return "";
  const direct = firstText(value.text, value.line, value.words, value.dialogue, value.voiceOver, value.description, value.primaryDialogue);
  return direct || Object.values(value).map(plainText).filter(Boolean).join(" ");
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function firstObjectValue(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};
}

function stripEmoji(value) {
  return String(value || "")
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function joinText(values, separator) {
  return values.filter(Boolean).join(separator);
}

function timeDifference(start, end) {
  const startValue = Number.parseFloat(start);
  const endValue = Number.parseFloat(end);
  return Number.isFinite(startValue) && Number.isFinite(endValue) && endValue > startValue ? endValue - startValue : 0;
}

function timeLabel(start, end) {
  return start != null && end != null && start !== "" && end !== "" ? `${start}s–${end}s` : "";
}

function clampNumber(value, minimum, maximum) {
  const numeric = Number(value);
  return Math.min(maximum, Math.max(minimum, Number.isFinite(numeric) ? numeric : minimum));
}

function trimText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
