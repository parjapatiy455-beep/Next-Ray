import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneCall, 
  PhoneOff, 
  Volume2, 
  Sparkles, 
  Brain, 
  Settings, 
  X, 
  Plus, 
  User, 
  Check, 
  AlertCircle, 
  Play, 
  Pause,
  ArrowRight,
  Sparkle,
  Globe,
  Zap,
  Ear
} from 'lucide-react';

interface VoiceAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string, fileDataUrl?: string, fileType?: string, fileName?: string, fileSize?: number) => Promise<string | null>;
  isStreamLoading: boolean;
  messages: any[];
}

type CallState = 'IDLE' | 'CONNECTING' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'PAUSED';

interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  description: string;
}

const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Core (Feminine - Sweet)', gender: 'Female', description: 'A gentle, cheerful, and incredibly sweet feminine voice with natural cadence.' },
  { id: 'Zephyr', name: 'Zephyr (Warm & Calm)', gender: 'Male', description: 'A warm, soothing, and peaceful male voice for a gentle presence.' },
  { id: 'Puck', name: 'Puck (Enthusiastic)', gender: 'Female', description: 'A bright, lively, and highly energetic voice perfect for proactive brainstorming.' },
  { id: 'Charon', name: 'Charon (Intellectual)', gender: 'Male', description: 'A balanced, professional, and clear masculine voice with a deep tone.' },
  { id: 'Fenrir', name: 'Fenrir (Comforting)', gender: 'Male', description: 'A strong, steady, and cozy voice providing robust reassurance.' }
];

