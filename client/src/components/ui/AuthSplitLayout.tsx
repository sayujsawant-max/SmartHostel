import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@components/ThemeToggle';
import { motion, ParallaxFloat } from '@components/ui/motion';

interface AuthSplitLayoutProps {
  children: ReactNode;
  /** Icon displayed in the header badge */
  icon: ReactNode;
  title: string;
  subtitle: string;
}

/**
 * Shared layout for Login / Register pages.
 * Gradient background, floating shapes, centered card with branding header.
 */
export default function AuthSplitLayout({
  children,
  icon,
  title: _title, // eslint-disable-line @typescript-eslint/no-unused-vars
  subtitle,
}: AuthSplitLayoutProps) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, hsl(222 47% 19%) 0%, hsl(173 78% 24%) 100%)',
      }}
    >
      {/* Floating gradient shapes */}
      <ParallaxFloat
        className="absolute top-[-10%] left-[-5%] w-80 h-80 rounded-full bg-white/5 blur-3xl"
        offset={25}
      />
      <ParallaxFloat
        className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-teal-400/10 blur-3xl"
        offset={20}
      />
      <ParallaxFloat
        className="absolute top-[30%] right-[15%] w-48 h-48 rounded-full bg-blue-400/8 blur-2xl"
        offset={15}
      />

      {/* Theme toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute top-4 right-4 text-white/80"
      >
        <ThemeToggle />
      </motion.div>

      <div className="w-full max-w-sm relative z-10">
        {/* Branding header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mx-auto mb-4 flex items-center justify-center"
          >
            {icon}
          </motion.div>
          <h1 className="text-3xl font-bold text-white">
            <Link to="/landing">SmartHostel</Link>
          </h1>
          <p className="text-white/70 mt-1">{subtitle}</p>
        </motion.div>

        {/* Card content */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
