import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GraphData,
  GraphNode,
  GraphEdge,
  AlgorithmType,
  SearchStep,
} from './types/graph';
import { PRESET_GRAPHS } from './data/presets';
import {
  ALGORITHM_REGISTRY,
  executeAlgorithm,
} from './algorithms/searchEngine';
import { GraphCanvas, CanvasTool } from './components/GraphCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { QueueInspector } from './components/QueueInspector';
import { PseudocodeViewer } from './components/PseudocodeViewer';
import { AlgorithmComparison } from './components/AlgorithmComparison';
import { GridVisualizer } from './components/GridVisualizer';
import { TheorySection } from './components/TheorySection';
import { NodeEditModal } from './components/NodeEditModal';
import { EdgeEditModal } from './components/EdgeEditModal';
import { ComplexityGraph } from './components/ComplexityGraph';
import {
  Network,
  Grid as GridIcon,
  BarChart3,
  BookOpen,
  Layers,
  Code,
  FolderOpen,
  RefreshCw,
  Info,
  Play,
  Pause,
  RotateCcw,
  Palette,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CustomizationPanel, ThemeId, THEME_OPTIONS } from './components/CustomizationPanel';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'graph' | 'grid' | 'compare' | 'theory' | 'customize'>('graph');
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('searchcraft-theme');
    return THEME_OPTIONS.some((option) => option.id === saved) ? (saved as ThemeId) : 'earth';
  });

  useEffect(() => {
    const option = THEME_OPTIONS.find((item) => item.id === theme) || THEME_OPTIONS[0];
    const [base, surface, accent, secondary, text] = option.colors;
    const root = document.documentElement;
    root.style.setProperty('--base', base);
    root.style.setProperty('--surface', surface);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--text', text);
    root.style.setProperty('--canvas', base);
    const darkTheme = ['cyberpunk', 'edgerunners', 'batman', 'sovereign'].includes(theme);
    root.style.setProperty('--on-secondary', darkTheme ? text : base);
    const mutedColor =
      theme === 'cyberpunk'
        ? '#b6bdd3'
        : theme === 'edgerunners'
          ? '#c3c6d1'
          : theme === 'batman'
            ? '#c7c9cd'
            : theme === 'sovereign'
              ? '#a6ad9f'
              : accent;
    root.style.setProperty('--muted', mutedColor);
    const successColor =
      theme === 'cyberpunk'
        ? '#39ff14'
        : theme === 'edgerunners'
          ? '#57d16f'
          : theme === 'monochrome'
            ? '#4d4d4d'
            : theme === 'superman'
              ? '#d5a900'
              : theme === 'batman'
                ? '#f2c84b'
                : theme === 'spiderman'
                  ? '#1853a3'
                  : theme === 'sovereign'
                    ? '#b9a95c'
                    : surface;
    root.style.setProperty('--success', successColor);
    root.style.setProperty('--danger', text);
    root.dataset.theme = theme;
    root.style.setProperty(
      'color-scheme',
      theme === 'cyberpunk' || theme === 'edgerunners' || theme === 'batman' || theme === 'sovereign'
        ? 'dark'
        : 'light'
    );
    localStorage.setItem('searchcraft-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreenMode(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Active graph state
  const [activePresetId, setActivePresetId] = useState<string>('romania');
  const [graph, setGraph] = useState<GraphData>(() => PRESET_GRAPHS[0].data);

  // Selected algorithm
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('astar');

  // Canvas tool
  const [selectedTool, setSelectedTool] = useState<CanvasTool>('select');

  // Modals state
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<GraphEdge | null>(null);

  // Side panels toggle
  const [rightPanelTab, setRightPanelTab] = useState<'queue' | 'code' | 'metrics'>('queue');

  // Traversal execution and playback state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(500);

  // Execute algorithm when graph or algorithm changes
  const algorithmResult = useMemo(() => {
    return executeAlgorithm(selectedAlgorithm, graph);
  }, [selectedAlgorithm, graph]);

  const steps: SearchStep[] = algorithmResult.steps;
  const totalSteps = steps.length;
  const activeStep: SearchStep | null = steps[currentStepIndex] || null;

  // Handle auto-advance during Play
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        if (prev < totalSteps - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, totalSteps, speedMs]);

  // Load a preset
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_GRAPHS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);
    setGraph(JSON.parse(JSON.stringify(preset.data)));
    if (preset.recommendedAlgorithm) {
      setSelectedAlgorithm(preset.recommendedAlgorithm as AlgorithmType);
    }
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Playback handlers
  const handlePlay = () => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleSeek = (index: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  };

  // Node editing handlers
  const handleSaveNode = (nodeId: string, label: string, h: number) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, label, h } : n)),
    }));
    setCurrentStepIndex(0);
  };

  const handleSetStart = (nodeId: string) => {
    setGraph((prev) => ({ ...prev, startNodeId: nodeId }));
    setCurrentStepIndex(0);
  };

  const handleSetGoal = (nodeId: string) => {
    setGraph((prev) => ({ ...prev, goalNodeId: nodeId }));
    setCurrentStepIndex(0);
  };

  const handleDeleteNode = (nodeId: string) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
    setCurrentStepIndex(0);
  };

  // Edge editing handlers
  const handleSaveEdge = (edgeId: string, weight: number, directed: boolean) => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, weight, directed } : e)),
    }));
    setCurrentStepIndex(0);
  };

  const handleDeleteEdge = (edgeId: string) => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
    setCurrentStepIndex(0);
  };

  // Quick switch from comparison table
  const handleApplyFromComparison = (algoKey: AlgorithmType) => {
    setSelectedAlgorithm(algoKey);
    setActiveTab('graph');
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setIsFullscreenMode((previous) => !previous);
    }
  };

  const currentAlgoInfo = ALGORITHM_REGISTRY[selectedAlgorithm];

  return (
    <div className="flex flex-col h-dvh w-full bg-[var(--canvas)] text-[var(--text)] overflow-hidden font-sans">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      {(isFullscreenMode || !(isPlaying && activeTab === 'graph')) && (
        <div
          className={
            isFullscreenMode
              ? 'fixed top-0 left-0 right-0 z-[55] h-3 group/header'
              : 'shrink-0 z-30'
          }
        >
          <header
            className={
              isFullscreenMode
                ? 'absolute inset-x-0 top-0 min-h-16 border-b border-[var(--accent)]/25 bg-[var(--base)]/95 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none shadow-[0_12px_32px_rgba(0,0,0,0.18)] -translate-y-[calc(100%-10px)] group-hover/header:translate-y-0 transition-transform duration-200'
                : 'min-h-16 border-b border-[var(--accent)]/25 bg-[var(--base)]/95 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 select-none shadow-[0_8px_30px_rgba(48,0,24,0.08)]'
            }
          >
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--secondary)] flex items-center justify-center shadow-sm">
              <Network size={18} className="text-[var(--base)]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block">
                SearchCraft
              </span>
              <span className="text-[10px] text-slate-600 -mt-0.5 block">
                Pathfinding workbench
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main navigation" className="order-3 w-full sm:order-none sm:w-auto flex items-center gap-1 overflow-x-auto bg-[var(--surface)]/25 p-1 rounded-xl border border-[var(--accent)]/20 text-xs">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'graph'
                ? 'bg-[var(--secondary)] text-[var(--base)]'
                : 'text-[var(--secondary)] hover:bg-[var(--base)] hover:text-[var(--text)]'
            }`}
            aria-current={activeTab === 'graph' ? 'page' : undefined}
          >
            <Network size={14} />
            <span>Playground</span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'grid'
                ? 'bg-[var(--secondary)] text-[var(--base)]'
                : 'text-[var(--secondary)] hover:bg-[var(--base)] hover:text-[var(--text)]'
            }`}
          >
            <GridIcon size={14} />
            <span>Maze</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'compare'
                ? 'bg-[var(--secondary)] text-[var(--base)]'
                : 'text-[var(--secondary)] hover:bg-[var(--base)] hover:text-[var(--text)]'
            }`}
          >
            <BarChart3 size={14} />
            <span>Compare</span>
          </button>

          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'theory'
                ? 'bg-[var(--secondary)] text-[var(--base)]'
                : 'text-[var(--secondary)] hover:bg-[var(--base)] hover:text-[var(--text)]'
            }`}
          >
            <BookOpen size={14} />
            <span>Learn</span>
          </button>

          <button
            onClick={() => setActiveTab('customize')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'customize'
                ? 'bg-[var(--secondary)] text-[var(--base)]'
                : 'text-[var(--secondary)] hover:bg-[var(--base)] hover:text-[var(--text)]'
            }`}
          >
            <Palette size={14} />
            <span>Customize</span>
          </button>
        </nav>

        <button
          onClick={handleToggleFullscreen}
          className="order-2 sm:order-none h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--accent)]/30 bg-[var(--base)] text-[var(--secondary)] hover:bg-[var(--surface)] transition"
          title={isFullscreenMode ? 'Exit full screen' : 'Enter full screen'}
          aria-label={isFullscreenMode ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullscreenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Algorithm & Preset Controls (visible in Graph mode) */}
        {activeTab === 'graph' ? (
          <div className="order-2 w-full sm:order-none sm:w-auto grid grid-cols-2 sm:flex items-center gap-2 min-w-0">
            {/* Preset Selector */}
            <div className="flex min-w-0 items-center gap-1.5">
              <FolderOpen size={14} className="text-slate-600" />
              <select
                value={activePresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full sm:w-auto min-w-0 max-w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600"
                aria-label="Preset graphs"
              >
                {PRESET_GRAPHS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    Preset: {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Algorithm Selector */}
            <div className="flex min-w-0 items-center gap-1.5">
              <select
                value={selectedAlgorithm}
                onChange={(e) => {
                  setSelectedAlgorithm(e.target.value as AlgorithmType);
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className="w-full sm:w-auto min-w-0 max-w-full px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-bold focus:outline-hidden focus:border-blue-500"
                aria-label="Search algorithm selector"
              >
                <optgroup label="Informed Search">
                  {Object.values(ALGORITHM_REGISTRY)
                    .filter((algo) => algo.isHeuristic)
                    .map((algo) => (
                      <option key={algo.id} value={algo.id}>
                        {algo.name} ({algo.formula})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Uninformed Search">
                  {Object.values(ALGORITHM_REGISTRY)
                    .filter((algo) => !algo.isHeuristic)
                    .map((algo) => (
                      <option key={algo.id} value={algo.id}>
                        {algo.name} ({algo.formula})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="col-span-2 sm:col-auto h-8 px-3.5 rounded-lg bg-[var(--success)] hover:bg-[var(--secondary)] text-[var(--base)] text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
              {isPlaying ? 'Pause' : currentStepIndex >= totalSteps - 1 ? 'Restart' : 'Start'}
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-600">Search tools</div>
        )}
          </header>
        </div>
      )}

      {/* 2. MAIN VIEW BODY */}
      <main className="flex-1 min-h-0 flex overflow-hidden relative">
        {activeTab === 'graph' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
              {/* Center Graph Canvas */}
              <div className="flex-1 min-h-[230px] lg:min-h-0 h-full relative">
                <GraphCanvas
                  graph={graph}
                  activeStep={activeStep}
                  isPlaying={isPlaying}
                  selectedTool={selectedTool}
                  setSelectedTool={setSelectedTool}
                  onUpdateGraph={(updater) => {
                    setGraph(updater);
                    setCurrentStepIndex(0);
                  }}
                  onSelectNode={(node) => setEditingNode(node)}
                  onSelectEdge={(edge) => setEditingEdge(edge)}
                />
              </div>

              {/* Right Side Inspection Panel (Queue / Pseudocode) */}
              <div className="w-full lg:w-80 h-36 lg:h-auto border-t lg:border-t-0 lg:border-l border-[var(--accent)]/20 flex flex-col bg-[var(--base)]/75 backdrop-blur-xl shrink-0 select-none">
                {/* Panel Tab Switcher */}
                <div className="flex items-center border-b border-slate-200 p-1 bg-slate-50/70">
                  <button
                    onClick={() => setRightPanelTab('queue')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                      rightPanelTab === 'queue'
                        ? 'bg-slate-100 text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <Layers size={13} className="text-amber-400" />
                    <span>Frontier Queue</span>
                  </button>
                  <button
                    onClick={() => setRightPanelTab('code')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                      rightPanelTab === 'code'
                        ? 'bg-slate-100 text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <Code size={13} className="text-sky-700" />
                    <span>Pseudocode</span>
                  </button>
                  <button
                    onClick={() => setRightPanelTab('metrics')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                      rightPanelTab === 'metrics'
                        ? 'bg-slate-100 text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <BarChart3 size={13} className="text-teal-600" />
                    <span>Metrics</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {rightPanelTab === 'queue' ? (
                    <QueueInspector
                      graph={graph}
                      activeStep={activeStep}
                      algorithmName={currentAlgoInfo.name}
                      isHeuristic={currentAlgoInfo.isHeuristic}
                    />
                  ) : rightPanelTab === 'code' ? (
                    <PseudocodeViewer
                      algorithmInfo={currentAlgoInfo}
                      activeLineNumber={activeStep?.pseudocodeLine ?? 1}
                    />
                  ) : (
                    <ComplexityGraph
                      steps={steps}
                      currentStepIndex={currentStepIndex}
                      timeComplexity={currentAlgoInfo.timeComplexity}
                      spaceComplexity={currentAlgoInfo.spaceComplexity}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Playback & Scrubber Controls */}
            <PlaybackControls
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              isPlaying={isPlaying}
              speedMs={speedMs}
              isNoPath={activeStep?.phase === 'no_path'}
              onPlay={handlePlay}
              onPause={handlePause}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onReset={handleReset}
              onSeek={handleSeek}
              onChangeSpeed={setSpeedMs}
            />
          </div>
        )}

        {/* 2D Grid / Maze Visualizer Tab */}
        {activeTab === 'grid' && (
          <div className="flex-1 overflow-y-auto">
            <GridVisualizer />
          </div>
        )}

        {/* Algorithm Benchmark Comparison Tab */}
        {activeTab === 'compare' && (
          <div className="flex-1 overflow-y-auto">
            <AlgorithmComparison
              graph={graph}
              onApplyPathToView={handleApplyFromComparison}
            />
          </div>
        )}

        {/* Theory & Quiz Tab */}
        {activeTab === 'theory' && (
          <div className="flex-1 overflow-y-auto">
            <TheorySection theme={theme} />
          </div>
        )}

        {activeTab === 'customize' && (
          <div className="flex-1 overflow-hidden">
            <CustomizationPanel theme={theme} onThemeChange={setTheme} />
          </div>
        )}
      </main>

      {/* 3. MODALS */}
      <NodeEditModal
        node={editingNode}
        isOpen={editingNode !== null}
        isStart={editingNode?.id === graph.startNodeId}
        isGoal={editingNode?.id === graph.goalNodeId}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNode}
        onSetStart={handleSetStart}
        onSetGoal={handleSetGoal}
        onDelete={handleDeleteNode}
      />

      <EdgeEditModal
        edge={editingEdge}
        nodes={graph.nodes}
        isOpen={editingEdge !== null}
        onClose={() => setEditingEdge(null)}
        onSave={handleSaveEdge}
        onDelete={handleDeleteEdge}
      />
    </div>
  );
}
