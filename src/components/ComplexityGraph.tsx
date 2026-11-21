import React, { useMemo } from 'react';
import { Activity, Clock3, Database } from 'lucide-react';
import { SearchStep } from '../types/graph';

interface ComplexityGraphProps {
  steps: SearchStep[];
  currentStepIndex: number;
  timeComplexity: string;
  spaceComplexity: string;
}

export const ComplexityGraph: React.FC<ComplexityGraphProps> = ({
  steps,
  currentStepIndex,
  timeComplexity,
  spaceComplexity,
}) => {
  const history = useMemo(
    () =>
      steps.slice(0, currentStepIndex + 1).map((step, index, visibleSteps) => {
        const previous = index > 0 ? visibleSteps[index - 1].visited.length : 0;
        const delta = Math.max(0, step.visited.length - previous);
        return {
          time: step.visited.length,
          space: step.visited.length + step.frontier.length,
          frontier: step.frontier.length,
          delta,
          failed: step.phase === 'no_path',
          reached: step.phase === 'goal_reached',
        };
      }),
    [steps, currentStepIndex]
  );

  const latest = history[history.length - 1] || { time: 0, space: 0, frontier: 0, delta: 0, failed: false, reached: false };
  const maxValue = Math.max(1, ...history.flatMap((point) => [point.time, point.space]));
  const width = 280;
  const height = 150;
  const chartLeft = 18;
  const chartRight = 272;
  const chartTop = 12;
  const chartBottom = 128;

  const makePoints = (key: 'time' | 'space') => {
    if (history.length === 0) return '';
    return history
      .map((point, index) => {
        const x =
          history.length === 1
            ? chartRight
            : chartLeft + (index / (history.length - 1)) * (chartRight - chartLeft);
        const y = chartBottom - (point[key] / maxValue) * (chartBottom - chartTop);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const timePoints = makePoints('time');
  const spacePoints = makePoints('space');
  const failureIndex = history.findIndex((point) => point.failed);
  const peak = history.reduce(
    (best, point, index) => (point.delta > best.delta ? { index, delta: point.delta } : best),
    { index: -1, delta: 0 }
  );
  const failureStep = failureIndex >= 0 ? failureIndex : peak.index;
  const failureX =
    failureStep >= 0 && history.length > 1
      ? chartLeft + (failureStep / (history.length - 1)) * (chartRight - chartLeft)
      : null;
  const latestStep = history[history.length - 1];
  const status = latestStep?.failed
    ? 'Search exhausted'
    : latestStep?.reached
      ? 'Goal reached'
      : peak.delta >= 2
        ? 'Workload spike'
        : 'Searching normally';
  const statusColor = latestStep?.failed
    ? 'text-[var(--text)]'
    : latestStep?.reached
      ? 'text-[var(--accent)]'
      : 'text-[var(--secondary)]';

  return (
    <div className="h-full overflow-y-auto p-3 bg-white/75">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-teal-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Complexity</h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--accent)]">
          Step {history.length}/{steps.length}
        </span>
      </div>

      <div className="mb-3 rounded-lg border border-[var(--surface)]/50 bg-[var(--base)]/55 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent)]">Run state</span>
          <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
        </div>
        <div className="mt-1 text-[10px] text-[var(--secondary)]">
          Current frontier: <strong>{latest.frontier}</strong> · Step workload:{' '}
          <strong>{latest.delta}</strong> node(s)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg border border-[var(--surface)]/60 bg-[var(--base)]/70 p-2">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--accent)]">
            <Clock3 size={12} /> Time
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">{latest.time}</div>
          <div className="text-[10px] font-mono text-slate-500">nodes expanded</div>
        </div>
        <div className="rounded-lg border border-teal-200/70 bg-teal-50/70 p-2">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-teal-700">
            <Database size={12} /> Space
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">{latest.space}</div>
          <div className="text-[10px] font-mono text-slate-500">nodes retained</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          { title: 'Time Complexity', points: timePoints, color: 'var(--surface)', icon: Clock3, value: latest.time },
          { title: 'Space Complexity', points: spacePoints, color: 'var(--accent)', icon: Database, value: latest.space },
        ].map((chart) => (
          <div key={chart.title} className="rounded-xl border border-[var(--accent)]/30 bg-[var(--base)]/70 p-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--secondary)]">
                {chart.icon === Clock3 ? <Clock3 size={12} /> : <Database size={12} />}
                {chart.title}
              </div>
              <span className="text-sm font-bold text-[var(--text)]">{chart.value}</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28" role="img" aria-label={`Live ${chart.title.toLowerCase()} graph`}>
              {[0, 1, 2, 3].map((line) => {
                const y = chartTop + (line / 3) * (chartBottom - chartTop);
                return <line key={line} x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="var(--accent)" strokeOpacity="0.22" strokeDasharray="3 4" />;
              })}
              {chart.points && <polyline points={chart.points} fill="none" stroke={chart.color} strokeWidth="3" strokeLinejoin="round" />}
              {failureX !== null && (
                <>
                  <line x1={failureX} x2={failureX} y1={chartTop} y2={chartBottom} stroke="var(--text)" strokeWidth="2" strokeDasharray="5 3" />
                  <circle cx={failureX} cy={chartBottom - 8} r="4" fill="var(--text)" />
                </>
              )}
              <text x={chartLeft} y={144} fontSize="9" fill="var(--muted)">start</text>
              <text x={chartRight} y={144} textAnchor="end" fontSize="9" fill="var(--muted)">current</text>
            </svg>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-lg bg-slate-900/90 text-white p-2">
          <div className="text-[9px] uppercase text-slate-300">Asymptotic time</div>
          <div className="mt-1 font-mono text-xs font-bold">{timeComplexity}</div>
        </div>
        <div className="rounded-lg bg-slate-900/90 text-white p-2">
          <div className="text-[9px] uppercase text-slate-300">Asymptotic space</div>
          <div className="mt-1 font-mono text-xs font-bold">{spaceComplexity}</div>
        </div>
      </div>
    </div>
  );
};
