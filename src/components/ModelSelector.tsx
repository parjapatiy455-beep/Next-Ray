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
        className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-100 rounded-xl border border-gray-200/80 text-left transition-all font-medium text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      >
        <div className={`h-5 w-5 rounded-md flex items-center justify-center text-white ${
          currentModel.provider === 'NVIDIA' ? 'bg-gradient-to-tr from-green-500 to-emerald-600' : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
        }`}>
          {currentModel.provider === 'NVIDIA' ? (
            <Cpu className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </div>
        
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-semibold text-gray-950">{currentModel.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded leading-none border font-mono font-medium capitalize ${
              currentModel.provider === 'NVIDIA' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {currentModel.provider}
            </span>
          </div>
        </div>

        <ChevronDown className={`h-4 w-4 text-gray-400 object-contain transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Overlay Menu */}
      {isOpen && (
        <>
          {/* Invisible backdrop to dismiss click outside */}
          <div 
            className="fixed inset-0 z-40 cursor-default" 
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 mt-2 w-[340px] md:w-[420px] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-left transition-all duration-150 animate-in fade-in slide-in-from-top-2">
            <div className="p-3 border-b border-gray-50 bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                Select Active Intelligence Model
              </span>
            </div>

            <div className="divide-y divide-gray-50 flex flex-col max-h-[480px] overflow-y-auto">
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
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-all flex gap-3 ${
                      isSelected ? 'bg-cyan-50/30' : ''
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                      model.provider === 'NVIDIA' ? 'bg-gradient-to-tr from-green-500 to-emerald-600' : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
                    }`}>
                      {model.provider === 'NVIDIA' ? (
                        <Cpu className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-semibold text-gray-950 font-sans">
                          {model.name}
                        </h4>
                        <span className={`text-[9px] px-1 px-1.5 rounded-sm uppercase font-mono font-bold font-semibold select-none ${
                          model.provider === 'NVIDIA' 
                            ? 'bg-green-100/60 text-green-800' 
                            : 'bg-blue-100/60 text-blue-800'
                        }`}>
                          {model.provider}
                        </span>
                        {model.isVision && (
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 font-bold border border-purple-100">
                            <Eye className="h-2.5 w-2.5" />
                            Vision
                          </span>
                        )}
                        <span className="text-[10px] ml-auto font-mono text-gray-400">
                          {model.badge}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 lines-2 font-normal leading-relaxed">
                        {model.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-mono">
                        <span>Max Output: <strong className="text-gray-600">{model.maxTokens} tokens</strong></span>
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
