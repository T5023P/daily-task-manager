import { db } from './firebase';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs,
  deleteField,
} from 'firebase/firestore';
import { format } from 'date-fns';

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const resolvePath = (userOrUid) => {
  if (userOrUid && typeof userOrUid === 'object') {
    return {
      uid: userOrUid.uid,
      isAdmin: !!userOrUid.isAdmin
    };
  }
  return {
    uid: userOrUid || '',
    isAdmin: false
  };
};

const requireUid = (uid) => {
  if (!uid) throw new Error('User ID is required for Firestore operations');
  return uid;
};

const getTaskDocRef = (userOrUid, dateStr) => {
  if (!dateStr) throw new Error('dateStr is required for Firestore operations');
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (isAdmin) {
    return doc(db, 'dailyTasks', dateStr);
  }
  return doc(db, 'users', requireUid(uid), 'dailyTasks', dateStr);
};

const getLongTermColRef = (userOrUid) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (isAdmin) {
    return collection(db, 'longTermOrders');
  }
  return collection(db, 'users', requireUid(uid), 'longTermOrders');
};

const getLongTermDocRef = (userOrUid, orderId) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (isAdmin) {
    return doc(db, 'longTermOrders', orderId);
  }
  return doc(db, 'users', requireUid(uid), 'longTermOrders', orderId);
};

const getDailyTasksColRef = (userOrUid) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (isAdmin) {
    return collection(db, 'dailyTasks');
  }
  return collection(db, 'users', requireUid(uid), 'dailyTasks');
};

const getOutstandingColRef = (userOrUid) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (isAdmin) {
    return collection(db, 'outstandingCollections');
  }
  return collection(db, 'users', requireUid(uid), 'outstandingCollections');
};

const getOutstandingDocRef = (userOrUid, itemId) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (isAdmin) {
    return doc(db, 'outstandingCollections', itemId);
  }
  return doc(db, 'users', requireUid(uid), 'outstandingCollections', itemId);
};

/**
 * 1. getTasksForDate
 */
export const getTasksForDate = (userOrUid, dateStr, onUpdate) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if ((!isAdmin && !uid) || !dateStr) {
    onUpdate([]);
    return () => {};
  }
  try {
    const docRef = getTaskDocRef(userOrUid, dateStr);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onUpdate(data.tasks || []);
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        console.error('Firestore onSnapshot error (DailyTasks):', error);
        onUpdate([]);
      }
    );
  } catch (err) {
    console.error('Error setting up onSnapshot:', err);
    onUpdate([]);
    return () => {};
  }
};

/**
 * 2. addTask
 */
export const addTask = async (uid, dateStr, taskText, section = 'A', priority = 'medium') => {
  try {
    const docRef = getTaskDocRef(uid, dateStr);
    const docSnap = await getDoc(docRef);
    let order = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      order = data.tasks ? data.tasks.length : 0;
    }

    const newTask = {
      id: generateId(),
      text: taskText,
      color: 'yellow',
      section,
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      order,
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, { tasks: arrayUnion(newTask) });
    } else {
      await setDoc(docRef, { tasks: [newTask] });
    }
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

/**
 * 3. updateTask
 */
export const updateTask = async (uid, dateStr, taskId, updates) => {
  try {
    const docRef = getTaskDocRef(uid, dateStr);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedTasks = data.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      );
      await updateDoc(docRef, { tasks: updatedTasks });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

/**
 * 4. deleteTask (Soft Delete)
 */
export const deleteTask = async (uid, dateStr, taskId) => {
  try {
    await updateTask(uid, dateStr, taskId, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error soft-deleting task:', error);
    throw error;
  }
};

/**
 * 4b. permanentlyDeleteTask
 */
export const permanentlyDeleteTask = async (uid, dateStr, taskId) => {
  try {
    const docRef = getTaskDocRef(uid, dateStr);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const taskToRemove = data.tasks.find((task) => task.id === taskId);
      if (taskToRemove) {
        await updateDoc(docRef, { tasks: arrayRemove(taskToRemove) });
      }
    }
  } catch (error) {
    console.error('Error permanently deleting task:', error);
    throw error;
  }
};

/**
 * 4c. restoreTask
 */
export const restoreTask = async (uid, dateStr, taskId) => {
  try {
    const docRef = getTaskDocRef(uid, dateStr);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedTasks = data.tasks.map((task) => {
        if (task.id === taskId) {
          const { isDeleted, deletedAt, ...rest } = task;
          return rest;
        }
        return task;
      });
      await updateDoc(docRef, { tasks: updatedTasks });
    }
  } catch (error) {
    console.error('Error restoring task:', error);
    throw error;
  }
};

