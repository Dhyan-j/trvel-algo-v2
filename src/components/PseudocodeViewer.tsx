import React from 'react';
import { AlgorithmInfo } from '../types/graph';
import { Code, Check, X, ShieldAlert, Cpu } from 'lucide-react';

interface PseudocodeViewerProps {
  algorithmInfo: AlgorithmInfo;
  activeLineNumber: number;
}

export const PseudocodeViewer: React.FC<PseudocodeViewerProps> = ({
  algorithmInfo,
  activeLineNumber,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-t lg:border-t-0 lg:border-l border-slate-200 text-slate-800">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-white/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-sky-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Algorithm Pseudocode
          </h3>
        </div>
        <span className="text-[11px] font-mono text-sky-700 font-semibold">
          {algorithmInfo.formula}
        </span>
      </div>

      {/* Code Listing with Active Line Pointer */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-slate-50/80 select-text">
        {algorithmInfo.pseudocode.map((item) => {
          const isActive = item.line === activeLineNumber;

          return (
            <div
              key={item.line}
              className={`flex items-start py-0.5 px-2 rounded transition-colors duration-150 ${
                isActive
                  ? 'bg-sky-500/20 text-sky-800 border-l-2 border-sky-400 font-semibold'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <span className="w-6 text-[10px] text-slate-600 select-none text-right mr-3 pt-0.5">
                {item.line}
              </span>
              <span
                style={{ paddingLeft: `${item.indent * 14}px` }}
                className={isActive ? 'text-sky-800' : ''}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Complexity and Guarantees Footer */}
      <div className="p-3 border-t border-slate-200 bg-white/95 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-300/60">
            <span className="text-slate-600 block text-[10px] uppercase font-mono">
              Time Complexity
            </span>
            <span className="font-mono font-semibold text-slate-800">
              {algorithmInfo.timeComplexity}
            </span>
          </div>

          <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-300/60">
            <span className="text-slate-600 block text-[10px] uppercase font-mono">
              Space Complexity
            </span>
            <span className="font-mono font-semibold text-slate-800">
              {algorithmInfo.spaceComplexity}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">Optimal:</span>
            {algorithmInfo.guaranteedOptimal ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold">
                <Check size={13} /> Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-rose-400 font-semibold">
                <X size={13} /> No
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">Complete:</span>
            {algorithmInfo.complete ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold">
                <Check size={13} /> Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-amber-400 font-semibold">
                <ShieldAlert size={13} /> Conditional
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
