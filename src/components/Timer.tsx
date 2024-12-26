import React, { useEffect, useState, memo } from 'react';

// Cache for storing processed test IDs
const processedTests = new Set<string>();

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
    // Check if this test has already been processed
    if (processedTests.has(testId)) {
      console.log(`Test ID ${testId} has already been processed.`);
      return;
    }

    const fetchDuration = async () => {
      try {
        console.log(`Fetching duration for Test ID: ${testId}`);
        const durationInMinutes = await window.api.getTestDuration(testId);
        setDuration(durationInMinutes * 60); // Convert to seconds

        // Mark this test as processed
        processedTests.add(testId);
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

// Wrap the Timer component in React.memo
export default memo(Timer, (prevProps, nextProps) => {
  // Prevent re-renders if props have not changed
  return (
    prevProps.testId === nextProps.testId &&
    prevProps.startTime === nextProps.startTime &&
    prevProps.status === nextProps.status
  );
});
