import "./App.css";
import ChatPanel from "./components/ChatPanel";
import DocumentPanel from "./components/DocumentPanel";
import StatusBar from "./components/StatusBar";

function App() {
  return (
    <div className="app">
      <StatusBar />
      <div className="main-layout">
        <DocumentPanel />
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
