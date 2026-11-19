// Har sahna uchun o'zbekcha ovoz (Microsoft neyron TTS) va davomiyliklar. Mavjud fayllar qayta yaratilmaydi.
import { spawnSync, execFileSync } from 'child_process';
import ffprobe from 'ffprobe-static';
import fs from 'fs';
import { scenes } from './scenes.mjs';

fs.mkdirSync('audio', { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const durations = {};
for (const s of scenes) {
  const file = `audio/${s.id}.mp3`;
  for (let attempt = 1; attempt <= 8 && !(fs.existsSync(file) && fs.statSync(file).size > 2000); attempt++) {
    const r = spawnSync('node', ['gen-one.mjs', s.id], { timeout: 60000 });
    if (r.status === 0) break;
    console.log(`  ${s.id}: urinish ${attempt} muvaffaqiyatsiz, kutaman…`);
    await sleep(15000);
  }
  if (!fs.existsSync(file)) { console.log('YARATILMADI:', s.id); process.exit(1); }
  durations[s.id] = Number(execFileSync(ffprobe.path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
  console.log(s.id, durations[s.id].toFixed(2) + 's');
  await sleep(3000);
}
fs.writeFileSync('audio/durations.json', JSON.stringify(durations, null, 1));
console.log('jami ovoz:', Object.values(durations).reduce((a, b) => a + b, 0).toFixed(1) + 's');
