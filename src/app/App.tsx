import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import PrivateRoute from "../features/auth/PrivateRoute";
import PublicRoute from "../features/auth/PublicRoute";
import LeadsPage from "../features/leads/LeadsPage";
import AddLeadPage from "../features/leads/AddLeadPage";
import LeadDetailPage from "../features/leads/LeadDetailPage";
import ContactsPage from "../features/contacts/ContactsPage";
import ContactDetailPage from "../features/contacts/ContactDetailPage";
import AnalyticsPage from "../features/analytics/AnalyticsPage";
import PipelinePage from "../features/leads/PipelinePage";
import SequencePage from "../features/sequence/SequencePage";
import SettingsPage from "../features/settings/SettingsPage";
import SessionsPage from "../features/sessions/SessionsPage";
import SessionPage from "../features/sessions/SessionPage";
import RunSessionPage from "../features/sessions/RunSessionPage";

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
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/sequence" element={<SequencePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/:id" element={<SessionPage />} />
        <Route path="/sessions/:id/run" element={<RunSessionPage />} />
      </Route>

      {/* Catch-all: redirect everything else to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
