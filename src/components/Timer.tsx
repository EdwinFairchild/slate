// Timer.tsx
import React, { useEffect, useState } from 'react';

interface TimerProps {
  testId: string;
  startTime: string; // ISO string
  status: 'running' | 'completed' | 'failed';
}

const Timer: React.FC<TimerProps> = ({ testId, startTime, status }) => {
  const [duration, setDuration] = useState<number | null>(null); // Duration in minutes
  const [remaining, setRemaining] = useState<number | null>(null); // Remaining time in seconds
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the user-specified duration from the main process
    const fetchDuration = async () => {
      try {
        const durationInMinutes = await window.api.getTestDuration(testId);
        setDuration(durationInMinutes * 60); // Convert to seconds
      } catch (err) {
        setError('Failed to fetch duration');
        console.error(err);
      }
    };

    fetchDuration();
  }, [testId]);

  useEffect(() => {
    if (duration === null) return;

    const startTimestamp = new Date(startTime).getTime();
    const updateInterval = 1000; // 1 second

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTimestamp) / 1000; // in seconds

      if (status === 'running') {
        const timeLeft = Math.max(duration - elapsed, 0);
        setRemaining(timeLeft);

        if (timeLeft <= 0) {
          clearInterval(interval);
        }
      } else {
        // For completed or failed tests, show total duration
        setRemaining(elapsed);
        clearInterval(interval);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [duration, startTime, status]);

  if (error) {
    return <span className="text-red-500">{error}</span>;
  }

  if (remaining === null) {
    return <span>Loading...</span>;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  return (
    <span>
      {status === 'running'
        ? formatTime(remaining)
        : `Completed in ${formatTime(remaining)}`}
    </span>
  );
};

export default Timer;
