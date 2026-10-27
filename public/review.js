const response=await fetch('/api/state');const state=await response.json();
const host=document.getElementById('review-sets');
for(const item of state.queue?.filter(q=>q.assets?.length&&(q.phase==='pilot'||q.publishAt)).slice(0,46)??[]){
  const section=document.createElement('section');section.className='card';section.id=item.id;
  const title=document.createElement('h2');title.textContent=`${item.id} · ${item.title}`;section.append(title);
  const copy=document.createElement('p');copy.textContent=`${item.status} · ${item.publishAt??'Đăng ngay / đã có biên nhận'}${item.leadCode?` · Mã hỏi hàng: ${item.leadCode}`:''}`;section.append(copy);
  const caption=document.createElement('p');caption.textContent=item.caption;section.append(caption);
  const grid=document.createElement('div');grid.className='review-grid';
  for(const [index,asset] of item.assets.entries()){const figure=document.createElement('figure');const image=document.createElement('img');image.src=`/assets/${asset.sha256}`;image.alt=`${item.id} ảnh ${index+1}`;image.loading='lazy';const label=document.createElement('figcaption');label.textContent=`${index+1} · ${asset.name}`;figure.append(image,label);grid.append(figure);}
  section.append(grid);host.append(section);
}
