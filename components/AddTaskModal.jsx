"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addTask, getTasksForDate, updateTask } from '../lib/taskService';

export default function AddTaskModal({ isOpen, onClose, dateStr, onTaskAdded, section = "A" }) {
  const [text, setText] = useState('');
  const [desc, setDesc] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setDesc('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    
    try {
      await addTask(dateStr, text.trim(), section);
      
      const trimmedDesc = desc.trim();
      if (trimmedDesc) {
        // Find the newly added task to attach description without changing taskService.js
        const unsubscribe = getTasksForDate(dateStr, (tasks) => {
          unsubscribe(); // Stop listening immediately
          const newlyAdded = [...tasks].reverse().find(t => t.text === text.trim() && !t.description);
          if (newlyAdded) {
            updateTask(dateStr, newlyAdded.id, { description: trimmedDesc });
          }
        });
      }

      if (onTaskAdded) onTaskAdded();
      onClose();
    } catch (error) {
      console.error("Failed to add task:", error);
      alert("Failed to save task. Please check your internet connection or ad-blocker.");
    }
  };

  const handleDescChange = (e) => {
    setDesc(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-md bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl z-50 flex flex-col gap-4"
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto sm:hidden mb-2" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Task</h3>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <input 
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's the task?"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-[#334155] dark:bg-[#273549] dark:text-gray-100 focus:ring-0 focus:border-blue-500 text-lg text-gray-800 outline-none transition-colors"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Description (optional)</label>
                <textarea
                  value={desc}
                  onChange={handleDescChange}
                  placeholder="Add notes, quantities, details..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#334155] dark:bg-[#1E293B] dark:text-gray-200 focus:ring-0 focus:border-blue-500 text-[14px] text-gray-700 outline-none transition-colors resize-none overflow-y-auto hide-scrollbar"
                  style={{ minHeight: '60px', maxHeight: '120px' }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!text.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md flex-1 sm:flex-none"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
