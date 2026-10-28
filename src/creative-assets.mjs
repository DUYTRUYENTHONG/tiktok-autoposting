// A reviewed cover belongs to one product and story; replanning must preserve it.
export function coverForPost(state,item,fallback){
  const override=state.creativeOverrides?.[item.id];
  if(!override)return {asset:fallback,ready:!item.requiresFreshCover};
  if(override.productId!==item.productId||override.angleId!==item.angleId)throw Error(`Cover attribution mismatch: ${item.id}`);
  const asset=override.asset;
  const ready=override.visuallyVerified===true&&asset?.kind==='image'&&typeof asset.path==='string'&&/^[a-f0-9]{64}$/.test(asset.sha256??'');
  return {asset:ready?asset:fallback,ready};
}
