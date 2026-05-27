"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { updateTask, deleteTask } from '../lib/taskService';
import { useUid } from '../context/UserContext';

const TIME_OPTIONS = ["15 min", "30 min", "1 hour", "2 hours", "Today EOD", "Custom date"];

const getLocalTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCustomDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

const PaymentRow = memo(function PaymentRow({ task, dateStr, isPrintSelected, onPrintToggle, onToast }) {
  const uid = useUid();
  const [name, setName] = useState(task.name || '');
  const [amount, setAmount] = useState(task.amount || '');
  const [expectedTime, setExpectedTime] = useState(task.expectedTime || 'Today EOD');
  const [customDueDate, setCustomDueDate] = useState(task.customDueDate || '');
  const [isHovered, setIsHovered] = useState(false);
  const nameRef = useRef(null);
  const amountRef = useRef(null);

  useEffect(() => {
    setName(task.name || '');
    setAmount(task.amount || '');
    setExpectedTime(task.expectedTime || 'Today EOD');
    setCustomDueDate(task.customDueDate || '');
  }, [task.name, task.amount, task.expectedTime, task.customDueDate]);

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setExpectedTime(val);
    if (val === 'Custom date') {
      const today = getLocalTodayStr();
      const initialDate = customDueDate || today;
      setCustomDueDate(initialDate);
      updateTask(uid, dateStr, task.id, { expectedTime: val, customDueDate: initialDate });
    } else {
      updateTask(uid, dateStr, task.id, { expectedTime: val, customDueDate: null });
    }
  };

  const saveUpdates = () => {
    updateTask(uid, dateStr, task.id, { 
      name: name.trim(), text: name.trim() || 'New Payment', 
      amount: Number(amount) || 0, expectedTime, customDueDate 
    });
  };

  const handleKeyDown = (e, ref) => { if (e.key === 'Enter') ref.current?.blur(); };

  const toggleStatus = () => {
    const newColor = task.color === 'green' ? 'red' : 'green';
    updateTask(uid, dateStr, task.id, { color: newColor });
    if (onToast) onToast(newColor === 'green' ? 'Payment received ✅' : 'Marked unpaid', newColor);
  };

  const handleDelete = () => {
    deleteTask(uid, dateStr, task.id);
    if (onToast) onToast('Payment deleted', 'red');
  };

  const isReceived = task.color === 'green';

  if (isReceived) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
        onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
        className={`relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl shadow-sm transition-[background-color,border-color,box-shadow,ring] duration-300 border-l-[8px] bg-green-100/40 dark:bg-[#052E16]/40 border-l-[#22C55E] hover:shadow-md dark:border dark:border-[#334155] gap-3 ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Print checkbox */}
          <label className="shrink-0 flex items-center cursor-pointer print:hidden">
            <input type="checkbox" checked={isPrintSelected || false}
              onChange={() => onPrintToggle && onPrintToggle(task.id)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-[#273549] cursor-pointer" />
          </label>

          <span className="text-[15px] font-medium text-gray-500 dark:text-gray-400 line-through truncate">
            {name || 'Unnamed'}
          </span>
          
          <span className="text-[14px] font-bold text-green-600 dark:text-green-400 shrink-0">
            ₹{(Number(amount) || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={toggleStatus}
            className="px-3.5 py-1 rounded-lg font-bold text-xs shadow-sm bg-[#22C55E] text-white border-2 border-[#22C55E] hover:bg-green-600 flex items-center gap-1.5">
            Received <span className="text-sm leading-none">🟢</span>
          </button>
          
          <button onClick={handleDelete}
            className={`p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-100 sm:opacity-0 sm:scale-75'}`}
            aria-label="Delete payment">
            <FiTrash2 size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  const rowStyles = 'bg-purple-100/60 dark:bg-[#2E1065] border-l-[#A855F7]';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-col p-2 sm:p-2.5 rounded-xl shadow-sm transition-[background-color,border-color,box-shadow,ring] duration-300 border-l-[6px] ${rowStyles} hover:shadow-md gap-2 dark:border dark:border-[#334155] ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      {/* Row 1: Checkbox + Name + Amount + Delete button */}
      <div className="flex items-center gap-2 w-full">
        {/* Print checkbox */}
        <label className="shrink-0 flex items-center cursor-pointer print:hidden">
          <input type="checkbox" checked={isPrintSelected || false}
            onChange={() => onPrintToggle && onPrintToggle(task.id)}
            className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-[#273549] cursor-pointer" />
        </label>

        <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)}
          onBlur={saveUpdates} onKeyDown={(e) => handleKeyDown(e, nameRef)} placeholder="Person Name"
          className="flex-1 bg-white/50 dark:bg-white/5 px-2.5 py-1 rounded-lg outline-none text-sm transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 focus:ring-purple-400 text-gray-800 dark:text-gray-100 font-medium placeholder-gray-400 dark:placeholder-gray-500" />

        <div className="relative w-24 sm:w-28 shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs font-medium">₹</span>
          <input ref={amountRef} type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            onBlur={saveUpdates} onKeyDown={(e) => handleKeyDown(e, amountRef)} placeholder="Amount"
            className="w-full bg-white/50 dark:bg-white/5 pl-5 pr-2 py-1 rounded-lg outline-none text-sm transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 focus:ring-purple-400 text-gray-800 dark:text-gray-100 font-semibold placeholder-gray-400 dark:placeholder-gray-500" />
        </div>

        <button onClick={handleDelete}
          className={`shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-100 sm:opacity-0 sm:scale-75'}`}
          aria-label="Delete payment"><FiTrash2 size={15} /></button>
      </div>

      {/* Row 2: Expected Time select + Custom date picker + Status Button */}
      <div className="flex items-center justify-between gap-2 w-full pl-5.5 sm:pl-6">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <select value={expectedTime} onChange={handleTimeChange}
            className="bg-white/50 dark:bg-white/5 px-2 py-1 rounded-lg outline-none text-xs transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 focus:ring-purple-400 cursor-pointer text-gray-700 dark:text-gray-200 shrink-0">
            {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {expectedTime === 'Custom date' && (
            <input 
              type="date"
              value={customDueDate}
              min={getLocalTodayStr()}
              onChange={(e) => {
                setCustomDueDate(e.target.value);
                updateTask(uid, dateStr, task.id, { customDueDate: e.target.value });
              }}
              className="bg-white/50 dark:bg-white/5 px-2 py-1 rounded-lg outline-none text-xs transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 focus:ring-purple-400 cursor-pointer text-gray-700 dark:text-gray-200 w-28 sm:w-32"
            />
          )}
        </div>

        <button onClick={toggleStatus}
          className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border bg-white dark:bg-[#273549] text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm transition-all duration-300">
          Unpaid
        </button>
      </div>
    </motion.div>
  );
});

export default PaymentRow;
