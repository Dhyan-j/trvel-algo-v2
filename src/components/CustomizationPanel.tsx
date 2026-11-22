import React from 'react';
import { Check, Palette } from 'lucide-react';

export type ThemeId =
  | 'earth'
  | 'forest'
  | 'navy'
  | 'rose'
  | 'monochrome'
  | 'cyberpunk'
  | 'edgerunners'
  | 'superman'
  | 'batman'
  | 'spiderman'
  | 'sovereign';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  colors: [string, string, string, string, string];
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'earth',
    name: 'Earth & Olive',
    description: 'Warm botanical palette',
    colors: ['#e5edb8', '#adb85f', '#837b47', '#5a3d31', '#300018'],
  },
  {
    id: 'forest',
    name: 'Modern Forest',
    description: 'Calm natural greens',
    colors: ['#edf4df', '#a7c957', '#6a994e', '#386641', '#1b3a2f'],
  },
  {
    id: 'navy',
    name: 'Deep Horizon',
    description: 'Professional cool neutrals',
    colors: ['#edf3f7', '#b9d4e4', '#7d9fba', '#3b6277', '#172a3a'],
  },
  {
    id: 'rose',
    name: 'Plum Rose',
    description: 'Rich editorial colors',
    colors: ['#f3e9ed', '#d9a5b3', '#b36b7d', '#713e4a', '#351821'],
  },
  {
    id: 'monochrome',
    name: 'Black & White',
    description: 'Clean monochrome editorial',
    colors: ['#f7f7f5', '#d1d1d1', '#737373', '#202020', '#111111'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Electric neon on midnight',
    colors: ['#0b1021', '#00f5d4', '#ff2bd6', '#7b61ff', '#f4f7ff'],
  },
  {
    id: 'edgerunners',
    name: 'Cyberpunk: Edgerunners',
    description: 'Night City yellow, chrome red and neon green accents',
    colors: ['#080a12', '#fcee0a', '#e53935', '#252c55', '#f5f5f2'],
  },
  {
    id: 'superman',
    name: 'Cobalt Horizon',
    description: 'Blue, yellow & sky-bright energy',
    colors: ['#eef4ff', '#78a9ed', '#f0c419', '#2563a9', '#101c3a'],
  },
  {
    id: 'batman',
    name: 'Obsidian Volt',
    description: 'Shadowed charcoal & electric yellow',
    colors: ['#17191d', '#4a4d55', '#f2c84b', '#2f333a', '#f4f4f2'],
  },
  {
    id: 'spiderman',
    name: 'Crimson Velocity',
    description: 'Bold red, blue & racing pink',
    colors: ['#f8f3f6', '#ff4d7d', '#e22b3a', '#1853a3', '#171827'],
  },
  {
    id: 'sovereign',
    name: 'Verdant Sovereign',
    description: 'Iron armor, royal gold & emerald',
    colors: ['#11110f', '#1f3d2c', '#b9a95c', '#45543a', '#e5e0cf'],
  },
];

interface CustomizationPanelProps {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  theme,
  onThemeChange,
}) => {
  return (
    <div className="h-full overflow-y-auto bg-[var(--canvas)]">
      <div className="mx-auto max-w-5xl p-6 space-y-5">
        <div className="flex items-start gap-3 border-b border-[var(--accent)]/25 pb-5">
          <div className="rounded-xl bg-[var(--secondary)] p-2.5 text-[var(--base)]">
            <Palette size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Appearance</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Choose a professional color theme for the entire workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {THEME_OPTIONS.map((option) => {
            const selected = theme === option.id;
            const [base, surface, accent, secondary, text] = option.colors;
            return (
              <button
                key={option.id}
                onClick={() => onThemeChange(option.id)}
                className={`text-left rounded-2xl border p-4 transition duration-200 ${
                  selected
                    ? 'border-[var(--secondary)] bg-[var(--base)] shadow-[0_14px_35px_rgba(48,0,24,0.12)]'
                    : 'border-[var(--accent)]/30 bg-[var(--base)]/75 hover:-translate-y-0.5 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)]">{option.name}</h3>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{option.description}</p>
                  </div>
                  {selected && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--base)]">
                      <Check size={15} />
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-5 gap-1.5">
                  {[base, surface, accent, secondary, text].map((color, index) => (
                    <div
                      key={color}
                      title={`${[45, 25, 10, 10, 10][index]}%`}
                      className="h-12 rounded-lg border border-black/5"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[var(--muted)]">
                  <span>45 / 25 / 10 / 10 / 10</span>
                  <span className="uppercase">{selected ? 'Active' : 'Apply'}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--base)]/70 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Theme balance</h3>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full">
            <div className="w-[45%] bg-[var(--base)]" />
            <div className="w-[25%] bg-[var(--surface)]" />
            <div className="w-[10%] bg-[var(--accent)]" />
            <div className="w-[10%] bg-[var(--secondary)]" />
            <div className="w-[10%] bg-[var(--text)]" />
          </div>
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            Canvas 45% · Surfaces 25% · Accent 10% · Controls 10% · Text 10%
          </p>
        </div>
      </div>
    </div>
  );
};
