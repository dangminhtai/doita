const fs=require('fs');
const edit=(p,fn)=>{const s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,fn(s))};
for(const feature of ['notes','prayer','memories','activities'])edit(`src/features/${feature}/screen.tsx`,s=>s.replace(new RegExp('\\s+subtitle=\\{C\\.'+feature+'\\.subtitle\\}'),'').replace(/\s*<small>\{C.redesign.searchAll\}<\/small>/,'').replace(/\s*<small>\s*\{t\(C.common.sharedHint, \{[\s\S]*?\}\)\}\s*<\/small>/,''));
edit('src/components/couple-app.tsx',s=>s.replace(/\s*<p>\s*<small>\{C.home.eyebrow\}<\/small>\s*<\/p>/,'').replace('<SettingsScreen go={go} />','<SettingsScreen />'));
edit('src/features/settings/screen.tsx',s=>s.replace('import { ThemeArt, DefaultAvatar }','import { DefaultAvatar }').replace('export function SettingsScreen({ go }: { go: (page: string) => void })','export function SettingsScreen()').replace(/\s*\{d.members.length < 2 && <p>\{C.couples.waiting\}<\/p>\}/,'').replace(/\s*<h3>\{C.settings.install\}<\/h3>\s*<p>\{C.settings.installHint\}<\/p>/,'').replace(/\s*<section\s+className="settings-card theme-card"[\s\S]*?<\/section>/,''));
edit('src/features/daily/screen.tsx',s=>s.replace(/<p>\s*\{d.notes\[0\]\?\.visibility === "private"[\s\S]*?: C.notes.subtitle\}\s*<\/p>/,`{d.notes[0] && (
                <p>{d.notes[0].visibility === "private" ? C.common.private : C.common.shared}</p>
              )}`).replace(/\s*<small>\{C.activities.subtitle\}<\/small>/,''));
