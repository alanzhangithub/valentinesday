'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NewsTickerProps {
  speed?: number; // pixels per second
  className?: string;
}

// fallback headlines when db is empty or loading
const fallbackHeadlines = [
  'BREAKING: Beedo caught stealing snacks from the fridge again',
  'URGENT: Meedo declares today "mandatory cuddle day"',
  'DEVELOPING: Local Beedo demands more head pats',
  'EXCLUSIVE: Mod announces new coupon drop coming soon',
  'ALERT: Meedo spotted doing the dishes without being asked',
  'LIVE: Beedo wins spelling bee, celebrates with victory nap',
  'UPDATE: Kitchen sightings confirm snack supplies critically low',
  'SHOCKING: Neither Meedo nor Beedo can decide what to eat',
];

const NewsTicker: React.FC<NewsTickerProps> = ({ speed = 50, className = '' }) => {
  const [headlines] = useState<string[]>(fallbackHeadlines);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeadlines = async () => {
      try {
        // TODO: implement /api/headlines endpoint
        // const res = await fetch('/api/headlines');
        // const json = await res.json();
        // if (json.success && json.data && json.data.length > 0) {
        //   setHeadlines(json.data.map((h: NewsHeadline) => h.text));
        // }

        // for now just use fallback
        setLoading(false);
      } catch (error) {
        console.error('failed to fetch headlines:', error);
        setLoading(false);
      }
    };

    fetchHeadlines();
  }, []);

  // duplicate headlines for seamless loop
  const tickerContent = [...headlines, ...headlines];
  const totalWidth = headlines.length * 600; // approximate width per headline

  return (
    <div className={`overflow-hidden bg-black text-white py-2 ${className}`}>
      <div className="relative flex items-center">
        {/* Breaking label */}
        <div className="flex-shrink-0 bg-red-600 px-3 py-1 font-bold text-sm z-10 relative">
          MEEDOBEEDO NEWS
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1 relative">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: [-totalWidth, 0],
            }}
            transition={{
              x: {
                duration: totalWidth / speed,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
          >
            {tickerContent.map((headline, index) => (
              <span key={index} className="mx-8 text-sm inline-flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
                {headline}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
