import {readFileSync,writeFileSync} from 'node:fs';
const p='docs/THEMES.md';const s=readFileSync(p,'utf8').replace('chữ sans-serif hệ thống','chữ Nunito bản thường (nội dung 400/16px/1.6, nút/menu 600, tiêu đề 700–800)');writeFileSync(p,s);
