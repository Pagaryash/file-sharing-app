import { api } from "./api";
import { API_BASE_URL } from "./config";
import { getToken } from "./auth";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
export async function getMyFiles() {
  const res = await api.get("/api/files/mine");
  return res.data; // { files: [...] }
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post("/api/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data; // { message, file }
}

export async function createDownloadTicket(fileId) {
  const res = await api.post(`/api/files/${fileId}/download-ticket`);
  return res.data; // { ticket, url, expiresAt }
}

export async function shareFile(fileId, emails) {
  const res = await api.post(`/api/files/${fileId}/share`, { emails });
  return res.data; // { message, sharedWith, fileId }
}

export async function getSharedWithMe() {
  const res = await api.get("/api/files/shared-with-me");
  return res.data; // { files: [...] }
}

export async function createShareLink(fileId, expiresInMinutes) {
  const body = {};
  if (expiresInMinutes !== undefined) body.expiresInMinutes = expiresInMinutes;

  const res = await api.post(`/api/files/${fileId}/share-link`, body);
  return res.data; // { shareUrl, token, expiresAt }
}

export async function accessShareLink(token) {
  const res = await api.get(`/api/share/${token}`);
  return res.data; // { file, downloadUrl }
}
