import { useState } from 'react';
import { GOAL_HOURS, Progress, TestResult, dayString, totalHours } from '../lib/progress';

interface Props {
  progress: Progress;
  onBack: () => void;
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

export function Results({ progress, onBack }: Props) {
  const hours = totalHours(progress);
  const pct = Math.min(100, (hours / GOAL_HOURS) * 100);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return progress.seconds[dayString(d)] ?? 0;
  }).reduce((a, b) => a + b, 0);
  const tests = progress.tests;

  return (
    <>
      <div className="practice-head">
        <button className="link-btn" onClick={onBack}>← หน้าหลัก</button>
        <span className="muted">ผลการเรียน</span>
      </div>

      <section className="card left">
        <h3>⏱️ เวลาฝึก</h3>
        <p className="big-number">
          {hours < 1 ? `${Math.round(hours * 60)} นาที` : `${hours.toFixed(1)} ชั่วโมง`}
          <small> / เป้า {GOAL_HOURS} ชั่วโมง</small>
        </p>
        <span className="bar"><span className="bar-fill" style={{ width: `${pct}%` }} /></span>
        <p className="muted">
          7 วันล่าสุดฝึกไป {Math.round(last7 / 60)} นาที · Cambridge ประมาณว่าต้องฝึกราว 90–100 ชั่วโมงถึงระดับ A1
        </p>
      </section>

      <section className="card left">
        <h3>📝 ผลทดสอบ</h3>
        {tests.length === 0 ? (
          <p className="muted">ยังไม่เคยทำแบบทดสอบ ทำครั้งแรกเพื่อใช้เป็นจุดเริ่มต้นในการเทียบพัฒนาการ</p>
        ) : (
          <>
            <LineChart
              title="ความถูกต้อง (%)"
              points={tests.map((t) => ({ label: shortDate(t.date), value: t.accuracy }))}
              max={100}
              unit="%"
            />
            {tests.some((t) => t.wpm !== null) && (
              <LineChart
                title="ความเร็วในการพูด (คำต่อนาที)"
                points={tests
                  .filter((t) => t.wpm !== null)
                  .map((t) => ({ label: shortDate(t.date), value: t.wpm! }))}
                unit=" คำ/นาที"
              />
            )}
            <TestTable tests={tests} />
          </>
        )}
      </section>
    </>
  );
}

interface Point {
  label: string;
  value: number;
}

function LineChart({ title, points, max, unit }: { title: string; points: Point[]; max?: number; unit: string }) {
  const [active, setActive] = useState<number | null>(points.length - 1);
  const W = 320;
  const H = 150;
  const pad = { l: 32, r: 16, t: 16, b: 24 };
  const top = max ?? Math.max(10, Math.ceil((Math.max(...points.map((p) => p.value)) * 1.2) / 10) * 10);
  const x = (i: number) =>
    points.length === 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i * (W - pad.l - pad.r)) / (points.length - 1);
  const y = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const ticks = [0, top / 2, top];
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  const a = active !== null ? points[active] : null;

  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${points.map((p) => `${p.label} ${p.value}`).join(', ')}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
            <text className="axis" x={pad.l - 6} y={y(t) + 4} textAnchor="end">{Math.round(t)}</text>
          </g>
        ))}
        {points.length > 1 && <path className="line" d={path} />}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0}>
            <circle className="hit" cx={x(i)} cy={y(p.value)} r={14} />
            <circle className={`dot-mark ${active === i ? 'on' : ''}`} cx={x(i)} cy={y(p.value)} r={active === i ? 5 : 4} />
            {(i === 0 || i === points.length - 1 || points.length <= 6) && (
              <text className="axis" x={x(i)} y={H - 6} textAnchor="middle">{p.label}</text>
            )}
          </g>
        ))}
        {a && active !== null && (
          <text
            className="tip-label"
            x={Math.min(Math.max(x(active), pad.l + 30), W - pad.r - 30)}
            y={Math.max(y(a.value) - 12, 12)}
            textAnchor="middle"
          >
            {a.label}: {a.value}{unit}
          </text>
        )}
      </svg>
    </figure>
  );
}

function TestTable({ tests }: { tests: TestResult[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>วันที่</th>
          <th>ชุด</th>
          <th>ถูกต้อง</th>
          <th>คำ/นาที</th>
          <th>หยุดเว้น</th>
        </tr>
      </thead>
      <tbody>
        {[...tests].reverse().map((t) => (
          <tr key={t.date}>
            <td>{shortDate(t.date)}</td>
            <td>{t.form}</td>
            <td>{t.accuracy}%</td>
            <td>{t.wpm ?? '–'}</td>
            <td>{t.pauseRatio === null ? '–' : `${Math.round(t.pauseRatio * 100)}%`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
