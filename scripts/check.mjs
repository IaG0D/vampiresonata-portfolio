import assert from 'node:assert/strict';
import {stat,readFile} from 'node:fs/promises';
import {projects,categories} from '../src/projects.js';
const durations=JSON.parse(await readFile(new URL('../src/durations.json',import.meta.url),'utf8'));
assert.equal(projects.length,21,'21 projetos devem estar disponíveis');
assert.equal(projects.filter(p=>p.isNew).length,15,'Os 12 vídeos anteriores e 3 novos projetos precisam estar incluídos');
assert.equal(new Set(projects.map(p=>p.id)).size,projects.length);
for(const p of projects){
  assert.match(p.id,/^[a-z0-9-]+$/);
  assert.ok(categories[p.category]&&p.title&&p.description&&p.features.length>0);
  if(p.youtube)assert.match(p.youtube,/^[a-zA-Z0-9_-]{11}$/);
  else assert.ok(Number.isFinite(durations[p.id])&&durations[p.id]>0);
  for(const ext of p.youtube?['.webp']:['.webp','.mp4','-preview.mp4']){
    const file=await stat(new URL(`../public/media/${p.id}${ext}`,import.meta.url));
    assert.ok(file.size>0,`${p.id}${ext} vazio`);
    if(ext==='-preview.mp4')assert.ok(file.size<2_000_000,`Prévia muito pesada: ${p.id}`);
  }
}
assert.equal(projects.find(p=>p.id==='soul-hunt').category,'events','Almas Perdidas pertence a eventos');
assert.equal(projects.filter(p=>p.category==='mounts').length,5);
const technologies=JSON.parse(await readFile(new URL('../src/technologies.json',import.meta.url),'utf8'));
assert.equal(technologies.length,16);
for(const t of technologies)assert.ok((await stat(new URL('../public'+t.icon,import.meta.url))).size>0);
console.log('21 projetos, 20 vídeos locais, 1 YouTube, 16 tecnologias e classificação de Almas Perdidas: OK');
