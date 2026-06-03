import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  LogIn, 
  Database, 
  Sparkles, 
  Cpu,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import { AVAILABLE_MODELS } from '../lib/models';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  user: UserProfile | null;
  onSelectSession: (chatId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (chatId: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  isLocal: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  user,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onLogin,
  onLogout,
  isLocal,
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  // Find model logo/badge
  const getModelLabel = (modelId: string) => {
    const found = AVAILABLE_MODELS.find(m => m.id === modelId);
    return found ? found.name : "Next Model";
  };

  return (
    <>
      {/* Mobile background overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-gray-950 border-r border-gray-900 text-gray-200 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex
      `}>
        {/* Sidebar Header with Brand */}
        <div className="p-4 border-b border-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Next Ray
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-mono text-cyan-400 font-semibold">
                AI Platform v2.5
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Button: Create New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              setIsSidebarOpen(false); // Close mobile drawer on selection
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium text-sm transition-all shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Chat Thread
          </button>
        </div>

        {/* Database Mode Badge */}
        <div className="px-4 py-2 border-b border-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Database className="h-3.5 w-3.5" />
            <span>State Sync:</span>
          </div>
          {isLocal ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              LocalStorage
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Firebase Synced
            </span>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          <span className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
            Chat Threads ({sessions.length})
          </span>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-800" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            sessions.map((session) => {
              const active = session.chatId === currentSessionId;
              return (
                <div
                  key={session.chatId}
                  className={`group relative flex items-center w-full rounded-xl text-left transition-all ${
                    active 
                      ? 'bg-gradient-to-r from-gray-900 to-gray-950 border border-gray-800 text-white font-medium shadow-inner' 
                      : 'hover:bg-gray-900/60 text-gray-300 hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectSession(session.chatId);
                      setIsSidebarOpen(false); // Close mobile drawer on selection
                    }}
                    className="flex-1 flex flex-col justify-start items-start p-3 pr-10 text-left overflow-hidden rounded-xl"
                  >
                    <span className="truncate w-full text-sm block">
                      {session.title || "Empty conversation"}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                      {getModelLabel(session.model)}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.chatId);
                    }}
                    className={`absolute right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800/80 rounded-lg transition-all ${
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Delete Thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User profile footer section */}
        <div className="p-4 border-t border-gray-900 bg-gray-950/80">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img 
                  src={user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                  alt={user.displayName || "Avatar"} 
                  className="h-9 w-9 rounded-full object-cover border border-gray-700 shadow-inner"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.displayName || "Google Account"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 hover:bg-gray-900/85 text-gray-400 hover:text-white rounded-lg border border-gray-900 text-xs font-medium transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-gray-300 font-medium">Sync with Google Account</p>
                <p className="text-[11px] text-gray-500">Back up threads and synchronize cloud-wide</p>
              </div>
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl border border-gray-850 text-xs font-semibold transition-all shadow active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4 text-cyan-400" />
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
export { Sidebar };
