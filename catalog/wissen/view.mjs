// SPDX-License-Identifier: MIT
const query=document.getElementById('tool-search');
const cards=[...document.querySelectorAll('.route')];
const filters=[...document.querySelectorAll('[data-tool-filter]')];
let kind='all';
function refresh(){
  const needle=query.value.trim().toLocaleLowerCase('de');let visible=0;
  for(const card of cards){
    card.hidden=!((kind==='all'||card.dataset.kind===kind)&&card.textContent.toLocaleLowerCase('de').includes(needle));
    if(!card.hidden)visible++;
  }
  document.getElementById('tool-count').textContent=`${visible} von ${cards.length} Werkzeugen`;
  document.getElementById('tool-empty').hidden=visible!==0;
  for(const button of filters)button.setAttribute('aria-pressed',String(button.dataset.toolFilter===kind));
}
query.addEventListener('input',refresh);
for(const button of filters)button.addEventListener('click',()=>{kind=button.dataset.toolFilter;refresh();});
document.getElementById('tool-clear').addEventListener('click',()=>{query.value='';kind='all';refresh();query.focus();});
refresh();
