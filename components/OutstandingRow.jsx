"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';
import { updateOutstandingCollection, deleteOutstandingCollection } from '../lib/taskService';
import { useUid } from '../context/UserContext';

const OutstandingRow = memo(function OutstandingRow({ item, onToast }) {
  const uid = useUid();
  const [name, setName] = useState(item.name || '');
  const [amount, setAmount] = useState(item.amount || '');
  const [saleDate, setSaleDate] = useState(item.saleDate || '');
  const [remark, setRemark] = useState(item.remark || '');
  const nameRef = useRef(null);

  useEffect(() => {
    setName(item.name || '');
    setAmount(item.amount || '');
    setSaleDate(item.saleDate || '');
    setRemark(item.remark || '');
  }, [item.name, item.amount, item.saleDate, item.remark]);

  const isPaid = !!item.paid;

  // Aging = days from saleDate to today (or to paidDate if paid)
  let aging = null;
  try {
    if (saleDate) {
      const end = isPaid && item.paidDate ? parseISO(item.paidDate) : startOfToday();
      aging = differenceInDays(end, parseISO(saleDate));
      if (aging < 0) aging = 0;
    }
  } catch { aging = null; }

  const saveField = (field, value) => {
    updateOutstandingCollection(uid, item.id, { [field]: value });
  };

  const togglePaid = () => {
    updateOutstandingCollection(uid, item.id, { paid: !isPaid });
    if (onToast) onToast(!isPaid ? 'Marked as paid ✅' : 'Marked unpaid', !isPaid ? 'green' : 'red');
  };

  const handleDelete = () => {
    deleteOutstandingCollection(uid, item.id);
    if (onToast) onToast('Entry deleted', 'red');
  };

  const rowStyles = isPaid
    ? 'bg-green-50 dark:bg-[#052E16]/40 border-l-[#22C55E]'
    : 'bg-rose-50/70 dark:bg-[#3b0a0a]/30 border-l-[#F43F5E]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`relative flex flex-col gap-2 p-3 rounded-xl shadow-sm border-l-[6px] ${rowStyles} dark:border dark:border-[#334155]`}
    >
      {/* Row 1: Name + Amount */}
      <div className="flex items-center gap-2">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== item.name && saveField('name', name.trim())}
          placeholder="Sale / Party name"
          className={`flex-1 min-w-0 bg-white/60 dark:bg-white/5 px-2.5 py-1.5 rounded-lg outline-none text-[13px] font-semibold focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700 ${isPaid ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}
        />
        <div className="relative shrink-0 w-28">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => Number(amount) !== Number(item.amount) && saveField('amount', amount)}
            placeholder="Amount"
            className="w-full bg-white/60 dark:bg-white/5 pl-6 pr-2 py-1.5 rounded-lg outline-none text-[13px] font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700"
          />
        </div>
      </div>

      {/* Row 2: Sale date + Aging + Paid toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400">Sale</span>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => { setSaleDate(e.target.value); saveField('saleDate', e.target.value); }}
            className="bg-white/60 dark:bg-white/5 px-2 py-1 rounded-lg outline-none text-[12px] text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700 cursor-pointer"
          />
        </div>

        {aging !== null && (
          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${isPaid ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : aging > 30 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
            {isPaid ? `Cleared in ${aging}d` : `${aging}d aging`}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={togglePaid}
          className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${isPaid ? 'bg-[#22C55E] text-white border-[#22C55E]' : 'bg-white dark:bg-[#273549] text-rose-500 border-rose-200 dark:border-rose-800 hover:border-rose-400'}`}
        >
          {isPaid ? 'Paid 🟢' : 'Unpaid 🔴'}
        </button>

        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
          aria-label="Delete entry"
        >
          <FiTrash2 size={16} />
        </button>
      </div>

      {/* Row 3: Remark */}
      <input
        type="text"
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        onBlur={() => remark !== item.remark && saveField('remark', remark.trim())}
        placeholder="Remark (optional)"
        className="w-full bg-white/40 dark:bg-white/5 px-2.5 py-1.5 rounded-lg outline-none text-[12px] text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700"
      />
    </motion.div>
  );
});

export default OutstandingRow;
