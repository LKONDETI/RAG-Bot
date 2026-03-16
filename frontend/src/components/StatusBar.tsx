import { useEffect, useState } from "react";
import { checkHealth } from "../api";

export default function StatusBar() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => checkHealth().then(setOnline);
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  if (online === null) return <div className="status-bar">Checking backend…</div>;

  return (
    <div className={`status-bar ${online ? "status-online" : "status-offline"}`}>
      {online ? "Backend online" : "Backend offline"}
    </div>
  );
}
