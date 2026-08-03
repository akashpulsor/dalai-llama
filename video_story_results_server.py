#!/usr/bin/env python3
"""
Local dashboard for video_short_story_planner.py results.

Run:
  python video_story_results_server.py --open
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


DEFAULT_RUN_ROOT = Path.home() / "workspace" / "v5" / "_video_story_runs"
DEFAULT_UPLOAD_ROOT = Path.home() / "workspace" / "v5" / "uploaded video"
PLANNER_SCRIPT = Path.home() / "workspace" / "v5" / "video_short_story_planner.py"
DEFAULT_SUBTITLE_LANGS = "hi,en"
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".webm", ".mov", ".avi", ".m4v"}
FAST_FRAME_INTERVAL_SECONDS = 10
FAST_VISION_FRAMES = 6


STEP_LABELS = {
    "audio": "Audio",
    "frames": "Frames",
    "transcript": "Transcript",
    "frame_captions": "Frame Notes",
    "frame_scene_map": "Frame Scene Map",
    "script_understanding": "Script Understanding",
    "story_map": "Story Map",
    "timeline_and_shorts": "Timeline + Shorts",
    "short_clips": "Short Clips",
    "mobile_qa": "Mobile QA",
}


def configure_stdio() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is not None and hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


def read_json(path: Path, default: Any) -> Any:
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"_error": str(exc)}
    return default


def read_text(path: Path, limit: int = 500_000) -> str:
    try:
        if not path.exists():
            return ""
        text = path.read_text(encoding="utf-8", errors="replace")
        if len(text) > limit:
            return text[:limit] + "\n\n[truncated in dashboard]"
        return text
    except Exception as exc:
        return f"[could not read {path.name}: {exc}]"


def file_info(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"exists": False}
    stat = path.stat()
    return {
        "exists": True,
        "size": stat.st_size,
        "modified": stat.st_mtime,
    }


def newest_mtime(paths: list[Path]) -> float:
    values = []
    for path in paths:
        try:
            if path.exists():
                values.append(path.stat().st_mtime)
        except OSError:
            pass
    return max(values) if values else 0.0


def rel_file(run_name: str, relative_path: str) -> str:
    return "/file?" + urllib.parse.urlencode({"run": run_name, "path": relative_path})


def safe_upload_filename(filename: str) -> str:
    name = filename.replace("\\", "/").split("/")[-1].strip()
    name = re.sub(r"[^A-Za-z0-9._ -]+", "_", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    if not name:
        name = "uploaded_video.mp4"
    if "." not in name:
        name += ".mp4"
    return name


def unique_upload_path(upload_root: Path, filename: str) -> Path:
    upload_root.mkdir(parents=True, exist_ok=True)
    base = safe_upload_filename(filename)
    candidate = upload_root / base
    if not candidate.exists():
        return candidate
    stem = candidate.stem
    suffix = candidate.suffix
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    for index in range(1, 1000):
        next_candidate = upload_root / f"{stem}_{timestamp}_{index}{suffix}"
        if not next_candidate.exists():
            return next_candidate
    raise RuntimeError("Could not choose a unique upload filename.")


def windows_to_git_bash(path: Path | str) -> str:
    text = str(path)
    match = re.match(r"^([A-Za-z]):\\(.*)$", text)
    if not match:
        return text.replace("\\", "/")
    return "/" + match.group(1).lower() + "/" + match.group(2).replace("\\", "/")


def planner_command_for_video(path: Path | str) -> str:
    return (
        f'PYTHONUTF8=1 python {windows_to_git_bash(PLANNER_SCRIPT)} '
        f'"{windows_to_git_bash(path)}" --install-whisper --ollama-model gemma3:4b '
        f'--frame-interval {FAST_FRAME_INTERVAL_SECONDS} --vision-frames {FAST_VISION_FRAMES}'
    )


def path_from_client(value: str) -> Path:
    text = (value or "").strip()
    git_bash_match = re.match(r"^/([A-Za-z])/(.*)$", text)
    if git_bash_match:
        drive = git_bash_match.group(1).upper()
        rest = git_bash_match.group(2).replace("/", "\\")
        return Path(f"{drive}:\\{rest}")
    return Path(text)


def safe_uploaded_video_path(upload_root: Path, raw_path: str) -> Path:
    if not raw_path:
        raise ValueError("Missing video path.")
    candidate = path_from_client(raw_path).expanduser().resolve()
    root = upload_root.resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise ValueError("Only videos inside the upload/download folder can be run from this dashboard.") from exc
    if not candidate.exists() or not candidate.is_file():
        raise FileNotFoundError(str(candidate))
    if candidate.suffix.lower() not in VIDEO_EXTENSIONS:
        raise ValueError("Choose a video file, not a subtitle or log file.")
    return candidate


def process_exists(pid: int) -> bool:
    if pid <= 0:
        return False
    if os.name == "nt":
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        return result.returncode == 0 and f'"{pid}"' in result.stdout
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def pipeline_lock_path(upload_root: Path, video_path: Path) -> Path:
    digest = hashlib.sha1(str(video_path.resolve()).encode("utf-8", errors="replace")).hexdigest()[:16]
    return upload_root / "_pipeline_logs" / f"active_{digest}.json"


def read_pipeline_lock(upload_root: Path, video_path: Path) -> dict[str, Any] | None:
    lock_path = pipeline_lock_path(upload_root, video_path)
    if not lock_path.exists():
        return None
    try:
        lock = json.loads(lock_path.read_text(encoding="utf-8"))
    except Exception:
        return None
    pid = int(lock.get("pid") or 0)
    if process_exists(pid):
        lock["already_running"] = True
        lock["lock_path"] = str(lock_path)
        return lock
    try:
        lock_path.unlink()
    except OSError:
        pass
    return None


def write_pipeline_lock(upload_root: Path, video_path: Path, pipeline: dict[str, Any]) -> None:
    lock_path = pipeline_lock_path(upload_root, video_path)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path.write_text(json.dumps(pipeline, indent=2, ensure_ascii=True), encoding="utf-8")


def start_pipeline(upload_root: Path, raw_path: str) -> dict[str, Any]:
    video_path = safe_uploaded_video_path(upload_root, raw_path)
    if not PLANNER_SCRIPT.exists():
        raise FileNotFoundError(str(PLANNER_SCRIPT))

    log_root = upload_root / "_pipeline_logs"
    log_root.mkdir(parents=True, exist_ok=True)
    active = read_pipeline_lock(upload_root, video_path)
    if active:
        active["started"] = False
        active["message"] = f"Pipeline is already running for this video as PID {active.get('pid')}."
        return active

    log_stem = safe_folder_name(f"{video_path.stem}_{time.strftime('%Y%m%d_%H%M%S')}", "pipeline")
    stdout_log = log_root / f"{log_stem}.out.log"
    stderr_log = log_root / f"{log_stem}.err.log"
    command = [
        sys.executable,
        str(PLANNER_SCRIPT),
        str(video_path),
        "--install-whisper",
        "--ollama-model",
        "gemma3:4b",
        "--frame-interval",
        str(FAST_FRAME_INTERVAL_SECONDS),
        "--vision-frames",
        str(FAST_VISION_FRAMES),
    ]
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0

    with stdout_log.open("ab") as stdout_handle, stderr_log.open("ab") as stderr_handle:
        header = (
            f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
            f"Starting: {planner_command_for_video(video_path)}\n\n"
        ).encode("utf-8", errors="replace")
        stdout_handle.write(header)
        process = subprocess.Popen(
            command,
            cwd=str(PLANNER_SCRIPT.parent),
            stdout=stdout_handle,
            stderr=stderr_handle,
            env=env,
            creationflags=creationflags,
        )

    pipeline = {
        "started": True,
        "already_running": False,
        "pid": process.pid,
        "video_path": str(video_path),
        "video_git_bash_path": windows_to_git_bash(video_path),
        "planner_command": planner_command_for_video(video_path),
        "stdout_log": str(stdout_log),
        "stderr_log": str(stderr_log),
        "stdout_log_git_bash_path": windows_to_git_bash(stdout_log),
        "stderr_log_git_bash_path": windows_to_git_bash(stderr_log),
    }
    write_pipeline_lock(upload_root, video_path, pipeline)
    return pipeline


def parse_content_disposition(value: str) -> dict[str, str]:
    parts = [part.strip() for part in value.split(";")]
    parsed: dict[str, str] = {}
    for part in parts[1:]:
        if "=" not in part:
            continue
        key, raw = part.split("=", 1)
        raw = raw.strip()
        if raw.startswith('"') and raw.endswith('"'):
            raw = raw[1:-1]
        parsed[key.strip().lower()] = raw
    return parsed


def save_multipart_upload(upload_root: Path, content_type: str, body: bytes) -> dict[str, Any]:
    match = re.search(r'boundary="?([^";]+)"?', content_type)
    if not match:
        raise ValueError("Missing multipart boundary.")
    boundary = ("--" + match.group(1)).encode("utf-8")
    parts = body.split(boundary)
    for part in parts:
        part = part.strip()
        if not part or part == b"--":
            continue
        if part.endswith(b"--"):
            part = part[:-2].rstrip()
        if b"\r\n\r\n" not in part:
            continue
        header_blob, file_bytes = part.split(b"\r\n\r\n", 1)
        headers: dict[str, str] = {}
        for raw_line in header_blob.decode("utf-8", errors="replace").split("\r\n"):
            if ":" in raw_line:
                key, value = raw_line.split(":", 1)
                headers[key.strip().lower()] = value.strip()
        disposition = parse_content_disposition(headers.get("content-disposition", ""))
        if disposition.get("name") != "video" or not disposition.get("filename"):
            continue
        if file_bytes.endswith(b"\r\n"):
            file_bytes = file_bytes[:-2]
        target = unique_upload_path(upload_root, disposition["filename"])
        temp_path = target.with_suffix(target.suffix + ".tmp")
        temp_path.write_bytes(file_bytes)
        temp_path.replace(target)
        return {
            "filename": target.name,
            "path": str(target),
            "git_bash_path": windows_to_git_bash(target),
            "size": target.stat().st_size,
            "modified": target.stat().st_mtime,
        }
    raise ValueError("No uploaded file field named 'video' was found.")


def list_uploads(upload_root: Path) -> list[dict[str, Any]]:
    if not upload_root.exists():
        return []
    uploads = []
    for path in upload_root.rglob("*"):
        if not path.is_file():
            continue
        info = file_info(path)
        relative_name = str(path.relative_to(upload_root))
        uploads.append(
            {
                "name": relative_name,
                "path": str(path),
                "git_bash_path": windows_to_git_bash(path),
                "size": info.get("size"),
                "modified": info.get("modified"),
            }
        )
    uploads.sort(key=lambda item: item.get("modified") or 0, reverse=True)
    return uploads


def read_text_tail(path: Path, byte_limit: int = 20000) -> str:
    try:
        size = path.stat().st_size
        with path.open("rb") as handle:
            if size > byte_limit:
                handle.seek(size - byte_limit)
                prefix = "[showing latest log output]\n"
            else:
                prefix = ""
            return prefix + handle.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return f"[could not read {path.name}: {exc}]"


def list_pipeline_logs(upload_root: Path, limit: int = 8) -> list[dict[str, Any]]:
    log_root = upload_root / "_pipeline_logs"
    if not log_root.exists():
        return []
    logs = []
    for path in sorted(log_root.glob("*.log"), key=lambda item: item.stat().st_mtime, reverse=True)[:limit]:
        info = file_info(path)
        logs.append(
            {
                "name": path.name,
                "path": str(path),
                "git_bash_path": windows_to_git_bash(path),
                "size": info.get("size"),
                "modified": info.get("modified"),
                "content": read_text_tail(path),
            }
        )
    return logs


def safe_folder_name(value: str, fallback: str = "downloaded_video") -> str:
    name = re.sub(r"[^A-Za-z0-9._ -]+", "_", value or "")
    name = re.sub(r"\s+", "_", name).strip(" ._-")
    if not name:
        name = fallback
    return name[:120]


def tail_text(value: str, limit: int = 4000) -> str:
    if len(value) <= limit:
        return value
    return value[-limit:]


def run_command(command: list[str], timeout: int) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
    )


def yt_dlp_command() -> list[str]:
    command = [sys.executable, "-m", "yt_dlp"]
    if shutil.which("node"):
        command.extend(["--js-runtimes", "node"])
    return command


def ensure_yt_dlp() -> str:
    version = run_command(yt_dlp_command() + ["--version"], timeout=60)
    if version.returncode == 0:
        return version.stdout.strip()
    install = run_command([sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"], timeout=600)
    if install.returncode != 0:
        raise RuntimeError("yt-dlp is not installed and automatic install failed:\n" + tail_text(install.stderr or install.stdout))
    version = run_command(yt_dlp_command() + ["--version"], timeout=60)
    if version.returncode != 0:
        raise RuntimeError("yt-dlp install finished, but yt-dlp still could not run:\n" + tail_text(version.stderr or version.stdout))
    return version.stdout.strip()


def ytdlp_info(url: str) -> dict[str, Any]:
    result = run_command(yt_dlp_command() + ["--dump-single-json", "--no-playlist", "--no-warnings", url], timeout=180)
    if result.returncode != 0:
        raise RuntimeError("Could not read video info:\n" + tail_text(result.stderr or result.stdout))
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("yt-dlp returned invalid metadata JSON.") from exc


def download_link_to_uploads(upload_root: Path, url: str, sub_langs: str = DEFAULT_SUBTITLE_LANGS) -> dict[str, Any]:
    parsed = urllib.parse.urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Paste a valid http or https video link.")

    ytdlp_version = ensure_yt_dlp()
    info = ytdlp_info(url)
    title = str(info.get("title") or parsed.netloc or "downloaded_video")
    video_id = str(info.get("id") or time.strftime("%Y%m%d_%H%M%S"))
    folder_name = safe_folder_name(f"{title}_{video_id}")
    target_dir = upload_root / folder_name
    target_dir.mkdir(parents=True, exist_ok=True)

    requested_langs = (sub_langs or DEFAULT_SUBTITLE_LANGS).strip() or DEFAULT_SUBTITLE_LANGS
    output_template = str(target_dir / "source.%(ext)s")
    video_command = yt_dlp_command() + [
        "--no-playlist",
        "-f",
        "bv*+ba/best",
        "--merge-output-format",
        "mp4",
        "-o",
        output_template,
        url,
    ]
    video_result = run_command(video_command, timeout=3600)
    if video_result.returncode != 0:
        raise RuntimeError("Video download failed:\n" + tail_text(video_result.stderr or video_result.stdout))

    subtitle_error = ""
    subtitle_command = yt_dlp_command() + [
        "--no-playlist",
        "--skip-download",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs",
        requested_langs,
        "--sub-format",
        "srt/best",
        "--convert-subs",
        "srt",
        "-o",
        output_template,
        url,
    ]
    subtitle_result = run_command(subtitle_command, timeout=600)
    if subtitle_result.returncode != 0:
        subtitle_error = tail_text(subtitle_result.stderr or subtitle_result.stdout)

    video_files = sorted(
        [path for path in target_dir.glob("source.*") if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS],
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    srt_files = sorted(target_dir.glob("*.srt"))
    subtitle_files = sorted([path for path in target_dir.glob("*") if path.suffix.lower() in {".srt", ".vtt", ".ttml"}])
    video_path = video_files[0] if video_files else None

    return {
        "url": url,
        "title": title,
        "id": video_id,
        "folder": str(target_dir),
        "folder_git_bash_path": windows_to_git_bash(target_dir),
        "path": str(video_path) if video_path else "",
        "git_bash_path": windows_to_git_bash(video_path) if video_path else "",
        "srt_paths": [str(path) for path in srt_files],
        "subtitle_paths": [str(path) for path in subtitle_files],
        "subtitle_git_bash_paths": [windows_to_git_bash(path) for path in subtitle_files],
        "requested_sub_langs": requested_langs,
        "subtitle_error": "" if srt_files else subtitle_error,
        "yt_dlp_version": ytdlp_version,
        "planner_command": planner_command_for_video(video_path) if video_path else "",
        "stdout_tail": tail_text(video_result.stdout + "\n" + subtitle_result.stdout),
        "stderr_tail": tail_text(video_result.stderr + "\n" + subtitle_result.stderr),
    }


def default_file_map(run_dir: Path) -> dict[str, Path]:
    return {
        "manifest": run_dir / "manifest.json",
        "state": run_dir / "state.json",
        "audio": run_dir / "audio" / "audio_16khz_mono.wav",
        "frames": run_dir / "frames" / "frames.json",
        "frame_captions": run_dir / "analysis" / "frame_captions.json",
        "frame_scene_map": run_dir / "analysis" / "frame_scene_map.json",
        "script_understanding": run_dir / "analysis" / "script_understanding.json",
        "story_map": run_dir / "outputs" / "story_map.json",
        "transcript_json": run_dir / "transcript" / "transcript.json",
        "transcript_txt": run_dir / "transcript" / "transcript.txt",
        "transcript_srt": run_dir / "transcript" / "transcript.srt",
        "timeline": run_dir / "outputs" / "timeline.json",
        "shorts_json": run_dir / "outputs" / "short_video_stories.json",
        "shorts_md": run_dir / "outputs" / "short_video_stories.md",
        "mobile_qa_json": run_dir / "outputs" / "mobile_qa_report.json",
        "mobile_qa_md": run_dir / "outputs" / "mobile_qa_report.md",
        "ffmpeg_commands": run_dir / "outputs" / "ffmpeg_cut_commands.txt",
    }


def summarize_run(run_root: Path, run_dir: Path) -> dict[str, Any]:
    run_name = run_dir.name
    files = default_file_map(run_dir)
    manifest = read_json(files["manifest"], {})
    state = read_json(files["state"], {"steps": {}})
    frame_files = sorted((run_dir / "frames").glob("frame_*.jpg"))
    output_files = [path for path in (run_dir / "outputs").glob("*") if path.is_file()] if (run_dir / "outputs").exists() else []
    clip_files = sorted((run_dir / "outputs" / "short_clips").glob("*.mp4"))
    watched = list(files.values()) + frame_files[:1] + output_files + clip_files[:1]

    steps = []
    done_steps = state.get("steps", {}) if isinstance(state, dict) else {}
    for key, label in STEP_LABELS.items():
        raw = done_steps.get(key, {}) if isinstance(done_steps, dict) else {}
        steps.append(
            {
                "key": key,
                "label": label,
                "done": bool(raw.get("done")),
                "updated_at": raw.get("updated_at", ""),
                "details": raw.get("details", {}),
            }
        )

    return {
        "name": run_name,
        "path": str(run_dir),
        "video": manifest.get("source_video", ""),
        "duration": manifest.get("duration", ""),
        "duration_seconds": manifest.get("duration_seconds"),
        "latest_modified": newest_mtime(watched),
        "steps": steps,
        "completed_steps": sum(1 for item in steps if item["done"]),
        "total_steps": len(steps),
        "frame_count": len(frame_files),
        "has_transcript": files["transcript_txt"].exists() or files["transcript_json"].exists(),
        "has_shorts": files["shorts_json"].exists() or files["shorts_md"].exists(),
        "has_timeline": files["timeline"].exists(),
        "short_clip_count": len(clip_files),
        "files": {key: file_info(path) for key, path in files.items()},
    }


def list_runs(run_root: Path) -> list[dict[str, Any]]:
    if not run_root.exists():
        return []
    runs = [summarize_run(run_root, path) for path in run_root.iterdir() if path.is_dir()]
    runs.sort(key=lambda item: item.get("latest_modified") or 0, reverse=True)
    return runs


def run_details(run_root: Path, run_name: str) -> dict[str, Any]:
    run_dir = safe_run_dir(run_root, run_name)
    summary = summarize_run(run_root, run_dir)
    files = default_file_map(run_dir)
    frame_manifest = read_json(files["frames"], {"frames": []})
    frame_rows = frame_manifest.get("frames", []) if isinstance(frame_manifest, dict) else []
    if not frame_rows:
        frame_rows = [
            {
                "index": index + 1,
                "timestamp": "",
                "timestamp_seconds": None,
                "path": str(path),
            }
            for index, path in enumerate(sorted((run_dir / "frames").glob("frame_*.jpg")))
        ]

    frame_preview = []
    for row in frame_rows[:36]:
        source_path = Path(str(row.get("path", "")))
        try:
            relative = source_path.resolve().relative_to(run_dir.resolve()).as_posix()
        except Exception:
            relative = f"frames/frame_{int(row.get('index', 0)):06d}.jpg"
        frame_preview.append(
            {
                "index": row.get("index"),
                "timestamp": row.get("timestamp", ""),
                "timestamp_seconds": row.get("timestamp_seconds"),
                "url": rel_file(run_name, relative),
            }
        )

    details = dict(summary)
    clip_files = sorted((run_dir / "outputs" / "short_clips").glob("*.mp4"))
    short_clips = []
    for clip in clip_files:
        relative = clip.relative_to(run_dir).as_posix()
        info = file_info(clip)
        short_clips.append(
            {
                "name": clip.name,
                "path": str(clip),
                "url": rel_file(run_name, relative),
                "size": info.get("size"),
                "modified": info.get("modified"),
            }
        )
    details.update(
        {
            "manifest": read_json(files["manifest"], {}),
            "state": read_json(files["state"], {"steps": {}}),
            "transcript_text": read_text(files["transcript_txt"]),
            "timeline": read_json(files["timeline"], {}),
            "shorts": read_json(files["shorts_json"], {}),
            "shorts_markdown": read_text(files["shorts_md"]),
            "ffmpeg_commands": read_text(files["ffmpeg_commands"]),
            "script_understanding": read_json(files["script_understanding"], {}),
            "frame_captions": read_json(files["frame_captions"], {}),
            "frame_scene_map": read_json(files["frame_scene_map"], {}),
            "story_map": read_json(files["story_map"], {}),
            "mobile_qa": read_json(files["mobile_qa_json"], {}),
            "mobile_qa_markdown": read_text(files["mobile_qa_md"]),
            "short_clips": short_clips,
            "frame_preview": frame_preview,
            "links": {
                key: rel_file(run_name, str(path.relative_to(run_dir)).replace(os.sep, "/"))
                for key, path in files.items()
                if path.exists()
            },
        }
    )
    return details


def safe_run_dir(run_root: Path, run_name: str) -> Path:
    candidate = (run_root / run_name).resolve()
    root = run_root.resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise FileNotFoundError("run outside root") from exc
    if not candidate.exists() or not candidate.is_dir():
        raise FileNotFoundError(run_name)
    return candidate


def safe_file_path(run_root: Path, run_name: str, relative_path: str) -> Path:
    run_dir = safe_run_dir(run_root, run_name)
    clean_relative = relative_path.replace("\\", "/").lstrip("/")
    candidate = (run_dir / clean_relative).resolve()
    try:
        candidate.relative_to(run_dir.resolve())
    except ValueError as exc:
        raise FileNotFoundError("file outside run") from exc
    if not candidate.exists() or not candidate.is_file():
        raise FileNotFoundError(relative_path)
    return candidate


def rel_file_for_path(run_dir: Path, run_name: str, path_value: Any) -> str:
    if not path_value:
        return ""
    path = Path(str(path_value))
    try:
        relative = path.resolve().relative_to(run_dir.resolve()).as_posix()
    except Exception:
        return ""
    return rel_file(run_name, relative)


def html_list(items: Any) -> str:
    if not isinstance(items, list) or not items:
        return '<div class="empty">Not available.</div>'
    return "<ul>" + "".join(f"<li>{html.escape(str(item))}</li>" for item in items) + "</ul>"


def html_dict_table(items: Any, keys: list[str] | None = None) -> str:
    if not isinstance(items, list) or not items:
        return '<div class="empty">Not available.</div>'
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        selected_keys = keys or list(item.keys())
        rows.append(
            "<tr>"
            + "".join(f"<td>{html.escape(str(item.get(key, '')))}</td>" for key in selected_keys)
            + "</tr>"
        )
    if not rows:
        return '<div class="empty">Not available.</div>'
    headers = "".join(f"<th>{html.escape(key.replace('_', ' ').title())}</th>" for key in (keys or []))
    header = f"<thead><tr>{headers}</tr></thead>" if headers else ""
    return f"<table>{header}<tbody>{''.join(rows)}</tbody></table>"


def render_clip_page(run_root: Path, run_name: str, rank_value: str) -> str:
    run_dir = safe_run_dir(run_root, run_name)
    shorts_payload = read_json(run_dir / "outputs" / "short_video_stories.json", {})
    shorts = shorts_payload.get("shorts", []) if isinstance(shorts_payload, dict) else []
    try:
        rank = int(rank_value)
    except ValueError as exc:
        raise FileNotFoundError("invalid clip rank") from exc
    short = next((item for item in shorts if isinstance(item, dict) and int(item.get("rank", -1)) == rank), None)
    if not short:
        raise FileNotFoundError("clip page")

    title = html.escape(str(short.get("title") or f"Short {rank}"))
    raw_clip_url = rel_file_for_path(run_dir, run_name, short.get("clip_path"))
    final_clip_url = rel_file_for_path(run_dir, run_name, short.get("final_clip_path"))
    clip_url = final_clip_url or raw_clip_url
    caption_url = rel_file_for_path(run_dir, run_name, short.get("final_caption_srt_path"))
    ass_caption_url = rel_file_for_path(run_dir, run_name, short.get("final_caption_ass_path"))
    raw_caption_url = rel_file_for_path(run_dir, run_name, short.get("caption_srt_path"))
    reasoning = short.get("selection_reasoning", {}) if isinstance(short.get("selection_reasoning"), dict) else {}
    plan = short.get("short_form_plan", {}) if isinstance(short.get("short_form_plan"), dict) else {}
    caption_plan = plan.get("caption_plan", {}) if isinstance(plan.get("caption_plan"), dict) else {}
    visual_plan = plan.get("visual_plan", {}) if isinstance(plan.get("visual_plan"), dict) else {}
    final_decision = short.get("final_edit_decision_list", {}) if isinstance(short.get("final_edit_decision_list"), dict) else {}
    framing = short.get("framing_decision", {}) if isinstance(short.get("framing_decision"), dict) else {}
    mobile_qa = short.get("mobile_qa", {}) if isinstance(short.get("mobile_qa"), dict) else {}
    mobile_qa_summary = mobile_qa.get("summary", {}) if isinstance(mobile_qa.get("summary"), dict) else {}
    mobile_qa_rows = []
    frame_reviews = mobile_qa.get("frame_reviews", []) if isinstance(mobile_qa.get("frame_reviews"), list) else []
    for review in frame_reviews:
        if not isinstance(review, dict):
            continue
        analysis = review.get("analysis", {}) if isinstance(review.get("analysis"), dict) else {}
        mobile_qa_rows.append(
            {
                "timestamp": review.get("timestamp", ""),
                "score": analysis.get("mobile_score", ""),
                "errors": ", ".join(str(item) for item in analysis.get("errors", []) if item) if isinstance(analysis.get("errors"), list) else "",
                "fix": analysis.get("suggested_fix", ""),
            }
        )

    video_html = (
        f'<video controls preload="metadata" src="{html.escape(clip_url)}"></video>'
        if clip_url
        else '<div class="empty">Clip file is not available yet.</div>'
    )
    caption_link = (
        f'<a class="button" href="{html.escape(caption_url)}" target="_blank" rel="noreferrer">Open Caption SRT</a>'
        if caption_url
        else ""
    )
    raw_caption_link = (
        f'<a class="button" href="{html.escape(raw_caption_url)}" target="_blank" rel="noreferrer">Open Raw SRT</a>'
        if raw_caption_url
        else ""
    )
    ass_caption_link = (
        f'<a class="button" href="{html.escape(ass_caption_url)}" target="_blank" rel="noreferrer">Open Bottom Caption ASS</a>'
        if ass_caption_url
        else ""
    )
    raw_clip_link = (
        f'<a class="button" href="{html.escape(raw_clip_url)}" target="_blank" rel="noreferrer">Open Raw MP4</a>'
        if raw_clip_url
        else ""
    )
    final_clip_link = (
        f'<a class="button primary" href="{html.escape(final_clip_url)}" target="_blank" rel="noreferrer">Open Final MP4</a>'
        if final_clip_url
        else ""
    )
    back_url = "/?" + urllib.parse.urlencode({"run": run_name})
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    :root {{
      --bg:#f6f7f9; --panel:#fff; --text:#18212f; --muted:#667085;
      --border:#d7dde6; --accent:#0f766e;
    }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; background:var(--bg); color:var(--text); font-family:Inter,Segoe UI,Arial,sans-serif; }}
    main {{ max-width:1180px; margin:0 auto; padding:22px; }}
    .top {{ display:flex; justify-content:space-between; gap:12px; align-items:start; margin-bottom:16px; }}
    h1 {{ margin:0 0 6px; font-size:26px; }}
    h2 {{ margin:0 0 10px; font-size:18px; }}
    .muted {{ color:var(--muted); }}
    .grid {{ display:grid; grid-template-columns:minmax(320px,0.95fr) minmax(320px,1.05fr); gap:14px; align-items:start; }}
    section {{ background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:14px; margin-bottom:14px; }}
    video {{ width:100%; max-height:72vh; background:#000; border-radius:8px; }}
    .button {{ display:inline-flex; align-items:center; border:1px solid var(--border); border-radius:6px; padding:8px 10px; color:var(--text); background:#fff; text-decoration:none; }}
    .primary {{ background:var(--accent); border-color:var(--accent); color:#fff; }}
    .toolbar {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }}
    table {{ width:100%; border-collapse:collapse; }}
    th,td {{ padding:8px; border-bottom:1px solid var(--border); text-align:left; vertical-align:top; }}
    pre {{ white-space:pre-wrap; overflow:auto; background:#111827; color:#edf2f7; border-radius:8px; padding:12px; }}
    .empty {{ color:var(--muted); padding:14px; border:1px dashed var(--border); border-radius:8px; }}
    @media (max-width:900px) {{ .grid {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
<main>
  <div class="top">
    <div>
      <h1>{title}</h1>
      <div class="muted">Rank {html.escape(str(rank))} · {html.escape(str(short.get("start", "?")))} to {html.escape(str(short.get("end", "?")))} · {html.escape(str(short.get("duration_seconds", "?")))}s</div>
    </div>
    <a class="button" href="/">Back To Dashboard</a>
  </div>
  <div class="grid">
    <div>
      <section>
        {video_html}
        <div class="toolbar">
          {final_clip_link}
          {raw_clip_link}
          {caption_link}
          {ass_caption_link}
          {raw_caption_link}
        </div>
      </section>
      <section>
        <h2>Framing Decision</h2>
        <p><strong>Strategy:</strong> {html.escape(str(framing.get("strategy", "not available")))}</p>
        <p><strong>Crop mode:</strong> {html.escape(str(framing.get("crop_mode", "")))}</p>
        <p><strong>Source:</strong> {html.escape(str(framing.get("source_width", "?")))}x{html.escape(str(framing.get("source_height", "?")))} -> 1080x1920</p>
        <p><strong>Caption position:</strong> {html.escape(str(framing.get("caption_position", "")))}</p>
        <h3>Why This Framing</h3>
        {html_list(framing.get("reasons"))}
        <h3>Framing Risks</h3>
        {html_list(framing.get("risks"))}
      </section>
      <section>
        <h2>Final Edit</h2>
        <p><strong>Final duration:</strong> {html.escape(str(short.get("final_duration_seconds", "not rendered")))}s</p>
        <p><strong>Removed:</strong> {html.escape(str(short.get("filler_removed_seconds", 0)))}s of filler, repeated setup, or no-caption dead time.</p>
        <p><strong>Status:</strong> {html.escape(str(short.get("final_render_status", "not rendered")))}</p>
        <h3>Kept Ranges</h3>
        {html_dict_table(final_decision.get("kept_ranges"), ["source_start", "source_end", "output_start", "output_end", "duration_seconds"])}
        <h3>Removed Ranges</h3>
        {html_dict_table(final_decision.get("removed_ranges"), ["source_start", "source_end", "duration_seconds", "reason"])}
      </section>
      <section>
        <h2>Mobile QA</h2>
        <p><strong>Status:</strong> {html.escape(str(mobile_qa_summary.get("status", mobile_qa.get("status", "not reviewed"))))}</p>
        <p><strong>Average score:</strong> {html.escape(str(mobile_qa_summary.get("average_mobile_score", "n/a")))}</p>
        <p><strong>Worst score:</strong> {html.escape(str(mobile_qa_summary.get("worst_mobile_score", "n/a")))}</p>
        <p><strong>Needs generative repair:</strong> {html.escape(str(mobile_qa_summary.get("needs_generative_repair", False)))}</p>
        <h3>Error Counts</h3>
        <pre><code>{html.escape(json.dumps(mobile_qa_summary.get("error_counts", {}), ensure_ascii=False, indent=2))}</code></pre>
        <h3>Editor Notes</h3>
        {html_list(mobile_qa_summary.get("editor_notes"))}
        <h3>Reviewed Frames</h3>
        {html_dict_table(mobile_qa_rows, ["timestamp", "score", "errors", "fix"])}
      </section>
      <section>
        <h2>Selection Reasoning</h2>
        <p>{html.escape(str(reasoning.get("editor_summary") or "No reasoning saved."))}</p>
        <h3>Why This Part</h3>
        {html_list(reasoning.get("reasons"))}
        <h3>Hook Basis</h3>
        <p>{html.escape(str(reasoning.get("hook_basis") or short.get("hook") or ""))}</p>
        <h3>Risks</h3>
        {html_list(reasoning.get("risks"))}
      </section>
    </div>
    <div>
      <section>
        <h2>Short-Form Conversion Plan</h2>
        <p>{html.escape(str(plan.get("goal") or ""))}</p>
        <p><strong>Strategy:</strong> {html.escape(str(plan.get("video_type_strategy") or ""))}</p>
        <h3>Story Structure</h3>
        {html_dict_table(plan.get("structure"), ["range", "purpose", "edit"])}
        <h3>Filler Removal</h3>
        {html_dict_table(plan.get("filler_removal"), ["action", "note"])}
      </section>
      <section>
        <h2>Caption Plan</h2>
        <p>{html.escape(str(caption_plan.get("style") or ""))}</p>
        {html_list(caption_plan.get("rules"))}
        <h3>First Caption Beats</h3>
        {html_dict_table(caption_plan.get("first_beats"), ["start", "end", "caption"])}
      </section>
      <section>
        <h2>Visual Plan</h2>
        {html_list(visual_plan.get("notes"))}
        <h3>Nearby Frames</h3>
        {html_dict_table(visual_plan.get("nearby_frames"), ["timestamp_seconds", "scene_type", "visual_description"])}
      </section>
      <section>
        <h2>Raw Short JSON</h2>
        <pre><code>{html.escape(json.dumps(short, ensure_ascii=False, indent=2))}</code></pre>
      </section>
    </div>
  </div>
</main>
</body>
</html>"""


