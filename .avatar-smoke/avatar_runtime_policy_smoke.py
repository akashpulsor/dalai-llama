from pathlib import Path
from tempfile import TemporaryDirectory

from config import settings
from services.avatar_local_runtime import LocalAvatarRuntime, LocalAvatarRuntimeError


runtime = LocalAvatarRuntime()
settings.avatar_musetalk_command = "musetalk-command"
settings.avatar_latentsync_command = ""
settings.avatar_sync_labs_command = "sync-labs-command"
settings.avatar_lipsync_fallback_command = "sync-fallback-command"

with TemporaryDirectory() as temp_dir:
    root = Path(temp_dir)
    source = root / "source.mp4"
    source.write_bytes(b"\x00\x00\x00\x18ftypmp42policy-smoke")
    output = root / "output.mp4"
    calls = []

    def fake_run(command, variables, *, stage):
        calls.append(stage)
        if stage == "lip_sync:sync_labs":
            output.write_bytes(b"\x00\x00\x00\x18ftypmp42explicit-api")
            return
        raise LocalAvatarRuntimeError("intentional local failure", stage=stage)

    runtime._run_template_command = fake_run
    candidate, status, _, _ = runtime._run_lip_sync_stage(
        "musetalk",
        {},
        source,
        output,
        allow_proprietary_fallback=False,
    )
    assert candidate == source
    assert status == "skipped_after_error"
    assert calls == ["lip_sync:musetalk"], calls

    calls.clear()
    candidate, status, model, _ = runtime._run_lip_sync_stage(
        "sync_labs",
        {},
        source,
        output,
        allow_proprietary_fallback=False,
    )
    assert candidate == output
    assert status == "completed"
    assert model == "sync_labs"
    assert calls == ["lip_sync:sync_labs"], calls

print("avatar proprietary fallback policy smoke passed")
