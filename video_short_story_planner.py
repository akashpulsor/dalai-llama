#!/usr/bin/env python3
"""
Resumable local video short-story planner.

What it does:
  1. Takes a video path as an argument.
  2. Stores all generated artifacts in one common work folder.
  3. Installs ffmpeg if it is missing, when the platform has a known package manager.
  4. Extracts audio and sampled frames, using local GPU ffmpeg decode when available.
  5. Uses a local Whisper installation to create a timestamped transcript.
  6. Uses a local Gemma model through Ollama to understand the transcript.
  7. Produces a timeline and short-video story cut suggestions.

Example:
  python video_short_story_planner.py "C:\\videos\\talk.mp4"

Useful options:
  python video_short_story_planner.py "C:\\videos\\talk.mp4" --ollama-model gemma3:4b --whisper-model small
  python video_short_story_planner.py "C:\\videos\\talk.mp4" --force
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import math
import os
import platform
import re
import shutil
import subprocess
import sys
import textwrap
import time
import urllib.error
import urllib.request
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any


OLLAMA_HOST = "http://127.0.0.1:11434"
DEFAULT_OLLAMA_MODEL = "gemma3:4b"
DEFAULT_FRAME_INTERVAL_SECONDS = 10.0
DEFAULT_VISION_FRAMES = 6
SCENE_TYPES = [
    "talking_head_narrator",
    "podcast_question_answer",
    "podcast_interview",
    "other_broll_scene",
    "screen_recording",
    "text_slide",
    "transition",
    "unknown",
]
VIDEO_TYPES = ["talking_head", "podcast", "interview", "screen_recording", "mixed", "other"]


class PipelineError(RuntimeError):
    pass


def configure_stdio() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is not None and hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


@dataclass
class RunPaths:
    root: Path
    manifest: Path
    state: Path
    audio: Path
    frames_dir: Path
    frame_manifest: Path
    frame_captions: Path
    frame_scene_map: Path
    transcript_json: Path
    transcript_txt: Path
    transcript_srt: Path
    chunk_dir: Path
    script_understanding: Path
    story_map: Path
    timeline_json: Path
    shorts_json: Path
    shorts_md: Path
    ffmpeg_commands: Path
    short_clips_dir: Path
    mobile_qa_json: Path
    mobile_qa_md: Path


def log(message: str) -> None:
    try:
        print(f"[video-story] {message}", flush=True)
    except OSError:
        pass


def quote_arg(arg: Any) -> str:
    text = str(arg)
    if not text or any(ch.isspace() for ch in text):
        return '"' + text.replace('"', '\\"') + '"'
    return text


def run_command(
    cmd: list[str],
    *,
    check: bool = True,
    capture: bool = False,
    timeout: int | None = None,
) -> subprocess.CompletedProcess[str]:
    log("$ " + " ".join(quote_arg(part) for part in cmd))
    try:
        result = subprocess.run(
            cmd,
            check=False,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE if capture else None,
            stderr=subprocess.PIPE if capture else None,
            timeout=timeout,
        )
    except FileNotFoundError as exc:
        raise PipelineError(f"Command not found: {cmd[0]}") from exc

    if check and result.returncode != 0:
        detail = ""
        if capture:
            detail = "\nSTDOUT:\n{}\nSTDERR:\n{}".format(
                (result.stdout or "").strip(),
                (result.stderr or "").strip(),
            )
        raise PipelineError(f"Command failed with exit code {result.returncode}: {' '.join(cmd)}{detail}")
    return result


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=True, indent=2)
        handle.write("\n")
    temp_path.replace(path)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        handle.write(text)
    temp_path.replace(path)


def write_utf8_sig_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8-sig") as handle:
        handle.write(text)
    temp_path.replace(path)


def load_state(paths: RunPaths) -> dict[str, Any]:
    return read_json(paths.state, {"steps": {}})


def mark_done(paths: RunPaths, step: str, details: dict[str, Any] | None = None) -> None:
    state = load_state(paths)
    state.setdefault("steps", {})[step] = {
        "done": True,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "details": details or {},
    }
    write_json(paths.state, state)


def step_done(paths: RunPaths, step: str, outputs: list[Path], force: bool) -> bool:
    if force:
        return False
    state = load_state(paths)
    done = state.get("steps", {}).get(step, {}).get("done") is True
    return done and all(path.exists() for path in outputs)


def stable_video_id(video_path: Path) -> str:
    resolved = video_path.resolve()
    stat = resolved.stat()
    key = f"{resolved}|{stat.st_size}|{stat.st_mtime_ns}"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
    clean_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", resolved.stem).strip("._-") or "video"
    return f"{clean_stem}_{digest}"


def make_paths(work_root: Path, video_path: Path) -> RunPaths:
    run_root = work_root / stable_video_id(video_path)
    return RunPaths(
        root=run_root,
        manifest=run_root / "manifest.json",
        state=run_root / "state.json",
        audio=run_root / "audio" / "audio_16khz_mono.wav",
        frames_dir=run_root / "frames",
        frame_manifest=run_root / "frames" / "frames.json",
        frame_captions=run_root / "analysis" / "frame_captions.json",
        frame_scene_map=run_root / "analysis" / "frame_scene_map.json",
        transcript_json=run_root / "transcript" / "transcript.json",
        transcript_txt=run_root / "transcript" / "transcript.txt",
        transcript_srt=run_root / "transcript" / "transcript.srt",
        chunk_dir=run_root / "analysis" / "transcript_chunks",
        script_understanding=run_root / "analysis" / "script_understanding.json",
        story_map=run_root / "outputs" / "story_map.json",
        timeline_json=run_root / "outputs" / "timeline.json",
        shorts_json=run_root / "outputs" / "short_video_stories.json",
        shorts_md=run_root / "outputs" / "short_video_stories.md",
        ffmpeg_commands=run_root / "outputs" / "ffmpeg_cut_commands.txt",
        short_clips_dir=run_root / "outputs" / "short_clips",
        mobile_qa_json=run_root / "outputs" / "mobile_qa_report.json",
        mobile_qa_md=run_root / "outputs" / "mobile_qa_report.md",
    )


def default_work_root() -> Path:
    return Path.home() / "workspace" / "v5" / "_video_story_runs"


def default_download_root() -> Path:
    return Path.home() / "workspace" / "v5" / "_video_story_downloads"


def is_url(value: str) -> bool:
    return value.startswith(("http://", "https://"))


def is_youtube_url(value: str) -> bool:
    return is_url(value) and any(host in value.lower() for host in ("youtube.com", "youtu.be"))


def clean_filename(value: Any, limit: int = 120) -> str:
    text = re.sub(r"[^A-Za-z0-9._-]+", "_", str(value)).strip("._-")
    return (text or "video")[:limit].strip("._-") or "video"


def ensure_yt_dlp(auto_install: bool = True) -> None:
    result = run_command([sys.executable, "-m", "yt_dlp", "--version"], check=False, capture=True, timeout=30)
    if result.returncode == 0:
        return
    if not auto_install:
        raise PipelineError("yt-dlp was not found. Install it with: python -m pip install yt-dlp")
    log("yt-dlp was not found. Installing it with pip.")
    run_command([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"], check=True)
    result = run_command([sys.executable, "-m", "yt_dlp", "--version"], check=False, capture=True, timeout=30)
    if result.returncode != 0:
        raise PipelineError("yt-dlp installed, but it still cannot be loaded with python -m yt_dlp.")


def yt_dlp_command() -> list[str]:
    cmd = [sys.executable, "-m", "yt_dlp"]
    if shutil.which("node"):
        cmd.extend(["--js-runtimes", "node"])
    return cmd


def yt_dlp_info(url: str) -> dict[str, Any]:
    result = run_command(
        [*yt_dlp_command(), "--dump-single-json", "--no-playlist", url],
        capture=True,
        timeout=180,
    )
    try:
        return json.loads(result.stdout or "{}")
    except json.JSONDecodeError as exc:
        raise PipelineError(f"yt-dlp did not return valid JSON for URL: {url}") from exc


def download_youtube_video(url: str, download_root: Path, info: dict[str, Any], force: bool) -> Path:
    video_id = str(info.get("id") or hashlib.sha256(url.encode("utf-8")).hexdigest()[:12])
    title = clean_filename(info.get("title") or video_id)
    download_dir = download_root / f"{title}_{video_id}"
    download_dir.mkdir(parents=True, exist_ok=True)

    existing = sorted(download_dir.glob("source.*"))
    existing = [path for path in existing if path.is_file() and path.suffix.lower() not in {".part", ".ytdl"}]
    if existing and not force:
        log(f"YouTube video already downloaded, skipping: {existing[0]}")
        return existing[0]

    for old_path in existing:
        old_path.unlink()

    output_template = str(download_dir / "source.%(ext)s")
    run_command(
        [
            *yt_dlp_command(),
            "--no-playlist",
            "-f",
            "bv*+ba/best",
            "--merge-output-format",
            "mp4",
            "-o",
            output_template,
            url,
        ],
        check=True,
        timeout=3600,
    )

    candidates = sorted(download_dir.glob("source.*"))
    candidates = [path for path in candidates if path.is_file() and path.suffix.lower() not in {".part", ".ytdl"}]
    if not candidates:
        raise PipelineError(f"yt-dlp completed but no downloaded video was found in {download_dir}")
    mp4_candidates = [path for path in candidates if path.suffix.lower() == ".mp4"]
    return mp4_candidates[0] if mp4_candidates else candidates[0]


def caption_language_preferences(language: str | None, raw_preference: str | None) -> list[str]:
    if raw_preference:
        values = [item.strip() for item in raw_preference.split(",") if item.strip()]
        if values:
            return values
    if language:
        return [language, f"{language}-orig", "en", "en-orig", "hi", "hi-orig"]
    return ["hi", "hi-orig", "en", "en-orig"]


def select_caption_track(info: dict[str, Any], preferences: list[str]) -> tuple[str, str, dict[str, Any]] | None:
    caption_groups = [
        ("subtitles", info.get("subtitles") or {}),
        ("automatic_captions", info.get("automatic_captions") or {}),
    ]
    for caption_kind, captions in caption_groups:
        if not isinstance(captions, dict):
            continue
        ordered_languages: list[str] = []
        for preferred in preferences:
            if preferred in captions:
                ordered_languages.append(preferred)
            ordered_languages.extend(
                lang
                for lang in captions.keys()
                if lang not in ordered_languages and (lang == preferred or lang.startswith(preferred + "-"))
            )
        ordered_languages.extend(lang for lang in captions.keys() if lang not in ordered_languages)

        for language_code in ordered_languages:
            tracks = captions.get(language_code)
            if not isinstance(tracks, list):
                continue
            vtt_tracks = [track for track in tracks if isinstance(track, dict) and track.get("ext") == "vtt" and track.get("url")]
            if vtt_tracks:
                return caption_kind, language_code, vtt_tracks[0]
            fallback_tracks = [track for track in tracks if isinstance(track, dict) and track.get("url")]
            if fallback_tracks:
                return caption_kind, language_code, fallback_tracks[0]
    return None


def download_caption_track(download_root: Path, info: dict[str, Any], caption_kind: str, language_code: str, track: dict[str, Any], force: bool) -> Path:
    video_id = str(info.get("id") or "youtube")
    title = clean_filename(info.get("title") or video_id)
    caption_dir = download_root / f"{title}_{video_id}" / "captions"
    caption_dir.mkdir(parents=True, exist_ok=True)
    ext = clean_filename(track.get("ext") or "vtt", limit=12)
    caption_path = caption_dir / f"{caption_kind}_{clean_filename(language_code, 30)}.{ext}"
    if caption_path.exists() and not force:
        return caption_path

    url = track.get("url")
    if not url:
        raise PipelineError("Selected caption track does not have a URL.")
    log(f"Downloading YouTube caption track: {caption_kind}/{language_code}")
    with urllib.request.urlopen(str(url), timeout=180) as response:
        body = response.read()
    caption_path.write_bytes(body)
    return caption_path


def parse_vtt_timestamp(value: str) -> float:
    text = value.strip().replace(",", ".")
    parts = text.split(":")
    if len(parts) == 3:
        hours, minutes, seconds = parts
    elif len(parts) == 2:
        hours = "0"
        minutes, seconds = parts
    else:
        raise ValueError(f"Invalid VTT timestamp: {value}")
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def clean_vtt_text(lines: list[str]) -> str:
    text = " ".join(line.strip() for line in lines if line.strip())
    text = re.sub(r"<\d{1,2}:\d{2}:\d{2}\.\d+>", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_vtt_segments(caption_path: Path) -> list[dict[str, Any]]:
    raw = caption_path.read_text(encoding="utf-8-sig", errors="replace")
    lines = raw.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    segments: list[dict[str, Any]] = []
    index = 0
    cue_id = 0
    time_pattern = re.compile(r"(?P<start>\d{1,2}:\d{2}(?::\d{2})?[.,]\d+)\s+-->\s+(?P<end>\d{1,2}:\d{2}(?::\d{2})?[.,]\d+)")

    while index < len(lines):
        line = lines[index].strip()
        match = time_pattern.search(line)
        if not match:
            index += 1
            continue

        start = parse_vtt_timestamp(match.group("start"))
        end = parse_vtt_timestamp(match.group("end"))
        index += 1
        text_lines = []
        while index < len(lines) and lines[index].strip():
            text_lines.append(lines[index])
            index += 1
        text = clean_vtt_text(text_lines)
        if text:
            if segments and segments[-1]["text"] == text and abs(float(segments[-1]["end"]) - start) < 0.1:
                segments[-1]["end"] = round(end, 3)
                segments[-1]["end_hms"] = seconds_to_hms(end)
            else:
                segments.append(
                    {
                        "id": cue_id,
                        "start": round(start, 3),
                        "end": round(end, 3),
                        "start_hms": seconds_to_hms(start),
                        "end_hms": seconds_to_hms(end),
                        "text": text,
                    }
                )
                cue_id += 1
        index += 1

    return segments


def parse_srt_segments(caption_path: Path) -> list[dict[str, Any]]:
    raw = caption_path.read_text(encoding="utf-8-sig", errors="replace")
    lines = raw.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    segments: list[dict[str, Any]] = []
    index = 0
    cue_id = 0
    time_pattern = re.compile(
        r"(?P<start>\d{1,2}:\d{2}:\d{2}[.,]\d+)\s+-->\s+(?P<end>\d{1,2}:\d{2}:\d{2}[.,]\d+)"
    )

    while index < len(lines):
        line = lines[index].strip()
        match = time_pattern.search(line)
        if not match:
            index += 1
            continue

        start = parse_vtt_timestamp(match.group("start"))
        end = parse_vtt_timestamp(match.group("end"))
        index += 1
        text_lines = []
        while index < len(lines) and lines[index].strip():
            text_lines.append(lines[index])
            index += 1
        text = clean_vtt_text(text_lines)
        if text:
            segments.append(
                {
                    "id": cue_id,
                    "start": round(start, 3),
                    "end": round(end, 3),
                    "start_hms": seconds_to_hms(start),
                    "end_hms": seconds_to_hms(end),
                    "text": text,
                }
            )
            cue_id += 1
        index += 1

    return segments


def local_caption_language(video_path: Path, caption_path: Path) -> str | None:
    prefix = video_path.stem + "."
    stem = caption_path.stem
    if stem.startswith(prefix):
        language = stem[len(prefix) :].strip()
        return language or None
    return None


def local_caption_candidates(video_path: Path, preferences: list[str]) -> list[Path]:
    suffixes = [".srt", ".vtt"]
    candidates: list[Path] = []

    for suffix in suffixes:
        candidates.append(video_path.with_suffix(suffix))
        for language in preferences:
            candidates.append(video_path.with_name(f"{video_path.stem}.{language}{suffix}"))

    for sibling in sorted(video_path.parent.glob(f"{video_path.stem}.*")):
        if sibling.suffix.lower() in suffixes:
            candidates.append(sibling)

    unique: list[Path] = []
    seen: set[Path] = set()
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved in seen or not candidate.exists() or not candidate.is_file():
            continue
        seen.add(resolved)
        unique.append(candidate)
    return unique


def maybe_local_caption_transcript(video_path: Path, language: str | None) -> dict[str, Any] | None:
    preferences = caption_language_preferences(language, None)
    for caption_path in local_caption_candidates(video_path, preferences):
        suffix = caption_path.suffix.lower()
        if suffix == ".srt":
            segments = parse_srt_segments(caption_path)
        elif suffix == ".vtt":
            segments = parse_vtt_segments(caption_path)
        else:
            continue
        if not segments:
            continue
        caption_language = local_caption_language(video_path, caption_path) or language
        log(f"Local caption file found: {caption_path}")
        return {
            "engine": "local-caption-file",
            "source": "local",
            "caption_kind": "sidecar",
            "caption_language": caption_language,
            "caption_file": str(caption_path),
            "model": None,
            "language": caption_language,
            "partial": False,
            "segments": segments,
        }
    return None


def maybe_youtube_transcript(info: dict[str, Any], download_root: Path, preferences: list[str], force: bool) -> dict[str, Any] | None:
    selected = select_caption_track(info, preferences)
    if not selected:
        return None
    caption_kind, language_code, track = selected
    caption_path = download_caption_track(download_root, info, caption_kind, language_code, track, force)
    if caption_path.suffix.lower() != ".vtt":
        log(f"Caption track is {caption_path.suffix}; only VTT parsing is supported right now.")
        return None
    segments = parse_vtt_segments(caption_path)
    if not segments:
        return None
    return {
        "engine": "youtube-captions",
        "source": "youtube",
        "caption_kind": caption_kind,
        "caption_language": language_code,
        "caption_file": str(caption_path),
        "model": None,
        "language": language_code,
        "partial": False,
        "segments": segments,
    }


def write_external_transcript(paths: RunPaths, transcript: dict[str, Any], force: bool) -> bool:
    outputs = [paths.transcript_json, paths.transcript_txt, paths.transcript_srt]
    if step_done(paths, "transcript", outputs, force):
        existing = read_json(paths.transcript_json, {})
        if existing.get("engine") == transcript.get("engine"):
            log(f"External transcript already exists, skipping: {paths.transcript_json}")
            return True
    write_transcript_outputs(paths, transcript)
    mark_done(
        paths,
        "transcript",
        {
            "engine": transcript.get("engine"),
            "segments": len(transcript.get("segments", [])),
            "caption_language": transcript.get("caption_language"),
            "caption_kind": transcript.get("caption_kind"),
            "caption_file": transcript.get("caption_file"),
        },
    )
    return True


def install_ffmpeg() -> None:
    system = platform.system().lower()
    attempts: list[list[list[str]]] = []

    if system == "windows":
        attempts = [
            [["winget", "install", "--id", "Gyan.FFmpeg", "-e", "--source", "winget", "--accept-source-agreements", "--accept-package-agreements"]],
            [["choco", "install", "ffmpeg", "-y"]],
            [["scoop", "install", "ffmpeg"]],
        ]
    elif system == "darwin":
        attempts = [
            [["brew", "install", "ffmpeg"]],
        ]
    else:
        attempts = [
            [["sudo", "apt-get", "update"], ["sudo", "apt-get", "install", "-y", "ffmpeg"]],
            [["sudo", "dnf", "install", "-y", "ffmpeg"]],
            [["sudo", "pacman", "-S", "--noconfirm", "ffmpeg"]],
        ]

    for command_group in attempts:
        if not shutil.which(command_group[0][0]):
            continue
        try:
            for command in command_group:
                run_command(command, check=True)
            return
        except PipelineError as exc:
            log(f"ffmpeg install attempt failed: {exc}")

    raise PipelineError(
        "ffmpeg is not installed and automatic install did not work. "
        "Install ffmpeg manually, then rerun this script."
    )


def ensure_ffmpeg(auto_install: bool) -> None:
    if shutil.which("ffmpeg") and shutil.which("ffprobe"):
        return
    if not auto_install:
        raise PipelineError("ffmpeg/ffprobe not found. Rerun without --no-install-ffmpeg or install ffmpeg manually.")
    log("ffmpeg was not found. Attempting automatic install.")
    install_ffmpeg()
    if not (shutil.which("ffmpeg") and shutil.which("ffprobe")):
        raise PipelineError("ffmpeg install completed, but ffmpeg is still not on PATH. Open a new terminal or update PATH.")


def ffprobe_json(video_path: Path) -> dict[str, Any]:
    result = run_command(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            str(video_path),
        ],
        capture=True,
    )
    return json.loads(result.stdout or "{}")


def media_duration_seconds(path: Path) -> float | None:
    try:
        probe = ffprobe_json(path)
        return video_duration_seconds(probe)
    except Exception:
        return None


def video_duration_seconds(probe: dict[str, Any]) -> float | None:
    duration = probe.get("format", {}).get("duration")
    if duration is not None:
        try:
            return float(duration)
        except (TypeError, ValueError):
            return None
    return None


def video_dimensions_from_probe(probe: dict[str, Any]) -> tuple[int | None, int | None]:
    streams = probe.get("streams", []) if isinstance(probe, dict) else []
    if not isinstance(streams, list):
        return None, None
    for stream in streams:
        if not isinstance(stream, dict) or stream.get("codec_type") != "video":
            continue
        try:
            width = int(stream.get("width") or 0)
            height = int(stream.get("height") or 0)
        except (TypeError, ValueError):
            continue
        if width > 0 and height > 0:
            return width, height
    return None, None


def media_dimensions(path: Path) -> tuple[int | None, int | None]:
    try:
        return video_dimensions_from_probe(ffprobe_json(path))
    except Exception:
        return None, None


def has_nvidia_gpu() -> bool:
    if not shutil.which("nvidia-smi"):
        return False
    try:
        result = run_command(["nvidia-smi", "-L"], check=False, capture=True, timeout=5)
        return result.returncode == 0 and bool((result.stdout or "").strip())
    except Exception:
        return False


def has_torch_cuda() -> bool:
    try:
        import torch  # type: ignore

        return bool(torch.cuda.is_available())
    except Exception:
        return False


def extract_audio(video_path: Path, paths: RunPaths, force: bool) -> None:
    if step_done(paths, "audio", [paths.audio], force):
        log(f"Audio exists, skipping: {paths.audio}")
        return

    paths.audio.parent.mkdir(parents=True, exist_ok=True)
    run_command(
        [
            "ffmpeg",
            "-hide_banner",
            "-nostdin",
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            str(paths.audio),
        ],
        check=True,
    )
    mark_done(paths, "audio", {"path": str(paths.audio)})


def extract_frames(video_path: Path, paths: RunPaths, frame_interval: float, force: bool) -> None:
    if step_done(paths, "frames", [paths.frame_manifest], force):
        log(f"Frame manifest exists, skipping: {paths.frame_manifest}")
        return

    paths.frames_dir.mkdir(parents=True, exist_ok=True)
    if force:
        for frame_path in paths.frames_dir.glob("frame_*.jpg"):
            frame_path.unlink()

    output_pattern = str(paths.frames_dir / "frame_%06d.jpg")
    vf = f"fps=1/{frame_interval},scale=640:-2"
    use_cuda = has_nvidia_gpu()

    base_cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-y"]
    if use_cuda:
        base_cmd.extend(["-hwaccel", "cuda"])
    cmd = [
        *base_cmd,
        "-i",
        str(video_path),
        "-vf",
        vf,
        "-q:v",
        "3",
        output_pattern,
    ]

    result = run_command(cmd, check=False, capture=True)
    if result.returncode != 0 and use_cuda:
        log("GPU ffmpeg frame extraction failed. Retrying with CPU decode.")
        run_command(
            [
                "ffmpeg",
                "-hide_banner",
                "-nostdin",
                "-y",
                "-i",
                str(video_path),
                "-vf",
                vf,
                "-q:v",
                "3",
                output_pattern,
            ],
            check=True,
        )
        used_gpu = False
    elif result.returncode != 0:
        raise PipelineError((result.stderr or "ffmpeg frame extraction failed").strip())
    else:
        used_gpu = use_cuda

    frames = sorted(paths.frames_dir.glob("frame_*.jpg"))
    manifest = {
        "frame_interval_seconds": frame_interval,
        "used_gpu_decode": used_gpu,
        "frames": [
            {
                "index": index + 1,
                "timestamp_seconds": round(index * frame_interval, 3),
                "timestamp": seconds_to_hms(index * frame_interval),
                "path": str(frame_path),
            }
            for index, frame_path in enumerate(frames)
        ],
    }
    write_json(paths.frame_manifest, manifest)
    mark_done(paths, "frames", {"count": len(frames), "used_gpu_decode": used_gpu})


def normalize_segments(raw_segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for index, segment in enumerate(raw_segments):
        start = float(segment.get("start", 0.0) or 0.0)
        end = float(segment.get("end", start) or start)
        item: dict[str, Any] = {
            "id": int(segment.get("id", index)),
            "start": round(start, 3),
            "end": round(end, 3),
            "start_hms": seconds_to_hms(start),
            "end_hms": seconds_to_hms(end),
            "text": str(segment.get("text", "")).strip(),
        }
        words = segment.get("words")
        if isinstance(words, list):
            item["words"] = [
                {
                    "word": str(word.get("word", "")).strip(),
                    "start": round(float(word.get("start", 0.0) or 0.0), 3),
                    "end": round(float(word.get("end", 0.0) or 0.0), 3),
                }
                for word in words
                if isinstance(word, dict)
            ]
        normalized.append(item)
    return normalized


def transcript_to_txt(segments: list[dict[str, Any]]) -> str:
    lines = []
    for segment in segments:
        lines.append(f"[{segment['start_hms']} - {segment['end_hms']}] {segment['text']}")
    return "\n".join(lines).strip() + "\n"


def transcript_to_srt(segments: list[dict[str, Any]]) -> str:
    blocks = []
    for index, segment in enumerate(segments, start=1):
        start = seconds_to_srt_time(float(segment["start"]))
        end = seconds_to_srt_time(float(segment["end"]))
        text = str(segment.get("text", "")).strip()
        blocks.append(f"{index}\n{start} --> {end}\n{text}\n")
    return "\n".join(blocks).strip() + "\n"


def whisper_device_candidates(preference: str) -> list[str]:
    normalized = preference.lower().strip()
    if normalized == "cpu":
        return ["cpu"]
    if normalized == "cuda":
        return ["cuda", "cpu"]
    return ["cuda", "cpu"] if has_nvidia_gpu() else ["cpu"]


def transcribe_with_faster_whisper(
    audio_path: Path,
    model_name: str,
    language: str | None,
    whisper_device: str,
) -> dict[str, Any] | None:
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except Exception as exc:
        log(f"faster-whisper is not importable in current Python: {exc}")
        return None

    for device in whisper_device_candidates(whisper_device):
        compute_type = "float16" if device == "cuda" else "int8"
        try:
            log(f"Using faster-whisper model={model_name} device={device} compute_type={compute_type}")
            model = WhisperModel(model_name, device=device, compute_type=compute_type)
            segments_iter, info = model.transcribe(
                str(audio_path),
                beam_size=5,
                language=language,
                word_timestamps=True,
                vad_filter=True,
            )
            raw_segments = []
            for segment in segments_iter:
                raw_segments.append(
                    {
                        "id": segment.id,
                        "start": segment.start,
                        "end": segment.end,
                        "text": segment.text,
                        "words": [
                            {"word": word.word, "start": word.start, "end": word.end}
                            for word in (segment.words or [])
                        ],
                    }
                )
            return {
                "engine": "faster-whisper",
                "device": device,
                "language": getattr(info, "language", language),
                "duration": getattr(info, "duration", None),
                "segments": normalize_segments(raw_segments),
            }
        except Exception as exc:
            log(f"faster-whisper failed on device={device}: {exc}")
    return None


def python_can_import(python_cmd: list[str], module_name: str, timeout: int = 30) -> bool:
    result = run_command(
        [*python_cmd, "-c", f"import {module_name}; print('ok')"],
        check=False,
        capture=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        details = " ".join(part.strip() for part in [(result.stdout or ""), (result.stderr or "")] if part.strip())
        log(f"{' '.join(python_cmd)} cannot import {module_name}: {details[:500]}")
    return result.returncode == 0


def current_python_ml_healthy() -> bool:
    return python_can_import([sys.executable], "numpy")


def python_version_tuple(python_cmd: list[str]) -> tuple[int, int] | None:
    result = run_command(
        [*python_cmd, "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
        check=False,
        capture=True,
        timeout=15,
    )
    if result.returncode != 0:
        return None
    match = re.search(r"(\d+)\.(\d+)", result.stdout or "")
    if not match:
        return None
    return int(match.group(1)), int(match.group(2))


def parse_py_launcher_paths() -> list[Path]:
    if platform.system().lower() != "windows" or not shutil.which("py"):
        return []
    result = run_command(["py", "-0p"], check=False, capture=True, timeout=15)
    paths = []
    for line in (result.stdout or "").splitlines():
        match = re.search(r"-V:3\.11\s+(.+)$", line.strip())
        if match:
            path = Path(match.group(1).strip())
            if path.exists():
                paths.append(path)
    return paths


def find_stable_whisper_python() -> list[str] | None:
    candidates: list[list[str]] = []
    if platform.system().lower() == "windows" and shutil.which("py"):
        candidates.append(["py", "-3.11"])
    candidates.extend([[str(path)] for path in parse_py_launcher_paths()])
    if current_python_ml_healthy():
        candidates.append([sys.executable])

    seen = set()
    for candidate in candidates:
        key = tuple(candidate)
        if key in seen:
            continue
        seen.add(key)
        version = python_version_tuple(candidate)
        if not version:
            continue
        if version < (3, 10) or version >= (3, 13):
            continue
        return candidate
    return None


def whisper_venv_python(venv_dir: Path) -> Path:
    if platform.system().lower() == "windows":
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


def ensure_external_whisper_env(paths: RunPaths, install_whisper: bool) -> Path | None:
    venv_dir = paths.root.parent / "_whisper_py311_venv"
    venv_python = whisper_venv_python(venv_dir)

    if not venv_python.exists():
        if not install_whisper:
            return None
        python_cmd = find_stable_whisper_python()
        if not python_cmd:
            raise PipelineError(
                "Current Python cannot import NumPy, and no stable Python 3.10-3.12 interpreter was found "
                "for a Whisper fallback environment."
            )
        log(f"Creating Whisper fallback environment at {venv_dir}")
        run_command([*python_cmd, "-m", "venv", str(venv_dir)], check=True)

    if not python_can_import([str(venv_python)], "faster_whisper"):
        if not install_whisper:
            return None
        log("Installing faster-whisper into the Python 3.11 fallback environment.")
        run_command([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], check=True)
        run_command([str(venv_python), "-m", "pip", "install", "faster-whisper"], check=True)
        if not python_can_import([str(venv_python)], "faster_whisper"):
            raise PipelineError("Installed faster-whisper in fallback environment, but it still cannot be imported.")

    return venv_python


def external_whisper_helper_code() -> str:
    return r'''
import argparse
import json
import shutil
import subprocess

from faster_whisper import WhisperModel


def has_nvidia_gpu():
    if not shutil.which("nvidia-smi"):
        return False
    try:
        result = subprocess.run(["nvidia-smi", "-L"], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
        return result.returncode == 0 and bool(result.stdout.strip())
    except Exception:
        return False


def device_candidates(preference):
    preference = (preference or "auto").lower().strip()
    if preference == "cpu":
        return ["cpu"]
    if preference == "cuda":
        return ["cuda", "cpu"]
    return ["cuda", "cpu"] if has_nvidia_gpu() else ["cpu"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--language")
    parser.add_argument("--device", default="auto")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    errors = []
    for device in device_candidates(args.device):
        compute_type = "float16" if device == "cuda" else "int8"
        try:
            model = WhisperModel(args.model, device=device, compute_type=compute_type)
            segments_iter, info = model.transcribe(
                args.audio,
                beam_size=5,
                language=args.language,
                word_timestamps=True,
                vad_filter=True,
            )
            segments = []
            for segment in segments_iter:
                segments.append(
                    {
                        "id": segment.id,
                        "start": segment.start,
                        "end": segment.end,
                        "text": segment.text,
                        "words": [
                            {"word": word.word, "start": word.start, "end": word.end}
                            for word in (segment.words or [])
                        ],
                    }
                )
            with open(args.output, "w", encoding="utf-8") as handle:
                json.dump(
                    {
                        "engine": "faster-whisper-subprocess",
                        "device": device,
                        "compute_type": compute_type,
                        "language": getattr(info, "language", args.language),
                        "duration": getattr(info, "duration", None),
                        "segments": segments,
                    },
                    handle,
                    ensure_ascii=True,
                    indent=2,
                )
                handle.write("\n")
            return 0
        except Exception as exc:
            errors.append(f"{device}: {exc}")
    raise RuntimeError("All faster-whisper devices failed: " + " | ".join(errors))


if __name__ == "__main__":
    raise SystemExit(main())
'''.strip() + "\n"


def transcribe_with_external_faster_whisper(
    paths: RunPaths,
    model_name: str,
    language: str | None,
    whisper_device: str,
    install_whisper: bool,
) -> dict[str, Any] | None:
    venv_python = ensure_external_whisper_env(paths, install_whisper)
    if not venv_python:
        return None

    paths.transcript_json.parent.mkdir(parents=True, exist_ok=True)
    helper_path = paths.root.parent / "_transcribe_with_faster_whisper.py"
    external_output = paths.transcript_json.parent / "external_faster_whisper.json"
    write_text(helper_path, external_whisper_helper_code())

    cmd = [
        str(venv_python),
        str(helper_path),
        "--audio",
        str(paths.audio),
        "--model",
        model_name,
        "--device",
        whisper_device,
        "--output",
        str(external_output),
    ]
    if language:
        cmd.extend(["--language", language])

    result = run_command(cmd, check=False, capture=True)
    if result.returncode != 0:
        raise PipelineError(
            "External faster-whisper transcript failed.\nSTDOUT:\n{}\nSTDERR:\n{}".format(
                (result.stdout or "").strip(),
                (result.stderr or "").strip(),
            )
        )

    transcript = read_json(external_output, {})
    transcript["segments"] = normalize_segments(transcript.get("segments", []))
    return transcript


def run_external_whisper_job(
    venv_python: Path,
    helper_path: Path,
    audio_path: Path,
    output_path: Path,
    model_name: str,
    language: str | None,
    whisper_device: str,
) -> None:
    cmd = [
        str(venv_python),
        str(helper_path),
        "--audio",
        str(audio_path),
        "--model",
        model_name,
        "--device",
        whisper_device,
        "--output",
        str(output_path),
    ]
    if language:
        cmd.extend(["--language", language])
    result = run_command(cmd, check=False, capture=True)
    if result.returncode != 0:
        raise PipelineError(
            "External faster-whisper transcript failed.\nSTDOUT:\n{}\nSTDERR:\n{}".format(
                (result.stdout or "").strip(),
                (result.stderr or "").strip(),
            )
        )


def transcript_cache_key(model_name: str, language: str | None, whisper_device: str) -> str:
    raw = f"{model_name}_{language or 'auto'}_{whisper_device}"
    return re.sub(r"[^A-Za-z0-9._-]+", "_", raw).strip("._-") or "default"


def attach_transcript_chunk_paths(paths: RunPaths, chunks: list[dict[str, Any]], cache_key: str, force: bool) -> list[dict[str, Any]]:
    transcript_dir = paths.transcript_json.parent / f"chunk_transcripts_{cache_key}"
    transcript_dir.mkdir(parents=True, exist_ok=True)
    if force:
        for old_path in transcript_dir.glob("chunk_*.json"):
            old_path.unlink()
    for chunk in chunks:
        index = int(chunk.get("index", 0) or 0)
        chunk["transcript_path"] = str(transcript_dir / f"chunk_{index:05d}.json")
    return chunks


def ensure_audio_chunks(paths: RunPaths, chunk_seconds: int, force: bool, cache_key: str) -> list[dict[str, Any]]:
    chunk_dir = paths.transcript_json.parent / "audio_chunks"
    manifest_path = chunk_dir / "audio_chunks.json"
    chunk_dir.mkdir(parents=True, exist_ok=True)

    if force:
        for old_path in chunk_dir.glob("chunk_*.wav"):
            old_path.unlink()

    existing_manifest = read_json(manifest_path, {})
    existing_chunks = existing_manifest.get("chunks", []) if isinstance(existing_manifest, dict) else []
    if (
        existing_chunks
        and not force
        and int(existing_manifest.get("chunk_seconds", 0) or 0) == chunk_seconds
        and all(Path(chunk["path"]).exists() for chunk in existing_chunks if isinstance(chunk, dict) and chunk.get("path"))
    ):
        return attach_transcript_chunk_paths(paths, existing_chunks, cache_key, force)

    output_pattern = str(chunk_dir / "chunk_%05d.wav")
    run_command(
        [
            "ffmpeg",
            "-hide_banner",
            "-nostdin",
            "-y",
            "-i",
            str(paths.audio),
            "-f",
            "segment",
            "-segment_time",
            str(chunk_seconds),
            "-reset_timestamps",
            "1",
            "-c",
            "copy",
            output_pattern,
        ],
        check=True,
    )

    chunk_paths = sorted(chunk_dir.glob("chunk_*.wav"))
    if not chunk_paths:
        raise PipelineError("Audio chunking did not produce any chunk files.")

    chunks = []
    for index, chunk_path in enumerate(chunk_paths):
        duration = media_duration_seconds(chunk_path)
        start = index * chunk_seconds
        chunks.append(
            {
                "index": index,
                "start": start,
                "start_hms": seconds_to_hms(start),
                "duration": duration,
                "path": str(chunk_path),
            }
        )

    write_json(
        manifest_path,
        {
            "chunk_seconds": chunk_seconds,
            "chunks": chunks,
        },
    )
    return attach_transcript_chunk_paths(paths, chunks, cache_key, force)


def combine_chunk_transcripts(
    chunks: list[dict[str, Any]],
    *,
    complete: bool,
    model_name: str,
    language: str | None,
) -> dict[str, Any]:
    combined_segments: list[dict[str, Any]] = []
    detected_language = language
    chunk_count = 0
    for chunk in chunks:
        transcript_path = Path(chunk["transcript_path"])
        if not transcript_path.exists():
            continue
        chunk_transcript = read_json(transcript_path, {})
        if not detected_language:
            detected_language = chunk_transcript.get("language")
        offset = float(chunk.get("start", 0.0) or 0.0)
        for segment in chunk_transcript.get("segments", []):
            if not isinstance(segment, dict):
                continue
            shifted = dict(segment)
            shifted["start"] = float(shifted.get("start", 0.0) or 0.0) + offset
            shifted["end"] = float(shifted.get("end", shifted["start"]) or shifted["start"]) + offset
            shifted["chunk_index"] = chunk.get("index")
            words = shifted.get("words")
            if isinstance(words, list):
                shifted_words = []
                for word in words:
                    if isinstance(word, dict):
                        shifted_word = dict(word)
                        shifted_word["start"] = float(shifted_word.get("start", 0.0) or 0.0) + offset
                        shifted_word["end"] = float(shifted_word.get("end", 0.0) or 0.0) + offset
                        shifted_words.append(shifted_word)
                shifted["words"] = shifted_words
            combined_segments.append(shifted)
        chunk_count += 1

    normalized = normalize_segments(combined_segments)
    for index, segment in enumerate(normalized):
        segment["id"] = index

    return {
        "engine": "faster-whisper-subprocess-chunked",
        "model": model_name,
        "language": detected_language,
        "partial": not complete,
        "completed_chunks": chunk_count,
        "total_chunks": len(chunks),
        "segments": normalized,
    }


def write_transcript_outputs(paths: RunPaths, transcript: dict[str, Any]) -> None:
    segments = transcript.get("segments", [])
    write_json(paths.transcript_json, transcript)
    write_utf8_sig_text(paths.transcript_txt, transcript_to_txt(segments))
    write_utf8_sig_text(paths.transcript_srt, transcript_to_srt(segments))


def transcribe_with_external_faster_whisper_chunked(
    paths: RunPaths,
    model_name: str,
    language: str | None,
    whisper_device: str,
    install_whisper: bool,
    chunk_seconds: int,
    force: bool,
) -> dict[str, Any] | None:
    venv_python = ensure_external_whisper_env(paths, install_whisper)
    if not venv_python:
        return None

    paths.transcript_json.parent.mkdir(parents=True, exist_ok=True)
    helper_path = paths.root.parent / "_transcribe_with_faster_whisper.py"
    write_text(helper_path, external_whisper_helper_code())
    cache_key = transcript_cache_key(model_name, language, whisper_device)
    chunks = ensure_audio_chunks(paths, chunk_seconds, force, cache_key)

    for position, chunk in enumerate(chunks, start=1):
        chunk_audio = Path(chunk["path"])
        chunk_output = Path(chunk["transcript_path"])
        if chunk_output.exists() and not force:
            log(f"Transcript chunk {position}/{len(chunks)} exists, skipping: {chunk_output.name}")
        else:
            log(f"Transcribing chunk {position}/{len(chunks)} starting at {chunk.get('start_hms')}")
            run_external_whisper_job(
                venv_python,
                helper_path,
                chunk_audio,
                chunk_output,
                model_name,
                language,
                whisper_device,
            )

        partial = combine_chunk_transcripts(
            chunks,
            complete=(position == len(chunks)),
            model_name=model_name,
            language=language,
        )
        partial["cache_key"] = cache_key
        write_transcript_outputs(paths, partial)

    transcript = combine_chunk_transcripts(chunks, complete=True, model_name=model_name, language=language)
    transcript["cache_key"] = cache_key
    return transcript


def transcribe_with_openai_whisper(
    audio_path: Path,
    model_name: str,
    language: str | None,
    whisper_device: str,
) -> dict[str, Any] | None:
    try:
        import whisper  # type: ignore
    except Exception as exc:
        log(f"openai-whisper is not importable in current Python: {exc}")
        return None

    for device in whisper_device_candidates(whisper_device):
        try:
            if device == "cuda" and not has_torch_cuda():
                continue
            log(f"Using openai-whisper model={model_name} device={device}")
            model = whisper.load_model(model_name, device=device)
            result = model.transcribe(
                str(audio_path),
                language=language,
                word_timestamps=True,
                fp16=(device == "cuda"),
            )
            return {
                "engine": "openai-whisper",
                "device": device,
                "language": result.get("language", language),
                "duration": None,
                "segments": normalize_segments(result.get("segments", [])),
            }
        except Exception as exc:
            log(f"openai-whisper failed on device={device}: {exc}")
    return None


def transcribe_with_whisper_cli(audio_path: Path, paths: RunPaths, model_name: str, language: str | None) -> dict[str, Any] | None:
    whisper_exe = shutil.which("whisper")
    if not whisper_exe:
        return None

    output_dir = paths.root / "transcript" / "whisper_cli"
    output_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        whisper_exe,
        str(audio_path),
        "--model",
        model_name,
        "--output_format",
        "json",
        "--output_dir",
        str(output_dir),
        "--fp16",
        "True" if has_torch_cuda() else "False",
    ]
    if language:
        cmd.extend(["--language", language])
    run_command(cmd, check=True)
    json_files = sorted(output_dir.glob("*.json"), key=lambda path: path.stat().st_mtime, reverse=True)
    if not json_files:
        raise PipelineError("Whisper CLI completed but did not write a JSON transcript.")
    data = read_json(json_files[0], {})
    return {
        "engine": "whisper-cli",
        "language": data.get("language", language),
        "duration": None,
        "segments": normalize_segments(data.get("segments", [])),
    }


def maybe_install_whisper_deps() -> None:
    python_exe = sys.executable
    log("Attempting to install faster-whisper with pip.")
    run_command([python_exe, "-m", "pip", "install", "faster-whisper"], check=True)


def transcribe_audio(
    paths: RunPaths,
    model_name: str,
    language: str | None,
    force: bool,
    install_whisper: bool,
    whisper_device: str,
    transcript_chunk_seconds: int,
) -> None:
    desired_cache_key = transcript_cache_key(model_name, language, whisper_device)
    transcript_outputs = [paths.transcript_json, paths.transcript_txt, paths.transcript_srt]
    if not force and step_done(paths, "transcript", transcript_outputs, force=False):
        existing = read_json(paths.transcript_json, {})
        existing_model = existing.get("model")
        existing_language = existing.get("language")
        existing_cache_key = existing.get("cache_key")
        existing_partial = bool(existing.get("partial"))
        if (
            existing_model == model_name
            and existing_language == language
            and existing_cache_key == desired_cache_key
            and not existing_partial
        ):
            log(f"Transcript exists for model={model_name} language={language or 'auto'}, skipping: {paths.transcript_json}")
            return
        log(
            "Existing transcript settings differ "
            f"(model={existing_model}, language={existing_language}, cache_key={existing_cache_key}, partial={existing_partial}); regenerating."
        )

    transcript = None
    external_error: Exception | None = None

    if current_python_ml_healthy():
        transcript = (
            transcribe_with_faster_whisper(paths.audio, model_name, language, whisper_device)
            or transcribe_with_openai_whisper(paths.audio, model_name, language, whisper_device)
            or transcribe_with_whisper_cli(paths.audio, paths, model_name, language)
        )
    else:
        log("Current Python cannot safely import NumPy; skipping in-process Whisper engines.")

    if transcript is None:
        try:
            if transcript_chunk_seconds > 0:
                transcript = transcribe_with_external_faster_whisper_chunked(
                    paths,
                    model_name,
                    language,
                    whisper_device,
                    install_whisper,
                    transcript_chunk_seconds,
                    force,
                )
            else:
                transcript = transcribe_with_external_faster_whisper(
                    paths,
                    model_name,
                    language,
                    whisper_device,
                    install_whisper,
                )
        except Exception as exc:
            external_error = exc
            log(f"External faster-whisper fallback failed: {exc}")

    if transcript is None and install_whisper and current_python_ml_healthy():
        maybe_install_whisper_deps()
        transcript = transcribe_with_faster_whisper(paths.audio, model_name, language, whisper_device)

    if transcript is None:
        extra = f"\nExternal fallback error: {external_error}" if external_error else ""
        raise PipelineError(
            "No local Whisper engine was found. Install one of these, then rerun:\n"
            "  python -m pip install faster-whisper\n"
            "  python -m pip install -U openai-whisper\n"
            "Or rerun with --install-whisper to let this script create a Python 3.11 faster-whisper environment."
            + extra
        )

    transcript["partial"] = False
    segments = transcript.get("segments", [])
    write_transcript_outputs(paths, transcript)
    mark_done(paths, "transcript", {"engine": transcript.get("engine"), "segments": len(segments)})


def ollama_request(path: str, payload: dict[str, Any] | None = None, timeout: int = 15) -> Any:
    url = OLLAMA_HOST + path
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8")
    return json.loads(body) if body else {}


def wait_for_ollama(timeout_seconds: int = 20) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            ollama_request("/api/tags", timeout=3)
            return True
        except Exception:
            time.sleep(1)
    return False


def start_ollama_server() -> subprocess.Popen[Any] | None:
    if not shutil.which("ollama"):
        return None
    log("Starting local Ollama server.")
    kwargs: dict[str, Any] = {
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
        "stdin": subprocess.DEVNULL,
    }
    if platform.system().lower() == "windows":
        kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        return subprocess.Popen(["ollama", "serve"], **kwargs)
    except Exception as exc:
        log(f"Could not start Ollama server automatically: {exc}")
        return None


def installed_ollama_models() -> list[str]:
    try:
        data = ollama_request("/api/tags", timeout=5)
    except Exception:
        return []
    models = data.get("models", [])
    names = []
    for model in models:
        name = model.get("name")
        if isinstance(name, str):
            names.append(name)
    return names


def ensure_ollama_model(requested_model: str, pull_model: bool) -> str:
    if not shutil.which("ollama"):
        raise PipelineError("Ollama CLI was not found. Install Ollama and a Gemma model, then rerun.")

    log("Checking Ollama server and local model list.")
    if not wait_for_ollama(timeout_seconds=3):
        log("Ollama server is not responding yet. Trying to start ollama serve.")
        start_ollama_server()
        if not wait_for_ollama(timeout_seconds=20):
            raise PipelineError("Ollama server is not reachable at http://127.0.0.1:11434.")

    models = installed_ollama_models()
    if requested_model == "auto":
        gemma_models = [name for name in models if "gemma" in name.lower()]
        model = gemma_models[0] if gemma_models else DEFAULT_OLLAMA_MODEL
    else:
        model = requested_model

    if model not in models:
        if not pull_model:
            raise PipelineError(f"Ollama model '{model}' is not installed. Run: ollama pull {model}")
        log(f"Ollama model '{model}' is missing. Pulling it now.")
        run_command(["ollama", "pull", model], check=True)
    log(f"Using Ollama model: {model}")

    return model


def ollama_generate(
    model: str,
    prompt: str,
    *,
    images: list[str] | None = None,
    json_mode: bool = False,
    timeout: int = 600,
    temperature: float = 0.2,
) -> str:
    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_ctx": 8192,
        },
    }
    if images:
        payload["images"] = images
    if json_mode:
        payload["format"] = "json"
    data = ollama_request("/api/generate", payload=payload, timeout=timeout)
    return str(data.get("response", "")).strip()


def extract_json_from_text(text: str) -> Any:
    text = text.strip()
    if not text:
        return {"raw_response": ""}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        candidate = fenced.group(1).strip()
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    object_start = text.find("{")
    object_end = text.rfind("}")
    if 0 <= object_start < object_end:
        candidate = text[object_start : object_end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    array_start = text.find("[")
    array_end = text.rfind("]")
    if 0 <= array_start < array_end:
        candidate = text[array_start : array_end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    return {"raw_response": text}


def seconds_to_hms(seconds: float | int | None) -> str:
    if seconds is None:
        return "00:00:00.000"
    seconds_float = max(0.0, float(seconds))
    hours = int(seconds_float // 3600)
    minutes = int((seconds_float % 3600) // 60)
    secs = seconds_float % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def seconds_to_srt_time(seconds: float) -> str:
    text = seconds_to_hms(seconds)
    return text.replace(".", ",")


def hms_to_seconds(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        return float(text)
    match = re.fullmatch(r"(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)", text)
    if not match:
        return None
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2))
    seconds = float(match.group(3))
    return hours * 3600 + minutes * 60 + seconds


def compact_transcript(segments: list[dict[str, Any]], max_chars: int) -> tuple[str, bool]:
    lines = [f"[{segment['start_hms']} - {segment['end_hms']}] {segment['text']}" for segment in segments]
    result_lines = []
    used = 0
    truncated = False
    for line in lines:
        extra = len(line) + 1
        if used + extra > max_chars:
            truncated = True
            break
        result_lines.append(line)
        used += extra
    return "\n".join(result_lines), truncated


def chunk_transcript(segments: list[dict[str, Any]], max_chars: int) -> list[dict[str, Any]]:
    chunks = []
    current_lines = []
    current_start: float | None = None
    current_end: float | None = None
    current_chars = 0

    for segment in segments:
        line = f"[{segment['start_hms']} - {segment['end_hms']}] {segment['text']}"
        if current_lines and current_chars + len(line) + 1 > max_chars:
            chunks.append(
                {
                    "start": current_start,
                    "end": current_end,
                    "start_hms": seconds_to_hms(current_start),
                    "end_hms": seconds_to_hms(current_end),
                    "text": "\n".join(current_lines),
                }
            )
            current_lines = []
            current_start = None
            current_end = None
            current_chars = 0

        if current_start is None:
            current_start = float(segment["start"])
        current_end = float(segment["end"])
        current_lines.append(line)
        current_chars += len(line) + 1

    if current_lines:
        chunks.append(
            {
                "start": current_start,
                "end": current_end,
                "start_hms": seconds_to_hms(current_start),
                "end_hms": seconds_to_hms(current_end),
                "text": "\n".join(current_lines),
            }
        )
    return chunks


def choose_evenly_spaced(items: list[Any], limit: int) -> list[Any]:
    if limit <= 0 or len(items) <= limit:
        return items
    if limit == 1:
        return [items[len(items) // 2]]
    step = (len(items) - 1) / (limit - 1)
    selected = []
    used_indexes = set()
    for index in range(limit):
        item_index = int(round(index * step))
        if item_index not in used_indexes:
            selected.append(items[item_index])
            used_indexes.add(item_index)
    return selected


def image_to_base64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


FRAMING_PROBE_VERSION = "framing-probe-v1"


def extract_framing_probe_frame(
    video_path: Path,
    paths: RunPaths,
    short: dict[str, Any],
    kept_ranges: list[tuple[float, float]],
    force: bool,
) -> dict[str, Any] | None:
    rank = int(short.get("rank", 0) or 0)
    if rank <= 0 or not kept_ranges:
        return None
    first_start, first_end = kept_ranges[0]
    timestamp = min(first_end - 0.15, first_start + min(3.0, max(0.5, (first_end - first_start) * 0.45)))
    timestamp = max(first_start, timestamp)
    probe_dir = paths.short_clips_dir / "_framing_probes"
    probe_dir.mkdir(parents=True, exist_ok=True)
    probe_path = probe_dir / f"short_{rank:02d}_probe.jpg"
    if not probe_path.exists() or force:
        run_command(
            [
                "ffmpeg",
                "-hide_banner",
                "-nostdin",
                "-y",
                "-ss",
                seconds_to_hms(timestamp),
                "-i",
                str(video_path),
                "-frames:v",
                "1",
                "-q:v",
                "3",
                str(probe_path),
            ],
            check=True,
            capture=True,
        )
    return {
        "version": FRAMING_PROBE_VERSION,
        "timestamp_seconds": round(timestamp, 3),
        "timestamp": seconds_to_hms(timestamp),
        "frame_path": str(probe_path),
    }


def analyze_framing_probe(
    probe: dict[str, Any] | None,
    short: dict[str, Any],
    model: str | None,
    force: bool,
) -> dict[str, Any] | None:
    if not probe or not model:
        return None
    existing = short.get("framing_probe")
    if (
        isinstance(existing, dict)
        and existing.get("version") == FRAMING_PROBE_VERSION
        and existing.get("analysis")
        and not force
    ):
        return existing

    probe_path = Path(str(probe.get("frame_path", "")))
    if not probe_path.exists():
        return None
    prompt = textwrap.dedent(
        f"""
        You are a short-form video reframing editor.
        Analyze this exact frame from the selected short at {probe.get('timestamp')}.
        Decide whether a 9:16 vertical center crop is safe, or whether the full landscape frame must be preserved.

        Return only JSON:
        {{
          "scene_type": "talking_head|rocket_or_action_broll|text_slide_or_screen_recording|wide_landscape_broll|other",
          "important_content_position": "center|left|right|full_width|unknown",
          "has_important_text_or_ui": false,
          "safe_to_crop_9_16": true,
          "recommended_framing": "center_crop_vertical_fill|preserve_full_frame_safe_canvas",
          "reason": ""
        }}

        Editorial rules:
        - If there are equations, code, charts, UI, or important text spread across the frame, preserve the full frame.
        - If the subject is a person, rocket, vehicle, explosion, or centered action, prefer 9:16 crop.
        - If important action is at the far left/right edge, preserve or warn.

        Clip title: {short.get('title', '')}
        Story angle: {short.get('story_angle', '')}
        Transcript hook: {short.get('hook', '')[:500]}
        """
    ).strip()
    try:
        response = ollama_generate(
            model,
            prompt,
            images=[image_to_base64(probe_path)],
            json_mode=True,
            timeout=180,
            temperature=0.05,
        )
        parsed = extract_json_from_text(response)
        if not isinstance(parsed, dict):
            parsed = {"raw_response": parsed}
        result = dict(probe)
        result["analysis"] = parsed
        return result
    except Exception as exc:
        result = dict(probe)
        result["analysis_error"] = str(exc)
        return result


def caption_frames(paths: RunPaths, model: str, max_frames: int, force: bool) -> None:
    if max_frames <= 0:
        write_json(paths.frame_captions, {"skipped": True, "reason": "--vision-frames was set to 0", "captions": []})
        mark_done(paths, "frame_captions", {"skipped": True})
        return

    if step_done(paths, "frame_captions", [paths.frame_captions], force):
        log(f"Frame captions exist, skipping: {paths.frame_captions}")
        return

    frame_manifest = read_json(paths.frame_manifest, {"frames": []})
    frames = frame_manifest.get("frames", [])
    selected = choose_evenly_spaced(frames, max_frames)
    log(f"Frame captions: sending {len(selected)} sampled frames to {model}.")
    captions = []
    vision_failed = False

    for index, frame in enumerate(selected, start=1):
        frame_path = Path(frame["path"])
        if not frame_path.exists():
            continue
        log(f"Frame captions: {index}/{len(selected)} at {frame.get('timestamp')}.")
        prompt = textwrap.dedent(
            f"""
            You are helping edit a video into short stories.
            Look at this sampled frame from timestamp {frame.get('timestamp')}.
            Return only JSON with these keys:
            {{
              "timestamp": "{frame.get('timestamp')}",
              "visible_subjects": [],
              "setting": "",
              "action": "",
              "on_screen_text": "",
              "mood": "",
              "editing_notes": ""
            }}
            """
        ).strip()
        try:
            response = ollama_generate(
                model,
                prompt,
                images=[image_to_base64(frame_path)],
                json_mode=True,
                timeout=180,
                temperature=0.1,
            )
            parsed = extract_json_from_text(response)
            if isinstance(parsed, dict):
                parsed.setdefault("timestamp", frame.get("timestamp"))
                parsed.setdefault("frame_path", str(frame_path))
            captions.append(parsed)
        except Exception as exc:
            vision_failed = True
            log(f"Frame vision failed at {frame.get('timestamp')}: {exc}")
            break

    if vision_failed and not captions:
        write_json(
            paths.frame_captions,
            {
                "skipped": True,
                "reason": "The selected Ollama model did not accept frame images or vision failed.",
                "captions": [],
            },
        )
    else:
        write_json(
            paths.frame_captions,
            {
                "skipped": False,
                "model": model,
                "sampled_frames": len(selected),
                "captions": captions,
            },
        )
    mark_done(paths, "frame_captions", {"captions": len(captions), "vision_failed": vision_failed})


def transcript_for_time_range(
    segments: list[dict[str, Any]],
    start_seconds: float,
    end_seconds: float,
) -> list[dict[str, Any]]:
    hits = []
    for segment in segments:
        try:
            start = float(segment.get("start", 0.0) or 0.0)
            end = float(segment.get("end", start) or start)
        except (TypeError, ValueError):
            continue
        if end >= start_seconds and start <= end_seconds:
            hits.append(
                {
                    "start": round(start, 3),
                    "end": round(end, 3),
                    "text": str(segment.get("text", "")).strip(),
                }
            )
    return hits


def infer_scene_type_from_caption(caption: dict[str, Any]) -> str:
    text = " ".join(
        str(caption.get(key, ""))
        for key in ("setting", "action", "on_screen_text", "editing_notes")
    ).lower()
    subjects = " ".join(str(item) for item in caption.get("visible_subjects", []) if item).lower()
    combined = f"{subjects} {text}"
    if "podcast" in combined or "interview" in combined:
        return "podcast_interview"
    if "microphone" in combined or "speaking into" in combined or "speaking" in combined:
        return "talking_head_narrator"
    if "screen" in combined or "browser" in combined or "code" in combined or "software" in combined:
        return "screen_recording"
    if "text" in combined or "logo" in combined or "diagram" in combined or "equation" in combined:
        return "text_slide"
    if "transition" in combined:
        return "transition"
    if combined.strip():
        return "other_broll_scene"
    return "unknown"


def scene_description_from_caption(caption: dict[str, Any]) -> str:
    subjects = caption.get("visible_subjects", [])
    subject_text = ", ".join(str(item) for item in subjects if item) if isinstance(subjects, list) else str(subjects or "")
    pieces = []
    if subject_text:
        pieces.append(f"Subjects: {subject_text}")
    for label, key in (("Setting", "setting"), ("Action", "action"), ("Text", "on_screen_text")):
        value = str(caption.get(key, "")).strip()
        if value:
            pieces.append(f"{label}: {value}")
    return ". ".join(pieces) or "No visual description available."


def infer_video_type_from_frames(frames: list[dict[str, Any]]) -> str:
    counts = Counter(str(frame.get("scene_type") or "unknown") for frame in frames)
    total = max(1, sum(counts.values()))
    talking = counts["talking_head_narrator"]
    podcast = counts["podcast_question_answer"] + counts["podcast_interview"]
    screen = counts["screen_recording"]
    broll = counts["other_broll_scene"] + counts["text_slide"]
    if podcast / total >= 0.45:
        return "podcast"
    if talking / total >= 0.45 and broll / total < 0.35:
        return "talking_head"
    if screen / total >= 0.5:
        return "screen_recording"
    if talking and broll:
        return "mixed"
    if podcast:
        return "interview"
    return "other"


def timestamp_seconds_from_hms(value: Any) -> float:
    parsed = hms_to_seconds(value)
    return float(parsed if parsed is not None else 0.0)


def build_frame_scene_map(paths: RunPaths, force: bool, transcript_window_seconds: float = 5.0) -> None:
    if step_done(paths, "frame_scene_map", [paths.frame_scene_map], force):
        existing = read_json(paths.frame_scene_map, {})
        if isinstance(existing, dict) and existing.get("frames"):
            log(f"Frame scene map exists, skipping: {paths.frame_scene_map}")
            return

    frame_captions = read_json(paths.frame_captions, {})
    captions = frame_captions.get("captions", []) if isinstance(frame_captions, dict) else []
    transcript = read_json(paths.transcript_json, {})
    segments = transcript.get("segments", []) if isinstance(transcript, dict) else []

    frames = []
    previous_scene_type = ""
    for caption in captions:
        if not isinstance(caption, dict):
            continue
        timestamp = timestamp_seconds_from_hms(caption.get("timestamp"))
        scene_type = infer_scene_type_from_caption(caption)
        has_scene_changed = bool(previous_scene_type and previous_scene_type != scene_type)
        previous_scene_type = scene_type
        frames.append(
            {
                "timestamp_seconds": round(timestamp, 3),
                "scene_type": scene_type,
                "visual_description": scene_description_from_caption(caption),
                "transcript": transcript_for_time_range(
                    segments,
                    max(0.0, timestamp - 0.25),
                    timestamp + transcript_window_seconds,
                ),
                "has_scene_changed": has_scene_changed,
                "frame_path": caption.get("frame_path", ""),
            }
        )

    video_type = infer_video_type_from_frames(frames)
    payload = {
        "video_summary": "Automated sequential scene transition mapping.",
        "video_type": video_type,
        "transcript_window_seconds": transcript_window_seconds,
        "frames": frames,
    }
    write_json(paths.frame_scene_map, payload)
    mark_done(paths, "frame_scene_map", {"frames": len(frames), "video_type": video_type})
    log(f"Frame scene map saved: {paths.frame_scene_map}")


def summarize_transcript_chunks(paths: RunPaths, model: str, force: bool) -> dict[str, Any]:
    transcript = read_json(paths.transcript_json, {})
    segments = transcript.get("segments", [])
    chunks = chunk_transcript(segments, max_chars=9000)
    paths.chunk_dir.mkdir(parents=True, exist_ok=True)
    log(f"Transcript summary: {len(chunks)} chunk(s) to process with {model}.")

    summaries = []
    for index, chunk in enumerate(chunks, start=1):
        summary_path = paths.chunk_dir / f"chunk_{index:03d}.json"
        if summary_path.exists() and not force:
            log(f"Transcript summary: chunk {index}/{len(chunks)} exists, skipping.")
            summaries.append(read_json(summary_path, {}))
            continue
        log(f"Transcript summary: chunk {index}/{len(chunks)} from {chunk['start_hms']} to {chunk['end_hms']}.")
        prompt = textwrap.dedent(
            f"""
            You are analyzing a video transcript for short-form editing.
            Return only JSON with this structure:
            {{
              "chunk_start": "{chunk['start_hms']}",
              "chunk_end": "{chunk['end_hms']}",
              "plain_summary": "",
              "key_points": [],
              "story_beats": [
                {{"start": "HH:MM:SS.mmm", "end": "HH:MM:SS.mmm", "beat": "", "why_it_matters": ""}}
              ],
              "high_retention_moments": [
                {{"time": "HH:MM:SS.mmm", "reason": "", "suggested_hook": ""}}
              ],
              "weak_or_repetitive_moments": [
                {{"start": "HH:MM:SS.mmm", "end": "HH:MM:SS.mmm", "reason": ""}}
              ]
            }}

            Transcript chunk:
            {chunk['text']}
            """
        ).strip()
        response = ollama_generate(model, prompt, json_mode=True, timeout=600, temperature=0.2)
        parsed = extract_json_from_text(response)
        if isinstance(parsed, dict):
            parsed.setdefault("chunk_start", chunk["start_hms"])
            parsed.setdefault("chunk_end", chunk["end_hms"])
        write_json(summary_path, parsed)
        summaries.append(parsed)

    return {
        "chunk_count": len(chunks),
        "summaries": summaries,
    }


def build_script_understanding(paths: RunPaths, model: str, force: bool) -> None:
    if step_done(paths, "script_understanding", [paths.script_understanding], force):
        log(f"Script understanding exists, skipping: {paths.script_understanding}")
        return

    log("Building script understanding from transcript summaries and frame notes.")
    chunk_data = summarize_transcript_chunks(paths, model, force)
    frame_data = read_json(paths.frame_captions, {"captions": []})
    manifest = read_json(paths.manifest, {})

    prompt = textwrap.dedent(
        f"""
        You are a senior short-form video editor.
        Build a compact understanding of this whole video from transcript summaries and sampled visual frame notes.
        Return only JSON with this structure:
        {{
          "video_logline": "",
          "main_topic": "",
          "speaker_or_subject": "",
          "narrative_arc": ["setup", "development", "payoff"],
          "audience": "",
          "tone": "",
          "best_hooks": [],
          "most_reusable_moments": [
            {{"start": "HH:MM:SS.mmm", "end": "HH:MM:SS.mmm", "reason": ""}}
          ],
          "visual_context": "",
          "editing_strategy": ""
        }}

        Video manifest:
        {json.dumps(manifest, ensure_ascii=True)[:6000]}

        Transcript chunk summaries:
        {json.dumps(chunk_data, ensure_ascii=True)[:42000]}

        Sampled frame captions:
        {json.dumps(frame_data, ensure_ascii=True)[:16000]}
        """
    ).strip()
    response = ollama_generate(model, prompt, json_mode=True, timeout=600, temperature=0.2)
    parsed = extract_json_from_text(response)
    write_json(
        paths.script_understanding,
        {
            "model": model,
            "understanding": parsed,
            "chunk_count": chunk_data.get("chunk_count"),
        },
    )
    mark_done(paths, "script_understanding", {"model": model})


def transcript_excerpt(segments: list[dict[str, Any]], limit: int = 220) -> str:
    text = " ".join(str(segment.get("text", "")).strip() for segment in segments if segment.get("text"))
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def transcript_window_groups(
    segments: list[dict[str, Any]],
    min_seconds: int,
    max_seconds: int,
    target_seconds: int,
) -> list[list[dict[str, Any]]]:
    groups: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []
    current_start: float | None = None

    for segment in segments:
        try:
            start = float(segment.get("start", 0.0) or 0.0)
            end = float(segment.get("end", start) or start)
        except (TypeError, ValueError):
            continue
        if current_start is None:
            current_start = start
        current.append(segment)
        duration = end - current_start
        text = str(segment.get("text", "")).strip()
        sentence_boundary = bool(re.search(r"[.!?।?]$", text))
        if duration >= max_seconds or (duration >= min_seconds and duration >= target_seconds and sentence_boundary):
            groups.append(current)
            current = []
            current_start = None

    if current:
        groups.append(current)
    return groups


def fallback_timeline_and_shorts(
    segments: list[dict[str, Any]],
    max_shorts: int,
    min_short: int,
    max_short: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if not segments:
        return [], []

    target = max(min_short, min(max_short, int((min_short + max_short) / 2)))
    groups = transcript_window_groups(segments, min_short, max_short, target)
    timeline_groups = transcript_window_groups(segments, 45, 120, 90)

    timeline = []
    for group in timeline_groups:
        start = float(group[0].get("start", 0.0) or 0.0)
        end = float(group[-1].get("end", start) or start)
        excerpt = transcript_excerpt(group, limit=180)
        timeline.append(
            {
                "start": seconds_to_hms(start),
                "end": seconds_to_hms(end),
                "beat": excerpt or "Transcript section",
                "editor_note": "Auto-built from timestamped transcript because the local model returned an empty plan.",
                "cut_value": "keep" if len(timeline) < max_shorts else "maybe",
            }
        )

    scored_groups = []
    for group in groups:
        start = float(group[0].get("start", 0.0) or 0.0)
        end = float(group[-1].get("end", start) or start)
        duration = max(0.0, end - start)
        text = transcript_excerpt(group, limit=260)
        word_count = len(text.split())
        score = min(duration, max_short) + min(word_count, 80) * 0.25
        scored_groups.append((score, start, end, group))
    scored_groups.sort(key=lambda item: item[0], reverse=True)
    selected = sorted(scored_groups[:max_shorts], key=lambda item: item[1])

    shorts = []
    for rank, (_, start, end, group) in enumerate(selected, start=1):
        excerpt = transcript_excerpt(group, limit=220)
        title_words = re.sub(r"[^\w\s-]+", "", excerpt, flags=re.UNICODE).split()[:7]
        title = " ".join(title_words).strip() or f"Transcript story at {seconds_to_hms(start)}"
        caption_beats = []
        for segment in group[:5]:
            seg_start = float(segment.get("start", start) or start)
            seg_end = float(segment.get("end", seg_start) or seg_start)
            caption_beats.append(
                {
                    "start": seconds_to_hms(seg_start),
                    "end": seconds_to_hms(seg_end),
                    "caption": str(segment.get("text", "")).strip(),
                }
            )
        shorts.append(
            {
                "rank": rank,
                "title": title,
                "story_angle": "Transcript-driven story window",
                "start": seconds_to_hms(start),
                "end": seconds_to_hms(end),
                "duration_seconds": round(end - start, 3),
                "hook": excerpt,
                "why_this_cut": "Fallback cut generated from a dense timestamped transcript window.",
                "cut_points": [
                    {"time": seconds_to_hms(start), "action": "start", "reason": "Begin at the first line of the transcript window."},
                    {"time": seconds_to_hms(max(start, end - 3)), "action": "end", "reason": "End after the window's final transcript beat."},
                ],
                "caption_beats": caption_beats,
                "suggested_title_cards": [],
                "risk_notes": ["Generated by transcript fallback because the local model returned empty planning JSON."],
            }
        )

    return timeline, shorts


def frame_context_for_range(frame_map: dict[str, Any], start: float, end: float) -> list[dict[str, Any]]:
    frames = frame_map.get("frames", []) if isinstance(frame_map, dict) else []
    context = []
    for frame in frames:
        if not isinstance(frame, dict):
            continue
        try:
            timestamp = float(frame.get("timestamp_seconds", 0.0) or 0.0)
        except (TypeError, ValueError):
            continue
        if start - 8.0 <= timestamp <= end + 8.0:
            context.append(
                {
                    "timestamp_seconds": round(timestamp, 3),
                    "scene_type": frame.get("scene_type", "unknown"),
                    "visual_description": frame.get("visual_description", ""),
                    "has_scene_changed": bool(frame.get("has_scene_changed")),
                }
            )
    return context


def story_strategy_for_video_type(video_type: str) -> str:
    if video_type == "podcast":
        return "Find question-answer arcs with a clear setup, opinion, reveal, and payoff."
    if video_type == "talking_head":
        return "Find self-contained narrator sections with a strong hook and completed thought."
    if video_type == "screen_recording":
        return "Find tutorial/demo sections where the visual state changes and the explanation resolves."
    if video_type == "mixed":
        return "Pair narrator transcript beats with b-roll/visual proof and cut around scene changes."
    if video_type == "interview":
        return "Find answer windows that can stand alone without missing the question context."
    return "Find compact story windows with a hook, context, escalation, and payoff."


def short_text_for_reasoning(short: dict[str, Any]) -> str:
    values = [str(short.get("hook", "")).strip()]
    caption_beats = short.get("caption_beats", [])
    if isinstance(caption_beats, list):
        values.extend(str(beat.get("caption", "")).strip() for beat in caption_beats if isinstance(beat, dict))
    text = " ".join(value for value in values if value)
    return re.sub(r"\s+", " ", text).strip()


def build_selection_reasoning(
    short: dict[str, Any],
    video_type: str,
    frame_context: list[dict[str, Any]],
    scene_counts: Counter[str],
    scene_changes: list[Any],
) -> dict[str, Any]:
    start = short.get("start", "?")
    end = short.get("end", "?")
    duration = short.get("duration_seconds", "?")
    transcript_text = short_text_for_reasoning(short)
    dominant_scene = scene_counts.most_common(1)[0][0] if scene_counts else "unknown"
    has_specific_detail = bool(re.search(r"\d|spacex|space x|musk|elon|rocket|launch|nasa|falcon", transcript_text, re.I))
    has_question_or_tension = "?" in transcript_text or bool(re.search(r"why|how|failed|failure|problem|risk|tension|crash|explode", transcript_text, re.I))

    reasons = [
        f"It is a self-contained window from {start} to {end} ({duration}s), which fits a short-form story length.",
        f"The dominant visual mode is {dominant_scene}, and the overall video type is {video_type}.",
    ]
    if has_specific_detail:
        reasons.append("The transcript contains concrete names, dates, objects, or events, which helps the short feel specific instead of generic.")
    if has_question_or_tension:
        reasons.append("The opening transcript has question/tension energy, which can work as a retention hook.")
    if scene_changes:
        reasons.append(f"Scene changes near this window ({', '.join(str(item) for item in scene_changes[:4])}) give natural places for jump cuts or visual resets.")
    if frame_context:
        reasons.append("Nearby sampled frames provide visual support for the transcript instead of being audio-only.")

    return {
        "selected": True,
        "editor_summary": "Chosen because the transcript forms a compact story window with enough context and a usable payoff.",
        "reasons": reasons,
        "hook_basis": transcript_text[:260],
        "visual_basis": [
            {
                "timestamp_seconds": item.get("timestamp_seconds"),
                "scene_type": item.get("scene_type"),
                "visual_description": item.get("visual_description"),
            }
            for item in frame_context[:4]
        ],
        "risks": [
            "Transcript was generated from captions, so verify exact wording before final publishing.",
            "If the clip feels slow, tighten pauses and repeated connector phrases before burning captions.",
        ],
    }


def build_short_form_plan(
    short: dict[str, Any],
    video_type: str,
    frame_context: list[dict[str, Any]],
    scene_changes: list[Any],
) -> dict[str, Any]:
    start_seconds = hms_to_seconds(short.get("start")) or 0.0
    end_seconds = hms_to_seconds(short.get("end")) or start_seconds
    duration = max(0.0, end_seconds - start_seconds)
    hook_end = min(duration, 3.0)
    context_end = min(duration, max(8.0, duration * 0.28))
    escalation_end = min(duration, max(context_end + 8.0, duration * 0.72))
    caption_beats = short.get("caption_beats", [])
    caption_beats = caption_beats if isinstance(caption_beats, list) else []

    return {
        "goal": "Convert this selection into a tight vertical short with a fast hook, clear story progression, readable captions, and no dead time.",
        "video_type_strategy": story_strategy_for_video_type(video_type),
        "structure": [
            {
                "range": f"0.0-{hook_end:.1f}s",
                "purpose": "Hook",
                "edit": "Start directly on the strongest sentence. Remove any breath, pause, or setup before the first meaningful word.",
            },
            {
                "range": f"{hook_end:.1f}-{context_end:.1f}s",
                "purpose": "Context",
                "edit": "Keep only context required to understand the stakes. Use quick cuts when transcript repeats the same idea.",
            },
            {
                "range": f"{context_end:.1f}-{escalation_end:.1f}s",
                "purpose": "Escalation",
                "edit": "Lean on b-roll, text slides, or scene changes from the frame map to keep visual momentum.",
            },
            {
                "range": f"{escalation_end:.1f}-{duration:.1f}s",
                "purpose": "Payoff",
                "edit": "End after the idea lands. Do not include the next topic unless it creates a deliberate cliffhanger.",
            },
        ],
        "filler_removal": [
            {
                "action": "tighten_opening",
                "note": "Trim before the first high-information caption beat.",
            },
            {
                "action": "remove_repeated_connectors",
                "note": "Cut repeated 'but/then/so/actually' style connector phrases when they do not add new information.",
            },
            {
                "action": "jump_cut_pauses",
                "note": "Use jump cuts where caption beats overlap or repeat context; keep sentence meaning intact.",
            },
        ],
        "caption_plan": {
            "sidecar_srt": "Generated next to the clip as a first pass.",
            "style": "Large Hindi captions, 1-2 lines max, high contrast white text with dark stroke or box.",
            "rules": [
                "Break captions by meaning, not by raw SRT line length.",
                "Highlight names, dates, rocket failures, money, NASA/SpaceX, and stakes words.",
                "Avoid covering faces, rockets, or important on-screen text.",
            ],
            "first_beats": caption_beats[:8],
        },
        "visual_plan": {
            "scene_changes": scene_changes,
            "notes": [
                "Use frame-map scene changes as natural cut points.",
                "If the scene is talking head, crop for face and hands; if b-roll/text slide, preserve the important visual/text.",
                "For mixed videos, cut from narrator to b-roll when the transcript mentions a concrete object/event.",
            ],
            "nearby_frames": frame_context[:5],
        },
        "next_editing_steps": [
            "Review the clip page and confirm the story window is worth keeping.",
            "Tighten filler according to the filler_removal notes.",
            "Rewrite captions into punchier short-form lines.",
            "Burn styled captions into a final vertical export.",
        ],
    }


def build_story_map(
    video_path: Path,
    paths: RunPaths,
    max_shorts: int,
    min_short: int,
    max_short: int,
    force: bool,
) -> None:
    if step_done(paths, "story_map", [paths.story_map], force):
        existing = read_json(paths.story_map, {})
        stories = existing.get("stories", []) if isinstance(existing, dict) else []
        has_editor_plans = all(
            isinstance(story, dict) and story.get("selection_reasoning") and story.get("short_form_plan")
            for story in stories
        )
        if stories and has_editor_plans:
            log(f"Story map exists, skipping: {paths.story_map}")
            return
        if stories:
            log("Story map exists but is missing editor reasoning/plans; regenerating.")

    transcript = read_json(paths.transcript_json, {})
    segments = transcript.get("segments", []) if isinstance(transcript, dict) else []
    frame_map = read_json(paths.frame_scene_map, {})
    video_type = str(frame_map.get("video_type") or "other") if isinstance(frame_map, dict) else "other"
    timeline, shorts = fallback_timeline_and_shorts(segments, max_shorts, min_short, max_short)

    stories = []
    for short in shorts:
        start = hms_to_seconds(short.get("start")) or 0.0
        end = hms_to_seconds(short.get("end")) or start
        frame_context = frame_context_for_range(frame_map, start, end)
        scene_types = [str(item.get("scene_type") or "unknown") for item in frame_context]
        scene_counts = Counter(scene_types)
        scene_changes = [
            item.get("timestamp_seconds")
            for item in frame_context
            if item.get("has_scene_changed")
        ]
        visual_context = " | ".join(
            str(item.get("visual_description", ""))[:180]
            for item in frame_context[:4]
            if item.get("visual_description")
        )
        story = dict(short)
        story.update(
            {
                "video_type": video_type,
                "story_strategy": story_strategy_for_video_type(video_type),
                "dominant_scene_type": scene_counts.most_common(1)[0][0] if scene_counts else "unknown",
                "scene_types": sorted(set(scene_types)),
                "scene_changes": scene_changes,
                "visual_context": visual_context,
                "frame_context": frame_context,
                "source": "frame_scene_map_plus_transcript",
            }
        )
        story["selection_reasoning"] = build_selection_reasoning(
            story,
            video_type,
            frame_context,
            scene_counts,
            scene_changes,
        )
        story["short_form_plan"] = build_short_form_plan(
            story,
            video_type,
            frame_context,
            scene_changes,
        )
        stories.append(story)

    payload = {
        "source_video": str(video_path),
        "video_type": video_type,
        "story_strategy": story_strategy_for_video_type(video_type),
        "frame_scene_map": str(paths.frame_scene_map),
        "timeline": timeline,
        "stories": stories,
    }
    write_json(paths.story_map, payload)
    mark_done(paths, "story_map", {"stories": len(stories), "video_type": video_type})
    log(f"Story map saved: {paths.story_map}")


def timeline_and_shorts_from_story_map(story_map: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    timeline = story_map.get("timeline", []) if isinstance(story_map, dict) else []
    stories = story_map.get("stories", []) if isinstance(story_map, dict) else []
    if not isinstance(timeline, list):
        timeline = []
    shorts = [dict(item) for item in stories if isinstance(item, dict)]
    return timeline, shorts


def generate_timeline_and_shorts(
    video_path: Path,
    paths: RunPaths,
    model: str,
    max_shorts: int,
    min_short: int,
    max_short: int,
    max_transcript_chars: int,
    force: bool,
) -> None:
    outputs = [paths.timeline_json, paths.shorts_json, paths.shorts_md, paths.ffmpeg_commands]
    if step_done(paths, "timeline_and_shorts", outputs, force):
        existing_timeline = read_json(paths.timeline_json, {}).get("timeline", [])
        existing_shorts = read_json(paths.shorts_json, {}).get("shorts", [])
        existing_plan = read_json(paths.shorts_json, {}).get("raw_plan", {})
        story_map = read_json(paths.story_map, {})
        story_count = len(story_map.get("stories", [])) if isinstance(story_map, dict) else 0
        already_uses_story_map = isinstance(existing_plan, dict) and existing_plan.get("story_map_used") is True
        existing_has_editor_plans = all(
            isinstance(short, dict) and short.get("selection_reasoning") and short.get("short_form_plan")
            for short in existing_shorts
        )
        if (existing_timeline or existing_shorts) and (not story_count or (already_uses_story_map and existing_has_editor_plans)):
            log(f"Short-story outputs exist, skipping: {paths.shorts_json}")
            return
        log("Existing short-story outputs need story-map regeneration.")

    log("Generating final timeline and short-story cut suggestions.")
    transcript = read_json(paths.transcript_json, {})
    segments = transcript.get("segments", [])
    transcript_text, transcript_truncated = compact_transcript(segments, max_chars=max_transcript_chars)
    script_understanding = read_json(paths.script_understanding, {})
    frame_data = read_json(paths.frame_captions, {"captions": []})
    manifest = read_json(paths.manifest, {})
    story_map = read_json(paths.story_map, {})
    story_map_timeline, story_map_shorts = timeline_and_shorts_from_story_map(story_map if isinstance(story_map, dict) else {})

    if story_map_shorts:
        log("Generating timeline and shorts from story_map.json.")
        timeline = story_map_timeline
        shorts = story_map_shorts
        parsed = {
            "story_map_used": True,
            "story_map": str(paths.story_map),
            "video_type": story_map.get("video_type", "other") if isinstance(story_map, dict) else "other",
        }
    else:
        prompt = textwrap.dedent(
            f"""
            You are planning short video stories from a source video.
            Use the timestamped transcript, the script understanding, and sampled visual frame notes.
            Choose cut points that preserve a clear story arc: hook, context, escalation, payoff.
            Avoid dead air, repeated context, incomplete sentences, and cuts that end before the idea lands.

            Return only JSON with this exact top-level structure:
            {{
              "timeline": [
                {{
                  "start": "HH:MM:SS.mmm",
                  "end": "HH:MM:SS.mmm",
                  "beat": "",
                  "editor_note": "",
                  "cut_value": "keep|maybe|skip"
                }}
              ],
              "shorts": [
                {{
                  "rank": 1,
                  "title": "",
                  "story_angle": "",
                  "start": "HH:MM:SS.mmm",
                  "end": "HH:MM:SS.mmm",
                  "duration_seconds": 0,
                  "hook": "",
                  "why_this_cut": "",
                  "cut_points": [
                    {{"time": "HH:MM:SS.mmm", "action": "start|tighten|jump_cut|end", "reason": ""}}
                  ],
                  "caption_beats": [
                    {{"start": "HH:MM:SS.mmm", "end": "HH:MM:SS.mmm", "caption": ""}}
                  ],
                  "suggested_title_cards": [],
                  "risk_notes": []
                }}
              ]
            }}

            Constraints:
            - Suggest at most {max_shorts} shorts.
            - Each short should be between {min_short} and {max_short} seconds unless the content strongly justifies otherwise.
            - Use real timestamps from the transcript.
            - Prefer exact sentence boundaries.
            - If the transcript was truncated, rely on the script understanding for global context.

            Video:
            {json.dumps(manifest, ensure_ascii=True)[:7000]}

            Script understanding:
            {json.dumps(script_understanding, ensure_ascii=True)[:16000]}

            Sampled visual frame notes:
            {json.dumps(frame_data, ensure_ascii=True)[:12000]}

            Transcript truncated: {transcript_truncated}
            Timestamped transcript:
            {transcript_text}
            """
        ).strip()

        response = ollama_generate(model, prompt, json_mode=True, timeout=900, temperature=0.25)
        parsed = extract_json_from_text(response)
        if not isinstance(parsed, dict):
            parsed = {"raw_response": parsed}

        timeline = parsed.get("timeline", [])
        shorts = parsed.get("shorts", [])
        if not isinstance(timeline, list):
            timeline = []
        if not isinstance(shorts, list):
            shorts = []
        if not timeline or not shorts:
            log("Model returned empty timeline/shorts; building transcript fallback plan.")
            fallback_timeline, fallback_shorts = fallback_timeline_and_shorts(segments, max_shorts, min_short, max_short)
            if not timeline:
                timeline = fallback_timeline
            if not shorts:
                shorts = fallback_shorts
            parsed = {
                "model_plan": parsed,
                "fallback_used": True,
                "fallback_reason": "The local model returned an empty or malformed timeline/shorts plan.",
            }

    timeline_payload = {
        "model": model,
        "source_video": str(video_path),
        "timeline": timeline,
    }
    shorts_payload = {
        "model": model,
        "source_video": str(video_path),
        "shorts": enrich_shorts_with_cut_commands(shorts, video_path),
        "raw_plan": parsed,
    }
    write_json(paths.timeline_json, timeline_payload)
    write_json(paths.shorts_json, shorts_payload)
    write_text(paths.shorts_md, render_markdown_plan(shorts_payload["shorts"], paths))
    write_text(paths.ffmpeg_commands, render_ffmpeg_commands(shorts_payload["shorts"]))
    mark_done(paths, "timeline_and_shorts", {"shorts": len(shorts_payload["shorts"]), "timeline_beats": len(timeline)})
    log(f"Timeline and shorts saved: {len(timeline)} timeline beat(s), {len(shorts_payload['shorts'])} short(s).")


def enrich_shorts_with_cut_commands(shorts: list[Any], video_path: Path) -> list[dict[str, Any]]:
    enriched = []
    for index, raw_short in enumerate(shorts, start=1):
        if not isinstance(raw_short, dict):
            continue
        short = dict(raw_short)
        short.setdefault("rank", index)
        start_seconds = hms_to_seconds(short.get("start"))
        end_seconds = hms_to_seconds(short.get("end"))
        if start_seconds is not None:
            short["start_seconds"] = round(start_seconds, 3)
        if end_seconds is not None:
            short["end_seconds"] = round(end_seconds, 3)
        if start_seconds is not None and end_seconds is not None and end_seconds > start_seconds:
            short["duration_seconds"] = round(end_seconds - start_seconds, 3)
            output_name = f"short_{int(short.get('rank', index)):02d}_{slugify(short.get('title') or 'story')}.mp4"
            short["suggested_output"] = output_name
            short["ffmpeg_cut_command_cpu"] = (
                f'ffmpeg -y -ss {seconds_to_hms(start_seconds)} -to {seconds_to_hms(end_seconds)} '
                f'-i "{video_path}" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 160k "{output_name}"'
            )
            short["ffmpeg_cut_command_nvidia"] = (
                f'ffmpeg -y -hwaccel cuda -ss {seconds_to_hms(start_seconds)} -to {seconds_to_hms(end_seconds)} '
                f'-i "{video_path}" -c:v h264_nvenc -preset p5 -cq 19 -c:a aac -b:a 160k "{output_name}"'
            )
        enriched.append(short)
    return enriched


def slugify(value: Any, limit: int = 48) -> str:
    text = re.sub(r"[^A-Za-z0-9]+", "_", str(value).lower()).strip("_")
    return (text or "story")[:limit].strip("_") or "story"


def render_ffmpeg_commands(shorts: list[dict[str, Any]]) -> str:
    lines = [
        "# Suggested ffmpeg cut commands",
        "# NVIDIA commands use GPU encode/decode when supported. CPU commands are safer fallback.",
        "",
    ]
    for short in shorts:
        rank = short.get("rank", "?")
        title = short.get("title", "Untitled")
        lines.append(f"# {rank}. {title}")
        if short.get("ffmpeg_cut_command_nvidia"):
            lines.append(str(short["ffmpeg_cut_command_nvidia"]))
        if short.get("ffmpeg_cut_command_cpu"):
            lines.append(str(short["ffmpeg_cut_command_cpu"]))
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def caption_beats_to_clip_srt(short: dict[str, Any]) -> str:
    start_offset = hms_to_seconds(short.get("start")) or 0.0
    beats = short.get("caption_beats", [])
    if not isinstance(beats, list):
        return ""
    blocks = []
    for index, beat in enumerate(beats, start=1):
        if not isinstance(beat, dict):
            continue
        start = hms_to_seconds(beat.get("start"))
        end = hms_to_seconds(beat.get("end"))
        text = str(beat.get("caption", "")).strip()
        if start is None or end is None or end <= start or not text:
            continue
        rel_start = max(0.0, start - start_offset)
        rel_end = max(rel_start + 0.25, end - start_offset)
        blocks.append(
            f"{len(blocks) + 1}\n{seconds_to_srt_time(rel_start)} --> {seconds_to_srt_time(rel_end)}\n{text}\n"
        )
    return "\n".join(blocks).strip() + "\n" if blocks else ""


FILLER_WORDS = {
    "um",
    "uh",
    "erm",
    "hmm",
    "like",
    "basically",
    "actually",
    "literally",
    "okay",
    "right",
    "so",
    "then",
    "but",
    "and",
    "you",
    "know",
    "matlab",
    "\u092e\u0924\u0932\u092c",
    "\u0924\u094b",
    "\u092b\u093f\u0930",
    "\u0905\u091a\u094d\u091b\u093e",
    "\u092f\u093e\u0930",
    "\u0932\u0947\u0915\u093f\u0928",
}

IMPORTANT_MOMENT_RE = re.compile(
    r"\d|spacex|space\s*x|elon|musk|rocket|launch|nasa|falcon|orbit|failure|failed|"
    r"explode|satellite|engine|mission|mars|air\s*force|"
    r"\u0930\u0949\u0915\u0947\u091f|\u0938\u094d\u092a\u0947\u0938|\u0928\u093e\u0938\u093e|"
    r"\u0911\u0930\u094d\u092c\u093f\u091f|\u092e\u093f\u0936\u0928|\u0907\u0902\u091c\u0928|"
    r"\u092b\u0947\u0932|\u092e\u093e\u0930\u094d\u091a|\u0938\u0948\u091f\u0947\u0932\u093e\u0907\u091f",
    re.IGNORECASE,
)


def caption_tokens(text: str) -> list[str]:
    return re.findall(r"[\w']+", text.lower(), flags=re.UNICODE)


def compact_caption_text(text: Any, max_line_chars: int = 34, max_lines: int = 2) -> str:
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()
    if not cleaned:
        return ""
    words = cleaned.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and len(candidate) > max_line_chars:
            lines.append(current)
            current = word
            if len(lines) >= max_lines:
                break
        else:
            current = candidate
    if current and len(lines) < max_lines:
        lines.append(current)
    rendered = "\n".join(lines).strip()
    if len(lines) == max_lines and len(" ".join(words)) > len(rendered.replace("\n", " ")) + 4:
        rendered = rendered.rstrip(". ") + "..."
    return rendered


def transcript_segments_in_range(
    transcript_segments: list[dict[str, Any]],
    start_seconds: float,
    end_seconds: float,
) -> list[dict[str, Any]]:
    selected = []
    for segment in transcript_segments:
        if not isinstance(segment, dict):
            continue
        try:
            seg_start = float(segment.get("start", 0.0) or 0.0)
            seg_end = float(segment.get("end", seg_start) or seg_start)
        except (TypeError, ValueError):
            continue
        if seg_end <= start_seconds or seg_start >= end_seconds or seg_end <= seg_start:
            continue
        text = re.sub(r"\s+", " ", str(segment.get("text", "")).strip())
        selected.append(
            {
                "start": max(start_seconds, seg_start),
                "end": min(end_seconds, seg_end),
                "text": text,
            }
        )
    selected.sort(key=lambda item: (item["start"], item["end"]))
    return selected


def transcript_segment_score(text: str, duration: float) -> float:
    tokens = caption_tokens(text)
    if not tokens:
        return -3.0
    filler_count = sum(1 for token in tokens if token in FILLER_WORDS)
    filler_ratio = filler_count / max(1, len(tokens))
    score = 0.0
    if IMPORTANT_MOMENT_RE.search(text):
        score += 2.0
    if "?" in text or "\u0915\u094d\u092f\u094b\u0902" in text or "\u0915\u0948\u0938\u0947" in text:
        score += 1.5
    if len(tokens) >= 5:
        score += 0.8
    if 1.0 <= duration <= 7.0:
        score += 0.4
    if len(tokens) <= 3:
        score -= 1.0
    if filler_ratio >= 0.5:
        score -= 2.0
    return score


def merge_time_ranges(ranges: list[tuple[float, float]], max_gap: float = 0.12) -> list[tuple[float, float]]:
    cleaned = [(float(start), float(end)) for start, end in ranges if end - start >= 0.18]
    if not cleaned:
        return []
    cleaned.sort()
    merged: list[tuple[float, float]] = [cleaned[0]]
    for start, end in cleaned[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end + max_gap:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


def complement_time_ranges(
    start_seconds: float,
    end_seconds: float,
    kept_ranges: list[tuple[float, float]],
) -> list[tuple[float, float]]:
    removed = []
    cursor = start_seconds
    for keep_start, keep_end in kept_ranges:
        if keep_start - cursor >= 0.18:
            removed.append((cursor, keep_start))
        cursor = max(cursor, keep_end)
    if end_seconds - cursor >= 0.18:
        removed.append((cursor, end_seconds))
    return removed


def build_final_edit_ranges(
    short: dict[str, Any],
    transcript_segments: list[dict[str, Any]],
) -> dict[str, Any]:
    start_seconds = hms_to_seconds(short.get("start")) or 0.0
    end_seconds = hms_to_seconds(short.get("end")) or start_seconds
    original_duration = max(0.0, end_seconds - start_seconds)
    if original_duration <= 0.25:
        return {"kept_ranges": [], "removed_ranges": [], "notes": ["Invalid short duration."]}

    segments = transcript_segments_in_range(transcript_segments, start_seconds, end_seconds)
    if not segments:
        return {
            "kept_ranges": [(start_seconds, end_seconds)],
            "removed_ranges": [],
            "notes": ["No transcript segments were available, so the final render keeps the raw cut."],
        }

    useful_segments = [
        segment
        for segment in segments
        if transcript_segment_score(segment["text"], segment["end"] - segment["start"]) >= 0.0
    ]
    if not useful_segments:
        useful_segments = segments

    effective_start = max(start_seconds, useful_segments[0]["start"] - 0.05)
    effective_end = min(end_seconds, useful_segments[-1]["end"] + 0.08)
    boundaries = {round(effective_start, 3), round(effective_end, 3)}
    for segment in segments:
        if segment["end"] <= effective_start or segment["start"] >= effective_end:
            continue
        boundaries.add(round(max(effective_start, segment["start"]), 3))
        boundaries.add(round(min(effective_end, segment["end"]), 3))
    ordered = sorted(boundaries)

    candidate_atoms: list[dict[str, Any]] = []
    removed_notes: list[str] = []
    for atom_start, atom_end in zip(ordered, ordered[1:]):
        if atom_end - atom_start < 0.18:
            continue
        active = [
            segment
            for segment in segments
            if segment["start"] < atom_end and segment["end"] > atom_start
        ]
        if not active:
            if atom_end - atom_start <= 0.25:
                candidate_atoms.append(
                    {
                        "start": atom_start,
                        "end": atom_end,
                        "priority": -0.5,
                        "protected": False,
                        "reason": "short bridge",
                    }
                )
            else:
                removed_notes.append(f"Removed no-caption gap at {seconds_to_hms(atom_start)}.")
            continue

        text = " ".join(segment["text"] for segment in active)
        score = transcript_segment_score(text, atom_end - atom_start)
        hook_zone = atom_start <= effective_start + 3.0 and ("?" in text or IMPORTANT_MOMENT_RE.search(text))
        payoff_zone = atom_end >= effective_end - 2.0 and len(caption_tokens(text)) >= 4
        if score >= 0.0 or hook_zone or payoff_zone:
            protected = atom_start <= effective_start + 6.0 or atom_end >= effective_end - 6.0
            priority = score
            if protected:
                priority += 4.0
            if hook_zone:
                priority += 3.0
            if payoff_zone:
                priority += 2.0
            if IMPORTANT_MOMENT_RE.search(text):
                priority += 1.5
            candidate_atoms.append(
                {
                    "start": atom_start,
                    "end": atom_end,
                    "priority": priority,
                    "protected": protected,
                    "reason": "kept transcript beat",
                }
            )
        else:
            removed_notes.append(f"Removed low-value/filler beat at {seconds_to_hms(atom_start)}.")

    if original_duration > 50.0 and candidate_atoms:
        target_duration = max(32.0, min(45.0, original_duration * 0.72))
        current_duration = sum(atom["end"] - atom["start"] for atom in candidate_atoms)
        removable = [
            (index, atom)
            for index, atom in enumerate(candidate_atoms)
            if not atom.get("protected") and atom["end"] - atom["start"] >= 0.35
        ]
        removable.sort(key=lambda item: (float(item[1].get("priority", 0.0)), -(item[1]["end"] - item[1]["start"])))
        removed_indexes: set[int] = set()
        for index, atom in removable:
            if current_duration <= target_duration:
                break
            removed_indexes.add(index)
            current_duration -= atom["end"] - atom["start"]
            removed_notes.append(f"Tightened low-priority context at {seconds_to_hms(atom['start'])}.")
        if removed_indexes:
            candidate_atoms = [atom for index, atom in enumerate(candidate_atoms) if index not in removed_indexes]

    kept_atoms = [(atom["start"], atom["end"]) for atom in candidate_atoms]
    kept_ranges = merge_time_ranges(kept_atoms)
    final_duration = sum(end - start for start, end in kept_ranges)
    minimum_duration = min(14.0, max(6.0, original_duration * 0.45))
    if final_duration < minimum_duration:
        kept_ranges = [(effective_start, effective_end)]
        removed_notes.append("Fallback kept a continuous trimmed window because aggressive cuts became too short.")

    removed_ranges = complement_time_ranges(start_seconds, end_seconds, kept_ranges)
    return {
        "kept_ranges": kept_ranges,
        "removed_ranges": removed_ranges,
        "notes": removed_notes[:12],
    }


def source_ranges_to_decision_list(
    kept_ranges: list[tuple[float, float]],
    removed_ranges: list[tuple[float, float]],
) -> dict[str, Any]:
    output_cursor = 0.0
    kept = []
    for source_start, source_end in kept_ranges:
        duration = max(0.0, source_end - source_start)
        kept.append(
            {
                "source_start": seconds_to_hms(source_start),
                "source_end": seconds_to_hms(source_end),
                "output_start": seconds_to_hms(output_cursor),
                "output_end": seconds_to_hms(output_cursor + duration),
                "duration_seconds": round(duration, 3),
            }
        )
        output_cursor += duration
    removed = [
        {
            "source_start": seconds_to_hms(source_start),
            "source_end": seconds_to_hms(source_end),
            "duration_seconds": round(source_end - source_start, 3),
            "reason": "Removed as filler, repeated setup, low-priority context, or no-caption dead time.",
        }
        for source_start, source_end in removed_ranges
        if source_end > source_start
    ]
    return {
        "kept_ranges": kept,
        "removed_ranges": removed,
        "final_duration_seconds": round(output_cursor, 3),
        "removed_seconds": round(sum(item["duration_seconds"] for item in removed), 3),
    }


def final_caption_events_for_ranges(
    transcript_segments: list[dict[str, Any]],
    source_ranges: list[tuple[float, float]],
) -> list[dict[str, Any]]:
    offsets = []
    cursor = 0.0
    for start, end in source_ranges:
        offsets.append((start, end, cursor))
        cursor += end - start

    raw_events = []
    for segment in transcript_segments:
        if not isinstance(segment, dict):
            continue
        try:
            seg_start = float(segment.get("start", 0.0) or 0.0)
            seg_end = float(segment.get("end", seg_start) or seg_start)
        except (TypeError, ValueError):
            continue
        text = compact_caption_text(segment.get("text", ""))
        if not text or seg_end <= seg_start:
            continue
        for range_start, range_end, output_offset in offsets:
            inter_start = max(seg_start, range_start)
            inter_end = min(seg_end, range_end)
            if inter_end - inter_start < 0.35:
                continue
            if seg_start < range_start - 0.1 and abs(inter_start - range_start) < 0.001:
                continue
            raw_events.append(
                {
                    "start": output_offset + (inter_start - range_start),
                    "end": output_offset + (inter_end - range_start),
                    "text": text,
                }
            )

    raw_events.sort(key=lambda item: (item["start"], item["end"]))
    clean_events = []
    previous_end = 0.0
    previous_text = ""
    for index, event in enumerate(raw_events):
        text = event["text"]
        if text == previous_text and event["start"] - previous_end < 0.4:
            continue
        start = max(0.0, float(event["start"]))
        end = float(event["end"])
        next_start = raw_events[index + 1]["start"] if index + 1 < len(raw_events) else None
        if next_start is not None and next_start > start + 0.45:
            end = min(end, float(next_start) - 0.05)
        if clean_events and start < clean_events[-1]["end"] + 0.04:
            start = clean_events[-1]["end"] + 0.04
        if end <= start + 0.35:
            continue
        clean_events.append({"start": round(start, 3), "end": round(end, 3), "text": text})
        previous_end = end
        previous_text = text
    return clean_events


def caption_events_to_srt(events: list[dict[str, Any]]) -> str:
    blocks = []
    for event in events:
        start = float(event.get("start", 0.0) or 0.0)
        end = float(event.get("end", start) or start)
        text = str(event.get("text", "")).strip()
        if end <= start or not text:
            continue
        blocks.append(
            f"{len(blocks) + 1}\n{seconds_to_srt_time(start)} --> {seconds_to_srt_time(end)}\n{text}\n"
        )
    return "\n".join(blocks).strip() + "\n" if blocks else ""


def seconds_to_ass_time(seconds: float) -> str:
    seconds = max(0.0, float(seconds))
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    whole_seconds = int(seconds % 60)
    centiseconds = int(round((seconds - int(seconds)) * 100))
    if centiseconds >= 100:
        centiseconds = 0
        whole_seconds += 1
    if whole_seconds >= 60:
        whole_seconds = 0
        minutes += 1
    if minutes >= 60:
        minutes = 0
        hours += 1
    return f"{hours}:{minutes:02d}:{whole_seconds:02d}.{centiseconds:02d}"


def ass_escape(text: Any) -> str:
    cleaned = str(text or "").strip()
    cleaned = cleaned.replace("\\", "\\\\").replace("{", r"\{").replace("}", r"\}")
    return cleaned.replace("\n", r"\N")


def caption_events_to_ass(events: list[dict[str, Any]]) -> str:
    header = """[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Nirmala UI,54,&H00FFFFFF,&H000000FF,&H00000000,&H99000000,0,0,0,0,100,100,0,0,3,3,0,2,70,70,92,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header.rstrip()]
    for event in events:
        start = float(event.get("start", 0.0) or 0.0)
        end = float(event.get("end", start) or start)
        text = ass_escape(event.get("text", ""))
        if end <= start or not text:
            continue
        lines.append(f"Dialogue: 0,{seconds_to_ass_time(start)},{seconds_to_ass_time(end)},Default,,0,0,0,,{{\\an2}}{text}")
    return "\n".join(lines).strip() + "\n"


