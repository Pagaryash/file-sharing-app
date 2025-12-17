import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/config";
import { clearSession, getUser } from "../lib/auth";
import {
  getMyFiles,
  getSharedWithMe,
  uploadFile,
  createDownloadTicket,
  shareFile,
  createShareLink,
} from "../lib/files";

import Modal from "../components/Modal";

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

export default function Dashboard() {
  const nav = useNavigate();
  const user = getUser();

  // Tabs
  const [tab, setTab] = useState("mine"); // "mine" | "shared"

  // My files
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Shared files
  const [sharedFiles, setSharedFiles] = useState([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedErr, setSharedErr] = useState("");

  // Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // Share modal (email)
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState("");
  const [shareFilename, setShareFilename] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  // Share link modal
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkFileId, setLinkFileId] = useState("");
  const [linkFilename, setLinkFilename] = useState("");
  const [expiresMinutes, setExpiresMinutes] = useState("");
  const [linkResult, setLinkResult] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMsg, setLinkMsg] = useState("");

  async function loadMine() {
    setErr("");
    setLoading(true);
    try {
      const data = await getMyFiles();
      setFiles(data.files || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  async function loadShared() {
    setSharedErr("");
    setSharedLoading(true);
    try {
      const data = await getSharedWithMe();
      setSharedFiles(data.files || []);
    } catch (e) {
      setSharedErr(e?.response?.data?.message || "Failed to load shared files");
    } finally {
      setSharedLoading(false);
    }
  }

  useEffect(() => {
    loadMine();
  }, []);

  useEffect(() => {
    if (tab === "shared") loadShared();
  }, [tab]);

  async function onUpload() {
    if (!selectedFile) {
      setUploadMsg("Please choose a file first.");
      return;
    }

    setUploadMsg("");
    setUploading(true);

    try {
      await uploadFile(selectedFile);
      setUploadMsg("Upload successful");
      setSelectedFile(null);
      await loadMine();
    } catch (e) {
      setUploadMsg(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function openDownload(fileId) {
    const newTab = window.open("about:blank", "_blank");
    try {
      const data = await createDownloadTicket(fileId);
      if (!newTab) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
      }
      newTab.opener = null;
      newTab.location.href = `${API_BASE_URL}${data.url}`;
    } catch (e) {
      if (newTab) newTab.close();
      alert(
        e?.response?.data?.message || "Could not open file. Please try again."
      );
    }
  }

  // Share by email
  function openShareModal(file) {
    setShareFileId(file._id);
    setShareFilename(file.filename);
    setEmailsText("");
    setShareMsg("");
    setShareOpen(true);
  }

  function closeShareModal() {
    if (shareLoading) return;
    setShareOpen(false);
  }

  async function onShareSubmit(e) {
    e.preventDefault();
    setShareMsg("");

    const emails = emailsText
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    if (emails.length === 0) {
      setShareMsg("Please enter at least one email.");
      return;
    }

    setShareLoading(true);
    try {
      const data = await shareFile(shareFileId, emails);
      setShareMsg(
        `Shared with: ${data.sharedWith?.join(", ") || "user(s)"} ✅`
      );
      await loadMine();
      setTimeout(() => setShareOpen(false), 500);
    } catch (err) {
      setShareMsg(err?.response?.data?.message || "Share failed");
    } finally {
      setShareLoading(false);
    }
  }

  // Share link
  function openLinkModal(file) {
    setLinkFileId(file._id);
    setLinkFilename(file.filename);
    setExpiresMinutes("");
    setLinkResult(null);
    setLinkMsg("");
    setLinkOpen(true);
  }

  function closeLinkModal() {
    if (linkLoading) return;
    setLinkOpen(false);
  }

  async function onCreateLink(e) {
    e.preventDefault();
    setLinkMsg("");
    setLinkLoading(true);

    try {
      const mins =
        expiresMinutes.trim() === "" ? undefined : Number(expiresMinutes);
      const data = await createShareLink(linkFileId, mins);
      setLinkResult(`${window.location.origin}/share/${data.token}`);
      setLinkMsg("Link created ");
    } catch (e) {
      setLinkMsg(e?.response?.data?.message || "Failed to create link");
    } finally {
      setLinkLoading(false);
    }
  }

  async function copyLink() {
    if (!linkResult) return;
    await navigator.clipboard.writeText(linkResult);
    setLinkMsg("Link copied");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Logged in as{" "}
              <span className="font-medium text-slate-900">{user?.email}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => (tab === "mine" ? loadMine() : loadShared())}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                clearSession();
                nav("/login");
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 px-4 py-3 text-sm font-semibold ${
              tab === "mine"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            My Files
          </button>
          <button
            onClick={() => setTab("shared")}
            className={`flex-1 px-4 py-3 text-sm font-semibold ${
              tab === "shared"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Shared With Me
          </button>
        </div>

        {/* TAB: MY FILES */}
        {tab === "mine" ? (
          <>
            {/* Upload Card */}
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Upload
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Upload PDFs, images, or CSV files.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="block">
                    <input
                      type="file"
                      className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-slate-200"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  <button
                    onClick={onUpload}
                    disabled={!selectedFile || uploading}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>

              {selectedFile ? (
                <div className="mt-3 text-sm text-slate-700">
                  Selected:{" "}
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              ) : null}

              {uploadMsg ? (
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200">
                  {uploadMsg}
                </div>
              ) : null}
            </div>

            {/* My Files Card */}
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  My Files
                </h2>
                <span className="text-sm text-slate-600">
                  {loading ? "Loading..." : `${files.length} file(s)`}
                </span>
              </div>

              {err ? (
                <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                  {err}
                </div>
              ) : null}

              {loading ? (
                <div className="mt-4 text-sm text-slate-600">
                  Fetching your files…
                </div>
              ) : files.length === 0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-700 ring-1 ring-slate-200">
                  No files yet. Upload your first file to see it here.
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="mt-4 space-y-3 sm:hidden">
                    {files.map((f) => (
                      <div
                        key={f._id}
                        className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
                      >
                        <div className="font-medium text-slate-900">
                          {f.filename}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {f.mimeType} • {formatBytes(f.size)}
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          Uploaded:{" "}
                          {new Date(
                            f.createdAt || f.uploadedAt
                          ).toLocaleString()}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <button
                            onClick={() => openDownload(f._id)}
                            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Download
                          </button>

                          <button
                            onClick={() => openShareModal(f)}
                            className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                          >
                            Share
                          </button>

                          <button
                            onClick={() => openLinkModal(f)}
                            className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                          >
                            Create Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="mt-4 hidden overflow-x-auto sm:block">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase text-slate-500">
                        <tr className="border-b border-slate-200">
                          <th className="py-3 pr-4">File</th>
                          <th className="py-3 pr-4">Type</th>
                          <th className="py-3 pr-4">Size</th>
                          <th className="py-3 pr-4">Uploaded</th>
                          <th className="py-3 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {files.map((f) => (
                          <tr key={f._id} className="border-b border-slate-100">
                            <td className="py-3 pr-4 font-medium text-slate-900">
                              {f.filename}
                            </td>
                            <td className="py-3 pr-4 text-slate-700">
                              {f.mimeType}
                            </td>
                            <td className="py-3 pr-4 text-slate-700">
                              {formatBytes(f.size)}
                            </td>
                            <td className="py-3 pr-4 text-slate-700">
                              {new Date(
                                f.createdAt || f.uploadedAt
                              ).toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openDownload(f._id)}
                                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                >
                                  Download
                                </button>

                                <button
                                  onClick={() => openShareModal(f)}
                                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                                >
                                  Share
                                </button>

                                <button
                                  onClick={() => openLinkModal(f)}
                                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                                >
                                  Link
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* TAB: SHARED WITH ME */
          <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Shared With Me
              </h2>
              <span className="text-sm text-slate-600">
                {sharedLoading ? "Loading..." : `${sharedFiles.length} file(s)`}
              </span>
            </div>

            {sharedErr ? (
              <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {sharedErr}
              </div>
            ) : null}

            {sharedLoading ? (
              <div className="mt-4 text-sm text-slate-600">
                Fetching shared files…
              </div>
            ) : sharedFiles.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-700 ring-1 ring-slate-200">
                No files shared with you yet.
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="mt-4 space-y-3 sm:hidden">
                  {sharedFiles.map((f) => (
                    <div
                      key={f._id}
                      className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
                    >
                      <div className="font-medium text-slate-900">
                        {f.filename}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {f.mimeType} • {formatBytes(f.size)}
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        Uploaded:{" "}
                        {new Date(f.createdAt || f.uploadedAt).toLocaleString()}
                      </div>

                      <button
                        onClick={() => openDownload(f._id)}
                        className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="mt-4 hidden overflow-x-auto sm:block">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="py-3 pr-4">File</th>
                        <th className="py-3 pr-4">Type</th>
                        <th className="py-3 pr-4">Size</th>
                        <th className="py-3 pr-4">Uploaded</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedFiles.map((f) => (
                        <tr key={f._id} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-medium text-slate-900">
                            {f.filename}
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            {f.mimeType}
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            {formatBytes(f.size)}
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            {new Date(
                              f.createdAt || f.uploadedAt
                            ).toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => openDownload(f._id)}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Share Modal (email) */}
        <Modal
          open={shareOpen}
          title={`Share: ${shareFilename}`}
          onClose={closeShareModal}
        >
          <form onSubmit={onShareSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Emails (comma separated)
              </label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                rows={3}
                placeholder="user2@test.com, user3@test.com"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-600">
                Only registered users can be shared with.
              </p>
            </div>

            {shareMsg ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200">
                {shareMsg}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeShareModal}
                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={shareLoading}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {shareLoading ? "Sharing..." : "Share"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Share Link Modal */}
        <Modal
          open={linkOpen}
          title={`Create Link: ${linkFilename}`}
          onClose={closeLinkModal}
        >
          <form onSubmit={onCreateLink} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Expiry (minutes – optional)
              </label>
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="e.g. 60"
                value={expiresMinutes}
                onChange={(e) => setExpiresMinutes(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-600">
                Leave empty for no expiry.
              </p>
            </div>

            {linkResult ? (
              <div className="space-y-2">
                <div className="break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200">
                  {linkResult}
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Copy Link
                </button>
              </div>
            ) : null}

            {linkMsg ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200">
                {linkMsg}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeLinkModal}
                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Close
              </button>

              {!linkResult ? (
                <button
                  disabled={linkLoading}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {linkLoading ? "Creating..." : "Create Link"}
                </button>
              ) : null}
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
