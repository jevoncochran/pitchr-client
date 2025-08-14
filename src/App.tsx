import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

export default App;
