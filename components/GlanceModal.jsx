"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { format } from 'date-fns';

const STATUS = {
  red: { label: 'Pending', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  yellow: { label: 'In Progress', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  green: { label: 'Done', dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
};

const PRIORITY = {
  high: { label: 'High', cls: 'bg-red-600 text-white' },
  medium: { label: 'Med', cls: 'bg-amber-500 text-white' },
  low: { label: 'Low', cls: 'bg-blue-600 text-white' },
};

export default function GlanceModal({ isOpen, onClose, tasks, selectedDate }) {
  const allTasks = Array.isArray(tasks) ? tasks : [];
  const norm = (t) => (STATUS[t.color] ? t.color : 'yellow');
  const prio = (t) => (PRIORITY[t.priority] ? t.priority : 'medium');

  const done = allTasks.filter((t) => norm(t) === 'green');
  const inProgress = allTasks.filter((t) => norm(t) === 'yellow');
  const pending = allTasks.filter((t) => norm(t) === 'red');

  const groups = [
    { key: 'red', title: '🔴 Pending', list: pending },
    { key: 'yellow', title: '🟡 In Progress', list: inProgress },
    { key: 'green', title: '🟢 Done', list: done },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[85vh] sm:max-w-lg bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl shadow-2xl z-[90] flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#334155] shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Tasks at a Glance</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedDate ? format(selectedDate, 'EEEE, d MMM yyyy') : ''}
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#273549] text-gray-500">
                <FiX size={20} />
              </button>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-2 p-4 shrink-0">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl py-2 text-center">
                <div className="text-xl font-black text-red-600 dark:text-red-400">{pending.length}</div>
                <div className="text-[10px] font-bold uppercase text-red-500/70">Pending</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl py-2 text-center">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">{inProgress.length}</div>
                <div className="text-[10px] font-bold uppercase text-amber-500/70">In Progress</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl py-2 text-center">
                <div className="text-xl font-black text-green-600 dark:text-green-400">{done.length}</div>
                <div className="text-[10px] font-bold uppercase text-green-500/70">Done</div>
              </div>
            </div>

            {/* Scrollable groups */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 sm:pb-4 flex flex-col gap-4 min-h-0">
              {allTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="text-4xl mb-3">📋</span>
                  <p className="text-sm font-medium">No tasks for this day</p>
                </div>
              )}
              {groups.map((g) => g.list.length > 0 && (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{g.title}</h3>
                    <span className="text-xs font-semibold text-gray-400">({g.list.length})</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {g.list.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-[#273549] border border-gray-100 dark:border-[#334155]"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS[norm(t)].dot}`} />
                        <span className={`flex-1 text-sm truncate ${norm(t) === 'green' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                          {t.text || t.name || 'Untitled'}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${PRIORITY[prio(t)].cls}`}>
                          {PRIORITY[prio(t)].label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
