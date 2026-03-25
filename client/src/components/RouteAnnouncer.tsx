import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Announces route changes to screen readers via an ARIA live region.
 * Also manages focus by moving it to the main content area.
 */
export default function RouteAnnouncer() {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Derive a human-readable page name from the pathname
    const segments = location.pathname.split('/').filter(Boolean);
    const pageName = segments.length > 0
      ? segments[segments.length - 1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Home';

    // Update the live region so screen readers announce the new page
    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${pageName}`;
    }

    // Move focus to main content area for keyboard users
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('tabIndex', '-1');
      main.focus({ preventScroll: true });
      // Clean up tabIndex after focus so it doesn't interfere with tab order
      const cleanup = () => main.removeAttribute('tabIndex');
      main.addEventListener('blur', cleanup, { once: true });
    }
  }, [location.pathname]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    />
  );
}
