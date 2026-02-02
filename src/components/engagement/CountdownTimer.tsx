'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Countdown } from '@/types/database';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface CountdownTimerProps {
  targetDate?: string;
  title?: string;
  onComplete?: () => void;
  compact?: boolean;
  className?: string;
}

const calculateTimeLeft = (targetDate: string): TimeLeft => {
  const difference = new Date(targetDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  title = 'countdown to something special',
  onComplete,
  compact = false,
  className = '',
}) => {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [activeCountdown, setActiveCountdown] = useState<Countdown | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [loading, setLoading] = useState(!targetDate);

  // fetch countdowns from db if no targetDate provided
  useEffect(() => {
    if (targetDate) {
      setTimeLeft(calculateTimeLeft(targetDate));
      setLoading(false);
      return;
    }

    const fetchCountdowns = async () => {
      try {
        // TODO: implement /api/countdowns endpoint
        // const res = await fetch('/api/countdowns');
        // const json = await res.json();
        // if (json.success && json.data) {
        //   setCountdowns(json.data.filter((c: Countdown) => c.active));
        //   if (json.data.length > 0) {
        //     setActiveCountdown(json.data[0]);
        //   }
        // }

        // fallback to valentines day 2026
        const fallbackDate = '2026-02-14T00:00:00';
        setTimeLeft(calculateTimeLeft(fallbackDate));
        setLoading(false);
      } catch (error) {
        console.error('failed to fetch countdowns:', error);
        setLoading(false);
      }
    };

    fetchCountdowns();
  }, [targetDate]);

  // update countdown every second
  useEffect(() => {
    const target = targetDate || activeCountdown?.target_date || '2026-02-14T00:00:00';

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(target);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, activeCountdown, onComplete]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-6 h-6 border-3 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!timeLeft) return null;

  const displayTitle = title || activeCountdown?.title || "valentine's day";
  const isComplete = timeLeft.total <= 0;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 bg-white rounded-xl border-2 border-black px-4 py-2 ${className}`}>
        <span className="font-cheeky text-sm text-gray-600">{displayTitle}:</span>
        {isComplete ? (
          <span className="font-carrots text-lg">it's time!</span>
        ) : (
          <span className="font-carrots text-lg">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border-4 border-black p-6 text-center ${className}`}>
      <h3 className="font-cheeky text-lg text-gray-600 mb-2">countdown to</h3>
      <h2 className="font-carrots text-3xl mb-6">{displayTitle}</h2>

      {isComplete ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="py-8"
        >
          <span className="text-6xl">🎉</span>
          <p className="font-carrots text-2xl mt-4">it's happening!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          <TimeBlock value={timeLeft.days} label="days" />
          <TimeBlock value={timeLeft.hours} label="hours" />
          <TimeBlock value={timeLeft.minutes} label="mins" />
          <TimeBlock value={timeLeft.seconds} label="secs" />
        </div>
      )}

      {/* fun message based on time left */}
      <p className="mt-4 text-gray-500 text-sm font-cheeky">
        {timeLeft.days > 30 && "patience, young padawan"}
        {timeLeft.days <= 30 && timeLeft.days > 7 && "getting closer..."}
        {timeLeft.days <= 7 && timeLeft.days > 1 && "almost there!"}
        {timeLeft.days <= 1 && timeLeft.total > 0 && "omg it's so soon!!"}
        {isComplete && "hope it's everything you wished for"}
      </p>
    </div>
  );
};

interface TimeBlockProps {
  value: number;
  label: string;
}

const TimeBlock: React.FC<TimeBlockProps> = ({ value, label }) => (
  <motion.div
    key={value}
    initial={{ scale: 1.1 }}
    animate={{ scale: 1 }}
    className="bg-black text-white rounded-xl p-3"
  >
    <motion.div
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="font-carrots text-3xl"
    >
      {String(value).padStart(2, '0')}
    </motion.div>
    <div className="font-cheeky text-xs text-gray-400 mt-1">{label}</div>
  </motion.div>
);

export default CountdownTimer;
