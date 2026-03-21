import { useEffect, useState } from "react";
import "./App.css";
import ChatPanel from "./components/ChatPanel";
import ChatSidebar from "./components/ChatSidebar";
import DocumentPanel from "./components/DocumentPanel";
import StatusBar from "./components/StatusBar";
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

const STORAGE_KEY = "ragbot_chats";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function App() {
  const [chats, setChats] = useState<Chat[]>(() => loadChats());
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const saved = loadChats();
    return saved.length > 0 ? saved[0].id : genId();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

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
      // First message in a new chat — create the entry
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

export default App;
