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
  FileSpreadsheet,
  Palette,
  ImageIcon,
  Loader2,
  Download
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

// --- Memoized Message Item Component ---
// This prevents historic messages (and their heavy markdown parsed outputs) from re-rendering
// on every single key press when the user typing takes place!
const MessageItem = React.memo(function MessageItem({
  msg,
  currentModelId,
  isSpeakingId,
  copiedMessageId,
  onCopyText,
  onSpeakText,
  formatBytes,
}: {
  msg: ChatMessage;
  currentModelId: string;
  isSpeakingId: string | null;
  copiedMessageId: string | null;
  onCopyText: (text: string, id: string) => void;
  onSpeakText: (text: string, id: string) => void;
  formatBytes: (bytes: number) => string;
}) {
  const isAssistant = msg.role === 'assistant';
  const isSystem = msg.role === 'system';
  
  if (isSystem) return null; // Suppress display of raw system triggers

  return (
    <div 
      className={`flex gap-4 w-full ${isAssistant ? 'items-start py-4' : 'justify-end py-2'}`}
      id={`msg-${msg.messageId}`}
    >
      {/* Left Avatar Column */}
      {isAssistant && (
        <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-900 border border-slate-705/10 flex items-center justify-center select-none flex-shrink-0 animate-in fade-in">
          <img 
            src="https://i.ibb.co/Jw45NHVk/logo.jpg" 
            alt="Next Ray" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`transition-all animate-in fade-in duration-200 ${
        isAssistant 
          ? 'flex-1 space-y-3' 
          : 'max-w-[70%] rounded-2xl px-4 py-2.5 bg-slate-100 text-slate-800 border border-slate-200/40 shadow-xs'
      }`}>
        
        {/* Attached file visual preview inside dialogue bubble */}
        {msg.fileName && (
          <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 mb-2 ${
            isAssistant 
              ? 'bg-white border-slate-100 text-slate-700' 
              : 'bg-indigo-700/60 border-indigo-700/80 text-white'
          }`}>
            {msg.fileType?.startsWith('image/') ? (
              <div className="relative h-12 w-12 rounded overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-center">
                <img 
                  src={msg.fileData || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100"} 
                  alt={msg.fileName} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-9 w-9 rounded bg-indigo-900/10 flex items-center justify-center text-xs flex-shrink-0">
                {msg.fileName.endsWith('.csv') ? (
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                ) : (
                  <FileText className="h-4 w-4 text-indigo-300" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 text-xs text-left">
              <p className="font-semibold truncate tracking-tight">{msg.fileName}</p>
              <p className="opacity-70 font-mono text-[9px]">{msg.fileSize ? formatBytes(msg.fileSize) : 'Extracted context'}</p>
            </div>
          </div>
        )}

        {/* Rendering of GPT core content markdown */}
        <div className="markdown-body prose max-w-none leading-relaxed font-sans text-[15px] break-words text-slate-800">
          {isAssistant ? (
            <div className="prose prose-slate prose-base text-slate-700 font-sans leading-relaxed">
              <Markdown>{msg.content}</Markdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed select-text font-normal text-[15px]">
              {msg.content}
            </p>
          )}
        </div>

        {/* Assistant Metadata / Audio Utilities Row */}
        {isAssistant && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-2 text-xs text-slate-400 font-mono">
            <span className="text-[10px]">Model: <strong className="text-slate-500 font-sans uppercase text-[9px]">{currentModelId.split('/').pop()}</strong></span>
            <div className="h-3 w-px bg-slate-200" />
            
            <button
              onClick={() => onCopyText(msg.content, msg.messageId)}
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
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
              onClick={() => onSpeakText(msg.content, msg.messageId)}
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
              title="Listen to Speech"
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
}, (prevProps, nextProps) => {
  // Only re-render a message if critical props actually change
  return (
    prevProps.msg.messageId === nextProps.msg.messageId &&
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.isSpeakingId === nextProps.isSpeakingId &&
    prevProps.copiedMessageId === nextProps.copiedMessageId &&
    prevProps.currentModelId === nextProps.currentModelId
  );
});


// --- Localized Input Message Builder ---
// Keeping input text local protects typing performance by not triggering broad parent re-renders!
interface ChatInputFormProps {
  onSendMessage: (content: string, fileDataUrl?: string, fileType?: string, fileName?: string, fileSize?: number) => void;
  isStreamLoading: boolean;
  attachedFile: any;
  setAttachedFile: React.Dispatch<React.SetStateAction<any>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatBytes: (bytes: number) => string;
  onOpenImageGenerator: () => void;
}

function ChatInputForm({
  onSendMessage,
  isStreamLoading,
  attachedFile,
  setAttachedFile,
  fileInputRef,
  handleFileChange,
  formatBytes,
  onOpenImageGenerator,
}: ChatInputFormProps) {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // AUTOMATIC KEYBOARD FOCUS: Focus the text box on mount, on submit, and whenever streaming finishes!
  useEffect(() => {
    if (!isStreamLoading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isStreamLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    let finalPrompt = inputText;
    
    // Check text context extraction
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

    // Auto-focus after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <footer className="p-4 md:p-6 border-t border-slate-100 bg-white whitespace-nowrap">
      <div className="max-w-3xl mx-auto space-y-3 p-1">
        
        {/* Active upload preview handle */}
        {attachedFile && (
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-800 shadow-xs animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2">
              {attachedFile.type.startsWith('image/') ? (
                <img 
                  src={attachedFile.dataUrl} 
                  alt="upload preview" 
                  className="h-8 w-8 object-cover rounded border border-slate-250 bg-white"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-slate-100/80 flex items-center justify-center text-xs text-indigo-600 flex-shrink-0 font-bold border border-slate-200">
                  TXT
                </div>
              )}
              <div className="text-left">
                <p className="font-semibold text-slate-800 max-w-[200px] truncate">{attachedFile.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {formatBytes(attachedFile.size)} ({attachedFile.isTextExtract ? 'Extracted text injection' : 'Data Payload'})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 px-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-650 rounded-lg transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Clean Minimalism Absolute Custom Search Input Design template */}
        <div className="relative group w-full">
          <form onSubmit={handleSubmit} className="relative flex items-center w-full">
            {/* Left attachment clip & paints absolute inside input */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-750 rounded-lg transition-colors cursor-pointer"
                title="Attach File (Images/Code/CSV)"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                onClick={onOpenImageGenerator}
                className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                title="Generate AI Art with Imagen"
              >
                <Palette className="h-4.5 w-4.5 text-indigo-600" />
              </button>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,text/*,.csv,.json,.ts,.js,.md,.py"
              className="hidden"
            />

            <input
              type="text"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                attachedFile 
                  ? "Explain what to analyze in this attachment..." 
                  : "Ask Next Ray or generate art..."
              }
              disabled={isStreamLoading}
              className="w-full pl-22 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all text-slate-800"
            />

            {/* Right submit absolute button inside input */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <button
                type="submit"
                disabled={isStreamLoading || (!inputText.trim() && !attachedFile)}
                className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-2 leading-none font-sans select-none">
          Next Ray utilize official cloud backends. Results can vary. PWA: <span className="text-emerald-500 font-bold font-mono">INSTALLABLE</span>
        </p>
      </div>
    </footer>
  );
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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  
  // File upload state variables
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string; // Base64 representation
    isTextExtract: boolean;
    extractedText?: string;
  } | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  
  // Imagen 4 generation panel states
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageRatio, setImageRatio] = useState('1:1');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setImageError(null);

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, aspect_ratio: imageRatio })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image. Please try a different prompt or verify your key configuration.');
      }

      const data = await response.json();
      if (data.success && data.imageDataUrl) {
        setGeneratedImageUrl(data.imageDataUrl);
      } else {
        throw new Error(data.error || 'Failed to generate image.');
      }
    } catch (err: any) {
      console.error(err);
      setImageError(err.message || 'Error occurred while contacting image cluster.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleApplyArtToChat = () => {
    if (!generatedImageUrl) return;
    onSendMessage(
      `Here is the custom AI artwork I generated using the prompt: **"${imagePrompt}"**`,
      generatedImageUrl,
      "image/jpeg",
      `imagen-${Date.now()}.jpg`,
      180556
    );
    // Reset and close
    setShowImagePanel(false);
    setImagePrompt('');
    setGeneratedImageUrl(null);
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to lowest message with smart bottom tracking
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Check if the user is already scrolled near the bottom (within 200 pixels)
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;

    // Trigger smooth tracking if near the bottom, or if it is the start of a user message
    const isAssistantStreaming = isStreamLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant';

    if (isAtBottom || !isAssistantStreaming) {
      requestAnimationFrame(() => {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      });
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
      // Read images as base64 for vision/multimodal models
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
      .slice(0, 1000); // cap size

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
      title: "Create an image",
      prompt: "Can you describe a highly detailed prompt to generate an image of a futuristic floating cloud island?",
      desc: "Get creative visuals or illustration descriptions",
      icon: (
        <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    },
    {
      title: "Write or edit",
      prompt: "Critique and rewrite this text to sound more business-ready, elegant, and standard-aligned.",
      desc: "Draft essays, code documentation, or emails",
      icon: (
        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
        </svg>
      )
    },
    {
      title: "Look something up",
      prompt: "Explain the logical differences between relational databases and Firestore collections in high simplicity.",
      desc: "Get fast explanations for code, concepts, or terms",
      icon: (
        <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    },
    {
      title: "Analyze data",
      prompt: "Format my user chat logs into a neat markdown summary report with categorized tables.",
      desc: "Upload logs, code files, or data to parse",
      icon: (
        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    }
  ];

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full bg-white relative transition-all duration-150 ${
        isDragging ? 'ring-4 ring-indigo-100 ring-inset bg-slate-50/50' : ''
      }`}
    >
      {/* Model-specific Alert Banner if NVIDIA key is missing */}
      {activeModel.provider === 'NVIDIA' && !serverKeyConfigured && !localStorage.getItem('nextray_custom_nvidia_key') && (
        <div className="bg-amber-50/70 border-b border-amber-100 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>
            Using <strong>{activeModel.name} (NVIDIA)</strong>. Ensure an NVIDIA API Key is provided in the **Options** drawer to prevent service errors.
          </span>
        </div>
      )}

      {/* Main Conversation Feed Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 md:px-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 animate-in fade-in duration-300"
      >
        {messages.length === 0 ? (
          // Clean Minimal Welcome Screen
          <div className="max-w-2xl mx-auto py-16 md:py-24 space-y-12 select-none">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/20 flex items-center justify-center shadow-lg animate-pulse mb-4">
                <img src="https://i.ibb.co/Jw45NHVk/logo.jpg" alt="Next Ray Logo" className="h-[36px] w-[36px] object-contain" />
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-800 font-sans">
                What are you working on?
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-sm font-normal">
                Ask Next Ray anything or trigger Imagen 4 artistic painter directly. Chats are synchronized.
              </p>
            </div>

            {/* Quick start Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {starterBento.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickPrompt(item.prompt)}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 text-left transition-all text-slate-705 shadow-sm relative group cursor-pointer active:scale-[0.99] flex items-start gap-3.5"
                >
                  <div className="p-2 bg-slate-50 group-hover:bg-white rounded-xl border border-slate-100 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-slate-800 mb-1 flex items-center justify-between">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-450">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-150 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-400" />
              <span>Drag & drop code, datasets, or images directly to analyze with Llama 3.3.</span>
            </div>
          </div>
        ) : (
          // Message Thread Feed
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, index) => (
              <MessageItem
                key={msg.messageId || index}
                msg={msg}
                currentModelId={currentModelId}
                isSpeakingId={isSpeakingId}
                copiedMessageId={copiedMessageId}
                onCopyText={handleCopyText}
                onSpeakText={handleSpeakText}
                formatBytes={formatBytes}
              />
            ))}

            {/* SSE Stream loader bubble */}
            {isStreamLoading && (
              <div className="flex gap-4 items-start py-4 w-full">
                {/* Brand Active Avatar */}
                <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-900 border border-slate-705/10 flex items-center justify-center select-none flex-shrink-0 animate-pulse">
                  <img src="https://i.ibb.co/Jw45NHVk/logo.jpg" alt="Next Ray" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                
                {/* Sleek Thinking Chat Bubble & Dots */}
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 border border-slate-200/40 px-4 py-3 select-none">
                    <span className="h-2 w-2 bg-slate-850 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-slate-850 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-slate-850 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 block animate-pulse select-none">
                    Next Ray is crafting a response...
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Drag & Drop Banner indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-white/95 border-2 border-slate-200 flex flex-col items-center justify-center gap-3 shadow z-20 transition-all">
          <Paperclip className="h-9 w-9 text-indigo-500 animate-bounce" />
          <p className="text-lg font-bold text-slate-800 leading-none">Drop context file to attach</p>
          <p className="text-xs text-slate-400 leading-none">Supports code snippets, datasets, data tables, and image files</p>
        </div>
      )}

      {/* Imagen 4 AI Painter Studio Overlay Drawer */}
      {showImagePanel && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-100 text-pink-600">
                  <Palette className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Next Ray Imagen 4 Studio</h3>
                  <p className="text-[10px] text-slate-450 font-mono">Google Generative Media Core</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowImagePanel(false);
                  setGeneratedImageUrl(null);
                  setImagePrompt('');
                  setImageError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <form onSubmit={handleGenerateImage} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 tracking-tight block">Describe your masterpiece</label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g. A hyper-detailed oil painting of a cybernetic tiger sitting on a mountain summit, neon highlights, starry night..."
                    rows={3}
                    disabled={isGeneratingImage}
                    className="w-full p-3.5 bg-slate-50 border border-slate-205 rounded-xl text-xs focus:ring-2 focus:ring-pink-100 focus:bg-white focus:border-pink-450 focus:outline-none transition-all text-slate-800 resize-none leading-normal font-sans"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 tracking-tight block">Aspect Ratio</label>
                    <select
                      value={imageRatio}
                      onChange={(e) => setImageRatio(e.target.value)}
                      disabled={isGeneratingImage}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:bg-white"
                    >
                      <option value="1:1">Standard Square (1:1)</option>
                      <option value="16:9">Wide Cinematic (16:9)</option>
                      <option value="9:16">Vertical Mobile (9:16)</option>
                      <option value="4:3">Retro Classic (4:3)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-xs font-bold shadow-md hover:bg-slate-800 disabled:opacity-40 disabled:bg-slate-250 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Painting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-pink-300" />
                          <span>Generate Image</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Progress feedback */}
              {isGeneratingImage && (
                <div className="p-8 border border-dashed border-pink-100 rounded-2xl bg-pink-50/20 text-center space-y-3.5 animate-pulse">
                  <div className="mx-auto h-12 w-12 rounded-full bg-pink-100/50 flex items-center justify-center text-pink-500">
                    <Palette className="h-6 w-6 animate-spin duration-3000" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Synthesizing Diffusion Artwork...</p>
                    <p className="text-[10px] text-pink-650 font-semibold">Running Imagen 4 algorithm on high-performance tensor networks</p>
                  </div>
                </div>
              )}

              {/* Errors container */}
              {imageError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-150 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{imageError}</p>
                </div>
              )}

              {/* Success Result Frame */}
              {generatedImageUrl && (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-tight block">Generated Masterpiece</label>
                    <div className="relative border border-slate-100 bg-slate-50 rounded-2xl overflow-hidden aspect-video shadow-md max-h-[220px]">
                      <img 
                        src={generatedImageUrl} 
                        alt="Imagen output" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleApplyArtToChat}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Insert into active chat</span>
                    </button>
                    <a
                      href={generatedImageUrl}
                      download={`nextray_artwork_${Date.now()}.jpg`}
                      className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center border border-slate-205 transition-all text-xs font-bold"
                      title="Download image file to local device"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer metadata */}
            <div className="px-6 py-3.5 bg-slate-50 text-[10px] text-slate-400 font-mono text-center border-t border-slate-100 selection:bg-indigo-100 select-none">
              Secured Google Media Workspace APIs
            </div>
          </div>
        </div>
      )}

      {/* Localized ChatInputForm handles state updates individually for zero typing stutters! */}
      <ChatInputForm 
        onSendMessage={onSendMessage}
        isStreamLoading={isStreamLoading}
        attachedFile={attachedFile}
        setAttachedFile={setAttachedFile}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        formatBytes={formatBytes}
        onOpenImageGenerator={() => {
          setGeneratedImageUrl(null);
          setImageError(null);
          setImagePrompt('');
          setShowImagePanel(true);
        }}
      />
    </div>
  );
}
export { ChatArea };
