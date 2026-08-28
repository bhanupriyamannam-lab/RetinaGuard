import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineProvider } from './context/OfflineContext';
import { DemoProvider } from './context/DemoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { NewScreening } from './pages/NewScreening';
import { AIAnalysisView } from './pages/AIAnalysisView';
import { ExplainableAIView } from './pages/ExplainableAIView';
import { Patient360 } from './pages/Patient360';
import { RetinalComparison } from './pages/RetinalComparison';
import { TriageQueue } from './pages/TriageQueue';
import { ReferralCenter } from './pages/ReferralCenter';
import { FollowUpRadar } from './pages/FollowUpRadar';
import { AnalyticsView } from './pages/AnalyticsView';
import { HealthCampMode } from './pages/HealthCampMode';
import { OfflineSyncView } from './pages/OfflineSyncView';
import { PatientReportView } from './pages/PatientReportView';
import { SettingsView } from './pages/SettingsView';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <OfflineProvider>
            <DemoProvider>
              <ToastProvider>
                <Routes>
                  {/* Public Login Route */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Authenticated Application Routes */}
                  <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<OverviewDashboard />} />
                    <Route path="/screening" element={<NewScreening />} />
                    <Route path="/ai-analysis" element={<AIAnalysisView />} />
                    <Route path="/explainable-ai" element={<ExplainableAIView />} />
                    <Route path="/patients/:patientId" element={<Patient360 />} />
                    <Route path="/compare" element={<RetinalComparison />} />
                    <Route path="/triage" element={<TriageQueue />} />
                    <Route path="/referrals" element={<ReferralCenter />} />
                    <Route path="/follow-ups" element={<FollowUpRadar />} />
                    <Route path="/analytics" element={<AnalyticsView />} />
                    <Route path="/health-camp" element={<HealthCampMode />} />
                    <Route path="/offline" element={<OfflineSyncView />} />
                    <Route path="/patient-report" element={<PatientReportView />} />
                    <Route path="/settings" element={<SettingsView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </ToastProvider>
            </DemoProvider>
          </OfflineProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
