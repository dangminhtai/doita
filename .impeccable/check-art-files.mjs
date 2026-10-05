import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const s=readFileSync('src/config/themes.ts','utf8');let bytes=0,count=0;
for(const m of s.matchAll(/"(\/themes\/sunset\/doodle-art\/([a-z-]+)\.webp\?v=[a-f0-9]+)"/g)){
 assert.deepEqual(readFileSync('public/assets/doita/doodle-art/'+m[2]+'.png'),readFileSync('doita-test/doita-doodle-assets/public/assets/doita/doodle-art/'+m[2]+'.png'));
 const r=await fetch('http://localhost:3000'+m[1]);assert.equal(r.status,200);const data=Buffer.from(await r.arrayBuffer());bytes+=data.length;count++;
 const meta=await sharp(data).metadata();const orig=await sharp('public/assets/doita/doodle-art/'+m[2]+'.png').metadata();assert.equal(meta.hasAlpha,orig.hasAlpha);
}
assert.equal(count,12);console.log('PASS 12 original copies and HTTP derivatives, alpha preserved; total '+bytes+' bytes');
