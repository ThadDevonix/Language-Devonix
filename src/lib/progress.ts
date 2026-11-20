// เก็บความคืบหน้าไว้ใน localStorage ของผู้ใช้

const KEY = 'devonix-progress-v1';

/** ถือว่า "ผ่าน" เมื่อได้ 80 คะแนนขึ้นไป */
export const PASS = 80;

/** เป้าหมายชั่วโมงฝึกสำหรับระดับ A1 (Cambridge ประมาณ 90–100 ชั่วโมง) */
export const GOAL_HOURS = 100;

/** ระยะห่างการทบทวน (วัน) ตามกล่อง Leitner 1–5 */
const INTERVALS = [0, 1, 3, 7, 14, 30];

export interface SrsEntry {
  box: number; // 1–5
  due: string; // YYYY-MM-DD
}

export interface TestResult {
  date: string; // ISO
  form: 'A' | 'B';
  accuracy: number; // 0–100 ค่าเฉลี่ยความถูกต้อง
  wpm: number | null; // คำต่อนาที (ค่ามัธยฐาน)
  pauseRatio: number | null; // สัดส่วนเวลาที่หยุดเว้นระหว่างพูด 0–1
  items: number[]; // คะแนนรายข้อ
}

export interface Progress {
  best: Record<string, number>; // phraseId -> คะแนนสูงสุด
  lastDay?: string;
  streak: number;
  seconds: Record<string, number>; // วัน -> วินาทีที่ฝึก
  srs: Record<string, SrsEntry>;
  tests: TestResult[];
}

const empty: Progress = { best: {}, streak: 0, seconds: {}, srs: {}, tests: [] };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

function save(p: Progress): Progress {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
  return p;
}

export function dayString(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dayString(d);
}

function touchStreak(p: Progress): Pick<Progress, 'lastDay' | 'streak'> {
  const today = dayString();
  if (p.lastDay === today) return { lastDay: today, streak: p.streak };
  return { lastDay: today, streak: p.lastDay === addDays(-1) ? p.streak + 1 : 1 };
}

export function currentStreak(p: Progress): number {
  return p.lastDay === dayString() || p.lastDay === addDays(-1) ? p.streak : 0;
}

/**
 * บันทึกคะแนนการพูด 1 ครั้ง
 * updateSrs = true เฉพาะครั้งแรกของประโยคนั้นในรอบฝึก (ไม่ให้ลองซ้ำจนผ่านแล้วนับเป็นจำได้)
 */
export function recordAttempt(p: Progress, phraseId: string, score: number, updateSrs: boolean): Progress {
  let srs = p.srs;
  if (updateSrs) {
    const entry = p.srs[phraseId];
    const passed = score >= PASS;
    if (entry || passed) {
      // ประโยคจะเข้าระบบทบทวนเมื่อพูดผ่านครั้งแรก ถ้าลืมจะกลับไปกล่อง 1
      const box = passed ? Math.min((entry?.box ?? 0) + 1, 5) : 1;
      srs = { ...p.srs, [phraseId]: { box, due: addDays(INTERVALS[box]) } };
    }
  }
  return save({
    ...p,
    ...touchStreak(p),
    best: { ...p.best, [phraseId]: Math.max(p.best[phraseId] ?? 0, score) },
    srs,
  });
}

export function duePhraseIds(p: Progress): string[] {
  const today = dayString();
  return Object.entries(p.srs)
    .filter(([, e]) => e.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}

export function recordTest(p: Progress, result: TestResult): Progress {
  return save({ ...p, ...touchStreak(p), tests: [...p.tests, result] });
}

export function addSeconds(p: Progress, s: number): Progress {
  const today = dayString();
  return save({ ...p, seconds: { ...p.seconds, [today]: (p.seconds[today] ?? 0) + s } });
}

export function totalHours(p: Progress): number {
  return Object.values(p.seconds).reduce((a, b) => a + b, 0) / 3600;
}

export function todayMinutes(p: Progress): number {
  return Math.floor((p.seconds[dayString()] ?? 0) / 60);
}

/** ชุดข้อสอบถัดไป (สลับ A/B) */
export function nextTestForm(p: Progress): 'A' | 'B' {
  return p.tests.at(-1)?.form === 'A' ? 'B' : 'A';
}

/** จำนวนวันจนถึงการทดสอบครั้งถัดไป (0 = ทำได้เลย) */
export function daysUntilTest(p: Progress, intervalDays: number): number {
  const last = p.tests.at(-1);
  if (!last) return 0;
  const elapsed = (Date.now() - new Date(last.date).getTime()) / 86400000;
  return Math.max(0, Math.ceil(intervalDays - elapsed));
}