/**
 * 5. copyUnfinishedTasksToToday
 */
export const copyUnfinishedTasksToTargetDate = async (uid, sourceDateStr, targetDateStr) => {
  try {
    const sourceDocRef = getTaskDocRef(uid, sourceDateStr);
    const sourceSnap = await getDoc(sourceDocRef);

    if (!sourceSnap.exists()) return { copiedCount: 0 };

    const sourceTasks = (sourceSnap.data().tasks || []).filter((task) => !task.isDeleted);
    const unfinishedTasks = sourceTasks.filter((task) => task.color !== 'green');

    if (unfinishedTasks.length === 0) return { copiedCount: 0 };

    const targetDocRef = getTaskDocRef(uid, targetDateStr);
    const targetSnap = await getDoc(targetDocRef);
    const targetTasks = targetSnap.exists() ? targetSnap.data().tasks || [] : [];

    const tasksToCopy = unfinishedTasks.filter(
      (unfTask) => !targetTasks.some((nt) => nt.text?.toLowerCase() === unfTask.text?.toLowerCase() && !nt.isDeleted)
    );

    if (tasksToCopy.length === 0) return { copiedCount: 0, targetDateStr };

    const newTasksToCopy = tasksToCopy.map((task, index) => ({
      ...task,
      id: generateId(),
      color: 'yellow',
      createdAt: new Date().toISOString(),
      order: index,
    }));

    const shiftedExistingTasks = targetTasks.map((task) => ({
      ...task,
      order: (task.order || 0) + newTasksToCopy.length,
    }));

    const combinedTasks = [...newTasksToCopy, ...shiftedExistingTasks];

    if (targetSnap.exists()) {
      await updateDoc(targetDocRef, { tasks: combinedTasks });
    } else {
      await setDoc(targetDocRef, { tasks: combinedTasks });
    }

    return { copiedCount: tasksToCopy.length, targetDateStr, sourceDateStr };
  } catch (error) {
    console.error('Error copying tasks to target date:', error);
    throw error;
  }
};

export const copyUnfinishedTasksToToday = async (uid, dateStr) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return copyUnfinishedTasksToTargetDate(uid, dateStr, todayStr);
};

export const getUnfinishedTasksForDate = async (uid, dateStr) => {
  try {
    const docRef = getTaskDocRef(uid, dateStr);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return [];
    const tasks = (snap.data().tasks || []).filter((task) => !task.isDeleted);
    return tasks.filter((task) => task.color !== 'green');
  } catch (err) {
    console.error('Error fetching unfinished tasks for date:', err);
    return [];
  }
};

export const findPreviousActiveDate = async (uid, fromDateStr, maxDaysBack = 10) => {
  try {
    const baseDate = new Date(fromDateStr + 'T00:00:00');
    for (let i = 1; i <= maxDaysBack; i++) {
      const prevDateObj = new Date(baseDate);
      prevDateObj.setDate(baseDate.getDate() - i);
      const prevDateStr = format(prevDateObj, 'yyyy-MM-dd');
      const unfinished = await getUnfinishedTasksForDate(uid, prevDateStr);
      if (unfinished.length > 0) {
        return {
          dateStr: prevDateStr,
          count: unfinished.length,
          daysAgo: i,
          tasks: unfinished
        };
      }
    }
    return null;
  } catch (err) {
    console.error('Error finding previous active date:', err);
    return null;
  }
};


/**
 * 5b. copySelectedTasksToDate - copies specific tasks to a chosen date, color becomes yellow
 */
