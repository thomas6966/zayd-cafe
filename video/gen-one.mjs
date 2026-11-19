// Bitta sahna ovozini yaratadi: node gen-one.mjs <id>
import { EdgeTTS } from 'node-edge-tts';
import { scenes, VOICE } from './scenes.mjs';
const s = scenes.find((x) => x.id === process.argv[2]);
const tts = new EdgeTTS({ voice: VOICE, lang: 'uz-UZ', outputFormat: 'audio-24khz-96kbitrate-mono-mp3', rate: '-3%', timeout: 30000 });
await tts.ttsPromise(s.voice, `audio/${s.id}.mp3`);
process.exit(0);
