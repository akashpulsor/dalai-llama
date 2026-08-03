// @ts-nocheck
import React from "react";
import { Aperture, Camera, ClipboardList, Lightbulb, Loader2, Sparkles, Type, Volume2 } from "lucide-react";

export default function ProductionPlanPanel({ plans = [], scenes = [], compact = false, isLoading = false }) {
  const normalizedPlans = normalizePlans(plans, scenes);
  const totalShots = normalizedPlans.length;
  const storyboardReady = normalizedPlans.filter((plan) => hasKeys(plan.storyboardTag)).length;
  const soundReady = normalizedPlans.filter((plan) => hasReadableValue(soundPlanValue(plan.storyboardTag, plan.sourceScene, plan))).length;
  const lightingReady = normalizedPlans.filter((plan) => hasKeys(plan.lightingBuildSheetTag)).length;
  const cameraReady = normalizedPlans.filter((plan) => hasKeys(plan.cameraPlanSheetTag)).length;

  return (
    <section className={`creator-panel ${compact ? "p-3" : "p-4"}`}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-purple-200">
            <ClipboardList size={15} />
            Production plan
          </div>
          <h3 className="mt-2 text-lg font-extrabold text-white">Shot planning by sections</h3>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-400">
            Storyboard, lighting, sound cues, and DP camera plans are generated as readable shot plans first. Render images only when a shot plan looks right.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center sm:min-w-[26rem]">
          <PlanMetric icon={Aperture} label="Storyboard" ready={storyboardReady} total={totalShots} />
          <PlanMetric icon={Volume2} label="Sound" ready={soundReady} total={totalShots} />
          <PlanMetric icon={Lightbulb} label="Lighting" ready={lightingReady} total={totalShots} />
          <PlanMetric icon={Camera} label="Camera" ready={cameraReady} total={totalShots} />
        </div>
      </div>

      {isLoading && totalShots > 0 && (
        <CreativePlanLoader compact label="Refreshing shot plans" detail="Syncing storyboard, lighting, sound, and camera sections from the backend." />
      )}

      {!totalShots ? (
        isLoading ? (
          <CreativePlanLoader label="Loading shot plans" detail="Building the shot-wise production sheet from saved backend data." />
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.025] p-5 text-sm font-semibold leading-6 text-slate-400">
            Generate shot plans after reviewing the screenplay. The text plan appears here before any storyboard, lighting, or DP image is rendered.
          </div>
        )
      ) : (
        <div className="space-y-4">
          {normalizedPlans.map((plan) => (
            <ShotPlanCard key={plan.planId || `shot-plan-${plan.shotNumber}`} plan={plan} />
          ))}
        </div>
      )}
    </section>
  );
}

