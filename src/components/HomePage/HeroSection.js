import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HeroSection = React.memo(({ 
  pageLoaded, 
  parallaxHeroContentRef, 
  searchQuery, 
  onSearchQueryChange, 
  onSearchSubmit, 
  searchSuggestions, 
  showSuggestions, 
  onSuggestionClick, 
  onSearchFocus,
  onSearchBlur 
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const searchInputRef = useRef(null);

  const handleJoinNow = useCallback(() => {
    if (currentUser) {
      navigate('/driver');
    } else {
      navigate('/signup');
    }
  }, [currentUser, navigate]);

  const handleViewStations = useCallback(() => {
    const stationsSection = document.getElementById('stations');
    if (stationsSection) {
      stationsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const memoizedSuggestions = useMemo(() => {
    return searchSuggestions.map((suggestion) => (
      <li 
        key={suggestion.id} 
        onClick={() => onSuggestionClick(suggestion)}
        onMouseDown={(e) => { 
          e.preventDefault();
          onSuggestionClick(suggestion); 
        }}
        className="search-suggestion-item"
      >
        {suggestion.name}
        {suggestion.type && <span className="suggestion-type">{suggestion.type}</span>}
      </li>
    ));
  }, [searchSuggestions, onSuggestionClick]);

  return (
    <section className="hero-banner" aria-label="Hero section">
      <div className="container">
        <div className="hero-content" ref={parallaxHeroContentRef}>
          <h1 
            className={pageLoaded ? 'animate-on-load-slide-down' : 'initially-hidden'} 
            style={{ animationDelay: '0.2s' }}
          >
            Find & Book EV Charging Stations
          </h1>
          <p 
            className={pageLoaded ? 'animate-on-load-slide-left' : 'initially-hidden'} 
            style={{ animationDelay: '0.4s' }}
          >
            India's largest network of EV charging stations. Find, book, and pay for charging sessions across major cities.
          </p>
          
          <form 
            onSubmit={onSearchSubmit} 
            className={`search-bar-container ${pageLoaded ? 'animate-on-load-slide-right' : 'initially-hidden'}`} 
            style={{ animationDelay: '0.6s' }}
            onBlur={onSearchBlur}
            role="search"
            aria-label="Search for charging stations"
          >
            <label htmlFor="station-search" className="sr-only">
              Search for charging stations
            </label>
            <input 
              id="station-search"
              type="text" 
              className="search-input"
              placeholder="Search by City, Station Name, Address..."
              value={searchQuery}
              onChange={onSearchQueryChange}
              onFocus={onSearchFocus}
              ref={searchInputRef}
              aria-describedby="search-suggestions"
              aria-expanded={showSuggestions}
              aria-autocomplete="list"
            />
            <button 
              type="submit" 
              className="search-button"
              aria-label="Search for stations"
            >
              <span className="sr-only">Search</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
            
            {showSuggestions && searchSuggestions.length > 0 && (
              <div 
                className="search-suggestions" 
                id="search-suggestions"
                role="listbox"
                aria-label="Search suggestions"
              >
                <ul role="presentation">
                  {memoizedSuggestions}
                </ul>
              </div>
            )}
          </form>

          <div 
            className={`hero-cta ${pageLoaded ? 'animate-on-load-slide-up' : 'initially-hidden'}`} 
            style={{ animationDelay: '0.8s' }}
          >
            <button 
              onClick={handleJoinNow} 
              className="btn-primary pulse-animation"
              aria-label="Join EV Charging Network"
            >
              Join Now
            </button>
            <button 
              onClick={handleViewStations}
              className="btn-secondary"
              aria-label="View available charging stations"
            >
              View Stations
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection; 