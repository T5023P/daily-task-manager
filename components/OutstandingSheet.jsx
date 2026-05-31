"use client";

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';
import {
  getOutstandingCollections,
  addOutstandingCollection,
  updateOutstandingCollection,
  deleteOutstandingCollection,
} from '../lib/taskService';
import { useUid } from '../context/UserContext';

const SheetRow = memo(function SheetRow({ item, onToast }) {
  const uid = useUid();
  const [name, setName] = useState(item.name || '');
  const [amount, setAmount] = useState(item.amount ?? '');
  const [saleDate, setSaleDate] = useState(item.saleDate || '');
  const [remark, setRemark] = useState(item.remark || '');

  useEffect(() => {
    setName(item.name || '');
    setAmount(item.amount ?? '');
    setSaleDate(item.saleDate || '');
    setRemark(item.remark || '');
  }, [item.name, item.amount, item.saleDate, item.remark]);

  const isPaid = !!item.paid;

  let aging = null;
  try {
    if (saleDate) {
      const end = isPaid && item.paidDate ? parseISO(item.paidDate) : startOfToday();
      aging = differenceInDays(end, parseISO(saleDate));
      if (aging < 0) aging = 0;
    }
  } catch { aging = null; }

  const save = (field, value) => updateOutstandingCollection(uid, item.id, { [field]: value });

  const togglePaid = () => {
    updateOutstandingCollection(uid, item.id, { paid: !isPaid });
    if (onToast) onToast(!isPaid ? 'Marked paid ✅' : 'Marked unpaid', !isPaid ? 'green' : 'red');
  };

  const handleDelete = () => {
    deleteOutstandingCollection(uid, item.id);
    if (onToast) onToast('Entry deleted', 'red');
  };

  const cell = "px-2 py-1.5 border-b border-gray-100 dark:border-[#334155] align-middle";
  const inputCls = "w-full bg-transparent outline-none text-[13px] text-gray-800 dark:text-gray-100 focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded px-1.5 py-1 transition-colors";

  return (
    <tr className={isPaid ? 'bg-green-50/60 dark:bg-[#052E16]/30' : 'odd:bg-white even:bg-gray-50/50 dark:odd:bg-[#1E293B] dark:even:bg-[#243042]'}>
      <td className={cell}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== item.name && save('name', name.trim())}
          placeholder="Sale / Party"
          className={`${inputCls} font-semibold ${isPaid ? 'line-through text-gray-400' : ''}`}
        />
      </td>
      <td className={`${cell} w-28`}>
        <div className="relative">
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 text-[12px]">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => Number(amount) !== Number(item.amount) && save('amount', amount)}
            placeholder="0"
            className={`${inputCls} pl-4 font-bold text-right`}
          />
        </div>
      </td>
      <td className={`${cell} w-36`}>
        <input
          type="date"
          value={saleDate}
          onChange={(e) => { setSaleDate(e.target.value); save('saleDate', e.target.value); }}
          className={`${inputCls} cursor-pointer text-[12px]`}
        />
      </td>
      <td className={`${cell} w-24 text-center`}>
        {aging !== null ? (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isPaid ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : aging > 30 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
            {aging}d
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className={cell}>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          onBlur={() => remark !== item.remark && save('remark', remark.trim())}
          placeholder="Remark"
          className={`${inputCls} text-gray-600 dark:text-gray-400`}
        />
      </td>
      <td className={`${cell} w-28 text-center`}>
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={togglePaid}
            className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all ${isPaid ? 'bg-[#22C55E] text-white border-[#22C55E]' : 'bg-white dark:bg-[#273549] text-rose-500 border-rose-200 dark:border-rose-800 hover:border-rose-400'}`}
          >
            {isPaid ? 'Paid' : 'Unpaid'}
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-500 transition-colors"
            aria-label="Delete row"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function OutstandingSheet({ onToast }) {
  const uid = useUid();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsub = getOutstandingCollections(uid, (fetched) => {
      const sorted = [...fetched].sort((a, b) => {
        if (a.paid !== b.paid) return a.paid ? 1 : -1;
        return (a.saleDate || '').localeCompare(b.saleDate || '');
      });
      setItems(sorted);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [uid]);

  const totalOutstanding = items.filter(i => !i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalCleared = items.filter(i => i.paid).reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const countAll = items.length;
  const countUnpaid = items.filter(i => !i.paid).length;
  const countPaid = items.filter(i => i.paid).length;

  const filteredItems = filter === 'all' ? items : filter === 'paid' ? items.filter(i => i.paid) : items.filter(i => !i.paid);

  const handleAdd = async () => {
    try {
      await addOutstandingCollection(uid, { name: '', amount: 0, saleDate: new Date().toISOString().slice(0, 10), remark: '' });
      if (onToast) onToast('Row added', 'yellow');
    } catch (err) {
      if (onToast) onToast(err?.message || 'Failed to add row', 'red');
    }
  };

  const th = "px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#273549] sticky top-0 z-10 border-b-2 border-gray-200 dark:border-[#334155]";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar: totals + filters + add */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-1.5">
            <span className="text-[9px] uppercase font-bold text-gray-500 dark:text-gray-400 block leading-none">Outstanding</span>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400">₹ {totalOutstanding.toLocaleString()}</span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1.5">
            <span className="text-[9px] uppercase font-bold text-gray-500 dark:text-gray-400 block leading-none">Collected</span>
            <span className="text-sm font-black text-green-600 dark:text-green-400">₹ {totalCleared.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setFilter('all')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${filter === 'all' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-[#273549] dark:text-gray-400'}`}>All ({countAll})</button>
          <button onClick={() => setFilter('unpaid')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${filter === 'unpaid' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>Unpaid ({countUnpaid})</button>
          <button onClick={() => setFilter('paid')} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${filter === 'paid' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>Paid ({countPaid})</button>
          <button onClick={handleAdd} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm">
            <FiPlus size={14} /> Add Row
          </button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <span className="text-4xl mb-3">💰</span>
            <p className="text-sm font-medium mb-3">No outstanding collections yet</p>
            <button onClick={handleAdd} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-600 text-white hover:bg-rose-700">
              <FiPlus size={15} /> Add First Row
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-[#334155] rounded-xl overflow-hidden">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className={th}>Sale Name</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={th}>Sale Date</th>
                  <th className={`${th} text-center`}>Aging</th>
                  <th className={th}>Remark</th>
                  <th className={`${th} text-center`}>Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <SheetRow key={item.id} item={item} onToast={onToast} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
