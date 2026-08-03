"""Run one tracked fal.ai MuseTalk request for the recovered avatar test assets."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import fal_client
import httpx


ENDPOINT = "fal-ai/musetalk"
VIDEO_PATH = Path("/tmp/happy-horse-silent.mp4")
AUDIO_PATH = Path("/tmp/approved-voice.wav")
OUTPUT_PATH = Path("/tmp/happy-horse-musetalk-fal.mp4")
STATE_PATH = Path("/tmp/happy-horse-musetalk-fal.json")


def main() -> int:
    if not os.environ.get("FAL_KEY"):
        raise RuntimeError("FAL_KEY is not configured.")
    for path in (VIDEO_PATH, AUDIO_PATH):
        if not path.exists() or path.stat().st_size == 0:
            raise FileNotFoundError(f"Missing input: {path}")

    request_id = ""

    def on_enqueue(value: str) -> None:
        nonlocal request_id
        request_id = value
        STATE_PATH.write_text(
            json.dumps({"endpoint": ENDPOINT, "requestId": request_id, "status": "submitted"}),
            encoding="utf-8",
        )
        print(f"MuseTalk submitted request_id={request_id}", flush=True)

    video_url = fal_client.upload_file(str(VIDEO_PATH))
    audio_url = fal_client.upload_file(str(AUDIO_PATH))
    print("MuseTalk inputs uploaded", flush=True)
    result = fal_client.subscribe(
        ENDPOINT,
        arguments={
            "source_video_url": video_url,
            "audio_url": audio_url,
        },
        with_logs=True,
        on_enqueue=on_enqueue,
        headers={"X-Fal-Store-IO": "1"},
        client_timeout=900,
    )

    video = result.get("video") if isinstance(result, dict) else None
    output_url = video.get("url") if isinstance(video, dict) else None
    if not output_url:
        raise RuntimeError(f"MuseTalk returned no video URL: {result!r}")

    with httpx.stream("GET", output_url, follow_redirects=True, timeout=300) as response:
        response.raise_for_status()
        with OUTPUT_PATH.open("wb") as output:
            for chunk in response.iter_bytes(1024 * 1024):
                output.write(chunk)
    if OUTPUT_PATH.stat().st_size == 0:
        raise RuntimeError("MuseTalk output download was empty.")

    state = {
        "endpoint": ENDPOINT,
        "requestId": request_id,
        "status": "completed",
        "outputUrl": output_url,
        "outputBytes": OUTPUT_PATH.stat().st_size,
        "result": result,
    }
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")
    print(
        f"MuseTalk completed request_id={request_id} output_bytes={OUTPUT_PATH.stat().st_size}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"MuseTalk failed: {type(exc).__name__}: {exc}", file=sys.stderr, flush=True)
        raise
