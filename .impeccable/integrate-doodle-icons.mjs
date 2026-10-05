import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';
const source='doita-test/cuts';
const mapping=JSON.parse(await readFile(join(source,'mapping.json'),'utf8'));
const aliases={trash:'Trash2','volume-on':'Volume2','volume-off':'VolumeX'};
const names=mapping.map(({name})=>[aliases[name]??name.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(''),name]);
await mkdir('public/assets/doita/doodle-icons',{recursive:true});await mkdir('public/themes/sunset/icons',{recursive:true});
let bytes=0;
for(const [,name] of names){await copyFile(join(source,name+'.png'),'public/assets/doita/doodle-icons/'+name+'.png'); const b=await sharp(join(source,name+'.png')).resize(name==='heart'?192:96,name==='heart'?192:96).webp({lossless:true}).toBuffer();await writeFile('public/themes/sunset/icons/'+name+'.webp',b);bytes+=b.length;}
await copyFile(join(source,'mapping.json'),'public/assets/doita/doodle-icons/mapping.json');
await writeFile('src/config/ui-icons.ts','// Original artwork: doita-test/cuts. Shared names preserve existing icon roles.\nexport const DOODLE_ICONS = {\n'+names.map(([id,file])=>`  ${id}: "/themes/sunset/icons/${file}.webp",`).join('\n')+'\n};\nexport type IconName = keyof typeof DOODLE_ICONS;\n');
await writeFile('src/components/icons.tsx',`import Image, { type ImageProps } from "next/image";
import { THEME } from "@/config/themes";
import type { IconName } from "@/config/ui-icons";

type IconProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & { size?: number };
function createIcon(name: IconName) {
  function DoodleIcon({ size = 24, className = "", ...props }: IconProps) {
    return (
      <Image
        {...props}
        unoptimized
        src={THEME.icons[name]}
        width={size}
        height={size}
        alt=""
        aria-hidden={props["aria-hidden"] ?? true}
        className={\`doita-icon \${className}\`}
        draggable={false}
      />
    );
  }
  DoodleIcon.displayName = name;
  return DoodleIcon;
}

`+names.map(([id])=>`export const ${id} = createIcon("${id}");`).join('\n')+'\n');
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(p.endsWith('.tsx')){const s=await readFile(p,'utf8');if(s.includes('from "lucide-react"'))await writeFile(p,s.replaceAll('from "lucide-react"','from "@/components/icons"'));}}}
await walk('src');
console.log(names.length+' icons copied from cuts; optimized WebP total '+bytes+' bytes; imports replaced');