export default function VoiceAgentPanel({
  isOpen,
  onClose,
  onSendMessage,
  isStreamLoading,
  messages
}: VoiceAgentPanelProps) {
  // Config & Voice State
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('nextray_selected_voice') || 'Kore';
  });

  const [languageMode, setLanguageMode] = useState<'bilingual' | 'english'>('bilingual'); // Bilingual: Hindi + English (Hinglish)
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0); // Conversational speed multiplier

  // Call States
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [transcript, setTranscript] = useState<string>('');
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Training / Memory States
  const [personalBio, setPersonalBio] = useState<string>(() => {
    return localStorage.getItem('nextray_personal_bio') || '';
  });
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Audio & Speech Recognition References
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const javascriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionActiveRef = useRef<boolean>(false);
  const speakTimerRef = useRef<any>(null);
  const ignoreVolumeThresholdRef = useRef<boolean>(false); // Ignore user voice during first split second of speech

  useEffect(() => {
    localStorage.setItem('nextray_selected_voice', selectedVoice);
  }, [selectedVoice]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (speakTimerRef.current) clearInterval(speakTimerRef.current);
      stopSpeechRecognition();
      stopMicrophoneAnalysis();
      stopPlayback();
    };
  }, []);

  // Set up microphone analysis for pulsing voice ripples
  const startMicrophoneAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const microphone = audioCtx.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      
      const javascriptNode = audioCtx.createScriptProcessor(2048, 1, 1);
      javascriptNodeRef.current = javascriptNode;
      
      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioCtx.destination);
      
      javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) {
          values += array[i];
        }
        const average = values / length;
        // Map average volume (0-128 range)
        setLiveVolume(average);

        // REAL-TIME INTERRUPTION PROTOCOL:
        // If the AI is currently speaking, and the user's voice intensity exceeds 32 (meaning they spoke or made an active sound),
        // we instantly execute voice suppression, kill the TTS speaker stream, and resume listening to the user!
        if (callState === 'SPEAKING' && !ignoreVolumeThresholdRef.current && average > 32) {
          console.log("[Voice Agent Interruption] User sounds exceeded threshold, interrupting assistant...");
          stopPlayback();
          setLiveVolume(0);
          setTranscript("Listening (Interrupted)...");
          setCallState('LISTENING');
          startSpeechRecognition();
        }
      };
    } catch (err: any) {
      console.warn("Could not start micro-volume analysis:", err);
    }
  };

  const stopMicrophoneAnalysis = () => {
    try {
      if (javascriptNodeRef.current) {
        javascriptNodeRef.current.disconnect();
        javascriptNodeRef.current.onaudioprocess = null;
        javascriptNodeRef.current = null;
      }
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setLiveVolume(0);
    } catch (e) {
      console.warn("Error tearing down analysis:", e);
    }
  };

  // Play natural deep-synthesis voice
  const speakWithGemini = async (text: string) => {
    try {
      if (speakTimerRef.current) clearInterval(speakTimerRef.current);
      setCallState('CONNECTING');
      setErrorMsg(null);

      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName: selectedVoice })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Voice synthesis failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.success || !data.audioDataUrl) {
        throw new Error("No voice synthesis returned.");
      }

      // Stop previous playing audio
      stopPlayback();

      // Play loaded audio
      const audio = new Audio(data.audioDataUrl);
      activeAudioRef.current = audio;
      
      // Control voice speed/rate
      try {
        audio.playbackRate = voiceSpeed;
      } catch (e) {
        console.warn("Playback speed control unsupported on this web layer.");
      }

      setCallState('SPEAKING');

      // Set speech guard block so machine doesn't accidentally interrupt itself 
      // in the first 800 milliseconds from acoustic feedback
      ignoreVolumeThresholdRef.current = true;
      const ignoreTimeout = setTimeout(() => {
        ignoreVolumeThresholdRef.current = false;
      }, 850);

      // Setup speaking pulsing visualization wave
      speakTimerRef.current = setInterval(() => {
        if (audio.paused || audio.ended) {
          clearInterval(speakTimerRef.current);
          return;
        }
        // Simulated speech frequencies for high-vibe voice ripples
        setLiveVolume(18 + Math.random() * 42);
      }, 76);

      audio.onended = () => {
        clearTimeout(ignoreTimeout);
        if (speakTimerRef.current) clearInterval(speakTimerRef.current);
        setCallState('LISTENING');
        setLiveVolume(0);
        // Resume speech recognition automatically for continuous natural voice communication
        startSpeechRecognition();
      };

      audio.onerror = (e) => {
        clearTimeout(ignoreTimeout);
        if (speakTimerRef.current) clearInterval(speakTimerRef.current);
        console.error("Audio playback error:", e);
        setErrorMsg("Failed to play synthesis stream.");
        setCallState('LISTENING');
        startSpeechRecognition();
      };

      // Ensure active speech recognition does not capture audio synthesized output as input
      stopSpeechRecognition();

      await audio.play();
    } catch (err: any) {
      if (speakTimerRef.current) clearInterval(speakTimerRef.current);
      console.error(err);
      setErrorMsg(err.message || "Synthesis cluster error. Verify GEMINI_API_KEY.");
      setCallState('LISTENING');
      setLiveVolume(0);
      startSpeechRecognition();
    }
  };

  // Stop active speech playback
  const stopPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if (speakTimerRef.current) {
      clearInterval(speakTimerRef.current);
    }
  };

  // HTML5 Voice to Text SpeechRecognition listener loop (optimized for bilingual)
  const startSpeechRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMsg("Your web browser lacks native SpeechRecognition. Please use Google Chrome or Safari.");
        return;
      }

      stopSpeechRecognition();

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false; // Capture discrete chunks for ultra-fast reaction turnaround
      recognition.interimResults = true; // High fidelity responsiveness
      
      // Auto-configure optimal dialects
      if (languageMode === 'bilingual') {
        recognition.lang = 'en-IN'; // Indian accent (optimal for Hinglish)
      } else {
        recognition.lang = 'en-US'; // Neutral English
      }

      recognition.onstart = () => {
        recognitionActiveRef.current = true;
        setCallState('LISTENING');
        setTranscript('');
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscript(currentText);

        // Interrupt assistant speaking instantly if transcription starts producing text
        if (callState === 'SPEAKING') {
          console.log("[Voice Agent Interruption] Transcription text feedback detected.");
          stopPlayback();
          setLiveVolume(0);
          setCallState('LISTENING');
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition warning:", event.error);
        }
      };

      recognition.onend = async () => {
        recognitionActiveRef.current = false;
        setLiveVolume(0);
        
        // If we are still in listening mode, check if we parsed anything meaningful to answer
        if (recognitionRef.current) {
          setTranscript(prev => {
            const finalSpeech = prev.trim();
            if (finalSpeech.length >= 2) {
              setCallState('THINKING');
              
              // Optimized high-speed vocal system prompts
              // We instruct whichever LLM model is selected (even free NVIDIA ones) to reply in 1-2 lines for maximum speed!
              const systemDirectives = [
                `[System voice call directive: Speak in soft, realistic, comforting human phrasing. Provide a snappy, quick, and ultra-short conversational reply in maximum 1 or 2 lines of text. Do NOT emit markdown, code blocks, bullet points, or list structures under any circumstance. Answer directly and sweetly as if in a direct live phone call.]`
              ];

              if (personalBio.trim()) {
                systemDirectives.push(`[Your relationship profile summary for Parjapati: ${personalBio.trim()}]`);
              }

              if (languageMode === 'bilingual') {
                systemDirectives.push(`[Conversational language: You can blend both simple Hindi and English (Hinglish tone) sweetly as requested. Keep Hindi words simple, sweet, and warm.]`);
              }

              const processedText = `${finalSpeech}\n\n${systemDirectives.join('\n')}`;
              
              onSendMessage(processedText).then((responseContent) => {
                if (responseContent) {
                  // Clean response of brackets to keep speech clean
                  const cleanResponse = responseContent.replace(/\[[\s\S]*?\]/g, "");
                  speakWithGemini(cleanResponse);
                } else {
                  setCallState('LISTENING');
                  startSpeechRecognition();
                }
              }).catch(() => {
                setCallState('LISTENING');
                startSpeechRecognition();
              });
            } else {
              // Loop back and listen again if empty transcript was generated
              if (callState === 'LISTENING') {
                try {
                  recognition.start();
                } catch(e) {}
              }
            }
            return '';
          });
        }
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to start speech tracking module.");
      recognitionActiveRef.current = false;
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch(e){}
      recognitionRef.current = null;
    }
    recognitionActiveRef.current = false;
  };

  // Toggle Call active loop
  const handleToggleCall = async () => {
    if (callState !== 'IDLE') {
      // Disconnecting Call
      stopSpeechRecognition();
      stopMicrophoneAnalysis();
      stopPlayback();
      setCallState('IDLE');
      setTranscript('');
      setLiveVolume(0);
    } else {
      // Connecting Call
      setCallState('CONNECTING');
      setErrorMsg(null);
      await startMicrophoneAnalysis();
      startSpeechRecognition();
    }
  };

  // Voice Speaker tester preview
  const handlePreviewVoice = async (voiceId: string) => {
    const textSamples: Record<string, string> = {
      Kore: "Aap se baat karke bahut achha laga! Main aapki sweet companion hoon.",
      Zephyr: "Hi friend, aapka swagat hai. Main Zephyr hoon, bilkul warm aur shaant.",
      Puck: "Wah! Main bahot excited hoon. Let's start and solve problems together!",
      Charon: "Hello. I am Charon. Main structural data aur analytics me expert assistant hoon.",
      Fenrir: "Bilkul fikr mat kijiye, main aapke sath hoon. Tell me what is on your mind."
    };

    const sample = textSamples[voiceId] || "Hello, this is a sound test of Next Ray.";
    
    // Play synthesis
    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sample, voiceName: voiceId })
      });
      if (response.ok) {
        const data = await response.json();
        stopPlayback();
        const audio = new Audio(data.audioDataUrl);
        activeAudioRef.current = audio;
        await audio.play();
      }
    } catch (e) {
      console.error("Test speech failed:", e);
    }
  };

  // Commit biography memory to persist personalized training data
  const handleSaveBioMemory = () => {
    localStorage.setItem('nextray_personal_bio', personalBio);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  if (!isOpen) return null;

  // Compute dynamic heights for natural Siri-style equalizer bars
  const volumeScale = Math.min(Math.max(liveVolume, 2), 110);
  const computeHeight = (factor: number) => {
    if (callState === 'IDLE') return 'h-2';
    const dynamicVal = Math.round(2 + (volumeScale * factor * 0.45));
    return `${Math.min(dynamicVal, 48)}px`;
  };

  return (
    <div className="w-full lg:w-[380px] bg-slate-50 border-l border-slate-200 h-full flex flex-col z-40 relative shadow-sm overflow-hidden select-none" id="voice-agent-pane">
      {/* Pane Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Volume2 className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5 leading-none">
              Realtime Voice Agent
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <p className="text-[10px] text-slate-450 mt-1 leading-none font-medium flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
              Bilingual (English / Hindi / Hinglish)
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* Realtime Call interface with Human Equalizer Waves */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col items-center text-center space-y-5">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600" />
          
          {/* Conversational speed dial indicator */}
          <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <span className="flex items-center gap-1">
              <Sparkle className="h-3 w-3 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
              Active LLM Mode
            </span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full font-semibold text-slate-600">
              <span>Speech Interruption: Active</span>
            </div>
          </div>

          {/* Premium Audio Waves visualizer */}
          <div className="h-16 flex items-center justify-center gap-1.5 px-6 w-full select-none">
            {callState === 'IDLE' ? (
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <Ear className="h-4.5 w-4.5 text-slate-350" />
                <span>Microphone Standby</span>
              </div>
            ) : (
              <>
                <span className="w-1.5 bg-sky-400/90 rounded-full transition-all duration-75" style={{ height: computeHeight(0.3) }} />
                <span className="w-1.5 bg-indigo-400 rounded-full transition-all duration-75" style={{ height: computeHeight(0.6) }} />
                <span className="w-1.5 bg-teal-400 rounded-full transition-all duration-75" style={{ height: computeHeight(0.9) }} />
                <span className="w-1.5 bg-indigo-600 rounded-full transition-all duration-75" style={{ height: computeHeight(1.2) }} />
                <span className="w-1.5 bg-purple-500 rounded-full transition-all duration-75" style={{ height: computeHeight(1.0) }} />
                <span className="w-1.5 bg-pink-400 rounded-full transition-all duration-75" style={{ height: computeHeight(0.7) }} />
                <span className="w-1.5 bg-amber-400/90 rounded-full transition-all duration-75" style={{ height: computeHeight(0.4) }} />
              </>
            )}
          </div>

          <div className="relative">
            {/* Pulsing ring depending on volume */}
            <div 
              className="absolute inset-[-12px] rounded-full bg-indigo-50 border border-indigo-100 transition-all duration-100"
              style={{
                transform: `scale(${1 + (volumeScale / 100)})`,
                opacity: callState !== 'IDLE' ? 0.5 + (volumeScale / 180) : 0
              }}
            />
            {/* Core Phone Call / Microphone Trigger Action button */}
            <button
              onClick={handleToggleCall}
              className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all cursor-pointer select-none border shadow-md ${
                callState === 'IDLE' 
                  ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' 
                  : callState === 'LISTENING'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
                  : callState === 'SPEAKING'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20'
                  : 'bg-indigo-500 text-white border-indigo-400 animate-pulse'
              }`}
            >
              {callState === 'IDLE' ? (
                <PhoneCall className="h-7 w-7 text-indigo-600" />
              ) : callState === 'LISTENING' ? (
                <Mic className="h-7 w-7 animate-pulse" />
              ) : callState === 'SPEAKING' ? (
                <Volume2 className="h-7 w-7 animate-bounce" />
              ) : (
                <Sparkles className="h-7 w-7" />
              )}
            </button>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/40 text-xs text-slate-705 mb-2 font-semibold">
              <span className={`h-2 w-2 rounded-full ${
                callState === 'IDLE' ? 'bg-slate-400' :
                callState === 'CONNECTING' ? 'bg-amber-400 animate-pulse' :
                callState === 'LISTENING' ? 'bg-emerald-500 animate-ping' :
                callState === 'SPEAKING' ? 'bg-indigo-500 animate-bounce' : 'bg-purple-500 animate-pulse'
              }`} />
              {callState === 'IDLE' && "Voice Connection Closed"}
              {callState === 'CONNECTING' && "Connecting Cloud Synthesis..."}
              {callState === 'LISTENING' && "Listening — Speaks naturally!"}
              {callState === 'THINKING' && "Processing reply..."}
              {callState === 'SPEAKING' && "Agent Speaking..."}
              {callState === 'PAUSED' && "Paused"}
            </div>
            
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
              {callState === 'IDLE' && "Tap the button to start. Speaks exactly like a real human. To interrupt, just speak over it!"}
              {callState === 'CONNECTING' && "Pre-hydrating soft human sound nodes from Google DeepMind network..."}
              {callState === 'LISTENING' && (transcript ? `"${transcript}"` : "Active listening mode. Speak English, Hindi or mix both...")}
              {callState === 'THINKING' && "Analyzing query with selected LLM model. Generating snappy reply..."}
              {callState === 'SPEAKING' && "AI Sweet Speech active. You can interrupt by simply speaking out loud."}
            </p>
          </div>

          {/* Interactive Toggle Button */}
          <button
            onClick={handleToggleCall}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-2 select-none border ${
              callState === 'IDLE'
                ? 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                : 'bg-rose-500 border-rose-600 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10'
            }`}
          >
            {callState === 'IDLE' ? (
              <>
                <PhoneCall className="h-4 w-4" />
                <span>Start Zero-Lag Voice Call</span>
              </>
            ) : (
              <>
                <PhoneOff className="h-4 w-4" />
                <span>End Voice Call Session</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-805 text-left flex items-start gap-2">
              <AlertCircle className="h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Bilingual Dialect & Speed Options */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
              <Globe className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Vocal Preferences</h4>
              <p className="text-[10px] text-slate-400">Configure language dialects & speeds</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLanguageMode('bilingual')}
              className={`p-2 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                languageMode === 'bilingual'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hinglish (Mix Hindi + Eng)
            </button>
            <button
              onClick={() => setLanguageMode('english')}
              className={`p-2 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                languageMode === 'english'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              English Only (US Dialect)
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
              <span>Speech Speed: {voiceSpeed.toFixed(1)}x</span>
              <span>Default (1.0x)</span>
            </div>
            <input 
              type="range" 
              min={0.8} 
              max={1.4} 
              step={0.1}
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-full"
            />
          </div>
        </div>

        {/* Training Data Personalization Memory Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-xl">
              <Brain className="h-4.5 w-4.5 text-purple-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Personal Memory Training</h4>
              <p className="text-[10px] text-slate-400">Train Next Ray with your biological data or custom facts</p>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={personalBio}
              onChange={(e) => setPersonalBio(e.target.value)}
              placeholder="Example: Mera naam Parjapati hai. Maine talki app banaya hai. Mere sath ek dost ki tarah baat karo aur design discuss karo."
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-400 focus:bg-white text-slate-700 resize-none font-sans placeholder-slate-400 leading-normal"
            />
            
            <button
              onClick={handleSaveBioMemory}
              className="w-full py-2 bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400 font-bold" />
              <span>Save Direct Memory Fact</span>
            </button>
          </div>

          {showSavedToast && (
            <p className="text-center text-[10px] text-emerald-600 font-semibold animate-pulse">
              ✓ Facts persistent! Voice responses are now personalized.
            </p>
          )}
        </div>

        {/* Voice Selector Module */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-xl">
              <Settings className="h-4.5 w-4.5 text-teal-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Sweet-voice Selection</h4>
              <p className="text-[10px] text-slate-405">Soft, soothing human voices (not robotic)</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {AVAILABLE_VOICES.map((voice) => (
              <div 
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  selectedVoice === voice.id 
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-xs' 
                    : 'border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-semibold ${selectedVoice === voice.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {voice.name}
                    </p>
                    <span className="text-[9px] px-1 bg-slate-100 text-slate-500 border border-slate-200 rounded font-mono">
                      {voice.gender === 'Female' ? 'F' : 'M'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 mt-1 leading-normal truncate">{voice.description}</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice.id);
                  }}
                  className="p-1 px-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-[9px] font-bold flex items-center gap-1 flex-shrink-0"
                  title="Test Voice Sample"
                >
                  <Play className="h-2.5 w-2.5 fill-current" />
                  <span>Test</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-slate-200 bg-white text-center text-[9px] font-mono leading-none select-none text-slate-400">
        POWERED BY DEEPMIND REALTIME AUDIO PROTOCOL
      </div>
    </div>
  );
}
