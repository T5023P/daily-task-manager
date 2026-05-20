"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { updateTask, deleteTask } from '../lib/taskService';
import { useUid } from '../context/UserContext';

const COLORS = {
  red: {
    bg: 'bg-[#fee2e2] dark:bg-[#450A0A]',
    border: 'border-[#ef4444]',
    dot: 'bg-[#ef4444]',
    glow: 'shadow-[0_0_6px_rgba(239,68,68,0.8)]',
    label: 'Pending',
  },
  yellow: {
    bg: 'bg-[#fef9c3] dark:bg-[#422006]',
    border: 'border-[#eab308]',
    dot: 'bg-[#eab308]',
    glow: 'shadow-[0_0_6px_rgba(234,179,8,0.8)]',
    label: 'In Progress',
  },
  green: {
    bg: 'bg-[#d1fae5] dark:bg-[#052E16]',
    border: 'border-[#10b981]',
    dot: 'bg-[#10b981]',
    glow: 'shadow-[0_0_6px_rgba(16,185,129,0.8)]',
    label: 'Done',
  },
};

const MobileTaskCard = memo(function MobileTaskCard({
  task,
  dateStr,
  isPrintSelected,
  onPrintToggle,
  onToast,
}) {
  const uid = useUid();
  const [text, setText] = useState(task.text || '');
  const [desc, setDesc] = useState(task.description || '');
  const [isDescEditing, setIsDescEditing] = useState(false);
  const inputRef = useRef(null);
  const descRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setText(task.text || '');
    setDesc(task.description || '');
  }, [task.text, task.description]);

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (val.trim() && val !== task.text) {
        updateTask(uid, dateStr, task.id, { text: val.trim() });
      }
    }, 800);
  };

  const handleTextBlur = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text !== task.text) {
      if (text.trim() === '') setText(task.text || '');
      else updateTask(uid, dateStr, task.id, { text: text.trim() });
    }
  };

  const handleDescBlur = () => {
    const trimmed = desc.trim();
    if (trimmed !== (task.description || '')) {
      updateTask(uid, dateStr, task.id, { description: trimmed });
    }
    setIsDescEditing(false);
  };

  const handleColorChange = (color) => {
    if (task.color !== color) {
      updateTask(uid, dateStr, task.id, { color });
      if (onToast) onToast(`Status → ${COLORS[color].label}`, color);
    }
  };

  const handleDelete = () => {
    deleteTask(uid, dateStr, task.id);
    if (onToast) onToast('Task deleted', 'red');
  };

  const activeColor = COLORS[task.color] ? task.color : 'yellow';
  const cfg = COLORS[activeColor];
  const isDone = activeColor === 'green';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg ${cfg.bg} border-l-[6px] ${cfg.border} p-1.5 flex gap-1.5 shadow-sm relative ${isPrintSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex flex-col gap-1.5 items-center pt-0.5 shrink-0">
        {isPrintSelected && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 transition-colors"
            aria-label="Delete task"
          >
            <FiTrash2 size={12} />
          </button>
        )}
        <input
          type="checkbox"
          checked={!!isPrintSelected}
          onChange={() => onPrintToggle && onPrintToggle(task.id)}
          className="w-3 h-3 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer print:hidden"
        />
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="border border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-black/20 px-1 py-0.5 rounded-sm">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.blur()}
            className={`w-full bg-transparent outline-none text-[10px] font-bold uppercase leading-none tracking-tight truncate ${
              isDone
                ? 'text-gray-500 dark:text-gray-400 line-through'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          />
        </div>

        {isDescEditing ? (
          <textarea
            ref={descRef}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={handleDescBlur}
            autoFocus
            placeholder="Add notes..."
            className="w-full bg-black/5 dark:bg-white/5 p-1 rounded-sm text-[9px] text-gray-700 dark:text-gray-300 outline-none resize-none leading-tight"
            style={{ minHeight: '32px', maxHeight: '72px' }}
          />
        ) : (
          <div
            onClick={() => setIsDescEditing(true)}
            className={`p-1 rounded-sm text-[9px] leading-tight cursor-pointer ${
              task.description
                ? 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap break-words line-clamp-3'
                : 'text-gray-400 italic'
            }`}
          >
            {task.description || 'Add note...'}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between items-center py-1 shrink-0">
        {['red', 'yellow', 'green'].map((c) => {
          const isActive = activeColor === c;
          const dotCfg = COLORS[c];
          return (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={`rounded-full transition-all ${dotCfg.dot} ${
                isActive
                  ? `w-3 h-3 border-[1.5px] border-white dark:border-gray-900 ${dotCfg.glow} relative z-10`
                  : 'w-2.5 h-2.5 opacity-40 hover:opacity-70'
              }`}
              aria-label={`Set status to ${dotCfg.label}`}
            />
          );
        })}
      </div>
    </motion.div>
  );
});

export default MobileTaskCard;
