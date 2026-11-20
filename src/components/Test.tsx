import { useEffect, useRef, useState } from 'react';
import { testForms } from '../data/tests';
import { listen, ListenHandle, playPhrase, recognitionSupported, stopAudio } from '../lib/speech';
import { scoreSpeech, tokenize } from '../lib/score';
import { startVoiceMeter, VoiceMeter, VoiceMetrics } from '../lib/voice';
import { TestResult } from '../lib/progress';

interface Props {
  form: 'A' | 'B';
  previous?: TestResult;
  onFinish: (result: TestResult) => void;
  onExit: () => void;
  onShowResults: () => void;
}

interface ItemResult {
  score: number;
  words: number;
  metrics: VoiceMetrics | null;
}

type Phase = 'intro' | 'playing' | 'listening' | 'scored' | 'done';

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function summarize(form: 'A' | 'B', items: ItemResult[]): TestResult {
  const accuracy = Math.round(items.reduce((a, r) => a + r.score, 0) / items.length);
  const rates = items
    .filter((r) => r.metrics && r.metrics.speechMs > 500 && r.words > 0)
    .map((r) => r.words / (r.metrics!.speechMs / 60000));
  const measured = items.filter((r) => r.metrics && r.words > 0);
  const speech = measured.reduce((a, r) => a + r.metrics!.speechMs, 0);
  const pause = measured.reduce((a, r) => a + r.metrics!.pauseMs, 0);
  const wpm = median(rates);
  return {
    date: new Date().toISOString(),
    form,
    accuracy,
    wpm: wpm === null ? null : Math.round(wpm),
    pauseRatio: speech > 0 ? Math.round((pause / speech) * 100) / 100 : null,
    items: items.map((r) => r.score),
  };
}

