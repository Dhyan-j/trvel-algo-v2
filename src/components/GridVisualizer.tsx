import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Flag,
  Target,
  Eraser,
  Flame,
  Grid,
  Activity,
  Clock3,
  Database,
} from 'lucide-react';

type CellType = 'empty' | 'wall' | 'weight';
type CellState = 'unvisited' | 'frontier' | 'visited' | 'path' | 'active';

interface GridCell {
  r: number;
  c: number;
  type: CellType;
  state: CellState;
  g: number;
  h: number;
  f: number;
  parent: { r: number; c: number } | null;
}

const ROWS = 20;
const COLS = 35;

export const GridVisualizer: React.FC = () => {
  const [grid, setGrid] = useState<GridCell[][]>(() => createInitialGrid());
  const [startPos, setStartPos] = useState({ r: 9, c: 5 });
  const [goalPos, setGoalPos] = useState({ r: 9, c: 29 });
  const [selectedAlgo, setSelectedAlgo] = useState<'astar' | 'gbfs' | 'dijkstra' | 'bfs' | 'dfs'>('astar');
  const [drawTool, setDrawTool] = useState<'wall' | 'weight' | 'erase' | 'start' | 'goal'>('wall');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ nodesVisited: 0, pathLength: 0, pathCost: 0 });
  const [metricsHistory, setMetricsHistory] = useState<Array<{ time: number; space: number }>>([]);
  const [metricIndex, setMetricIndex] = useState(0);

  const timerRef = useRef<number | null>(null);

  function createInitialGrid(): GridCell[][] {
    const cells: GridCell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          r,
          c,
          type: 'empty',
          state: 'unvisited',
          g: Infinity,
          h: 0,
          f: Infinity,
          parent: null,
        });
      }
      cells.push(row);
    }
    return cells;
  }

  // Clear visualization states while keeping walls
  const clearVisualization = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => ({
          ...cell,
          state: 'unvisited',
          g: Infinity,
          h: 0,
          f: Infinity,
          parent: null,
        }))
      )
    );
    setStats({ nodesVisited: 0, pathLength: 0, pathCost: 0 });
    setMetricsHistory([]);
    setMetricIndex(0);
  };

  const clearAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setGrid(createInitialGrid());
    setStats({ nodesVisited: 0, pathLength: 0, pathCost: 0 });
    setMetricsHistory([]);
    setMetricIndex(0);
  };

  // Heuristic calculation (Manhattan distance)
  const getHeuristic = (r: number, c: number) => {
    return Math.abs(r - goalPos.r) + Math.abs(c - goalPos.c);
  };

  // Handle cell paint
  const handleCellInteraction = (r: number, c: number) => {
    if (isRunning) return;
    if (r === startPos.r && c === startPos.c) return;
    if (r === goalPos.r && c === goalPos.c) return;

    if (drawTool === 'start') {
      setStartPos({ r, c });
      return;
    }
    if (drawTool === 'goal') {
      setGoalPos({ r, c });
      return;
    }

    setGrid((prev) => {
      const copy = prev.map((row) => [...row]);
      const cell = copy[r][c];
      if (drawTool === 'wall') {
        cell.type = cell.type === 'wall' ? 'empty' : 'wall';
      } else if (drawTool === 'weight') {
        cell.type = cell.type === 'weight' ? 'empty' : 'weight';
      } else if (drawTool === 'erase') {
        cell.type = 'empty';
      }
      return copy;
    });
  };

  // Generate a random maze
  const generateMaze = () => {
    clearVisualization();
    setGrid((prev) =>
      prev.map((row, r) =>
        row.map((cell, c) => {
          if ((r === startPos.r && c === startPos.c) || (r === goalPos.r && c === goalPos.c)) {
            return { ...cell, type: 'empty' };
          }
          // Simple procedural maze noise
          const isWall = Math.random() < 0.28;
          const isWeight = !isWall && Math.random() < 0.08;
          return {
            ...cell,
            type: isWall ? 'wall' : isWeight ? 'weight' : 'empty',
            state: 'unvisited',
          };
        })
      )
    );
  };

  // Execute Search Animation
  const runSearch = () => {
    clearVisualization();
    setIsRunning(true);

    const openList: Array<{ r: number; c: number; g: number; h: number; f: number }> = [];
    const closed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const parentMap: Record<string, { r: number; c: number } | null> = {};
    const costMap: Record<string, number> = {};

    const startKey = `${startPos.r},${startPos.c}`;
    const initialH = getHeuristic(startPos.r, startPos.c);
    costMap[startKey] = 0;
    parentMap[startKey] = null;

    openList.push({
      r: startPos.r,
      c: startPos.c,
      g: 0,
      h: initialH,
      f: selectedAlgo === 'gbfs' ? initialH : initialH,
    });

    const stepsToAnimate: Array<{
      type: 'visit' | 'frontier' | 'path';
      cells: Array<{ r: number; c: number }>;
    }> = [];

    let goalFound = false;
    let finalPath: Array<{ r: number; c: number }> = [];

    while (openList.length > 0) {
      // Sort openList based on algorithm
      if (selectedAlgo === 'astar') {
        openList.sort((a, b) => a.f - b.f || a.h - b.h);
      } else if (selectedAlgo === 'gbfs') {
        openList.sort((a, b) => a.h - b.h);
      } else if (selectedAlgo === 'dijkstra') {
        openList.sort((a, b) => a.g - b.g);
      } else if (selectedAlgo === 'dfs') {
        // LIFO: pop from end
      } else if (selectedAlgo === 'bfs') {
        // FIFO: shift from front (no sort needed)
      }

      const curr = selectedAlgo === 'dfs' ? openList.pop()! : openList.shift()!;
      if (closed[curr.r][curr.c]) continue;
      closed[curr.r][curr.c] = true;

      stepsToAnimate.push({
        type: 'visit',
        cells: [{ r: curr.r, c: curr.c }],
      });

      if (curr.r === goalPos.r && curr.c === goalPos.c) {
        goalFound = true;
        // Reconstruct path
        let track: { r: number; c: number } | null = { r: curr.r, c: curr.c };
        while (track) {
          finalPath.unshift(track);
          track = parentMap[`${track.r},${track.c}`];
        }
        break;
      }

      // Neighbors: 4 directions (Up, Right, Down, Left)
      const dr = [-1, 0, 1, 0];
      const dc = [0, 1, 0, -1];
      const newFrontiers: Array<{ r: number; c: number }> = [];

      for (let i = 0; i < 4; i++) {
        const nr = curr.r + dr[i];
        const nc = curr.c + dc[i];

        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (closed[nr][nc]) continue;
        if (grid[nr][nc].type === 'wall') continue;

        const edgeWeight = grid[nr][nc].type === 'weight' ? 5 : 1;
        const tentativeG = curr.g + edgeWeight;
        const nKey = `${nr},${nc}`;

        if (costMap[nKey] === undefined || tentativeG < costMap[nKey]) {
          costMap[nKey] = tentativeG;
          parentMap[nKey] = { r: curr.r, c: curr.c };
          const hVal = getHeuristic(nr, nc);
          const fVal =
            selectedAlgo === 'astar'
              ? tentativeG + hVal
              : selectedAlgo === 'gbfs'
              ? hVal
              : tentativeG;

          openList.push({ r: nr, c: nc, g: tentativeG, h: hVal, f: fVal });
          newFrontiers.push({ r: nr, c: nc });
        }
      }

      if (newFrontiers.length > 0) {
        stepsToAnimate.push({ type: 'frontier', cells: newFrontiers });
      }
    }

    // Playback steps via interval
    const visitedSet = new Set<string>();
    const frontierSet = new Set<string>();
    const mazeMetrics = stepsToAnimate.map((step) => {
      step.cells.forEach(({ r, c }) => {
        const key = `${r},${c}`;
        if (step.type === 'visit') {
          visitedSet.add(key);
          frontierSet.delete(key);
        } else if (step.type === 'frontier') {
          frontierSet.add(key);
        }
      });
      return {
        time: visitedSet.size,
        space: visitedSet.size + frontierSet.size,
      };
    });
    setMetricsHistory(mazeMetrics);
    setMetricIndex(0);

    let stepIdx = 0;
    let visitedCount = 0;

    timerRef.current = window.setInterval(() => {
      if (stepIdx >= stepsToAnimate.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRunning(false);

        if (goalFound) {
          // Highlight final path
          let cost = 0;
          finalPath.forEach((p) => {
            cost += grid[p.r][p.c].type === 'weight' ? 5 : 1;
          });
          setStats({
            nodesVisited: visitedCount,
            pathLength: finalPath.length,
            pathCost: cost,
          });

          setGrid((prev) => {
            const copy = prev.map((row) => [...row]);
            finalPath.forEach(({ r, c }) => {
              copy[r][c].state = 'path';
            });
            return copy;
          });

        }
        return;
      }

      const step = stepsToAnimate[stepIdx];
      setGrid((prev) => {
        const copy = prev.map((row) => [...row]);
        step.cells.forEach(({ r, c }) => {
          if ((r !== startPos.r || c !== startPos.c) && (r !== goalPos.r || c !== goalPos.c)) {
            if (step.type === 'visit') {
              copy[r][c].state = 'visited';
            } else if (step.type === 'frontier' && copy[r][c].state !== 'visited') {
              copy[r][c].state = 'frontier';
            }
          }
        });
        return copy;
      });

      if (step.type === 'visit') visitedCount++;
      setMetricIndex(Math.min(stepIdx + 1, mazeMetrics.length));
      stepIdx++;
    }, 18);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const complexityMap: Record<string, { time: string; space: string }> = {
    astar: { time: 'O(b^d)', space: 'O(b^d)' },
    gbfs: { time: 'O(b^m)', space: 'O(b^m)' },
    dijkstra: { time: 'O((V + E) log V)', space: 'O(V)' },
    bfs: { time: 'O(V + E)', space: 'O(V)' },
    dfs: { time: 'O(V + E)', space: 'O(V)' },
  };
  const liveMetrics = metricsHistory.slice(0, metricIndex);
  const latestMetrics = liveMetrics[liveMetrics.length - 1] || { time: 0, space: 0 };
  const maxMetric = Math.max(1, ...liveMetrics.flatMap((point) => [point.time, point.space]));
  const metricWidth = 420;
  const metricHeight = 150;
  const metricLeft = 28;
  const metricRight = 412;
  const metricTop = 12;
  const metricBottom = 128;
  const makeMetricPoints = (key: 'time' | 'space') =>
    liveMetrics
      .map((point, index) => {
        const x =
          liveMetrics.length === 1
            ? metricRight
            : metricLeft + (index / (liveMetrics.length - 1)) * (metricRight - metricLeft);
        const y = metricBottom - (point[key] / maxMetric) * (metricBottom - metricTop);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="p-4 max-w-6xl mx-auto flex flex-col gap-4 text-slate-800">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Algorithm:
          </label>
          <select
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(e.target.value as any)}
            disabled={isRunning}
            className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
          >
            <optgroup label="Informed Search">
              <option value="astar">A* Search (f = g + h)</option>
              <option value="gbfs">Greedy Best-First (f = h)</option>
            </optgroup>
            <optgroup label="Uninformed Search">
              <option value="dijkstra">Dijkstra / UCS (f = g)</option>
              <option value="bfs">Breadth-First Search (BFS)</option>
              <option value="dfs">Depth-First Search (DFS)</option>
            </optgroup>
          </select>
        </div>

        {/* Paint Tools */}
        <div className="flex items-center gap-1.5 bg-slate-50/60 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setDrawTool('wall')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              drawTool === 'wall'
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid size={13} />
            <span>Wall</span>
          </button>
          <button
            onClick={() => setDrawTool('weight')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              drawTool === 'weight'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-600 hover:text-amber-800'
            }`}
          >
            <Flame size={13} />
            <span>Mud (Cost 5)</span>
          </button>
          <button
            onClick={() => setDrawTool('erase')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              drawTool === 'erase'
                ? 'bg-rose-700 text-white font-semibold'
                : 'text-slate-600 hover:text-rose-800'
            }`}
          >
            <Eraser size={13} />
            <span>Erase</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={generateMaze}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-300 flex items-center gap-1.5"
          >
            <Sparkles size={13} className="text-blue-700" />
            <span>Generate Maze</span>
          </button>

          <button
            onClick={clearVisualization}
            disabled={isRunning}
            className="p-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Clear visualization paths"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={runSearch}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
          >
            <Play size={14} className="fill-current" />
            <span>Find Path</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas Surface */}
      <div
        className="overflow-x-auto bg-slate-50 p-4 rounded-xl border border-slate-200 select-none shadow-2xl flex flex-col items-center"
        onMouseDown={() => setIsMouseDown(true)}
        onMouseUp={() => setIsMouseDown(false)}
        onMouseLeave={() => setIsMouseDown(false)}
      >
        <div
          className="grid gap-[2px] bg-white border border-slate-200/80 p-1 rounded-md"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isStart = r === startPos.r && c === startPos.c;
              const isGoal = r === goalPos.r && c === goalPos.c;

              let bgClass = 'bg-slate-50 hover:bg-slate-100';

              if (isStart) {
                bgClass = 'bg-emerald-500 shadow-md animate-pulse';
              } else if (isGoal) {
                bgClass = 'bg-amber-500 shadow-md animate-pulse';
              } else if (cell.type === 'wall') {
                bgClass = 'bg-slate-200 border-slate-300';
              } else if (cell.type === 'weight') {
                bgClass = 'bg-amber-900/60 border border-amber-600/40 text-[9px] text-amber-300';
              } else if (cell.state === 'path') {
                bgClass = 'bg-emerald-400 shadow-sm transition-all duration-300';
              } else if (cell.state === 'visited') {
                bgClass = 'bg-blue-100/70 border border-blue-700/50';
              } else if (cell.state === 'frontier') {
                bgClass = 'bg-amber-500/40 border border-amber-400/60';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onMouseDown={() => handleCellInteraction(r, c)}
                  onMouseEnter={() => {
                    if (isMouseDown) handleCellInteraction(r, c);
                  }}
                  className={`w-6 h-6 rounded-xs flex items-center justify-center cursor-pointer transition-colors duration-75 text-[10px] ${bgClass}`}
                >
                  {isStart && <Flag size={12} className="text-white fill-white" />}
                  {isGoal && <Target size={12} className="text-slate-950 font-bold" />}
                  {cell.type === 'weight' && !isStart && !isGoal && '5'}
                </div>
              );
            })
          )}
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-6 mt-4 text-xs font-mono text-slate-600">
          <div>
            Visited Cells: <strong className="text-blue-700">{stats.nodesVisited}</strong>
          </div>
          <div>
            Path Length: <strong className="text-emerald-400">{stats.pathLength} cells</strong>
          </div>
          <div>
            Total Path Cost: <strong className="text-amber-400">{stats.pathCost}</strong>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 2xl:grid-cols-[1fr_260px] gap-4">
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--base)]/85 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[var(--secondary)]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text)]">Live Maze Complexity</h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              Step {metricIndex}/{metricsHistory.length}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'time' as const, title: 'Time Complexity', icon: Clock3, value: latestMetrics.time, label: 'cells expanded', color: 'var(--surface)' },
              { key: 'space' as const, title: 'Space Complexity', icon: Database, value: latestMetrics.space, label: 'visited + frontier', color: 'var(--accent)' },
            ].map((chart) => (
              <div key={chart.key} className="rounded-xl border border-[var(--accent)]/25 bg-[var(--base)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--secondary)]">
                    <chart.icon size={13} /> {chart.title}
                  </div>
                  <div className="text-lg font-bold text-[var(--text)]">{chart.value}</div>
                </div>
                <div className="text-right text-[9px] text-[var(--muted)]">{chart.label}</div>
                <svg viewBox={`0 0 ${metricWidth} ${metricHeight}`} className="mt-2 h-32 w-full" role="img" aria-label={`Live maze ${chart.title.toLowerCase()} graph`}>
                  {[0, 1, 2, 3].map((line) => {
                    const y = metricTop + (line / 3) * (metricBottom - metricTop);
                    return <line key={line} x1={metricLeft} x2={metricRight} y1={y} y2={y} stroke="var(--accent)" strokeOpacity="0.22" strokeDasharray="4 5" />;
                  })}
                  {makeMetricPoints(chart.key) && (
                    <polyline points={makeMetricPoints(chart.key)} fill="none" stroke={chart.color} strokeWidth="3" strokeLinejoin="round" />
                  )}
                  <text x={metricLeft} y={144} fontSize="9" fill="var(--muted)">start</text>
                  <text x={metricRight} y={144} textAnchor="end" fontSize="9" fill="var(--muted)">current</text>
                </svg>
              </div>
            ))}
          </div>
        </div>

        <aside className="grid grid-cols-2 xl:grid-cols-1 gap-3">
          <div className="rounded-2xl bg-[var(--text)] p-4 text-[var(--base)]">
            <div className="text-[9px] uppercase tracking-wider opacity-70">Asymptotic time</div>
            <div className="mt-2 font-mono text-sm font-bold">{complexityMap[selectedAlgo].time}</div>
          </div>
          <div className="rounded-2xl bg-[var(--secondary)] p-4 text-[var(--base)]">
            <div className="text-[9px] uppercase tracking-wider opacity-70">Asymptotic space</div>
            <div className="mt-2 font-mono text-sm font-bold">{complexityMap[selectedAlgo].space}</div>
          </div>
        </aside>
      </section>
    </div>
  );
};
