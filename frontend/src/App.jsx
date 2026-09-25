import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ProcessingPipeline from './components/ProcessingPipeline';
import CandidateSelector from './components/CandidateSelector';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import AuthPage from './pages/AuthPage';
import { useAnalysis } from './hooks/useAnalysis';
import { AuthProvider, useAuth } from './hooks/useAuthContext';

import MobileBottomNav from './components/MobileBottomNav';
import CameraCaptureModal from './components/CameraCaptureModal';

/**
 * Protected wrapper — redirects to /auth if not authenticated.
 */
function ProtectedApp() {
  const { authenticated, user, logOut } = useAuth();

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <MainApp user={user} onLogOut={logOut} />;
}

/**
 * Main application (original App logic, unchanged).
 */
function MainApp({ user, onLogOut }) {
  const {
    status,
    currentStep,
    steps,
    data,
    error,
    preview,
    activeQuery,
    startAnalysis,
    analyzeQuery,
    reset,
    selectCandidate,
    showDemoReport,
  } = useAnalysis();

  const [activeNavTab, setActiveNavTab] = useState('Home');
  const [reportSubTab, setReportSubTab] = useState('Overview');
  const [demoAnalyzing, setDemoAnalyzing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Handle header navigation
  const handleNavigate = (tab) => {
    setActiveNavTab(tab);
    if (tab === 'Home') {
      setDemoAnalyzing(false);
      reset();
    } else if (tab === 'Reviews') {
      setDemoAnalyzing(false);
      setReportSubTab('Reviews');
      if (!data) showDemoReport();
    } else if (tab === 'Compare') {
      setDemoAnalyzing(false);
      setReportSubTab('Price Comparison');
      if (!data) showDemoReport();
    } else if (tab === 'Insights') {
      setDemoAnalyzing(false);
      setReportSubTab('AI Insights');
      if (!data) showDemoReport();
    } else if (tab === 'About') {
      setActiveNavTab('Home');
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    }
  };

  // Handle search query
  const handleSearch = (query) => {
    setDemoAnalyzing(false);
    if (query && typeof query === 'string' && query.trim()) {
      analyzeQuery(query.trim());
      setActiveNavTab('Reviews');
      setReportSubTab('Overview');
    } else if (!data) {
      showDemoReport();
      setActiveNavTab('Reviews');
      setReportSubTab('Overview');
    }
  };

  return (
    <>
      <Header
        activeTab={activeNavTab}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onUploadImage={startAnalysis}
        onOpenCamera={() => setIsCameraOpen(true)}
        user={user}
        onLogOut={onLogOut}
      />

      {/* Processing State — Dedicated Analyzing Dashboard */}
      {(status === 'processing' || demoAnalyzing) && (
        <ProcessingPipeline
          currentStep={currentStep}
          steps={steps}
          preview={preview}
          activeQuery={activeQuery}
          onCancel={() => {
            setDemoAnalyzing(false);
            reset();
          }}
        />
      )}

      {/* Home Page (idle state and activeNavTab === 'Home') */}
      {status === 'idle' && !demoAnalyzing && activeNavTab === 'Home' && (
        <HomePage
          onUpload={startAnalysis}
          onOpenCamera={() => setIsCameraOpen(true)}
          onTestAnalyzing={() => setDemoAnalyzing(true)}
          onViewReviews={() => handleNavigate('Reviews')}
          onSearch={handleSearch}
          isProcessing={false}
        />
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="error-state">
          <div className="icon">❌</div>
          <h3>Analysis Failed</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={reset} style={{ marginTop: 20 }}>
            Try Again
          </button>
        </div>
      )}

      {/* Not Found State */}
      {status === 'not_found' && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>Product Not Found</h3>
          <p>{error || 'Unable to identify this product. Try uploading a clearer image showing the front and product name/model.'}</p>
          <button className="btn-primary" onClick={reset} style={{ marginTop: 20 }}>
            Upload Another Image
          </button>
        </div>
      )}

      {/* Ambiguous — Show Modern Candidates Grid */}
      {status === 'ambiguous' && data && (
        <CandidateSelector
          candidates={data.candidates || data.match?.all_candidates}
          onSelect={(index, candidate) => {
            selectCandidate(candidate);
            setActiveNavTab('Reviews');
          }}
          onSelectColgate={() => {
            showDemoReport();
            setActiveNavTab('Reviews');
          }}
        />
      )}

      {/* Success or Reviews Nav View — Full Report */}
      {((status === 'success' && !demoAnalyzing) || (activeNavTab !== 'Home' && status !== 'processing' && !demoAnalyzing)) && (
        <ReportPage
          data={data}
          preview={preview}
          initialSubTab={reportSubTab}
          onReset={() => {
            setActiveNavTab('Home');
            reset();
          }}
        />
      )}

      <Footer />
      <MobileBottomNav
        activeTab={activeNavTab}
        onNavigate={handleNavigate}
        onUploadImage={startAnalysis}
        onOpenCamera={() => setIsCameraOpen(true)}
      />

      {/* Live In-App Camera Object Scanner Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => {
          setIsCameraOpen(false);
          startAnalysis(file);
        }}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthGuard />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * If already logged in, redirect to home; otherwise show AuthPage.
 */
function AuthGuard() {
  const { authenticated } = useAuth();
  if (authenticated) return <Navigate to="/" replace />;
  return <AuthPage />;
}

export default App;
