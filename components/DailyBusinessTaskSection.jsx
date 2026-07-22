/**
 * ============================================================================
 * ⚠️  ADMIN-ONLY FEATURE — DAILY BUSINESS TASKS SECTION (Section Key: "E")
 * ============================================================================
 *
 * PURPOSE:
 *   This component renders a second, independent daily task list that is
 *   separate from the main "BUSINESS TASK" section (section A/B) and from
 *   payment/long-term sections (C/D).
 *
 *   It is ONLY visible to admin emails:
 *     - arsh5023siddiqui@gmail.com
 *     - topsecuritieslko@gmail.com
 *
 * WHY THIS EXISTS (DO NOT REMOVE):
 *   The admin users wanted a second daily task list on the same page that can
 *   be collapsed independently from the first list. A user who wants to focus
 *   on the first list can collapse this one, and vice versa.
 *
 * SECTION KEY:
 *   This uses section = "E" so tasks stored here do NOT mix with:
 *     - Section A/B  → Main Business Tasks
 *     - Section C    → Payments
 *     - Section D    → Long-Term Orders
 *
 * ⚠️  FUTURE DEVELOPER WARNING:
 *   DO NOT merge, remove, or rename this section without explicit approval
 *   from the admin users. This feature is intentionally isolated to avoid
 *   interference with the main task list. If you are adding new features or
 *   modifying existing ones, make sure your changes do NOT affect this
 *   component or section key "E" tasks unless specifically asked to.
 *
 * COLLAPSE BEHAVIOR:
 *   This section manages its own expanded/collapsed state independently.
 *   The parent page also provides collapsibility for the main BUSINESS TASK
 *   section. Both can be toggled without affecting each other.
 *
 * Created: July 2026
 * ============================================================================
 */

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import TaskRow from './TaskRow';
import MobileTaskCard from './MobileTaskCard';

/**
 * ADMIN-ONLY: Empty state messages for the Daily Business Tasks section.
 * Kept separate from main TaskSection empty states to avoid cross-contamination.
 */
const EMPTY_STATE = {
  emoji: '📝',
  msg: "No daily business tasks yet — add your first one!"
};

/**
 * DailyBusinessTaskSection
 *
 * A collapsible task section that works exactly like the main TaskSection
 * but is isolated under section key "E". Only rendered when `isAdmin` is true
 * in the parent page.
 *
 * Props:
 *   - title: string — Section header title
 *   - icon: React component — Icon component (e.g., FiClipboard)
 *   - colorClass: { border: string, text: string } — Tailwind color classes
 *   - bgClass: string — Background class for the header
 *   - tasks: array — Array of task objects (already filtered to section "E" by parent)
 *   - dateStr: string — Current date string (yyyy-MM-dd)
 *   - onAddClick: function — Callback to open the AddTaskModal with section "E"
 *   - printSelection: object — Map of taskId → boolean for print selection
 *   - onPrintToggle: function — Callback to toggle print selection for a task
 *   - onToast: function — Callback to show toast messages
 *   - filter: string — Current color filter ('all' | 'red' | 'yellow' | 'green')
 *   - onFilterChange: function — Callback to change the color filter
 *   - isCalendarOpen: boolean — Whether the bottom calendar is expanded
 */
export default function DailyBusinessTaskSection({
  title,
  icon: Icon,
  colorClass,
  bgClass,
  tasks,
  dateStr,
  onAddClick,
  printSelection = {},
  onPrintToggle,
  onToast,
  filter = 'all',
  onFilterChange,
  isCalendarOpen = false,
}) {
  /**
   * ADMIN-ONLY: Independent collapse state for this section.
   * This is NOT shared with the main BUSINESS TASK section — each section
   * manages its own expanded/collapsed state so users can independently
   * collapse either one.
   */
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * On desktop (>= lg), auto-expand this section on mount.
   * On mobile, keep it collapsed by default so it doesn't overwhelm the view.
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsExpanded(true);
    }
  }, []);

  // ---- Counts for status filter chips ----
  const countAll = tasks.length;
  const countRed = tasks.filter(t => t.color === 'red').length;
  const countYellow = tasks.filter(t => t.color === 'yellow' || !t.color).length;
  const countGreen = tasks.filter(t => t.color === 'green').length;

  // ---- Apply color filter ----
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.color === filter || (filter === 'yellow' && !t.color));

  return (
    <div className={`rounded-2xl border-2 ${colorClass.border} overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none flex flex-col min-h-0 dark:border-[#334155]`}>
      {/* ================================================================
          HEADER — Clickable to expand/collapse this section independently
          ================================================================ */}
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
          {/* Add Task button — opens AddTaskModal with section "E" */}
          <button
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

      {/* ================================================================
          CONTENT — Animated expand/collapse, independent from other sections
          ================================================================ */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* ============================================================
                STATUS FILTER CHIPS — Desktop only (mobile uses page-level)
                This mirrors the main TaskSection filter but operates on
                section "E" tasks independently.
                ============================================================ */}
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

            {/* ============================================================
                MOBILE LAYOUT (< lg): Compact 2-column grid of MobileTaskCards
                ============================================================ */}
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
                  <span className="text-3xl mb-3">{EMPTY_STATE.emoji}</span>
                  <p className="text-xs font-medium">{EMPTY_STATE.msg}</p>
                </div>
              )}
            </div>

            {/* ============================================================
                DESKTOP LAYOUT (>= lg): Standard TaskRow grid
                ============================================================ */}
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
                  <span className="text-3xl mb-3">{EMPTY_STATE.emoji}</span>
                  <p className="text-sm font-medium">{EMPTY_STATE.msg}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
