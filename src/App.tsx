import { useEffect, useState } from 'react';
import { allPhrases, lessons, Phrase } from './data/lessons';
import {
  addSeconds,
  duePhraseIds,
  loadProgress,
  nextTestForm,
  recordAttempt,
  recordTest,
} from './lib/progress';
import { Home } from './components/Home';
import { Practice } from './components/Practice';
import { Test } from './components/Test';
import { Results } from './components/Results';

type View =
  | { kind: 'home' }
  | { kind: 'lesson'; id: string }
  | { kind: 'review'; phrases: Phrase[] }
  | { kind: 'test'; form: 'A' | 'B' }
  | { kind: 'results' };

const TICK_SECONDS = 5;
const IDLE_MS = 90_000;

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [view, setView] = useState<View>({ kind: 'home' });
  const home = () => setView({ kind: 'home' });

  // นับเวลาฝึกจริง: เฉพาะตอนอยู่ในหน้าฝึก/ทดสอบ หน้าจอเปิดอยู่ และมีการกดภายใน 90 วินาทีล่าสุด
  const practicing = view.kind === 'lesson' || view.kind === 'review' || view.kind === 'test';
  useEffect(() => {
    if (!practicing) return;
    let lastActive = Date.now();
    const mark = () => (lastActive = Date.now());
    window.addEventListener('pointerdown', mark);
    window.addEventListener('keydown', mark);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastActive < IDLE_MS) {
        setProgress((p) => addSeconds(p, TICK_SECONDS));
      }
    }, TICK_SECONDS * 1000);
    return () => {
      window.removeEventListener('pointerdown', mark);
      window.removeEventListener('keydown', mark);
      window.clearInterval(timer);
    };
  }, [practicing]);

  const onAttempt = (id: string, score: number, first: boolean) =>
    setProgress((p) => recordAttempt(p, id, score, first));

  let content;
  switch (view.kind) {
    case 'lesson': {
      const lesson = lessons.find((l) => l.id === view.id)!;
      content = (
        <Practice
          key={lesson.id}
          title={`${lesson.emoji} ${lesson.title}`}
          phrases={lesson.phrases}
          progress={progress}
          onAttempt={onAttempt}
          onBack={home}
          backLabel="บทเรียนทั้งหมด"
        />
      );
      break;
    }
    case 'review':
      content = (
        <Practice
          title="🔁 ทบทวนวันนี้"
          phrases={view.phrases}
          progress={progress}
          onAttempt={onAttempt}
          onBack={home}
          backLabel="หน้าหลัก"
          listenOnlyDefault
        />
      );
      break;
    case 'test':
      content = (
        <Test
          form={view.form}
          previous={progress.tests.at(-1)}
          onFinish={(r) => setProgress((p) => recordTest(p, r))}
          onExit={home}
          onShowResults={() => setView({ kind: 'results' })}
        />
      );
      break;
    case 'results':
      content = <Results progress={progress} onBack={home} />;
      break;
    default:
      content = (
        <Home
          progress={progress}
          onOpen={(id) => setView({ kind: 'lesson', id })}
          onReview={() => {
            // จับรายการไว้ตอนเริ่ม ประโยคจะได้ไม่หายไประหว่างทบทวน
            const ids = new Set(duePhraseIds(progress));
            const phrases = allPhrases.filter((p) => ids.has(p.id));
            if (phrases.length) setView({ kind: 'review', phrases });
          }}
          onTest={() => setView({ kind: 'test', form: nextTestForm(progress) })}
          onResults={() => setView({ kind: 'results' })}
        />
      );
  }

  return (
    <div className="app">
      <header className="top">
        <button className="brand" onClick={home}>
          🗣️ Devonix <span>English</span>
        </button>
        <span className="muted">ฝึกพูดภาษาอังกฤษ</span>
      </header>
      <main>{content}</main>
    </div>
  );
}
