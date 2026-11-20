import { lessons, allPhrases } from '../data/lessons';
import { TEST_INTERVAL_DAYS } from '../data/tests';
import {
  Progress,
  PASS,
  GOAL_HOURS,
  currentStreak,
  daysUntilTest,
  duePhraseIds,
  todayMinutes,
  totalHours,
} from '../lib/progress';

interface Props {
  progress: Progress;
  onOpen: (lessonId: string) => void;
  onReview: () => void;
  onTest: () => void;
  onResults: () => void;
}

export function Home({ progress, onOpen, onReview, onTest, onResults }: Props) {
  const passed = allPhrases.filter((p) => (progress.best[p.id] ?? 0) >= PASS).length;
  const streak = currentStreak(progress);
  const due = duePhraseIds(progress).length;
  const testIn = daysUntilTest(progress, TEST_INTERVAL_DAYS);
  const lastTest = progress.tests.at(-1);
  const hours = totalHours(progress);

  return (
    <>
      <section className="stats three">
        <div className="stat">
          <span className="stat-value">{passed}/{allPhrases.length}</span>
          <span className="stat-label">ประโยคที่ผ่าน</span>
        </div>
        <div className="stat">
          <span className="stat-value">🔥 {streak}</span>
          <span className="stat-label">วันติดต่อกัน</span>
        </div>
        <div className="stat">
          <span className="stat-value">{todayMinutes(progress)} น.</span>
          <span className="stat-label">ฝึกวันนี้ · รวม {hours.toFixed(1)}/{GOAL_HOURS} ชม.</span>
        </div>
      </section>

      <section className="action-grid">
        <button className={`action-card ${due ? 'hot' : ''}`} onClick={onReview} disabled={!due}>
          <span className="lesson-emoji" aria-hidden>🔁</span>
          <span className="lesson-title">ทบทวนวันนี้</span>
          <span className="lesson-sub">
            {due ? `${due} ประโยคที่ถึงเวลาทบทวน` : 'ไม่มีประโยคค้างทบทวน พูดผ่านในบทเรียนแล้วจะมาอยู่ที่นี่'}
          </span>
        </button>
        <button className={`action-card ${testIn === 0 ? 'hot' : ''}`} onClick={onTest} disabled={testIn > 0}>
          <span className="lesson-emoji" aria-hidden>📝</span>
          <span className="lesson-title">แบบทดสอบวัดผล</span>
          <span className="lesson-sub">
            {!lastTest
              ? 'ทำครั้งแรกเพื่อวัดจุดเริ่มต้น (~5 นาที)'
              : testIn === 0
                ? `ครบ 2 สัปดาห์แล้ว ทดสอบได้เลย (ครั้งก่อน ${lastTest.accuracy}%)`
                : `ทดสอบได้อีกใน ${testIn} วัน (ครั้งก่อน ${lastTest.accuracy}%)`}
          </span>
        </button>
        <button className="action-card" onClick={onResults}>
          <span className="lesson-emoji" aria-hidden>📈</span>
          <span className="lesson-title">ผลการเรียน</span>
          <span className="lesson-sub">กราฟพัฒนาการและเวลาฝึก</span>
        </button>
      </section>

      <h2 className="section-title">บทเรียน</h2>
      <div className="lesson-grid">
        {lessons.map((lesson) => {
          const done = lesson.phrases.filter((p) => (progress.best[p.id] ?? 0) >= PASS).length;
          const pct = Math.round((done / lesson.phrases.length) * 100);
          return (
            <button key={lesson.id} className="lesson-card" onClick={() => onOpen(lesson.id)}>
              <span className="lesson-emoji" aria-hidden>{lesson.emoji}</span>
              <span className="lesson-title">{lesson.title}</span>
              <span className="lesson-sub">{lesson.subtitle}</span>
              <span className="bar" aria-label={`ผ่านแล้ว ${done} จาก ${lesson.phrases.length}`}>
                <span className="bar-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="lesson-count">{done}/{lesson.phrases.length} ประโยค</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
