"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { updateLongTermOrder, deleteLongTermOrder } from '../lib/taskService';
import { useUid } from '../context/UserContext';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';

const LongTermOrderRow = memo(function LongTermOrderRow({ order, dateStr, isPrintSelected, onPrintToggle, onToast }) {
  const uid = useUid();
  const [text, setText] = useState(order.text || '');
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate || '');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setText(order.text || '');
    setDeliveryDate(order.deliveryDate || '');
  }, [order.text, order.deliveryDate]);

  const handleTextSave = () => {
    if (text !== order.text) updateLongTermOrder(uid, order.id, { text: text.trim() }, dateStr);
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    setDeliveryDate(val);
    updateLongTermOrder(uid, order.id, { deliveryDate: val }, dateStr);
  };

  const handleColorChange = (color) => {
    if (order.color !== color) {
      updateLongTermOrder(uid, order.id, { color }, dateStr);
      if (onToast) {
        const labels = { red: 'Pending', yellow: 'In Progress', green: 'Completed' };
        onToast(`Order → ${labels[color]}`, color);
      }
    }
  };

  const handleDelete = () => {
    deleteLongTermOrder(uid, order.id);
    if (onToast) onToast('Order deleted', 'red');
  };

  const today = startOfToday();
  let daysRemaining = null, isOverdue = false, isUrgent = false;
  if (deliveryDate) {
    try {
      const target = parseISO(deliveryDate);
      daysRemaining = differenceInDays(target, today);
      isOverdue = daysRemaining < 0;
      isUrgent = daysRemaining >= 0 && daysRemaining <= 3;
    } catch { daysRemaining = null; }
  }

  const colorConfig = {
    red: { bg: 'bg-red-100/60 dark:bg-[#450A0A]', border: 'border-l-[#EF4444]', button: 'bg-[#EF4444]', label: 'Pending', shadow: 'shadow-[0_0_14px_rgba(239,68,68,0.5)]' },
    yellow: { bg: 'bg-yellow-100/60 dark:bg-[#422006]', border: 'border-l-[#F59E0B]', button: 'bg-[#F59E0B]', label: 'In Progress', shadow: 'shadow-[0_0_14px_rgba(245,158,11,0.5)]' },
    green: { bg: 'bg-green-100/60 dark:bg-[#052E16]', border: 'border-l-[#22C55E]', button: 'bg-[#22C55E]', label: 'Completed', shadow: 'shadow-[0_0_14px_rgba(34,197,94,0.5)]' }
  };

  const activeColor = colorConfig[order.color] ? order.color : 'red';
  const currentConfig = colorConfig[activeColor];
  const isCompleted = activeColor === 'green';

  return (
    <motion.div layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-col p-4 rounded-xl shadow-sm transition-colors duration-500 border-l-[8px] ${currentConfig.border} ${currentConfig.bg} hover:shadow-md gap-3 dark:border dark:border-[#334155] ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Print checkbox */}
        <label className="shrink-0 flex items-center cursor-pointer print:hidden mt-1">
          <input type="checkbox" checked={isPrintSelected || false}
            onChange={() => onPrintToggle && onPrintToggle(order.id)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-[#273549] cursor-pointer" />
        </label>

        <div className="flex-1">
          <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
            onBlur={handleTextSave} onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.blur()}
            placeholder="Order description..."
            className={`w-full bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-lg outline-none text-[15px] font-medium transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 focus:ring-orange-400 ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`} />
        </div>

        {deliveryDate && daysRemaining !== null && (
          <div className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex flex-col items-center min-w-[70px] ${
            isCompleted ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
            : isOverdue ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 animate-pulse'
            : isUrgent ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
          }`}>
            <span className="text-lg leading-none font-black">{isOverdue ? Math.abs(daysRemaining) : daysRemaining}</span>
            <span className="text-[10px] uppercase mt-0.5">
              {isCompleted ? 'Done ✓' : isOverdue ? 'Overdue!' : daysRemaining === 0 ? 'Today!' : daysRemaining === 1 ? 'Day Left' : 'Days Left'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Deliver by:</span>
          <input type="date" value={deliveryDate} onChange={handleDateChange}
            className="bg-white/50 dark:bg-white/5 px-2 py-1 rounded-lg outline-none text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-400 focus:bg-white dark:focus:bg-[#273549] transition-all cursor-pointer" />
        </div>

        <div className="flex items-center gap-3">
          {['red', 'yellow', 'green'].map((c) => {
            const isActive = activeColor === c;
            const config = colorConfig[c];
            return (
              <div key={c} className="flex flex-col items-center gap-0.5">
                <button onClick={() => handleColorChange(c)}
                  className={`rounded-full transition-all duration-300 ease-out ${config.button} ${
                    isActive ? `w-8 h-8 ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-gray-300 dark:ring-gray-500 ${config.shadow} scale-120` 
                    : 'w-5 h-5 opacity-40 hover:opacity-80 hover:scale-110'
                  }`}
                  style={{ minWidth: isActive ? '32px' : '20px', minHeight: isActive ? '32px' : '20px' }}
                  aria-label={`Set status to ${config.label}`} />
                <span className={`text-[9px] font-bold transition-all duration-300 ${isActive ? 'text-gray-600 dark:text-gray-300 opacity-100' : 'opacity-0'}`}>
                  {isActive ? config.label : '\u00A0'}
                </span>
              </div>
            );
          })}
        </div>

        <button onClick={handleDelete}
          className={`p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'sm:opacity-0 sm:scale-75'}`}
          aria-label="Delete order"><FiTrash2 size={18} /></button>
      </div>
    </motion.div>
  );
});

export default LongTermOrderRow;
