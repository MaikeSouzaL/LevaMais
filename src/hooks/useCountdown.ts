import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountdownOptions {
  initialSeconds: number;
  onExpire?: () => void;
  onTick?: (remaining: number) => void;
  interval?: number;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  seconds: number;
  isRunning: boolean;
  isExpired: boolean;
  start: (seconds?: number) => void;
  stop: () => void;
  reset: (seconds?: number) => void;
  restart: (seconds?: number) => void;
}

export function useCountdown({
  initialSeconds,
  onExpire,
  onTick,
  interval = 1000,
  autoStart = true,
}: UseCountdownOptions): UseCountdownReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);

  // Keep callbacks fresh without re-triggering effect
  onExpireRef.current = onExpire;
  onTickRef.current = onTick;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (customSeconds?: number) => {
      if (customSeconds !== undefined) {
        setSeconds(customSeconds);
      }
      setIsExpired(false);
      setIsRunning(true);
    },
    [],
  );

  const stop = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(
    (customSeconds?: number) => {
      clearTimer();
      setSeconds(customSeconds ?? initialSeconds);
      setIsExpired(false);
      setIsRunning(false);
    },
    [initialSeconds, clearTimer],
  );

  const restart = useCallback(
    (customSeconds?: number) => {
      clearTimer();
      setSeconds(customSeconds ?? initialSeconds);
      setIsExpired(false);
      setIsRunning(true);
    },
    [initialSeconds, clearTimer],
  );

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);

        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          setIsExpired(true);
          setTimeout(() => onExpireRef.current?.(), 0);
          return 0;
        }
        return next;
      });
    }, interval);

    return clearTimer;
  }, [isRunning, interval, clearTimer]);

  return { seconds, isRunning, isExpired, start, stop, reset, restart };
}
