import { useEffect, useState } from "react";
import "./App.css";
import ChatPanel from "./components/ChatPanel";
import ChatSidebar from "./components/ChatSidebar";
import DocumentPanel from "./components/DocumentPanel";
import StatusBar from "./components/StatusBar";
import LoginPage from "./components/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Source } from "./api";

export interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function storageKey(userId: string) {
  return `ragbot_chats_${userId}`;
}

function loadChats(userId: string): Chat[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function AppInner() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return <AppMain userId={user.userId} />;
}

function AppMain({ userId }: { userId: string }) {
  const [chats, setChats] = useState<Chat[]>(() => loadChats(userId));
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const saved = loadChats(userId);
    return saved.length > 0 ? saved[0].id : genId();
  });

  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(chats));
  }, [chats, userId]);

  const activeMessages = chats.find((c) => c.id === activeChatId)?.messages ?? [];

  const newChat = () => {
    setActiveChatId(genId());
  };

  const updateMessages = (messages: Message[]) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.id === activeChatId);
      if (existing) {
        return prev.map((c) =>
          c.id === activeChatId ? { ...c, messages } : c
        );
      }
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser ? firstUser.text.slice(0, 40) : "New Chat";
      return [{ id: activeChatId, title, messages, createdAt: Date.now() }, ...prev];
    });
  };

  return (
    <div className="app">
      <StatusBar />
      <div className="main-layout">
        <div className="left-col">
          <DocumentPanel />
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            onNewChat={newChat}
            onSelectChat={setActiveChatId}
          />
        </div>
        <ChatPanel
          key={activeChatId}
          messages={activeMessages}
          onMessagesChange={updateMessages}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
