import React from 'react';
import { 
  X, 
  Settings, 
  Sliders, 
  Key, 
  Cpu, 
  Sparkles, 
  FileText
} from 'lucide-react';
import { ChatConfig } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChatConfig;
  onChangeConfig: (newConfig: ChatConfig) => void;
  customKey: string;
  onChangeCustomKey: (val: string) => void;
  serverKeyConfigured: boolean;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  customKey,
  onChangeCustomKey,
  serverKeyConfigured,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-gray-100 animate-in slide-in-from-right-10 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2 text-gray-800">
              <Settings className="h-5 w-5 text-cyan-600 font-bold" />
              <h2 className="text-lg font-bold tracking-tight text-gray-900">
                Next Ray Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. System Prompt Instructions */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-gray-500">
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                Custom System Persona
              </label>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Tune the master instruction behavior. This influences how the AI thinks, responds, and matches code formats.
              </p>
              <textarea
                value={config.systemInstruction}
                onChange={(e) => onChangeConfig({ ...config, systemInstruction: e.target.value })}
                rows={4}
                placeholder="e.g. You are an expert programmer. Respond strictly with minimal clean TypeScript code and elegant structure..."
                className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50/20 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-sans placeholder-gray-400 font-normal shadow-xs leading-normal"
              />
            </div>

            {/* 2. Generation Sliders */}
            <div className="space-y-5 border-t border-gray-100 pt-5">
              <label className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-gray-500">
                <Sliders className="h-3.5 w-3.5 text-cyan-500" />
                Model Parameters
              </label>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium font-sans">Temperature (Creativity)</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {config.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => onChangeConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Deterministic / Precise</span>
                  <span>Highly Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium font-sans">Max Output Length</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-sans">
                    {config.maxTokens} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={config.maxTokens}
                  onChange={(e) => onChangeConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* 3. API Integrations (Hashed Key) */}
            <div className="space-y-4 border-t border-gray-100 pt-5">
              <label className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-gray-500">
                <Key className="h-3.5 w-3.5 text-emerald-500" />
                NVIDIA Integration Secret
              </label>

              {serverKeyConfigured ? (
                <div className="p-3 bg-emerald-50 text-emerald-850 rounded-xl border border-emerald-100 text-xs flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="font-medium">
                    Secure server-side NVIDIA_API_KEY detected in workspace! Free models active.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 text-amber-850 rounded-xl border border-amber-100 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0 animate-ping" />
                    <span className="font-semibold">NVIDIA Server Key Unconfigured</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-normal font-normal">
                    To use Llama & Nemotron models globally, configure <strong>NVIDIA_API_KEY</strong> in the cloud run environment or local `.env` file. You can also paste an NVIDIA web temporary key below for instant preview testing!
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[11px] text-gray-400">Temporary NIM Session Key (optional)</p>
                <input
                  type="password"
                  placeholder="nvapi-..."
                  value={customKey}
                  onChange={(e) => onChangeCustomKey(e.target.value)}
                  className="w-full text-sm font-mono p-2.5 border border-gray-200 rounded-xl bg-gray-50/10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all placeholder-gray-300 font-normal shadow-xs"
                />
              </div>
            </div>

          </div>

          {/* Footer Save / Done button */}
          <div className="px-6 py-4 border-t border-gray-150 bg-gray-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2 px-5 text-sm font-medium shadow-sm transition-all"
            >
              Close Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export { SettingsPanel };
