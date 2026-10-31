"""Read-only measurements from the hash-verified Digital Samba source checkout."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
import qc  # Source files are verified by the calling Node adapter before import.

video = Path(sys.argv[2]).resolve()
info = qc.probe_video(video)
if info is None:
    raise RuntimeError("Cannot probe encoded video")
report = qc.Report()
qc.check_frames(video, info, report, max_still=3.0)
print(json.dumps({"video": info, "loudness": qc.measure_loudness(video),
                  "findings": report.findings, "data": report.data}, ensure_ascii=False))
