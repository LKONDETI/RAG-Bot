import { useEffect, useRef, useState } from "react";
import { Document, deleteDocument, ingestUrl, listDocuments, uploadDocument } from "../api";

export default function DocumentPanel() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => listDocuments().then(setDocs).catch(() => {});

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
      await refresh();
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleIngestUrl = async () => {
    if (!urlInput.trim()) return;
    setIngesting(true);
    setError(null);
    try {
      await ingestUrl(urlInput.trim());
      await refresh();
      setUrlInput("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIngesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      <h2>Documents</h2>

      <div className="upload-row">
        <input ref={fileRef} type="file" accept=".pdf,.txt" />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      <div className="upload-row" style={{ marginTop: "8px" }}>
        <input
          type="url"
          placeholder="Paste a URL to ingest…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleIngestUrl()}
          style={{ flex: 1 }}
        />
        <button onClick={handleIngestUrl} disabled={ingesting || !urlInput.trim()}>
          {ingesting ? "Loading…" : "Add URL"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      <ul className="doc-list">
        {docs.map((doc) => (
          <li key={doc.id}>
            <span>{doc.filename}</span>
            <button className="delete-btn" onClick={() => handleDelete(doc.id)}>
              Delete
            </button>
          </li>
        ))}
        {docs.length === 0 && <li className="empty">No documents uploaded yet.</li>}
      </ul>
    </div>
  );
}
