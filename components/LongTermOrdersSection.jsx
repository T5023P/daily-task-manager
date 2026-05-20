"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';
import LongTermOrderRow from './LongTermOrderRow';
import { getLongTermOrders, addLongTermOrder, updateLongTermOrder } from '../lib/taskService';
import { useUid } from '../context/UserContext';

export default function LongTermOrdersSection({ 
  title, icon: Icon, colorClass, bgClass, dateStr,
  printSelection = {}, onPrintToggle, onToast
}) {
  const uid = useUid();
  const [isExpanded, setIsExpanded] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderText, setOrderText] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderColor, setOrderColor] = useState('red');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsExpanded(true);
    }
  }, []);

  useEffect(() => {
    setFilter('all');
  }, [dateStr]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getLongTermOrders(uid, dateStr, (fetchedOrders) => {
      const today = startOfToday();
      const sorted = [...fetchedOrders].sort((a, b) => {
        const daysA = a.deliveryDate ? differenceInDays(parseISO(a.deliveryDate), today) : 9999;
        const daysB = b.deliveryDate ? differenceInDays(parseISO(b.deliveryDate), today) : 9999;
        if (a.color === 'green' && b.color !== 'green') return 1;
        if (a.color !== 'green' && b.color === 'green') return -1;
        return daysA - daysB;
      });
      setOrders(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dateStr, uid]);

  const countAll = orders.length;
  const countRed = orders.filter(o => o.color === 'red').length;
  const countYellow = orders.filter(o => o.color === 'yellow' || !o.color).length;
  const countGreen = orders.filter(o => o.color === 'green').length;

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.color === filter || (filter === 'yellow' && !o.color));

  const handleAddOrder = () => {
    setOrderText('');
    setDeliveryDate('');
    setOrderColor('red');
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderText.trim() || !deliveryDate) return;
    
    try {
      await addLongTermOrder(uid, { 
        text: orderText.trim(), 
        deliveryDate: deliveryDate 
      });

      if (orderColor !== 'red') {
        const unsubscribe = getLongTermOrders(uid, dateStr, (fetchedOrders) => {
          const newlyAdded = fetchedOrders.find(
            o => o.text === orderText.trim() && o.color === 'red' && o.deliveryDate === deliveryDate
          );
          if (newlyAdded) {
            unsubscribe();
            updateLongTermOrder(uid, newlyAdded.id, { color: orderColor }, dateStr);
          }
        });
        setTimeout(() => {
          try { unsubscribe(); } catch (err) {}
        }, 5000);
      }

      setIsModalOpen(false);
      setIsExpanded(true);
      if (onToast) onToast('New order added', 'green');
    } catch (error) {
      console.error("Failed to add order:", error);
    }
  };

  const today = startOfToday();
  const urgentCount = orders.filter(o => {
    if (o.color === 'green' || !o.deliveryDate) return false;
    try { return differenceInDays(parseISO(o.deliveryDate), today) <= 3; } catch { return false; }
  }).length;

  return (
    <div className={`rounded-2xl border-2 ${colorClass.border} overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none flex flex-col h-full dark:border-[#334155]`}>
      <div onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0}
        className={`w-full flex items-center justify-between p-4 ${bgClass} dark:bg-[#273549] transition-colors select-none cursor-pointer`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white dark:bg-[#1E293B] shadow-sm ${colorClass.text}`}><Icon size={20} /></div>
          <h2 className={`text-lg font-bold ${colorClass.text} dark:text-gray-200`}>{title}</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
          {urgentCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold animate-pulse">
              🔴 {urgentCount} urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleAddOrder(); }}
            className="hidden px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 items-center gap-1"
          >
            <FiPlus size={16} /> Add Order
          </button>
          <div className="text-gray-500 dark:text-gray-400">
            {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-col flex-1 overflow-hidden">
            
            {/* Filters */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-1 overflow-x-auto hide-scrollbar">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'all' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-[#273549] dark:text-gray-400'}`}>
                All ({countAll})
              </button>
              <button onClick={() => setFilter('red')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'red' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'}`}>
                🔴 Red ({countRed})
              </button>
              <button onClick={() => setFilter('yellow')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'yellow' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'}`}>
                🟡 Yellow ({countYellow})
              </button>
              <button onClick={() => setFilter('green')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'green' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'}`}>
                🟢 Green ({countGreen})
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-3 min-h-[120px]">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {filteredOrders.map(order => (
                      <LongTermOrderRow key={order.id} order={order} dateStr={dateStr}
                        isPrintSelected={!!printSelection[order.id]} onPrintToggle={onPrintToggle} onToast={onToast} />
                    ))}
                  </AnimatePresence>
                  {orders.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-8">
                      <span className="text-4xl mb-3">📦</span>
                      <p className="text-sm font-medium">No long-term orders</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-md bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl z-[60] flex flex-col gap-4"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto sm:hidden mb-2" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                📦 Add Long Term Order
              </h3>
              
              <form onSubmit={handleSaveOrder} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Order Description</label>
                  <input 
                    type="text"
                    value={orderText}
                    onChange={(e) => setOrderText(e.target.value)}
                    placeholder="Enter order details..."
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#334155] dark:bg-[#273549] dark:text-gray-100 focus:ring-2 focus:ring-orange-400 outline-none text-base transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Expected Date</label>
                  <input 
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#334155] dark:bg-[#273549] dark:text-gray-100 focus:ring-2 focus:ring-orange-400 outline-none text-base transition-all cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Status</label>
                  <div className="flex justify-around items-center gap-4 bg-gray-50 dark:bg-[#273549]/50 p-3 rounded-xl border border-gray-100 dark:border-[#334155]">
                    {[
                      { color: 'red', label: 'Pending', icon: '🔴' },
                      { color: 'yellow', label: 'In Progress', icon: '🟡' },
                      { color: 'green', label: 'Completed', icon: '🟢' }
                    ].map((status) => {
                      const isActive = orderColor === status.color;
                      return (
                        <button
                          key={status.color}
                          type="button"
                          onClick={() => setOrderColor(status.color)}
                          className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                            isActive 
                              ? 'bg-white dark:bg-[#1E293B] shadow-md border border-gray-100 dark:border-gray-700 scale-105' 
                              : 'opacity-50 hover:opacity-80'
                          }`}
                        >
                          <span className="text-lg leading-none">{status.icon}</span>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{status.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!orderText.trim() || !deliveryDate}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md flex-1 sm:flex-none"
                  >
                    Save Order
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
