// สร้างไฟล์เสียงของทุกประโยคด้วย Kokoro TTS (โอเพนซอร์ส Apache 2.0) รันบนเครื่องนี้ ไม่เสียเงิน
// ใช้: npm run audio            (สร้างเฉพาะประโยคที่ยังไม่มี หรือข้อความเปลี่ยน)
//      npm run audio -- --force (สร้างใหม่ทั้งหมด)
import { KokoroTTS } from 'kokoro-js';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { allPhrases } from '../src/data/lessons.ts';
import { allTestItems } from '../src/data/tests.ts';

const VOICE = 'af_heart'; // เสียงผู้หญิง สำเนียงอเมริกัน
const VARIANTS = [
  { suffix: '', speed: 1 },
  { suffix: '-slow', speed: 0.7 },
];

const outDir = path.resolve('public/audio');
const manifestPath = path.join(outDir, 'manifest.json');
const force = process.argv.includes('--force');

mkdirSync(outDir, { recursive: true });
const manifest: Record<string, string> =
  !force && existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

const job = (id: string, text: string, suffix: string, speed: number) => ({
  file: `${id}${suffix}.m4a`,
  text,
  speed,
  key: `${VOICE}|${speed}|${text}`,
});

const jobs = [
  // บทเรียน: ความเร็วปกติ + แบบช้า
  ...allPhrases.flatMap((p) => VARIANTS.map((v) => job(p.id, p.en, v.suffix, v.speed))),
  // แบบทดสอบ: ความเร็วปกติอย่างเดียว (ฟังครั้งเดียว)
  ...allTestItems.map((t) => job(t.id, t.en, '', 1)),
].filter((j) => manifest[j.file] !== j.key || !existsSync(path.join(outDir, j.file)));

if (jobs.length === 0) {
  console.log('ไฟล์เสียงครบและเป็นปัจจุบันแล้ว');
  process.exit(0);
}

console.log('กำลังโหลดโมเดล Kokoro (ครั้งแรกจะดาวน์โหลดประมาณ 90MB)...');
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
  dtype: 'q8',
  device: 'cpu',
});

const tmp = mkdtempSync(path.join(tmpdir(), 'devonix-audio-'));
try {
  for (const [i, job] of jobs.entries()) {
    const wav = path.join(tmp, 'out.wav');
    const audio = await tts.generate(job.text, { voice: VOICE, speed: job.speed });
    await audio.save(wav);
    // แปลงเป็น AAC (.m4a) ไฟล์เล็กและเล่นได้ทุกเบราว์เซอร์
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', wav, path.join(outDir, job.file)]);
    manifest[job.file] = job.key;
    console.log(`[${i + 1}/${jobs.length}] ${job.file}  "${job.text}"`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(`เสร็จแล้ว: ${outDir}`);
