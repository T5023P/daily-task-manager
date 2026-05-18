"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfToday, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { FiCalendar, FiTarget } from 'react-icons/fi';
import CalendarPopup from './CalendarPopup';

export default function DateNavigator({ selectedDate, onDateChange }) {
  const [dates, setDates] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const scrollRef = useRef(null);
  const today = startOfToday();

  useEffect(() => {
    const initialDates = [];
    for (let i = -15; i <= 15; i++) {
      initialDates.push(addDays(today, i));
    }
    setDates(initialDates);
  }, []);

  useEffect(() => {
    if (dates.length > 0) {
      setTimeout(() => {
        const todayEl = document.getElementById('date-today');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100);
    }
  }, [dates.length === 0]);

  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    
    if (scrollLeft + clientWidth > scrollWidth - 100) {
      const lastDate = dates[dates.length - 1];
      const newFutureDates = [];
      for (let i = 1; i <= 14; i++) {
        newFutureDates.push(addDays(lastDate, i));
      }
      setDates(prev => [...prev, ...newFutureDates]);
    }
    
    if (scrollLeft < 100) {
      const firstDate = dates[0];
      const newPastDates = [];
      for (let i = 1; i <= 14; i++) {
        newPastDates.unshift(subDays(firstDate, i));
      }
      setDates(prev => [...newPastDates, ...prev]);
    }
  };

  const scrollToDate = (date) => {
    const dateId = `date-${format(date, 'yyyy-MM-dd')}`;
    const el = document.getElementById(dateId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } else {
      const newDates = [];
      for (let i = -15; i <= 15; i++) {
        newDates.push(addDays(date, i));
      }
      setDates(newDates);
      setTimeout(() => {
        const newEl = document.getElementById(dateId);
        if (newEl) newEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    }
  };

  const handleDateClick = (date) => {
    onDateChange(date);
    scrollToDate(date);
  };

  const goToToday = () => {
    onDateChange(today);
    scrollToDate(today);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="p-2.5 bg-white dark:bg-[#273549] shadow-sm border border-gray-100 dark:border-[#334155] rounded-xl text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#334155] transition-all active:scale-95"
            title="Open Calendar"
          >
            <FiCalendar size={20} />
          </button>
          <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
        </div>

        <button 
          onClick={goToToday}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-95 border border-blue-100 dark:border-blue-800"
        >
          <FiTarget size={14} />
          Today
        </button>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto no-scrollbar gap-2 px-4 pb-4 scroll-smooth touch-pan-x"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const dateId = `date-${format(date, 'yyyy-MM-dd')}`;
          const isTodayId = isTodayDate ? 'date-today' : dateId;

          return (
            <button
              key={date.toISOString()}
              id={isTodayId}
              onClick={() => handleDateClick(date)}
              className={`
                flex flex-col items-center justify-center min-w-[75px] h-24 rounded-3xl transition-all duration-300
                ${isSelected 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 -translate-y-1 scale-105' 
                  : isTodayDate
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-[#1E293B] text-gray-500 dark:text-[#94A3B8] border border-gray-100 dark:border-[#334155] hover:border-blue-200'
                }
              `}
              style={{ scrollSnapAlign: 'center' }}
            >
              <span className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${isSelected ? 'opacity-70' : 'text-gray-400 dark:text-[#94A3B8]'}`}>
                {format(date, 'EEE')}
              </span>
              <span className={`text-2xl font-black leading-none mb-1 ${!isSelected ? 'text-gray-800 dark:text-gray-200' : ''}`}>
                {format(date, 'd')}
              </span>
              <span className={`text-[9px] font-bold ${isSelected ? 'opacity-60' : 'text-gray-300 dark:text-gray-600'}`}>
                {format(date, 'MMM')}
              </span>
            </button>
          );
        })}
      </div>

      <CalendarPopup 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          onDateChange(date);
          scrollToDate(date);
        }}
      />
    </div>
  );
}
