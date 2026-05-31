"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiPlus, FiDollarSign } from 'react-icons/fi';
import OutstandingRow from './OutstandingRow';
import { getOutstandingCollections, addOutstandingCollection } from '../lib/taskService';
import { useUid } from '../context/UserContext';

export default function OutstandingSection({ colorClass, bgClass, onToast }) {
  const uid = useUid();
  const [isExpanded, setIsExpanded] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unpaid' | 'paid'

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsExpanded(true);
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsub = getOutstandingCollections(uid, (fetched) => {
      const sorted = [...fetched].sort((a, b) => {
        if (a.paid !== b.paid) return a.paid ? 1 : -1;
        return (a.saleDate || '').localeCompare(b.saleDate || '');
      });
      setItems(sorted);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [uid]);

  const totalOutstanding = items.filter(i => !i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalCleared = items.filter(i => i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const countAll = items.length;
  const countUnpaid = items.filter(i => !i.paid).length;
  const countPaid = items.filter(i => i.paid).length;

  const filteredItems = filter === 'all' ? items : filter === 'paid' ? items.filter(i => i.paid) : items.filter(i => !i.paid);

  const handleAdd = async () => {
    try {
      await addOutstandingCollection(uid, { name: '', amount: 0, saleDate: new Date().toISOString().slice(0, 10), remark: '' });
      setIsExpanded(true);
      if (onToast) onToast('Outstanding entry added', 'yellow');
    } catch (err) {
      if (onToast) onToast(err?.message || 'Failed to add entry', 'red');
    }
  };

  return (
    <div className={`rounded-2xl border-2 ${colorClass.border} overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none flex flex-col h-full dark:border-[#334155]`}>
      <div onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0}
        className={`w-full flex flex-col p-4 ${bgClass} dark:bg-[#273549] transition-colors select-none cursor-pointer`}>
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white dark:bg-[#1E293B] shadow-sm ${colorClass.text}`}><FiDollarSign size={20} /></div>
            <h2 className={`text-lg font-bold ${colorClass.text} dark:text-gray-200`}>Outstanding Collection</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300">
              {items.length} {items.length === 1 ? 'entry' : 'entries'}
            </span>
            <div className="text-gray-500 dark:text-gray-400">
              {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <div className="flex-1 bg-white/60 dark:bg-white/5 border border-rose-200 dark:border-rose-900 rounded-lg py-1.5 px-3 flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Outstanding</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">₹ {totalOutstanding.toLocaleString()}</span>
          </div>
          <div className="flex-1 bg-white/60 dark:bg-white/5 border border-green-200 dark:border-green-900 rounded-lg py-1.5 px-3 flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Collected</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">₹ {totalCleared.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-col flex-1 min-h-0 overflow-hidden">

            <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-1">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shrink-0 ${filter === 'all' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-[#273549] dark:text-gray-400'}`}>
                  All ({countAll})
                </button>
                <button onClick={() => setFilter('unpaid')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shrink-0 ${filter === 'unpaid' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  Unpaid ({countUnpaid})
                </button>
                <button onClick={() => setFilter('paid')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shrink-0 ${filter === 'paid' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                  Paid ({countPaid})
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
              >
                <FiPlus size={15} /> Add
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {filteredItems.map((item) => (
                      <OutstandingRow key={item.id} item={item} onToast={onToast} />
                    ))}
                  </AnimatePresence>
                  {items.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-8">
                      <span className="text-4xl mb-3">💰</span>
                      <p className="text-sm font-medium">No outstanding collections</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