function CreativePlanLoader({ label, detail, compact = false }) {
  return (
    <div className={`mb-4 overflow-hidden rounded-lg border border-purple-300/20 bg-purple-500/[0.08] ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-400/15 text-purple-100">
          <Loader2 size={18} className="animate-spin" />
          <Sparkles size={11} className="absolute -right-1 -top-1 text-amber-200" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{detail}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-300 via-emerald-200 to-amber-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanMetric({ icon: Icon, label, ready, total }) {
  const complete = total > 0 && ready === total;
  return (
    <div className={`rounded-lg border px-3 py-3 ${complete ? "border-emerald-300/20 bg-emerald-400/[0.07]" : "border-white/10 bg-white/[0.04]"}`}>
      <Icon size={16} className={`mx-auto ${complete ? "text-emerald-300" : "text-slate-400"}`} />
      <p className="mt-2 text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{ready}/{total || 0}</p>
    </div>
  );
}

function ShotPlanCard({ plan }) {
  const storyboard = plan.storyboardTag || {};
  const lighting = plan.lightingBuildSheetTag || {};
  const camera = plan.cameraPlanSheetTag || {};
  const primaryDialogue = storyboard.primaryDialogue || {};
  const cameraRig = camera.cameraRig || {};
  const movementSpec = camera.movementSpec || {};
  const gimbalSettings = camera.gimbalSettings || movementSpec.gimbalSettings || {};
  const framePreview = camera.framePreview || {};
  const keyLight = lighting.floorPlan?.keyLight || {};
  const gearCards = Array.isArray(lighting.gearCards) ? lighting.gearCards : [];
  const soundValue = soundPlanValue(storyboard, plan.sourceScene, plan);
  const blockingValue = firstValue(storyboard.blockingNotes, lighting.blockingNotes, camera.blockingMap, storyboard.action);
  const charactersValue = firstValue(storyboard.primaryCharacters, storyboard.characters, storyboard.characterVisualProfile);
  const wardrobeValue = firstValue(storyboard.wardrobeThisShot, storyboard.wardrobe, lighting.characterContinuityWardrobe);
  const propsValue = firstValue(storyboard.keyProps, storyboard.props, lighting.keyProps);
  const safetyValue = firstValue(storyboard.safetyFlags, lighting.safetyFlags, camera.safetyFlags);
  const overlayPlan = firstObject(
    storyboard.overlayPlan,
    storyboard.overlay_plan,
    plan.sourceScene?.overlayPlan,
    plan.sourceScene?.overlay_plan
  ) || {};
  const typography = firstObject(storyboard.typographySystem, storyboard.typography_system) || {};

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Shot {String(plan.shotNumber || 0).padStart(2, "0")}</p>
          <h4 className="mt-1 text-base font-extrabold leading-6 text-white">{toShortText(storyboard.shotTitle || lighting.shotTitle || camera.shotTitle || plan.title || "Production shot")}</h4>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {toShortText(storyboard.narrativeBeatSummary || storyboard.cinematicIntent || lighting.cinematicIntent || "Production details are grouped below for review.")}
          </p>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-purple-300/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-purple-100">
          {plan.styleKey || "indian_creator_pencil"}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <PlanSection
          icon={Aperture}
          title="Storyboard And Blocking"
          rows={[
            ["Focus", storyboard.targetFocalPoint || storyboard.compositionSummary],
            ["Beat", storyboard.narrativeBeatSummary],
            ["Blocking", blockingValue],
            ["Characters", charactersValue || firstCharacterName(storyboard)],
            ["Wardrobe", wardrobeValue],
            ["Set / Props", firstValue(storyboard.setDesign, propsValue)],
            ["Dialogue", primaryDialogue.line || primaryDialogue.lines || storyboard.dialogue || storyboard.primaryDialogue],
          ]}
        />
        <PlanSection
          icon={Lightbulb}
          title="Lighting Build Sheet"
          rows={[
            ["Intent", lighting.cinematicIntent],
            ["Atmosphere", firstValue(lighting.lightingAtmosphericDescription, storyboard.lightingAtmosphericDescription)],
            ["Key Light", keyLight.householdGearName || keyLight.professionalGearName || storyboard.keyLightSourceLabel],
            ["Mobile Setup", lighting.lightingMobile],
            ["Professional Setup", lighting.lightingProfessional],
            ["Gear", gearCards],
            ["Setup Time", lighting.estimatedSetupMinutes ? `${lighting.estimatedSetupMinutes} min` : ""],
          ]}
        />
        <PlanSection
          icon={Camera}
          title="Camera And Frame"
          rows={[
            ["Shot Type", firstValue(storyboard.shotTypeFullName, camera.shotTypeFullName, storyboard.shotType)],
            ["Body", cameraRig.cameraBody],
            ["Angle", firstValue(storyboard.cameraAngle, camera.cameraAngle)],
            ["Move", movementSpec.moveType || camera.cameraMovement],
            ["Gimbal", gimbalSummary(gimbalSettings, movementSpec)],
            ["Operator Cue", firstValue(movementSpec.operatorCue, gimbalSettings.rehearsalCue)],
            ["Lens", firstValue(storyboard.lensSuggestion, camera.lensSuggestion, cameraRig.lens)],
            ["Frame", firstValue(framePreview.subjectPlacement, framePreview.headroomNote, storyboard.frameNotes)],
            ["Composition", storyboard.compositionSummary],
          ]}
        />
        <PlanSection
          icon={Volume2}
          title="Sound, Captions, And Setup"
          rows={[
            ["Sound", soundValue],
            ["Caption Track", storyboard.captionTrack],
            ["Safety", safetyValue],
            ["Resources", firstValue(storyboard.resourceRequirements, lighting.resourceRequirements, camera.resourceRequirements)],
            ["Post Notes", firstValue(storyboard.postProductionNotes, lighting.postProductionNotes, camera.postProductionNotes)],
            ["Creator Guide", firstValue(storyboard.creatorSetupGuide, lighting.creatorSetupGuide, camera.directorNotes)],
          ]}
        />
        <PlanSection
          icon={Type}
          title="Text Overlay And Motion"
          rows={[
            ["Use Overlay", overlayPlan.enabled === false ? "No; visual-only beat" : overlayPlan.enabled ? "Yes" : ""],
            ["Copy", overlayPlan.text || storyboard.textOverlay],
            ["Font", firstValue(
              overlayPlan.fontFamily && `${overlayPlan.fontFamily} ${overlayPlan.fontWeight || ""}`,
              typography.primaryFont
            )],
            ["Entrance", firstValue(
              overlayPlan.entrance,
              overlayPlan.entranceDurationMs ? `${overlayPlan.entranceDurationMs} ms` : ""
            )],
            ["Speed", firstValue(overlayPlan.speed, overlayPlan.holdDurationMs ? `${overlayPlan.holdDurationMs} ms hold` : "")],
            ["Position", overlayPlan.position],
            ["Safe Zone", overlayPlan.safeZone],
            ["AI Rationale", overlayPlan.rationale],
          ]}
        />
      </div>

      <details className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-normal text-slate-400">View raw tags</summary>
        <pre className="custom-scrollbar mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] font-semibold leading-5 text-slate-300">
{JSON.stringify({
  storyboardTag: storyboard,
  lightingBuildSheetTag: lighting,
  cameraPlanSheetTag: camera,
}, null, 2)}
        </pre>
      </details>
    </article>
  );
}

function PlanSection({ icon: Icon, title, rows }) {
  const visibleRows = rows.filter(([, value]) => hasReadableValue(value));
  return (
    <section className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-500">
        <Icon size={13} />
        {title}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(visibleRows.length ? visibleRows : [["Status", "Pending"]]).map(([label, value]) => (
          <PlanRow key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}

function PlanRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-600">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-slate-200">{toReadableText(value) || "Pending"}</p>
    </div>
  );
}

function normalizePlans(plans, scenes) {
  const scenePlans = (Array.isArray(scenes) ? scenes : [])
    .filter((scene) => scene?.storyboardTag || scene?.lightingBuildSheetTag || scene?.cameraPlanSheetTag)
    .map((scene, index) => normalizePlanShape(scene, index, scene));
  const scenePlanByShot = new Map(scenePlans.map((plan) => [Number(plan.shotNumber), plan]));

  if (Array.isArray(plans) && plans.length) {
    return plans.map((plan, index) => {
      const normalized = normalizePlanShape(plan, index);
      const scenePlan = scenePlanByShot.get(Number(normalized.shotNumber)) || {};
      const sourceScene = scenePlan.sourceScene || {};
      return {
        ...normalized,
        sourceScene,
        storyboardTag: hasKeys(normalized.storyboardTag) ? normalized.storyboardTag : scenePlan.storyboardTag || {},
        lightingBuildSheetTag: hasKeys(normalized.lightingBuildSheetTag) ? normalized.lightingBuildSheetTag : scenePlan.lightingBuildSheetTag || {},
        cameraPlanSheetTag: hasKeys(normalized.cameraPlanSheetTag) ? normalized.cameraPlanSheetTag : scenePlan.cameraPlanSheetTag || {},
      };
    });
  }

  return scenePlans;
}

function normalizePlanShape(plan = {}, index = 0, sourceScene = null) {
  const storyboardTag = firstObject(
    plan.storyboardTag,
    plan.storyboard_tag,
    plan.storyboard,
    plan.storyboardPlan,
    plan.storyboard_plan,
    plan.tags?.storyboardTag,
    plan.tags?.storyboard
  ) || (looksLikeStoryboardTag(plan) ? plan : {});
  const lightingBuildSheetTag = firstObject(
    plan.lightingBuildSheetTag,
    plan.lighting_build_sheet_tag,
    plan.lightingTag,
    plan.lighting,
    plan.lightingPlan,
    plan.lightPlan,
    plan.tags?.lightingBuildSheetTag,
    plan.tags?.lighting
  ) || (looksLikeLightingTag(plan) ? plan : {});
  const cameraPlanSheetTag = firstObject(
    plan.cameraPlanSheetTag,
    plan.camera_plan_sheet_tag,
    plan.cameraPlanTag,
    plan.camera,
    plan.cameraPlan,
    plan.dpPlan,
    plan.tags?.cameraPlanSheetTag,
    plan.tags?.camera
  ) || (looksLikeCameraTag(plan) ? plan : {});

  return {
    planId: plan.planId || plan.id || plan.sceneId || `plan-${index}`,
    shotNumber: plan.shotNumber || storyboardTag.shotNumber || lightingBuildSheetTag.shotNumber || cameraPlanSheetTag.shotNumber || index + 1,
    title: plan.title || storyboardTag.shotTitle || lightingBuildSheetTag.shotTitle || cameraPlanSheetTag.shotTitle || "",
    styleKey: plan.styleKey || storyboardTag.styleKey || "indian_creator_pencil",
    sourceScene: sourceScene || plan.sourceScene || plan.scene || null,
    storyboardTag,
    lightingBuildSheetTag,
    cameraPlanSheetTag,
  };
}

function hasKeys(value) {
  return value && typeof value === "object" && Object.keys(value).length > 0;
}

function hasReadableValue(value) {
  return Boolean(toShortText(value));
}

function soundPlanValue(storyboard = {}, scene = {}, plan = {}) {
  const sceneStoryboard = scene?.storyboardTag || {};
  const ambient = firstValue(
    storyboard.ambientBedDescription,
    storyboard.ambient_bed_description,
    storyboard.ambientBed,
    storyboard.ambient_bed,
    sceneStoryboard.ambientBedDescription,
    sceneStoryboard.ambient_bed_description,
    scene.ambientBedDescription,
    scene.ambient_bed_description,
    plan.ambientBedDescription,
    plan.ambient_bed_description
  );
  const syncHit = firstValue(
    storyboard.syncHitDescription,
    storyboard.sync_hit_description,
    storyboard.syncHit,
    storyboard.sync_hit,
    sceneStoryboard.syncHitDescription,
    sceneStoryboard.sync_hit_description,
    scene.syncHitDescription,
    scene.sync_hit_description,
    plan.syncHitDescription,
    plan.sync_hit_description
  );
  if (ambient || syncHit) {
    return {
      ...(ambient ? { ambientBed: ambient } : {}),
      ...(syncHit ? { syncHit } : {}),
    };
  }
  return firstValue(
    storyboard.soundDesign,
    storyboard.sound_design,
    storyboard.soundCues,
    storyboard.sound_cues,
    storyboard.soundCue,
    storyboard.audioCues,
    storyboard.audio_cues,
    storyboard.foleyNotes,
    storyboard.foley_notes,
    storyboard.musicCue,
    storyboard.music_cue,
    storyboard.soundNote,
    storyboard.sound_note,
    sceneStoryboard.soundDesign,
    sceneStoryboard.sound_design,
    scene.soundDesign,
    scene.sound_design,
    scene.shotPayload?.soundDesign,
    scene.shot_payload?.soundDesign,
    plan.soundDesign,
    plan.sound_design
  );
}

function firstCharacterName(storyboard) {
  const characters = Array.isArray(storyboard.primaryCharacters) ? storyboard.primaryCharacters : [];
  return characters[0]?.storyCharacterName || characters[0]?.name || "";
}

function gimbalSummary(gimbal = {}, movement = {}) {
  const enabled = gimbal.enabled === true || movement.liveCameraMove === true;
  if (!enabled) return firstValue(gimbal.mode, movement.stabilizationTool);
  return [
    firstValue(gimbal.device, movement.stabilizationTool),
    firstValue(gimbal.mode, movement.moveType),
    gimbal.axisLock,
    gimbal.panSpeed !== undefined ? `pan ${gimbal.panSpeed}` : "",
    gimbal.tiltSpeed !== undefined ? `tilt ${gimbal.tiltSpeed}` : "",
    gimbal.horizonLock === true ? "horizon lock" : "",
  ].filter(Boolean).join(" - ");
}

function firstValue(...values) {
  return values.find(hasReadableValue) || "";
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || null;
}

function looksLikeStoryboardTag(value = {}) {
  return Boolean(
    value.shotTitle
    || value.narrativeBeatSummary
    || value.compositionSummary
    || value.primaryDialogue
    || value.targetFocalPoint
    || value.soundDesign
    || value.soundCues
    || value.ambientBedDescription
    || value.syncHitDescription
  );
}

function looksLikeLightingTag(value = {}) {
  return Boolean(value.cinematicIntent || value.floorPlan || value.gearCards || value.keyLight || value.estimatedSetupMinutes);
}

function looksLikeCameraTag(value = {}) {
  return Boolean(value.cameraRig || value.movementSpec || value.gimbalSettings || value.framePreview || value.blockingMap || value.lensSuggestion);
}

function toShortText(value) {
  return toText(value).split("\n").filter(Boolean).slice(0, 3).join("\n");
}

function toReadableText(value) {
  return toText(value).split("\n").filter(Boolean).slice(0, 7).join("\n");
}

function toText(value) {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${humanize(key)}: ${toText(item)}`)
      .filter((line) => !line.endsWith(": "))
      .join("\n");
  }
  return String(value);
}

function humanize(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
