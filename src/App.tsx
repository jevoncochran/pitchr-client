import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import LeadsPage from "./pages/LeadsPage";
import AddLeadPage from "./pages/AddLeadPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PipelinePage from "./pages/PipelinePage";
import SequencePage from "./pages/SequencePage";

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/add-lead" element={<AddLeadPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/sequence" element={<SequencePage />} />
      </Route>

      {/* Catch-all: redirect everything else to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
