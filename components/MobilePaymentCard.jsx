"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { updateTask, deleteTask } from '../lib/taskService';
import { useUid } from '../context/UserContext';

const formatAmount = (n) => {
  const num = Number(n) || 0;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)}L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
  return `₹ ${num.toLocaleString()}`;
};

const MobilePaymentCard = memo(function MobilePaymentCard({
  task,
  dateStr,
  isPrintSelected,
  onPrintToggle,
  onToast,
}) {
  const uid = useUid();
  const isReceived = task.color === 'green';

  const toggleStatus = () => {
    const newColor = isReceived ? 'red' : 'green';
    updateTask(uid, dateStr, task.id, { color: newColor });
    if (onToast) onToast(newColor === 'green' ? 'Payment received' : 'Marked unpaid', newColor);
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
      className={`relative border rounded-lg p-2 shadow-sm flex flex-col gap-0.5 ${
        isReceived
          ? 'bg-green-50 dark:bg-[#052E16] border-green-200 dark:border-green-900'
          : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155]'
      } ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={!!isPrintSelected}
            onChange={() => onPrintToggle && onPrintToggle(task.id)}
            className="w-3 h-3 shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer print:hidden"
          />
          <div className={`text-[12px] font-bold truncate ${isReceived ? 'text-green-700 dark:text-green-400 line-through opacity-70' : 'text-purple-700 dark:text-purple-400'}`}>
            {task.name || task.text || 'Unnamed'}
          </div>
        </div>
        <button
          onClick={toggleStatus}
          className={`shrink-0 w-2 h-2 rounded-full ${isReceived ? 'bg-green-500' : 'bg-purple-500'}`}
          aria-label="Toggle payment status"
        />
      </div>

      <div className="text-[11px] text-gray-600 dark:text-gray-400 truncate pl-[18px]">
        {task.expectedTime === 'Custom date' && task.customDueDate
          ? task.customDueDate
          : task.expectedTime || 'Today EOD'}
      </div>

      <div className="flex justify-between items-center pl-[18px] mt-0.5">
        {isPrintSelected ? (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 transition-colors print:hidden"
            aria-label="Delete payment"
          >
            <FiTrash2 size={11} />
          </button>
        ) : (
          <span />
        )}
        <div className={`text-[12px] font-bold ${isReceived ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
          {formatAmount(task.amount)}
        </div>
      </div>
    </motion.div>
  );
});

export default MobilePaymentCard;