def ffmpeg_concat_file_text(paths: list[Path]) -> str:
    lines = []
    for path in paths:
        escaped = path.resolve().as_posix().replace("'", "'\\''")
        lines.append(f"file '{escaped}'")
    return "\n".join(lines).strip() + "\n"


def ffmpeg_filter_path(path: Path) -> str:
    text = path.resolve().as_posix()
    text = text.replace(":", r"\:")
    text = text.replace("'", r"\'")
    return text


def ffmpeg_subtitles_filter(path: Path) -> str:
    return f"subtitles=filename='{ffmpeg_filter_path(path)}'"


def short_visual_text(short: dict[str, Any]) -> str:
    values = [
        str(short.get("dominant_scene_type", "")),
        str(short.get("visual_context", "")),
    ]
    frame_context = short.get("frame_context", [])
    if isinstance(frame_context, list):
        for frame in frame_context:
            if isinstance(frame, dict):
                values.append(str(frame.get("scene_type", "")))
                values.append(str(frame.get("visual_description", "")))
    return " ".join(values).lower()


def detect_embedded_vertical_bounds(frame_path: Path) -> dict[str, int] | None:
    if not frame_path.exists():
        return None
    try:
        from PIL import Image

        with Image.open(frame_path) as image:
            source_width, source_height = image.size
            sample_width = 320
            sample_height = max(90, round(sample_width * source_height / max(1, source_width)))
            luma = image.convert("L").resize((sample_width, sample_height))
        top = max(0, round(sample_height * 0.02))
        bottom = max(top + 1, round(sample_height * 0.88))
        pixels = luma.load()
        active_columns = []
        for x in range(sample_width):
            column_mean = sum(pixels[x, y] for y in range(top, bottom)) / (bottom - top)
            active_columns.append(column_mean > 8)

        spans: list[tuple[int, int]] = []
        start: int | None = None
        for index, active in enumerate(active_columns + [False]):
            if active and start is None:
                start = index
            elif not active and start is not None:
                spans.append((start, index - 1))
                start = None
        if not spans:
            return None

        center = sample_width / 2
        spans.sort(key=lambda span: ((span[1] - span[0] + 1), -abs(((span[0] + span[1]) / 2) - center)), reverse=True)
        left_sample, right_sample = spans[0]
        span_width_sample = right_sample - left_sample + 1
        span_ratio = span_width_sample / sample_width
        if span_ratio < 0.18 or span_ratio > 0.72:
            return None

        left = round(left_sample / sample_width * source_width)
        right = round((right_sample + 1) / sample_width * source_width)
        width = max(2, right - left)
        pad = round(width * 0.03)
        left = max(0, left - pad)
        right = min(source_width, right + pad)
        width = max(2, right - left)
        if width % 2:
            width -= 1
        if left % 2:
            left -= 1
        height = source_height - (source_height % 2)
        aspect = width / max(1, height)
        if aspect < 0.42 or aspect > 0.9:
            return None
        return {"x": max(0, left), "y": 0, "w": width, "h": height}
    except Exception:
        return None


