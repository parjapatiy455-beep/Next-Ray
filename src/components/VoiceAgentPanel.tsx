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
  ArrowRight
} from 'lucide-react';

interface VoiceAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<string | null>;
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
  { id: 'Kore', name: 'Kore (Sweet & Soft)', gender: 'Female', description: 'A gentle, cheerful, and incredibly sweet feminine voice with natural cadence.' },
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

  useEffect(() => {
    localStorage.setItem('nextray_selected_voice', selectedVoice);
  }, [selectedVoice]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
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
        // Map average volume (0-128 range) to scale percentage
        setLiveVolume(average);
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
      setCallState('SPEAKING');

      // Setup speaking pulsing animation
      const interval = setInterval(() => {
        if (audio.paused || audio.ended) {
          clearInterval(interval);
          return;
        }
        // Mock speech volumes for speaking state
        setLiveVolume(25 + Math.random() * 45);
      }, 100);

      audio.onended = () => {
        clearInterval(interval);
        setCallState('LISTENING');
        setLiveVolume(0);
        // Resume speech recognition automatically for conversational loop
        startSpeechRecognition();
      };

      audio.onerror = (e) => {
        clearInterval(interval);
        console.error("Audio playback error:", e);
        setErrorMsg("Failed to play synthesis stream.");
        setCallState('LISTENING');
        startSpeechRecognition();
      };

      await audio.play();
    } catch (err: any) {
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
  };

  // HTML5 Voice to Text SpeechRecognition listener loop
  const startSpeechRecognition = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMsg("Your web browser lacks native SpeechRecognition. Use Google Chrome/Safari.");
        return;
      }

      stopSpeechRecognition();

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Supports multilingual speech translations

      recognition.onstart = () => {
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
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition handler error:", event.error);
        }
      };

      recognition.onend = async () => {
        // Recognition ends naturally. Check if we got text to respond to
        setLiveVolume(0);
        if (recognitionRef.current) {
          // If we are still in listening mode, check if we have transcribed speech
          setTranscript(prev => {
            const finalSpeech = prev.trim();
            if (finalSpeech.length > 2) {
              setCallState('THINKING');
              // Trigger send message with the custom personalized bio combined
              let processedText = finalSpeech;
              if (personalBio.trim()) {
                processedText = `${finalSpeech}\n\n[System directive: Recall Parjapati's personalized memory/dataset to customise speech: "${personalBio.trim()}"]`;
              }
              
              onSendMessage(processedText).then((responseContent) => {
                if (responseContent) {
                  speakWithGemini(responseContent);
                } else {
                  setCallState('LISTENING');
                  startSpeechRecognition();
                }
              }).catch(() => {
                setCallState('LISTENING');
                startSpeechRecognition();
              });
            } else {
              // Loop back and listen again if empty transcript
              // only if state remains listening
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
  };

  // Toggle Call active loop
  const handleToggleCall = async () => {
    if (callState !== 'IDLE') {
      // Disconnecting
      stopSpeechRecognition();
      stopMicrophoneAnalysis();
      stopPlayback();
      setCallState('IDLE');
      setTranscript('');
      setLiveVolume(0);
    } else {
      // Connecting
      setCallState('CONNECTING');
      setErrorMsg(null);
      await startMicrophoneAnalysis();
      startSpeechRecognition();
    }
  };

  // Voice Speaker tester preview
  const handlePreviewVoice = async (voiceId: string) => {
    const textSamples: Record<string, string> = {
      Kore: "Hi there! I am Core, your soft, sweet-voiced companion. How can I help you today?",
      Zephyr: "Welcome back. I am Zephyr, your cozy and warm companion. I'm listening to you.",
      Puck: "Awesome! I am Puck. Let's get things done cheerfully! What's our next task?",
      Charon: "Hello. I am Charon. I assist with deep research, data, and logic in a focused manner.",
      Fenrir: "Don't worry, my friend. I am Fenrir, your strong, comforting presence. Tell me everything."
    };

    const sample = textSamples[voiceId] || "Hello, this is a voice test.";
    
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

  return (
    <div className="w-full lg:w-[380px] bg-slate-50 border-l border-slate-200 h-full flex flex-col z-40 relative shadow-sm overflow-hidden select-none" id="voice-agent-pane">
      {/* Pane Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Volume2 className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5 leading-none">
              Voice Agent Call
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-450 mt-1 leading-none">Next Ray Ultra Speech 3.1</p>
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
        
        {/* Active Call UI Module */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col items-center text-center space-y-5">
          {/* Decorative glow bg */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-indigo-500 to-pink-500" />
          
          <div className="relative mt-2">
            {/* Pulsing ring depending on volume */}
            <div 
              className="absolute inset-0 rounded-full bg-indigo-100 transition-all duration-75 select-none"
              style={{
                transform: `scale(${1 + (liveVolume / 90)})`,
                opacity: callState !== 'IDLE' ? 0.4 + (liveVolume / 200) : 0
              }}
            />
            {/* Core Mic Visual */}
            <button
              onClick={handleToggleCall}
              className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all cursor-pointer select-none ${
                callState === 'IDLE' 
                  ? 'bg-slate-100 border border-slate-250 text-slate-500 hover:bg-slate-200/80' 
                  : callState === 'LISTENING'
                  ? 'bg-emerald-500 text-white shadow-lg border border-emerald-400 shadow-emerald-500/10'
                  : callState === 'SPEAKING'
                  ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500 shadow-indigo-600/10 animate-pulse'
                  : 'bg-indigo-400 text-white animate-pulse'
              }`}
            >
              {callState === 'IDLE' ? (
                <PhoneCall className="h-7 w-7" />
              ) : callState === 'LISTENING' ? (
                <Mic className="h-7 w-7" />
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
                callState === 'LISTENING' ? 'bg-emerald-500 animate-pulse' :
                callState === 'SPEAKING' ? 'bg-indigo-500 animate-bounce' : 'bg-pink-500 animate-pulse'
              }`} />
              {callState === 'IDLE' && "Offline — Idle"}
              {callState === 'CONNECTING' && "Connecting voice cluster..."}
              {callState === 'LISTENING' && "Listening... speak now"}
              {callState === 'THINKING' && "Formulating reply..."}
              {callState === 'SPEAKING' && "Next Ray speaking..."}
              {callState === 'PAUSED' && "Call Paused"}
            </div>
            
            <p className="text-[13px] text-slate-450 leading-relaxed max-w-xs mx-auto">
              {callState === 'IDLE' && "Initiate a zero-lag vocal conversation. Our sweet voice responds as soon as you finish speaking."}
              {callState === 'CONNECTING' && "Loading pre-trained voice modules from Google cloud..."}
              {callState === 'LISTENING' && (transcript ? `"${transcript}"` : "Speak aloud. We will process, think, and speak natively.")}
              {callState === 'THINKING' && "Synthesizing answers with Llama 3.3 model details..."}
              {callState === 'SPEAKING' && "Enjoy soft, sweet-synthesis. Interrupt or toggle off anytime."}
            </p>
          </div>

          {/* Connect / Terminate Session Action Button */}
          <button
            onClick={handleToggleCall}
            className={`w-full py-2 px-4 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
              callState === 'IDLE'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10'
            }`}
          >
            {callState === 'IDLE' ? (
              <>
                <PhoneCall className="h-4 w-4" />
                <span>Start Voice Call Session</span>
              </>
            ) : (
              <>
                <PhoneOff className="h-4 w-4" />
                <span>Disconnect Call Service</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 text-left flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Training Data Personalization Memory Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-xl">
              <Brain className="h-4.5 w-4.5 text-purple-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Train & Personalize</h4>
              <p className="text-[10px] text-slate-400">Teach Next Ray some facts to train its responses</p>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={personalBio}
              onChange={(e) => setPersonalBio(e.target.value)}
              placeholder="Example: My name is Parjapati. I built the talki app (https://talki.vercel.app/). Speak to me like a close friend, be highly comforting, and discuss tech design."
              rows={4}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-400 focus:bg-white text-slate-700 resize-none font-sans placeholder-slate-400 leading-normal"
            />
            
            <button
              onClick={handleSaveBioMemory}
              className="w-full py-2 bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400 font-bold" />
              <span>Save Personal Memory</span>
            </button>
          </div>

          {showSavedToast && (
            <p className="text-center text-[10px] text-emerald-600 font-semibold animate-sine-pulse">
              ✓ Memories saved! Next Ray is immediately personalized to your data.
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
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Voice Selection</h4>
              <p className="text-[10px] text-slate-400">Sweet & soft realistic voices (not robotic)</p>
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
                    <span className="text-[9px] px-1 bg-slate-100 text-slate-500 rounded border border-slate-200 font-mono">
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
        POWERED BY GOOGLE DEEPMIND GEMINI API
      </div>
    </div>
  );
}
