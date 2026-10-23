import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&e.name!=='__pycache__'?walk(path.join(dir,e.name)):e.isFile()&&/\.test\.(?:mjs|js)$/.test(e.name)?[path.join(dir,e.name)]:[]);}
const tests=[...walk(path.join(root,'branches')),...walk(path.join(root,'scripts'))].sort();
if(!tests.length)throw Error('No JavaScript tests selected');
let r=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
if(r.status!==0)process.exit(r.status??1);
const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
for(const directory of ['branches/fegefeuer-provenance-transducer','branches/normenwerk-rule-universe','branches/php2shell-response','scripts']){
 r=spawnSync(python,['-m','unittest','discover','-s',directory,'-p','test_*.py','-v'],{cwd:root,stdio:'inherit'});
 if(r.status!==0)process.exit(r.status??1);
}
console.log('All selected local module suites passed. This proves only the tested contracts.');