export function Test({ form, previous, onFinish, onExit, onShowResults }: Props) {
  const items = testForms.find((f) => f.id === form)!.items;
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [final, setFinal] = useState<TestResult | null>(null);
  const results = useRef<ItemResult[]>([]);
  const rec = useRef<ListenHandle | null>(null);
  const meter = useRef<VoiceMeter | null>(null);

  useEffect(
    () => () => {
      rec.current?.stop();
      meter.current?.stop();
      stopAudio();
    },
    [],
  );

  const runItem = (i: number) => {
    setIndex(i);
    setError(null);
    setPhase('playing');
    playPhrase(items[i].id, items[i].en, false, () => beginListening(i));
  };

  const beginListening = (i: number) => {
    setPhase('listening');
    let alts: string[] = [];
    let fatal = false;
    rec.current = listen({
      onResult: (a) => {
        alts = a;
      },
      onError: (message, code) => {
        // ไม่ได้พูด = ได้ 0 คะแนนข้อนี้ ส่วนปัญหาไมค์ต้องให้ลองใหม่
        if (code !== 'no-speech') {
          fatal = true;
          setError(message);
        }
      },
      onEnd: () => {
        const metrics = meter.current?.stop() ?? null;
        meter.current = null;
        if (fatal) {
          setPhase('scored');
          return;
        }
        const scored = alts.length ? scoreSpeech(items[i].en, alts) : null;
        results.current[i] = {
          score: scored?.score ?? 0,
          words: scored ? tokenize(scored.heard).length : 0,
          metrics,
        };
        setPhase('scored');
      },
    });
    startVoiceMeter().then((m) => {
      // ถ้าการฟังจบไปแล้วก่อนไมค์วัดเสียงพร้อม ให้ปิดทิ้ง
      if (rec.current && phaseRef.current === 'listening') meter.current = m;
      else m?.stop();
    });
  };

  // ใช้ใน callback ที่ async
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  const next = () => {
    if (index < items.length - 1) {
      runItem(index + 1);
    } else {
      const r = summarize(form, results.current);
      setFinal(r);
      setPhase('done');
      onFinish(r);
    }
  };

  if (!recognitionSupported) {
    return <p className="warn">เบราว์เซอร์นี้ไม่รองรับการจดจำเสียง กรุณาใช้ Google Chrome, Edge หรือ Safari</p>;
  }

  if (phase === 'intro') {
    return (
      <>
        <div className="practice-head">
          <button className="link-btn" onClick={onExit}>← หน้าหลัก</button>
          <span className="muted">แบบทดสอบชุด {form}</span>
        </div>
        <article className="card intro">
          <h2>📝 แบบทดสอบฟังแล้วพูดซ้ำ</h2>
          <ul>
            <li>มี {items.length} ข้อ ประโยคจะยาวขึ้นเรื่อย ๆ</li>
            <li>แต่ละข้อจะได้ฟัง <strong>ครั้งเดียว</strong> และไม่เห็นตัวหนังสือ</li>
            <li>พอเสียงจบ ไมค์จะเปิดเอง ให้พูดซ้ำให้เหมือนที่สุด</li>
            <li>จำไม่ได้ทั้งหมดก็ไม่เป็นไร พูดเท่าที่จำได้</li>
            <li>ใช้เวลาประมาณ 5 นาที ควรทำในที่เงียบ</li>
          </ul>
          <p className="muted">
            แบบทดสอบนี้ใช้วิธี Elicited Imitation ที่งานวิจัยใช้วัดระดับการพูด
            ผลที่ได้ใช้ดูพัฒนาการของตัวเอง ไม่ใช่ระดับ CEFR อย่างเป็นทางการ
          </p>
          <button className="btn primary big" onClick={() => runItem(0)}>เริ่มทดสอบ</button>
        </article>
      </>
    );
  }

  if (phase === 'done' && final) {
    const diff = (a: number | null, b: number | null | undefined) =>
      a !== null && b !== null && b !== undefined ? a - b : null;
    const dAcc = diff(final.accuracy, previous?.accuracy);
    const dWpm = diff(final.wpm, previous?.wpm);
    const delta = (d: number | null, unit: string) =>
      d === null ? null : <span className={d >= 0 ? 'up' : 'down'}>{d >= 0 ? '▲' : '▼'} {Math.abs(d)}{unit} จากครั้งก่อน</span>;

    return (
      <article className="card intro">
        <h2>🎉 ทดสอบเสร็จแล้ว</h2>
        <div className="stats wide">
          <div className="stat">
            <span className="stat-value">{final.accuracy}%</span>
            <span className="stat-label">ความถูกต้อง</span>
            {delta(dAcc, '%')}
          </div>
          <div className="stat">
            <span className="stat-value">{final.wpm ?? '–'}</span>
            <span className="stat-label">คำต่อนาที</span>
            {delta(dWpm, '')}
          </div>
        </div>
        <p className="muted">
          ความถูกต้อง = พูดซ้ำได้ตรงกี่ % · คำต่อนาที = ความเร็วในการพูด (ยิ่งสูงยิ่งคล่อง)
          {final.pauseRatio !== null && ` · หยุดเว้นระหว่างพูด ${Math.round(final.pauseRatio * 100)}% ของเวลา`}
        </p>
        <p>ทดสอบครั้งต่อไปอีก 2 สัปดาห์ ระหว่างนี้ฝึกบทเรียนและทบทวนทุกวันนะ</p>
        <div className="nav">
          <button className="btn" onClick={onExit}>หน้าหลัก</button>
          <button className="btn primary" onClick={onShowResults}>ดูผลการเรียน →</button>
        </div>
      </article>
    );
  }

  return (
    <>
      <div className="practice-head">
        <button className="link-btn" onClick={onExit}>← ยกเลิกการทดสอบ</button>
        <span className="muted">ข้อ {index + 1}/{items.length}</span>
      </div>
      <div className="bar test-bar">
        <span className="bar-fill" style={{ width: `${(index / items.length) * 100}%` }} />
      </div>
      <article className="card">
        {phase === 'playing' && <p className="phrase-hidden">🔊 ฟังให้ดี…</p>}
        {phase === 'listening' && (
          <>
            <div className="mic on" aria-hidden>🎤</div>
            <p className="phrase-hidden">พูดซ้ำได้เลย</p>
            <button className="btn" onClick={() => rec.current?.stop()}>พูดเสร็จแล้ว</button>
          </>
        )}
        {phase === 'scored' &&
          (error ? (
            <>
              <p className="warn">{error}</p>
              <button className="btn primary" onClick={() => runItem(index)}>ลองข้อนี้ใหม่</button>
            </>
          ) : (
            <>
              <p className="phrase-hidden">บันทึกแล้ว ✓</p>
              <button className="btn primary big" onClick={next}>
                {index < items.length - 1 ? 'ข้อต่อไป →' : 'ดูผลทดสอบ'}
              </button>
            </>
          ))}
      </article>
    </>
  );
}