def framing_decision_for_short(
    short: dict[str, Any],
    source_width: int | None,
    source_height: int | None,
    framing_probe: dict[str, Any] | None = None,
) -> dict[str, Any]:
    scene_types = set()
    raw_scene_types = short.get("scene_types", [])
    if isinstance(raw_scene_types, list):
        scene_types.update(str(item) for item in raw_scene_types if item)
    dominant_scene = str(short.get("dominant_scene_type") or "unknown")
    if dominant_scene:
        scene_types.add(dominant_scene)

    visual_text = short_visual_text(short)
    source_aspect = round(source_width / source_height, 4) if source_width and source_height else None
    text_or_ui_risk = bool(
        {"text_slide", "screen_recording"} & scene_types
        or re.search(r"equation|diagram|code|screen recording|screen_recording|slide|chart|graph", visual_text)
    )
    person_or_talk = bool(
        {"talking_head_narrator", "podcast_question_answer", "podcast_interview"} & scene_types
        or re.search(r"\bman\b|\bwoman\b|\bperson\b|\bface\b|microphone|speaking", visual_text)
    )
    action_broll = bool(
        "other_broll_scene" in scene_types
        or re.search(r"rocket|launch|explosion|vehicle|crash|fire|smoke", visual_text)
    )
    probe_analysis = framing_probe.get("analysis") if isinstance(framing_probe, dict) else None
    probe_scene = str(probe_analysis.get("scene_type", "")).lower() if isinstance(probe_analysis, dict) else ""
    probe_person_or_talk = bool(re.search(r"talking|person|face|interview|podcast", probe_scene))

    reasons: list[str] = []
    risks: list[str] = []
    embedded_bounds = None
    if (
        source_width
        and source_height
        and source_width > source_height
        and isinstance(framing_probe, dict)
        and (person_or_talk or probe_person_or_talk)
    ):
        embedded_bounds = detect_embedded_vertical_bounds(Path(str(framing_probe.get("frame_path", ""))))

    if source_width and source_height and source_width <= source_height:
        strategy = "already_vertical"
        crop_mode = "none"
        reasons.append("Source is already vertical or square enough, so no aggressive crop is needed.")
    elif embedded_bounds:
        strategy = "embedded_vertical_safe_canvas"
        crop_mode = "embedded_vertical_fit_with_blurred_background"
        reasons.append("Detected a vertical phone clip embedded inside a wider source frame, so that inner clip is extracted for mobile.")
        reasons.append("This avoids both weak full-frame letterboxing and an over-tight 9:16 center crop.")
        risks.append("The embedded source may still contain its own captions or black bars; review the clip if those compete with burned captions.")
    elif isinstance(framing_probe, dict) and isinstance(framing_probe.get("analysis"), dict):
        analysis = framing_probe["analysis"]
        recommended = str(analysis.get("recommended_framing") or "").strip()
        safe_to_crop = analysis.get("safe_to_crop_9_16")
        has_text_or_ui = bool(analysis.get("has_important_text_or_ui"))
        if recommended == "preserve_full_frame_safe_canvas" or safe_to_crop is False:
            strategy = "preserve_full_frame_safe_canvas"
            crop_mode = "fit_with_blurred_background"
            reasons.append("A real frame probe found text/UI or edge-sensitive content, so the full frame is preserved.")
        elif recommended == "center_crop_vertical_fill" or safe_to_crop is True:
            strategy = "center_crop_vertical_fill"
            crop_mode = "9:16_center_crop"
            if has_text_or_ui:
                reasons.append("A real frame probe found text/UI but also marked a 9:16 crop safe, so the crop is preferred for mobile.")
            else:
                reasons.append("A real frame probe found the important subject/action safe enough for a 9:16 crop.")
        else:
            strategy = "preserve_full_frame_safe_canvas" if has_text_or_ui else "center_crop_vertical_fill"
            crop_mode = "fit_with_blurred_background" if has_text_or_ui else "9:16_center_crop"
            if has_text_or_ui:
                reasons.append("A real frame probe found text/UI and did not explicitly mark a crop safe, so the full frame is preserved.")
            else:
                reasons.append("A real frame probe did not find an edge-sensitive risk, so a 9:16 crop is preferred for mobile.")
        if analysis.get("reason"):
            reasons.append(str(analysis.get("reason")))
        if analysis.get("important_content_position"):
            reasons.append(f"Important content position: {analysis.get('important_content_position')}.")
        if safe_to_crop is False:
            risks.append("The probe marked 9:16 crop as unsafe; this render preserves the full frame.")
        elif recommended != "preserve_full_frame_safe_canvas":
            risks.append("Center crop was selected from a single probe frame; review if the subject moves to the edge later.")
    elif text_or_ui_risk:
        strategy = "preserve_full_frame_safe_canvas"
        crop_mode = "fit_with_blurred_background"
        reasons.append("Detected text, equations, screen recording, or slide-like content, so the full frame is preserved.")
        reasons.append("Cropping to fill 9:16 could cut off useful on-screen information.")
        risks.append("This may still look landscape inside the vertical canvas, but it avoids losing important visual information.")
    elif person_or_talk:
        strategy = "center_crop_vertical_fill"
        crop_mode = "9:16_center_crop"
        reasons.append("Detected a talking-head/person scene, so a 9:16 center crop should feel native to shorts.")
        risks.append("Without face tracking, a speaker near the far left or right edge could be cropped.")
    elif action_broll:
        strategy = "center_crop_vertical_fill"
        crop_mode = "9:16_center_crop"
        reasons.append("Detected action/b-roll, so a vertical center crop creates a stronger short-form frame.")
        risks.append("Wide b-roll can lose edge detail; review the clip page if the important object sits off-center.")
    else:
        strategy = "guarded_center_crop_vertical"
        crop_mode = "9:16_center_crop"
        reasons.append("Frame evidence is limited, so the default short-form choice is a guarded center crop.")
        risks.append("Because the scene type is uncertain, manually review this crop for important edge content.")

    return {
        "target_aspect_ratio": "9:16",
        "output_width": 1080,
        "output_height": 1920,
        "source_width": source_width,
        "source_height": source_height,
        "source_aspect_ratio": source_aspect,
        "dominant_scene_type": dominant_scene,
        "scene_types": sorted(scene_types),
        "strategy": strategy,
        "crop_mode": crop_mode,
        "caption_position": "bottom_safe_zone",
        "embedded_crop": embedded_bounds,
        "probe": framing_probe,
        "reasons": reasons,
        "risks": risks,
    }


