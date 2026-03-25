import { useEffect } from 'react';

const APP_NAME = 'SmartHostel';

/**
 * Sets document.title for the current page.
 * Resets to the app name on unmount.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | ${APP_NAME}`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
