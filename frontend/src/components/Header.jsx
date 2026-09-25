import React, { useState, useRef } from 'react';

export default function Header({ activeTab = 'Home', onNavigate, onSearch, onUploadImage, onOpenCamera, user, onLogOut }) {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleCameraClick = () => {
    if (onOpenCamera) {
      onOpenCamera();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onUploadImage) {
      onUploadImage(file);
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        {/* Left: Brand Logo with Tagline */}
        <div className="logo-search-group">
          <div className="logo" onClick={() => onNavigate && onNavigate('Home')}>
            <div className="logo-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 3L28 10V22L16 29L4 22V10L16 3Z"
                  fill="url(#logo-grad)"
                  stroke="#c084fc"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3V29M4 10L16 16L28 10M4 22L16 16L28 22"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.2"
                />
                <defs>
                  <linearGradient id="logo-grad" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a855f7" />
                    <stop offset="0.5" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="logo-text-group">
              <span className="logo-text">Reviewly</span>
              <span className="logo-tagline">Real Reviews. Smarter Choices.</span>
            </div>
          </div>

          {/* Search Bar with Camera Upload Icon */}
          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrap">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="header-search-input"
                placeholder="Search products or upload an image..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="search-camera-btn"
                onClick={handleCameraClick}
                title="Upload image to search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
          </form>

          {/* Hidden File Input for Camera button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
          />
        </div>

        {/* Center: Navigation Links */}
        <nav className="header-nav">
          {['Home', 'Reviews', 'Compare', 'Insights', 'About'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`nav-link ${activeTab === item ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate(item);
              }}
            >
              {item}
              {activeTab === item && <span className="nav-indicator" />}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="header-actions">
          {/* Dark Mode Moon Toggle */}
          <button className="theme-toggle-btn" title="Toggle Theme" aria-label="Toggle Theme">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>

          {/* User Profile Pill */}
          <div className="user-profile-pill">
            <div className="user-avatar-initial">{user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <span className="user-name">{user?.full_name || user?.username || 'User'}</span>
            <button className="auth-logout-btn" onClick={onLogOut} title="Sign Out" style={{marginLeft:8}}>Logout</button>
          </div>

          {/* Top Mission Badge */}
          <div className="header-mission-badge">
            <span className="mission-sparkle">✦</span>
            <span>Building a more informed shopping world</span>
          </div>
        </div>
      </div>
    </header>
  );
}
