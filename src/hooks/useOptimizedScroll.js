import { useEffect, useCallback, useRef } from 'react';

// Debounce function for performance optimization
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle function for scroll events
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return (...args) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export const useOptimizedScroll = (callbacks = {}) => {
  const {
    onScroll,
    onScrollProgress,
    onSectionInView,
    throttleDelay = 16, // 60fps
    debounceDelay = 100
  } = callbacks;

  const scrollProgressRef = useRef(0);
  const sectionsRef = useRef(new Map());

  // Optimized scroll handler
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Calculate scroll progress
    if (onScrollProgress) {
      const maxScroll = documentHeight - windowHeight;
      const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      
      // Only update if progress changed significantly
      if (Math.abs(progress - scrollProgressRef.current) > 0.5) {
        scrollProgressRef.current = progress;
        onScrollProgress(progress);
      }
    }

    // Handle section animations
    if (onSectionInView) {
      const sections = document.querySelectorAll('[data-scroll]');
      const visibleSections = [];

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < windowHeight * 0.75 && rect.bottom > 0;
        
        if (isVisible && !section.classList.contains('scroll-visible')) {
          section.classList.add('scroll-visible');
          visibleSections.push(section);
        }
      });

      if (visibleSections.length > 0) {
        onSectionInView(visibleSections);
      }
    }

    // Custom scroll callback
    if (onScroll) {
      onScroll({ scrollTop, windowHeight, documentHeight });
    }
  }, [onScroll, onScrollProgress, onSectionInView]);

  // Throttled scroll handler for performance
  const throttledScrollHandler = useCallback(
    throttle(handleScroll, throttleDelay),
    [handleScroll, throttleDelay]
  );

  useEffect(() => {
    // Initial call to set up initial state
    handleScroll();

    // Add passive event listener for better performance
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, [throttledScrollHandler, handleScroll]);

  return {
    scrollProgress: scrollProgressRef.current
  };
};

// Hook for mouse tracking with performance optimization
export const useOptimizedMouse = (onMouseMove, throttleDelay = 16) => {
  const mousePositionRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const newPosition = { x: e.clientX, y: e.clientY };
    mousePositionRef.current = newPosition;
    
    if (onMouseMove) {
      onMouseMove(newPosition, e);
    }
  }, [onMouseMove]);

  const throttledMouseHandler = useCallback(
    throttle(handleMouseMove, throttleDelay),
    [handleMouseMove, throttleDelay]
  );

  useEffect(() => {
    window.addEventListener('mousemove', throttledMouseHandler, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', throttledMouseHandler);
    };
  }, [throttledMouseHandler]);

  return mousePositionRef.current;
};

// Hook for intersection observer with performance optimization
export const useOptimizedIntersectionObserver = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true
  } = options;

  const observerRef = useRef(null);
  const elementsRef = useRef(new Set());

  const observe = useCallback((element, callback) => {
    if (!element) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const elementData = elementsRef.current.get(entry.target);
              if (elementData && elementData.callback) {
                elementData.callback(entry);
              }
              
              if (triggerOnce) {
                observerRef.current.unobserve(entry.target);
                elementsRef.current.delete(entry.target);
              }
            }
          });
        },
        { threshold, rootMargin }
      );
    }

    elementsRef.current.set(element, { callback });
    observerRef.current.observe(element);
  }, [threshold, rootMargin, triggerOnce]);

  const unobserve = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
      elementsRef.current.delete(element);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { observe, unobserve };
};

export default useOptimizedScroll; 