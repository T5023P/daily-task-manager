"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { FiCopy, FiCheck, FiDownload, FiClipboard, FiCreditCard, FiBox, FiPrinter, FiMoon, FiSun, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getTasksForDate, 
  copyUnfinishedTasksToToday,
  getLongTermOrders
} from '../lib/taskService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import TaskSection from '../components/TaskSection';
import PaymentSection from '../components/PaymentSection';
import LongTermOrdersSection from '../components/LongTermOrdersSection';
import AddTaskModal from '../components/AddTaskModal';
import DateNavigator from '../components/DateNavigator';
import LoginPage from '../components/LoginPage';

export default function DailyTaskManager() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("gray");
  const [isCopying, setIsCopying] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [printSelection, setPrintSelection] = useState<Record<string, boolean>>({});
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [longTermOrders, setLongTermOrders] = useState<any[]>([]);
  const [taskFilter, setTaskFilter] = useState('all');
  const [printType, setPrintType] = useState('selected');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingPrintType, setPendingPrintType] = useState<string | null>(null);
  const [includeDescriptions, setIncludeDescriptions] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
  const [pendingPrintFormat, setPendingPrintFormat] = useState<'print' | 'pdf'>('print');

  // Initialize client-only states
  useEffect(() => {
    setMounted(true);
    setSelectedDate(startOfToday());
    
    // Auth checking
    const isAuth = localStorage.getItem('app_authenticated') === 'true' || sessionStorage.getItem('app_authenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);

    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    const savedCalendar = localStorage.getItem('isCalendarOpen');
    if (savedCalendar !== null) {
      setIsCalendarOpen(savedCalendar === 'true');
    }

    const savedDesc = localStorage.getItem('printIncludeDescriptions');
    if (savedDesc !== null) {
      setIncludeDescriptions(savedDesc === 'true');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('app_authenticated');
    sessionStorage.removeItem('app_authenticated');
    setIsAuthenticated(false);
  };

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleCalendar = () => {
    const next = !isCalendarOpen;
    setIsCalendarOpen(next);
    localStorage.setItem('isCalendarOpen', String(next));
  };

  // PWA install prompt
  useEffect(() => {
    const isInstalled = localStorage.getItem('pwaInstalled') === 'true' || window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      setShowInstallBtn(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for successful install
    const handleAppInstalled = () => {
      setShowInstallBtn(false);
      localStorage.setItem('pwaInstalled', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
      localStorage.setItem('pwaInstalled', 'true');
    }
    setDeferredPrompt(null);
  };

  // Fetch tasks
  useEffect(() => {
    if (!dateStr) return;
    setLoading(true);
    const unsubscribeTasks = getTasksForDate(dateStr, (fetchedTasks: any[]) => {
      const sortedTasks = [...fetchedTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
      setTasks(sortedTasks);
      setLoading(false);
    });
    const unsubscribeOrders = getLongTermOrders(dateStr, (fetchedOrders: any[]) => {
      setLongTermOrders(fetchedOrders);
    });
    return () => {
      unsubscribeTasks();
      unsubscribeOrders();
    };
  }, [dateStr]);

  useEffect(() => {
    setTaskFilter('all');
  }, [dateStr]);

  // Copy with confirmation
  const handleCopyUnfinished = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === todayStr) {
      showToast("You are already on today's sheet!", "yellow");
      return;
    }
    const unfinishedCount = tasks.filter(t => t.color !== 'green').length;
    if (unfinishedCount === 0) {
      showToast("All tasks are completed! Nothing to copy.", "green");
      return;
    }
    setShowCopyConfirm(true);
  };

  const confirmCopy = async () => {
    if (!dateStr || !selectedDate) return;
    setShowCopyConfirm(false);
    setIsCopying(true);
    try {
      const result = await copyUnfinishedTasksToToday(dateStr);
      const copiedCount = result?.copiedCount || 0;
      const todayDate = new Date();
      if (copiedCount > 0) {
        showToast(`${copiedCount} task${copiedCount > 1 ? 's' : ''} copied to Today`, "green");
      } else {
        showToast("No new tasks to copy.", "yellow");
      }
      setSelectedDate(todayDate);
    } finally {
      setIsCopying(false);
    }
  };

  const showToast = useCallback((msg: string, color: string = "gray") => {
    setToastMessage(msg);
    setToastColor(color);
    setTimeout(() => setToastMessage(""), 3000);
  }, []);

  const handlePrintToggle = useCallback((taskId: string) => {
    setPrintSelection(prev => {
      const next = { ...prev };
      if (next[taskId]) delete next[taskId];
      else next[taskId] = true;
      return next;
    });
  }, []);

  const selectedPrintCount = Object.keys(printSelection).length;

  const handlePrint = (type: string, format: 'print' | 'pdf' = 'print') => {
    if (type === 'selected' && selectedPrintCount === 0) {
      showToast("Please select tasks first", "gray");
      return;
    }
    if (type === 'filtered' && taskFilter === 'all') {
      showToast("Please select a color filter first", "yellow");
      return;
    }
    setPendingPrintType(type);
    setPendingPrintFormat(format);
    setShowPrintDialog(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const dateLabel = format(selectedDate || new Date(), 'd MMM yyyy');

    // Title / Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Business Task Manager", 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Sheet Date: ${dateLabel}`, 14, 28);

    // Table Columns
    const tableColumns = ["#", "Task", "Description", "Section", "Status"];

    // Table Data
    const allTasks = [...tasks, ...longTermOrders];
    const tasksToExport = pendingPrintType === 'selected' 
      ? allTasks.filter(t => printSelection[t.id])
      : dailyTasksCombined.filter(t => t.color === taskFilter || (taskFilter === 'yellow' && !t.color));

    const tableRows = tasksToExport.map((task, idx) => {
      const descText = includeDescriptions && task.description ? task.description : '';
      const sectionName = sectionLabels[task.section] || 'Long-Term';
      const statusName = colorLabels[task.color] || 'Pending';
      return [
        idx + 1,
        task.text || task.name || 'Unnamed',
        descText,
        sectionName,
        statusName
      ];
    });

    // Generate AutoTable
    autoTable(doc, {
      startY: 34,
      head: [tableColumns],
      body: tableRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [37, 99, 235], // blue-600
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { 
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 60 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25, halign: 'center' }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184); // slate-400
        const pageCount = doc.getNumberOfPages();
        const todayStr = format(new Date(), 'd MMM yyyy HH:mm');
        doc.text(
          `Generated on ${todayStr} | Page ${data.pageNumber} of ${pageCount}`, 
          14, 
          doc.internal.pageSize.height - 10
        );
      }
    });

    const fileName = `tasks-${format(selectedDate || new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);

    setPrintSelection({});
    setPendingPrintType(null);
    setPendingPrintFormat('print');
    showToast("PDF downloaded successfully!", "green");
  };

  const confirmPrint = async () => {
    if (!pendingPrintType) return;
    
    localStorage.setItem('printIncludeDescriptions', String(includeDescriptions));
    
    setPrintType(pendingPrintType);
    setShowPrintDialog(false);
    
    if (pendingPrintFormat === 'pdf') {
      setIsCopying(true);
      try {
        generatePDF();
      } catch (err) {
        console.error("PDF generation failed:", err);
        showToast("Failed to generate PDF.", "red");
      } finally {
        setIsCopying(false);
      }
    } else {
      setTimeout(() => {
        window.print();
        if (pendingPrintType === 'selected') {
          setTimeout(() => setPrintSelection({}), 500);
        }
        setPendingPrintType(null);
      }, 100);
    }
  };

  // Filter tasks
  const dailyTasksCombined = tasks.filter(t => !t.section || t.section === 'A' || t.section === 'B');
  const tasksC = tasks.filter(t => t.section === 'C');

  const doneCount = dailyTasksCombined.filter(t => t.color === 'green').length;
  const pendingCount = dailyTasksCombined.filter(t => t.color === 'red').length;
  const inProgressCount = dailyTasksCombined.filter(t => t.color === 'yellow' || !t.color).length;

  const allTasks = [...tasks, ...longTermOrders];
  const selectedTasks = printType === 'selected' 
    ? allTasks.filter(t => printSelection[t.id])
    : dailyTasksCombined.filter(t => t.color === taskFilter || (taskFilter === 'yellow' && !t.color));

  const filteredPrintCount = dailyTasksCombined.filter(t => t.color === taskFilter || (taskFilter === 'yellow' && !t.color)).length;

  const sectionLabels: Record<string, string> = { A: 'Daily', B: 'Daily', C: 'Payment', D: 'Long-Term' };
  const colorLabels: Record<string, string> = { red: 'Pending', yellow: 'In Progress', green: 'Done' };
  const toastColorStyles: Record<string, string> = { red: 'bg-red-600', yellow: 'bg-yellow-500', green: 'bg-green-600', gray: 'bg-gray-900 dark:bg-gray-700' };

  if (!mounted || checkingAuth || !selectedDate) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A]" />;
  }

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex flex-col font-sans text-gray-800 dark:text-[#F1F5F9] transition-colors duration-300">
      <header className="bg-white dark:bg-[#1E293B] shadow-sm px-4 sm:px-6 py-4 sticky top-0 z-20 print:hidden">
        <div className="flex justify-between items-start w-full">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Daily Task Manager</h1>
            <p className="text-base font-black text-blue-600 dark:text-blue-400">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            {!loading && (
              <div className="flex gap-3 mt-1.5 flex-wrap">
                <span className="text-xs font-bold text-green-600 dark:text-green-400">✅ {doneCount} done</span>
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">🟡 {inProgressCount} in progress</span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">🔴 {pendingCount} pending</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick} 
                className="flex items-center gap-1.5 text-sm font-semibold border-2 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-transparent px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-[#273549]"
              >
                📲 <span className="hidden sm:inline">Install App</span>
              </button>
            )}
            <button 
              onClick={handleLogout} 
              className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549] transition-all duration-300"
              title="Lock App"
              aria-label="Lock App"
            >
              🔒
            </button>
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549]">
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <div className="relative flex items-stretch border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1E293B]">
              <button 
                onClick={() => handlePrint('selected', 'print')} 
                className="flex items-center gap-1.5 text-sm font-semibold bg-transparent text-gray-700 dark:text-gray-300 px-3 py-2 rounded-l-xl hover:bg-gray-50 dark:hover:bg-[#273549] transition-colors border-r border-gray-200 dark:border-gray-700 cursor-pointer"
              >
                <span className="text-[15px]">🖨️</span> <span className="hidden sm:inline">Print Selected</span>
                {selectedPrintCount > 0 && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-md">{selectedPrintCount}</span>}
              </button>
              <button 
                onClick={() => setIsPrintDropdownOpen(!isPrintDropdownOpen)}
                className="px-2 hover:bg-gray-50 dark:hover:bg-[#273549] text-gray-500 dark:text-gray-400 rounded-r-xl transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Print Options"
              >
                <span className="text-[10px] sm:text-xs">▼</span>
              </button>

              <AnimatePresence>
                {isPrintDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPrintDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-1.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-[150px]"
                    >
                      <button 
                        onClick={() => { setIsPrintDropdownOpen(false); handlePrint('selected', 'print'); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#273549] text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span>🖨️</span> Print Selected
                      </button>
                      <button 
                        onClick={() => { setIsPrintDropdownOpen(false); handlePrint('selected', 'pdf'); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#273549] text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-gray-800 cursor-pointer"
                      >
                        <span>📄</span> Save as PDF
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => handlePrint('filtered')} className="flex items-center gap-1.5 text-sm font-semibold bg-gray-100 dark:bg-[#273549] text-gray-800 dark:text-gray-200 px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-[#334155]">
              <FiPrinter size={16} /> <span className="hidden sm:inline">Print {taskFilter !== 'all' ? taskFilter.charAt(0).toUpperCase() + taskFilter.slice(1) : 'Filtered'}</span>
              {taskFilter !== 'all' && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-md">{filteredPrintCount}</span>}
            </button>
            <button onClick={handleCopyUnfinished} disabled={isCopying} className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2.5 rounded-xl disabled:opacity-50">
              {isCopying ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" /> : <FiCopy size={16} />}
              <span className="hidden sm:inline">Copy to Today ({format(new Date(), 'd MMM')})</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 px-4 py-6 w-full 2xl:max-w-[1800px] mx-auto print:hidden transition-all duration-300 ${isCalendarOpen ? 'pb-32' : 'pb-12'}`}>
        {loading ? (
          <div className="flex justify-center items-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
            <div className="lg:col-span-2 h-full">
              <TaskSection 
                title="BUSINESS TASK" icon={FiClipboard} colorClass={{ border: 'border-blue-200', text: 'text-blue-700' }} bgClass="bg-blue-50" 
                tasks={dailyTasksCombined} dateStr={dateStr} sectionKey="A" onAddClick={() => setActiveSection('A')}
                printSelection={printSelection} onPrintToggle={handlePrintToggle} onToast={showToast}
                filter={taskFilter} onFilterChange={setTaskFilter}
              />
            </div>
            
            <div className="lg:col-span-1 flex flex-col gap-6 h-full">
              <div className="flex-1 min-h-[300px]">
                <PaymentSection 
                  title="Payment Received" icon={FiCreditCard} colorClass={{ border: 'border-purple-200', text: 'text-purple-700' }} bgClass="bg-purple-50" 
                  tasks={tasksC} dateStr={dateStr} printSelection={printSelection} onPrintToggle={handlePrintToggle} onToast={showToast}
                />
              </div>
              <div className="flex-1 min-h-[300px]">
                <LongTermOrdersSection 
                  title="Long Term Order" icon={FiBox} colorClass={{ border: 'border-orange-200', text: 'text-orange-700' }} bgClass="bg-orange-50" 
                  dateStr={dateStr} printSelection={printSelection} onPrintToggle={handlePrintToggle} onToast={showToast}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <motion.div 
        initial={false}
        animate={{ y: isCalendarOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-30"
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <button 
            onClick={toggleCalendar} 
            className="bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-md border border-b-0 border-gray-200 dark:border-[#334155] rounded-t-2xl px-5 py-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
            aria-label="Toggle Calendar"
          >
            {isCalendarOpen ? <FiChevronDown size={22} /> : <FiChevronUp size={22} />}
          </button>
        </div>
        <div className="bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-md border-t border-gray-100 dark:border-[#334155] px-4 py-3 pb-6 print:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)] w-full relative">
          <div className="w-full 2xl:max-w-[1800px] mx-auto">
            <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        </div>
      </motion.div>

      <div id="print-area" className="hidden print:block">
        <h1>
          {printType === 'selected' 
            ? `Selected Tasks — ${format(selectedDate, 'PP')}`
            : `Business Tasks — ${taskFilter.charAt(0).toUpperCase() + taskFilter.slice(1)} Filter — ${format(selectedDate, 'PP')}`}
        </h1>
        {selectedTasks.length > 0 && (
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedTasks.map((task, idx) => (
                <tr key={task.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div className="font-medium">{task.text || task.name}</div>
                    {includeDescriptions && task.description && (
                      <div className="text-[12px] text-gray-500 mt-1 leading-snug">{task.description}</div>
                    )}
                  </td>
                  <td>{sectionLabels[task.section] || 'Long-Term'}</td>
                  <td>{colorLabels[task.color] || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddTaskModal isOpen={!!activeSection} onClose={() => setActiveSection(null)} dateStr={dateStr} section={activeSection || "A"} onTaskAdded={() => showToast("Task added!", "green")} />

      <AnimatePresence>
        {showPrintDialog && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowPrintDialog(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-2xl z-50 w-[90%] max-w-sm">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                {pendingPrintFormat === 'pdf' ? (
                  <>
                    <span className="text-[18px]">📄</span> Save as PDF
                  </>
                ) : (
                  <>
                    <FiPrinter className="text-blue-500" /> Ready to Print
                  </>
                )}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {pendingPrintType === 'selected' ? `${selectedPrintCount} tasks selected` : `${filteredPrintCount} tasks filtered`}
              </p>
              
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeDescriptions} 
                  onChange={(e) => setIncludeDescriptions(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Include descriptions</span>
              </label>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowPrintDialog(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl transition-colors">Cancel</button>
                <button onClick={confirmPrint} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
                  {pendingPrintFormat === 'pdf' ? 'Save PDF' : 'Print'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCopyConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowCopyConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-2xl z-50 w-[90%] max-w-sm">
              <h3 className="text-lg font-bold mb-4">Copy Unfinished Tasks</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Copy {tasks.filter(t => t.color !== 'green').length} unchecked tasks from [{selectedDate ? format(selectedDate, 'd MMM') : ''}] to Today [{format(new Date(), 'd MMM')}]?
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCopyConfirm(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl transition-colors">Cancel</button>
                <button onClick={confirmCopy} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">Copy</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>{toastMessage && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-24 left-1/2 -translate-x-1/2 ${toastColorStyles[toastColor]} text-white px-5 py-3 rounded-xl shadow-2xl z-50 font-medium`}>
          {toastMessage}
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
