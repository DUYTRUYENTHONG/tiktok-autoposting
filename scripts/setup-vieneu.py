"""Install pinned, on-device Vietnamese speech assets; never synthesize or post."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import venv

VERSION = '3.8.3'
MODEL = 'pnnbao-ump/VieNeu-TTS-v3-Turbo'
MODEL_REVISION = '61b85e3d937fbbacb387714180e8182823512523'
CODEC = 'OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX'
CODEC_REVISION = 'ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae'
GRAPH_FILES = ['vieneu_prefill.onnx', 'vieneu_decode_step.onnx', 'vieneu_acoustic_cached.onnx',
               'vieneu_backbone_shared.data', 'vieneu_v3_heads.npz', 'config.json', 'tokenizer.json']
CODEC_FILES = ['moss_audio_tokenizer_decode_full.onnx', 'moss_audio_tokenizer_decode_shared.data',
               'moss_audio_tokenizer_decode_step.onnx', 'codec_browser_onnx_meta.json',
               'moss_audio_tokenizer_encode.onnx', 'moss_audio_tokenizer_encode.data']

parser = argparse.ArgumentParser()
parser.add_argument('--skip-install', action='store_true')
parser.add_argument('--activate', action='store_true', help='Select this engine for previews; keeps a backup')
parser.add_argument('--ffmpeg', required=True)
parser.add_argument('--voice', default='Thùy Dung')
parser.add_argument('--speed', type=float, default=1.2)
args = parser.parse_args()
if not Path(args.ffmpeg).is_file():
    raise ValueError('Provide the existing pinned FFmpeg executable')
if not 1 <= args.speed <= 2:
    raise ValueError('Expected speaking speed from1.0 to2.0')
home = Path(os.environ.get('TIKTOK_VOICE_HOME', Path.home()/'.codex/data/tiktok-autoposting/voice')).resolve()
base = home/'vieneu'
runtime = base/'runtime'
python = runtime/('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
if not python.exists():
    venv.create(runtime, with_pip=True)
if not args.skip_install:
    subprocess.run([str(python), '-m', 'pip', 'install', '--disable-pip-version-check',
                    '--timeout', '25', '--retries', '0', f'vieneu=={VERSION}'], check=True)
if Path(sys.executable).resolve() != python.resolve():
    command = [str(python), str(Path(__file__).resolve()), '--skip-install', '--ffmpeg', args.ffmpeg, '--voice', args.voice, '--speed', str(args.speed)]
    if args.activate:
        command.append('--activate')
    raise SystemExit(subprocess.call(command))

os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['HF_HUB_DISABLE_IMPLICIT_TOKEN'] = '1'
from huggingface_hub import hf_hub_download
import importlib.metadata
import vieneu
if importlib.metadata.version('vieneu') != VERSION:
    raise RuntimeError('Unexpected VieNeu SDK version')
cache = base/'huggingface'/'hub'
artifacts = []
for repo, revision, names in [
    (MODEL, MODEL_REVISION, ['onnx_update/'+n for n in GRAPH_FILES]+['config.json', 'README.md']),
    (CODEC, CODEC_REVISION, CODEC_FILES+['README.md']),
]:
    for name in names:
        target = Path(hf_hub_download(repo, filename=name, revision=revision, cache_dir=str(cache)))
        digest = hashlib.file_digest(target.open('rb'), 'sha256').hexdigest()
        artifacts.append(dict(repo=repo, revision=revision, file=name, path=str(target), sha256=digest))
        print(json.dumps(dict(downloaded=name, bytes=target.stat().st_size)), flush=True)
    # The SDK resolves its fixed repository names offline through this pinned ref.
    refs = cache/('models--'+repo.replace('/', '--'))/'refs'
    refs.mkdir(parents=True, exist_ok=True)
    (refs/'main').write_text(revision, encoding='utf-8')
voice_file = Path(vieneu.__file__).parent/'assets'/'voices_v3_turbo.json'
voices = json.loads(voice_file.read_text(encoding='utf-8'))['presets']
artifacts.append(dict(file='SDK preset voices', path=str(voice_file),
                      sha256=hashlib.file_digest(voice_file.open('rb'), 'sha256').hexdigest()))
manifest = base/'assets.json'
manifest.write_text(json.dumps(dict(sdkVersion=VERSION, model=MODEL, modelRevision=MODEL_REVISION,
                                    codec=CODEC, codecRevision=CODEC_REVISION, files=artifacts), indent=2), encoding='utf-8')
config = dict(provider='vieneu', version=VERSION, python=str(python), language='vi-VN',
              voice=args.voice, speed=args.speed, temperature=0.8, hfCache=str(cache),
              modelManifest=str(manifest), modelSha256=hashlib.sha256(manifest.read_bytes()).hexdigest(),
              ffmpeg=str(Path(args.ffmpeg).resolve()),
              presetVoices=[dict(name=name, description=v.get('description', ''), gender=v.get('gender', '')) for name,v in voices.items()],
              attribution='Synthetic Vietnamese preset voice using VieNeu-TTS v3 Turbo by Pham Nguyen Ngoc Bao (Apache-2.0); MOSS Audio Tokenizer by OpenMOSS-Team. No customer voice cloning.')
if not Path(config['ffmpeg']).is_file() or config['voice'] not in voices:
    raise RuntimeError('Expected video toolchain and Southern storytelling preset are unavailable')
target = home/'runtime.json' if args.activate else base/'runtime-candidate.json'
if target.exists() and target.read_text(encoding='utf-8-sig') != json.dumps(config, ensure_ascii=False, indent=2):
    from datetime import datetime, timezone
    target.with_name(target.stem+'-backup-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')+'.json').write_bytes(target.read_bytes())
target.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(dict(configured=str(target), provider=config['provider'], voices=len(voices), readyForListeningOnly=True)), flush=True)