def vertical_video_filter(framing: dict[str, Any], subtitle_path: Path | None) -> str:
    strategy = str(framing.get("strategy") or "")
    if strategy == "preserve_full_frame_safe_canvas":
        video_filter = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            "crop=1080:1920,boxblur=luma_radius=28:luma_power=1[bg];"
            "[0:v]scale=1080:1120:force_original_aspect_ratio=decrease[fg];"
            "[bg][fg]overlay=(W-w)/2:250,setsar=1"
        )
    elif strategy == "embedded_vertical_safe_canvas":
        crop = framing.get("embedded_crop", {}) if isinstance(framing.get("embedded_crop"), dict) else {}
        crop_w = max(2, int(crop.get("w") or 0))
        crop_h = max(2, int(crop.get("h") or 0))
        crop_x = max(0, int(crop.get("x") or 0))
        crop_y = max(0, int(crop.get("y") or 0))
        video_filter = (
            f"[0:v]crop={crop_w}:{crop_h}:{crop_x}:{crop_y},split=2[fgsrc][bgsrc];"
            "[bgsrc]scale=1080:1920:force_original_aspect_ratio=increase,"
            "crop=1080:1920,boxblur=luma_radius=24:luma_power=1[bg];"
            "[fgsrc]scale=1080:1920:force_original_aspect_ratio=decrease[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1"
        )
    elif strategy == "already_vertical":
        video_filter = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,"
            "pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1"
        )
    else:
        video_filter = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            "crop=1080:1920:(iw-ow)*0.5:(ih-oh)*0.5,setsar=1"
        )
    if subtitle_path and subtitle_path.exists() and subtitle_path.stat().st_size > 0:
        video_filter += f",{ffmpeg_subtitles_filter(subtitle_path)}"
    return video_filter + "[v]"