class DashboardHandler(BaseHTTPRequestHandler):
    run_root: Path = DEFAULT_RUN_ROOT
    upload_root: Path = DEFAULT_UPLOAD_ROOT

    def log_message(self, fmt: str, *args: Any) -> None:
        print("[%s] %s" % (time.strftime("%H:%M:%S"), fmt % args), flush=True)

    def send_bytes(self, body: bytes, content_type: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, payload: Any, status: int = 200) -> None:
        self.send_bytes(json.dumps(payload, ensure_ascii=True).encode("utf-8"), "application/json; charset=utf-8", status)

    def send_text(self, text: str, status: int = 200) -> None:
        self.send_bytes(text.encode("utf-8"), "text/html; charset=utf-8", status)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        try:
            if parsed.path == "/":
                self.send_text(render_index(self.run_root, self.upload_root))
            elif parsed.path == "/clip-page":
                run_name = query.get("run", [""])[0]
                rank = query.get("rank", [""])[0]
                self.send_text(render_clip_page(self.run_root, run_name, rank))
            elif parsed.path == "/api/runs":
                self.send_json({"run_root": str(self.run_root), "runs": list_runs(self.run_root)})
            elif parsed.path == "/api/uploads":
                self.send_json({"upload_root": str(self.upload_root), "uploads": list_uploads(self.upload_root)})
            elif parsed.path == "/api/pipeline-logs":
                log_root = self.upload_root / "_pipeline_logs"
                self.send_json({"log_root": str(log_root), "logs": list_pipeline_logs(self.upload_root)})
            elif parsed.path == "/api/run":
                run_name = query.get("name", [""])[0]
                self.send_json(run_details(self.run_root, run_name))
            elif parsed.path == "/file":
                run_name = query.get("run", [""])[0]
                relative_path = query.get("path", [""])[0]
                target = safe_file_path(self.run_root, run_name, relative_path)
                content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
                self.send_bytes(target.read_bytes(), content_type)
            else:
                self.send_json({"error": "not found"}, status=404)
        except FileNotFoundError as exc:
            self.send_json({"error": str(exc) or "not found"}, status=404)
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=500)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            if parsed.path not in {"/upload", "/download-url", "/run-pipeline"}:
                self.send_json({"error": "not found"}, status=404)
                return
            content_length = int(self.headers.get("Content-Length", "0") or "0")
            if content_length <= 0:
                self.send_json({"error": "empty request"}, status=400)
                return
            body = self.rfile.read(content_length)
            if parsed.path == "/upload":
                content_type = self.headers.get("Content-Type", "")
                upload = save_multipart_upload(self.upload_root, content_type, body)
                upload["planner_command"] = planner_command_for_video(upload["path"])
                self.send_json({"uploaded": True, "upload": upload})
                return

            payload = json.loads(body.decode("utf-8", errors="replace"))
            if parsed.path == "/run-pipeline":
                pipeline = start_pipeline(self.upload_root, str(payload.get("path") or ""))
                self.send_json({"started": True, "pipeline": pipeline})
                return

            download = download_link_to_uploads(
                self.upload_root,
                str(payload.get("url") or ""),
                str(payload.get("sub_langs") or DEFAULT_SUBTITLE_LANGS),
            )
            self.send_json({"downloaded": True, "download": download})
        except Exception as exc:
            self.send_json({"uploaded": False, "downloaded": False, "started": False, "error": str(exc)}, status=500)


