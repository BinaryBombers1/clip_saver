import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import Landing from "./pages/Landing";
import Brief from "./pages/Brief";
import Login from "./pages/Login";
import Experience from "./pages/Experience";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import Dossier from "./pages/Dossier";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/brief" element={<Brief />} />
      <Route path="/login" element={<Login />} />
      <Route path="/e/:token" element={<Experience />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/sessions" element={<Sessions />} />
        <Route path="/dashboard/sessions/:token" element={<Dossier />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
