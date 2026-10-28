import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import path from 'node:path';

const candidates = [process.env.SAKURA_TRAINING_PYTHON,
  path.join(homedir(), '.codex/data/tiktok-autoposting/voice/vieneu/runtime', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'),
  process.platform === 'win32' ? 'py' : 'python3'].filter(Boolean);
const python = candidates.find(p => existsSync(p) || spawnSync(p, ['--version'], {timeout: 5000}).status === 0);

test('voice corpus: twenty-two bounded synthetic fixture checks, no training or model downloads', {skip: !python}, () => {
  const result = spawnSync(python, ['voice-training/test_pipeline.py'], {encoding: 'utf8', timeout: 60000});
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /Ran 22 tests/);
});

test('voice LoRA runner exposes a real CLI without importing training dependencies', {skip: !python}, () => {
  const result = spawnSync(python, ['voice-training/run.py', '--help'], {encoding: 'utf8', timeout: 10000});
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /encode,train,evaluate/);
  assert.match(result.stdout, /--runtime-config/);
});