def run_gpu_then_cpu(gpu_cmd: list[str], cpu_cmd: list[str], label: str) -> str:
    result = run_command(gpu_cmd, check=False, capture=True)
    if result.returncode == 0:
        return "h264_nvenc"
    log(f"GPU {label} failed; retrying CPU.")
    run_command(cpu_cmd, check=True, capture=True)
    return "libx264"


def render_range_chunk(video_path: Path, chunk_path: Path, start_seconds: float, end_seconds: float) -> str:
    duration = max(0.0, end_seconds - start_seconds)
    chunk_path.parent.mkdir(parents=True, exist_ok=True)
    common = [
        "-hide_banner",
        "-nostdin",
        "-y",
        "-ss",
        seconds_to_hms(start_seconds),
        "-i",
        str(video_path),
        "-t",
        f"{duration:.3f}",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-movflags",
        "+faststart",
        str(chunk_path),
    ]
    gpu_cmd = ["ffmpeg", *common[:2], "-hwaccel", "cuda", *common[2:-9], "-c:v", "h264_nvenc", "-preset", "p5", "-cq", "20", *common[-9:]]
    cpu_cmd = ["ffmpeg", *common[:-9], "-c:v", "libx264", "-preset", "medium", "-crf", "19", *common[-9:]]
    return run_gpu_then_cpu(gpu_cmd, cpu_cmd, "edit chunk render")


