import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TARGET_DATE = new Date('2026-08-31T23:59:59+05:30').getTime();

const getTimeLeft = () => {
  const diff = TARGET_DATE - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60)
  };
};

const pad = (n) => String(n).padStart(2, '0');

const CohortCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft || dismissed) return null;

  return (
    <div className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-2.5" style={{ backgroundColor: '#0D1B2A' }}>
      <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left flex-1 justify-center">
        <span style={{ color: '#C9A84C' }} className="text-sm sm:text-base font-medium flex items-center gap-2">
          <span aria-hidden>🔥</span>
          Cohort 12 is closing in:
        </span>
        <span
          style={{ color: '#C9A84C' }}
          className="font-mono font-bold text-base sm:text-lg tracking-wide"
        >
          {pad(timeLeft.days)}D : {pad(timeLeft.hours)}H : {pad(timeLeft.minutes)}M : {pad(timeLeft.seconds)}S
        </span>
        <Link
          to="/courses"
          style={{ color: '#C9A84C' }}
          className="text-sm sm:text-base font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Enroll Now →
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ color: '#C9A84C' }}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
      >
        ×
      </button>
    </div>
  );
};

export default CohortCountdown;
