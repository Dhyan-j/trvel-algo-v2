import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Gauge,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PlaybackControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speedMs: number;
  isNoPath: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSeek: (stepIndex: number) => void;
  onChangeSpeed: (speedMs: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  speedMs,
  isNoPath,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSeek,
  onChangeSpeed,
}) => {
  const maxIndex = Math.max(0, totalSteps - 1);
  const progressPercent = totalSteps > 1 ? (currentStepIndex / maxIndex) * 100 : 0;

  return (
    <div className="w-full h-12 bg-[var(--base)] border-t border-[var(--accent)]/30 px-4 flex items-center gap-3 select-none shadow-[0_-8px_24px_rgba(48,0,24,0.07)]">
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onReset}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          title="Reset to beginning"
          aria-label="Reset traversal"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={onStepBackward}
          disabled={currentStepIndex <= 0}
          className="p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition"
          title="Previous step"
          aria-label="Previous step"
        >
          <ChevronLeft size={17} />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg text-white transition ${
            isPlaying
              ? 'bg-[var(--accent)] hover:bg-[var(--secondary)]'
              : 'bg-[var(--success)] hover:bg-[var(--secondary)]'
          }`}
          aria-label={isPlaying ? 'Pause search playback' : 'Start search playback'}
          title={isPlaying ? 'Pause playback' : currentStepIndex >= maxIndex ? 'Replay' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
          <span className="text-xs font-bold">{isPlaying ? 'Pause' : currentStepIndex >= maxIndex ? 'Restart' : 'Start'}</span>
        </button>

        <button
          onClick={onStepForward}
          disabled={currentStepIndex >= maxIndex}
          className="flex items-center gap-1 px-2 py-1.5 text-blue-800 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition text-xs font-semibold"
          title="Advance exactly one step"
          aria-label="Next step"
        >
          <span className="hidden sm:inline">Step</span>
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
        <span className="text-[11px] sm:text-xs font-mono text-slate-600 whitespace-nowrap">
          {Math.min(currentStepIndex + 1, totalSteps)} / {totalSteps}
        </span>

        <div className="flex-1 min-w-8 relative flex items-center">
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={currentStepIndex}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
            aria-label="Timeline scrubber"
            title="Choose a step"
          />
        </div>

        {isNoPath ? (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
            <AlertCircle size={13} />
            No path
          </span>
        ) : (
          <span className="hidden sm:inline text-[11px] font-mono text-slate-500">
            {Math.round(progressPercent)}%
          </span>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <Gauge size={14} className="text-slate-500" />
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5 text-[11px]">
          {[
            { label: '0.5x', ms: 900 },
            { label: '1x', ms: 500 },
            { label: '2x', ms: 250 },
            { label: '5x', ms: 80 },
          ].map(({ label, ms }) => (
            <button
              key={label}
              onClick={() => onChangeSpeed(ms)}
              className={`px-1.5 py-1 rounded transition font-mono ${
                speedMs === ms
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