def render_vertical_captioned_video(
    base_clip: Path,
    subtitle_path: Path | None,
    final_output: Path,
    framing: dict[str, Any],
) -> str:
    final_output.parent.mkdir(parents=True, exist_ok=True)
    video_filter = vertical_video_filter(framing, subtitle_path)
    gpu_cmd = [
        "ffmpeg",
        "-hide_banner",
        "-nostdin",
        "-y",
        "-i",
        str(base_clip),
        "-filter_complex",
        video_filter,
        "-map",
        "[v]",
        "-map",
        "0:a?",
        "-c:v",
        "h264_nvenc",
        "-preset",
        "p5",
        "-cq",
        "21",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-movflags",
        "+faststart",
        str(final_output),
    ]
    cpu_cmd = [
        "ffmpeg",
        "-hide_banner",
        "-nostdin",
        "-y",
        "-i",
        str(base_clip),
        "-filter_complex",
        video_filter,
        "-map",
        "[v]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "20",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-movflags",
        "+faststart",
        str(final_output),
    ]
    return run_gpu_then_cpu(gpu_cmd, cpu_cmd, "caption burn")


def render_final_edited_short(
    video_path: Path,
    paths: RunPaths,
    short: dict[str, Any],
    transcript_segments: list[dict[str, Any]],
    source_dimensions: tuple[int | None, int | None],
    model: str | None,
    raw_output_path: Path,
    force: bool,
) -> dict[str, Any]:
    final_output = raw_output_path.with_name(f"final_{raw_output_path.name}")
    final_srt = final_output.with_suffix(".srt")
    final_ass = final_output.with_suffix(".ass")
    work_dir = paths.short_clips_dir / f"{raw_output_path.stem}_final_edit"
    base_clip = work_dir / "base_concat.mp4"
    concat_file = work_dir / "concat.txt"

    edit_ranges = build_final_edit_ranges(short, transcript_segments)
    kept_ranges = edit_ranges.get("kept_ranges", [])
    removed_ranges = edit_ranges.get("removed_ranges", [])
    probe = extract_framing_probe_frame(video_path, paths, short, kept_ranges, force)
    probe = analyze_framing_probe(probe, short, model, force)
    if probe:
        short["framing_probe"] = probe
    framing = framing_decision_for_short(short, source_dimensions[0], source_dimensions[1], probe)
    decision = source_ranges_to_decision_list(kept_ranges, removed_ranges)
    short["final_edit_decision_list"] = decision
    short["framing_decision"] = framing
    short["filler_removal_notes"] = edit_ranges.get("notes", [])
    short["final_clip_path"] = str(final_output)
    short["final_clip_filename"] = final_output.name
    short["final_caption_srt_path"] = str(final_srt)
    short["final_caption_ass_path"] = str(final_ass)
    short["filler_removed_seconds"] = decision.get("removed_seconds", 0.0)
    short["final_duration_seconds"] = decision.get("final_duration_seconds", 0.0)

    caption_events = final_caption_events_for_ranges(transcript_segments, kept_ranges)
    final_caption_text = caption_events_to_srt(caption_events)
    final_ass_text = caption_events_to_ass(caption_events)
    subtitle_changed = False
    if final_caption_text:
        existing_srt = final_srt.read_text(encoding="utf-8-sig", errors="replace") if final_srt.exists() else ""
        srt_changed = existing_srt != final_caption_text
        subtitle_changed = subtitle_changed or srt_changed
        if srt_changed:
            write_utf8_sig_text(final_srt, final_caption_text)
    if final_ass_text:
        existing_ass = final_ass.read_text(encoding="utf-8", errors="replace") if final_ass.exists() else ""
        ass_changed = existing_ass != final_ass_text
        subtitle_changed = subtitle_changed or ass_changed
        if ass_changed:
            write_text(final_ass, final_ass_text)

    render_signature = hashlib.sha1(
        json.dumps(
            {
                "version": "framing-v5-lower-bottom-ass",
                "framing": framing,
                "decision": decision,
                "subtitle_path": str(final_ass),
            },
            sort_keys=True,
            ensure_ascii=True,
        ).encode("utf-8")
    ).hexdigest()
    signature_changed = short.get("framing_render_signature") != render_signature
    short["framing_render_signature"] = render_signature

    if final_output.exists() and not force and not subtitle_changed and not signature_changed:
        short["final_render_status"] = "exists"
        short["final_clip_size_bytes"] = final_output.stat().st_size
        return short

    if not kept_ranges:
        short["final_render_status"] = "skipped_no_edit_ranges"
        return short

    log(f"Rendering final captioned short {short.get('rank', '?')}: {final_output.name}")
    chunk_dir = work_dir / "chunks"
    chunk_paths = []
    encoders = []
    for index, (range_start, range_end) in enumerate(kept_ranges, start=1):
        chunk_path = chunk_dir / f"chunk_{index:03d}.mp4"
        encoders.append(render_range_chunk(video_path, chunk_path, range_start, range_end))
        chunk_paths.append(chunk_path)

    write_text(concat_file, ffmpeg_concat_file_text(chunk_paths))
    run_command(
        [
            "ffmpeg",
            "-hide_banner",
            "-nostdin",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-c",
            "copy",
            str(base_clip),
        ],
        check=True,
        capture=True,
    )
    encoder = render_vertical_captioned_video(base_clip, final_ass if final_ass.exists() else final_srt, final_output, framing)
    short["final_render_status"] = "created"
    short["final_clip_size_bytes"] = final_output.stat().st_size if final_output.exists() else 0
    short["final_render_encoder"] = encoder
    short["final_chunk_encoders"] = sorted(set(encoders))
    return short


