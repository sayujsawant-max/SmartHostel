import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  role: string;
  onComplete?: () => void;
}

function getStorageKey(role: string) {
  return `smarthostel-onboarding-${role}`;
}

export function useOnboarding(role: string) {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(getStorageKey(role));
    if (!seen) {
      setShowTour(true);
    }
  }, [role]);

  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);

  const dismissTour = useCallback(() => {
    localStorage.setItem(getStorageKey(role), 'true');
    setShowTour(false);
  }, [role]);

  return { showTour, startTour, dismissTour };
}

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function computeTooltipPosition(
  rect: DOMRect,
  preferred: 'top' | 'bottom' | 'left' | 'right',
) {
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;
  const pad = 16;
  const tooltipW = 340;
  const tooltipH = 220;

  let position = preferred;
  if (preferred === 'bottom' && rect.bottom + tooltipH + pad > viewportH) {
    position = 'top';
  } else if (preferred === 'top' && rect.top - tooltipH - pad < 0) {
    position = 'bottom';
  } else if (preferred === 'left' && rect.left - tooltipW - pad < 0) {
    position = 'right';
  } else if (preferred === 'right' && rect.right + tooltipW + pad > viewportW) {
    position = 'left';
  }

  if (rect.top > viewportH / 2 && (position === 'left' || position === 'right')) {
    position = 'top';
  } else if (rect.bottom < viewportH / 2 && (position === 'left' || position === 'right')) {
    position = 'bottom';
  }

  let top = 0;
  let left = 0;

  switch (position) {
    case 'bottom':
      top = rect.bottom + pad;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case 'top':
      top = rect.top - tooltipH - pad;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - pad;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + pad;
      break;
  }

  left = Math.max(pad, Math.min(left, viewportW - tooltipW - pad));
  top = Math.max(pad, Math.min(top, viewportH - tooltipH - pad));

  return { top, left, position };
}

function getArrowStyle(position: string, rect: DOMRect, tooltipLeft: number, tooltipTop: number) {
  const base = 'absolute w-3 h-3 rotate-45 bg-[hsl(var(--card))] border-[hsl(var(--border))]';
  switch (position) {
    case 'bottom':
      return {
        className: `${base} border-l border-t`,
        style: {
          top: -6,
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipLeft - 6, 340 - 24)),
        },
      };
    case 'top':
      return {
        className: `${base} border-r border-b`,
        style: {
          bottom: -6,
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipLeft - 6, 340 - 24)),
        },
      };
    case 'left':
      return {
        className: `${base} border-r border-t`,
        style: {
          right: -6,
          top: Math.max(16, Math.min(rect.top + rect.height / 2 - tooltipTop - 6, 220 - 24)),
        },
      };
    case 'right':
      return {
        className: `${base} border-l border-b`,
        style: {
          left: -6,
          top: Math.max(16, Math.min(rect.top + rect.height / 2 - tooltipTop - 6, 220 - 24)),
        },
      };
    default:
      return { className: base, style: {} };
  }
}

export default function OnboardingTour({ steps, role, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(true);
  const rafRef = useRef<number>(0);

  const step = steps[currentStep];

  const updateRect = useCallback(() => {
    if (!step) return;
    const rect = getTargetRect(step.target);
    setTargetRect(rect);
  }, [step]);

  useEffect(() => {
    updateRect();
    const onScroll = () => updateRect();
    const onResize = () => updateRect();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [updateRect]);

  useEffect(() => {
    const tick = () => {
      updateRect();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [updateRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(getStorageKey(role), 'true');
    setVisible(false);
    onComplete?.();
  };

  const handleFinish = () => {
    localStorage.setItem(getStorageKey(role), 'true');
    setVisible(false);
    onComplete?.();
  };

  if (!visible || !step) return null;

  const pad = 8;
  const spotlightRect = targetRect
    ? {
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
      }
    : null;

  const tooltip = targetRect
    ? computeTooltipPosition(targetRect, step.position)
    : { top: window.innerHeight / 2 - 110, left: window.innerWidth / 2 - 170, position: 'bottom' };

  const arrow =
    targetRect && spotlightRect
      ? getArrowStyle(tooltip.position, targetRect, tooltip.left, tooltip.top)
      : null;

  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="onboarding-overlay"
        className="fixed inset-0 z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Overlay with spotlight cutout */}
        <div className="absolute inset-0 pointer-events-auto" onClick={handleSkip}>
          {spotlightRect ? (
            <div
              className="absolute rounded-xl"
              style={{
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                zIndex: 1,
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-black/60" />
          )}
        </div>

        {/* Tooltip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tooltip-${currentStep}`}
            className="absolute z-[2] w-[340px] rounded-2xl glass-strong p-5 shadow-xl pointer-events-auto card-glow"
            style={{ top: tooltip.top, left: tooltip.left }}
            initial={{ opacity: 0, scale: 0.9, y: tooltip.position === 'bottom' ? -12 : 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow */}
            {arrow && <div className={arrow.className} style={arrow.style} />}

            {/* Step counter */}
            <div className="mb-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Step {currentStep + 1} of {steps.length}
            </div>

            {/* Title */}
            <h3 className="mb-1.5 text-base font-bold text-[hsl(var(--card-foreground))]">
              {step.title}
            </h3>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
              {step.description}
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <motion.button
                    onClick={handlePrev}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </motion.button>
                )}

                <motion.button
                  onClick={handleNext}
                  className="flex h-8 items-center gap-1 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                >
                  {isLastStep ? (
                    'Get Started!'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Progress dots */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-4 bg-[hsl(var(--primary))]'
                      : i < currentStep
                        ? 'w-1.5 bg-[hsl(var(--primary)/0.5)]'
                        : 'w-1.5 bg-[hsl(var(--muted-foreground)/0.3)]'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
