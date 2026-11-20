// ให้คะแนนการออกเสียงโดยเทียบคำที่ระบบจดจำได้กับประโยคต้นแบบ

const contractions: Record<string, string> = {
  "i'm": 'i am',
  "i'd": 'i would',
  "i'll": 'i will',
  "it's": 'it is',
  "you're": 'you are',
  "don't": 'do not',
  "can't": 'can not',
  cannot: 'can not',
  "what's": 'what is',
  "where's": 'where is',
  "that's": 'that is',
  "let's": 'let us',
};

const numbers: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
};

export function tokenize(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ');
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (contractions[w] ?? numbers[w] ?? w).split(' '));
}

export interface WordResult {
  word: string; // คำต้นฉบับที่แสดงผล
  ok: boolean;
}

export interface ScoreResult {
  score: number; // 0–100
  words: WordResult[];
  heard: string;
}

/** จับคู่คำด้วย LCS แล้วคืนว่าคำไหนในต้นแบบที่พูดถูก */
function matchWords(target: string[], spoken: string[]): boolean[] {
  const n = target.length;
  const m = spoken.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = target[i] === spoken[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const ok = Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (target[i] === spoken[j]) {
      ok[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return ok;
}

function scoreOne(target: string, heard: string): ScoreResult {
  // แสดงผลตามคำต้นฉบับ แต่เทียบด้วยรูปที่ normalize แล้ว
  const displayWords = target.split(/\s+/);
  const groups = displayWords.map((w) => tokenize(w));
  const flatTarget = groups.flat();
  const okFlat = matchWords(flatTarget, tokenize(heard));

  let k = 0;
  const words = displayWords.map((word, idx) => {
    const len = groups[idx].length;
    const ok = len === 0 || okFlat.slice(k, k + len).every(Boolean);
    k += len;
    return { word, ok };
  });

  const correct = okFlat.filter(Boolean).length;
  const score = flatTarget.length ? Math.round((correct / flatTarget.length) * 100) : 0;
  return { score, words, heard };
}

export function scoreSpeech(target: string, alternatives: string[]): ScoreResult {
  return alternatives
    .map((alt) => scoreOne(target, alt))
    .reduce((best, cur) => (cur.score > best.score ? cur : best));
}

export function feedback(score: number): { emoji: string; text: string } {
  if (score === 100) return { emoji: '🌟', text: 'สมบูรณ์แบบ! ออกเสียงได้ชัดเจนมาก' };
  if (score >= 80) return { emoji: '🎉', text: 'เก่งมาก! เกือบสมบูรณ์แล้ว' };
  if (score >= 50) return { emoji: '👍', text: 'ดีแล้ว ลองฝึกคำที่เป็นสีแดงอีกนิด' };
  return { emoji: '💪', text: 'ไม่เป็นไร ลองฟังเสียงแบบช้าแล้วพูดตามอีกครั้ง' };
}
