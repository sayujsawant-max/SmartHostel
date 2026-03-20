import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getRoleHomePath } from '@utils/role-home';
import { ApiError } from '@services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const user = await googleLogin(response.credential);
        navigate(getRoleHomePath(user.role), { replace: true });
      } catch (err) {
        if (err instanceof ApiError) {
          onError?.(err.message);
        } else {
          onError?.('Google sign-in failed');
        }
      }
    },
    [googleLogin, navigate, onError],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    // Load Google Identity Services script
    const existing = document.getElementById('google-gsi-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => initializeGoogle();
    } else {
      initializeGoogle();
    }

    function initializeGoogle() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: buttonRef.current.offsetWidth,
        text: 'continue_with',
      });
    }
  }, [handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full">
      <div className="relative flex items-center my-4">
        <div className="flex-1 border-t border-gray-300" />
        <span className="px-3 text-xs text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-300" />
      </div>
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
}
