"""Render one reviewed Vietnamese script; emit technical QA, never publication approval."""
import argparse
import array
import json
import math
from pathlib import Path
import sys
import wave
from piper import PiperVoice, SynthesisConfig

parser = argparse.ArgumentParser()
parser.add_argument("--model", required=True)
parser.add_argument("--input", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args()
text = Path(args.input).read_text(encoding="utf-8").strip()
if not 10 <= len(text) <= 1500:
    raise ValueError("Expected a short narration script")
voice = PiperVoice.load(args.model)
with wave.open(args.output, "wb") as output:
    voice.synthesize_wav(text, output, syn_config=SynthesisConfig(length_scale=1.05))
with wave.open(args.output, "rb") as output:
    if output.getsampwidth() != 2 or output.getnchannels() != 1:
        raise ValueError("Expected mono PCM16")
    samples = array.array("h", output.readframes(output.getnframes()))
    if sys.byteorder != "little":
        samples.byteswap()
    duration = output.getnframes() / output.getframerate()
    rms = math.sqrt(sum(v * v for v in samples) / max(1, len(samples))) / 32768
    clipped = sum(abs(v) >= 32760 for v in samples) / max(1, len(samples))
    result = {"durationSeconds": round(duration, 3), "sampleRate": output.getframerate(),
              "rms": round(rms, 6), "clippedFraction": round(clipped, 6)}
if not 3 <= duration <= 75 or rms < 0.005 or clipped > 0.01:
    raise ValueError(f"Technical audio QA failed: {result}")
print(json.dumps(result))
