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
  customGeminiKey: string;
  onChangeCustomGeminiKey: (val: string) => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  customKey,
  onChangeCustomKey,
  serverKeyConfigured,
  customGeminiKey,
  onChangeCustomGeminiKey,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right-10 duration-200 text-left">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-800">
              <Settings className="h-4.5 w-4.5 text-indigo-600 font-bold" />
              <h2 className="text-base font-bold tracking-tight text-slate-800">
                Next Ray Options
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. System Prompt Instructions */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-405">
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                System Persona
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tune the instruction context. This guides tone, response lengths, and code formats.
              </p>
              <textarea
                value={config.systemInstruction}
                onChange={(e) => onChangeConfig({ ...config, systemInstruction: e.target.value })}
                rows={4}
                placeholder="e.g. Respond strictly with concise structure, clear types, and beautiful code templates..."
                className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-slate-50/20 text-slate-800 focus:outline-none focus:border-indigo-200 transition-all font-sans placeholder-slate-300 font-normal leading-normal"
              />
            </div>

            {/* 2. Generation Sliders */}
            <div className="space-y-5 border-t border-slate-100 pt-5">
              <label className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-405">
                <Sliders className="h-3.5 w-3.5 text-indigo-500" />
                Parameters
              </label>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium font-sans">Temperature (Creativity)</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
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
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Deterministic / Precise</span>
                  <span>Creative / Dynamic</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium font-sans">Max Output Length</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-sans">
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
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* 3. API Integrations */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <label className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
                <Key className="h-3.5 w-3.5 text-indigo-500" />
                API Key Configurations
              </label>

              {/* NVIDIA custom key */}
              <div className="space-y-1.5 border-b border-dashed border-slate-100 pb-3">
                <p className="text-[11px] font-semibold text-slate-600">NVIDIA NIM API Key (optional)</p>
                {serverKeyConfigured ? (
                  <div className="p-2 py-1 bg-emerald-50 text-emerald-800 rounded text-[10px] flex items-center gap-2 w-fit">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="font-medium">Active in cloud server</span>
                  </div>
                ) : null}
                <input
                  type="password"
                  placeholder="nvapi-..."
                  value={customKey}
                  onChange={(e) => onChangeCustomKey(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-slate-50/10 text-slate-800 focus:outline-none focus:border-indigo-200 transition-all placeholder-slate-350"
                />
              </div>

              {/* Custom Gemini key */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-semibold text-slate-600">Google Gemini API Key</p>
                  <span className="text-[9px] text-indigo-600 font-mono tracking-wide px-1.5 py-0.5 rounded bg-indigo-50">Pages Voice Core</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Provide your Gemini Key here. Enables the ultra-realistic human Voice synthesize direct from your browser when hosted on static sites like Cloudflare.
                </p>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={customGeminiKey || ''}
                  onChange={(e) => onChangeCustomGeminiKey(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-slate-50/10 text-slate-800 focus:outline-none focus:border-indigo-200 transition-all placeholder-slate-350"
                />
              </div>
            </div>

          </div>

          {/* Footer Save / Done button */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 px-4 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