export const copySelectedTasksToDate = async (uid, sourceDateStr, taskIds, targetDateStr) => {
  try {
    const sourceDocRef = getTaskDocRef(uid, sourceDateStr);
    const sourceSnap = await getDoc(sourceDocRef);

    if (!sourceSnap.exists()) return { copiedCount: 0 };

    const sourceTasks = sourceSnap.data().tasks || [];
    const selectedTasks = sourceTasks.filter((t) => taskIds.includes(t.id));

    if (selectedTasks.length === 0) return { copiedCount: 0 };

    const targetDocRef = getTaskDocRef(uid, targetDateStr);
    const targetSnap = await getDoc(targetDocRef);
    const targetTasks = targetSnap.exists() ? targetSnap.data().tasks || [] : [];

    const tasksToCopy = selectedTasks.filter(
      (st) => !targetTasks.some((tt) => tt.text?.toLowerCase() === st.text?.toLowerCase())
    );

    if (tasksToCopy.length === 0) return { copiedCount: 0 };

    const newTasks = tasksToCopy.map((task, index) => ({
      ...task,
      id: generateId(),
      color: 'yellow',
      createdAt: new Date().toISOString(),
      order: index,
    }));

    const shiftedExisting = targetTasks.map((task) => ({
      ...task,
      order: (task.order || 0) + newTasks.length,
    }));

    const combined = [...newTasks, ...shiftedExisting];

    if (targetSnap.exists()) {
      await updateDoc(targetDocRef, { tasks: combined });
    } else {
      await setDoc(targetDocRef, { tasks: combined });
    }

    return { copiedCount: tasksToCopy.length };
  } catch (error) {
    console.error('Error copying selected tasks:', error);
    throw error;
  }
};

/**
 * 6. addPayment
 */
export const addPayment = async (uid, dateStr, paymentData) => {
  try {
    const docRef = getTaskDocRef(uid, dateStr);
    const docSnap = await getDoc(docRef);

    let order = 0;
    if (docSnap.exists()) {
      const data = docSnap.data();
      order = data.tasks ? data.tasks.length : 0;
    }

    const newPayment = {
      id: generateId(),
      type: 'payment',
      section: 'C',
      color: 'red',
      text: paymentData.name || 'New Payment',
      name: paymentData.name || '',
      amount: paymentData.amount || 0,
      expectedTime: paymentData.expectedTime || 'Today EOD',
      createdAt: new Date().toISOString(),
      order,
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, { tasks: arrayUnion(newPayment) });
    } else {
      await setDoc(docRef, { tasks: [newPayment] });
    }
  } catch (error) {
    console.error('Error adding payment:', error);
    throw error;
  }
};

// ============================================================
// LONG-TERM ORDERS (per-user)
// ============================================================

export const getLongTermOrders = (userOrUid, currentDateStr, onUpdate) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (!isAdmin && !uid) {
    onUpdate([]);
    return () => {};
  }
  try {
    const colRef = getLongTermColRef(userOrUid);

    // Query 1: Active/pending orders (color is not green)
    const qActive = query(colRef, where('color', '!=', 'green'));

    // Query 2: Orders completed today
    const qCompletedToday = query(colRef, where('completedDate', '==', currentDateStr || ''));

    let activeOrders = [];
    let completedOrders = [];

    const mergeAndEmit = () => {
      const seen = new Set();
      const combined = [];
      [...activeOrders, ...completedOrders].forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      });
      onUpdate(combined);
    };

    const unsubActive = onSnapshot(
      qActive,
      (snapshot) => {
        activeOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        mergeAndEmit();
      },
      (error) => {
        console.error('Firestore active orders listen error:', error);
      }
    );

    const unsubCompleted = onSnapshot(
      qCompletedToday,
      (snapshot) => {
        completedOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        mergeAndEmit();
      },
      (error) => {
        console.error('Firestore completed orders listen error:', error);
      }
    );

    return () => {
      unsubActive();
      unsubCompleted();
    };
  } catch (err) {
    console.error('Error setting up onSnapshot (LongTerm):', err);
    onUpdate([]);
    return () => {};
  }
};

