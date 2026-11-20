import { useEffect, useRef, useState } from 'react';
import { Phrase } from '../data/lessons';
import { listen, ListenHandle, playPhrase, recognitionSupported, stopAudio } from '../lib/speech';
import { feedback, scoreSpeech, ScoreResult } from '../lib/score';
import { Progress, PASS } from '../lib/progress';

interface Props {
  title: string;
  phrases: Phrase[];
  progress: Progress;
  /** firstAttempt = ครั้งแรกของประโยคนี้ในรอบนี้ (ใช้อัปเดตระบบทบทวน) */
  onAttempt: (phraseId: string, score: number, firstAttempt: boolean) => void;
  onBack: () => void;
  backLabel: string;
  /** เริ่มในโหมดฟังอย่างเดียว (ซ่อนตัวหนังสือ) */
  listenOnlyDefault?: boolean;
}

export function Practice({ title, phrases, progress, onAttempt, onBack, backLabel, listenOnlyDefault = false }: Props) {
  const [index, setIndex] = useState(0);
  const [listenOnly, setListenOnly] = useState(listenOnlyDefault);
  const [revealed, setRevealed] = useState(false);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handle = useRef<ListenHandle | null>(null);
  const attempted = useRef(new Set<string>());

  const phrase = phrases[index];
  const best = progress.best[phrase.id];
  const hidden = listenOnly && !revealed && !result;

  useEffect(() => {
    setResult(null);
    setError(null);
    setRevealed(false);
    handle.current?.stop();
    // โหมดฟังอย่างเดียว: เล่นเสียงให้ทันทีเมื่อเปลี่ยนประโยค
    if (listenOnly) playPhrase(phrase.id, phrase.en);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(
    () => () => {
      handle.current?.stop();
      stopAudio();
    },
    [],
  );

  const startListening = () => {
    if (listening) {
      handle.current?.stop();
      return;
    }
    stopAudio();
    setError(null);
    setResult(null);
    setListening(true);
    handle.current = listen({
      onResult: (alts) => {
        const r = scoreSpeech(phrase.en, alts);
        setResult(r);
        const first = !attempted.current.has(phrase.id);
        attempted.current.add(phrase.id);
        onAttempt(phrase.id, r.score, first);
      },
      onError: setError,
      onEnd: () => setListening(false),
    });
  };

  const fb = result ? feedback(result.score) : null;

  return (
    <>
      <div className="practice-head">
        <button className="link-btn" onClick={onBack}>← {backLabel}</button>
        <span className="muted">{title} · {index + 1}/{phrases.length}</span>
      </div>

      <div className="dots">
        {phrases.map((p, i) => {
          const s = progress.best[p.id];
          const cls = s === undefined ? '' : s >= PASS ? 'pass' : 'tried';
          return (
            <button
              key={p.id}
              className={`dot ${cls} ${i === index ? 'current' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`ประโยคที่ ${i + 1}`}
            />
          );
        })}
      </div>

      <label className="toggle">
        <input type="checkbox" checked={listenOnly} onChange={(e) => setListenOnly(e.target.checked)} />
        👂 ฟังอย่างเดียว (ซ่อนตัวหนังสือ)
      </label>

      <article className="card">
        {hidden ? (
          <>
            <p className="phrase-hidden">ฟังแล้วพูดตาม</p>
            <button className="link-btn" onClick={() => setRevealed(true)}>ดูเฉลย</button>
          </>
        ) : (
          <>
            <p className="phrase-en">
              {result
                ? result.words.map((w, i) => (
                    <span key={i} className={w.ok ? 'w-ok' : 'w-bad'}>{w.word} </span>
                  ))
                : phrase.en}
            </p>
            <p className="phrase-th">{phrase.th}</p>
            {phrase.tip && <p className="tip">💡 {phrase.tip}</p>}
          </>
        )}

        <div className="actions">
          <button className="btn" onClick={() => playPhrase(phrase.id, phrase.en)}>🔊 ฟัง</button>
          <button className="btn" onClick={() => playPhrase(phrase.id, phrase.en, true)}>🐢 ฟังช้า</button>
        </div>

        <button
          className={`mic ${listening ? 'on' : ''}`}
          onClick={startListening}
          disabled={!recognitionSupported}
          aria-label={listening ? 'หยุดอัดเสียง' : 'กดแล้วพูด'}
        >
          🎤
        </button>
        <p className="muted center">
          {listening ? 'กำลังฟัง... พูดได้เลย' : hidden ? 'กดไมค์แล้วพูดสิ่งที่ได้ยิน' : 'กดไมค์แล้วพูดประโยคด้านบน'}
        </p>

        {!recognitionSupported && (
          <p className="warn">เบราว์เซอร์นี้ไม่รองรับการจดจำเสียง กรุณาใช้ Google Chrome, Edge หรือ Safari</p>
        )}
        {error && <p className="warn">{error}</p>}

        {result && fb && (
          <div className={`result ${result.score >= PASS ? 'good' : ''}`}>
            <div className="score">{fb.emoji} {result.score}<small>/100</small></div>
            <p>{fb.text}</p>
            <p className="muted">ระบบได้ยินว่า: “{result.heard}”</p>
          </div>
        )}
        {best !== undefined && !result && <p className="muted center">คะแนนสูงสุด: {best}</p>}
      </article>

      <div className="nav">
        <button className="btn" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
          ← ก่อนหน้า
        </button>
        {index < phrases.length - 1 ? (
          <button className="btn primary" onClick={() => setIndex((i) => i + 1)}>ถัดไป →</button>
        ) : (
          <button className="btn primary" onClick={onBack}>เสร็จแล้ว ✓</button>
        )}
      </div>
    </>
  );
}
