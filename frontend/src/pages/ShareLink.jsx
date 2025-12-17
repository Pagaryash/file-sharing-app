import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/config";
import { accessShareLink } from "../lib/files";

export default function ShareLink() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await accessShareLink(token);
        setData(res);
      } catch (e) {
        setErr(e?.response?.data?.message || "Invalid or expired link");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center text-slate-600">
        Loading…
      </div>
    );

  if (err)
    return (
      <div className="min-h-screen grid place-items-center text-red-600">
        {err}
      </div>
    );

  const { file, downloadUrl } = data;

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">Shared File</h1>

        <div className="mt-3 text-sm text-slate-700">
          <p className="font-medium">{file.filename}</p>
          <p className="mt-1 text-xs text-slate-600">
            {file.mimeType} • {file.size} bytes
          </p>
        </div>

        <a
          href={`${API_BASE_URL}${downloadUrl}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block w-full rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
        >
          Download
        </a>
      </div>
    </div>
  );
}
