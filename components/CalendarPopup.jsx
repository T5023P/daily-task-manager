"use client";

import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getDaysWithTasks } from '../lib/taskService';
import { useUid } from '../context/UserContext';

export default function CalendarPopup({ isOpen, onClose, selectedDate, onDateSelect }) {
  const uid = useUid();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const [daysWithTasks, setDaysWithTasks] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchTaskPresence = async () => {
        const monthStr = format(currentMonth, 'yyyy-MM');
        const days = await getDaysWithTasks(uid, monthStr);
        setDaysWithTasks(days);
      };
      fetchTaskPresence();
    }
  }, [isOpen, currentMonth, uid]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black">{format(currentMonth, 'MMMM')}</h2>
            <p className="opacity-80 font-bold">{format(currentMonth, 'yyyy')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-[#334155]">
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl transition-colors text-gray-600 dark:text-gray-400">
              <FiChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl transition-colors text-gray-600 dark:text-gray-400">
              <FiChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => {
              const today = new Date();
              setCurrentMonth(startOfMonth(today));
              onDateSelect(today);
              onClose();
            }}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Go to Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const hasTasks = daysWithTasks.includes(dateKey);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => { onDateSelect(day); onClose(); }}
                  className={`
                    relative h-12 flex flex-col items-center justify-center rounded-2xl transition-all
                    ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'hover:bg-gray-100 dark:hover:bg-[#273549]'}
                    ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                  `}
                >
                  <span className={`text-sm font-bold ${isTodayDate && !isSelected ? 'text-blue-600 dark:text-blue-400 underline decoration-2' : ''} ${!isSelected ? 'dark:text-gray-300' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {hasTasks && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