export const addLongTermOrder = async (uid, orderData) => {
  try {
    const colRef = getLongTermColRef(uid);
    await addDoc(colRef, {
      text: orderData.text || '',
      deliveryDate: orderData.deliveryDate || '',
      color: 'red',
      completedDate: null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding long term order:', error);
    throw error;
  }
};

export const updateLongTermOrder = async (uid, orderId, updates, currentDateStr) => {
  try {
    const docRef = getLongTermDocRef(uid, orderId);
    if (updates.color === 'green') {
      updates.completedDate = currentDateStr;
    } else if (updates.color && updates.color !== 'green') {
      updates.completedDate = null;
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating long term order:', error);
    throw error;
  }
};

export const deleteLongTermOrder = async (uid, orderId) => {
  try {
    const docRef = getLongTermDocRef(uid, orderId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error soft-deleting long term order:', error);
    throw error;
  }
};

export const permanentlyDeleteLongTermOrder = async (uid, orderId) => {
  try {
    const docRef = getLongTermDocRef(uid, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error permanently deleting long term order:', error);
    throw error;
  }
};

export const restoreLongTermOrder = async (uid, orderId) => {
  try {
    const docRef = getLongTermDocRef(uid, orderId);
    await updateDoc(docRef, {
      isDeleted: deleteField(),
      deletedAt: deleteField()
    });
  } catch (error) {
    console.error('Error restoring long term order:', error);
    throw error;
  }
};

// ============================================================
// OUTSTANDING COLLECTIONS (persistent, per-user / admin shared)
// ============================================================

export const getOutstandingCollections = (userOrUid, onUpdate) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (!isAdmin && !uid) {
    onUpdate([]);
    return () => {};
  }
  try {
    const colRef = getOutstandingColRef(userOrUid);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => !item.isDeleted);
        onUpdate(items);
      },
      (error) => {
        console.error('Firestore onSnapshot error (Outstanding):', error);
        onUpdate([]);
      }
    );
  } catch (err) {
    console.error('Error setting up onSnapshot (Outstanding):', err);
    onUpdate([]);
    return () => {};
  }
};

export const addOutstandingCollection = async (uid, data) => {
  try {
    const colRef = getOutstandingColRef(uid);
    await addDoc(colRef, {
      name: data.name || '',
      amount: Number(data.amount) || 0,
      saleDate: data.saleDate || new Date().toISOString().slice(0, 10),
      remark: data.remark || '',
      paid: false,
      paidDate: null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding outstanding collection:', error);
    throw error;
  }
};

export const updateOutstandingCollection = async (uid, itemId, updates) => {
  try {
    const docRef = getOutstandingDocRef(uid, itemId);
    const next = { ...updates };
    if (Object.prototype.hasOwnProperty.call(next, 'paid')) {
      next.paidDate = next.paid ? new Date().toISOString().slice(0, 10) : null;
    }
    if (Object.prototype.hasOwnProperty.call(next, 'amount')) {
      next.amount = Number(next.amount) || 0;
    }
    await updateDoc(docRef, next);
  } catch (error) {
    console.error('Error updating outstanding collection:', error);
    throw error;
  }
};

export const deleteOutstandingCollection = async (uid, itemId) => {
  try {
    const docRef = getOutstandingDocRef(uid, itemId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting outstanding collection:', error);
    throw error;
  }
};

export const permanentlyDeleteOutstandingCollection = async (uid, itemId) => {
  try {
    const docRef = getOutstandingDocRef(uid, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error permanently deleting outstanding collection:', error);
    throw error;
  }
};

export const getDaysWithTasks = async (userOrUid, yearMonthStr) => {
  const { uid, isAdmin } = resolvePath(userOrUid);
  if (!isAdmin && !uid) return [];
  const startId = `${yearMonthStr}-01`;
  const endId = `${yearMonthStr}-31`;
  const q = query(
    getDailyTasksColRef(uid),
    where('__name__', '>=', startId),
    where('__name__', '<=', endId)
  );

  try {
    const querySnapshot = await getDocs(q);
    const days = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.tasks && data.tasks.length > 0) {
        days.push(doc.id);
      }
    });
    return days;
  } catch (error) {
    console.error('Error fetching days with tasks:', error);
    return [];
  }
};
