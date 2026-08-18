'use client';

import { useRoomStore } from '../store/useRoomStore';
import { AuditReport } from '../types/room';

// ─── Score ring SVG component ─────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#22c55e'  // green-500
    : score >= 50 ? '#eab308' // yellow-500
    : '#ef4444';              // red-500

  const bgColor =
    score >= 80 ? '#14532d'
    : score >= 50 ? '#713f12'
    : '#7f1d1d';

  const label =
    score >= 80 ? 'Excellent'
    : score >= 50 ? 'Needs Work'
    : 'Poor';

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#27272a" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="score-ring transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white leading-none">{score}</span>
          <span className="text-[10px] text-zinc-500 font-medium mt-0.5">/ 100</span>
        </div>
      </div>
      <span
        className="text-xs font-semibold px-3 py-1 rounded-full"
        style={{ color, backgroundColor: bgColor + '66', border: `1px solid ${bgColor}` }}
      >{label}</span>
    </div>
  );
}

// ─── Progress bar sub-score ───────────────────────────────────────────────────
function ScoreBar({ label, emoji, score }: { label: string; emoji: string; score: number }) {
  const color =
    score >= 80 ? 'bg-green-500'
    : score >= 50 ? 'bg-yellow-500'
    : 'bg-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">{emoji} {label}</span>
        <span className={`text-[11px] font-bold ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ label, emoji, score }: { label: string; emoji: string; score: number }) {
  const ok = score >= 80;
  const warn = score >= 50 && score < 80;

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium ${
      ok   ? 'bg-green-950/40  border-green-800/50  text-green-300'
      : warn ? 'bg-yellow-950/40 border-yellow-800/50 text-yellow-300'
             : 'bg-red-950/40   border-red-800/50    text-red-300'
    }`}>
      <span>{emoji} {label}</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        ok   ? 'bg-green-900  text-green-400'
        : warn ? 'bg-yellow-900 text-yellow-400'
               : 'bg-red-900   text-red-400'
      }`}>
        {ok ? '✓ Clear' : warn ? '⚠ Warning' : '✗ Blocked'}
      </span>
    </div>
  );
}

// ─── Empty / placeholder state ────────────────────────────────────────────────
function EmptyScorecard() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <svg className="w-7 h-7 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-400">No score yet</p>
        <p className="text-[11px] text-zinc-600 mt-1">Click <span className="text-indigo-400 font-medium">✨ AI Auto-Arrange</span> to analyze your layout and get an ergonomic score.</p>
      </div>
    </div>
  );
}

// ─── Scorecard content ────────────────────────────────────────────────────────
function ScorecardContent({ report }: { report: AuditReport }) {
  return (
    <div className="space-y-5 fade-in">
      {/* Overall score ring */}
      <ScoreRing score={report.overallScore} />

      {/* Divider */}
      <div className="h-px bg-zinc-800" />

      {/* Score breakdown */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Score Breakdown</p>
        <ScoreBar label="Traffic Flow"  emoji="🚶" score={report.trafficFlowScore} />
        <StatusPill label="Door Clearance"  emoji="🚪" score={report.doorClearanceScore} />
        <StatusPill label="Window Access"   emoji="🪟" score={report.windowAccessScore} />
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800" />

      {/* Pros */}
      {report.pros.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">What's Working</p>
          <div className="space-y-1.5">
            {report.pros.map((pro, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 text-sm leading-none flex-shrink-0">✓</span>
                <span className="text-[11px] text-zinc-300 leading-relaxed">{pro}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Warnings</p>
          <div className="space-y-1.5">
            {report.warnings.map((warn, i) => (
              <div key={i} className="flex items-start gap-2 bg-yellow-950/30 border border-yellow-900/40 rounded-lg px-3 py-2">
                <span className="text-yellow-400 mt-0.5 text-sm leading-none flex-shrink-0">⚠</span>
                <span className="text-[11px] text-yellow-200/80 leading-relaxed">{warn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rationale */}
      {report.rationale && (
        <>
          <div className="h-px bg-zinc-800" />
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Design Rationale</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">"{report.rationale}"</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Optimizing skeleton ──────────────────────────────────────────────────────
function OptimizingSkeleton() {
  return (
    <div className="space-y-4 py-4 fade-in">
      <div className="flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <svg className="spinner w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-zinc-400">AI Analyzing Layout…</p>
        <p className="text-[11px] text-zinc-600 text-center">Checking door clearance, traffic flow, and window access</p>
      </div>
      {/* skeleton bars */}
      {[80, 55, 100].map((w, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse" />
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-700 rounded-full animate-pulse" style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function RightScorecardPanel() {
  const { auditReport, isOptimizing } = useRoomStore();

  return (
    <aside className="w-72 flex-shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex-shrink-0">
        <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Ergonomic Audit</h2>
        <p className="text-[11px] text-zinc-600 mt-0.5">AI-powered spatial analysis</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isOptimizing
          ? <OptimizingSkeleton />
          : auditReport
            ? <ScorecardContent report={auditReport} />
            : <EmptyScorecard />
        }
      </div>

      {/* Footer tip */}
      <div className="border-t border-zinc-800 px-4 py-3 flex-shrink-0">
        <p className="text-[10px] text-zinc-700 leading-relaxed">
          💡 Standards: 0.8m walkways, 0.9m door swing, no tall furniture blocking windows.
        </p>
      </div>
    </aside>
  );
}
