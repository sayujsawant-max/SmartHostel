import { useState, useCallback } from 'react';
import { apiFetch } from '@services/api';
import { motion, AnimatePresence } from 'motion/react';
import { showError, showSuccess } from '@/utils/toast';

export default function SosButton() {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(async () => {
    setSending(true);
    try {
      await apiFetch('/sos', {
        method: 'POST',
        body: JSON.stringify({ message: message || undefined }),
      });
      setSent(true);
      setShowModal(false);
      setMessage('');
      showSuccess('SOS alert sent');
      setTimeout(() => setSent(false), 30_000);
    } catch (err) {
      showError(err, 'Failed to send SOS alert');
    } finally {
      setSending(false);
    }
  }, [message]);

  return (
    <>
      {/* Floating SOS Button */}
      <motion.button
        onClick={() => !sent && setShowModal(true)}
        disabled={sent}
        whileHover={sent ? {} : { scale: 1.12 }}
        whileTap={sent ? {} : { scale: 0.92 }}
        aria-label={sent ? 'SOS Sent' : 'Emergency SOS'}
        className="sos-button"
        style={{
          position: 'fixed',
          bottom: '10rem',
          right: '1rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: sent ? '#991b1b' : '#dc2626',
          color: '#ffffff',
          border: 'none',
          cursor: sent ? 'not-allowed' : 'pointer',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: sent ? '10px' : '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.5)',
          opacity: sent ? 0.8 : 1,
        }}
      >
        <style>{`
          @keyframes sosPulse {
            0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
            70% { box-shadow: 0 0 0 14px rgba(220, 38, 38, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
          }
          .sos-button:not(:disabled) {
            animation: sosPulse 2s infinite;
          }
        `}</style>
        {sent ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ lineHeight: 1.2, textAlign: 'center' }}
          >
            SOS{'\n'}Sent
          </motion.span>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ scale: 0.85, opacity: 0, y: 20, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90%',
                maxWidth: '400px',
                borderRadius: '16px',
                padding: '24px',
                backgroundColor: 'hsl(var(--card))',
                border: '2px solid #dc2626',
                boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
              }}
            >
              <h3 style={{ color: '#dc2626', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Emergency SOS
              </h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', marginBottom: '16px' }}>
                Are you sure? This will alert the warden immediately.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Optional: describe your emergency..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px',
                  resize: 'none',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void handleSend()}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    opacity: sending ? 0.7 : 1,
                  }}
                >
                  {sending ? 'Sending...' : 'Send SOS'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