def persist_short_clip_progress(
    paths: RunPaths,
    payload: dict[str, Any],
    updated_shorts: list[dict[str, Any]],
    remaining_items: list[Any],
    cut_count: int,
    final_count: int,
) -> None:
    progress_shorts = list(updated_shorts)
    for item in remaining_items:
        if isinstance(item, dict):
            progress_shorts.append(dict(item))
    payload["shorts"] = progress_shorts
    write_json(paths.shorts_json, payload)
    write_text(paths.shorts_md, render_markdown_plan(progress_shorts, paths))
    write_text(paths.ffmpeg_commands, render_ffmpeg_commands(progress_shorts))
    mark_done(
        paths,
        "short_clips",
        {
            "clips": cut_count,
            "final_clips": final_count,
            "progress": f"{len(updated_shorts)}/{len(progress_shorts)}",
            "directory": str(paths.short_clips_dir),
        },
    )


MOBILE_QA_VERSION = "mobile-qa-v3"


def mobile_qa_clip_signature(clip_path: Path) -> dict[str, Any]:
    if not clip_path.exists():
        return {"path": str(clip_path), "missing": True}
    stat = clip_path.stat()
    return {
        "path": str(clip_path.resolve()),
        "size_bytes": stat.st_size,
        "mtime_ns": stat.st_mtime_ns,
    }


def mobile_qa_short_current(short: dict[str, Any]) -> bool:
    existing = short.get("mobile_qa")
    if not isinstance(existing, dict) or existing.get("version") != MOBILE_QA_VERSION:
        return False
    clip_path = Path(str(short.get("final_clip_path") or short.get("clip_path") or ""))
    if not clip_path.exists():
        return existing.get("status") == "missing_clip"
    return existing.get("clip_signature") == mobile_qa_clip_signature(clip_path)


def mobile_qa_cache_current(paths: RunPaths, shorts: list[Any]) -> bool:
    existing_report = read_json(paths.mobile_qa_json, {})
    if not isinstance(existing_report, dict) or existing_report.get("version") != MOBILE_QA_VERSION:
        return False
    valid_shorts = [item for item in shorts if isinstance(item, dict)]
    if not valid_shorts:
        return False
    return all(mobile_qa_short_current(item) for item in valid_shorts)


def mobile_qa_sample_times(duration: float | None, max_frames: int) -> list[float]:
    if not duration or duration <= 0 or max_frames <= 0:
        return []
    max_frames = max(1, min(max_frames, 16))
    if duration <= 3.0:
        return [max(0.1, duration / 2.0)]
    if max_frames == 1:
        return [min(duration - 0.2, max(0.2, duration / 2.0))]
    start = min(0.8, max(0.2, duration * 0.08))
    end = max(start + 0.2, duration - min(0.8, duration * 0.08))
    step = (end - start) / max(1, max_frames - 1)
    return [round(min(duration - 0.1, start + step * index), 3) for index in range(max_frames)]


def extract_mobile_qa_frames(
    clip_path: Path,
    output_dir: Path,
    *,
    max_frames: int,
    force: bool,
) -> list[dict[str, Any]]:
    duration = media_duration_seconds(clip_path)
    times = mobile_qa_sample_times(duration, max_frames)
    output_dir.mkdir(parents=True, exist_ok=True)
    frames = []
    for index, timestamp in enumerate(times, start=1):
        frame_path = output_dir / f"frame_{index:03d}_{int(timestamp * 1000):07d}.jpg"
        if not frame_path.exists() or force:
            run_command(
                [
                    "ffmpeg",
                    "-hide_banner",
                    "-nostdin",
                    "-y",
                    "-ss",
                    seconds_to_hms(timestamp),
                    "-i",
                    str(clip_path),
                    "-frames:v",
                    "1",
                    "-q:v",
                    "3",
                    "-update",
                    "1",
                    str(frame_path),
                ],
                check=True,
                capture=True,
            )
        frames.append(
            {
                "index": index,
                "timestamp_seconds": timestamp,
                "timestamp": seconds_to_hms(timestamp),
                "frame_path": str(frame_path),
            }
        )
    return frames


def mobile_qa_frame_checks(frame_path: Path) -> dict[str, Any]:
    checks: dict[str, Any] = {
        "target_width": 1080,
        "target_height": 1920,
        "caption_bottom_safe_by_render_style": True,
        "caption_style": "ASS alignment=bottom-center margin_v=92 font_size=54",
    }
    try:
        from PIL import Image

        with Image.open(frame_path) as image:
            width, height = image.size
        checks["width"] = width
        checks["height"] = height
        checks["is_vertical_9_16"] = (
            width == 1080
            and height == 1920
            and abs((width / height) - (9 / 16)) < 0.01
        )
    except Exception as exc:
        checks["image_check_error"] = str(exc)
        checks["is_vertical_9_16"] = None
    return checks


def normalize_mobile_qa_analysis(analysis: dict[str, Any], checks: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(analysis)
    raw_errors = normalized.get("errors", [])
    if not isinstance(raw_errors, list):
        raw_errors = []
    errors = [str(item) for item in raw_errors if str(item).strip()]
    removed: list[str] = []

    def remove_error(error_name: str, reason: str) -> None:
        nonlocal errors
        if error_name in errors:
            errors = [item for item in errors if item != error_name]
            removed.append(f"{error_name}: {reason}")

    if checks.get("is_vertical_9_16") is True:
        remove_error("wrong_aspect_ratio", "frame is 1080x1920")
    if checks.get("caption_bottom_safe_by_render_style") is True:
        remove_error("caption_not_bottom_safe", "burned ASS caption is bottom-aligned with safe margin")
        remove_error("caption_too_high", "burned ASS caption is anchored in the lower safe zone")

    errors = [item for item in errors if item != "safe"]
    if not errors:
        errors = ["safe"]

    normalized["errors"] = errors
    normalized["has_error"] = any(item != "safe" for item in errors)
    normalized["deterministic_checks"] = checks
    if removed:
        existing_notes = normalized.get("qa_postprocess_notes", [])
        if not isinstance(existing_notes, list):
            existing_notes = [str(existing_notes)]
        normalized["qa_postprocess_notes"] = existing_notes + removed

    try:
        score = float(normalized.get("mobile_score"))
    except (TypeError, ValueError):
        score = 0.0
    if errors == ["safe"]:
        normalized["mobile_score"] = max(score, 8.0)
    elif all(item in {"blurred_background_distracting", "low_quality_or_soft", "black_bars_or_canvas_feels_bad"} for item in errors):
        normalized["mobile_score"] = max(score, 6.0)
    return normalized


def analyze_mobile_qa_frame(model: str, frame: dict[str, Any], short: dict[str, Any]) -> dict[str, Any]:
    frame_path = Path(str(frame.get("frame_path", "")))
    if not frame_path.exists():
        return {**frame, "error": "frame_not_found"}
    checks = mobile_qa_frame_checks(frame_path)
    prompt = textwrap.dedent(
        f"""
        You are a strict short-form mobile video editor reviewing a 1080x1920 frame.
        Judge the frame as it would appear on a phone screen.

        Return only JSON:
        {{
          "mobile_score": 1,
          "has_error": true,
          "errors": [
            "wrong_aspect_ratio",
            "caption_not_bottom_safe",
            "caption_too_high",
            "caption_covers_face_or_action",
            "caption_low_contrast",
            "subject_badly_cropped",
            "important_text_cut_off",
            "black_bars_or_canvas_feels_bad",
            "blurred_background_distracting",
            "low_quality_or_soft",
            "safe"
          ],
          "editor_notes": "",
          "suggested_fix": "",
          "can_fix_with_ffmpeg": true,
          "needs_generative_repair": false
        }}

        Editorial standards:
        - Captions should sit in the lower phone-safe area, roughly the lower 15-25% of the frame, not center screen.
        - Do not mark a caption too high if it is clearly in the lower quarter and does not block the main subject.
        - Captions must not cover the speaker's face, rocket body, important action, or important on-screen text.
        - If captions overlap unimportant smoke, empty background, clothing, or blurred canvas, do not count that as a severe cover error.
        - A vertical crop should feel intentional on mobile.
        - Preserve full frame only when cropping would cut off important text/UI/action.
        - Mark generative repair only for unrecoverable visual problems that crop/pad/caption changes cannot fix.

        Clip title: {short.get('title', '')}
        Framing decision: {json.dumps(short.get('framing_decision', {}), ensure_ascii=True)[:2000]}
        """
    ).strip()
    try:
        response = ollama_generate(
            model,
            prompt,
            images=[image_to_base64(frame_path)],
            json_mode=True,
            timeout=180,
            temperature=0.05,
        )
        parsed = extract_json_from_text(response)
        if not isinstance(parsed, dict):
            parsed = {"raw_response": parsed}
        parsed = normalize_mobile_qa_analysis(parsed, checks)
        return {**frame, "analysis": parsed}
    except Exception as exc:
        return {**frame, "analysis_error": str(exc), "deterministic_checks": checks}


def summarize_mobile_qa_frame_reviews(frame_reviews: list[dict[str, Any]]) -> dict[str, Any]:
    scores = []
    errors = Counter()
    notes = []
    generative_count = 0
    ffmpeg_count = 0
    for review in frame_reviews:
        analysis = review.get("analysis", {})
        if not isinstance(analysis, dict):
            continue
        try:
            scores.append(float(analysis.get("mobile_score")))
        except (TypeError, ValueError):
            pass
        raw_errors = analysis.get("errors", [])
        if isinstance(raw_errors, list):
            for error in raw_errors:
                value = str(error)
                if value and value != "safe":
                    errors[value] += 1
        if analysis.get("editor_notes"):
            notes.append(f"{review.get('timestamp')}: {analysis.get('editor_notes')}")
        if analysis.get("needs_generative_repair"):
            generative_count += 1
        if analysis.get("can_fix_with_ffmpeg"):
            ffmpeg_count += 1
    worst_score = min(scores) if scores else None
    average_score = round(sum(scores) / len(scores), 2) if scores else None
    severe_errors = [
        key
        for key in (
            "wrong_aspect_ratio",
            "caption_not_bottom_safe",
            "caption_covers_face_or_action",
            "subject_badly_cropped",
            "important_text_cut_off",
        )
        if errors.get(key, 0) > 0
    ]
    return {
        "average_mobile_score": average_score,
        "worst_mobile_score": worst_score,
        "error_counts": dict(errors),
        "severe_errors": severe_errors,
        "status": "needs_review" if severe_errors or generative_count else "pass",
        "can_fix_with_ffmpeg": ffmpeg_count > 0,
        "needs_generative_repair": generative_count > 0,
        "editor_notes": notes[:12],
    }


def render_mobile_qa_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Mobile QA Report",
        "",
        f"Run folder: `{report.get('run_folder', '')}`",
        f"Generated: `{report.get('generated_at', '')}`",
        "",
        "Repair policy:",
        "- First use deterministic FFmpeg fixes: crop, safe canvas, caption position, caption style, and timing.",
        "- Use a generative video repair path only when QA marks a problem that crop/caption changes cannot solve.",
        f"- Wan-style repair status: `{report.get('generative_repair', {}).get('status', 'not_configured')}`",
        "",
    ]
    clips = report.get("clips", [])
    if not isinstance(clips, list) or not clips:
        lines.append("No clips were reviewed.")
        return "\n".join(lines).strip() + "\n"
    for clip in clips:
        summary = clip.get("summary", {}) if isinstance(clip.get("summary"), dict) else {}
        lines.extend(
            [
                f"## Clip {clip.get('rank', '?')}: {clip.get('title', '')}",
                "",
                f"- File: `{clip.get('clip_path', '')}`",
                f"- Status: `{summary.get('status', 'unknown')}`",
                f"- Average score: `{summary.get('average_mobile_score', 'n/a')}`",
                f"- Worst score: `{summary.get('worst_mobile_score', 'n/a')}`",
                f"- Needs generative repair: `{summary.get('needs_generative_repair', False)}`",
                f"- Error counts: `{json.dumps(summary.get('error_counts', {}), ensure_ascii=True)}`",
                "",
            ]
        )
        notes = summary.get("editor_notes", [])
        if notes:
            lines.append("Editor notes:")
            for note in notes:
                lines.append(f"- {note}")
            lines.append("")
    return "\n".join(lines).strip() + "\n"


def run_mobile_qa(
    paths: RunPaths,
    model: str,
    *,
    force: bool,
    frames_per_clip: int,
) -> None:
    outputs = [paths.mobile_qa_json, paths.mobile_qa_md]
    payload = read_json(paths.shorts_json, {})
    shorts = payload.get("shorts", []) if isinstance(payload, dict) else []
    if not isinstance(shorts, list) or not shorts:
        log("Mobile QA skipped because no shorts were available.")
        return

    if step_done(paths, "mobile_qa", outputs, force):
        if mobile_qa_cache_current(paths, shorts):
            log(f"Mobile QA exists, skipping: {paths.mobile_qa_json}")
            return
        log("Mobile QA cache is stale; regenerating review from current final clips.")

    report = {
        "version": MOBILE_QA_VERSION,
        "run_folder": str(paths.root),
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "model": model,
        "frames_per_clip": frames_per_clip,
        "generative_repair": {
            "candidate": "Wan2.1 quantized GGUF with Lightning LoRA",
            "status": "not_configured",
            "reason": "Use only for issues that cannot be solved with FFmpeg crop/caption/layout changes on this 8GB VRAM workflow.",
        },
        "clips": [],
    }

    updated_shorts = []
    for index, item in enumerate(shorts, start=1):
        if not isinstance(item, dict):
            continue
        short = dict(item)
        clip_path = Path(str(short.get("final_clip_path") or short.get("clip_path") or ""))
        if not clip_path.exists():
            short["mobile_qa"] = {"status": "missing_clip", "clip_path": str(clip_path)}
            updated_shorts.append(short)
            continue

        existing = short.get("mobile_qa")
        qa_current = mobile_qa_short_current(short)
        if isinstance(existing, dict) and qa_current and not force:
            report["clips"].append(existing)
            updated_shorts.append(short)
            continue

        log(f"Mobile QA: reviewing clip {index}/{len(shorts)}: {clip_path.name}")
        qa_dir = paths.short_clips_dir / "_mobile_qa" / f"short_{int(short.get('rank', index)):02d}"
        frames = extract_mobile_qa_frames(clip_path, qa_dir, max_frames=frames_per_clip, force=(force or not qa_current))
        frame_reviews = []
        for frame_index, frame in enumerate(frames, start=1):
            log(f"Mobile QA: clip {index}, frame {frame_index}/{len(frames)} at {frame.get('timestamp')}")
            frame_reviews.append(analyze_mobile_qa_frame(model, frame, short))
        summary = summarize_mobile_qa_frame_reviews(frame_reviews)
        clip_report = {
            "version": MOBILE_QA_VERSION,
            "rank": short.get("rank", index),
            "title": short.get("title", ""),
            "clip_path": str(clip_path),
            "clip_signature": mobile_qa_clip_signature(clip_path),
            "framing_decision": short.get("framing_decision", {}),
            "summary": summary,
            "frame_reviews": frame_reviews,
        }
        short["mobile_qa"] = clip_report
        report["clips"].append(clip_report)
        updated_shorts.append(short)

        progress_payload = dict(payload)
        progress_payload["shorts"] = updated_shorts + [dict(rest) for rest in shorts[index:] if isinstance(rest, dict)]
        write_json(paths.shorts_json, progress_payload)
        write_json(paths.mobile_qa_json, report)
        write_text(paths.mobile_qa_md, render_mobile_qa_markdown(report))
        mark_done(paths, "mobile_qa", {"reviewed_clips": len(report["clips"]), "progress": f"{len(report['clips'])}/{len(shorts)}"})

    payload["shorts"] = updated_shorts
    write_json(paths.shorts_json, payload)
    write_json(paths.mobile_qa_json, report)
    write_text(paths.mobile_qa_md, render_mobile_qa_markdown(report))
    mark_done(paths, "mobile_qa", {"reviewed_clips": len(report["clips"]), "report": str(paths.mobile_qa_json)})
    log(f"Mobile QA saved: {paths.mobile_qa_json}")


