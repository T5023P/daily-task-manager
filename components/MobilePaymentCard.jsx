"use client";

import React, { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { updateTask, deleteTask } from '../lib/taskService';
import { useUid } from '../context/UserContext';

const getLocalTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MobilePaymentCard = memo(function MobilePaymentCard({
  task,
  dateStr,
  isPrintSelected,
  onPrintToggle,
  onToast,
}) {
  const uid = useUid();
  const [name, setName] = useState(task.name || '');
  const [amount, setAmount] = useState(task.amount || '');
  const [expectedTime, setExpectedTime] = useState(task.expectedTime || 'Today EOD');
  const [customDueDate, setCustomDueDate] = useState(task.customDueDate || '');

  useEffect(() => {
    setName(task.name || '');
    setAmount(task.amount || '');
    setExpectedTime(task.expectedTime || 'Today EOD');
    setCustomDueDate(task.customDueDate || '');
  }, [task.name, task.amount, task.expectedTime, task.customDueDate]);

  const saveUpdates = () => {
    updateTask(uid, dateStr, task.id, {
      name: name.trim(),
      text: name.trim() || 'New Payment',
      amount: Number(amount) || 0,
      expectedTime,
      customDueDate,
    });
  };

  const isReceived = task.color === 'green';

  const toggleStatus = () => {
    const newColor = isReceived ? 'red' : 'green';
    updateTask(uid, dateStr, task.id, { color: newColor });
    if (onToast) onToast(newColor === 'green' ? 'Payment received ✅' : 'Marked unpaid', newColor);
  };

  const handleDelete = () => {
    deleteTask(uid, dateStr, task.id);
    if (onToast) onToast('Payment deleted', 'red');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative border rounded-lg p-2.5 shadow-sm flex flex-col gap-2 ${
        isReceived
          ? 'bg-green-50/70 dark:bg-[#052E16]/30 border-green-200 dark:border-green-900/40'
          : 'bg-[#FAF5FF] dark:bg-[#2E1065]/20 border-purple-200 dark:border-purple-900/40'
      } ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={!!isPrintSelected}
            onChange={() => onPrintToggle && onPrintToggle(task.id)}
            className="w-3.5 h-3.5 shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer print:hidden"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveUpdates}
            placeholder="Person Name"
            className={`flex-1 bg-transparent outline-none text-[12px] font-bold text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 border-b border-transparent focus:border-purple-400 ${
              isReceived ? 'line-through opacity-70' : ''
            }`}
          />
        </div>
        <button
          onClick={toggleStatus}
          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${
            isReceived
              ? 'bg-green-500 border-green-500 text-white shadow-sm'
              : 'bg-white dark:bg-[#273549] border-red-200 dark:border-red-800 text-red-500'
          }`}
        >
          {isReceived ? 'Paid' : 'Unpaid'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 pl-5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <select
            value={expectedTime}
            onChange={(e) => {
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
            }}
            className="bg-transparent text-[11px] text-gray-600 dark:text-gray-400 outline-none cursor-pointer border-b border-transparent focus:border-purple-400"
          >
            {['15 min', '30 min', '1 hour', '2 hours', 'Today EOD', 'Custom date'].map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-100">
                {opt}
              </option>
            ))}
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
              className="bg-transparent text-[11px] text-gray-600 dark:text-gray-400 outline-none cursor-pointer border-b border-transparent focus:border-purple-400 w-24"
            />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={saveUpdates}
            placeholder="0"
            className="w-16 bg-transparent outline-none text-[12px] font-extrabold text-purple-700 dark:text-purple-400 text-right border-b border-transparent focus:border-purple-400 placeholder-purple-300 dark:placeholder-purple-800"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pl-5 border-t border-gray-100 dark:border-gray-800/50 pt-1.5 mt-0.5">
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition-colors print:hidden flex items-center gap-1 text-[10px]"
          aria-label="Delete payment"
        >
          <FiTrash2 size={12} /> Delete
        </button>
        <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-600">
          Payment Received
        </span>
      </div>
    </motion.div>
  );
});

export default MobilePaymentCard;
