import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Volume2, 
  Copy, 
  Check, 
  Sparkles, 
  Cpu, 
  FileText, 
  X, 
  Terminal, 
  AlertCircle,
  Clock,
  Settings,
  HelpCircle,
  Eye,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, ChatConfig, AIModel } from '../types';
import { AVAILABLE_MODELS } from '../lib/models';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentModelId: string;
  config: ChatConfig;
  onSendMessage: (content: string, fileDataUrl?: string, fileType?: string, fileName?: string, fileSize?: number) => void;
  isStreamLoading: boolean;
  onOpenSettings: () => void;
  activeModel: AIModel;
  serverKeyConfigured: boolean;
  onQuickPrompt: (text: string) => void;
}

export default function ChatArea({
  messages,
  currentModelId,
  config,
  onSendMessage,
  isStreamLoading,
  onOpenSettings,
  activeModel,
  serverKeyConfigured,
  onQuickPrompt
}: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  
  // File upload state variables
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string; // Base64 content representation
    isTextExtract: boolean;
    extractedText?: string;
  } | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to lowest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreamLoading]);

  // Clean-up speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle Drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Process selected or dropped file
  const processUploadedFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');
    
    // Check if it's raw text/code/csv/json
    const isTextExtract = 
      file.type.startsWith('text/') || 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.ts') || 
      file.name.endsWith('.js') || 
      file.name.endsWith('.md') ||
      file.name.endsWith('.py');

    if (isImage) {
      // If image, read as Data URL base64 for Gemini vision
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
          isTextExtract: false
        });
      };
      reader.readAsDataURL(file);
    } else if (isTextExtract) {
      // If code/text, read as Text and extract content for model prompt injection
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          dataUrl: "", // Text will be injected in description prompt
          isTextExtract: true,
          extractedText: reader.result as string
        });
      };
      reader.readAsText(file);
    } else {
      // Generic binary fallback as text extraction
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          dataUrl: "",
          isTextExtract: true,
          extractedText: `[Extracted Binary File Name: ${file.name}]`
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Submit trigger
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    let finalPrompt = inputText;
    
    // If text file was attached and needs contextual extraction
    if (attachedFile && attachedFile.isTextExtract && attachedFile.extractedText) {
      finalPrompt = `${inputText}\n\n---\n**CONTEXT FILE ATTACHED**\nFilename: ${attachedFile.name}\nContent:\n\`\`\`\n${attachedFile.extractedText}\n\`\`\``;
    }

    onSendMessage(
      finalPrompt, 
      attachedFile?.dataUrl || undefined, 
      attachedFile?.type || undefined, 
      attachedFile?.name || undefined, 
      attachedFile?.size || undefined
    );
    
    setInputText('');
    setAttachedFile(null);
  };

  // Copy Message text helper
  const handleCopyText = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Speak response aloud using browser synthesis
  const handleSpeakText = (text: string, msgId: string) => {
    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Clean up markdown tags for cleaner narrative sounding
    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, '[code block omitted]')
      .replace(/[*#_~`-]/g, '')
      .slice(0, 1000); // safety length cap

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.onend = () => {
      setIsSpeakingId(null);
    };
    utterance.onerror = () => {
      setIsSpeakingId(null);
    };

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Initial greeting box items
  const starterBento = [
    {
      title: "Clean Code Generator",
      prompt: "Can you write a responsive bento-grid card React component utilizing Tailwind classes?",
      desc: "Creates elegant production components",
      color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100/60"
    },
    {
      title: "Data Summary Parsing",
      prompt: "Convert this CSV dataset into a neat markdown statistical table showing products, revenue, and margins.",
      desc: "Format databases into markdown tables",
      color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60"
    },
    {
      title: "Explain Complex Physics",
      prompt: "Can you explain Quantum Entanglement conceptually using a friendly real-life analogy?",
      desc: "Breaks advanced topics down simply",
      color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100/60"
    },
    {
      title: "Refinement & Polishing",
      prompt: "Critique and polish this text structure to sound highly formal, business-ready, and engaging.",
      desc: "Rewrites logs and text to stand out",
      color: "bg-purple-50 text-purple-700 hover:bg-purple-100/60"
    }
  ];

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full bg-white relative transition-all duration-150 ${
        isDragging ? 'ring-4 ring-cyan-500/30 ring-inset bg-cyan-50/10' : ''
      }`}
    >
      {/* Top Header Controls */}
      <header className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
          <Clock className="h-3.5 w-3.5 text-cyan-500" />
          <span>Active Session Config:</span>
          <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
            Temp: {config.temperature}
          </span>
          <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 hidden sm:inline">
            Max: {config.maxTokens} tokens
          </span>
        </div>

        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all active:scale-[0.98]"
        >
          <Settings className="h-3.5 w-3.5 text-gray-500" />
          <span>Options</span>
        </button>
      </header>

      {/* Model-specific Alert Banner if NVIDIA key is missing */}
      {activeModel.provider === 'NVIDIA' && !serverKeyConfigured && !localStorage.getItem('nextray_custom_nvidia_key') && (
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-2 flex items-center gap-2.5 text-xs text-amber-850">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>
            You selected <strong>{activeModel.name} (NVIDIA)</strong>. Ensure an NVIDIA API Key is provided in the **Options** drawer or `.env` to prevent service errors.
          </span>
        </div>
      )}

      {/* Main Conversation Feed Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-200"
      >
        {messages.length === 0 ? (
          // Standard ChatGPT Welcome Screen
          <div className="max-w-2xl mx-auto py-10 md:py-16 space-y-8 select-none">
            <div className="text-center space-y-3">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 items-center justify-center shadow-xl shadow-cyan-500/10 text-white animate-bounce">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 font-sans">
                Next Ray AI Playground
              </h2>
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                Unlock the parameters of NVIDIA's free LLMs and Google Gemini models in a single immersive chat interface.
              </p>
            </div>

            {/* Quick start Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {starterBento.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickPrompt(item.prompt)}
                  className={`p-4 rounded-2xl border border-gray-150/70 text-left transition-all ${item.color} group relative overflow-hidden`}
                >
                  <h3 className="text-sm font-bold tracking-tight mb-1 flex items-center justify-between">
                    {item.title}
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
                  </h3>
                  <p className="text-xs leading-relaxed opacity-85">
                    {item.desc}
                  </p>
                  <div className="absolute right-3 bottom-2 opacity-5 scale-75 group-hover:scale-100 transition-all font-mono font-bold text-6xl">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <Paperclip className="h-3.5 w-3.5 text-gray-400" />
              <span>Drag-and-drop code, CSV data, or image files below to analyze them instantly!</span>
            </div>
          </div>
        ) : (
          // Message Thread Feed
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              const isSystem = msg.role === 'system';
              
              if (isSystem) return null; // Suppress display of raw system triggers

              return (
                <div 
                  key={msg.messageId || index}
                  className={`flex gap-4 ${isAssistant ? '' : 'justify-end'}`}
                  id={`msg-${msg.messageId}`}
                >
                  {/* Left Avatar Column */}
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm select-none flex-shrink-0 animate-in fade-in">
                      R
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] rounded-2xl px-4.5 py-3 space-y-2 border shadow-xs transition-all animate-in fade-in duration-200 ${
                    isAssistant 
                      ? 'bg-gray-50/50 border-gray-100 text-gray-800' 
                      : 'bg-cyan-600 border-cyan-700 text-white shadow-md shadow-cyan-600/5'
                  }`}>
                    
                    {/* Attached file visual preview inside dialogue bubble */}
                    {msg.fileName && (
                      <div className={`p-2 rounded-lg border flex items-center gap-2 mb-2 ${
                        isAssistant 
                          ? 'bg-white border-gray-100 text-gray-700' 
                          : 'bg-cyan-700/60 border-cyan-700 text-white'
                      }`}>
                        {msg.fileType?.startsWith('image/') ? (
                          <div className="relative h-14 w-14 rounded overflow-hidden border bg-gray-50 flex-shrink-0 flex items-center justify-center">
                            {/* Visual reference for image payload */}
                            <img 
                              src={msg.fileData || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100"} 
                              alt={msg.fileName} 
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded bg-cyan-900/20 flex items-center justify-center text-xs flex-shrink-0">
                            {msg.fileName.endsWith('.csv') ? (
                              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <FileText className="h-5 w-5 text-cyan-300" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold truncate uppercase tracking-tight">{msg.fileName}</p>
                          <p className="opacity-70 font-mono text-[10px]">{msg.fileSize ? formatBytes(msg.fileSize) : 'Extracted context'}</p>
                        </div>
                      </div>
                    )}

                    {/* Rendering of GPT core content markdown */}
                    <div className="markdown-body prose max-w-none text-gray-800 leading-relaxed font-sans text-sm break-words">
                      {isAssistant ? (
                        <div className="prose prose-slate prose-sm text-gray-7  70 font-sans leading-relaxed">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      ) : (
                        <p className="text-white whitespace-pre-wrap leading-relaxed select-text font-medium text-sm">
                          {msg.content}
                        </p>
                      )}
                    </div>

                    {/* Assistant Metadata / Audio Utilities Row */}
                    {isAssistant && (
                      <div className="flex items-center gap-3 pt-1 border-t border-gray-100 mt-2 text-xs text-gray-400 font-mono">
                        <span className="text-[10px]">Active Model ID: <strong className="text-gray-600 font-sans uppercase text-[9px]">{currentModelId.split('/').pop()}</strong></span>
                        <div className="h-3 w-px bg-gray-150" />
                        
                        <button
                          onClick={() => handleCopyText(msg.content, msg.messageId)}
                          className="hover:text-cyan-600 flex items-center gap-1 transition-colors"
                          title="Copy text block"
                        >
                          {copiedMessageId === msg.messageId ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSpeakText(msg.content, msg.messageId)}
                          className="hover:text-cyan-600 flex items-center gap-1 transition-colors"
                          title="Listen to Narrative Speech"
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${isSpeakingId === msg.messageId ? 'text-indigo-500 animate-pulse font-bold' : ''}`} />
                          <span className={isSpeakingId === msg.messageId ? 'text-indigo-500 font-bold' : ''}>
                            {isSpeakingId === msg.messageId ? 'Speaking' : 'Speak'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* SSE Stream loader bubble */}
            {isStreamLoading && (
              <div className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-xs font-bold leading-none select-none flex-shrink-0 shadow">
                  R
                </div>
                <div className="max-w-[85%] rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="flex space-x-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-medium font-mono text-gray-400 ml-1">Streaming active intelligence response...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Drag & Drop Banner indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-cyan-50/70 border-4 border-dashed border-cyan-500 backdrop-blur-xs flex flex-col items-center justify-center gap-2 shadow z-20 transition-all">
          <Paperclip className="h-10 w-10 text-cyan-600 animate-bounce" />
          <p className="text-lg font-bold text-cyan-900 leading-none">Drop file here to upload</p>
          <p className="text-xs text-cyan-700 leading-none">Allows image OCR analysis, text conversions, and CSV integrations</p>
        </div>
      )}

      {/* Input Message Builder Section */}
      <footer className="p-4 md:p-6 border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto space-y-3">
          
          {/* Active upload preview handle */}
          {attachedFile && (
            <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between text-xs text-gray-800 shadow-xs animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2">
                {attachedFile.type.startsWith('image/') ? (
                  <img 
                    src={attachedFile.dataUrl} 
                    alt="upload preview" 
                    className="h-8 w-8 object-cover rounded border bg-white"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-gray-100/80 flex items-center justify-center text-xs text-cyan-600 flex-shrink-0 font-bold border border-gray-200">
                    TXT
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 max-w-[200px] truncate">{attachedFile.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {formatBytes(attachedFile.size)} ({attachedFile.isTextExtract ? 'Extracted text injection' : 'Base64 Native Media'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1 px-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-400 hover:text-gray-650 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center shadow-xs"
              title="Attach File (Images/Code/CSV)"
            >
              <Paperclip className="h-5 w-5 text-gray-500" />
            </button>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,text/*,.csv,.json,.ts,.js,.md,.py"
              className="hidden"
            />

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                attachedFile 
                  ? "Describe what you would like the AI model to do with this file..." 
                  : `Message ${activeModel.name}...`
              }
              disabled={isStreamLoading}
              className="flex-grow p-3 px-4 border border-gray-200 rounded-xl bg-gray-50/20 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-sans placeholder-gray-400 font-normal shadow-xs"
            />

            <button
              type="submit"
              disabled={isStreamLoading || (!inputText.trim() && !attachedFile)}
              className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl transition-all shadow-md flex items-center justify-center min-w-[50px] active:scale-[0.98]"
            >
              <Send className="h-4 w-4 font-bold" />
            </button>
          </form>

          <p className="text-[10px] text-gray-400 text-center leading-none font-mono">
            Next Ray AI can produce incorrect outcomes. Confirm critical logical parameters.
          </p>
        </div>
      </footer>
    </div>
  );
}
export { ChatArea };
