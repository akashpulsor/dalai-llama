// The film's spoken track, read off the shot list: what is said, by whom, and when.

/** What a shot says out loud. shot.voiceOver is the spoken line; scriptLine only counts for a
 * DIALOGUE shot, where it is the line itself -- for any other shot type it is visual direction
 * (same rule as DialogueBeatsEditor, which clones exactly this text). */
export function spokenLine(shot) {
  return (shot?.voiceOver || (shot?.shotType === "DIALOGUE" ? shot?.scriptLine : "") || "").trim();
}

/** "VOICE_OVER" (heard over the picture -- the narrator, or a line over any non-dialogue shot),
 * "DIALOGUE" (a character speaking on camera), or null when the shot is silent. */
export function speechKind(shot) {
  if (!spokenLine(shot)) return null;
  if (shot?.cast?.characterType === "NARRATOR") return "VOICE_OVER";
  return shot?.shotType === "DIALOGUE" ? "DIALOGUE" : "VOICE_OVER";
}

/** Who says it, when the shot knows: the cast character's name, or "Narrator". */
export function speakerName(shot) {
  if (shot?.cast?.characterType === "NARRATOR") return "Narrator";
  return shot?.cast?.characterName || null;
}

export function formatTime(seconds) {
  const whole = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

/** Sections follow the screenplay: consecutive shots of one scene form one section, titled from the
 * scene, timed from the shots' planned durations in order. Shots with no duration take no time and
 * are counted in {@code untimedShots}, so a gap in the plan is visible rather than hidden. */
export function buildVoiceTimeline(shots = [], scenes = []) {
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const ordered = [...shots].sort((a, b) => (a.shotNumber ?? 0) - (b.shotNumber ?? 0));
  const sections = [];
  let clock = 0;
  let untimedShots = 0;
  for (const shot of ordered) {
    const duration = Number(shot.durationSeconds) || 0;
    if (!duration) untimedShots += 1;
    const sceneId = shot.screenplaySceneId || null;
    let section = sections[sections.length - 1];
    if (!section || section.sceneId !== sceneId) {
      const scene = sceneId ? sceneById.get(sceneId) : null;
      section = {
        sceneId,
        number: sections.length + 1,
        title: sceneTitle(scene),
        start: clock,
        end: clock,
        lines: [],
        shots: [],
      };
      sections.push(section);
    }
    const kind = speechKind(shot);
    const entry = { shotId: shot.id, shotNumber: shot.shotNumber, start: clock, end: clock + duration, kind };
    section.shots.push(entry);
    if (kind) {
      section.lines.push({ ...entry, speaker: speakerName(shot), text: spokenLine(shot) });
    }
    clock += duration;
    section.end = clock;
  }
  const lines = sections.flatMap((section) => section.lines);
  return {
    sections,
    totalSeconds: clock,
    totalWords: lines.reduce((sum, line) => sum + wordCount(line.text), 0),
    voiceOverLines: lines.filter((line) => line.kind === "VOICE_OVER").length,
    dialogueLines: lines.filter((line) => line.kind === "DIALOGUE").length,
    untimedShots,
  };
}

function sceneTitle(scene) {
  if (!scene) return "Shots outside any scene";
  const text = (scene.slug || scene.summary || `Scene ${scene.sceneNumber}`).trim();
  return text.length > 70 ? `${text.slice(0, 67)}…` : text;
}
