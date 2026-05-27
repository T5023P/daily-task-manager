"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi';
import { updateTask, deleteTask } from '../lib/taskService';
import { useUid } from '../context/UserContext';

const TaskRow = memo(function TaskRow({ task, dateStr, isPrintSelected, onPrintToggle, onToast, index }) {
  const uid = useUid();
  const [text, setText] = useState(task.text);
  const [desc, setDesc] = useState(task.description || '');
  const [isHovered, setIsHovered] = useState(false);
  const [isDescEditing, setIsDescEditing] = useState(false);
  const inputRef = useRef(null);
  const descInputRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setText(task.text);
    setDesc(task.description || '');
  }, [task.text, task.description]);

  // Debounced auto-save (800ms)
  const debouncedSave = useCallback((newText) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (newText.trim() && newText !== task.text) {
        updateTask(uid, dateStr, task.id, { text: newText.trim() });
      }
    }, 800);
  }, [dateStr, task.id, task.text]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    debouncedSave(val);
  };

  const handleBlurOrEnter = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
      return;
    }
    // Flush on blur
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text !== task.text) {
      if (text.trim() === '') {
        setText(task.text);
      } else {
        updateTask(uid, dateStr, task.id, { text: text.trim() });
      }
    }
  };

  const handleDescChange = (e) => {
    setDesc(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
  };

  const handleDescBlur = () => {
    const trimmed = desc.trim();
    if (trimmed !== (task.description || '')) {
      updateTask(uid, dateStr, task.id, { description: trimmed });
    }
    setIsDescEditing(false);
  };

  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      descInputRef.current?.blur();
    }
  };

  const handleColorChange = (color) => {
    if (task.color !== color) {
      updateTask(uid, dateStr, task.id, { color });
      if (onToast) {
        const labels = { red: 'Pending', yellow: 'In Progress', green: 'Done' };
        onToast(`Status → ${labels[color]}`, color);
      }
    }
  };

  const handleDelete = () => {
    deleteTask(uid, dateStr, task.id);
    if (onToast) onToast('Task deleted', 'red');
  };

  const colorConfig = {
    red: { 
      bg: 'bg-red-100/60 dark:bg-[#450A0A]', 
      border: 'border-l-[#EF4444]', 
      button: 'bg-[#EF4444]',
      label: 'Pending',
      shadow: 'shadow-[0_0_14px_rgba(239,68,68,0.6)]'
    },
    yellow: { 
      bg: 'bg-yellow-100/60 dark:bg-[#422006]', 
      border: 'border-l-[#EAB308]', 
      button: 'bg-[#EAB308]',
      label: 'In Progress',
      shadow: 'shadow-[0_0_14px_rgba(234,179,8,0.6)]'
    },
    green: { 
      bg: 'bg-green-100/60 dark:bg-[#052E16]', 
      border: 'border-l-[#22C55E]', 
      button: 'bg-[#22C55E]',
      label: 'Done',
      shadow: 'shadow-[0_0_14px_rgba(34,197,94,0.6)]'
    }
  };

  const activeColor = colorConfig[task.color] ? task.color : 'yellow';
  const currentConfig = colorConfig[activeColor];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-row sm:flex-col p-3 sm:p-4 rounded-xl shadow-sm transition-[background-color,border-color,box-shadow,ring] duration-300 border-l-[8px] ${currentConfig.border} ${currentConfig.bg} hover:shadow-md gap-2 sm:gap-2 ${isPrintSelected ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''} dark:border dark:border-[#334155]`}
    >
      {/* Main Content Area (Task + Description) */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center w-full gap-3 sm:gap-4 relative">
          {/* Delete button (extreme left on mobile) */}
          <button 
            onClick={handleDelete}
            className="sm:hidden shrink-0 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 mr-0.5 transition-colors"
            aria-label="Delete task"
          >
            <FiTrash2 size={16} />
          </button>

          {/* Print checkbox & task number */}
          <div className="shrink-0 flex flex-col items-center gap-1 sm:gap-1.5 print:hidden">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={isPrintSelected || false}
                onChange={() => onPrintToggle && onPrintToggle(task.id)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-[#273549] cursor-pointer"
              />
            </label>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/10 rounded px-1.5 py-0.5 leading-none" title={`Task #${index + 1}`}>
              {index + 1}
            </span>
          </div>

          {/* Text Input */}
          <div className="flex-1 min-w-0 relative">
            <input 
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleTextChange}
              onBlur={handleBlurOrEnter}
              onKeyDown={(e) => e.key === 'Enter' && handleBlurOrEnter(e)}
              className={`w-full bg-transparent outline-none text-[15px] sm:text-base transition-all dark:text-[#F1F5F9] pr-4 sm:pr-6 ${activeColor === 'green' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100 font-medium'}`}
            />
            {task.description && !isDescEditing && (
              <span className="hidden sm:inline absolute right-0 top-1/2 -translate-y-1/2 text-[10px] opacity-60">📝</span>
            )}
          </div>

          {/* DESKTOP Status color buttons */}
          <div className="hidden sm:flex items-center gap-3 sm:gap-5 shrink-0 mr-6 sm:mr-8">
            {['red', 'yellow', 'green'].map((c) => {
              const isActive = activeColor === c;
              const config = colorConfig[c];
              
              return (
                <div key={c} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleColorChange(c)}
                    className={`rounded-full transition-all duration-300 ease-out ${config.button} ${
                      isActive 
                        ? `w-8 h-8 ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-gray-300 dark:ring-gray-500 ${config.shadow} scale-120` 
                        : 'w-5 h-5 opacity-40 hover:opacity-80 hover:scale-110'
                    }`}
                    style={{ minWidth: isActive ? '32px' : '20px', minHeight: isActive ? '32px' : '20px' }}
                    aria-label={`Set status to ${config.label}`}
                  />
                  <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-gray-700 dark:text-gray-300 opacity-100' : 'opacity-0'}`}>
                    {isActive ? config.label : '\u00A0'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description Area */}
        <div className="pl-7 sm:pl-8 w-full pr-8 sm:pr-16">
          {isDescEditing ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2 sm:mt-1">
               <textarea 
                 ref={descInputRef}
                 value={desc}
                 onChange={handleDescChange}
                 onBlur={handleDescBlur}
                 onKeyDown={handleDescKeyDown}
                 autoFocus
                 placeholder="Add notes, quantities, details..."
                 className={`w-full bg-black/5 dark:bg-white/5 rounded-r-lg p-3 text-[14px] text-gray-600 dark:text-gray-300 outline-none resize-none overflow-y-auto hide-scrollbar border-l-[3px] ${currentConfig.border}`}
                 style={{ minHeight: '60px', maxHeight: '120px' }}
               />
            </motion.div>
          ) : (
            <div onClick={() => setIsDescEditing(true)} className="cursor-pointer group pt-1 pb-1">
              {task.description ? (
                <div className={`sm:mt-2 pt-2 pb-2 pl-3 pr-2 bg-black/5 dark:bg-white/5 border-l-[3px] ${currentConfig.border} rounded-r-lg`}>
                  <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed sm:line-clamp-3 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors break-words whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              ) : (
                <span className="text-[11px] text-gray-400/50 hover:text-gray-400 transition-colors block sm:mt-1">
                  Add note...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE Status color buttons */}
      <div className="sm:hidden flex flex-col items-center gap-3 shrink-0 w-[28px] pt-1">
        {['red', 'yellow', 'green'].map((c) => {
          const config = colorConfig[c];
          const isActive = activeColor === c;
          return (
            <button
              key={`mobile-${c}`}
              onClick={() => handleColorChange(c)}
              className={`rounded-full transition-all duration-300 ${config.button} ${
                isActive 
                  ? `ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-gray-300 dark:ring-gray-500 ${config.shadow} opacity-100` 
                  : 'opacity-40'
              }`}
              style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
              aria-label={`Set status to ${config.label}`}
            />
          );
        })}
      </div>

      {/* Desktop Delete button */}
      <button 
        onClick={handleDelete}
        className={`hidden sm:block absolute right-2 top-2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        aria-label="Delete task"
      >
        <FiTrash2 size={18} />
      </button>
    </motion.div>
  );
});

export default TaskRow;
