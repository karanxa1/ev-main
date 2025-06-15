import React, { useRef, useEffect, useState, useCallback } from 'react';

const StatsSection = React.memo(() => {
  const [counters, setCounters] = useState({
    stations: { value: 0, target: 150, counted: false },
    cities: { value: 0, target: 4, counted: false },
    users: { value: 0, target: 708, counted: false },
  });

  const [dynamicStats, setDynamicStats] = useState({
    chargingSessions: 0,
    carbonSaved: 0,
    lastUpdated: new Date()
  });

  const stationsCounterRef = useRef(null);
  const citiesCounterRef = useRef(null);
  const usersCounterRef = useRef(null);

  // Optimized counting animation with requestAnimationFrame
  const startCountingAnimation = useCallback((counterKey, targetValue) => {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(targetValue * easeOutQuart);
      
      setCounters(prev => ({
        ...prev,
        [counterKey]: {
          ...prev[counterKey],
          value: currentValue,
          counted: progress === 1
        }
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  // Intersection Observer for counter animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target === stationsCounterRef.current && !counters.stations.counted) {
              startCountingAnimation('stations', counters.stations.target);
            } else if (entry.target === citiesCounterRef.current && !counters.cities.counted) {
              startCountingAnimation('cities', counters.cities.target);
            } else if (entry.target === usersCounterRef.current && !counters.users.counted) {
              startCountingAnimation('users', counters.users.target);
            }
            
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -50px 0px' }
    );
    
    const refs = [stationsCounterRef, citiesCounterRef, usersCounterRef];
    refs.forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });
    
    return () => {
      refs.forEach(ref => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, [counters.stations.counted, counters.cities.counted, counters.users.counted, startCountingAnimation]);

  // Optimized dynamic stats update with reduced frequency
  useEffect(() => {
    const updateDynamicStats = () => {
      setDynamicStats(prev => ({
        chargingSessions: prev.chargingSessions + Math.floor(Math.random() * 2),
        carbonSaved: prev.carbonSaved + Math.floor(Math.random() * 3),
        lastUpdated: new Date()
      }));
    };

    // Set initial values
    setDynamicStats({
      chargingSessions: Math.floor(Math.random() * 50) + 20,
      carbonSaved: Math.floor(Math.random() * 100) + 50,
      lastUpdated: new Date()
    });

    // Update every 45 seconds instead of 30
    const interval = setInterval(updateDynamicStats, 45000);
    return () => clearInterval(interval);
  }, []);

  const StatItem = React.memo(({ icon, counterRef, counter, title, description }) => (
    <div className="stat-item">
      <div className="stat-icon floating-animation" aria-hidden="true">{icon}</div>
      <div ref={counterRef} className="counter-animation">
        <span className="counter-value" aria-live="polite">
          {counter.value}+
        </span>
        <h3>{title}</h3>
        <p className="stat-description">{description}</p>
        <div className="stat-progress" role="progressbar" aria-valuenow={counter.value} aria-valuemax={counter.target}>
          <div 
            className="progress-bar" 
            style={{ width: `${(counter.value / counter.target) * 100}%` }}
          />
        </div>
      </div>
    </div>
  ));

  const LiveStatItem = React.memo(({ icon, value, label }) => (
    <div className="live-stat-item">
      <div className="live-stat-icon" aria-hidden="true">{icon}</div>
      <div className="live-stat-content">
        <span className="live-stat-value" aria-live="polite">{value}</span>
        <span className="live-stat-label">{label}</span>
      </div>
    </div>
  ));

  return (
    <section className="stats-section" data-scroll="fade-in" aria-labelledby="stats-heading">
      <div className="container">
        <h2 id="stats-heading" data-scroll="slide-up">Our Impact In Numbers</h2>
        
        <div className="stats-grid" role="group" aria-label="Statistics">
          <StatItem
            icon="🔋"
            counterRef={stationsCounterRef}
            counter={counters.stations}
            title="Charging Stations"
            description="Across Pune's key locations"
          />
          <StatItem
            icon="🏙️"
            counterRef={citiesCounterRef}
            counter={counters.cities}
            title="Cities Covered"
            description="Expanding rapidly"
          />
          <StatItem
            icon="👥"
            counterRef={usersCounterRef}
            counter={counters.users}
            title="Happy EV Drivers"
            description="And growing daily"
          />
        </div>

        {/* Live Stats Section */}
        <div className="live-stats-container" aria-labelledby="live-stats-heading">
          <div className="live-stats-header">
            <h3 id="live-stats-heading">Live Impact</h3>
            <span className="live-indicator" aria-label="Live data">
              <span className="pulse" aria-hidden="true"></span>
              Live
            </span>
          </div>
          <div className="live-stats-grid" role="group" aria-label="Live statistics">
            <LiveStatItem
              icon="⚡"
              value={dynamicStats.chargingSessions}
              label="Charging Sessions Today"
            />
            <LiveStatItem
              icon="🌱"
              value={`${dynamicStats.carbonSaved}kg`}
              label="CO₂ Saved Today"
            />
          </div>
          <div className="last-updated" aria-live="polite">
            Last updated: {dynamicStats.lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="stats-highlight">
          <p>EV Charging Stations in Pune</p>
          <div className="highlight-details">
            <span>24/7 Support</span>
            <span aria-hidden="true">•</span>
            <span>Real-time Availability</span>
            <span aria-hidden="true">•</span>
            <span>Fast Charging</span>
          </div>
          <div className="highlight-features">
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">⚡</span>
              <span>DC Fast Charging</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">🔌</span>
              <span>Multiple Connectors</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">📱</span>
              <span>App Integration</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

StatsSection.displayName = 'StatsSection';

export default StatsSection; 