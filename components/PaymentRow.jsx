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
        layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
        onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
        className={`relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl shadow-sm transition-colors duration-500 border-l-[8px] bg-green-100/40 dark:bg-[#052E16]/40 border-l-[#22C55E] hover:shadow-md dark:border dark:border-[#334155] gap-3 ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
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
      layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-col p-3 sm:p-4 rounded-xl shadow-sm transition-colors duration-500 border-l-[8px] ${rowStyles} hover:shadow-md gap-3 dark:border dark:border-[#334155] ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      {/* Row 1: Checkbox + Name + Delete button */}
      <div className="flex items-center gap-3 w-full">
        {/* Print checkbox */}
        <label className="shrink-0 flex items-center cursor-pointer print:hidden">
          <input type="checkbox" checked={isPrintSelected || false}
            onChange={() => onPrintToggle && onPrintToggle(task.id)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-[#273549] cursor-pointer" />
        </label>

        <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)}
          onBlur={saveUpdates} onKeyDown={(e) => handleKeyDown(e, nameRef)} placeholder="Person Name"
          className={`flex-1 bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-lg outline-none text-[15px] transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 ${isReceived ? 'focus:ring-green-400 text-gray-600 dark:text-gray-400' : 'focus:ring-purple-400 text-gray-800 dark:text-gray-100 font-medium'}`} />

        <button onClick={handleDelete}
          className={`shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-100 sm:opacity-0 sm:scale-75'}`}
          aria-label="Delete payment"><FiTrash2 size={18} /></button>
      </div>

      {/* Row 2: Amount + Expected Time */}
      <div className="grid grid-cols-2 gap-3 w-full pl-7 pr-8">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">₹</span>
          <input ref={amountRef} type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            onBlur={saveUpdates} onKeyDown={(e) => handleKeyDown(e, amountRef)} placeholder="Amount"
            className={`w-full bg-white/50 dark:bg-white/5 pl-7 pr-3 py-1.5 rounded-lg outline-none text-[15px] transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 ${isReceived ? 'focus:ring-green-400 text-gray-600 dark:text-gray-400' : 'focus:ring-purple-400 text-gray-800 dark:text-gray-100 font-semibold'}`} />
        </div>

        <select value={expectedTime} onChange={handleTimeChange}
          className={`w-full bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-lg outline-none text-[15px] transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 cursor-pointer ${isReceived ? 'focus:ring-green-400 text-gray-500 dark:text-gray-400' : 'focus:ring-purple-400 text-gray-700 dark:text-gray-200'}`}>
          {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      {/* Row 3: Custom Date Picker (if active) */}
      {expectedTime === 'Custom date' && (
        <div className="w-full pl-7 pr-8">
          <input 
            type="date"
            value={customDueDate}
            min={getLocalTodayStr()}
            onChange={(e) => {
              setCustomDueDate(e.target.value);
              updateTask(uid, dateStr, task.id, { customDueDate: e.target.value });
            }}
            className={`w-full bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-lg outline-none text-[15px] transition-all focus:bg-white dark:focus:bg-[#273549] focus:ring-2 cursor-pointer ${isReceived ? 'focus:ring-green-400 text-gray-500 dark:text-gray-400' : 'focus:ring-purple-400 text-gray-700 dark:text-gray-200'}`}
          />
        </div>
      )}

      {/* Row 4: Status Indicator and Due Date */}
      <div className="flex items-center justify-between w-full pl-7 pr-8 border-t border-purple-200/20 dark:border-[#334155]/30 pt-2 mt-1">
        <div>
          {expectedTime === 'Custom date' && customDueDate ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-black/5 dark:border-white/5">
              Due: {formatCustomDate(customDueDate)}
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
              Payment Status
            </span>
          )}
        </div>

        <button onClick={toggleStatus}
          className={`relative px-3.5 py-1 rounded-lg font-bold text-xs shadow-sm transition-all duration-300 flex items-center gap-1.5 border-2 ${
            isReceived ? 'bg-[#22C55E] text-white border-[#22C55E] hover:bg-green-600 shadow-[0_0_8px_rgba(34,197,94,0.3)]' 
            : 'bg-white dark:bg-[#273549] text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}>
          {isReceived ? <>Received <span className="text-sm leading-none">🟢</span></> : <>Unpaid <span className="text-sm leading-none">🔴</span></>}
        </button>
      </div>
    </motion.div>
  );
});

export default PaymentRow;