def render_index(run_root: Path, upload_root: Path) -> str:
    title = "Video Story Results"
    escaped_root = html.escape(str(run_root))
    escaped_upload_root = html.escape(str(upload_root))
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --panel-2: #eef2f6;
      --text: #18212f;
      --muted: #667085;
      --border: #d7dde6;
      --accent: #0f766e;
      --accent-2: #2f5f9b;
      --warn: #b45309;
      --good: #177245;
      --bad: #b42318;
      --shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      letter-spacing: 0;
    }}
    button, select, input {{ font: inherit; }}
    .app {{
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
    }}
    aside {{
      border-right: 1px solid var(--border);
      background: #fbfcfd;
      padding: 16px;
      overflow: auto;
      max-height: 100vh;
      position: sticky;
      top: 0;
    }}
    main {{
      min-width: 0;
      padding: 18px 22px 40px;
    }}
    .topbar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }}
    h1 {{
      font-size: 18px;
      line-height: 1.2;
      margin: 0 0 4px;
      font-weight: 700;
    }}
    h2 {{
      font-size: 16px;
      margin: 0 0 10px;
    }}
    h3 {{
      font-size: 14px;
      margin: 0 0 8px;
    }}
    .muted {{ color: var(--muted); }}
    .small {{ font-size: 12px; }}
    .toolbar {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }}
    .button {{
      min-height: 34px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      padding: 7px 10px;
      cursor: pointer;
      box-shadow: var(--shadow);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
    }}
    .button.primary {{
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }}
    .upload-panel {{
      margin-top: 14px;
      padding: 12px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }}
    .upload-panel input[type="file"],
    .upload-panel input[type="url"],
    .upload-panel input[type="text"] {{
      width: 100%;
      min-height: 36px;
      margin: 8px 0;
    }}
    .upload-panel input[type="url"],
    .upload-panel input[type="text"] {{
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      padding: 8px 10px;
    }}
    .panel-split {{
      border-top: 1px solid var(--border);
      margin: 12px 0;
    }}
    .upload-status {{
      min-height: 18px;
      overflow-wrap: anywhere;
    }}
    .video-list, .log-list {{
      display: grid;
      gap: 8px;
      margin-top: 8px;
    }}
    .video-row, .log-block {{
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #fbfcfd;
      padding: 9px;
    }}
    .video-row .toolbar {{
      margin-top: 8px;
    }}
    .log-head {{
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: start;
      margin-bottom: 6px;
    }}
    .log-pre {{
      max-height: 210px;
      margin: 0;
      font-size: 11px;
      padding: 9px;
    }}
    .run-list {{
      display: grid;
      gap: 8px;
      margin-top: 14px;
    }}
    .run-item {{
      width: 100%;
      text-align: left;
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      box-shadow: var(--shadow);
    }}
    .run-item.active {{
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.12);
    }}
    .run-title {{
      font-weight: 700;
      word-break: break-word;
      margin-bottom: 6px;
    }}
    .progress-track {{
      height: 7px;
      border-radius: 999px;
      background: #dde4ec;
      overflow: hidden;
      margin: 8px 0;
    }}
    .progress-fill {{
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--accent), var(--accent-2));
    }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }}
    .stat, .section {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }}
    .stat {{
      padding: 12px;
      min-height: 74px;
    }}
    .stat-value {{
      font-size: 20px;
      font-weight: 800;
      margin-top: 4px;
    }}
    .section {{
      padding: 14px;
      margin-bottom: 14px;
    }}
    .tabs {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }}
    .tab {{
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      border-radius: 6px;
      padding: 8px 10px;
      cursor: pointer;
    }}
    .tab.active {{
      border-color: var(--border);
      background: var(--panel);
      color: var(--text);
      box-shadow: var(--shadow);
    }}
    .grid-2 {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
      gap: 14px;
      align-items: start;
    }}
    .step-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 8px;
    }}
    .step {{
      border: 1px solid var(--border);
      background: #fbfcfd;
      border-radius: 6px;
      padding: 10px;
    }}
    .badge {{
      border-radius: 999px;
      padding: 3px 8px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 700;
    }}
    .badge.done {{ color: var(--good); background: #e8f5ee; }}
    .badge.pending {{ color: var(--warn); background: #fff3df; }}
    .badge.info {{ color: var(--accent-2); background: #eaf0fb; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
    }}
    th, td {{
      padding: 9px 8px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }}
    th {{
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      background: #fbfcfd;
    }}
    pre {{
      white-space: pre-wrap;
      word-break: break-word;
      background: #111827;
      color: #edf2f7;
      border-radius: 8px;
      padding: 12px;
      overflow: auto;
      line-height: 1.45;
      max-height: 64vh;
    }}
    code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
    }}
    .shorts {{
      display: grid;
      gap: 10px;
    }}
    .short-card {{
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
      padding: 12px;
      box-shadow: var(--shadow);
    }}
    .short-head {{
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: start;
      margin-bottom: 10px;
    }}
    .frame-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }}
    .frame {{
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
      box-shadow: var(--shadow);
    }}
    .frame img {{
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      background: var(--panel-2);
    }}
    .frame div {{ padding: 7px; }}
    .file-list {{
      display: grid;
      gap: 6px;
    }}
    .file-row {{
      display: grid;
      grid-template-columns: minmax(120px, 180px) minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding: 8px 0;
    }}
    .empty {{
      color: var(--muted);
      padding: 22px;
      border: 1px dashed var(--border);
      border-radius: 8px;
      background: #fbfcfd;
    }}
    @media (max-width: 900px) {{
      .app {{ grid-template-columns: 1fr; }}
      aside {{ position: static; max-height: none; border-right: 0; border-bottom: 1px solid var(--border); }}
      main {{ padding: 14px; }}
      .stats {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      .grid-2 {{ grid-template-columns: 1fr; }}
      .file-row {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="app">
    <aside>
      <div class="topbar">
        <div>
          <h1>Video Story Results</h1>
          <div class="muted small">{escaped_root}</div>
        </div>
      </div>
      <div class="toolbar">
        <button class="button primary" id="refreshBtn">Refresh</button>
      </div>
      <div class="upload-panel">
        <h2>Upload Video</h2>
        <div class="muted small">{escaped_upload_root}</div>
        <input id="videoUploadInput" type="file" accept="video/*,.mkv,.webm,.mov,.mp4,.avi">
        <div class="toolbar">
          <button class="button" id="uploadBtn">Upload</button>
        </div>
        <div id="uploadStatus" class="upload-status muted small"></div>
        <div class="panel-split"></div>
        <h2>Download Link</h2>
        <input id="videoUrlInput" type="url" placeholder="https://www.youtube.com/watch?v=...">
        <input id="subLangsInput" type="text" value="{DEFAULT_SUBTITLE_LANGS}" aria-label="Subtitle languages">
        <div class="toolbar">
          <button class="button" id="downloadUrlBtn">Download Video + SRT</button>
        </div>
        <div id="downloadStatus" class="upload-status muted small"></div>
      </div>
      <div class="upload-panel">
        <h2>Uploaded / Downloaded Videos</h2>
        <div id="uploadedVideoList" class="video-list"></div>
        <div id="uploadedVideoStatus" class="upload-status muted small"></div>
      </div>
      <div class="upload-panel">
        <div class="topbar">
          <h2>Pipeline Logs</h2>
          <button class="button" id="refreshLogsBtn">Refresh Logs</button>
        </div>
        <div id="pipelineLogs" class="log-list"></div>
      </div>
      <div id="runList" class="run-list"></div>
    </aside>
    <main>
      <div class="topbar">
        <div>
          <h1 id="pageTitle">Runs</h1>
          <div id="pageSubtitle" class="muted small"></div>
        </div>
        <div class="toolbar" id="runToolbar"></div>
      </div>
      <div id="content"></div>
    </main>
  </div>
  <script>
    let runs = [];
    let uploads = [];
    let pipelineLogs = [];
    let activeRun = null;
    let activeTab = 'overview';

    const stepLabels = {json.dumps(STEP_LABELS, ensure_ascii=True)};
    const videoExtensions = {json.dumps(sorted(VIDEO_EXTENSIONS), ensure_ascii=True)};
    const plannerScriptPath = '{windows_to_git_bash(PLANNER_SCRIPT)}';

    function esc(value) {{
      return String(value ?? '').replace(/[&<>"']/g, ch => ({{
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
      }}[ch]));
    }}

    function formatBytes(bytes) {{
      if (!bytes && bytes !== 0) return '';
      const units = ['B', 'KB', 'MB', 'GB'];
      let value = Number(bytes);
      let index = 0;
      while (value >= 1024 && index < units.length - 1) {{
        value /= 1024;
        index += 1;
      }}
      return `${{value.toFixed(index ? 1 : 0)}} ${{units[index]}}`;
    }}

    function formatDate(seconds) {{
      if (!seconds) return '';
      return new Date(seconds * 1000).toLocaleString();
    }}

    function statusBadge(done) {{
      return done ? '<span class="badge done">Done</span>' : '<span class="badge pending">Pending</span>';
    }}

    function progress(item) {{
      const total = item.total_steps || 1;
      return Math.round(((item.completed_steps || 0) / total) * 100);
    }}

    async function fetchJson(url) {{
      const response = await fetch(url, {{ cache: 'no-store' }});
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }}

    async function loadRuns(keepSelection = true) {{
      const data = await fetchJson('/api/runs');
      runs = data.runs || [];
      renderRunList();
      if (runs.length) {{
        const stillExists = activeRun && runs.some(run => run.name === activeRun.name);
        const nextName = keepSelection && stillExists ? activeRun.name : runs[0].name;
        await selectRun(nextName, false);
      }} else {{
        activeRun = null;
        document.getElementById('pageTitle').textContent = 'No runs found';
        document.getElementById('pageSubtitle').textContent = data.run_root || '';
        document.getElementById('runToolbar').innerHTML = '';
        document.getElementById('content').innerHTML = '<div class="empty">No result folders are available yet.</div>';
      }}
    }}

    async function loadUploads() {{
      const data = await fetchJson('/api/uploads');
      uploads = data.uploads || [];
      renderUploadedVideos();
    }}

    async function loadPipelineLogs() {{
      const data = await fetchJson('/api/pipeline-logs');
      pipelineLogs = data.logs || [];
      renderPipelineLogs();
    }}

    async function refreshAll(keepSelection = true) {{
      await Promise.all([
        loadRuns(keepSelection),
        loadUploads(),
        loadPipelineLogs()
      ]);
    }}

    function isVideoUpload(item) {{
      const text = String((item && (item.path || item.name)) || '').toLowerCase();
      return videoExtensions.some(ext => text.endsWith(ext));
    }}

    function commandForVideoPath(path) {{
      return `PYTHONUTF8=1 python ${{plannerScriptPath}} "${{pathToGitBash(path)}}" --install-whisper --ollama-model gemma3:4b --frame-interval {FAST_FRAME_INTERVAL_SECONDS} --vision-frames {FAST_VISION_FRAMES}`;
    }}

    function renderUploadedVideos() {{
      const list = document.getElementById('uploadedVideoList');
      if (!list) return;
      const videos = uploads.filter(isVideoUpload);
      if (!videos.length) {{
        list.innerHTML = '<div class="empty">No uploaded or downloaded videos yet.</div>';
        return;
      }}
      list.innerHTML = videos.map((item, index) => `
        <div class="video-row">
          <div class="run-title">${{esc(item.name || item.path)}}</div>
          <div class="muted small">${{formatBytes(item.size)}} &middot; ${{formatDate(item.modified)}}</div>
          <div class="muted small">${{esc(item.path || '')}}</div>
          <div class="toolbar">
            <button class="button primary" data-run-video="${{esc(item.path || '')}}">Run Pipeline</button>
            <button class="button" data-copy-command="${{esc(commandForVideoPath(item.path || ''))}}">Copy Command</button>
          </div>
        </div>
      `).join('');
      list.querySelectorAll('[data-run-video]').forEach(button => {{
        button.addEventListener('click', () => runPipeline(button.getAttribute('data-run-video') || '', document.getElementById('uploadedVideoStatus'), button));
      }});
      list.querySelectorAll('[data-copy-command]').forEach(button => {{
        button.addEventListener('click', () => navigator.clipboard.writeText(button.getAttribute('data-copy-command') || ''));
      }});
    }}

    function renderPipelineLogs() {{
      const list = document.getElementById('pipelineLogs');
      if (!list) return;
      if (!pipelineLogs.length) {{
        list.innerHTML = '<div class="empty">No pipeline logs yet.</div>';
        return;
      }}
      list.innerHTML = pipelineLogs.map(log => `
        <div class="log-block">
          <div class="log-head">
            <strong>${{esc(log.name || '')}}</strong>
            <span class="muted small">${{formatBytes(log.size)}} &middot; ${{formatDate(log.modified)}}</span>
          </div>
          <div class="muted small">${{esc(log.path || '')}}</div>
          <pre class="log-pre"><code>${{esc(log.content || '')}}</code></pre>
        </div>
      `).join('');
    }}

    function renderRunList() {{
      const list = document.getElementById('runList');
      list.innerHTML = runs.map(run => {{
        const pct = progress(run);
        const isActive = activeRun && activeRun.name === run.name;
        return `
          <button class="run-item ${{isActive ? 'active' : ''}}" data-run="${{esc(run.name)}}">
            <div class="run-title">${{esc(run.video || run.name)}}</div>
            <div class="muted small">${{esc(run.name)}}</div>
            <div class="progress-track"><div class="progress-fill" style="width:${{pct}}%"></div></div>
            <div class="small muted">${{pct}}% complete · ${{run.frame_count || 0}} frames</div>
          </button>
        `;
      }}).join('');
      list.querySelectorAll('.run-item').forEach(button => {{
        button.addEventListener('click', () => selectRun(button.dataset.run, true));
      }});
    }}

    async function selectRun(name, rerenderList = true) {{
      activeRun = await fetchJson('/api/run?name=' + encodeURIComponent(name));
      if (rerenderList) renderRunList();
      renderRun();
    }}

    function renderTabs() {{
      const tabs = [
        ['overview', 'Overview'],
        ['transcript', 'Transcript'],
        ['timeline', 'Timeline'],
        ['shorts', 'Shorts'],
        ['frames', 'Frames'],
        ['files', 'Files']
      ];
      return `<div class="tabs">${{tabs.map(([key, label]) => `
        <button class="tab ${{activeTab === key ? 'active' : ''}}" data-tab="${{key}}">${{label}}</button>
      `).join('')}}</div>`;
    }}

    function renderRun() {{
      if (!activeRun) return;
      document.getElementById('pageTitle').textContent = activeRun.video || activeRun.name;
      document.getElementById('pageSubtitle').textContent = activeRun.path || '';
      document.getElementById('runToolbar').innerHTML = `
        <button class="button" id="copyRunPath">Copy Path</button>
      `;
      document.getElementById('copyRunPath').addEventListener('click', () => navigator.clipboard.writeText(activeRun.path || ''));

      const content = document.getElementById('content');
      content.innerHTML = `
        ${{renderStats()}}
        ${{renderTabs()}}
        <div id="tabContent">${{renderTabContent()}}</div>
      `;
      content.querySelectorAll('.tab').forEach(button => {{
        button.addEventListener('click', () => {{
          activeTab = button.dataset.tab;
          renderRun();
        }});
      }});
      content.querySelectorAll('[data-copy]').forEach(button => {{
        button.addEventListener('click', () => navigator.clipboard.writeText(button.getAttribute('data-copy') || ''));
      }});
    }}

    function renderStats() {{
      const pct = progress(activeRun);
      return `
        <div class="stats">
          <div class="stat"><div class="muted small">Pipeline</div><div class="stat-value">${{pct}}%</div></div>
          <div class="stat"><div class="muted small">Frames</div><div class="stat-value">${{activeRun.frame_count || 0}}</div></div>
          <div class="stat"><div class="muted small">Transcript</div><div class="stat-value">${{activeRun.has_transcript ? 'Ready' : 'Missing'}}</div></div>
          <div class="stat"><div class="muted small">Shorts</div><div class="stat-value">${{activeRun.has_shorts ? 'Ready' : 'Missing'}}</div></div>
        </div>
      `;
    }}

    function renderTabContent() {{
      if (activeTab === 'transcript') return renderTranscript();
      if (activeTab === 'timeline') return renderTimeline();
      if (activeTab === 'shorts') return renderShorts();
      if (activeTab === 'frames') return renderFrames();
      if (activeTab === 'files') return renderFiles();
      return renderOverview();
    }}

    function renderOverview() {{
      const steps = activeRun.steps || [];
      const manifest = activeRun.manifest || {{}};
      const source = manifest.source_video || activeRun.video || '';
      const gitBashPath = pathToGitBash(source);
      const scriptPath = '/c/Users/Akash/workspace/v5/video_short_story_planner.py';
      const command = source ? `PYTHONUTF8=1 python ${{scriptPath}} "${{gitBashPath}}" --install-whisper --ollama-model gemma3:4b --frame-interval {FAST_FRAME_INTERVAL_SECONDS} --vision-frames {FAST_VISION_FRAMES}` : '';
      return `
        <div class="grid-2">
          <section class="section">
            <h2>Status</h2>
            <div class="step-grid">
              ${{steps.map(step => `
                <div class="step">
                  <div><strong>${{esc(step.label || stepLabels[step.key] || step.key)}}</strong></div>
                  <div style="margin:8px 0">${{statusBadge(step.done)}}</div>
                  <div class="muted small">${{esc(step.updated_at || '')}}</div>
                </div>
              `).join('')}}
            </div>
          </section>
          <section class="section">
            <h2>Source</h2>
            <table>
              <tr><th>Video</th><td>${{esc(source)}}</td></tr>
              <tr><th>Duration</th><td>${{esc(manifest.duration || activeRun.duration || '')}}</td></tr>
              <tr><th>Run</th><td>${{esc(activeRun.name)}}</td></tr>
            </table>
          </section>
        </div>
        <section class="section">
          <h2>Resume Command</h2>
          ${{command ? `<div class="toolbar"><button class="button" data-copy="${{esc(command)}}">Copy</button></div><pre><code>${{esc(command)}}</code></pre>` : '<div class="empty">No source video path found.</div>'}}
        </section>
        <section class="section">
          <h2>Script Understanding</h2>
          ${{renderObject(activeRun.script_understanding)}}
        </section>
      `;
    }}

    function pathToGitBash(path) {{
      if (!path) return '';
      const match = path.match(/^([A-Za-z]):\\\\(.*)$/);
      if (!match) return path.replaceAll('\\\\', '/');
      return '/' + match[1].toLowerCase() + '/' + match[2].replaceAll('\\\\', '/');
    }}

    function renderTranscript() {{
      if (!activeRun.transcript_text) return '<section class="section"><div class="empty">Transcript has not been generated yet.</div></section>';
      return `<section class="section"><h2>Transcript</h2><pre><code>${{esc(activeRun.transcript_text)}}</code></pre></section>`;
    }}

    function renderTimeline() {{
      const rows = activeRun.timeline && Array.isArray(activeRun.timeline.timeline) ? activeRun.timeline.timeline : [];
      if (!rows.length) return '<section class="section"><div class="empty">Timeline has not been generated yet.</div></section>';
      return `
        <section class="section">
          <h2>Timeline</h2>
          <table>
            <thead><tr><th>Start</th><th>End</th><th>Beat</th><th>Cut</th><th>Note</th></tr></thead>
            <tbody>${{rows.map(row => `
              <tr>
                <td><code>${{esc(row.start)}}</code></td>
                <td><code>${{esc(row.end)}}</code></td>
                <td>${{esc(row.beat)}}</td>
                <td><span class="badge info">${{esc(row.cut_value || '')}}</span></td>
                <td>${{esc(row.editor_note || '')}}</td>
              </tr>
            `).join('')}}</tbody>
          </table>
        </section>
      `;
    }}

    function renderShorts() {{
      const shorts = activeRun.shorts && Array.isArray(activeRun.shorts.shorts) ? activeRun.shorts.shorts : [];
      if (!shorts.length && activeRun.shorts_markdown) {{
        return `<section class="section"><h2>Shorts Markdown</h2><pre><code>${{esc(activeRun.shorts_markdown)}}</code></pre></section>`;
      }}
      if (!shorts.length) return '<section class="section"><div class="empty">Short suggestions have not been generated yet.</div></section>';
      return `
        <section class="section">
          <h2>Shorts</h2>
          <div class="shorts">
            ${{shorts.map(item => `
              <div class="short-card">
                <div class="short-head">
                  <div>
                    <h3>${{esc(item.rank || '')}}. ${{esc(item.title || 'Untitled')}}</h3>
                    <div class="muted small"><code>${{esc(item.start)}}</code> to <code>${{esc(item.end)}}</code> · ${{esc(item.duration_seconds || '')}}s</div>
                  </div>
                  <span class="badge info">${{esc(item.story_angle || 'story')}}</span>
                </div>
                <p><strong>Hook:</strong> ${{esc(item.hook || '')}}</p>
                <p><strong>Why:</strong> ${{esc(item.why_this_cut || '')}}</p>
                ${{renderMobileQaSummary(item)}}
                ${{renderStoryPageLink(item)}}
                ${{renderFinalClipLink(item)}}
                ${{renderClipLink(item)}}
                ${{renderCutPoints(item.cut_points)}}
                ${{item.ffmpeg_cut_command_nvidia ? `<div class="toolbar"><button class="button" data-copy="${{esc(item.ffmpeg_cut_command_nvidia)}}">Copy NVIDIA Cut</button></div><pre><code>${{esc(item.ffmpeg_cut_command_nvidia)}}</code></pre>` : ''}}
                ${{item.ffmpeg_cut_command_cpu ? `<div class="toolbar"><button class="button" data-copy="${{esc(item.ffmpeg_cut_command_cpu)}}">Copy CPU Cut</button></div><pre><code>${{esc(item.ffmpeg_cut_command_cpu)}}</code></pre>` : ''}}
              </div>
            `).join('')}}
          </div>
        </section>
      `;
    }}

    function renderClipLink(item) {{
      const clips = activeRun.short_clips || [];
      const clip = clips.find(candidate =>
        (item.clip_path && candidate.path === item.clip_path) ||
        (item.clip_filename && candidate.name === item.clip_filename)
      );
      if (!clip) {{
        return item.clip_path ? `<p><strong>Clip:</strong> ${{esc(item.clip_path)}}</p>` : '';
      }}
      return `<div class="toolbar"><a class="button primary" href="${{esc(clip.url)}}" target="_blank" rel="noreferrer">Open Clip</a><span class="muted small">${{esc(clip.name)}} · ${{formatBytes(clip.size)}}</span></div>`;
    }}

    function renderFinalClipLink(item) {{
      const clips = activeRun.short_clips || [];
      const clip = clips.find(candidate =>
        (item.final_clip_path && candidate.path === item.final_clip_path) ||
        (item.final_clip_filename && candidate.name === item.final_clip_filename)
      );
      if (!clip) {{
        return item.final_clip_path ? `<p><strong>Final clip:</strong> ${{esc(item.final_clip_path)}}</p>` : '';
      }}
      const removed = item.filler_removed_seconds || 0;
      return `<div class="toolbar"><a class="button primary" href="${{esc(clip.url)}}" target="_blank" rel="noreferrer">Open Final Captioned Clip</a><span class="muted small">${{esc(clip.name)}} - removed ${{esc(removed)}}s</span></div>`;
    }}

    function renderMobileQaSummary(item) {{
      const qa = item.mobile_qa || {{}};
      const summary = qa.summary || null;
      if (!summary) {{
        return '<p class="muted small"><strong>Mobile QA:</strong> not reviewed yet</p>';
      }}
      const status = summary.status || 'unknown';
      const avg = summary.average_mobile_score || 'n/a';
      const worst = summary.worst_mobile_score || 'n/a';
      const needsGen = summary.needs_generative_repair ? ' · generative repair flagged' : '';
      return `<p class="muted small"><strong>Mobile QA:</strong> ${{esc(status)}} · avg ${{esc(avg)}} · worst ${{esc(worst)}}${{esc(needsGen)}}</p>`;
    }}

    function renderStoryPageLink(item) {{
      const rank = encodeURIComponent(item.rank || '');
      if (!rank) return '';
      return `<div class="toolbar"><a class="button primary" href="/clip-page?run=${{encodeURIComponent(activeRun.name || '')}}&rank=${{rank}}" target="_blank" rel="noreferrer">Open Story Page</a></div>`;
    }}

    function renderCutPoints(points) {{
      if (!Array.isArray(points) || !points.length) return '';
      return `
        <table>
          <thead><tr><th>Time</th><th>Action</th><th>Reason</th></tr></thead>
          <tbody>${{points.map(point => `
            <tr><td><code>${{esc(point.time)}}</code></td><td>${{esc(point.action)}}</td><td>${{esc(point.reason)}}</td></tr>
          `).join('')}}</tbody>
        </table>
      `;
    }}

    function renderFrames() {{
      const frames = activeRun.frame_preview || [];
      if (!frames.length) return '<section class="section"><div class="empty">No sampled frames are available yet.</div></section>';
      return `
        <section class="section">
          <h2>Sampled Frames</h2>
          <div class="frame-grid">
            ${{frames.map(frame => `
              <a class="frame" href="${{esc(frame.url)}}" target="_blank" rel="noreferrer">
                <img src="${{esc(frame.url)}}" alt="Frame ${{esc(frame.index)}} loading="lazy">
                <div class="small"><strong>#${{esc(frame.index)}}</strong><br><span class="muted">${{esc(frame.timestamp || '')}}</span></div>
              </a>
            `).join('')}}
          </div>
        </section>
      `;
    }}

    function renderFiles() {{
      const files = activeRun.files || {{}};
      const links = activeRun.links || {{}};
      const rows = Object.entries(files);
      return `
        <section class="section">
          <h2>Files</h2>
          <div class="file-list">
            ${{rows.map(([key, info]) => `
              <div class="file-row">
                <strong>${{esc(key)}}</strong>
                <span class="muted small">${{info.exists ? `${{formatBytes(info.size)}} · ${{formatDate(info.modified)}}` : 'missing'}}</span>
                <span>${{links[key] ? `<a class="button" href="${{esc(links[key])}}" target="_blank" rel="noreferrer">Open</a>` : ''}}</span>
              </div>
            `).join('')}}
          </div>
        </section>
        <section class="section">
          <h2>FFmpeg Commands</h2>
          ${{activeRun.ffmpeg_commands ? `<pre><code>${{esc(activeRun.ffmpeg_commands)}}</code></pre>` : '<div class="empty">No cut command file yet.</div>'}}
        </section>
        <section class="section">
          <h2>Short Clips</h2>
          ${{renderShortClipList()}}
        </section>
      `;
    }}

    function renderShortClipList() {{
      const clips = activeRun.short_clips || [];
      if (!clips.length) return '<div class="empty">No short clips have been rendered yet.</div>';
      return `<div class="file-list">${{clips.map(clip => `
        <div class="file-row">
          <strong>${{esc(clip.name)}}</strong>
          <span class="muted small">${{formatBytes(clip.size)}} · ${{formatDate(clip.modified)}}</span>
          <span><a class="button" href="${{esc(clip.url)}}" target="_blank" rel="noreferrer">Open</a></span>
        </div>
      `).join('')}}</div>`;
    }}

    function renderObject(value) {{
      if (!value || (typeof value === 'object' && !Object.keys(value).length)) {{
        return '<div class="empty">Not available yet.</div>';
      }}
      return `<pre><code>${{esc(JSON.stringify(value, null, 2))}}</code></pre>`;
    }}

    function renderPipelineActions(idPrefix) {{
      return '<div class="toolbar" style="margin-top:8px">' +
        '<button class="button" id="' + idPrefix + 'CopyCommand">Copy Run Command</button>' +
        '<button class="button primary" id="' + idPrefix + 'RunPipeline">Run Pipeline</button>' +
        '</div>';
    }}

    function bindPipelineActions(idPrefix, command, videoPath, status) {{
      const copyButton = document.getElementById(idPrefix + 'CopyCommand');
      const runButton = document.getElementById(idPrefix + 'RunPipeline');
      if (copyButton) {{
        copyButton.addEventListener('click', () => {{
          navigator.clipboard.writeText(command || '');
        }});
      }}
      if (runButton) {{
        runButton.addEventListener('click', () => runPipeline(videoPath, status, runButton));
      }}
    }}

    async function runPipeline(videoPath, status, button) {{
      if (!videoPath) {{
        status.textContent = 'No video path is available to run.';
        return;
      }}
      const originalText = button ? button.textContent : '';
      if (button) {{
        button.disabled = true;
        button.textContent = 'Starting...';
      }}
      try {{
        const response = await fetch('/run-pipeline', {{
          method: 'POST',
          headers: {{'Content-Type': 'application/json'}},
          body: JSON.stringify({{ path: videoPath }})
        }});
        const data = await response.json();
        if (!response.ok || !data.started) {{
          throw new Error(data.error || 'Could not start pipeline');
        }}
        const pipeline = data.pipeline || {{}};
        const headline = pipeline.already_running
          ? '<br><strong>Pipeline already running:</strong> PID '
          : '<br><strong>Pipeline started:</strong> PID ';
        const message = pipeline.message ? '<br>' + esc(pipeline.message) : '';
        status.insertAdjacentHTML(
          'beforeend',
          headline + esc(pipeline.pid || '') +
          message +
          '<br><strong>Logs:</strong><br>' + esc(pipeline.stdout_log || '') +
          '<br>' + esc(pipeline.stderr_log || '')
        );
        await refreshAll(true);
      }} catch (error) {{
        status.insertAdjacentHTML('beforeend', '<br><strong>Pipeline error:</strong> ' + esc(error.message || String(error)));
      }} finally {{
        if (button) {{
          button.disabled = false;
          button.textContent = originalText;
        }}
      }}
    }}

    async function uploadVideo() {{
      const input = document.getElementById('videoUploadInput');
      const status = document.getElementById('uploadStatus');
      const button = document.getElementById('uploadBtn');
      const file = input.files && input.files[0];
      if (!file) {{
        status.textContent = 'Choose a video file first.';
        return;
      }}
      const form = new FormData();
      form.append('video', file);
      button.disabled = true;
      status.textContent = 'Uploading ' + file.name + '...';
      try {{
        const response = await fetch('/upload', {{
          method: 'POST',
          body: form
        }});
        const data = await response.json();
        if (!response.ok || !data.uploaded) {{
          throw new Error(data.error || 'Upload failed');
        }}
        const upload = data.upload;
        status.innerHTML =
          '<strong>Saved:</strong><br>' + esc(upload.path) +
          renderPipelineActions('upload');
        bindPipelineActions('upload', upload.planner_command || '', upload.path || '', status);
        await refreshAll(true);
      }} catch (error) {{
        status.textContent = error.message || String(error);
      }} finally {{
        button.disabled = false;
      }}
    }}

    async function downloadVideoLink() {{
      const input = document.getElementById('videoUrlInput');
      const langsInput = document.getElementById('subLangsInput');
      const status = document.getElementById('downloadStatus');
      const button = document.getElementById('downloadUrlBtn');
      const url = input.value.trim();
      const langs = langsInput.value.trim() || '{DEFAULT_SUBTITLE_LANGS}';
      if (!url) {{
        status.textContent = 'Paste a video link first.';
        return;
      }}
      button.disabled = true;
      status.textContent = 'Downloading video and SRT when available. This can take a few minutes...';
      try {{
        const response = await fetch('/download-url', {{
          method: 'POST',
          headers: {{'Content-Type': 'application/json'}},
          body: JSON.stringify({{ url, sub_langs: langs }})
        }});
        const data = await response.json();
        if (!response.ok || !data.downloaded) {{
          throw new Error(data.error || 'Download failed');
        }}
        const download = data.download;
        const srtPaths = download.srt_paths || [];
        const subtitlePaths = download.subtitle_paths || [];
        const subtitleNote = download.subtitle_error ? String(download.subtitle_error).slice(-900) : '';
        const srtHtml = srtPaths.length
          ? '<br><strong>SRT:</strong><br>' + srtPaths.map(path => esc(path)).join('<br>')
          : '<br><strong>SRT:</strong> no SRT found for requested languages';
        const rawSubtitleHtml = !srtPaths.length && subtitlePaths.length
          ? '<br><strong>Subtitle files:</strong><br>' + subtitlePaths.map(path => esc(path)).join('<br>')
          : '';
        const subtitleNoteHtml = subtitleNote
          ? '<br><strong>Subtitle note:</strong><br>' + esc(subtitleNote)
          : '';
        status.innerHTML =
          '<strong>Saved video:</strong><br>' + esc(download.path || download.folder || '') +
          srtHtml +
          rawSubtitleHtml +
          subtitleNoteHtml +
          renderPipelineActions('download');
        bindPipelineActions('download', download.planner_command || '', download.path || '', status);
        await refreshAll(true);
      }} catch (error) {{
        status.textContent = error.message || String(error);
      }} finally {{
        button.disabled = false;
      }}
    }}

    document.getElementById('refreshBtn').addEventListener('click', () => refreshAll(true));
    document.getElementById('refreshLogsBtn').addEventListener('click', () => loadPipelineLogs());
    document.getElementById('uploadBtn').addEventListener('click', () => uploadVideo());
    document.getElementById('downloadUrlBtn').addEventListener('click', () => downloadVideoLink());
    setInterval(() => refreshAll(true).catch(console.error), 10000);
    refreshAll(false).catch(error => {{
      document.getElementById('content').innerHTML = `<div class="empty">${{esc(error.message)}}</div>`;
    }});
  </script>
</body>
</html>"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve a local dashboard for video story pipeline results.")
    parser.add_argument("--run-root", type=Path, default=DEFAULT_RUN_ROOT)
    parser.add_argument("--upload-root", type=Path, default=DEFAULT_UPLOAD_ROOT)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--open", action="store_true", help="Open the dashboard in the default browser.")
    return parser.parse_args()


def main() -> int:
    configure_stdio()
    args = parse_args()
    run_root = args.run_root.expanduser().resolve()
    upload_root = args.upload_root.expanduser().resolve()
    upload_root.mkdir(parents=True, exist_ok=True)
    DashboardHandler.run_root = run_root
    DashboardHandler.upload_root = upload_root
    server = ThreadingHTTPServer((args.host, args.port), DashboardHandler)
    url = f"http://{args.host}:{args.port}/"
    print(f"Serving video story results from {run_root}")
    print(f"Saving uploaded videos to {upload_root}")
    print(url)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
