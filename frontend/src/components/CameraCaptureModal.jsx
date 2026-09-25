import React, { useState, useEffect, useRef } from 'react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (mode) => {
    await Promise.resolve();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('In-app camera streaming is not supported on this browser.');
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was not granted. Tap below to launch your device camera.');
      } else {
        setCameraError('Tap below to take a photo using your device camera.');
      }
    }
  };

  // Start or restart camera stream
  useEffect(() => {
    if (!isOpen) return;

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Check if device has multiple video inputs
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }
  }, []);

  // Flip rear / front camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from video stream
  const handleShutter = () => {
    if (!videoRef.current || !cameraActive || isCapturing) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      // Mirror front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (!blob) {
          alert('Failed to capture frame. Please try again.');
          return;
        }

        const file = new File([blob], `product_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        stopCamera();
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.95
    );
  };

  // Handle fallback native file/camera input
  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-backdrop">
      {/* Hidden file input for native camera intent */}
      <input
        type="file"
        ref={fallbackInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFallbackFile}
        style={{ display: 'none' }}
      />

      <div className="camera-modal-container">
        {/* Top Controls Bar */}
        <div className="camera-top-bar">
          <div className="camera-header-brand">
            <span className="camera-dot-live" />
            <span className="camera-header-title">Live Object Scanner</span>
          </div>

          <div className="camera-top-actions">
            {hasMultipleCameras && cameraActive && (
              <button
                type="button"
                className="camera-ctrl-btn"
                onClick={toggleFacingMode}
                title="Flip Camera"
                aria-label="Flip Camera"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
                  <polyline points="10 12 14 16 10 20" />
                  <path d="M4 8V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                  <polyline points="14 12 10 8 14 4" />
                </svg>
              </button>
            )}

            <button
              type="button"
              className="camera-ctrl-btn camera-close-btn"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              title="Close Camera"
              aria-label="Close Camera"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="camera-viewport-wrap">
          {/* Shutter flash animation effect */}
          {isCapturing && <div className="camera-flash-overlay" />}

          {/* Video stream */}
          <video
            ref={videoRef}
            className={`camera-video-feed ${facingMode === 'user' ? 'mirrored' : ''}`}
            playsInline
            autoPlay
            muted
          />

          {/* Scanner Overlay UI */}
          {cameraActive && !cameraError && (
            <div className="camera-scanner-overlay">
              {/* Center Target Box */}
              <div className="scanner-target-box">
                <div className="scanner-corner corner-top-left" />
                <div className="scanner-corner corner-top-right" />
                <div className="scanner-corner corner-bottom-left" />
                <div className="scanner-corner corner-bottom-right" />

                {/* Laser animation */}
                <div className="scanner-laser-line" />
              </div>

              <div className="scanner-guide-text">
                <span>Align product or packaging inside frame</span>
              </div>
            </div>
          )}

          {/* Fallback / Error State */}
          {cameraError && (
            <div className="camera-fallback-card">
              <div className="camera-fallback-icon">📷</div>
              <h3>Use Device Camera</h3>
              <p>{cameraError}</p>
              <button
                type="button"
                className="btn-open-native-cam"
                onClick={() => fallbackInputRef.current?.click()}
              >
                <span>Launch Camera</span>
                <span className="arrow">→</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Shutter Controls */}
        <div className="camera-bottom-bar">
          {/* Gallery Picker Button */}
          <button
            type="button"
            className="camera-gallery-btn"
            onClick={() => fallbackInputRef.current?.click()}
            title="Choose from device gallery"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Gallery</span>
          </button>

          {/* Big Center Shutter Button */}
          <div className="shutter-button-container">
            <button
              type="button"
              className={`shutter-outer-ring ${isCapturing ? 'capturing' : ''}`}
              onClick={cameraActive ? handleShutter : () => fallbackInputRef.current?.click()}
              disabled={isCapturing}
              aria-label="Capture Photo"
            >
              <div className="shutter-inner-disc" />
            </button>
            <span className="shutter-hint-text">
              {cameraActive ? 'TAP TO SNAP' : 'OPEN CAMERA'}
            </span>
          </div>

          {/* Camera switch or info placeholder for balance */}
          <div className="camera-bottom-right-slot">
            {hasMultipleCameras && cameraActive ? (
              <button
                type="button"
                className="camera-gallery-btn"
                onClick={toggleFacingMode}
                title="Switch Camera"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Flip</span>
              </button>
            ) : (
              <div style={{ width: 56 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