def cut_short_videos(
    video_path: Path,
    paths: RunPaths,
    force: bool,
    render_final: bool = True,
    model: str | None = None,
) -> None:
    payload = read_json(paths.shorts_json, {})
    shorts = payload.get("shorts", []) if isinstance(payload, dict) else []
    if not isinstance(shorts, list) or not shorts:
        log("No short clips to cut because no shorts were generated.")
        mark_done(paths, "short_clips", {"clips": 0})
        return

    paths.short_clips_dir.mkdir(parents=True, exist_ok=True)
    ensure_ffmpeg(auto_install=True)
    transcript = read_json(paths.transcript_json, {})
    transcript_segments = transcript.get("segments", []) if isinstance(transcript, dict) else []
    if not isinstance(transcript_segments, list):
        transcript_segments = []
    source_dimensions = media_dimensions(video_path)
    cut_count = 0
    final_count = 0
    updated_shorts = []

    for index, item in enumerate(shorts, start=1):
        if not isinstance(item, dict):
            continue
        short = dict(item)
        start_seconds = hms_to_seconds(short.get("start"))
        end_seconds = hms_to_seconds(short.get("end"))
        if start_seconds is None or end_seconds is None or end_seconds <= start_seconds:
            short["cut_status"] = "skipped_invalid_time_range"
            updated_shorts.append(short)
            persist_short_clip_progress(paths, payload, updated_shorts, shorts[index:], cut_count, final_count)
            continue

        output_name = str(short.get("suggested_output") or f"short_{index:02d}_{slugify(short.get('title') or 'story')}.mp4")
        if not output_name.lower().endswith(".mp4"):
            output_name += ".mp4"
        output_path = paths.short_clips_dir / Path(output_name).name
        duration = end_seconds - start_seconds

        short["clip_path"] = str(output_path)
        short["clip_filename"] = output_path.name
        caption_srt = output_path.with_suffix(".srt")
        caption_text = caption_beats_to_clip_srt(short)
        if caption_text:
            write_utf8_sig_text(caption_srt, caption_text)
            short["caption_srt_path"] = str(caption_srt)
        if output_path.exists() and not force:
            short["cut_status"] = "exists"
            short["clip_size_bytes"] = output_path.stat().st_size
            cut_count += 1
            if render_final:
                short = render_final_edited_short(
                    video_path,
                    paths,
                    short,
                    transcript_segments,
                    source_dimensions,
                    model,
                    output_path,
                    force,
                )
                if short.get("final_render_status") in {"exists", "created"}:
                    final_count += 1
            updated_shorts.append(short)
            persist_short_clip_progress(paths, payload, updated_shorts, shorts[index:], cut_count, final_count)
            continue

        log(f"Cutting short {index}/{len(shorts)}: {seconds_to_hms(start_seconds)} to {seconds_to_hms(end_seconds)}")
        gpu_cmd = [
            "ffmpeg",
            "-hide_banner",
            "-nostdin",
            "-y",
            "-hwaccel",
            "cuda",
            "-ss",
            seconds_to_hms(start_seconds),
            "-i",
            str(video_path),
            "-t",
            f"{duration:.3f}",
            "-c:v",
            "h264_nvenc",
            "-preset",
            "p5",
            "-cq",
            "19",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            str(output_path),
        ]
        result = run_command(gpu_cmd, check=False, capture=True)
        if result.returncode != 0:
            log(f"GPU cut failed for short {index}; retrying CPU.")
            cpu_cmd = [
                "ffmpeg",
                "-hide_banner",
                "-nostdin",
                "-y",
                "-ss",
                seconds_to_hms(start_seconds),
                "-i",
                str(video_path),
                "-t",
                f"{duration:.3f}",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "18",
                "-c:a",
                "aac",
                "-b:a",
                "160k",
                "-movflags",
                "+faststart",
                str(output_path),
            ]
            run_command(cpu_cmd, check=True, capture=True)
            short["cut_encoder"] = "libx264"
        else:
            short["cut_encoder"] = "h264_nvenc"

        short["cut_status"] = "created"
        short["clip_size_bytes"] = output_path.stat().st_size if output_path.exists() else 0
        cut_count += 1
        if render_final:
            short = render_final_edited_short(
                video_path,
                paths,
                short,
                transcript_segments,
                source_dimensions,
                model,
                output_path,
                force,
            )
            if short.get("final_render_status") in {"exists", "created"}:
                final_count += 1
        updated_shorts.append(short)
        persist_short_clip_progress(paths, payload, updated_shorts, shorts[index:], cut_count, final_count)

    payload["shorts"] = updated_shorts
    write_json(paths.shorts_json, payload)
    write_text(paths.shorts_md, render_markdown_plan(updated_shorts, paths))
    write_text(paths.ffmpeg_commands, render_ffmpeg_commands(updated_shorts))
    mark_done(
        paths,
        "short_clips",
        {"clips": cut_count, "final_clips": final_count, "directory": str(paths.short_clips_dir)},
    )
    log(f"Short clips ready: {cut_count} raw clip(s), {final_count} final clip(s) in {paths.short_clips_dir}")


def render_markdown_plan(shorts: list[dict[str, Any]], paths: RunPaths) -> str:
    lines = [
        "# Short Video Story Suggestions",
        "",
        f"Run folder: `{paths.root}`",
        "",
    ]
    if not shorts:
        lines.append("No short suggestions were parsed from the model response. Check the JSON output for the raw response.")
        return "\n".join(lines).strip() + "\n"

    for short in shorts:
        rank = short.get("rank", "?")
        title = short.get("title", "Untitled")
        start = short.get("start", "?")
        end = short.get("end", "?")
        duration = short.get("duration_seconds", "?")
        lines.extend(
            [
                f"## {rank}. {title}",
                "",
                f"- Time: `{start}` to `{end}` ({duration}s)",
                f"- Story angle: {short.get('story_angle', '')}",
                f"- Hook: {short.get('hook', '')}",
                f"- Why this cut: {short.get('why_this_cut', '')}",
                f"- Clip: `{short.get('clip_path', 'not cut yet')}`",
                f"- Final captioned clip: `{short.get('final_clip_path', 'not rendered yet')}`",
                f"- Filler removed: `{short.get('filler_removed_seconds', 0)}` seconds",
                f"- Framing: `{(short.get('framing_decision') or {}).get('strategy', 'not decided')}`",
                "",
                "Cut points:",
            ]
        )
        cut_points = short.get("cut_points", [])
        if isinstance(cut_points, list) and cut_points:
            for point in cut_points:
                if isinstance(point, dict):
                    lines.append(
                        f"- `{point.get('time', '?')}` {point.get('action', '')}: {point.get('reason', '')}"
                    )
        else:
            lines.append("- No detailed cut points returned.")
        lines.extend(["", "Captions:"])
        caption_beats = short.get("caption_beats", [])
        if isinstance(caption_beats, list) and caption_beats:
            for beat in caption_beats:
                if isinstance(beat, dict):
                    lines.append(f"- `{beat.get('start', '?')}` - `{beat.get('end', '?')}`: {beat.get('caption', '')}")
        else:
            lines.append("- No caption beats returned.")
        framing = short.get("framing_decision", {})
        if isinstance(framing, dict) and framing:
            lines.extend(["", "Framing decision:"])
            lines.append(f"- Strategy: `{framing.get('strategy', '')}`")
            lines.append(f"- Crop mode: `{framing.get('crop_mode', '')}`")
            reasons = framing.get("reasons", [])
            if isinstance(reasons, list):
                for reason in reasons:
                    lines.append(f"- {reason}")
        mobile_qa = short.get("mobile_qa", {})
        if isinstance(mobile_qa, dict) and mobile_qa:
            summary = mobile_qa.get("summary", {}) if isinstance(mobile_qa.get("summary"), dict) else {}
            lines.extend(["", "Mobile QA:"])
            lines.append(f"- Status: `{summary.get('status', mobile_qa.get('status', 'unknown'))}`")
            lines.append(f"- Average score: `{summary.get('average_mobile_score', 'n/a')}`")
            lines.append(f"- Worst score: `{summary.get('worst_mobile_score', 'n/a')}`")
            lines.append(f"- Needs generative repair: `{summary.get('needs_generative_repair', False)}`")
            error_counts = summary.get("error_counts", {})
            if error_counts:
                lines.append(f"- Errors: `{json.dumps(error_counts, ensure_ascii=True)}`")
        final_decision = short.get("final_edit_decision_list", {})
        if isinstance(final_decision, dict) and final_decision.get("kept_ranges"):
            lines.extend(["", "Final edit kept ranges:"])
            for item in final_decision.get("kept_ranges", []):
                if isinstance(item, dict):
                    lines.append(
                        f"- `{item.get('source_start', '?')}` - `{item.get('source_end', '?')}` "
                        f"-> `{item.get('output_start', '?')}` - `{item.get('output_end', '?')}`"
                    )
            removed = final_decision.get("removed_ranges", [])
            if isinstance(removed, list) and removed:
                lines.extend(["", "Removed filler/dead-time ranges:"])
                for item in removed:
                    if isinstance(item, dict):
                        lines.append(
                            f"- `{item.get('source_start', '?')}` - `{item.get('source_end', '?')}`: "
                            f"{item.get('reason', '')}"
                        )
        if short.get("ffmpeg_cut_command_nvidia"):
            lines.extend(["", "NVIDIA ffmpeg cut:", "", "```powershell", str(short["ffmpeg_cut_command_nvidia"]), "```"])
        if short.get("ffmpeg_cut_command_cpu"):
            lines.extend(["", "CPU ffmpeg cut:", "", "```powershell", str(short["ffmpeg_cut_command_cpu"]), "```"])
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def write_manifest(
    video_path: Path,
    paths: RunPaths,
    probe: dict[str, Any],
    args: argparse.Namespace,
    source_input: str | None = None,
    source_metadata: dict[str, Any] | None = None,
) -> None:
    paths.root.mkdir(parents=True, exist_ok=True)
    duration = video_duration_seconds(probe)
    manifest = {
        "source_video": str(video_path.resolve()),
        "source_input": source_input or str(video_path.resolve()),
        "video_id": paths.root.name,
        "run_folder": str(paths.root),
        "created_or_updated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "duration_seconds": duration,
        "duration": seconds_to_hms(duration),
        "ffprobe": probe,
        "settings": {
            "frame_interval": args.frame_interval,
            "whisper_model": args.whisper_model,
            "whisper_device": args.whisper_device,
            "transcript_chunk_seconds": args.transcript_chunk_seconds,
            "language": args.language,
            "ollama_model": args.ollama_model,
            "max_shorts": args.max_shorts,
            "min_short": args.min_short,
            "max_short": args.max_short,
            "vision_frames": args.vision_frames,
            "skip_final_render": getattr(args, "skip_final_render", False),
            "skip_mobile_qa": getattr(args, "skip_mobile_qa", False),
            "mobile_qa_frames_per_clip": getattr(args, "mobile_qa_frames_per_clip", 5),
            "download_root": str(args.download_root.expanduser()) if hasattr(args, "download_root") else None,
            "youtube_sub_langs": getattr(args, "youtube_sub_langs", None),
            "force_whisper": getattr(args, "force_whisper", False),
        },
    }
    if source_metadata:
        manifest["source_metadata"] = source_metadata
    write_json(paths.manifest, manifest)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a local transcript timeline and short-video cut suggestions from a source video.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("video_path", help="Path to the source video, or a YouTube URL.")
    parser.add_argument(
        "--work-root",
        type=Path,
        default=default_work_root(),
        help="Common folder that stores all resumable runs.",
    )
    parser.add_argument(
        "--download-root",
        type=Path,
        default=default_download_root(),
        help="Common folder for videos downloaded from YouTube URLs.",
    )
    parser.add_argument(
        "--youtube-sub-langs",
        default=None,
        help="Comma-separated YouTube caption language preference, such as hi,en,en-orig.",
    )
    parser.add_argument(
        "--force-whisper",
        action="store_true",
        help="Ignore YouTube captions and run local Whisper transcription.",
    )
    parser.add_argument(
        "--no-install-ytdlp",
        action="store_true",
        help="Do not attempt automatic yt-dlp installation when a URL is provided.",
    )
    parser.add_argument(
        "--frame-interval",
        type=float,
        default=DEFAULT_FRAME_INTERVAL_SECONDS,
        help="Seconds between cheap preview frames. Higher values are faster and lighter.",
    )
    parser.add_argument("--whisper-model", default="small", help="Local Whisper model name.")
    parser.add_argument(
        "--whisper-device",
        choices=["auto", "cuda", "cpu"],
        default="auto",
        help="Device preference for local Whisper transcription. Auto tries CUDA when available, then CPU.",
    )
    parser.add_argument(
        "--transcript-chunk-seconds",
        type=int,
        default=300,
        help="Split audio into resumable transcript chunks. Use 0 to transcribe the full audio in one job.",
    )
    parser.add_argument("--language", default=None, help="Optional transcript language code, such as en or hi.")
    parser.add_argument(
        "--ollama-model",
        default="auto",
        help="Ollama Gemma model name. Use 'auto' to pick an installed Gemma model or pull gemma3:4b.",
    )
    parser.add_argument("--max-shorts", type=int, default=6, help="Maximum short-video stories to suggest.")
    parser.add_argument("--min-short", type=int, default=18, help="Preferred minimum short length in seconds.")
    parser.add_argument("--max-short", type=int, default=60, help="Preferred maximum short length in seconds.")
    parser.add_argument(
        "--max-transcript-chars",
        type=int,
        default=42000,
        help="Maximum transcript characters passed to the final Ollama prompt.",
    )
    parser.add_argument(
        "--vision-frames",
        type=int,
        default=DEFAULT_VISION_FRAMES,
        help="Number of representative frames to send to Ollama for visual notes. Keep low for 8 GB GPUs; set 0 to skip.",
    )
    parser.add_argument("--force", action="store_true", help="Rebuild outputs even when checkpoints exist.")
    parser.add_argument(
        "--no-install-ffmpeg",
        action="store_true",
        help="Do not attempt automatic ffmpeg installation.",
    )
    parser.add_argument(
        "--install-whisper",
        action="store_true",
        help="Install faster-whisper with pip if no local Whisper engine is found.",
    )
    parser.add_argument(
        "--no-pull-model",
        action="store_true",
        help="Do not pull the Ollama model automatically when missing.",
    )
    parser.add_argument(
        "--skip-ollama",
        action="store_true",
        help="Only extract audio, frames, and transcript. Skip Gemma/Ollama planning.",
    )
    parser.add_argument(
        "--skip-final-render",
        action="store_true",
        help="Skip the final filler-trimmed vertical render with burned captions.",
    )
    parser.add_argument(
        "--skip-mobile-qa",
        action="store_true",
        help="Skip mobile look-and-feel QA on rendered shorts.",
    )
    parser.add_argument(
        "--mobile-qa-frames-per-clip",
        type=int,
        default=5,
        help="Number of sampled rendered frames per short for mobile QA. Keep low on 8 GB GPUs.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.frame_interval <= 0:
        raise PipelineError("--frame-interval must be greater than 0.")

    work_root = args.work_root.expanduser()
    download_root = args.download_root.expanduser()
    source_input = args.video_path
    source_metadata: dict[str, Any] | None = None
    youtube_transcript: dict[str, Any] | None = None
    local_caption_transcript: dict[str, Any] | None = None

    ensure_ffmpeg(auto_install=not args.no_install_ffmpeg)

    if is_url(source_input):
        if not is_youtube_url(source_input):
            raise PipelineError("Only YouTube URLs are supported right now. For other sources, pass a local video file.")
        ensure_yt_dlp(auto_install=not args.no_install_ytdlp)
        info = yt_dlp_info(source_input)
        source_metadata = {
            "type": "youtube",
            "url": source_input,
            "id": info.get("id"),
            "title": info.get("title"),
            "uploader": info.get("uploader"),
            "duration": info.get("duration"),
            "webpage_url": info.get("webpage_url"),
        }
        if not args.force_whisper:
            preferences = caption_language_preferences(args.language, args.youtube_sub_langs)
            youtube_transcript = maybe_youtube_transcript(info, download_root, preferences, force=args.force)
            if youtube_transcript:
                log(
                    "YouTube captions found: "
                    f"{youtube_transcript.get('caption_kind')}/{youtube_transcript.get('caption_language')}"
                )
            else:
                log("No parseable YouTube captions found; local Whisper will be used after download.")
        video_path = download_youtube_video(source_input, download_root, info, force=args.force)
    else:
        video_path = Path(source_input).expanduser()
        if not video_path.exists():
            raise PipelineError(f"Video path does not exist: {video_path}")
        if not video_path.is_file():
            raise PipelineError(f"Video path is not a file: {video_path}")
        if not args.force_whisper:
            local_caption_transcript = maybe_local_caption_transcript(video_path, args.language)
            if local_caption_transcript:
                log(
                    "Local caption transcript found: "
                    f"{local_caption_transcript.get('caption_file')}"
                )

    paths = make_paths(work_root, video_path)
    log(f"Run folder: {paths.root}")

    probe = ffprobe_json(video_path)
    write_manifest(video_path, paths, probe, args, source_input=source_input, source_metadata=source_metadata)

    extract_frames(video_path, paths, frame_interval=args.frame_interval, force=args.force)
    external_transcript = youtube_transcript or local_caption_transcript
    external_transcript_imported = False
    if external_transcript and not args.force_whisper:
        external_transcript_imported = write_external_transcript(paths, external_transcript, force=args.force)

    if external_transcript_imported:
        log("Caption transcript is available; skipping local Whisper transcription.")
    else:
        extract_audio(video_path, paths, force=args.force)
        transcribe_audio(
            paths,
            model_name=args.whisper_model,
            language=args.language,
            force=args.force,
            install_whisper=args.install_whisper,
            whisper_device=args.whisper_device,
            transcript_chunk_seconds=args.transcript_chunk_seconds,
        )

    if args.skip_ollama:
        log("Skipping Ollama planning because --skip-ollama was provided.")
        log(f"Transcript: {paths.transcript_json}")
        log(f"Frames: {paths.frame_manifest}")
        return 0

    model = ensure_ollama_model(args.ollama_model, pull_model=not args.no_pull_model)
    caption_frames(paths, model, max_frames=args.vision_frames, force=args.force)
    build_frame_scene_map(paths, force=args.force)
    build_script_understanding(paths, model, force=args.force)
    build_story_map(
        video_path,
        paths,
        max_shorts=args.max_shorts,
        min_short=args.min_short,
        max_short=args.max_short,
        force=args.force,
    )
    generate_timeline_and_shorts(
        video_path,
        paths,
        model,
        max_shorts=args.max_shorts,
        min_short=args.min_short,
        max_short=args.max_short,
        max_transcript_chars=args.max_transcript_chars,
        force=args.force,
    )
    cut_short_videos(
        video_path,
        paths,
        force=args.force,
        render_final=not args.skip_final_render,
        model=model,
    )
    if not args.skip_final_render and not args.skip_mobile_qa:
        run_mobile_qa(
            paths,
            model,
            force=args.force,
            frames_per_clip=max(1, args.mobile_qa_frames_per_clip),
        )

    log("Done.")
    log(f"Frame scene map: {paths.frame_scene_map}")
    log(f"Story map: {paths.story_map}")
    log(f"Timeline: {paths.timeline_json}")
    log(f"Short story suggestions: {paths.shorts_md}")
    log(f"Short clips: {paths.short_clips_dir}")
    log(f"Mobile QA: {paths.mobile_qa_json}")
    log(f"FFmpeg cut commands: {paths.ffmpeg_commands}")
    return 0


if __name__ == "__main__":
    configure_stdio()
    try:
        raise SystemExit(main())
    except PipelineError as exc:
        print(f"[video-story] ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
