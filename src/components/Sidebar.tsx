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
  X,
  PanelLeftClose
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
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
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
  isSidebarCollapsed,
  setIsSidebarCollapsed,
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
        fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-slate-50 border-r border-slate-200 text-slate-700 transition-all duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'md:hidden' : 'md:flex md:translate-x-0 md:static'}
      `}>
        {/* Sidebar Header with Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/icon-pwa.png" 
              alt="Next Ray Brand Logo" 
              className="h-8 w-8 rounded-lg object-contain bg-slate-900 border border-slate-700/20" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">
                Next Ray
              </h1>
              <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 font-semibold">
                Intelligence Platform
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-150"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Button: Create New Chat */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewSession();
              setIsSidebarOpen(false); // Close mobile drawer on selection
            }}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-100 hover:text-slate-900 text-slate-700 transition-colors shadow-xs active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>

        {/* Database Mode Badge */}
        <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Database className="h-3.5 w-3.5" />
            <span>State Sync</span>
          </div>
          {isLocal ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-600 border border-amber-200">
              LocalStorage
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Cloud Synced
            </span>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Recent Chats ({sessions.length})
          </span>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-350" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            sessions.map((session) => {
              const active = session.chatId === currentSessionId;
              return (
                <div
                  key={session.chatId}
                  className={`group relative flex items-center w-full rounded-lg text-left transition-all ${
                    active 
                      ? 'bg-slate-200/50 text-slate-800 font-medium' 
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <a
                    href={`#/chat/${session.slug || session.chatId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectSession(session.chatId);
                      setIsSidebarOpen(false); // Close mobile drawer on selection
                    }}
                    className="flex-1 flex flex-col justify-start items-start p-2.5 pr-10 text-left overflow-hidden rounded-lg cursor-pointer"
                  >
                    <span className="truncate w-full text-sm block">
                      {session.title || "Empty conversation"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {getModelLabel(session.model)}
                    </span>
                  </a>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.chatId);
                    }}
                    className={`absolute right-2 p-1.5 text-slate-450 hover:text-red-500 hover:bg-slate-200 rounded-md transition-all ${
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
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img 
                  src={user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                  alt={user.displayName || "Avatar"} 
                  className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-800 truncate leading-none mb-1">
                    {user.displayName || "Google Account"}
                  </p>
                  <p className="text-xs text-slate-450 truncate leading-none">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 text-xs font-semibold transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-semibold">Sync with Google Account</p>
                <p className="text-[10px] text-slate-400">Back up threads and synchronize cloud-wide</p>
              </div>
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-[0.98]"
              >
                <LogIn className="h-3.5 w-3.5 text-indigo-400" />
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
