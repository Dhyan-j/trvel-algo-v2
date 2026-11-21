import React from 'react';
import { SearchStep, GraphData } from '../types/graph';
import { Lightbulb, Calculator, Compass, Award } from 'lucide-react';

interface ExplanationPanelProps {
  graph: GraphData;
  activeStep: SearchStep | null;
  algorithmName: string;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  graph,
  activeStep,
  algorithmName,
}) => {
  if (!activeStep) return null;

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const visitingNode = activeStep.currentVisitingId
    ? nodeMap.get(activeStep.currentVisitingId)
    : null;
  const neighborNode = activeStep.examiningNeighborId
    ? nodeMap.get(activeStep.examiningNeighborId)
    : null;

  const currentG = activeStep.currentVisitingId
    ? activeStep.gScores[activeStep.currentVisitingId]
    : undefined;
  const currentH = activeStep.currentVisitingId
    ? activeStep.hScores[activeStep.currentVisitingId]
    : undefined;
  const currentF = activeStep.currentVisitingId
    ? activeStep.fScores[activeStep.currentVisitingId]
    : undefined;

  return (
    <div className="bg-white/65 backdrop-blur-xl border-t border-white/70 p-3.5 text-slate-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Step Explanation text */}
        <div className="flex items-start gap-2.5 flex-1">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-700 shrink-0 mt-0.5">
            <Lightbulb size={16} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-blue-800">
                Phase: {activeStep.phase.replace('_', ' ')}
              </span>
              {visitingNode && (
                <span className="text-xs text-slate-600">
                  Focus: <strong className="text-slate-800 font-semibold">{visitingNode.label}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {activeStep.explanation}
            </p>
          </div>
        </div>

        {/* Dynamic Formula Calculation Card */}
        {visitingNode && currentG !== undefined && (
          <div className="shrink-0 flex items-center gap-3 bg-slate-100/80 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calculator size={13} className="text-sky-700" />
              <span>Evaluation:</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <span>
                g = <strong className="text-emerald-400">{currentG.toFixed(1)}</strong>
              </span>
              {currentH !== undefined && (
                <>
                  <span className="text-slate-600">+</span>
                  <span>
                    h = <strong className="text-amber-400">{currentH.toFixed(1)}</strong>
                  </span>
                </>
              )}
              {currentF !== undefined && (
                <>
                  <span className="text-slate-600">=</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-800/50">
                    f = {currentF.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Path Reached Summary */}
        {activeStep.pathFound && activeStep.totalCost !== null && (
          <div className="shrink-0 flex items-center gap-3 bg-emerald-950/70 border border-emerald-500/50 px-3.5 py-1.5 rounded-lg text-xs text-emerald-200 shadow-md">
            <Award size={16} className="text-emerald-400" />
            <div>
              <span className="block font-bold">
                Optimal Cost: {activeStep.totalCost.toFixed(1)}
              </span>
              <span className="text-[10px] text-emerald-300">
                {activeStep.pathFound.length - 1} hops ({activeStep.pathFound.map((id) => nodeMap.get(id)?.label || id).join(' → ')})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
