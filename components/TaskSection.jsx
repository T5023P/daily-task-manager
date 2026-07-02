"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import TaskRow from './TaskRow';
import MobileTaskCard from './MobileTaskCard';
import OutstandingSheet from './OutstandingSheet';
import { useBetaFeatures } from '../context/UserContext';

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
  onFilterChange,
  isCalendarOpen = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('tasks'); // 'tasks' | 'priority' | 'outstanding'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const betaFeatures = useBetaFeatures();

  // Non-beta users are always locked to the plain Tasks view
  const effectiveViewMode = betaFeatures ? viewMode : 'tasks';

  const [isHeaderButtonVisible, setIsHeaderButtonVisible] = useState(true);
  const headerButtonRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderButtonVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    const currentButton = headerButtonRef.current;
    if (currentButton) {
      observer.observe(currentButton);
    }

    return () => {
      if (currentButton) {
        observer.unobserve(currentButton);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExpanded(true);
    }
  }, []);

  const getPriority = (t) => t.priority || 'medium';

  const countAll = tasks.length;
  const countRed = tasks.filter(t => t.color === 'red').length;
  const countYellow = tasks.filter(t => t.color === 'yellow' || !t.color).length;
  const countGreen = tasks.filter(t => t.color === 'green').length;

  const countHigh = tasks.filter(t => getPriority(t) === 'high').length;
  const countMedium = tasks.filter(t => getPriority(t) === 'medium').length;
  const countLow = tasks.filter(t => getPriority(t) === 'low').length;

  const statusFilteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.color === filter || (filter === 'yellow' && !t.color));

  const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
  const sortByPriority = (list) =>
    [...list].sort((a, b) => (PRIORITY_RANK[getPriority(a)] ?? 1) - (PRIORITY_RANK[getPriority(b)] ?? 1));

  const filteredTasks = effectiveViewMode === 'priority'
    ? (priorityFilter === 'all' ? sortByPriority(tasks) : sortByPriority(tasks.filter(t => getPriority(t) === priorityFilter)))
    : statusFilteredTasks;
  const PRIORITY_META = {
    high: { label: 'High', chip: 'bg-red-600 text-white', idle: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    medium: { label: 'Medium', chip: 'bg-amber-500 text-white', idle: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    low: { label: 'Low', chip: 'bg-blue-600 text-white', idle: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  };

  return (
    <div className={`rounded-2xl border-2 ${colorClass.border} overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none flex flex-col min-h-0 dark:border-[#334155]`}>
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
          {/* Tasks <-> Priority <-> Outstanding toggle (beta users only) */}
          {betaFeatures && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center bg-white/70 dark:bg-[#1E293B] rounded-lg p-0.5 border border-gray-200 dark:border-[#334155] shadow-sm"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode('tasks'); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'tasks' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Tasks
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode('priority'); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'priority' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Priority
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode('outstanding'); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'outstanding' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Outstanding
            </button>
          </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            ref={headerButtonRef}
            onClick={(e) => { e.stopPropagation(); onAddClick(); }}
            className="flex px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 items-center gap-1"
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
            {/* Status Filters (Tasks mode, desktop only - mobile uses page-level chips) */}
            {effectiveViewMode === 'tasks' && (
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
            )}

            {/* Priority Filters (Priority mode, both mobile + desktop) */}
            {effectiveViewMode === 'priority' && (
            <div className="flex items-center gap-2 px-4 pt-4 pb-1 overflow-x-auto hide-scrollbar">
              <button onClick={() => setPriorityFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 ${priorityFilter === 'all' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-[#273549] dark:text-gray-400'}`}>
                All ({countAll})
              </button>
              <button onClick={() => setPriorityFilter('high')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 ${priorityFilter === 'high' ? PRIORITY_META.high.chip : PRIORITY_META.high.idle}`}>
                High ({countHigh})
              </button>
              <button onClick={() => setPriorityFilter('medium')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 ${priorityFilter === 'medium' ? PRIORITY_META.medium.chip : PRIORITY_META.medium.idle}`}>
                Medium ({countMedium})
              </button>
              <button onClick={() => setPriorityFilter('low')} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 ${priorityFilter === 'low' ? PRIORITY_META.low.chip : PRIORITY_META.low.idle}`}>
                Low ({countLow})
              </button>
            </div>
            )}

            {/* Mobile (< lg): compact 2-column grid */}
            {effectiveViewMode !== 'outstanding' && (
            <div className="lg:hidden grid grid-cols-2 gap-0.5 items-start min-h-0 auto-rows-min grid-flow-row dense">
                {filteredTasks.length > 0 ? (
                  <AnimatePresence>
                    {filteredTasks.map((task, idx) => (
                      <MobileTaskCard
                        key={task.id}
                        task={task}
                        index={idx}
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
            )}

            {/* Outstanding Collection spreadsheet (both mobile + desktop) */}
            {effectiveViewMode === 'outstanding' && (
              <OutstandingSheet onToast={onToast} />
            )}

            {/* Desktop (>= lg): unchanged TaskRow grid */}
            {effectiveViewMode !== 'outstanding' && (
            <div className="hidden lg:grid p-4 flex-1 grid-cols-1 md:grid-cols-2 gap-3 items-start min-h-0 grid-flow-row dense">
              {filteredTasks.length > 0 ? (
                <AnimatePresence>
                  {filteredTasks.map((task, idx) => (
                    <TaskRow 
                      key={task.id} 
                      task={task} 
                      index={idx}
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
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {sectionKey === 'A' && (
        <AnimatePresence>
          {!isHeaderButtonVisible && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onAddClick(); }}
              className={`fixed ${
                isCalendarOpen ? 'bottom-36' : 'bottom-6'
              } right-4 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-white hover:bg-gray-50 text-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 shadow-2xl font-bold text-xs sm:text-sm transition-all duration-300 select-none cursor-pointer`}
            >
              <FiPlus size={18} className="text-blue-600 dark:text-blue-400" />
              <span>Add Task</span>
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
