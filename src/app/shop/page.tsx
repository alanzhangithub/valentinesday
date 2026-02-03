'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ShopItem as ShopItemType, Purchase } from '@/types/shop';
import ShopItemCard from '@/components/shop/ShopItem';
import CoinBalance from '@/components/shop/CoinBalance';

type FilterType = 'all' | 'coupon' | 'reward';
type SortType = 'price-low' | 'price-high' | 'name';
type User = 'meedo' | 'beedo';

export default function ShopPage() {
  // For now, hardcoding user - in production would come from auth
  const [currentUser] = useState<User>('beedo');

  const [items, setItems] = useState<ShopItemType[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showPurchases, setShowPurchases] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('price-low');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch shop items and balance
  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, balanceRes, purchasesRes] = await Promise.all([
          fetch('/api/shop'),
          fetch(`/api/coins?user=${currentUser}`),
          fetch(`/api/shop/purchase?user=${currentUser}`),
        ]);

        const itemsData = await itemsRes.json();
        const balanceData = await balanceRes.json();
        const purchasesData = await purchasesRes.json();

        setItems(itemsData.items || []);
        setBalance(balanceData.coins || 0);
        setPurchases(purchasesData.purchases || []);
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUser]);

  // Handle purchase
  const handlePurchase = async (itemId: string) => {
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, user: currentUser }),
      });

      const data = await res.json();

      if (data.success) {
        setBalance(data.new_balance);
        setPurchases(prev => [data.purchase, ...prev]);
        setNotification({ message: `got ${data.purchase.item?.name}!`, type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ message: data.error || 'something went wrong', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      setNotification({ message: 'something went wrong', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      if (filter === 'all') return true;
      return item.type === filter;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Group by type and tier
  const coupons = filteredItems.filter(item => item.type === 'coupon');
  const smallRewards = filteredItems.filter(item => item.type === 'reward' && item.tier === 'small');
  const mediumRewards = filteredItems.filter(item => item.type === 'reward' && item.tier === 'medium');
  const largeRewards = filteredItems.filter(item => item.type === 'reward' && item.tier === 'large');

  const pendingPurchases = purchases.filter(p => !p.fulfilled);
  const fulfilledPurchases = purchases.filter(p => p.fulfilled);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-4 border-yellow-600 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <span className="text-yellow-800 font-bold text-2xl">M</span>
          </motion.div>
          <p className="text-gray-500 font-medium">loading the goods...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`fixed top-4 right-4 px-6 py-3 rounded-xl font-bold shadow-lg z-50 ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
            initial={{ opacity: 0, x: 100, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">back</span>
              </motion.button>
            </Link>

            <CoinBalance coins={balance} size="lg" showLabel />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src="/stickers/meedo-waving.svg"
              alt="Meedo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
            <h1 className="font-carrots text-5xl md:text-6xl text-gray-900">the meedo shop</h1>
            <Image
              src="/stickers/beedo-waving.svg"
              alt="Beedo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            spend those hard-earned coins on perks and treats
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'coupon', 'reward'] as FilterType[]).map(f => (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  filter === f
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                {f === 'all' ? 'all items' : f === 'coupon' ? 'coupons' : 'rewards'}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-500">sort:</label>
              <select
                id="sort"
                value={sort}
                onChange={e => setSort(e.target.value as SortType)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="price-low">price: low to high</option>
                <option value="price-high">price: high to low</option>
                <option value="name">name</option>
              </select>
            </div>

            {/* Purchases Toggle */}
            <motion.button
              onClick={() => setShowPurchases(!showPurchases)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                showPurchases
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              whileTap={{ scale: 0.97 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              my stuff ({purchases.length})
            </motion.button>
          </div>
        </div>

        {/* Purchase History Panel */}
        <AnimatePresence>
          {showPurchases && (
            <motion.div
              className="mb-8 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                <h2 className="font-carrots text-2xl mb-4 text-purple-900">your purchases</h2>

                {purchases.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-purple-600 font-medium">no purchases yet</p>
                    <p className="text-purple-400 text-sm">go buy something nice!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending section */}
                    {pendingPurchases.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">ready to claim</h3>
                        <div className="space-y-2">
                          {pendingPurchases.map(purchase => (
                            <motion.div
                              key={purchase.id}
                              className="flex items-center justify-between bg-white p-4 rounded-xl border border-purple-200 shadow-sm"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <span className="text-yellow-600 text-lg">
                                    {purchase.item?.type === 'coupon' ? '🎟' : '🎁'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-900">{purchase.item?.name}</span>
                                  <p className="text-gray-400 text-xs">
                                    {new Date(purchase.purchased_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                ready to use
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fulfilled section */}
                    {fulfilledPurchases.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">already claimed</h3>
                        <div className="space-y-2">
                          {fulfilledPurchases.map(purchase => (
                            <div
                              key={purchase.id}
                              className="flex items-center justify-between bg-white/50 p-4 rounded-xl border border-gray-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-gray-400 text-lg">
                                    {purchase.item?.type === 'coupon' ? '🎟' : '🎁'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">{purchase.item?.name}</span>
                                  <p className="text-gray-300 text-xs">
                                    {new Date(purchase.purchased_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                                claimed
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shop Items */}
        {filter === 'all' ? (
          <div className="space-y-12">
            {/* Coupons Section */}
            {coupons.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🎟</span>
                  </div>
                  <div>
                    <h2 className="font-carrots text-2xl text-gray-900">coupons</h2>
                    <p className="text-gray-400 text-sm">perks and privileges</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {coupons.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ShopItemCard
                        item={item}
                        userBalance={balance}
                        onPurchase={handlePurchase}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Small Rewards */}
            {smallRewards.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🍬</span>
                  </div>
                  <div>
                    <h2 className="font-carrots text-2xl text-gray-900">small treats</h2>
                    <p className="text-gray-400 text-sm">100-200 coins</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {smallRewards.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ShopItemCard
                        item={item}
                        userBalance={balance}
                        onPurchase={handlePurchase}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Medium Rewards */}
            {mediumRewards.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🎁</span>
                  </div>
                  <div>
                    <h2 className="font-carrots text-2xl text-gray-900">medium treats</h2>
                    <p className="text-gray-400 text-sm">300-500 coins</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mediumRewards.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ShopItemCard
                        item={item}
                        userBalance={balance}
                        onPurchase={handlePurchase}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Large Rewards */}
            {largeRewards.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">✨</span>
                  </div>
                  <div>
                    <h2 className="font-carrots text-2xl text-gray-900">big treats</h2>
                    <p className="text-gray-400 text-sm">1000+ coins - worth the grind</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {largeRewards.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ShopItemCard
                        item={item}
                        userBalance={balance}
                        onPurchase={handlePurchase}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Filtered view - flat grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ShopItemCard
                  item={item}
                  userBalance={balance}
                  onPurchase={handlePurchase}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">no items found</p>
            <p className="text-gray-400 text-sm">try a different filter</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-gray-400 text-sm">
            <span>earn coins by playing games</span>
            <span>|</span>
            <span>purchases fulfilled by meedo (or mod)</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
