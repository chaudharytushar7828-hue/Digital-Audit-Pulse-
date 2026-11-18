import { getScoreColorSet } from '../utils/url';
import type { LetterGrade } from '../types/audit';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'lg';
  grade?: LetterGrade;
  label?: string;
}

export function ScoreGauge({ score, size = 'lg', grade, label }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const colors = getScoreColorSet(clamped);

  const dimension = size === 'lg' ? 148 : 76;
  const strokeWidth = size === 'lg' ? 11 : 7;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center justify-center shrink-0">
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: dimension, height: dimension }}
        role="img"
        aria-label={`${label ? `${label} score: ` : 'Score: '}${clamped} out of 100${grade ? `, Grade ${grade}` : ''}`}
      >
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="-rotate-90"
        >
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800"
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-display font-bold tabular-nums leading-none ${
              size === 'lg' ? 'text-4xl text-slate-900 dark:text-white' : 'text-xl text-slate-900 dark:text-white'
            }`}
          >
            {clamped}
          </span>
          {size === 'lg' ? (
            <span className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {grade ? `Grade ${grade} · /100` : '/ 100'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
