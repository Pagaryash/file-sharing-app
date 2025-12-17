import { api } from "./api";

export async function login(email, password) {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
}

export async function signup(name, email, password) {
  const res = await api.post("/api/auth/register", { name, email, password });
  return res.data;
}

export function saveSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}
