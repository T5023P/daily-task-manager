"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, addDays, subDays, parseISO, startOfToday } from 'date-fns';
import { FiCheck, FiDownload, FiClipboard, FiCreditCard, FiBox, FiPrinter, FiMoon, FiSun, FiAlertCircle, FiChevronDown, FiChevronUp, FiLogOut, FiPlus, FiTrash2, FiRotateCcw, FiEye, FiBriefcase } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTasksForDate,
  copyUnfinishedTasksToTargetDate,
  copySelectedTasksToDate,
  getUnfinishedTasksForDate,
  findPreviousActiveDate,
  getTaskLists,
  saveTaskLists,
  getLongTermOrders,
  addPayment,
  addLongTermOrder,
  deleteTask,
  permanentlyDeleteTask,
  restoreTask,
  permanentlyDeleteLongTermOrder,
  restoreLongTermOrder
} from '../lib/taskService';
import { auth, signInWithGoogle, signInWithEmail, createAccountWithEmail, logOut, onAuthStateChanged } from '../lib/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import TaskSection from '../components/TaskSection';
import PaymentSection from '../components/PaymentSection';
import LongTermOrdersSection from '../components/LongTermOrdersSection';
/**
 * ⚠️ ADMIN-ONLY IMPORT — Daily Business Tasks Section (Section Key: "E")
 * This component is ONLY rendered for admin emails. Do NOT remove or merge
 * with other sections in future updates. See DailyBusinessTaskSection.jsx
 * for full documentation.
 */
import DailyBusinessTaskSection from '../components/DailyBusinessTaskSection';
import GlanceModal from '../components/GlanceModal';
import AddTaskModal from '../components/AddTaskModal';
import DateNavigator from '../components/DateNavigator';
// Phone verification removed
import Paywall from '../components/Paywall';
import { UserProvider } from '../context/UserContext';

const ADMIN_EMAILS = [
  'topsecuritieslko@gmail.com',
  'arsh5023siddiqui@gmail.com'
];

const BYPASS_EMAILS = [
  'zuhaib@test.com'
];

type TaskListConfig = {
  key: string;
  title: string;
  color: 'blue' | 'teal' | 'emerald' | 'amber' | 'rose' | 'indigo';
  system?: boolean;
};

