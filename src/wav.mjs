export function inspectWav(bytes){
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('Invalid WAV header');
  let format,data;
  for(let offset=12;offset+8<=bytes.length;){
    const tag=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8;
    if(start+size>bytes.length)throw Error('Truncated WAV chunk');
    if(tag==='fmt '&&size>=16)format={encoding:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),sampleRate:bytes.readUInt32LE(start+4),bits:bytes.readUInt16LE(start+14)};
    if(tag==='data')data=bytes.subarray(start,start+size);
    offset=start+size+(size%2);
  }
  if(!format||format.encoding!==1||format.channels!==1||format.bits!==16||!format.sampleRate||!data?.length||data.length%2)throw Error('Expected mono PCM16 WAV');
  let squares=0,clipped=0;for(let i=0;i<data.length;i+=2){const v=data.readInt16LE(i);squares+=v*v;if(Math.abs(v)>=32760)clipped++;}
  const count=data.length/2,durationSeconds=count/format.sampleRate,rms=Math.sqrt(squares/count)/32768,clippedFraction=clipped/count;
  if(durationSeconds<3||durationSeconds>75||rms<0.005||clippedFraction>0.01)throw Error('Technical audio QA failed');
  return {durationSeconds:Number(durationSeconds.toFixed(3)),sampleRate:format.sampleRate,rms:Number(rms.toFixed(6)),clippedFraction:Number(clippedFraction.toFixed(6))};
}
