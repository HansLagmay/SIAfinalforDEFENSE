import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  className?: string;
}

export const CountdownTimer = ({ seconds, onComplete, className = '' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds); // Reset when seconds prop changes
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const formatTime = (secs: number): string => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <span className={`font-mono ${className}`}>
      {formatTime(timeLeft)}
    </span>
  );
};

export default CountdownTimer;
