// Text-to-speech และ speech recognition ที่มีในเบราว์เซอร์ (ไม่ต้องใช้ backend)

/* eslint-disable @typescript-eslint/no-explicit-any */
const SpeechRecognitionCtor: any =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : undefined;

export const recognitionSupported = Boolean(SpeechRecognitionCtor);
export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  return (
    en.find((v) => v.lang === 'en-US' && /google|samantha|natural/i.test(v.name)) ||
    en.find((v) => v.lang === 'en-US') ||
    en[0]
  );
}

export function speak(text: string, rate = 1, onEnd?: () => void): void {
  if (!ttsSupported) {
    onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  const voice = pickVoice();
  if (voice) u.voice = voice;
  if (onEnd) u.onend = () => onEnd();
  synth.speak(u);
}

// บางเบราว์เซอร์โหลดรายชื่อเสียงช้า
if (ttsSupported) window.speechSynthesis.onvoiceschanged = () => pickVoice();

let current: HTMLAudioElement | null = null;

/** หยุดเสียงที่กำลังเล่นอยู่ทั้งหมด */
export function stopAudio(): void {
  current?.pause();
  current = null;
  if (ttsSupported) window.speechSynthesis.cancel();
}

/**
 * เล่นไฟล์เสียงที่สร้างไว้ล่วงหน้า (public/audio/<id>.m4a)
 * ถ้าไม่มีไฟล์ จะใช้เสียงอ่านของเบราว์เซอร์แทน
 */
export function playPhrase(id: string, text: string, slow = false, onEnd?: () => void): void {
  stopAudio();
  const audio = new Audio(`${import.meta.env.BASE_URL}audio/${id}${slow ? '-slow' : ''}.m4a`);
  current = audio;
  let fellBack = false;
  const fallback = () => {
    if (current !== audio || fellBack) return;
    fellBack = true;
    speak(text, slow ? 0.6 : 1, onEnd);
  };
  audio.onerror = fallback;
  audio.onended = () => {
    if (current === audio) onEnd?.();
  };
  audio.play().catch(fallback);
}

export interface ListenHandle {
  stop: () => void;
}

export interface ListenCallbacks {
  onResult: (alternatives: string[]) => void;
  /** code = รหัส error ของเบราว์เซอร์ เช่น 'no-speech', 'not-allowed' */
  onError: (message: string, code: string) => void;
  onEnd: () => void;
}

const errorMessages: Record<string, string> = {
  'not-allowed': 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์',
  'no-speech': 'ไม่ได้ยินเสียงพูด ลองพูดใหม่อีกครั้งให้ดังขึ้น',
  'audio-capture': 'ไม่พบไมโครโฟน',
  network: 'การเชื่อมต่ออินเทอร์เน็ตมีปัญหา',
};

export function listen({ onResult, onError, onEnd }: ListenCallbacks): ListenHandle | null {
  if (!SpeechRecognitionCtor) return null;
  const rec = new SpeechRecognitionCtor();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 5;
  rec.continuous = false;

  rec.onresult = (e: any) => {
    const result = e.results[0];
    const alts: string[] = [];
    for (let i = 0; i < result.length; i++) alts.push(result[i].transcript);
    onResult(alts);
  };
  rec.onerror = (e: any) => {
    if (e.error === 'aborted') return;
    onError(errorMessages[e.error] ?? `เกิดข้อผิดพลาด: ${e.error}`, e.error);
  };
  rec.onend = onEnd;
  rec.start();
  return { stop: () => rec.stop() };
}
