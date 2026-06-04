import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Sparkles, 
  Cpu, 
  Trash2, 
  LogIn, 
  Database, 
  AlertTriangle,
  Github,
  Moon,
  Sun,
  Layout,
  MessageSquareOff,
  CpuIcon,
  Settings,
  Clock,
  PanelLeft,
  PanelLeftClose,
  Volume2
} from 'lucide-react';

import { 
  auth, 
  db, 
  isLocalFallback, 
  signInWithGoogle, 
  signUpEmail,
  signInEmail,
  logoutUser,
  handleFirestoreError,
  OperationType
} from './lib/firebase';

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

import { ChatSession, ChatMessage, UserProfile, ChatConfig } from './types';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ModelSelector from './components/ModelSelector';
import SettingsPanel from './components/SettingsPanel';
import InteractiveWorkbench from './components/InteractiveWorkbench';
import VoiceAgentPanel from './components/VoiceAgentPanel';
import { AVAILABLE_MODELS } from './lib/models';

function extractDecksAndHtml(text: string) {
  // Extract JSON presentation slide decks
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
  let match;
  while ((match = jsonRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && (parsed.type === 'slideshow_deck' || Array.isArray(parsed.slides))) {
        return { type: 'slides', data: parsed };
      }
    } catch (e) {
      // Ignored non-deck JSON block
    }
  }

  // Find where the JSON slide deck begins
  let startIdx = text.indexOf('{"type": "slideshow_deck"');
  if (startIdx === -1) {
    const regexMatch = text.search(/\{\s*"type"\s*:\s*"slideshow_deck"/);
    if (regexMatch !== -1) {
      startIdx = regexMatch;
    }
  }

  // If no slide deck structural signature is found, check if code block has been initiated
  if (startIdx === -1) {
    const codeBlockStart = text.indexOf('```json');
    if (codeBlockStart !== -1) {
      const segment = text.slice(codeBlockStart + 7).trim();
      const typeKeyIdx = segment.indexOf('"type"');
      const pptValIdx = segment.indexOf('"slideshow_deck"');
      if (typeKeyIdx !== -1 && pptValIdx !== -1 && (typeKeyIdx < 120)) {
        const openBrace = segment.indexOf('{');
        if (openBrace !== -1) {
          startIdx = codeBlockStart + 7 + openBrace;
        }
      }
    }
  }

  if (startIdx === -1) {
    // Check if there is standard HTML code block streaming
    const htmlRegex = /```html\s*([\s\S]*?)\s*(?:```|$)/g;
    let htmlMatch;
    while ((htmlMatch = htmlRegex.exec(text)) !== null) {
      const code = htmlMatch[1].trim();
      if (code.length > 30) {
        return { type: 'html', data: code };
      }
    }
    return null;
  }

  // Extract from the start curly brace onwards
  const rawPiece = text.slice(startIdx);

  // Count braces/brackets to close them cleanly
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;
  let cleanText = "";

  for (let i = 0; i < rawPiece.length; i++) {
    const char = rawPiece[i];
    
    // Stop copy if we hit another triple backtick markdown separator after we have characters
    if (char === '`' && i > 5 && rawPiece.slice(i, i + 3) === '```') {
      break;
    }

    cleanText += char;

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }

  // Perform string closing if it was left untyped
  let closingStr = "";
  if (inString) {
    closingStr += '"';
  }

  // Assemble current state
  let currentDraft = cleanText + closingStr;

  // Clear common trailing delimiters that yield parse errors
  let trimText = currentDraft.trim();
  if (trimText.endsWith(',') || trimText.endsWith(':')) {
    trimText = trimText.slice(0, -1);
  }

  // Close open brackets and braces from inside out
  let recovery = "";
  for (let b = 0; b < openBrackets; b++) {
    if (openBraces > 1) {
      recovery += '}';
      openBraces--;
    }
    recovery += ']';
  }
  for (let ob = 0; ob < openBraces; ob++) {
    recovery += '}';
  }

  const permutations = [
    trimText + recovery,
    trimText + '}' + recovery,
    trimText + '"]}' + recovery,
    trimText + '"]' + recovery
  ];

  for (const candidate of permutations) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && (parsed.type === 'slideshow_deck' || Array.isArray(parsed.slides))) {
        if (!parsed.slides) parsed.slides = [];
        if (!Array.isArray(parsed.slides)) parsed.slides = [parsed.slides];
        // Clean out blank or title-less slides
        parsed.slides = parsed.slides.filter((s: any) => s && typeof s === 'object' && s.title);
        if (parsed.slides.length > 0) {
          return { type: 'slides', data: parsed };
        }
      }
    } catch (e) {}
  }

  return null;
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [serverKeyConfigured, setServerKeyConfigured] = useState(false);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);

  // Cookie persistence helper functions for lightning-fast start pre-hydration
  const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const getCookie = (name: string): string => {
    try {
      return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1] || '') : r;
      }, '');
    } catch (e) {
      return '';
    }
  };

  // Secure server-side slug generation fetch command (ChatGPT styled endpoint)
  const getServerSlug = async (title: string, id: string): Promise<string> => {
    try {
      const response = await fetch('/api/chats/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, id })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.slug) return data.slug;
      }
    } catch (err) {
      console.warn("Could not retrieve server-side slug, falling back:", err);
    }
    return createSlug(title, id);
  };
  
  // Email-Password Authentication Credentials States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authErrorAlert, setAuthErrorAlert] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Custom API key entered by user in settings panel
  const [customNvidiaKey, setCustomNvidiaKey] = useState<string>(() => {
    return localStorage.getItem('nextray_custom_nvidia_key') || '';
  });

  const [customGeminiKey, setCustomGeminiKey] = useState<string>(() => {
    return localStorage.getItem('nextray_custom_gemini_key') || '';
  });

  // Sidebar settings
  const [config, setConfig] = useState<ChatConfig>({
    modelId: 'meta/llama-3.3-70b-instruct',
    systemInstruction: `You are Next Ray, an advanced AI companion with access to an interactive Slide Creator and HTML Sandbox. 

CRITICAL DIRECTIVE - RESPOND SHORT, SWEET, AND ULTRA FAST:
1. When the user asks normal conversational questions, chat messages, or general questions, respond with a short and sweet text reply. Do NOT output any JSON or PPT slides unless they explicitly ask for a slide deck, presentation, or slides!
2. ONLY when the user explicitly asks to make or edit a PPT, slides, presentation, pitch deck, slideshow, or interactive preview/sandbox, should you generate the slideshow JSON structure or HTML sandbox block.
3. Always keep your verbal responses exceptionally short and sweet (maximum 1 or 2 sweet, exciting sentences in natural Hinglish or simple friendly English!).
   - Example 1 (User asks for PPT): "Sure! Aapke liye ek awesome pitch deck design kar raha hoon. Check out the slides player!"
   - Example 2 (User asks for edit): "Done! Meine slides ko update kar diya hai. Check details inside the sliding live player."
4. Never repeat or summarize what's in the PPT JSON block or HTML block verbally. Absolutely no long intros, long summaries, or prefaces. Start outputting the JSON or HTML code blocks instantly after the single sentence greeting. This saves tokens, reduces wait time, and runs extremely fast!

ADDITIONAL PPT DECK & HTML STRUCTURES (Only for PPT/Sandbox requests):
1. To build, edit, or update a PPT presentation deck, write a markdown code block of type "json" containing this exact schema structure:
\`\`\`json
{
  "type": "slideshow_deck",
  "name": "Pitch Deck Title",
  "slides": [
    {
      "id": "s1",
      "title": "Welcome Slide",
      "subtitle": "Subtitle or Caption",
      "bullets": ["Bullet 1", "Bullet 2"],
      "layout": "title" // 'title', 'split', 'bento', 'quote', 'metrics'
    }
  ]
}
\`\`\`
Layouts:
- 'title': Centered landing screen.
- 'split': Parallel layout. List items go automatically on the right side.
- 'bento': Elegant showcase grid.
- 'quote': Quotation screen ('title' has quotation content, 'quoteAuthor' for name).
- 'metrics': Statistics highlight ('metricValue' such as "98%" and 'metricLabel' such as "Satisfaction").

2. To generate HTML mock code, output complete document inside an \`\`\`html markdown block using CDN Tailwind. Always respond instantly & concisely!`,
    temperature: 0.7,
    maxTokens: 3000,
  });

  // Unique identifier generator
  const makeId = () => {
    return 'nr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  };

  const createSlug = (title: string, id: string) => {
    const sanitized = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')     // remove non-alphanumeric except hyphen and space
      .replace(/[\s_]+/g, '-')       // replace spaces or underscore with single hyphen
      .replace(/^-+|-+$/g, '');      // trim leading/trailing hyphens
    
    const shortId = id.substring(id.length - 6);
    return sanitized ? `${sanitized}-${shortId}` : shortId;
  };

  // 1. Fetch server config to verify cloud status of keys
  useEffect(() => {
    const fetchServerConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          setServerKeyConfigured(data.nvidiaConfigured);
        }
      } catch (err) {
        console.warn("Could not check Server configuration, bypassing status display:", err);
      }
    };
    fetchServerConfig();
  }, []);

  // Save temporary NVIDIA key to local storage
  const handleCustomKeyChange = (val: string) => {
    setCustomNvidiaKey(val);
    localStorage.setItem('nextray_custom_nvidia_key', val);
  };

  const handleCustomGeminiKeyChange = (val: string) => {
    setCustomGeminiKey(val);
    localStorage.setItem('nextray_custom_gemini_key', val);
  };

  // 2. Authentication tracking (Google Client Login or LocalStorage Fallback)
  useEffect(() => {
    if (isLocalFallback) {
      // Local Guest load
      const savedUser = localStorage.getItem("nextray_local_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } else {
      // Firebase standard auth listener
      const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Authorized Explorer',
            photoURL: firebaseUser.photoURL || null,
          };
          setUser(profile);
          
          // Write user profile to firestore
          const userDocPath = `users/${firebaseUser.uid}`;
          setDoc(doc(db, "users", firebaseUser.uid), {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Authorized Explorer',
            photoURL: firebaseUser.photoURL || null,
            createdAt: new Date().toISOString()
          }, { merge: true }).catch(error => {
            handleFirestoreError(error, OperationType.WRITE, userDocPath);
          });
        } else {
          setUser(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // 3. Sync Conversations (Chats list) with local Cache (SWR) & Cookie persistence
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      return;
    }

    // A. IMMEDIATE CACHE RECOVERY: Load from localStorage cache first to ensure absolute zero lag
    const sessionsCacheKey = `nextray_sessions_cache_${user.uid}`;
    const cachedRaw = localStorage.getItem(sessionsCacheKey);
    let cachedSessions: ChatSession[] = [];
    if (cachedRaw) {
      try {
        cachedSessions = JSON.parse(cachedRaw);
        if (cachedSessions && cachedSessions.length > 0) {
          setSessions(cachedSessions);
          
          // speculative thread pre-selection on startup
          if (!currentSessionId) {
            const hParts = window.location.hash;
            const hSlug = hParts.startsWith('#/chat/') ? hParts.replace('#/chat/', '') : '';
            const pParts = window.location.pathname.split('/');
            const pSlug = (pParts[1] === 'chat' && pParts[2]) ? pParts[2] : '';
            const activeSlug = pSlug || hSlug;
            
            let preSelectedId = null;
            if (activeSlug) {
              const matched = cachedSessions.find(s => s.slug === activeSlug || s.chatId === activeSlug);
              if (matched) preSelectedId = matched.chatId;
            }
            if (!preSelectedId) {
              const savedCookieSession = getCookie("nextray_current_session");
              if (savedCookieSession && cachedSessions.some(s => s.chatId === savedCookieSession)) {
                preSelectedId = savedCookieSession;
              }
            }
            if (!preSelectedId) preSelectedId = cachedSessions[0].chatId;
            setCurrentSessionId(preSelectedId);
          }
        }
      } catch (err) {
        console.warn("Could not pre-hydrate sessions from local cookie cache:", err);
      }
    }

    if (isLocalFallback) {
      // Load sessions from LocalStorage fallback
      const localSessionsRaw = localStorage.getItem(`nextray_sessions_${user.uid}`);
      const loaded: ChatSession[] = localSessionsRaw ? JSON.parse(localSessionsRaw) : [];
      loaded.sort((a, b) => {
        const d1 = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const d2 = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return d2 - d1;
      });
      const loadedWithSlugs = loaded.map(s => {
        if (!s.slug) {
          s.slug = createSlug(s.title, s.chatId);
        }
        return s;
      });
      setSessions(loadedWithSlugs);
      localStorage.setItem(sessionsCacheKey, JSON.stringify(loadedWithSlugs));

      if (loadedWithSlugs.length > 0 && !currentSessionId) {
        const hash = window.location.hash;
        const slugStr = hash.startsWith('#/chat/') ? hash.replace('#/chat/', '') : '';
        let targetId = null;
        if (slugStr) {
          const found = loadedWithSlugs.find(s => s.slug === slugStr || s.chatId === slugStr);
          if (found) targetId = found.chatId;
        }
        if (!targetId) targetId = loadedWithSlugs[0].chatId;
        setCurrentSessionId(targetId);
      }
    } else {
      // Firestore Live Query without orderBy to minimize operational costs
      const path = 'chats';
      const chatsQuery = query(
        collection(db, "chats"),
        where("userId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const loaded: ChatSession[] = [];
        snapshot.forEach((doc) => {
          loaded.push(doc.data() as ChatSession);
        });

        const parseDate = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'string') return new Date(val).getTime();
          if (val instanceof Date) return val.getTime();
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          if (typeof val.seconds === 'number') return val.seconds * 1000;
          return new Date(val).getTime();
        };

        loaded.sort((a, b) => parseDate(b.updatedAt) - parseDate(a.updatedAt));

        const loadedWithSlugs = loaded.map(s => {
          if (!s.slug) {
            s.slug = createSlug(s.title, s.chatId);
          }
          return s;
        });
        
        // Save back to persistent offline cache
        localStorage.setItem(sessionsCacheKey, JSON.stringify(loadedWithSlugs));
        setSessions(loadedWithSlugs);

        if (loadedWithSlugs.length > 0 && !currentSessionId) {
          const pParts = window.location.pathname.split('/');
          const pSlug = (pParts[1] === 'chat' && pParts[2]) ? pParts[2] : '';
          const hash = window.location.hash;
          const slugStr = pSlug || (hash.startsWith('#/chat/') ? hash.replace('#/chat/', '') : '');
          
          let targetId = null;
          if (slugStr) {
            const found = loadedWithSlugs.find(s => s.slug === slugStr || s.chatId === slugStr);
            if (found) targetId = found.chatId;
          }
          if (!targetId) {
            const cookieSession = getCookie("nextray_current_session");
            const found = loadedWithSlugs.find(s => s.chatId === cookieSession);
            if (found) targetId = found.chatId;
          }
          if (!targetId) targetId = loadedWithSlugs[0].chatId;
          setCurrentSessionId(targetId);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // 3b. Clean Path and Hash sync listener (ChatGpt routing sync)
  useEffect(() => {
    const handleLocationSync = () => {
      const pParts = window.location.pathname.split('/');
      const pSlug = (pParts[1] === 'chat' && pParts[2]) ? pParts[2] : '';
      const hash = window.location.hash;
      const hSlug = hash.startsWith('#/chat/') ? hash.replace('#/chat/', '') : '';
      
      const activeSlugStr = pSlug || hSlug;
      if (activeSlugStr) {
        const found = sessions.find(s => s.slug === activeSlugStr || s.chatId === activeSlugStr);
        if (found && found.chatId !== currentSessionId) {
          setCurrentSessionId(found.chatId);
        }
      }
    };

    window.addEventListener('hashchange', handleLocationSync);
    window.addEventListener('popstate', handleLocationSync);
    return () => {
      window.removeEventListener('hashchange', handleLocationSync);
      window.removeEventListener('popstate', handleLocationSync);
    };
  }, [sessions, currentSessionId]);

  // 3c. Synchronizer from Active chat ID state -> Browser URL Bar / PushState (ChatGPT modern URLs)
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const active = sessions.find(s => s.chatId === currentSessionId);
      if (active) {
        const activeSlug = active.slug || createSlug(active.title, active.chatId);
        
        // Modern URL path
        try {
          const nextURL = `/chat/${activeSlug}`;
          if (window.location.pathname !== nextURL) {
            window.history.pushState({ chatId: currentSessionId }, '', nextURL);
          }
        } catch (e) {
          console.warn("popState routing fallback");
        }
        
        // Legacy hash path
        const targetHash = `#/chat/${activeSlug}`;
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }

        // Cache persistent active cookie
        setCookie("nextray_current_session", currentSessionId, 7);
      }
    } else if (!currentSessionId) {
      if (window.location.hash.startsWith('#/chat/')) {
        window.location.hash = '';
      }
    }
  }, [currentSessionId, sessions]);

  // 4. Sync Messages belonging to selected Conversation Thread with SWR Caching
  useEffect(() => {
    if (!user || !currentSessionId) {
      setMessages([]);
      return;
    }

    // Capture model of current selected session to synchronize configuration dropdown
    const activeSession = sessions.find(s => s.chatId === currentSessionId);
    if (activeSession) {
      const isModelValid = AVAILABLE_MODELS.some(m => m.id === activeSession.model);
      setConfig(prev => ({
        ...prev,
        modelId: isModelValid ? activeSession.model : (AVAILABLE_MODELS[0]?.id || "deepseek-ai/deepseek-r1")
      }));
    }

    // A. PRE-HYDRATE MESSAGE BUBBLES FROM ACTIVE LOCAL CACHE
    const messagesCacheKey = `nextray_messages_cache_${currentSessionId}`;
    const cachedMsgsRaw = localStorage.getItem(messagesCacheKey);
    if (cachedMsgsRaw) {
      try {
        const cached = JSON.parse(cachedMsgsRaw);
        if (cached && cached.length > 0) {
          setMessages(cached);
        }
      } catch (e) {
        console.warn("Could not pre-hydrate active messages from cache:", e);
      }
    }

    if (isLocalFallback) {
      // LocalStorage Messages Loading
      const localMsgsRaw = localStorage.getItem(`nextray_msgs_${currentSessionId}`);
      const loaded: ChatMessage[] = localMsgsRaw ? JSON.parse(localMsgsRaw) : [];
      loaded.sort((a, b) => {
        const d1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const d2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return d1 - d2;
      });
      setMessages(loaded);
      localStorage.setItem(messagesCacheKey, JSON.stringify(loaded));
    } else {
      // Firestore Real-Time Query of subcollection messages - Safe in-memory sorting
      const path = `chats/${currentSessionId}/messages`;
      const messagesQuery = query(
        collection(db, "chats", currentSessionId, "messages")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const loaded: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          loaded.push(doc.data() as ChatMessage);
        });

        // Helper to safely parse dates that could be ISO string, JS Date, or Firestore Timestamp
        const parseDate = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'string') return new Date(val).getTime();
          if (val instanceof Date) return val.getTime();
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          if (typeof val.seconds === 'number') return val.seconds * 1000;
          return new Date(val).getTime();
        };

        // Sort ascending by createdAt in memory
        loaded.sort((a, b) => parseDate(a.createdAt) - parseDate(b.createdAt));

        setMessages(loaded);
        localStorage.setItem(messagesCacheKey, JSON.stringify(loaded));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });

      return () => unsubscribe();
    }
  }, [user, currentSessionId, sessions]);

  // Handle Google Popup Sign-in
  const handleLogin = async () => {
    const loggedUser = await signInWithGoogle();
    if (loggedUser) {
      const profile: UserProfile = {
        uid: loggedUser.uid,
        email: loggedUser.email || '',
        displayName: loggedUser.displayName || 'Authorized Explorer',
        photoURL: loggedUser.photoURL || null,
      };
      setUser(profile);
    }
  };

  // Handle Email & Password signup and login
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorAlert(null);
    setAuthLoading(true);

    if (!authEmail || !authPassword) {
      setAuthErrorAlert("Please enter both email and password.");
      setAuthLoading(false);
      return;
    }

    if (authMode === 'signup' && !authDisplayName) {
      setAuthErrorAlert("Please enter a display name for signup.");
      setAuthLoading(false);
      return;
    }

    if (authPassword.length < 6) {
      setAuthErrorAlert("Password must be at least 6 characters long.");
      setAuthLoading(false);
      return;
    }

    try {
      let loggedUser;
      if (authMode === 'signup') {
        loggedUser = await signUpEmail(authEmail, authPassword, authDisplayName);
      } else {
        loggedUser = await signInEmail(authEmail, authPassword);
      }

      if (loggedUser) {
        const profile: UserProfile = {
          uid: loggedUser.uid,
          email: loggedUser.email || '',
          displayName: loggedUser.displayName || authDisplayName || 'User Space',
          photoURL: loggedUser.photoURL || null,
        };
        setUser(profile);
        // Reset state variables
        setAuthEmail('');
        setAuthPassword('');
        setAuthDisplayName('');
        setAuthErrorAlert(null);
      }
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      let message = err.message || "An unexpected credentials error occurred.";
      if (message.includes("auth/invalid-credential") || message.includes("auth/user-not-found")) {
        message = "Incorrect email address or password. Please verify and retry.";
      } else if (message.includes("auth/email-already-in-use")) {
        message = "This email is already in use. Attempt to log in instead.";
      } else if (message.includes("auth/weak-password")) {
        message = "Password criteria not met. Please use at least 6 characters.";
      } else if (message.includes("auth/invalid-email")) {
        message = "The entered email address layout is invalid.";
      }
      setAuthErrorAlert(message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Google Log-out
  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([]);
  };

  // Create a new fresh thread
  const handleNewSession = async () => {
    if (!user) return;
    const newId = makeId();
    const serverSlug = await getServerSlug('New Conversation Thread', newId);
    const newSession: ChatSession = {
      chatId: newId,
      userId: user.uid,
      title: 'New Conversation Thread',
      model: config.modelId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slug: serverSlug
    };

    if (isLocalFallback) {
      const updated = [newSession, ...sessions];
      localStorage.setItem(`nextray_sessions_${user.uid}`, JSON.stringify(updated));
      setSessions(updated);
      setCurrentSessionId(newId);
    } else {
      const docPath = `chats/${newId}`;
      try {
        await setDoc(doc(db, "chats", newId), {
          ...newSession,
          // Mandatory server timestamp for rule consistency
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setCurrentSessionId(newId);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }
  };

  // Select a specific model
  const handleSelectModel = async (modelId: string) => {
    setConfig(prev => ({ ...prev, modelId }));
    
    if (!currentSessionId || !user) return;

    // Mutate existing thread model parameter
    const updatedSessions = sessions.map(s => {
      if (s.chatId === currentSessionId) {
        return { ...s, model: modelId, updatedAt: new Date().toISOString() };
      }
      return s;
    });

    if (isLocalFallback) {
      localStorage.setItem(`nextray_sessions_${user.uid}`, JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } else {
      const docPath = `chats/${currentSessionId}`;
      try {
        await setDoc(doc(db, "chats", currentSessionId), {
          model: modelId,
          updatedAt: new Date()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }
  };

  // Delete an entire chat session thread
  const handleDeleteSession = async (chatId: string) => {
    if (!user) return;

    const remaining = sessions.filter(s => s.chatId !== chatId);
    
    // Reset active cursor if we are deleting active thread
    if (currentSessionId === chatId) {
      setCurrentSessionId(remaining.length > 0 ? remaining[0].chatId : null);
    }

    if (isLocalFallback) {
      localStorage.setItem(`nextray_sessions_${user.uid}`, JSON.stringify(remaining));
      localStorage.removeItem(`nextray_msgs_${chatId}`);
      setSessions(remaining);
    } else {
      const docPath = `chats/${chatId}`;
      try {
        // Delete parent thread, security rules cascade deletion or block. 
        // We delete documents explicitly
        await deleteDoc(doc(db, "chats", chatId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }
  };

  // Main Prompt execution handle
  const handleSendMessage = async (
    text: string, 
    fileDataUrl?: string, 
    fileType?: string, 
    fileName?: string, 
    fileSize?: number,
    onChunk?: (accumulatedText: string) => void
  ) => {
    if (!user || isStreamLoading) return;

    let activeId = currentSessionId;

    // 1. If user doesn't have an active thread, auto-create one first! (Just like ChatGPT)
    if (!activeId) {
      const newId = makeId();
      const sTitle = text.substring(0, 36) + (text.length > 36 ? '...' : '');
      const serverSlug = await getServerSlug(sTitle, newId);
      const newSession: ChatSession = {
        chatId: newId,
        userId: user.uid,
        title: sTitle,
        model: config.modelId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slug: serverSlug
      };

      activeId = newId;

      if (isLocalFallback) {
        const updated = [newSession];
        localStorage.setItem(`nextray_sessions_${user.uid}`, JSON.stringify(updated));
        setSessions(updated);
        localStorage.setItem(`nextray_msgs_${newId}`, JSON.stringify([]));
        setCurrentSessionId(newId);
      } else {
        const docPath = `chats/${newId}`;
        try {
          await setDoc(doc(db, "chats", newId), {
            ...newSession,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setCurrentSessionId(newId);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, docPath);
          return;
        }
      }
    }

    // Assemble user message payload
    const userMessageId = makeId();
    const newUserMsg: ChatMessage = {
      messageId: userMessageId,
      chatId: activeId,
      userId: user.uid,
      role: 'user',
      content: text,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      fileData: fileDataUrl || null,
      createdAt: new Date().toISOString()
    };

    // Update state & store user message
    let combinedMsgs = [...messages, newUserMsg];
    setMessages(combinedMsgs);

    if (isLocalFallback) {
      localStorage.setItem(`nextray_msgs_${activeId}`, JSON.stringify(combinedMsgs));
    } else {
      const msgPath = `chats/${activeId}/messages/${userMessageId}`;
      try {
        await setDoc(doc(db, "chats", activeId, "messages", userMessageId), {
          ...newUserMsg,
          createdAt: new Date() // Server request time sync
        });
        
        // Update thread updatedAt metadata
        await setDoc(doc(db, "chats", activeId), {
          updatedAt: new Date()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, msgPath);
      }
    }

    // Set auto chat topic title if it is default template (after first user message)
    const thread = sessions.find(s => s.chatId === activeId);
    if (thread && thread.title === "New Conversation Thread") {
      const parsedTitle = text.length > 36 ? text.substring(0, 35) + "..." : text;
      const newSlug = await getServerSlug(parsedTitle, activeId);
      const updatedSess = sessions.map(s => {
        if (s.chatId === activeId) return { ...s, title: parsedTitle, slug: newSlug };
        return s;
      });
      setSessions(updatedSess);
      
      if (isLocalFallback) {
        localStorage.setItem(`nextray_sessions_${user.uid}`, JSON.stringify(updatedSess));
      } else {
        await setDoc(doc(db, "chats", activeId), { title: parsedTitle, slug: newSlug }, { merge: true });
      }
    }

    // 2. Start AI loading stream state
    setIsStreamLoading(true);

    const endpoint = "/api/chat/nvidia";

    // Setup temporary assistant shell
    const assistantMessageId = makeId();
    let accumulatedText = "";

    try {
      // Build context history to forward to model
      // Strip any extra prompt injections to keep payloads sane and compact
      const messageHistory = combinedMsgs.map(m => ({
        role: m.role,
        content: m.content,
        fileData: m.fileData,
        fileType: m.fileType
      }));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messageHistory,
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          modelId: config.modelId,
          customKey: customNvidiaKey
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Model gateway return code error";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || `HTTP Error ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Connection did not return streamable pipeline.");

      const decoder = new TextDecoder();
      let buffer = "";
      let lastUpdate = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const dataContent = trimmed.substring(5).trim();
            if (dataContent === "[DONE]") continue;

            const parsed = JSON.parse(dataContent);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              if (onChunk) {
                onChunk(accumulatedText);
              }
              
              const now = Date.now();
              // Live auto pop-up workbench as soon as slides or HTML template initiates
              const lowerText = accumulatedText.toLowerCase();
              if (lowerText.includes('slideshow_deck') || 
                  lowerText.includes('"slides"') || 
                  (lowerText.includes('```json') && lowerText.includes('"type"')) ||
                  lowerText.includes('```html')) {
                if (!isWorkbenchOpen) {
                  setIsWorkbenchOpen(true);
                }
              }

              // Update state at most every 80ms to prevent heavy React re-renders and key lagging
              if (now - lastUpdate > 80) {
                lastUpdate = now;
                setMessages(prev => {
                  const filtered = prev.filter(m => m.messageId !== assistantMessageId);
                  const streamedMsg: ChatMessage = {
                    messageId: assistantMessageId,
                    chatId: activeId!,
                    userId: user.uid,
                    role: 'assistant',
                    content: accumulatedText,
                    createdAt: new Date().toISOString()
                  };
                  return [...filtered, streamedMsg];
                });

                // Render compiled slides or HTML sandbox incremental code blocks on-the-fly!
                const dynamicRes = extractDecksAndHtml(accumulatedText);
                if (dynamicRes) {
                  if (dynamicRes.type === 'slides') {
                    window.dispatchEvent(new CustomEvent('update-slideshow-deck', { detail: dynamicRes.data }));
                  } else if (dynamicRes.type === 'html') {
                    window.dispatchEvent(new CustomEvent('update-html-sandbox', { detail: { code: dynamicRes.data } }));
                  }
                }
              }
            }
          }
        }
      }

      // Persist completed streamed message
      const completeAssistantMsg: ChatMessage = {
        messageId: assistantMessageId,
        chatId: activeId,
        userId: user.uid,
        role: 'assistant',
        content: accumulatedText || "No response received",
        createdAt: new Date().toISOString()
      };

      // Set complete message in local state before writing to firestore
      setMessages(prev => {
        const filtered = prev.filter(m => m.messageId !== assistantMessageId);
        return [...filtered, completeAssistantMsg];
      });

      if (isLocalFallback) {
        const localCurrentMsgsRaw = localStorage.getItem(`nextray_msgs_${activeId}`);
        const currentMsgsList = localCurrentMsgsRaw ? JSON.parse(localCurrentMsgsRaw) : [];
        const merged = [...currentMsgsList, completeAssistantMsg];
        localStorage.setItem(`nextray_msgs_${activeId}`, JSON.stringify(merged));
      } else {
        await setDoc(doc(db, "chats", activeId, "messages", assistantMessageId), {
          ...completeAssistantMsg,
          createdAt: new Date()
        });
      }

      // Automatically detect and load slideshow decks or HTML sandbox packages
      const updateResult = extractDecksAndHtml(accumulatedText);
      if (updateResult) {
        setIsWorkbenchOpen(true);
        setTimeout(() => {
          if (updateResult.type === 'slides') {
            window.dispatchEvent(new CustomEvent('update-slideshow-deck', { detail: updateResult.data }));
          } else if (updateResult.type === 'html') {
            window.dispatchEvent(new CustomEvent('update-html-sandbox', { detail: { code: updateResult.data } }));
          }
        }, 300);
      }

      return accumulatedText;

    } catch (err: any) {
      console.error("AI Completion error:", err);
      
      const errorMsg: ChatMessage = {
        messageId: assistantMessageId,
        chatId: activeId,
        userId: user.uid,
        role: 'assistant',
        content: `⚠️ **Exception Encountered**\n${err.message || "Connection to API gateway was interrupted. Please review server logs."}`,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => {
        const filtered = prev.filter(m => m.messageId !== assistantMessageId);
        return [...filtered, errorMsg];
      });

      return null;

    } finally {
      setIsStreamLoading(false);
    }
  };

  const activeModel = AVAILABLE_MODELS.find(m => m.id === config.modelId) || AVAILABLE_MODELS[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50/50 text-slate-800">
      
      {/* Sidebar navigation */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        user={user}
        onSelectSession={setCurrentSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLocal={isLocalFallback}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      {/* Primary chat workspace area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Unified sleek navigation and active session controls header */}
        <div className="h-14 px-4 border-b border-slate-100 bg-white flex items-center md:px-6 justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden md:flex p-2 rounded-lg text-slate-450 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 justify-center items-center cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeft className="h-4.5 w-4.5" />
              </button>
            )}

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <ModelSelector
              selectedModelId={config.modelId}
              onSelectModel={handleSelectModel}
            />

            {user && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono border-l border-slate-200 pl-3">
                <Clock className="h-3 w-3 text-emerald-500" />
                <span className="font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  T: {config.temperature}
                </span>
                <span className="font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 hidden md:inline">
                  M: {config.maxTokens}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all active:scale-[0.98] cursor-pointer"
                  title="Configure System prompt and keys"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden md:inline">Options</span>
                </button>

                <button
                  onClick={() => setIsVoicePanelOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    isVoicePanelOpen 
                      ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-md' 
                      : 'border-slate-200 text-slate-755 bg-white hover:bg-slate-50'
                  }`}
                  title="Toggle Natural Voice Companion"
                >
                  <Volume2 className={`h-3.5 w-3.5 ${isVoicePanelOpen ? 'text-white' : 'text-indigo-500'}`} />
                  <span>Voice Agent</span>
                </button>

                <button
                  onClick={() => setIsWorkbenchOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    isWorkbenchOpen 
                      ? 'bg-slate-900 border-slate-900 text-emerald-400 font-extrabold shadow-md' 
                      : 'border-slate-200 text-slate-755 bg-white hover:bg-slate-50'
                  }`}
                  title="Open Sandbox & Slides Deck Builder"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Workbench</span>
                </button>
              </>
            )}
            {!user && (
              <button
                onClick={handleLogin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              >
                <LogIn className="h-3.5 w-3.5 text-indigo-500" />
                <span>Sync with Google</span>
              </button>
            )}
          </div>
        </div>

        {user ? (
          <div className="flex-1 flex overflow-hidden min-h-0 relative select-text">
            <ChatArea
              messages={messages}
              currentModelId={config.modelId}
              config={config}
              onSendMessage={handleSendMessage}
              isStreamLoading={isStreamLoading}
              onOpenSettings={() => setIsSettingsOpen(true)}
              activeModel={activeModel}
              serverKeyConfigured={serverKeyConfigured}
              onQuickPrompt={(text) => handleSendMessage(text)}
            />
            {isVoicePanelOpen && (
              <VoiceAgentPanel
                isOpen={isVoicePanelOpen}
                onClose={() => setIsVoicePanelOpen(false)}
                onSendMessage={handleSendMessage}
                isStreamLoading={isStreamLoading}
                messages={messages}
              />
            )}
            {isWorkbenchOpen && (
              <InteractiveWorkbench
                onClose={() => setIsWorkbenchOpen(false)}
                onPasteToChat={(text) => handleSendMessage(text)}
              />
            )}
          </div>
        ) : (
          // Full-screen CTA Login and Signup Form
          <div className="flex-grow flex flex-col items-center justify-center p-6 bg-slate-50/50">
            <div className="max-w-md w-full p-8 bg-white border border-slate-205/80 rounded-2xl shadow-xl shadow-slate-100 space-y-6 animate-in zoom-in-95 duration-150">
              
              <div className="text-center space-y-2">
                <div className="mx-auto h-11 w-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/20 flex items-center justify-center shadow-md">
                  <img 
                    src="/icon-pwa.png" 
                    alt="Next Ray Logo" 
                    className="h-full w-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
                  Next Ray Space
                </h2>
                <p className="text-xs text-slate-400 font-normal leading-relaxed">
                  Authenticate your workspace account to access live Llama 3.3 and synchronised chat databases.
                </p>
              </div>

              {/* Login / Signup form switch */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthErrorAlert(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthErrorAlert(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Alert Display */}
              {authErrorAlert && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-650 font-medium leading-relaxed">
                  ⚠️ {authErrorAlert}
                </div>
              )}

              {/* Core Email Authentication Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-4 text-left">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 bg-slate-50/50"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 bg-slate-50/50"
                  />
                  {authMode === 'signup' && (
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Must be at least 6 characters.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-405 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  {authLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating credentials...
                    </span>
                  ) : authMode === 'login' ? (
                    'Sign In to Workspace'
                  ) : (
                    'Create Workspace Account'
                  )}
                </button>
              </form>

              {/* Alternate Row Split Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  or
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Secondary Google Login Control Button */}
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-705 font-semibold rounded-lg text-xs border border-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                <LogIn className="h-4 w-4 text-indigo-500" />
                <span>Sync instantly using Google</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const fakeUser = {
                      uid: "nextray-local-developer",
                      email: "guest@nextray.ai",
                      displayName: "Guest Explorer",
                      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    } as any;
                    localStorage.setItem("nextray_local_user", JSON.stringify(fakeUser));
                    setUser(fakeUser);
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold underline transition-colors cursor-pointer"
                >
                  Enter sandbox developer preview mode
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global settings drawer */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        customKey={customNvidiaKey}
        onChangeCustomKey={handleCustomKeyChange}
        serverKeyConfigured={serverKeyConfigured}
        customGeminiKey={customGeminiKey}
        onChangeCustomGeminiKey={handleCustomGeminiKeyChange}
      />
    </div>
  );
}
export { App };
