'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ShopItem as ShopItemType, User, Purchase } from '@/types/shop';
import ShopItemCard from '@/components/shop/ShopItem';
import CoinBalance from '@/components/shop/CoinBalance';

type FilterType = 'all' | 'coupon' | 'reward';
type SortType = 'price-low' | 'price-high' | 'name';

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
  const [notification, setNotification] = useState<string | null>(null);

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
        setNotification(`Purchased ${data.purchase.item?.name}!`);
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification(`Failed: ${data.error}`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      setNotification('Something went wrong');
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

  // Group by tier for rewards section
  const coupons = filteredItems.filter(item => item.type === 'coupon');
  const smallRewards = filteredItems.filter(item => item.type === 'reward' && item.tier === 'small');
  const mediumRewards = filteredItems.filter(item => item.type === 'reward' && item.tier === 'medium');
  const largeRewards = filteredItems.filter(item => item.type === 'reward' && item.tier === 'large');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          className="text-2xl font-carrots"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading the goods...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <motion.button
              className="px-4 py-2 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back
            </motion.button>
          </Link>

          <CoinBalance coins={balance} size="lg" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-carrots text-5xl mb-2">The Meedo Shop</h1>
          <p className="font-cheeky text-xl text-gray-600">
            spend those hard-earned coins on cool stuff
          </p>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg z-50"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {(['all', 'coupon', 'reward'] as FilterType[]).map(f => (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                  filter === f
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {f === 'all' ? 'All Items' : f === 'coupon' ? 'Coupons' : 'Rewards'}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortType)}
              className="px-3 py-2 rounded-xl border-2 border-gray-200 font-bold text-sm"
            >
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>

          <motion.button
            onClick={() => setShowPurchases(!showPurchases)}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-purple-100 text-purple-700 hover:bg-purple-200"
            whileTap={{ scale: 0.95 }}
          >
            {showPurchases ? 'Hide' : 'Show'} My Purchases ({purchases.length})
          </motion.button>
        </div>

        {/* Purchase History */}
        <AnimatePresence>
          {showPurchases && (
            <motion.div
              className="mb-8 p-6 bg-purple-50 rounded-2xl border-2 border-purple-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h2 className="font-carrots text-2xl mb-4">Your Purchases</h2>
              {purchases.length === 0 ? (
                <p className="text-gray-600">No purchases yet. Go buy something!</p>
              ) : (
                <div className="space-y-3">
                  {purchases.map(purchase => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between bg-white p-4 rounded-xl border border-purple-200"
                    >
                      <div>
                        <span className="font-bold">{purchase.item?.name}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {new Date(purchase.purchased_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          purchase.fulfilled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {purchase.fulfilled ? 'Claimed' : 'Ready to claim'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shop Items */}
        {filter === 'all' ? (
          <>
            {/* Coupons Section */}
            {coupons.length > 0 && (
              <section className="mb-12">
                <h2 className="font-carrots text-3xl mb-4 flex items-center gap-2">
                  <span className="text-pink-500">Coupons</span>
                  <span className="text-sm font-normal text-gray-500">(perks & privileges)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coupons.map(item => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      userBalance={balance}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Small Rewards */}
            {smallRewards.length > 0 && (
              <section className="mb-12">
                <h2 className="font-carrots text-3xl mb-4 flex items-center gap-2">
                  <span className="text-green-500">Small Treats</span>
                  <span className="text-sm font-normal text-gray-500">(100-200 coins)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {smallRewards.map(item => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      userBalance={balance}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Medium Rewards */}
            {mediumRewards.length > 0 && (
              <section className="mb-12">
                <h2 className="font-carrots text-3xl mb-4 flex items-center gap-2">
                  <span className="text-blue-500">Medium Treats</span>
                  <span className="text-sm font-normal text-gray-500">(300-500 coins)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mediumRewards.map(item => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      userBalance={balance}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Large Rewards */}
            {largeRewards.length > 0 && (
              <section className="mb-12">
                <h2 className="font-carrots text-3xl mb-4 flex items-center gap-2">
                  <span className="text-purple-500">Big Treats</span>
                  <span className="text-sm font-normal text-gray-500">(1000+ coins)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {largeRewards.map(item => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      userBalance={balance}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* Filtered view */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <ShopItemCard
                key={item.id}
                item={item}
                userBalance={balance}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl">No items found</p>
            <p className="text-sm">Try a different filter</p>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Earn Meedo Coins by playing games!</p>
          <p className="mt-1">Purchases are reviewed and fulfilled by Meedo (or Mod, if busy)</p>
        </div>
      </div>
    </div>
  );
}
