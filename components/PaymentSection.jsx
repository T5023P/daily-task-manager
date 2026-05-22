"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import PaymentRow from './PaymentRow';
import MobilePaymentCard from './MobilePaymentCard';
import { addPayment } from '../lib/taskService';
import { useUid } from '../context/UserContext';

export default function PaymentSection({ 
  title, icon: Icon, colorClass, bgClass, tasks, dateStr,
  printSelection = {}, onPrintToggle, onToast
}) {
  const uid = useUid();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsExpanded(true);
    }
  }, []);

  useEffect(() => {
    setFilter('all');
  }, [dateStr]);

  const totalPending = tasks.filter(t => t.color !== 'green').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalReceived = tasks.filter(t => t.color === 'green').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const countAll = tasks.length;
  const countRed = tasks.filter(t => t.color === 'red').length;
  const countYellow = tasks.filter(t => t.color === 'yellow' || !t.color).length;
  const countGreen = tasks.filter(t => t.color === 'green').length;

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.color === filter || (filter === 'yellow' && !t.color));

  const handleAddPayment = async () => {
    await addPayment(uid, dateStr, { name: '', amount: '' });
    setIsExpanded(true);
    if (onToast) onToast('Payment entry added', 'yellow');
  };

  return (
    <div className={`rounded-2xl border-2 ${colorClass.border} overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none flex flex-col h-full dark:border-[#334155]`}>
      <div onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0}
        className={`w-full flex flex-col p-4 ${bgClass} dark:bg-[#273549] transition-colors select-none cursor-pointer`}>
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white dark:bg-[#1E293B] shadow-sm ${colorClass.text}`}><Icon size={20} /></div>
            <h2 className={`text-lg font-bold ${colorClass.text} dark:text-gray-200`}>{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300">
              {tasks.length} {tasks.length === 1 ? 'entry' : 'entries'}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleAddPayment(); }}
              className="hidden px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 items-center gap-1"
            >
              <FiPlus size={16} /> Add
            </button>
            <div className="text-gray-500 dark:text-gray-400">
              {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <div className="flex-1 bg-white/60 dark:bg-white/5 border border-purple-200 dark:border-purple-900 rounded-lg py-1.5 px-3 flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Pending</span>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-400">₹ {totalPending.toLocaleString()}</span>
          </div>
          <div className="flex-1 bg-white/60 dark:bg-white/5 border border-green-200 dark:border-green-900 rounded-lg py-1.5 px-3 flex flex-col items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Received Today</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">₹ {totalReceived.toLocaleString()}</span>
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

            {/* Mobile: compact 1-column list */}
            <div className="lg:hidden p-2 flex-1 flex flex-col gap-1.5 min-h-[80px]">
              <AnimatePresence>
                {filteredTasks.map(task => (
                  <MobilePaymentCard key={task.id} task={task} dateStr={dateStr}
                    isPrintSelected={!!printSelection[task.id]} onPrintToggle={onPrintToggle} onToast={onToast} />
                ))}
              </AnimatePresence>
              {tasks.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-6">
                  <span className="text-2xl mb-2">🎉</span>
                  <p className="text-xs font-medium">No pending payments</p>
                </div>
              )}
            </div>

            {/* Desktop: rich PaymentRow */}
            <div className="hidden lg:flex p-4 flex-1 flex-col gap-3 min-h-[120px] max-h-[560px] overflow-y-auto pr-2">
              <AnimatePresence>
                {filteredTasks.map(task => (
                  <PaymentRow key={task.id} task={task} dateStr={dateStr}
                    isPrintSelected={!!printSelection[task.id]} onPrintToggle={onPrintToggle} onToast={onToast} />
                ))}
              </AnimatePresence>
              {tasks.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-8">
                  <span className="text-4xl mb-3">🎉</span>
                  <p className="text-sm font-medium">No pending payments</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
