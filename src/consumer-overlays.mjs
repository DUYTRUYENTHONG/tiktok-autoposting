// Source provenance belongs in private receipts; consumer overlays carry the story.
export function assertConsumerOverlay(text){
  const folded=String(text).normalize('NFD').replace(/\p{M}/gu,'').replaceAll('đ','d').toLowerCase();
  if(/da duoc len lich|bai dang nay|(?:canh|anh|tu lieu) minh hoa|anh nhan dien san pham|khong phai (?:demo|thu nghiem|san pham) sakura|demo nay khong phai/u.test(folded))throw Error('Remove workflow watermarks and blanket demo labels from consumer overlays');
  return text;
}
