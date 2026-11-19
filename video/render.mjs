// Kadrlarni chiqaradi (parallel) va ffmpeg bilan MP4 ga yig'adi.
// Ishlatish: node render.mjs [preview]   (preview — faqat bir nechta kadr, tekshirish uchun)
import puppeteer from 'puppeteer-core';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { scenes } from './scenes.mjs';

const ROOT = fileURLToPath(new URL('./', import.meta.url));
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const FPS = 30, WORKERS = 5;
const PREVIEW = process.argv[2] === 'preview';
const durations = JSON.parse(fs.readFileSync(ROOT + 'audio/durations.json', 'utf8'));
const rects = JSON.parse(fs.readFileSync(ROOT + 'shots/rects.json', 'utf8'));
const data = { scenes: scenes.map((s) => ({ ...s, dur: durations[s.id] })), rects };
const HEAD = 0.5, TAIL = 0.7;
const lens = data.scenes.map((s) => HEAD + s.dur + TAIL);
const total = lens.reduce((a, b) => a + b, 0);
const frames = Math.ceil(total * FPS);
console.log(`davomiyligi: ${total.toFixed(1)}s, kadrlar: ${frames}`);

const FR = ROOT + 'frames/';
fs.mkdirSync(FR, { recursive: true });

const FLAGS = ['--allow-file-access-from-files', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'];
const url = pathToFileURL(ROOT + 'reel.html').href;

const previewTimes = PREVIEW ? [1.5, 12, 22, 30, 41, 52, 60, 66, 72, total - 3].map((t) => Math.min(Math.round(t * FPS), frames - 1)) : null;
const todo = previewTimes || Array.from({ length: frames }, (_, i) => i);

async function worker(id) {
  const browser = await puppeteer.launch({ executablePath: CH, headless: 'new', args: FLAGS, protocolTimeout: 120000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((d) => { window.__DATA = d; }, data);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction('window.READY === true');
  for (let k = id; k < todo.length; k += WORKERS) {
    const f = todo[k];
    await page.evaluate((t) => window.render(t), f / FPS);
    await page.screenshot({ path: `${FR}${PREVIEW ? 'p' : 'f'}${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
    if (!PREVIEW && k % 300 === id) console.log(`  kadr ${f}/${frames}`);
  }
  await browser.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));
if (PREVIEW) { console.log('preview kadrlari:', previewTimes.join(',')); process.exit(0); }

// ---- Ovoz: har sahna HEAD sekund jimlikdan keyin boshlanadi va sahna uzunligigacha to'ldiriladi
fs.mkdirSync(ROOT + 'out', { recursive: true });
const wavs = [];
data.scenes.forEach((s, i) => {
  const out = `${ROOT}out/a${i}.wav`;
  const r = spawnSync(ffmpegPath, ['-y', '-i', `${ROOT}audio/${s.id}.mp3`, '-af', `adelay=${Math.round(HEAD * 1000)}|${Math.round(HEAD * 1000)},apad=whole_dur=${lens[i].toFixed(3)}`, '-ar', '44100', '-ac', '2', out]);
  if (r.status !== 0) { console.log(r.stderr.toString()); process.exit(1); }
  wavs.push(out);
});
fs.writeFileSync(ROOT + 'out/list.txt', wavs.map((w) => `file '${w.replace(/\\/g, '/')}'`).join('\n'));
let r = spawnSync(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', ROOT + 'out/list.txt', '-c', 'copy', ROOT + 'out/voice.wav']);
if (r.status !== 0) { console.log(r.stderr.toString()); process.exit(1); }

// ---- MP4 (Instagram Reels: 1080x1920, H.264, AAC, 30fps)
const mp4 = ROOT + 'zayd-reel.mp4';
r = spawnSync(ffmpegPath, ['-y', '-framerate', String(FPS), '-i', `${FR}f%05d.jpg`, '-i', ROOT + 'out/voice.wav',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-shortest', mp4]);
if (r.status !== 0) { console.log(r.stderr.toString().slice(-1500)); process.exit(1); }
console.log('TAYYOR:', mp4, (fs.statSync(mp4).size / 1048576).toFixed(1) + ' MB');
