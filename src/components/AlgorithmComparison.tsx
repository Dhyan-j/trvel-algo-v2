import React, { useMemo } from 'react';
import { GraphData, AlgorithmType } from '../types/graph';
import { executeAlgorithm, ALGORITHM_REGISTRY } from '../algorithms/searchEngine';
import { Trophy, Check, X, Zap, BarChart3, HelpCircle, ArrowRight } from 'lucide-react';

interface AlgorithmComparisonProps {
  graph: GraphData;
  onApplyPathToView: (algorithm: AlgorithmType) => void;
}

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({
  graph,
  onApplyPathToView,
}) => {
  const algorithmsToCompare: AlgorithmType[] = [
    'astar',
    'gbfs',
    'dijkstra',
    'bfs',
    'dfs',
    'bidirectional',
    'iddfs',
  ];

  const results = useMemo(() => {
    return algorithmsToCompare.map((algoKey) => {
      const res = executeAlgorithm(algoKey, graph);
      const info = ALGORITHM_REGISTRY[algoKey];
      return {
        algoKey,
        info,
        result: res,
      };
    });
  }, [graph]);

  const nodeMap = useMemo(() => {
    return new Map(graph.nodes.map((n) => [n.id, n]));
  }, [graph]);

  // Find minimum cost among successful runs to determine optimality
  const successfulRuns = results.filter((r) => r.result.success);
  const minCost = successfulRuns.length > 0
    ? Math.min(...successfulRuns.map((r) => r.result.totalCost))
    : Infinity;

  const minExpanded = successfulRuns.length > 0
    ? Math.min(...successfulRuns.map((r) => r.result.nodesExpanded))
    : Infinity;
  const minTime = successfulRuns.length > 0
    ? Math.min(...successfulRuns.map((r) => r.result.executionTimeMs))
    : Infinity;
  const minSpace = successfulRuns.length > 0
    ? Math.min(...successfulRuns.map((r) => r.result.maxFrontierSize))
    : Infinity;

  const maxTime = successfulRuns.length > 0
    ? Math.max(...successfulRuns.map((r) => r.result.executionTimeMs))
    : 1;
  const maxSpace = successfulRuns.length > 0
    ? Math.max(...successfulRuns.map((r) => r.result.maxFrontierSize))
    : 1;
  const maxExpandedForRanking = successfulRuns.length > 0
    ? Math.max(...successfulRuns.map((r) => r.result.nodesExpanded))
    : 1;

  const rankedResults = [...results].sort((a, b) => {
    if (a.result.success !== b.result.success) return a.result.success ? -1 : 1;
    if (!a.result.success) return a.info.name.localeCompare(b.info.name);

    const score = (item: typeof a) => {
      const timeScore = maxTime > minTime
        ? (item.result.executionTimeMs - minTime) / (maxTime - minTime)
        : 0;
      const spaceScore = maxSpace > minSpace
        ? (item.result.maxFrontierSize - minSpace) / (maxSpace - minSpace)
        : 0;
      const nodeScore = maxExpandedForRanking > minExpanded
        ? (item.result.nodesExpanded - minExpanded) / (maxExpandedForRanking - minExpanded)
        : 0;
      return timeScore * 0.4 + spaceScore * 0.3 + nodeScore * 0.3;
    };
    return score(a) - score(b);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-[var(--text)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--accent)]/30">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
            <BarChart3 className="text-[var(--secondary)]" />
            Algorithm Benchmark & Head-to-Head Comparison
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Running 7 search strategies on the identical graph from Start (
            <strong className="text-[var(--success)]">
              {nodeMap.get(graph.startNodeId)?.label || graph.startNodeId}
            </strong>
            ) to Goal (
            <strong className="text-[var(--accent)]">
              {nodeMap.get(graph.goalNodeId)?.label || graph.goalNodeId}
            </strong>
            ).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent)]/35 bg-[var(--base)]/75 p-5 shadow-[0_16px_40px_rgba(48,0,24,0.07)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">Algorithm Workload Profile</h3>
            <p className="mt-1 text-[11px] text-[var(--secondary)]">
              Nodes expanded as a measured proxy for search time
            </p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--surface)]/25 text-[var(--secondary)]">
            Dark marker = no path
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: 'Informed Search', informed: true },
            { label: 'Uninformed Search', informed: false },
          ].map((group) => (
            <div key={group.label} className="rounded-xl border border-[var(--accent)]/20 bg-[var(--surface)]/10 p-3">
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--secondary)]">
                {group.label}
              </h4>
              <div className="space-y-2.5">
                {results
                  .filter(({ info }) => info.isHeuristic === group.informed)
                  .map(({ algoKey, info, result }) => {
                    const maxExpanded = Math.max(1, ...results.map((item) => item.result.nodesExpanded));
                    const width = Math.max(2, (result.nodesExpanded / maxExpanded) * 100);
                    return (
                      <div key={`profile-${algoKey}`} className="grid grid-cols-[110px_1fr_58px] items-center gap-3">
                        <span className="truncate text-[11px] font-semibold text-[var(--secondary)]" title={info.name}>
                          {info.shortName}
                        </span>
                        <div className="h-3 rounded-full bg-[var(--text)]/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              result.success ? 'bg-[var(--surface)]' : 'bg-[var(--text)]'
                            }`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className={`text-right font-mono text-[11px] ${result.success ? 'text-[var(--accent)]' : 'text-[var(--text)] font-bold'}`}>
                          {result.success ? result.nodesExpanded : 'FAIL'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent)]/35 bg-[var(--text)] p-5 md:p-6 shadow-[0_18px_45px_rgba(48,0,24,0.16)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[0.22em] text-[var(--surface)]">Full benchmark</p>
            <h3 className="mt-1 text-xl font-bold text-[var(--base)]">Algorithm Comparison</h3>
            <p className="mt-1 text-xs text-[var(--base)]/70">Ranked by execution time 40% · peak space 30% · nodes expanded 30%</p>
          </div>
          {rankedResults[0]?.result.success && (
            <div className="rounded-xl border border-[var(--success)]/40 bg-[var(--success)]/15 px-4 py-2 text-right">
              <span className="block text-[9px] uppercase tracking-wider text-[var(--base)]/70">Overall best</span>
              <strong className="mt-0.5 block text-sm text-[var(--success)]">
                {rankedResults[0].info.shortName}
              </strong>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Best Time',
              value: results.find(({ result }) => result.success && result.executionTimeMs === minTime)?.info.shortName,
              detail: Number.isFinite(minTime) ? `${minTime.toFixed(3)} ms` : 'N/A',
              accent: 'var(--success)',
            },
            {
              label: 'Best Space',
              value: results.find(({ result }) => result.success && result.maxFrontierSize === minSpace)?.info.shortName,
              detail: Number.isFinite(minSpace) ? `${minSpace} peak nodes` : 'N/A',
              accent: 'var(--accent)',
            },
            {
              label: 'Fewest Nodes',
              value: results.find(({ result }) => result.success && result.nodesExpanded === minExpanded)?.info.shortName,
              detail: Number.isFinite(minExpanded) ? `${minExpanded} nodes` : 'N/A',
              accent: 'var(--surface)',
            },
          ].map((winner) => (
            <div key={winner.label} className="rounded-xl border border-[var(--base)]/10 bg-[var(--base)]/5 px-4 py-3">
              <div className="text-[9px] uppercase tracking-wider" style={{ color: winner.accent }}>{winner.label}</div>
              <div className="mt-1 text-sm font-bold text-[var(--base)]">{winner.value || 'N/A'}</div>
              <div className="mt-0.5 font-mono text-[10px] text-[var(--base)]/60">{winner.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {rankedResults
            .map(({ algoKey, info, result }, index) => {
              const maxNodes = Math.max(1, ...results.map((item) => item.result.nodesExpanded));
              const barWidth = result.success ? Math.max(4, (result.nodesExpanded / maxNodes) * 100) : 100;
              const isBestOverall = index === 0 && result.success;
              const isBestTime = result.success && result.executionTimeMs === minTime;
              const isBestSpace = result.success && result.maxFrontierSize === minSpace;
              const isBestNodes = result.success && result.nodesExpanded === minExpanded;
              const isCostBest = result.success && Math.abs(result.totalCost - minCost) < 0.001;
              return (
                <div key={`benchmark-${algoKey}`} className="grid grid-cols-[126px_minmax(0,1fr)_150px] items-center gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-[var(--base)]" title={info.name}>
                      {index + 1}. {info.shortName}
                    </div>
                    <div className="mt-0.5 text-[9px] text-[var(--base)]/55">
                      {info.isHeuristic ? 'Informed' : 'Uninformed'}
                    </div>
                  </div>
                  <div className="h-7 overflow-hidden rounded-lg bg-[var(--base)]/10">
                    <div
                      className={`h-full rounded-lg transition-all duration-700 ${
                        !result.success
                          ? 'bg-[var(--danger)]'
                          : isBestOverall
                            ? 'bg-[var(--success)]'
                            : isCostBest
                              ? 'bg-[var(--accent)]'
                              : 'bg-[var(--surface)]'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="text-right text-[9px] leading-relaxed">
                    {result.success ? (
                      <>
                        <div className="font-mono font-bold text-[var(--base)]">
                          {result.executionTimeMs.toFixed(2)} ms · {result.maxFrontierSize} space
                        </div>
                        <div className="mt-0.5 font-mono text-[var(--base)]/75">{result.nodesExpanded} nodes</div>
                        {isBestOverall && <div className="mt-0.5 text-[8px] uppercase text-[var(--success)]">Overall best</div>}
                        {(isBestTime || isBestSpace || isBestNodes) && (
                          <div className="mt-0.5 text-[8px] uppercase text-[var(--accent)]">
                            {[isBestTime ? 'Time' : null, isBestSpace ? 'Space' : null, isBestNodes ? 'Nodes' : null].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="font-bold text-[var(--danger)]">FAIL</div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[var(--base)]/10 pt-4 text-[9px] text-[var(--base)]/65">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--success)]" />Overall / category winner</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--accent)]" />Lowest cost / category marker</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--surface)]" />Successful run</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--danger)]" />No path / failure</span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--accent)]/30 bg-[var(--base)]/90 shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--accent)]/30 bg-[var(--surface)]/20 text-[var(--muted)] font-mono text-[11px] uppercase tracking-wider">
              <th className="p-3.5">Rank</th>
              <th className="p-3.5">Algorithm</th>
              <th className="p-3.5">Total Cost</th>
              <th className="p-3.5">Time Taken</th>
              <th className="p-3.5">Space Taken</th>
              <th className="p-3.5">Nodes Expanded</th>
              <th className="p-3.5">Max Frontier</th>
              <th className="p-3.5">Path Length</th>
              <th className="p-3.5">Optimal?</th>
              <th className="p-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--accent)]/20 font-sans">
            {results.map(({ algoKey, info, result }) => {
              const isCostWinner = result.success && Math.abs(result.totalCost - minCost) < 0.001;
              const isSpeedWinner = result.success && result.nodesExpanded === minExpanded;

              return (
                <tr
                  key={algoKey}
                  className="hover:bg-[var(--surface)]/15 transition-colors"
                >
                  <td className="p-3.5">
                    {result.success ? (
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        rankedResults.findIndex((item) => item.algoKey === algoKey) === 0
                          ? 'bg-[var(--success)] text-[var(--text)]'
                          : 'bg-[var(--surface)]/30 text-[var(--text)]'
                      }`}>
                        {rankedResults.findIndex((item) => item.algoKey === algoKey) + 1}
                      </span>
                    ) : (
                      <span className="text-[var(--danger)]">—</span>
                    )}
                  </td>

                  {/* Name and Formula */}
                  <td className="p-3.5">
                    <div className="font-bold text-[var(--text)] text-sm">{info.name}</div>
                    <div className="text-[11px] font-mono text-[var(--secondary)] mt-0.5">
                      {info.formula}
                    </div>
                  </td>

                  {/* Total Cost */}
                  <td className="p-3.5 font-mono">
                    {result.success ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-bold ${
                            isCostWinner ? 'text-[var(--success)]' : 'text-[var(--text)]'
                          }`}
                        >
                          {result.totalCost.toFixed(1)}
                        </span>
                        {isCostWinner && (
                          <span
                            className="p-1 rounded-full bg-[var(--success)]/20 text-[var(--success)]"
                            title="Lowest path cost found!"
                          >
                            <Trophy size={13} />
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[var(--danger)] italic">No path</span>
                    )}
                  </td>

                  {/* Execution time */}
                  <td className="p-3.5 font-mono">
                    {result.success ? (
                      <span className={result.executionTimeMs === minTime ? 'font-bold text-[var(--success)]' : 'text-[var(--muted)]'}>
                        {result.executionTimeMs.toFixed(3)} ms
                      </span>
                    ) : (
                      <span className="text-[var(--danger)]">—</span>
                    )}
                  </td>

                  {/* Peak space */}
                  <td className="p-3.5 font-mono">
                    {result.success ? (
                      <span className={result.maxFrontierSize === minSpace ? 'font-bold text-[var(--success)]' : 'text-[var(--muted)]'}>
                        {result.maxFrontierSize} frontier
                      </span>
                    ) : (
                      <span className="text-[var(--danger)]">—</span>
                    )}
                  </td>

                  {/* Nodes Expanded */}
                  <td className="p-3.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-semibold ${
                          isSpeedWinner ? 'text-[var(--secondary)]' : 'text-[var(--muted)]'
                        }`}
                      >
                        {result.nodesExpanded}
                      </span>
                      {isSpeedWinner && (
                        <span
                          className="p-1 rounded-full bg-[var(--surface)]/30 text-[var(--secondary)]"
                          title="Fewest nodes expanded!"
                        >
                          <Zap size={13} />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Max Frontier */}
                  <td className="p-3.5 font-mono text-[var(--muted)]">
                    {result.maxFrontierSize}
                  </td>

                  {/* Path Length */}
                  <td className="p-3.5 font-mono text-[var(--muted)]">
                    {result.path ? `${result.path.length - 1} hops` : '-'}
                  </td>

                  {/* Optimality status */}
                  <td className="p-3.5">
                    {isCostWinner ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/50">
                        <Check size={12} /> Optimal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/50">
                        Suboptimal
                      </span>
                    )}
                  </td>

                  {/* Action button */}
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onApplyPathToView(algoKey)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--success)] text-[var(--base)] font-medium text-xs transition shadow-xs"
                    >
                      <span>Visualize</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Educational Analysis Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[var(--base)]/80 border border-[var(--accent)]/30">
          <h3 className="text-sm font-bold text-[var(--text)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--surface)]" />
            Key Insight: A* vs Greedy Best-First Search
          </h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            <strong>Greedy Best-First</strong> uses only heuristic <code className="text-blue-800">f(n) = h(n)</code>.
            It rushes straight toward the goal and frequently expands fewer nodes, but can be easily misled down high-cost paths.
            <strong> A*</strong> balances past path cost with future estimate <code className="text-blue-800">f(n) = g(n) + h(n)</code>,
            mathematically guaranteeing the optimal cheapest route when <code className="text-blue-800">h(n)</code> is admissible.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--base)]/80 border border-[var(--accent)]/30">
          <h3 className="text-sm font-bold text-[var(--text)] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            Dijkstra (Uniform Cost Search) vs BFS
          </h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            <strong>BFS</strong> guarantees the shortest path measured by the <em>number of hops/edges</em> (unweighted distance),
            which can be suboptimal if edge costs differ. <strong>Dijkstra</strong> prioritizes by cumulative cost <code className="text-sky-800">g(n)</code>,
            guaranteeing the lowest-cost path for arbitrary non-negative weights.
          </p>
        </div>
      </div>
    </div>
  );
};
