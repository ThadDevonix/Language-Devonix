// วัดความคล่องจากเสียงไมโครโฟน: ช่วงที่เริ่ม–หยุดพูด และการหยุดเว้นระหว่างพูด
// ใช้ Web Audio วัดความดังทีละ 20ms (ไม่ได้บันทึกหรือส่งเสียงไปที่ไหน)

const FRAME_MS = 20;
/** ความเงียบที่ยาวกว่านี้ระหว่างพูด นับเป็นการหยุดเว้น (ตามงานวิจัยด้าน fluency ที่ใช้ 250ms) */
const MIN_PAUSE_MS = 250;

export interface VoiceMetrics {
  speechMs: number; // เวลาตั้งแต่เริ่มพูดจนหยุดพูด
  pauseMs: number; // เวลาหยุดเว้นรวม
  pauses: number; // จำนวนครั้งที่หยุดเว้น
}

export interface VoiceMeter {
  stop: () => VoiceMetrics | null;
}

export async function startVoiceMeter(): Promise<VoiceMeter | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null;
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch {
    return null;
  }
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  const levels: number[] = [];

  const timer = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    levels.push(Math.sqrt(sum / buf.length));
  }, FRAME_MS);

  return {
    stop: () => {
      window.clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
      return analyse(levels);
    },
  };
}

function analyse(levels: number[]): VoiceMetrics | null {
  if (levels.length < 10) return null;
  // ระดับเสียงรบกวนพื้นหลัง = เปอร์เซ็นไทล์ที่ 20
  const sorted = [...levels].sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.2)];
  const threshold = Math.max(0.01, noise * 3);
  const voiced = levels.map((l) => l > threshold);

  const first = voiced.indexOf(true);
  const last = voiced.lastIndexOf(true);
  if (first < 0 || last - first < 5) return null;

  let pauses = 0;
  let pauseFrames = 0;
  let run = 0;
  for (let i = first; i <= last; i++) {
    if (!voiced[i]) {
      run++;
    } else {
      if (run * FRAME_MS >= MIN_PAUSE_MS) {
        pauses++;
        pauseFrames += run;
      }
      run = 0;
    }
  }
  return { speechMs: (last - first + 1) * FRAME_MS, pauseMs: pauseFrames * FRAME_MS, pauses };
}
