import React, { useState } from 'react';
import { 
  ChevronDown, 
  Cpu, 
  Sparkles, 
  Workflow, 
  Zap, 
  HelpCircle,
  Eye
} from 'lucide-react';
import { AIModel } from '../types';
import { AVAILABLE_MODELS } from '../lib/models';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export default function ModelSelector({
  selectedModelId,
  onSelectModel,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 bg-white rounded-lg border border-slate-200 text-left transition-all font-medium text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100"
      >
        <div className={`h-5 w-5 rounded-md flex items-center justify-center text-white ${
          currentModel.provider === 'NVIDIA' ? 'bg-indigo-600' : 'bg-slate-700'
        }`}>
          {currentModel.provider === 'NVIDIA' ? (
            <Cpu className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </div>
        
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-semibold text-slate-800">{currentModel.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded leading-none border font-mono font-medium capitalize ${
              currentModel.provider === 'NVIDIA' 
                ? 'bg-slate-100 text-slate-600 border-slate-200' 
                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              {currentModel.provider}
            </span>
          </div>
        </div>

        <ChevronDown className={`h-4 w-4 text-slate-400 object-contain transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Overlay Menu */}
      {isOpen && (
        <>
          {/* Invisible backdrop to dismiss click outside */}
          <div 
            className="fixed inset-0 z-40 cursor-default" 
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 mt-2 w-[340px] md:w-[420px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden transform origin-top-left transition-all duration-150 animate-in fade-in slide-in-from-top-2">
            <div className="p-3 border-b border-slate-100 bg-slate-50/55">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Select Active Model
              </span>
            </div>

            <div className="divide-y divide-slate-100 flex flex-col max-h-[480px] overflow-y-auto">
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3.5 hover:bg-slate-50 transition-all flex gap-3 ${
                      isSelected ? 'bg-slate-100/50' : ''
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 text-white ${
                      model.provider === 'NVIDIA' ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}>
                      {model.provider === 'NVIDIA' ? (
                        <Cpu className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-800 font-sans">
                          {model.name}
                        </h4>
                        <span className={`text-[9px] px-1.5 rounded-sm uppercase font-mono font-bold select-none ${
                          model.provider === 'NVIDIA' 
                            ? 'bg-slate-100 text-slate-600' 
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {model.provider}
                        </span>
                        {model.isVision && (
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-705 font-bold border border-indigo-100">
                            <Eye className="h-2.5 w-2.5" />
                            Vision
                          </span>
                        )}
                        <span className="text-[10px] ml-auto font-mono text-slate-400">
                          {model.badge}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-normal leading-relaxed">
                        {model.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                        <span>Max Output: <strong className="text-slate-500">{model.maxTokens} tokens</strong></span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export { ModelSelector };
