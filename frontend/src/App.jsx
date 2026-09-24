import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ProcessingPipeline from './components/ProcessingPipeline';
import CandidateSelector from './components/CandidateSelector';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import { useAnalysis } from './hooks/useAnalysis';

import MobileBottomNav from './components/MobileBottomNav';
import CameraCaptureModal from './components/CameraCaptureModal';

function App() {
  const {
    status,
    currentStep,
    steps,
    data,
    error,
    preview,
    startAnalysis,
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
      showDemoReport();
    } else if (tab === 'Compare') {
      setDemoAnalyzing(false);
      setReportSubTab('Price Comparison');
      showDemoReport();
    } else if (tab === 'Insights') {
      setDemoAnalyzing(false);
      setReportSubTab('AI Insights');
      showDemoReport();
    } else if (tab === 'About') {
      setActiveNavTab('Home');
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    }
  };

  // Handle search query
  const handleSearch = (query) => {
    setDemoAnalyzing(false);
    showDemoReport(query);
    setActiveNavTab('Reviews');
  };

  return (
    <>
      <Header
        activeTab={activeNavTab}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onUploadImage={startAnalysis}
        onOpenCamera={() => setIsCameraOpen(true)}
      />

      {/* Processing State — Dedicated Analyzing Dashboard */}
      {(status === 'processing' || demoAnalyzing) && (
        <ProcessingPipeline
          currentStep={currentStep}
          steps={steps}
          preview={preview || '/assets/headphones_table.jpg'}
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

export default App;
