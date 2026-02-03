'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { UserRole } from '@/types/database';
import BadgeDisplay from './BadgeDisplay';
import NewsTicker from './NewsTicker';
import CountdownTimer from './CountdownTimer';

interface DashboardProps {
  userRole: UserRole;
  userName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, userName }) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'badges' | 'stats'>('overview');

  const displayName = userName || (userRole === 'meedo' ? 'Meedo' : 'Beedo');
  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* News Ticker at top */}
      <NewsTicker />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white border-4 border-black overflow-hidden relative">
              <Image
                src={userRole === 'meedo' ? '/meedo.png' : '/beedo.png'}
                alt={displayName}
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-carrots text-3xl">{greeting}, {displayName}!</h1>
              <p className="font-cheeky text-gray-500">welcome back to your world</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex gap-4">
            <QuickStat icon="🪙" value="420" label="coins" />
            <QuickStat icon="🏆" value="7" label="badges" />
            <QuickStat icon="📅" value="12" label="days streak" />
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'badges', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-xl font-cheeky text-lg transition-all ${
                selectedTab === tab
                  ? 'bg-black text-white'
                  : 'bg-white border-2 border-black hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {selectedTab === 'overview' && (
            <OverviewTab userRole={userRole} />
          )}
          {selectedTab === 'badges' && (
            <BadgeDisplay userRole={userRole} />
          )}
          {selectedTab === 'stats' && (
            <StatsTab userRole={userRole} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Overview Tab with widgets
const OverviewTab: React.FC<{ userRole: UserRole }> = ({ userRole }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Countdown Widget */}
    <div className="lg:col-span-2">
      <CountdownTimer title="valentine's day" targetDate="2026-02-14T00:00:00" />
    </div>

    {/* Badges Preview */}
    <div className="bg-white rounded-2xl border-4 border-black p-6">
      <h3 className="font-carrots text-xl mb-4">recent badges</h3>
      <BadgeDisplay userRole={userRole} compact />
      <button className="mt-4 text-sm text-gray-500 hover:text-black transition-colors font-cheeky">
        view all badges →
      </button>
    </div>

    {/* Quick Actions */}
    <QuickActionsWidget />

    {/* Activity Feed */}
    <div className="lg:col-span-2 bg-white rounded-2xl border-4 border-black p-6">
      <h3 className="font-carrots text-xl mb-4">recent activity</h3>
      <div className="space-y-3">
        <ActivityItem
          icon="🎮"
          text="beedo beat the high score in spelling mee"
          time="2 hours ago"
        />
        <ActivityItem
          icon="🎫"
          text="meedo created a new coupon: free backrub"
          time="5 hours ago"
        />
        <ActivityItem
          icon="📸"
          text="new memory added to the gallery"
          time="yesterday"
        />
        <ActivityItem
          icon="🌟"
          text="you earned the 'early bird' badge!"
          time="2 days ago"
        />
      </div>
    </div>
  </div>
);

// Stats Tab
const StatsTab: React.FC<{ userRole: UserRole }> = ({ userRole }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    <StatCard title="total coins earned" value="1,337" icon="🪙" />
    <StatCard title="games played" value="69" icon="🎮" />
    <StatCard title="coupons redeemed" value="12" icon="🎫" />
    <StatCard title="photos uploaded" value="42" icon="📸" />
    <StatCard title="wishes made" value="7" icon="✨" />
    <StatCard title="login streak" value="12 days" icon="🔥" />

    {/* Fun Stats */}
    <div className="md:col-span-2 lg:col-span-3 bg-white rounded-2xl border-4 border-black p-6">
      <h3 className="font-carrots text-xl mb-4">fun facts</h3>
      <div className="grid md:grid-cols-3 gap-4 text-center">
        <div>
          <p className="font-carrots text-4xl text-pink-500">247</p>
          <p className="font-cheeky text-gray-500">days since first visit</p>
        </div>
        <div>
          <p className="font-carrots text-4xl text-purple-500">89%</p>
          <p className="font-cheeky text-gray-500">spelling mee accuracy</p>
        </div>
        <div>
          <p className="font-carrots text-4xl text-blue-500">∞</p>
          <p className="font-cheeky text-gray-500">love for {userRole === 'meedo' ? 'beedo' : 'meedo'}</p>
        </div>
      </div>
    </div>
  </div>
);

// Quick Actions Widget
const QuickActionsWidget: React.FC = () => (
  <div className="bg-white rounded-2xl border-4 border-black p-6">
    <h3 className="font-carrots text-xl mb-4">quick actions</h3>
    <div className="grid grid-cols-2 gap-3">
      <ActionButton icon="🎮" label="play games" />
      <ActionButton icon="📸" label="add photo" />
      <ActionButton icon="🎫" label="coupons" />
      <ActionButton icon="✨" label="make wish" />
    </div>
  </div>
);

// Helper Components
const QuickStat: React.FC<{ icon: string; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="bg-white rounded-xl border-2 border-black px-4 py-2 text-center">
    <span className="text-lg mr-1">{icon}</span>
    <span className="font-carrots text-xl">{value}</span>
    <p className="font-cheeky text-xs text-gray-500">{label}</p>
  </div>
);

const StatCard: React.FC<{ title: string; value: string; icon: string }> = ({ title, value, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white rounded-2xl border-4 border-black p-6 text-center"
  >
    <span className="text-4xl">{icon}</span>
    <p className="font-carrots text-3xl mt-2">{value}</p>
    <p className="font-cheeky text-gray-500">{title}</p>
  </motion.div>
);

const ActionButton: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-black hover:bg-gray-50 transition-colors"
  >
    <span className="text-2xl">{icon}</span>
    <span className="font-cheeky text-sm">{label}</span>
  </motion.button>
);

const ActivityItem: React.FC<{ icon: string; text: string; time: string }> = ({ icon, text, time }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
    <span className="text-xl">{icon}</span>
    <div className="flex-1">
      <p className="text-sm">{text}</p>
      <p className="text-xs text-gray-400 font-cheeky">{time}</p>
    </div>
  </div>
);

// Helper to get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "yo sleepy";
  if (hour < 12) return "good morning";
  if (hour < 17) return "good afternoon";
  if (hour < 21) return "good evening";
  return "hey night owl";
}

export default Dashboard;
