import { Chat } from "../App";

interface Props {
  chats: Chat[];
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

export default function ChatSidebar({ chats, activeChatId, onNewChat, onSelectChat }: Props) {
  return (
    <div className="panel chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>Chats</h2>
        <button className="new-chat-btn" onClick={onNewChat}>+ New</button>
      </div>
      <ul className="chat-list">
        {chats.length === 0 && (
          <li className="chat-list-empty">No saved chats yet</li>
        )}
        {chats.map((chat) => (
          <li
            key={chat.id}
            className={`chat-list-item ${chat.id === activeChatId ? "active" : ""}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <span className="chat-title">{chat.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
