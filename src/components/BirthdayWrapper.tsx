'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the BirthdayOverlay component with no SSR
// This prevents hydration errors since the component uses window
const BirthdayOverlay = dynamic(() => import('./BirthdayOverlay'), { 
  ssr: false 
});

const BirthdayWrapper: React.FC = () => {
  return <BirthdayOverlay />;
};

export default BirthdayWrapper;