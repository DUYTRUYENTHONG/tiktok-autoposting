import test from 'node:test';
import assert from 'node:assert/strict';
import {coverForPost} from '../src/creative-assets.mjs';

test('fresh creative cannot become ready from a reused library cover',()=>{
  const item={id:'q',productId:'p',angleId:'a',requiresFreshCover:true},fallback={path:'old.png'};
  assert.equal(coverForPost({},item,fallback).ready,false);
  const asset={path:'new.png',kind:'image',sha256:'a'.repeat(64)};
  const state={creativeOverrides:{q:{productId:'p',angleId:'a',asset,visuallyVerified:false}}};
  assert.equal(coverForPost(state,item,fallback).ready,false);
  state.creativeOverrides.q.visuallyVerified=true;
  assert.equal(coverForPost(state,item,fallback).asset,asset);
  assert.equal(coverForPost(state,item,fallback).ready,true);
  assert.throws(()=>coverForPost(state,{...item,angleId:'different'},fallback));
});