const TASK_LIST_COLORS: Record<TaskListConfig['color'], { border: string; text: string; bg: string }> = {
  blue: { border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50' },
  teal: { border: 'border-teal-200', text: 'text-teal-700', bg: 'bg-teal-50' },
  emerald: { border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  amber: { border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50' },
  rose: { border: 'border-rose-200', text: 'text-rose-700', bg: 'bg-rose-50' },
  indigo: { border: 'border-indigo-200', text: 'text-indigo-700', bg: 'bg-indigo-50' },
};

const getDefaultTaskLists = (isAdmin: boolean): TaskListConfig[] => [
  { key: 'A', title: 'BUSINESS TASK', color: 'blue', system: true },
  ...(isAdmin ? [{ key: 'E', title: 'DAILY BUSINESS TASK', color: 'teal', system: true } as TaskListConfig] : []),
];

export default function DailyTaskManager() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<any[]>([]);
  const [deletedLongTermOrders, setDeletedLongTermOrders] = useState<any[]>([]);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("gray");
  const [isCopying, setIsCopying] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [printSelection, setPrintSelection] = useState<Record<string, boolean>>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [longTermOrders, setLongTermOrders] = useState<any[]>([]);
  const [taskFilter, setTaskFilter] = useState('all');
  /**
   * ⚠️ ADMIN-ONLY STATE — Independent filter for the Daily Business Tasks
   * section (section key "E"). This is separate from `taskFilter` which
   * controls the main BUSINESS TASK section. Do NOT merge these two states.
   */
  const [sectionEFilter, setSectionEFilter] = useState('all');
  const [printType, setPrintType] = useState('selected');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingPrintType, setPendingPrintType] = useState<string | null>(null);
  const [includeDescriptions, setIncludeDescriptions] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [loginMode, setLoginMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  // const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
  const [pendingPrintFormat, setPendingPrintFormat] = useState<'print' | 'pdf'>('print');
  const [mobileAddMenuOpen, setMobileAddMenuOpen] = useState(false);
  const [mobilePrintMenuOpen, setMobilePrintMenuOpen] = useState(false);
  const [mobileLtoModalOpen, setMobileLtoModalOpen] = useState(false);
  const [desktopAddMenuOpen, setDesktopAddMenuOpen] = useState(false);
  const [ltoText, setLtoText] = useState('');
  const [ltoDeliveryDate, setLtoDeliveryDate] = useState('');
  const [showCopyDatePicker, setShowCopyDatePicker] = useState(false);
  const [showGlance, setShowGlance] = useState(false);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [lowTaskPrompt, setLowTaskPrompt] = useState<{
    isOpen: boolean;
    sourceDateStr: string;
    targetDateStr: string;
    unfinishedTasksCount: number;
    priorActiveDate?: {
      dateStr: string;
      count: number;
      daysAgo: number;
    } | null;
  } | null>(null);

  // Firebase Auth listener
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const lowerEmail = user.email ? user.email.toLowerCase() : '';
        if (lowerEmail && ADMIN_EMAILS.includes(lowerEmail)) {
          setAuthUser(user);
          setAccessDenied(false);
          setTrialExpired(false);
        } else if (user.email && BYPASS_EMAILS.includes(lowerEmail)) {
          setAuthUser(user);
          setAccessDenied(false);
          setTrialExpired(false);
        } else if (user.email) {
          try {
            let userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
              const now = new Date().toISOString();
              await setDoc(doc(db, 'users', user.uid), {
                createdAt: now,
                trialStartDate: now,
              });
              userDoc = await getDoc(doc(db, 'users', user.uid));
            }
            const data = userDoc.data()!;
            if (data.subscriptionStatus === 'active') {
              setAuthUser(user);
              setTrialExpired(false);
            } else {
              const trialStart = new Date(data.trialStartDate);
              const now = new Date();
              const daysPassed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
              if (daysPassed > 365) {
                setAuthUser(user);
                setTrialExpired(true);
              } else {
                setAuthUser(user);
                setTrialExpired(false);
              }
            }
            if (data.createdAt) {
              const createdAt = new Date(data.createdAt);
              const now = new Date();
              const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
              if (daysSinceCreated < 3) {
                setShowDemoPopup(true);
              }
            }
            setAccessDenied(false);
          } catch (err) {
            console.error('Trial check error:', err);
            setAuthUser(user);
            setTrialExpired(false);
            setAccessDenied(false);
          }
        } else {
          logOut();
          setAuthUser(null);
          setAccessDenied(true);
          alert('Access denied. This app is private.');
        }
      } else {
        setAuthUser(null);
        setAccessDenied(false);
        setTrialExpired(false);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize client-only states
  useEffect(() => {
    setMounted(true);
    setSelectedDate(startOfToday());

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

  // Splash screen timer - show for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logOut();
  };

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const uidVal = authUser?.uid || '';
  const emailVal = authUser?.email || '';
  const isAdmin = !!emailVal && ADMIN_EMAILS.includes(emailVal.toLowerCase());
  const betaFeatures = !!emailVal && ['zuhaib@test.com'].includes(emailVal.toLowerCase());
  const uid = React.useMemo(() => ({ uid: uidVal, email: emailVal, isAdmin }), [uidVal, emailVal, isAdmin]);

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

  // Task lists state
  const [taskLists, setTaskLists] = useState<TaskListConfig[]>(() => getDefaultTaskLists(isAdmin));

  // Load task lists from Firestore
  useEffect(() => {
    if (!uid) return;
    const unsub = getTaskLists(uid, getDefaultTaskLists(isAdmin), (lists: TaskListConfig[]) => {
      setTaskLists(lists);
    });
    return () => unsub();
  }, [uid, isAdmin]);

  const handleAddList = async () => {
    const title = window.prompt('Enter a name for the new list:');
    if (!title || !title.trim()) return;
    const key = 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const updated = [...taskLists, { key, title: title.trim(), color: 'indigo' as const }];
    await saveTaskLists(uid, updated);
  };

  const handleRenameList = async (key: string) => {
    const list = taskLists.find(l => l.key === key);
    if (!list || list.system) return;
    const title = window.prompt('Rename list:', list.title);
    if (!title || !title.trim() || title.trim() === list.title) return;
    const updated = taskLists.map(l => l.key === key ? { ...l, title: title.trim() } : l);
    await saveTaskLists(uid, updated);
  };

  const handleRemoveList = async (key: string) => {
    const list = taskLists.find(l => l.key === key);
    if (!list || list.system) return;
    if (!window.confirm(`Delete list "${list.title}" and all its tasks?`)) return;
    const updated = taskLists.filter(l => l.key !== key);
    await saveTaskLists(uid, updated);
  };

  // Fetch tasks
  useEffect(() => {
    if (!dateStr || !uid) return;
    setLoading(true);
    const unsubscribeTasks = getTasksForDate(uid, dateStr, (fetchedTasks: any[]) => {
      const activeTasks = fetchedTasks.filter(t => !t.isDeleted);
      const deleted = fetchedTasks.filter(t => t.isDeleted);
      const sortedTasks = [...activeTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
      setTasks(sortedTasks);
      setDeletedTasks(deleted);
      setLoading(false);
    });
    const unsubscribeOrders = getLongTermOrders(uid, dateStr, (fetchedOrders: any[]) => {
      const activeOrders = fetchedOrders.filter(o => !o.isDeleted);
      const deleted = fetchedOrders.filter(o => o.isDeleted);
      setLongTermOrders(activeOrders);
      setDeletedLongTermOrders(deleted);
    });
    return () => {
      unsubscribeTasks();
      unsubscribeOrders();
    };
  }, [dateStr, uid]);

  useEffect(() => {
    setTaskFilter('all');
    /* ⚠️ ADMIN-ONLY: Also reset the section E filter on date change */
    setSectionEFilter('all');
  }, [dateStr]);

  // Automated Midnight Rollover (Runs after 12 at night when opening today's sheet)
  useEffect(() => {
    const runAutoMidnightRollover = async () => {
      if (!uid || !dateStr || loading) return;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Only execute if on today's sheet and today's sheet currently has 0 tasks
      if (dateStr !== todayStr || tasks.length > 0) return;

      const lastAutoCopy = localStorage.getItem(`lastAutoCopy_${uid}`);
      if (lastAutoCopy === todayStr) return; // Already checked/performed today

      const prevDateStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const prevUnfinished = await getUnfinishedTasksForDate(uid, prevDateStr);
      const prevCount = prevUnfinished.length;

      if (prevCount > 5) {
        localStorage.setItem(`lastAutoCopy_${uid}`, todayStr);
        const res = await copyUnfinishedTasksToTargetDate(uid, prevDateStr, todayStr);
        if (res?.copiedCount > 0) {
          showToast(`Midnight Rollover: Auto-copied ${res.copiedCount} task(s) from yesterday to Today!`, "green");
        }
      } else if (prevCount > 0 || (await findPreviousActiveDate(uid, prevDateStr, 7))) {
        localStorage.setItem(`lastAutoCopy_${uid}`, todayStr);
        const priorActive = await findPreviousActiveDate(uid, prevDateStr, 7);
        setLowTaskPrompt({
          isOpen: true,
          sourceDateStr: prevDateStr,
          targetDateStr: todayStr,
          unfinishedTasksCount: prevCount,
          priorActiveDate: priorActive
        });
      }
    };

    runAutoMidnightRollover();
  }, [uid, dateStr, loading, tasks.length]);

  const executeCopyFromSource = async (sourceDateStr: string, targetDateStr: string) => {
    if (!uid) return;
    setIsCopying(true);
    try {
      const result = await copyUnfinishedTasksToTargetDate(uid, sourceDateStr, targetDateStr);
      const copiedCount = result?.copiedCount || 0;
      const formattedSource = format(parseISO(sourceDateStr), 'd MMM');
      if (copiedCount > 0) {
        showToast(`${copiedCount} task${copiedCount > 1 ? 's' : ''} copied from ${formattedSource}`, "green");
      } else {
        showToast(`No new tasks to copy from ${formattedSource}.`, "yellow");
      }
    } catch (err: any) {
      showToast(err?.message || 'Copy failed', 'red');
    } finally {
      setIsCopying(false);
      setLowTaskPrompt(null);
    }
  };

  // Copy previous tasks to currently viewed sheet (dateStr) — now automated via midnight rollover

  const handleCopySelectedToDate = async (targetDateStr: string) => {
    setShowCopyDatePicker(false);
    setIsCopying(true);
    try {
      const taskIds = Object.keys(printSelection);
      const result = await copySelectedTasksToDate(uid, dateStr, taskIds, targetDateStr);
      const copiedCount = result?.copiedCount || 0;
      if (copiedCount > 0) {
        showToast(`${copiedCount} task${copiedCount > 1 ? 's' : ''} copied`, "green");
        setPrintSelection({});
      } else {
        showToast("Tasks already exist on that date.", "yellow");
      }
    } catch (err: any) {
      showToast(err?.message || 'Copy failed', 'red');
    } finally {
      setIsCopying(false);
    }
  };

  const showToast = useCallback((msg: string, color: string = "gray") => {
    setToastMessage(msg);
    setToastColor(color);
    setTimeout(() => setToastMessage(""), 3000);
  }, []);

  const handleRestoreTask = async (task: any) => {
    try {
      await restoreTask(uid, dateStr, task.id);
      showToast("Task restored", "green");
    } catch (err: any) {
      showToast("Failed to restore task", "red");
    }
  };

  const handlePermanentlyDeleteTask = async (task: any) => {
    if (window.confirm(`Are you sure you want to permanently delete "${task.text || task.name || 'this item'}"?`)) {
      try {
        await permanentlyDeleteTask(uid, dateStr, task.id);
        showToast("Task permanently deleted", "red");
      } catch (err: any) {
        showToast("Failed to delete task", "red");
      }
    }
  };

  const handleRestoreLongTermOrder = async (order: any) => {
    try {
      await restoreLongTermOrder(uid, order.id);
      showToast("Order restored", "green");
    } catch (err: any) {
      showToast("Failed to restore order", "red");
    }
  };

  const handlePermanentlyDeleteLongTermOrder = async (order: any) => {
    if (window.confirm(`Are you sure you want to permanently delete "${order.text || 'this order'}"?`)) {
      try {
        await permanentlyDeleteLongTermOrder(uid, order.id);
        showToast("Order permanently deleted", "red");
      } catch (err: any) {
        showToast("Failed to delete order", "red");
      }
    }
  };

  const handleEmptyRecycleBin = async () => {
    const totalCount = deletedTasks.length + deletedLongTermOrders.length;
    if (totalCount === 0) return;
    
    if (window.confirm(`Are you sure you want to permanently delete all ${totalCount} items in the Recycle Bin?`)) {
      setIsCopying(true);
      try {
        // Clear tasks
        for (const task of deletedTasks) {
          await permanentlyDeleteTask(uid, dateStr, task.id);
        }
        // Clear orders
        for (const order of deletedLongTermOrders) {
          await permanentlyDeleteLongTermOrder(uid, order.id);
        }
        showToast("Recycle bin emptied", "red");
        setIsRecycleBinOpen(false);
      } catch (err: any) {
        showToast("Failed to empty recycle bin", "red");
      } finally {
        setIsCopying(false);
      }
    }
  };

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

  /**
   * ⚠️ ADMIN-ONLY — Filter tasks belonging to section "E" (Daily Business Tasks).
   * These are stored in the same Firestore document as other daily tasks but
   * isolated by their section key. This array is ONLY used when isAdmin is true.
   * Do NOT include section "E" tasks in dailyTasksCombined or tasksC.
   */
  const tasksE = tasks.filter(t => t.section === 'E');

  const doneCount = dailyTasksCombined.filter(t => t.color === 'green').length;
  const pendingCount = dailyTasksCombined.filter(t => t.color === 'red').length;
  const inProgressCount = dailyTasksCombined.filter(t => t.color === 'yellow' || !t.color).length;

  const allTasks = [...tasks, ...longTermOrders];
  const selectedTasks = printType === 'selected'
    ? allTasks.filter(t => printSelection[t.id])
    : dailyTasksCombined.filter(t => t.color === taskFilter || (taskFilter === 'yellow' && !t.color));

  const filteredPrintCount = dailyTasksCombined.filter(t => t.color === taskFilter || (taskFilter === 'yellow' && !t.color)).length;

  const selectedDailyTasksCount = dailyTasksCombined.filter(t => printSelection[t.id]).length;

  const handleMoveToLongTerm = async () => {
    if (!uid || selectedDailyTasksCount === 0) return;
    setIsCopying(true);
    try {
      const taskIds = Object.keys(printSelection);
      const dailyTasksToMove = dailyTasksCombined.filter(t => taskIds.includes(t.id));
      
      for (const task of dailyTasksToMove) {
        await addLongTermOrder(uid, {
          text: task.text || '',
          deliveryDate: ''
        });
        await permanentlyDeleteTask(uid, dateStr, task.id);
      }
      
      setPrintSelection(prev => {
        const next = { ...prev };
        dailyTasksToMove.forEach(task => {
          delete next[task.id];
        });
        return next;
      });
      
      showToast(`Moved ${dailyTasksToMove.length} task${dailyTasksToMove.length > 1 ? 's' : ''} to Long-Term Orders`, 'green');
    } catch (err: any) {
      console.error("Failed to move tasks:", err);
      showToast(err?.message || 'Move failed', 'red');
    } finally {
      setIsCopying(false);
    }
  };

  /* ⚠️ Section E label added for admin-only Daily Business Tasks. Do NOT remove. */
  const sectionLabels: Record<string, string> = { A: 'Daily', B: 'Daily', C: 'Payment', D: 'Long-Term', E: 'Business' };
  const colorLabels: Record<string, string> = { red: 'Pending', yellow: 'In Progress', green: 'Done' };
  const toastColorStyles: Record<string, string> = { red: 'bg-red-600', yellow: 'bg-yellow-500', green: 'bg-green-600', gray: 'bg-gray-900 dark:bg-gray-700' };

  if (showSplash) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center">
        <img src="/main.png" alt="Daily Task Manager" className="w-48 h-48 object-contain" />
      </div>
    );
  }

  if (!mounted || checkingAuth || !selectedDate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/80 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-black text-red-600 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your account is not authorized to use this app.</p>
          <button
            onClick={() => { setAccessDenied(false); }}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Try another account
          </button>
        </div>
      </div>
    );
  }

  // Phone verification flow removed

  // Paywall bypassed per user request
  /*
  if (authUser && trialExpired) {
    return (
      <Paywall
        user={authUser}
        onSubscribed={() => setTrialExpired(false)}
      />
    );
  }
  */

  if (!authUser) {
    const handleSignIn = async () => {
      setSignInError('');
      try {
        await signInWithGoogle();
      } catch (err: any) {
        if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
        setSignInError(err?.message || 'Sign-in failed. Make sure Google Auth is enabled in Firebase Console.');
      }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSignInError('');
      setEmailLoading(true);
      try {
        if (isSignUp) {
          await createAccountWithEmail(emailInput, passwordInput);
        } else {
          await signInWithEmail(emailInput, passwordInput);
        }
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          setSignInError('No account found. Please sign up first.');
        } else if (code === 'auth/wrong-password') {
          setSignInError('Incorrect password.');
        } else if (code === 'auth/email-already-in-use') {
          setSignInError('This email is already registered. Try signing in.');
        } else if (code === 'auth/weak-password') {
          setSignInError('Password should be at least 6 characters.');
        } else {
          setSignInError(err?.message || 'Authentication failed.');
        }
      } finally {
        setEmailLoading(false);
      }
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0F172A] transition-colors">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-sm w-full mx-4 flex flex-col items-center text-center"
        >
          <img src="/main.png" alt="Daily Task Manager" className="w-14 h-14 rounded-2xl object-cover mb-6 shadow-lg shadow-blue-600/20" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Daily Task Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-8">Your business, organized.</p>

          {/* Mode toggle */}
          <div className="flex w-full bg-gray-100 dark:bg-[#1E293B] rounded-xl p-1 mb-6">
            <button
              onClick={() => { setLoginMode('google'); setSignInError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                loginMode === 'google'
                  ? 'bg-white dark:bg-[#334155] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >Google</button>
            <button
              onClick={() => { setLoginMode('email'); setSignInError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                loginMode === 'email'
                  ? 'bg-white dark:bg-[#334155] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >Email</button>
          </div>

          {signInError && (
            <p className="text-xs text-red-500 mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl w-full">{signInError}</p>
          )}

          {/* Google sign-in */}
          {loginMode === 'google' && (
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md hover:shadow-lg text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          )}

          {/* Email sign-in / sign-up */}
          {loginMode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="w-full space-y-3">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <input
                type="password"
                required
                minLength={6}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
              >
                {emailLoading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setSignInError(''); }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </form>
          )}

          <div className="mt-8 text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wide">
            By signing in, you agree to our{" "}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>
          </div>

          <div className="hidden lg:flex mt-8 flex-col items-center gap-3 p-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Get the App</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.business.com&hl=en_IN')}`}
              alt="Play Store QR Code"
              className="w-[150px] h-[150px] rounded-lg"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Scan to download on Android</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <UserProvider uid={uid.uid} email={uid.email}>
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex flex-col font-sans text-gray-800 dark:text-[#F1F5F9] transition-colors duration-300">
      <header className="hidden lg:block bg-white dark:bg-[#1E293B] shadow-sm px-4 sm:px-6 py-4 sticky top-0 z-20 print:hidden">
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
            <div className="relative">
              <button
                onClick={() => setDesktopAddMenuOpen(!desktopAddMenuOpen)}
                className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FiPlus size={16} /> Add <FiChevronDown size={14} />
              </button>
              <AnimatePresence>
                {desktopAddMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDesktopAddMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-1.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-[180px]"
                    >
                      <button
                        onClick={() => { setDesktopAddMenuOpen(false); setActiveSection('A'); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#273549] flex items-center gap-2 border-b border-gray-100 dark:border-[#334155]"
                      >
                        <FiClipboard size={14} className="text-blue-600" /> New Task
                      </button>
                      {/* ⚠️ ADMIN-ONLY: Add Daily Business Task option (section E).
                          This menu item is only visible to admin users. Do NOT
                          remove or merge with the regular "New Task" option. */}
                      {isAdmin && (
                      <button
                        onClick={() => { setDesktopAddMenuOpen(false); setActiveSection('E'); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-[#273549] flex items-center gap-2 border-b border-gray-100 dark:border-[#334155]"
                      >
                        <FiBriefcase size={14} className="text-teal-600" /> Daily Business Task
                      </button>
                      )}
                      <button
                        onClick={() => { setDesktopAddMenuOpen(false); setLtoText(''); setLtoDeliveryDate(''); setMobileLtoModalOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#273549] flex items-center gap-2 border-b border-gray-100 dark:border-[#334155]"
                      >
                        <FiBox size={14} className="text-orange-600" /> Long-term Order
                      </button>
                      <button
                        onClick={async () => {
                          setDesktopAddMenuOpen(false);
                          try {
                            await addPayment(uid, dateStr, { name: '', amount: '' });
                            showToast('Payment entry added', 'yellow');
                          } catch (err: any) {
                            showToast(err?.message || 'Failed to add payment', 'red');
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#273549] flex items-center gap-2"
                      >
                        <FiCreditCard size={14} className="text-purple-600" /> Add Payment
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={handleAddList}
              className="flex items-center gap-1.5 text-sm font-semibold bg-white dark:bg-[#1E293B] border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors"
              title="Add new task list"
            >
              <FiPlus size={16} /> <span className="hidden sm:inline">Add List</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549] transition-all duration-300"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <FiLogOut size={18} />
            </button>
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549]">
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button
              onClick={() => setIsRecycleBinOpen(true)}
              className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549] transition-all duration-300"
              title="Recycle Bin"
              aria-label="Recycle Bin"
            >
              <FiTrash2 size={18} />
              {(deletedTasks.length + deletedLongTermOrders.length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {deletedTasks.length + deletedLongTermOrders.length}
                </span>
              )}
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
            {betaFeatures && (
            <button onClick={() => setShowGlance(true)} className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <FiEye size={16} />
              <span className="hidden sm:inline">At a Glance</span>
            </button>
            )}
          </div>
        </div>
      </header>

      <main className={`hidden lg:block flex-1 px-4 py-6 w-full 2xl:max-w-[1800px] mx-auto print:hidden transition-all duration-300 ${isCalendarOpen ? 'pb-32' : 'pb-12'}`}>
        {loading ? (
          <div className="flex justify-center items-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
            <div className="lg:col-span-2 h-full flex flex-col gap-6">
              {/* ================================================================
                  MAIN BUSINESS TASK SECTION (Section A/B)
                  This section is collapsible. When isAdmin is true, the Daily
                  Business Tasks section (E) appears below it — also collapsible.
                  Users can independently collapse either section.
                  ================================================================ */}
              <TaskSection
                title="BUSINESS TASK" icon={FiClipboard} colorClass={{ border: 'border-blue-200', text: 'text-blue-700' }} bgClass="bg-blue-50"
                tasks={dailyTasksCombined} dateStr={dateStr} sectionKey="A" onAddClick={() => setActiveSection('A')}
                printSelection={printSelection} onPrintToggle={handlePrintToggle} onToast={showToast}
                filter={taskFilter} onFilterChange={setTaskFilter}
                isCalendarOpen={isCalendarOpen}
                canRename={false} onRename={function() {}} canRemove={false} onRemove={function() {}}
              />

              {/* ================================================================
                  ⚠️ ADMIN-ONLY: DAILY BUSINESS TASKS SECTION (Section E)
                  ================================================================
                  This is a second, independent daily task list that is ONLY
                  visible to admin emails (arsh5023siddiqui@gmail.com and
                  topsecuritieslko@gmail.com).

                  It uses section key "E" and has its own filter state
                  (sectionEFilter) so it does NOT interfere with the main
                  BUSINESS TASK section above.

                  ⚠️ DO NOT remove, rename, or merge this with the main section
                  in future updates unless explicitly requested by the admin.
                  ================================================================ */}
              {isAdmin && (
                <DailyBusinessTaskSection
                  title="DAILY BUSINESS TASK"
                  icon={FiBriefcase}
                  colorClass={{ border: 'border-teal-200', text: 'text-teal-700' }}
                  bgClass="bg-teal-50"
                  tasks={tasksE}
                  dateStr={dateStr}
                  onAddClick={() => setActiveSection('E')}
                  printSelection={printSelection}
                  onPrintToggle={handlePrintToggle}
                  onToast={showToast}
                  filter={sectionEFilter}
                  onFilterChange={setSectionEFilter}
                  isCalendarOpen={isCalendarOpen}
                />
              )}

              {taskLists.filter(l => !l.system).map(list => {
                const listTasks = tasks.filter(t => t.section === list.key);
                const col = TASK_LIST_COLORS[list.color] || TASK_LIST_COLORS.indigo;
                return (
                  <TaskSection
                    key={list.key}
                    title={list.title}
                    icon={FiClipboard}
                    colorClass={{ border: col.border, text: col.text }}
                    bgClass={col.bg}
                    tasks={listTasks}
                    dateStr={dateStr}
                    sectionKey={list.key}
                    onAddClick={() => setActiveSection(list.key)}
                    printSelection={printSelection}
                    onPrintToggle={handlePrintToggle}
                    onToast={showToast}
                    filter={taskFilter}
                    onFilterChange={setTaskFilter}
                    isCalendarOpen={isCalendarOpen}
                    canRename={true}
                    onRename={function() { handleRenameList(list.key); }}
                    canRemove={true}
                    onRemove={function() { handleRemoveList(list.key); }}
                  />
                );
              })}
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6 h-full">
              <div className="flex-none">
                <PaymentSection
                  title="Short Payment Reminder" icon={FiCreditCard} colorClass={{ border: 'border-purple-200', text: 'text-purple-700' }} bgClass="bg-purple-50"
                  tasks={tasksC} dateStr={dateStr} printSelection={printSelection} onPrintToggle={handlePrintToggle} onToast={showToast}
                />
              </div>
              <div className="flex-1 min-h-0">
                <LongTermOrdersSection
                  title="Long Term Order" icon={FiBox} colorClass={{ border: 'border-orange-200', text: 'text-orange-700' }} bgClass="bg-orange-50"
                  dateStr={dateStr} printSelection={printSelection} onPrintToggle={handlePrintToggle} onToast={showToast}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE LAYOUT (below lg) */}
      <header className="lg:hidden bg-white dark:bg-[#1E293B] sticky top-0 z-20 px-3 pt-3 pb-2 shadow-sm border-b border-gray-200/60 dark:border-[#334155]/60 print:hidden">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-tight">Business Task</h1>
            <div className="text-[10px] font-medium text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider">
              {format(selectedDate, 'EEE, MMM d, yyyy')}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {betaFeatures && (
            <button
              onClick={() => setShowGlance(true)}
              className="h-8 w-8 rounded-md flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200/60 dark:border-indigo-800"
              aria-label="Tasks at a glance"
            >
              <FiEye size={16} />
            </button>
            )}
            <button
              onClick={toggleDarkMode}
              className="h-8 w-8 rounded-md flex items-center justify-center bg-gray-50 dark:bg-[#273549] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors border border-gray-200/60 dark:border-[#334155]"
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            <button
              onClick={handleLogout}
              className="h-8 w-8 rounded-md flex items-center justify-center bg-gray-50 dark:bg-[#273549] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors border border-gray-200/60 dark:border-[#334155]"
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut size={16} />
            </button>

            <button
              onClick={() => setIsRecycleBinOpen(true)}
              className="relative h-8 w-8 rounded-md flex items-center justify-center bg-gray-50 dark:bg-[#273549] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors border border-gray-200/60 dark:border-[#334155]"
              aria-label="Recycle Bin"
              title="Recycle Bin"
            >
              <FiTrash2 size={16} />
              {(deletedTasks.length + deletedLongTermOrders.length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-pulse">
                  {deletedTasks.length + deletedLongTermOrders.length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => { setMobilePrintMenuOpen(!mobilePrintMenuOpen); setMobileAddMenuOpen(false); }}
                className="h-8 px-2.5 rounded-md bg-gray-50 dark:bg-[#273549] border border-gray-200/60 dark:border-[#334155] text-gray-700 dark:text-gray-200 flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
              >
                <FiPrinter size={14} />
                <span className="text-[10px] font-bold uppercase">Print</span>
                <FiChevronDown size={12} />
              </button>
              <AnimatePresence>
                {mobilePrintMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMobilePrintMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] rounded-md shadow-lg z-40 overflow-hidden"
                    >
                      <button
                        onClick={() => { setMobilePrintMenuOpen(false); handlePrint('filtered'); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#273549] border-b border-gray-100 dark:border-[#334155]"
                      >
                        Print Filtered
                      </button>
                      <button
                        onClick={() => { setMobilePrintMenuOpen(false); handlePrint('selected', 'print'); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#273549] border-b border-gray-100 dark:border-[#334155]"
                      >
                        Print Selected
                      </button>
                      <button
                        onClick={() => { setMobilePrintMenuOpen(false); handlePrint('selected', 'pdf'); }}
                        className="w-full text-left px-3 py-2 text-[10px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#273549]"
                      >
                        Save to PDF
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Sub-header: filter chips + add button */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200/40 dark:border-[#334155]/40">
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <div className="flex items-center pr-2 gap-1">
              <button
                onClick={() => setTaskFilter('all')}
                className={`flex items-center gap-0.5 py-0.5 px-2 rounded-full transition-colors shrink-0 ${
                  taskFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-tight">All ({dailyTasksCombined.length})</span>
              </button>
              <button
                onClick={() => setTaskFilter('green')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors shrink-0 border ${
                  taskFilter === 'green'
                    ? 'bg-[#10b981] text-white border-[#10b981]'
                    : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981]/20'
                }`}
              >
                <FiCheck size={10} />
                <span className="text-[9px] font-bold tracking-tight uppercase">
                  <span className="opacity-70 font-medium mr-1">Done:</span>{doneCount}
                </span>
              </button>
              <button
                onClick={() => setTaskFilter('yellow')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors shrink-0 border ${
                  taskFilter === 'yellow'
                    ? 'bg-[#f59e0b] text-white border-[#f59e0b]'
                    : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 hover:bg-[#f59e0b]/20'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-[9px] font-bold tracking-tight uppercase">
                  <span className="opacity-70 font-medium mr-1">Active:</span>{inProgressCount}
                </span>
              </button>
              <button
                onClick={() => setTaskFilter('red')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors shrink-0 border ${
                  taskFilter === 'red'
                    ? 'bg-[#ef4444] text-white border-[#ef4444]'
                    : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20 hover:bg-[#ef4444]/20'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-[9px] font-bold tracking-tight uppercase">
                  <span className="opacity-70 font-medium mr-1">Pending:</span>{pendingCount}
                </span>
              </button>
            </div>
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => { setMobileAddMenuOpen(!mobileAddMenuOpen); setMobilePrintMenuOpen(false); }}
              className="h-7 px-2 rounded-md bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FiPlus size={14} />
              <FiChevronDown size={11} />
            </button>
            <AnimatePresence>
              {mobileAddMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMobileAddMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] rounded-md shadow-lg z-40 overflow-hidden"
                  >
                    <button
                      onClick={() => { setMobileAddMenuOpen(false); setActiveSection('A'); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#273549] border-b border-gray-100 dark:border-[#334155]"
                    >
                      New Task
                    </button>
                    {/* ⚠️ ADMIN-ONLY: Mobile add menu option for Daily Business Task (section E).
                        Do NOT remove or merge with "New Task" in future updates. */}
                    {isAdmin && (
                    <button
                      onClick={() => { setMobileAddMenuOpen(false); setActiveSection('E'); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-gray-800 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-[#273549] border-b border-gray-100 dark:border-[#334155]"
                    >
                      Daily Business Task
                    </button>
                    )}
                    <button
                      onClick={() => { setMobileAddMenuOpen(false); setLtoText(''); setLtoDeliveryDate(''); setMobileLtoModalOpen(true); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#273549] border-b border-gray-100 dark:border-[#334155]"
                    >
                      Long-term Order
                    </button>
                    <button
                      onClick={async () => {
                        setMobileAddMenuOpen(false);
                        await addPayment(uid, dateStr, { name: '', amount: '' });
                        showToast('Payment entry added', 'yellow');
                      }}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-[#273549] border-b border-gray-100 dark:border-[#334155]"
                    >
                      Add Payment
                    </button>
                    <button
                      onClick={() => { setMobileAddMenuOpen(false); handleAddList(); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-[#273549]"
                    >
                      Add List
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className={`lg:hidden flex-1 px-2 py-2 flex flex-col gap-2 print:hidden transition-all duration-300 ${isCalendarOpen ? 'pb-32' : 'pb-12'}`}>
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {/* The TaskSection itself renders the mobile MobileTaskCard grid */}
            {/* Mobile main BUSINESS TASK section (Section A/B) */}
            <TaskSection
              title="BUSINESS TASK"
              icon={FiClipboard}
              colorClass={{ border: 'border-blue-200', text: 'text-blue-700' }}
              bgClass="bg-blue-50"
              tasks={dailyTasksCombined}
              dateStr={dateStr}
              sectionKey="A"
              onAddClick={() => setActiveSection('A')}
              printSelection={printSelection}
              onPrintToggle={handlePrintToggle}
              onToast={showToast}
              filter={taskFilter}
              onFilterChange={setTaskFilter}
              isCalendarOpen={isCalendarOpen}
              canRename={false} onRename={function() {}} canRemove={false} onRemove={function() {}}
            />

            {/* ================================================================
                ⚠️ ADMIN-ONLY: MOBILE — Daily Business Tasks Section (Section E)
                ================================================================
                Same feature as the desktop version above. Independently
                collapsible from the main BUSINESS TASK section.
                Do NOT remove or merge in future updates.
                ================================================================ */}
            {isAdmin && (
              <DailyBusinessTaskSection
                title="DAILY BUSINESS TASK"
                icon={FiBriefcase}
                colorClass={{ border: 'border-teal-200', text: 'text-teal-700' }}
                bgClass="bg-teal-50"
                tasks={tasksE}
                dateStr={dateStr}
                onAddClick={() => setActiveSection('E')}
                printSelection={printSelection}
                onPrintToggle={handlePrintToggle}
                onToast={showToast}
                filter={sectionEFilter}
                onFilterChange={setSectionEFilter}
                isCalendarOpen={isCalendarOpen}
              />
            )}

            {taskLists.filter(l => !l.system).map(list => {
              const listTasks = tasks.filter(t => t.section === list.key);
              const col = TASK_LIST_COLORS[list.color] || TASK_LIST_COLORS.indigo;
              return (
                <TaskSection
                  key={list.key}
                  title={list.title}
                  icon={FiClipboard}
                  colorClass={{ border: col.border, text: col.text }}
                  bgClass={col.bg}
                  tasks={listTasks}
                  dateStr={dateStr}
                  sectionKey={list.key}
                  onAddClick={() => setActiveSection(list.key)}
                  printSelection={printSelection}
                  onPrintToggle={handlePrintToggle}
                  onToast={showToast}
                  filter={taskFilter}
                  onFilterChange={setTaskFilter}
                  isCalendarOpen={isCalendarOpen}
                  canRename={true}
                  onRename={function() { handleRenameList(list.key); }}
                  canRemove={true}
                  onRemove={function() { handleRemoveList(list.key); }}
                />
              );
            })}

            {/* Compact bottom: Payments + Long Term Orders */}
            <div className="flex flex-col gap-1.5 mt-1">
              <PaymentSection
                title="Payments"
                icon={FiCreditCard}
                colorClass={{ border: 'border-purple-200', text: 'text-purple-700' }}
                bgClass="bg-purple-50"
                tasks={tasksC}
                dateStr={dateStr}
                printSelection={printSelection}
                onPrintToggle={handlePrintToggle}
                onToast={showToast}
              />
              <LongTermOrdersSection
                title="Long Term Orders"
                icon={FiBox}
                colorClass={{ border: 'border-orange-200', text: 'text-orange-700' }}
                bgClass="bg-orange-50"
                dateStr={dateStr}
                printSelection={printSelection}
                onPrintToggle={handlePrintToggle}
                onToast={showToast}
              />
            </div>
          </>
        )}
      </main>

      {/* Long-Term Order quick modal (works on mobile + desktop, opened from + Add menu) */}
      <AnimatePresence>
        {mobileLtoModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setMobileLtoModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-md bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl z-[70] flex flex-col gap-4"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-2 sm:hidden" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                📦 Add Long Term Order
              </h3>
              <input
                type="text"
                value={ltoText}
                onChange={(e) => setLtoText(e.target.value)}
                placeholder="Order description..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#334155] dark:bg-[#273549] dark:text-gray-100 focus:ring-2 focus:ring-orange-400 outline-none text-base"
              />
              <input
                type="date"
                value={ltoDeliveryDate}
                onChange={(e) => setLtoDeliveryDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#334155] dark:bg-[#273549] dark:text-gray-100 focus:ring-2 focus:ring-orange-400 outline-none text-base cursor-pointer"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMobileLtoModalOpen(false)}
                  className="px-5 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!ltoText.trim() || !ltoDeliveryDate}
                  onClick={async () => {
                    if (!ltoText.trim() || !ltoDeliveryDate) return;
                    try {
                      await addLongTermOrder(uid, { text: ltoText.trim(), deliveryDate: ltoDeliveryDate });
                      setMobileLtoModalOpen(false);
                      showToast('New order added', 'green');
                    } catch (err: any) {
                      console.error('Failed to add long-term order:', err);
                      showToast(err?.message || 'Failed to add order', 'red');
                    }
                  }}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md flex-1"
                >
                  Save Order
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
        {isRecycleBinOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
              onClick={() => setIsRecycleBinOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-xl bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl z-[90] flex flex-col gap-4 max-h-[90vh] sm:max-h-[80vh]"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto sm:hidden mb-2" />
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FiTrash2 className="text-red-500" /> Recycle Bin
                  <span className="text-xs bg-gray-100 dark:bg-[#273549] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-semibold">
                    {deletedTasks.length + deletedLongTermOrders.length} items
                  </span>
                </h3>
                {(deletedTasks.length + deletedLongTermOrders.length) > 0 && (
                  <button
                    onClick={handleEmptyRecycleBin}
                    disabled={isCopying}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                  >
                    Empty Bin
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 py-1 flex flex-col gap-2 min-h-[150px] max-h-[50vh] sm:max-h-[55vh]">
                {(deletedTasks.length + deletedLongTermOrders.length) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-4xl mb-3">♻️</span>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Recycle Bin is empty</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Deleted items will appear here for recovery.</p>
                  </div>
                ) : (
                  <>
                    {/* Render Deleted Tasks & Payments */}
                    {deletedTasks.map((task) => {
                      const isPayment = task.section === 'C';
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#273549] border border-gray-100 dark:border-gray-800 rounded-2xl gap-4 hover:shadow-sm transition-all"
                        >
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isPayment 
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' 
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                              }`}>
                                {isPayment ? 'Payment' : 'Daily Task'}
                              </span>
                              {task.deletedAt && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  Deleted {format(new Date(task.deletedAt), 'd MMM, HH:mm')}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                              {task.text || task.name}
                            </span>
                            {isPayment && (task.amount > 0 || task.expectedTime) && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {task.amount > 0 && `Amount: ₹${task.amount}`}
                                {task.amount > 0 && task.expectedTime && ' • '}
                                {task.expectedTime && `Expected: ${task.expectedTime}`}
                              </span>
                            )}
                            {!isPayment && task.description && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {task.description}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleRestoreTask(task)}
                              title="Restore"
                              aria-label="Restore"
                              className="p-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-all"
                            >
                              <FiRotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => handlePermanentlyDeleteTask(task)}
                              title="Delete Permanently"
                              aria-label="Delete Permanently"
                              className="p-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Render Deleted Long-Term Orders */}
                    {deletedLongTermOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#273549] border border-gray-100 dark:border-gray-800 rounded-2xl gap-4 hover:shadow-sm transition-all"
                      >
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                              Long-Term
                            </span>
                            {order.deletedAt && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                Deleted {format(new Date(order.deletedAt), 'd MMM, HH:mm')}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {order.text}
                          </span>
                          {order.deliveryDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              Delivery Date: {format(new Date(order.deliveryDate), 'd MMM yyyy')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRestoreLongTermOrder(order)}
                            title="Restore"
                            aria-label="Restore"
                            className="p-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-all"
                          >
                            <FiRotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => handlePermanentlyDeleteLongTermOrder(order)}
                            title="Delete Permanently"
                            aria-label="Delete Permanently"
                            className="p-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setIsRecycleBinOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 dark:bg-[#273549] text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-[#334155] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

      {/* Low Task Count Prompt Modal */}
      <AnimatePresence>
        {lowTaskPrompt && lowTaskPrompt.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
              onClick={() => setLowTaskPrompt(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              className="fixed top-1/2 left-1/2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-2xl z-[70] w-[92%] max-w-md space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                  <FiAlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    Copy Tasks to Sheet ({format(parseISO(lowTaskPrompt.targetDateStr), 'dd MMM')})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Low task count detected on previous sheet
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-800">
                {lowTaskPrompt.unfinishedTasksCount > 0 ? (
                  <p>
                    Yesterday (<strong className="text-blue-600 dark:text-blue-400">{format(parseISO(lowTaskPrompt.sourceDateStr), 'dd MMM')}</strong>) has only <strong className="text-amber-600 dark:text-amber-400">{lowTaskPrompt.unfinishedTasksCount} unfinished task(s)</strong> (low count, e.g. Sunday or off day).
                  </p>
                ) : (
                  <p>
                    Yesterday (<strong className="text-blue-600 dark:text-blue-400">{format(parseISO(lowTaskPrompt.sourceDateStr), 'dd MMM')}</strong>) has <strong className="text-red-500">0 unfinished tasks</strong>.
                  </p>
                )}

                {lowTaskPrompt.priorActiveDate && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 pt-2 border-t border-gray-200 dark:border-gray-800 font-medium">
                    💡 Found active day from {lowTaskPrompt.priorActiveDate.daysAgo} day(s) ago ({format(parseISO(lowTaskPrompt.priorActiveDate.dateStr), 'dd MMM')}) with <strong>{lowTaskPrompt.priorActiveDate.count} tasks</strong>!
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {lowTaskPrompt.unfinishedTasksCount > 0 && (
                  <button
                    onClick={() => executeCopyFromSource(lowTaskPrompt.sourceDateStr, lowTaskPrompt.targetDateStr)}
                    disabled={isCopying}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCopying && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                    Copy {lowTaskPrompt.unfinishedTasksCount} Task(s) from Yesterday ({format(parseISO(lowTaskPrompt.sourceDateStr), 'dd MMM')})
                  </button>
                )}

                {lowTaskPrompt.priorActiveDate && (
                  <button
                    onClick={() => executeCopyFromSource(lowTaskPrompt.priorActiveDate!.dateStr, lowTaskPrompt.targetDateStr)}
                    disabled={isCopying}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCopying && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                    Copy {lowTaskPrompt.priorActiveDate.count} Task(s) from {format(parseISO(lowTaskPrompt.priorActiveDate.dateStr), 'dd MMM')} (Prior Active Day)
                  </button>
                )}

                <button
                  onClick={() => {
                    setLowTaskPrompt(null);
                    setShowCopyDatePicker(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-[#273549] hover:bg-gray-200 dark:hover:bg-[#334155] text-gray-800 dark:text-gray-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  📅 Pick Custom Date to Copy From...
                </button>

                <button
                  onClick={() => setLowTaskPrompt(null)}
                  className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick date picker for copying tasks */}
      <AnimatePresence>
        {showCopyDatePicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowCopyDatePicker(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-2xl z-50 w-[90%] max-w-xs">
              {selectedPrintCount > 0 ? (
                <>
                  <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Copy {selectedPrintCount} selected task{selectedPrintCount > 1 ? 's' : ''} to:</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Pick a target date</p>
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2, 3].map(offset => {
                      const d = addDays(new Date(), offset);
                      const dStr = format(d, 'yyyy-MM-dd');
                      const isCurrentSheet = dStr === dateStr;
                      return (
                        <button
                          key={offset}
                          disabled={isCurrentSheet}
                          onClick={() => handleCopySelectedToDate(dStr)}
                          className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                            isCurrentSheet
                              ? 'bg-gray-100 dark:bg-[#273549] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                          }`}
                        >
                          {offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : format(d, 'EEE, d MMM')}
                          <span className="text-xs font-normal ml-2 opacity-60">{format(d, 'yyyy-MM-dd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Copy Tasks FROM Date:</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Select source date to copy into this sheet ({format(parseISO(dateStr), 'dd MMM')})</p>
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3, 4, 5, 7].map(offset => {
                      const d = subDays(parseISO(dateStr), offset);
                      const dStr = format(d, 'yyyy-MM-dd');
                      return (
                        <button
                          key={offset}
                          onClick={() => {
                            setShowCopyDatePicker(false);
                            executeCopyFromSource(dStr, dateStr);
                          }}
                          className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-between"
                        >
                          <span>{offset === 1 ? 'Yesterday' : `${offset} days ago`}</span>
                          <span className="text-xs opacity-70">{format(d, 'EEE, d MMM')}</span>
                        </button>
                      );
                    })}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Or pick exact date:</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white"
                        onChange={(e) => {
                          if (e.target.value) {
                            setShowCopyDatePicker(false);
                            executeCopyFromSource(e.target.value, dateStr);
                          }
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
              <button onClick={() => setShowCopyDatePicker(false)} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDailyTasksCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              x: '-50%',
              transition: { type: 'spring', damping: 25, stiffness: 350 }
            }}
            exit={{ opacity: 0, y: 50, x: '-50%', transition: { duration: 0.2 } }}
            className={`fixed z-[99] left-1/2 -translate-x-1/2 w-[92%] sm:w-full sm:max-w-md lg:max-w-xl backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl p-4 flex flex-row items-center justify-between gap-4 transition-all duration-300 lg:top-6 lg:bottom-auto ${isCalendarOpen ? 'bottom-28' : 'bottom-6'}`}
          >
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedDailyTasksCount} Task{selectedDailyTasksCount > 1 ? 's' : ''} Selected
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                From Business Tasks
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintSelection(prev => {
                  const next = { ...prev };
                  dailyTasksCombined.forEach(t => {
                    delete next[t.id];
                  });
                  return next;
                })}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#273549] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={handleMoveToLongTerm}
                disabled={isCopying}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isCopying ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                ) : (
                  <FiBox size={14} />
                )}
                Move to Long-Term
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toastMessage && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-24 left-1/2 -translate-x-1/2 ${toastColorStyles[toastColor]} text-white px-5 py-3 rounded-xl shadow-2xl z-50 font-medium`}>
          {toastMessage}
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>
        {showDemoPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
              onClick={() => setShowDemoPopup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
              className="fixed top-1/2 left-1/2 bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-2xl z-[90] w-[92%] max-w-sm text-center space-y-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-5xl mb-2">📞</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Welcome to Daily Task Manager!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get a free demo of the app. Call us at:
              </p>
              <a
                href="tel:+919044379748"
                className="block text-2xl font-black text-blue-600 dark:text-blue-400 hover:underline py-2"
              >
                9044379748
              </a>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Available for the first 3 days of your account.
              </p>
              <button
                onClick={() => setShowDemoPopup(false)}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <GlanceModal
        isOpen={showGlance}
        onClose={() => setShowGlance(false)}
        tasks={dailyTasksCombined as any}
        selectedDate={selectedDate}
      />
    </div>
    </UserProvider>
  );
}
