"""Install the optional local Vietnamese voice runtime from pinned upstream sources."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request
import venv

REVISION = "5041a7a49ae5b3a0f30e6837769eb03fdbb231bd"
MODEL_HASH = "ec7c89e2c85f4d1edc24b6120c18aaf1bda614f06b511567eb9c7c0de15e2dab"
VOICE = "vi_VN-vais1000-medium"
base = Path(os.environ.get("TIKTOK_VOICE_HOME", Path.home() / ".codex/data/tiktok-autoposting/voice")).resolve()
base.mkdir(parents=True, exist_ok=True)
runtime = base / "runtime"
python = runtime / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
if not python.exists():
    venv.create(runtime, with_pip=True)
subprocess.run([str(python), "-m", "pip", "install", "piper-tts==1.8.0"], check=True)
models = base / "models"
models.mkdir(exist_ok=True)
source = f"https://huggingface.co/rhasspy/piper-voices/resolve/{REVISION}/vi/vi_VN/vais1000/medium"
for filename in [f"{VOICE}.onnx", f"{VOICE}.onnx.json", "MODEL_CARD"]:
    target = models / filename
    if not target.exists():
        temporary = target.with_suffix(target.suffix + ".download")
        urllib.request.urlretrieve(f"{source}/{filename}", temporary)
        temporary.replace(target)
model = models / f"{VOICE}.onnx"
if hashlib.sha256(model.read_bytes()).hexdigest() != MODEL_HASH:
    raise RuntimeError("Voice model checksum mismatch; do not use this download")
config = models / f"{VOICE}.onnx.json"
if json.loads(config.read_text(encoding="utf-8"))["espeak"]["voice"] != "vi":
    raise RuntimeError("Expected Vietnamese phonemizer")
manifest = {"provider": "piper", "version": "1.8.0", "python": str(python), "model": str(model),
            "modelSha256": MODEL_HASH, "configSha256": hashlib.sha256(config.read_bytes()).hexdigest(),
            "voice": VOICE, "language": "vi-VN", "revision": REVISION,
            "modelCard": f"{source}/MODEL_CARD", "datasetLicense": "CC-BY-4.0"}
(base / "runtime.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"configured": str(base / "runtime.json"), "voice": VOICE}, ensure_ascii=False))
