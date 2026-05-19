"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import TaskRow from './TaskRow';
import MobileTaskCard from './MobileTaskCard';

const EMPTY_STATES = {
  A: { emoji: '📋', msg: "No daily tasks yet — add your first task!" },
  B: { emoji: '📝', msg: "Section B is empty" },
  default: { emoji: '📄', msg: "No tasks here yet." }
};

export default function TaskSection({ 
  title, 
  icon: Icon, 
  colorClass, 
  bgClass,
  tasks, 
  dateStr, 
  onAddClick,
  sectionKey = 'default',
  printSelection = {},
  onPrintToggle,
  onToast,
  filter = 'all',
  onFilterChange
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsExpanded(true);
    }
  }, []);

  const countAll = tasks.length;
  const countRed = tasks.filter(t => t.color === 'red').length;
  const countYellow = tasks.filter(t => t.color === 'yellow' || !t.color).length;
  const countGreen = tasks.filter(t => t.color === 'green').length;

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.color === filter || (filter === 'yellow' && !t.color));

  return (
    <div className={`rounded-2xl border-2 ${colorClass.border} overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none flex flex-col h-full dark:border-[#334155]`}>
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        className={`w-full flex items-center justify-between p-4 ${bgClass} dark:bg-[#273549] transition-colors select-none cursor-pointer`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white dark:bg-[#1E293B] shadow-sm ${colorClass.text}`}>
            <Icon size={20} />
          </div>
          <h2 className={`text-lg font-bold ${colorClass.text} dark:text-gray-200`}>{title}</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onAddClick(); }}
            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 flex items-center gap-1"
          >
            <FiPlus size={16} /> Add Task
          </button>
          <div className="text-gray-500 dark:text-gray-400">
            {isExpanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Filters (hidden on mobile - mobile uses page-level chips) */}
            <div className="hidden lg:flex items-center gap-2 px-4 pt-4 pb-1 overflow-x-auto hide-scrollbar">
              <button onClick={() => onFilterChange('all')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'all' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-[#273549] dark:text-gray-400'}`}>
                All ({countAll})
              </button>
              <button onClick={() => onFilterChange('red')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'red' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'}`}>
                🔴 Red ({countRed})
              </button>
              <button onClick={() => onFilterChange('yellow')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'yellow' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'}`}>
                🟡 Yellow ({countYellow})
              </button>
              <button onClick={() => onFilterChange('green')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${filter === 'green' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'}`}>
                🟢 Green ({countGreen})
              </button>
            </div>

            {/* Mobile (< lg): compact 2-column grid */}
            <div className="lg:hidden p-2 flex-1 grid grid-cols-2 gap-1.5 items-start min-h-[120px]">
              {filteredTasks.length > 0 ? (
                <AnimatePresence>
                  {filteredTasks.map(task => (
                    <MobileTaskCard
                      key={task.id}
                      task={task}
                      dateStr={dateStr}
                      isPrintSelected={!!printSelection[task.id]}
                      onPrintToggle={onPrintToggle}
                      onToast={onToast}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 min-h-[120px]">
                  <span className="text-3xl mb-3">{EMPTY_STATES.default.emoji}</span>
                  <p className="text-xs font-medium">{EMPTY_STATES.default.msg}</p>
                </div>
              )}
            </div>

            {/* Desktop (>= lg): unchanged TaskRow grid */}
            <div className="hidden lg:grid p-4 flex-1 grid-cols-1 md:grid-cols-2 gap-3 items-start min-h-[120px]">
              {filteredTasks.length > 0 ? (
                <AnimatePresence>
                  {filteredTasks.map(task => (
                    <TaskRow 
                      key={task.id} 
                      task={task} 
                      dateStr={dateStr} 
                      isPrintSelected={!!printSelection[task.id]}
                      onPrintToggle={onPrintToggle}
                      onToast={onToast}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div className="col-span-1 md:col-span-2 flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 min-h-[150px]">
                  <span className="text-3xl mb-3">{EMPTY_STATES.default.emoji}</span>
                  <p className="text-sm font-medium">{EMPTY_STATES.default.msg}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
