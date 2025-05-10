import { useEffect, useRef } from 'react';

/**
 * A custom hook to apply a parallax scrolling effect to an element.
 * @param {object} options - Configuration options for the parallax effect.
 * @param {number} options.speed - The speed factor for the parallax effect. 
 *                                 A value between 0 and 1 makes the element scroll slower than the page (appears further away).
 *                                 A negative value (e.g., -0.1) makes the element move upwards as you scroll down.
 *                                 Defaults to 0.2 (scrolls at 20% of the page speed).
 * @param {boolean} options.disableOnMobile - If true, disables the parallax effect on small screens (e.g., width < 768px).
 * @param {number} options.mobileBreakpoint - The breakpoint (in px) below which to disable parallax if disableOnMobile is true. Defaults to 768.
 */
function useParallax({ speed = 0.2, disableOnMobile = false, mobileBreakpoint = 768 } = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        let shouldApplyEffect = true;
        if (disableOnMobile && window.innerWidth < mobileBreakpoint) {
          shouldApplyEffect = false;
        }

        if (shouldApplyEffect) {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          elementRef.current.style.transform = `translateY(${scrollTop * speed}px)`;
        } else {
          // Reset transform if effect is disabled
          elementRef.current.style.transform = 'translateY(0px)';
        }
      }
    };

    // Call once to set initial position (if needed, though scroll usually starts at 0)
    // handleScroll(); 
    // Better to let initial CSS position it, and then scroll updates it.

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (disableOnMobile) {
      window.addEventListener('resize', handleScroll, { passive: true });
    }

    // Initial check in case the page loads scrolled or for resize changes
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (disableOnMobile) {
        window.removeEventListener('resize', handleScroll);
      }
      // Optional: Reset transform on unmount, though usually not necessary
      // if (elementRef.current) {
      //   elementRef.current.style.transform = 'translateY(0px)';
      // }
    };
  }, [speed, disableOnMobile, mobileBreakpoint]); // Re-run effect if options change

  return elementRef;
}

export default useParallax; 