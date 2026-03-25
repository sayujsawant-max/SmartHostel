import confetti from 'canvas-confetti';

/** Fire a celebration burst — call after approvals, successful actions, etc. */
export function celebrate() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/** Quick single burst from center */
export function celebrateMini() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899'],
  });
}
