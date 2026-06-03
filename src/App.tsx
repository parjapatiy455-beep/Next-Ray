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
  CpuIcon
} from 'lucide-react';

import { 
  auth, 
  db, 
  isLocalFallback, 
  signInWithGoogle, 
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
import { AVAILABLE_MODELS } from './lib/models';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [serverKeyConfigured, setServerKeyConfigured] = useState(false);
  
  // Custom API key entered by user in settings panel
  const [customNvidiaKey, setCustomNvidiaKey] = useState<string>(() => {
    return localStorage.getItem('nextray_custom_nvidia_key') || '';
  });

  // Sidebar settings
  const [config, setConfig] = useState<ChatConfig>({
    modelId: 'deepseek-ai/deepseek-r1',
    systemInstruction: 'You are Next Ray, an advanced and elegant AI companion with deep helpful logic structures. Match user parameters, provide clean documentation, code cleanly, and structure replies perfectly with markdown.',
    temperature: 0.7,
    maxTokens: 2048,
  });

  // Unique identifier generator
  const makeId = () => {
    return 'nr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
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

  // 3. Sync Conversations (Chats list)
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      return;
    }

    if (isLocalFallback) {
      // Load sessions from LocalStorage
      const localSessionsRaw = localStorage.getItem(`nextray_sessions_${user.uid}`);
      const loaded: ChatSession[] = localSessionsRaw ? JSON.parse(localSessionsRaw) : [];
      // Sort descending by updatedAt
      loaded.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSessions(loaded);
      if (loaded.length > 0 && !currentSessionId) {
        setCurrentSessionId(loaded[0].chatId);
      }
    } else {
      // Firestore Live Query
      const path = 'chats';
      const chatsQuery = query(
        collection(db, "chats"),
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc")
      );

      const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const loaded: ChatSession[] = [];
        snapshot.forEach((doc) => {
          loaded.push(doc.data() as ChatSession);
        });
        setSessions(loaded);
        if (loaded.length > 0 && !currentSessionId) {
          setCurrentSessionId(loaded[0].chatId);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // 4. Sync Messages belonging to selected Conversation Thread
  useEffect(() => {
    if (!user || !currentSessionId) {
      setMessages([]);
      return;
    }

    // Capture model of current selected session to synchronize configuration dropdown
    const activeSession = sessions.find(s => s.chatId === currentSessionId);
    if (activeSession) {
      setConfig(prev => ({
        ...prev,
        modelId: activeSession.model
      }));
    }

    if (isLocalFallback) {
      // LocalStorage Messages Loading
      const localMsgsRaw = localStorage.getItem(`nextray_msgs_${currentSessionId}`);
      const loaded: ChatMessage[] = localMsgsRaw ? JSON.parse(localMsgsRaw) : [];
      loaded.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(loaded);
    } else {
      // Firestore Real-Time Query of subcollection messages
      const path = `chats/${currentSessionId}/messages`;
      const messagesQuery = query(
        collection(db, "chats", currentSessionId, "messages"),
        orderBy("createdAt", "asc")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const loaded: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          loaded.push(doc.data() as ChatMessage);
        });
        setMessages(loaded);
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
    const newSession: ChatSession = {
      chatId: newId,
      userId: user.uid,
      title: 'New Conversation Thread',
      model: config.modelId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    fileSize?: number
  ) => {
    if (!user || isStreamLoading) return;

    let activeId = currentSessionId;

    // 1. If user doesn't have an active thread, auto-create one first! (Just like ChatGPT)
    if (!activeId) {
      const newId = makeId();
      const newSession: ChatSession = {
        chatId: newId,
        userId: user.uid,
        title: text.substring(0, 36) + (text.length > 36 ? '...' : ''),
        model: config.modelId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      const updatedSess = sessions.map(s => {
        if (s.chatId === activeId) return { ...s, title: parsedTitle };
        return s;
      });
      setSessions(updatedSess);
      
      if (isLocalFallback) {
        localStorage.setItem(`nextray_sessions_${user.uid}`, JSON.stringify(updatedSess));
      } else {
        await setDoc(doc(db, "chats", activeId), { title: parsedTitle }, { merge: true });
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
              
              // Incrementally update UI with streamed text tokens!
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
      />

      {/* Primary chat workspace area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Navigation control header bar for responsive toggle & model selection */}
        <div className="h-16 px-6 border-b border-slate-100 bg-white flex items-center gap-3 shadow-xs">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200"
          >
            <Menu className="h-5 w-5" />
          </button>

          <ModelSelector
            selectedModelId={config.modelId}
            onSelectModel={handleSelectModel}
          />

          <div className="ml-auto flex items-center gap-2">
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
        ) : (
          // Full-screen CTA Login overlay in light off-white slate style
          <div className="flex-grow flex flex-col items-center justify-center p-6 bg-slate-50/30">
            <div className="max-w-md w-full p-8 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-150">
              <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Cpu className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
                  Next Ray Space
                </h2>
                <p className="text-sm text-slate-500 font-normal leading-relaxed">
                  Sign in with your Google account to initialize conversation paths with live NVIDIA cloud compute models in the workspace.
                </p>
              </div>

              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <LogIn className="h-4 w-4 text-indigo-400" />
                <span>Authorize with Google Account</span>
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    // Start in local developer preview mode immediately
                    const fakeUser = {
                      uid: "nextray-local-developer",
                      email: "guest@nextray.ai",
                      displayName: "Guest Explorer",
                      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    } as any;
                    localStorage.setItem("nextray_local_user", JSON.stringify(fakeUser));
                    setUser(fakeUser);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold underline transition-colors cursor-pointer"
                >
                  Enter sandbox developer workspace
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
      />
    </div>
  );
}
export { App };
