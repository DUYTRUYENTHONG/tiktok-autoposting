import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectWav} from '../src/wav.mjs';
function wav(amplitude=4000){const rate=8000,count=rate*4,bytes=Buffer.alloc(44+count*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(count*2,40);for(let i=0;i<count;i++)bytes.writeInt16LE(Math.round(amplitude*Math.sin(i*0.1)),44+i*2);return bytes;}
test('waveform QA measures duration and rejects silence, clipping and truncation',()=>{
  assert.equal(inspectWav(wav()).durationSeconds,4);
  assert.throws(()=>inspectWav(wav(0)),/QA failed/);
  const clipped=wav();for(let i=44;i<clipped.length;i+=2)clipped.writeInt16LE(32767,i);assert.throws(()=>inspectWav(clipped),/QA failed/);
  assert.throws(()=>inspectWav(wav().subarray(0,100)),/Truncated/);
});
