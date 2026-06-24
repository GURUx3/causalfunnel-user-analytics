import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import HeatmapPage from './pages/HeatmapPage';
import SessionDetailPage from './pages/SessionDetailPage';
import SessionsPage from './pages/SessionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <DashboardLayout title="Sessions" subtitle="Monitor user activity across your site" />
          }
        >
          <Route index element={<SessionsPage />} />
        </Route>

        <Route
          element={
            <DashboardLayout
              title="Session Details"
              subtitle="View the complete user journey"
            />
          }
        >
          <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
        </Route>

        <Route
          element={
            <DashboardLayout title="Heatmap" subtitle="Analyze click patterns by page" />
          }
        >
          <Route path="heatmap" element={<HeatmapPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
