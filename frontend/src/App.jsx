import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ShareLinkPage from "./pages/ShareLinkPage";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { isLoggedIn } from "./lib/auth";
import ShareLink from "./pages/ShareLink";

function PrivateRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/share/:token" element={<ShareLink />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/share/:token" element={<ShareLinkPage />} />
      </Routes>
    </BrowserRouter>
  );
}
