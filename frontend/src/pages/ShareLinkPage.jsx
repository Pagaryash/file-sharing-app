import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/config";
import { accessShareLink } from "../lib/files";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ShareLinkPage() {
  const { token } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await accessShareLink(token);
        setFile(res.file);
      } catch (e) {
        setErr(e?.response?.data?.message || "Invalid or expired link");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function onDownload() {
    window.open(`${API_BASE_URL}/api/share/${token}/download`, "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-600">
        Loading…
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <div className="text-red-700 text-sm">{err}</div>
          <button
            onClick={() => nav("/login")}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Shared File</h1>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="font-medium text-slate-900">{file.filename}</div>
          <div className="mt-1 text-xs text-slate-600">
            {file.mimeType} • {formatBytes(file.size)}
          </div>
        </div>

        <button
          onClick={onDownload}
          disabled={downloading}
          className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {downloading ? "Preparing download…" : "Download"}
        </button>
      </div>
    </div>
  );
}
